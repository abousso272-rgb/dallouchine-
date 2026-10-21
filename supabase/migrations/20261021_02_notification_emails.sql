-- =============================================================================
-- EMAILS DE NOTIFICATION : suivi d'envoi sur la table notifications
-- Le serveur (/api/cron/notifications) envoie par email les notifications non encore envoyées.
-- =============================================================================
ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS emailed_at timestamptz,
  ADD COLUMN IF NOT EXISTS email_attempts integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS email_error text;

-- Les notifications déjà existantes ne sont pas renvoyées par email (évite un envoi massif au démarrage).
UPDATE public.notifications SET emailed_at = now(), email_error = 'historique' WHERE emailed_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_notifications_not_emailed ON public.notifications (created_at) WHERE emailed_at IS NULL;
