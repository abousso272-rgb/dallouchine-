-- =============================================================================
-- Dallou Chine — Analyse IA jointe aux demandes de sourcing + remboursements
-- (appliquée sur le projet via MCP sous le nom daluche_ai_analysis_and_refunds)
-- =============================================================================
ALTER TABLE public.sourcing_requests ADD COLUMN IF NOT EXISTS ai_analysis jsonb;
ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS refund_reference text,
  ADD COLUMN IF NOT EXISTS refunded_at timestamptz;

-- Le client joint l'analyse IA à SA demande, juste après l'envoi (une seule fois, 2 h max).
CREATE OR REPLACE FUNCTION public.attach_sourcing_analysis(p_request_id uuid, p_analysis jsonb)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'AUTHENTICATION_REQUIRED'; END IF;
  IF p_analysis IS NULL OR jsonb_typeof(p_analysis) <> 'object' OR length(p_analysis::text) > 60000 THEN
    RAISE EXCEPTION 'INVALID_ANALYSIS';
  END IF;
  UPDATE public.sourcing_requests
     SET ai_analysis = p_analysis || jsonb_build_object('attached_at', now())
   WHERE id = p_request_id AND user_id = auth.uid() AND ai_analysis IS NULL AND created_at > now() - interval '2 hours';
  RETURN FOUND;
END; $$;
REVOKE ALL ON FUNCTION public.attach_sourcing_analysis(uuid, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.attach_sourcing_analysis(uuid, jsonb) TO authenticated;

-- Remboursement d'une commande payée (administration) : paiement, commande, participation, notification.
CREATE OR REPLACE FUNCTION public.admin_mark_order_refunded(p_order_id uuid, p_reference text, p_note text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  o public.orders%ROWTYPE;
  v_ref text := NULLIF(trim(coalesce(p_reference, '')), '');
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'PERMISSION_DENIED' USING ERRCODE = '42501'; END IF;
  IF v_ref IS NULL THEN RAISE EXCEPTION 'REFERENCE_REQUIRED: indiquez la référence du remboursement'; END IF;
  SELECT * INTO o FROM public.orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'NOT_FOUND'; END IF;
  IF o.payment_status <> 'paid' THEN RAISE EXCEPTION 'NOT_REFUNDABLE: seule une commande payée peut être remboursée'; END IF;
  UPDATE public.payments SET status = 'refunded', refund_reference = v_ref, refunded_at = now(), updated_at = now()
   WHERE order_id = o.id AND status = 'paid';
  UPDATE public.orders SET payment_status = 'refunded', order_status = 'cancelled', updated_at = now() WHERE id = o.id;
  UPDATE public.groupage_participants
     SET status = 'refunded', refund_status = 'done', refund_reference = v_ref, refunded_at = now()
   WHERE order_id = o.id AND status IN ('paid', 'cancelled');
  INSERT INTO public.order_status_history (order_id, old_status, new_status, location, description, actor_id)
  VALUES (o.id, o.order_status, 'cancelled', 'DALLOU CHINE', 'Commande remboursée (réf. ' || v_ref || ')' || coalesce(' — ' || NULLIF(trim(p_note), ''), ''), auth.uid());
  PERFORM public.daluche_notify(o.user_id, 'payment', 'Remboursement effectué',
    'Votre commande ' || o.tracking_code || ' a été remboursée (' || to_char(o.total_xof, 'FM999G999G999') || ' FCFA, réf. ' || v_ref || ').',
    '/compte/commandes/' || o.id);
  RETURN jsonb_build_object('success', true);
END; $$;
REVOKE ALL ON FUNCTION public.admin_mark_order_refunded(uuid, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_mark_order_refunded(uuid, text, text) TO authenticated;
