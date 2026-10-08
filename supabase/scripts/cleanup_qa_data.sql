-- =============================================================================
-- DALUCHE — Nettoyage des données de test (comptes QA *@daluche-qa.test)
-- =============================================================================
-- À exécuter UNE FOIS dans Supabase > SQL Editor, par le propriétaire du projet.
-- Tout est dans une transaction : en cas d'erreur, rien n'est supprimé.
-- Ne touche à aucune table « duka_* » ni « stores » (autre application).
--
-- 1) Lancez d'abord la section APERÇU seule pour voir ce qui sera supprimé.
-- 2) Puis lancez le bloc BEGIN … COMMIT.
-- =============================================================================

-- ---------------------------------------------------------------- APERÇU ----
select 'comptes QA' as element, count(*) from auth.users where email ilike '%@daluche-qa.test'
union all
select 'commandes QA', count(*) from public.orders where user_id in (select id from auth.users where email ilike '%@daluche-qa.test')
union all
select 'demandes sourcing QA', count(*) from public.sourcing_requests where user_id in (select id from auth.users where email ilike '%@daluche-qa.test')
union all
select 'demandes B2B QA', count(*) from public.b2b_requests where user_id in (select id from auth.users where email ilike '%@daluche-qa.test')
union all
select 'demandes auto QA', count(*) from public.vehicle_requests where user_id in (select id from auth.users where email ilike '%@daluche-qa.test')
union all
select 'produits QA', count(*) from public.products where name ilike 'QA %'
union all
select 'véhicules QA', count(*) from public.vehicles where title ilike 'QA-%' or brand ilike 'QA-%'
union all
select 'groupages QA', count(*) from public.groupages where title ilike 'QA %';

-- ------------------------------------------------------------ SUPPRESSION ---
begin;

create temp table qa_users on commit drop as
  select id from auth.users where email ilike '%@daluche-qa.test';

create temp table qa_orders on commit drop as
  select id from public.orders where user_id in (select id from qa_users);

create temp table qa_quotes on commit drop as
  select q.id from public.quotes q
  where q.sourcing_request_id in (select id from public.sourcing_requests where user_id in (select id from qa_users))
     or q.b2b_request_id in (select id from public.b2b_requests where user_id in (select id from qa_users))
     or q.vehicle_request_id in (select id from public.vehicle_requests where user_id in (select id from qa_users));

-- Paiements et commandes des comptes QA
delete from public.payment_attempts where order_id in (select id from qa_orders);
delete from public.payments where order_id in (select id from qa_orders);
delete from public.groupage_participants where user_id in (select id from qa_users) or order_id in (select id from qa_orders);
delete from public.order_costs where order_id in (select id from qa_orders);
delete from public.order_items where order_id in (select id from qa_orders);
delete from public.order_status_history where order_id in (select id from qa_orders);
delete from public.orders where id in (select id from qa_orders);

-- Demandes, devis, recherches et messages
create temp table qa_requests on commit drop as
  select id from public.sourcing_requests where user_id in (select id from qa_users)
  union all select id from public.b2b_requests where user_id in (select id from qa_users)
  union all select id from public.vehicle_requests where user_id in (select id from qa_users)
  union all select id from qa_orders;

delete from public.messages where sender_id in (select id from qa_users) or thread_id in (select id from qa_requests);
delete from public.request_findings where request_id in (select id from qa_requests) or supplier_name ilike 'QA %';
delete from public.quote_items where quote_id in (select id from qa_quotes);
delete from public.quotes where id in (select id from qa_quotes);
delete from public.sourcing_requests where user_id in (select id from qa_users);
delete from public.b2b_requests where user_id in (select id from qa_users);
delete from public.vehicle_requests where user_id in (select id from qa_users);

-- Contenus créés pendant les tests
delete from public.product_costs where product_id in (select id from public.products where name ilike 'QA %');
delete from public.products where name ilike 'QA %';
delete from public.vehicles where title ilike 'QA-%' or brand ilike 'QA-%';
delete from public.groupages where title ilike 'QA %' and not exists (
  select 1 from public.groupage_participants gp where gp.groupage_id = groupages.id
);
delete from public.team_invitations where email ilike '%@daluche-qa.test';

-- Données personnelles des comptes QA puis les comptes eux-mêmes
delete from public.notifications where user_id in (select id from qa_users);
delete from public.cart_items where user_id in (select id from qa_users);
delete from public.profiles where id in (select id from qa_users);
delete from auth.users where id in (select id from qa_users);

commit;

-- -----------------------------------------------------------------------------
-- Anciennes commandes de test (avant DALUCHE) : à vérifier À LA MAIN.
-- Elles gonflent le chiffre d'affaires du tableau de bord. Listez-les d'abord :
--
--   select o.tracking_code, o.total_xof, o.payment_status, o.order_status, o.created_at, p.email
--   from public.orders o left join public.profiles p on p.id = o.user_id
--   order by o.created_at;
--
-- Puis annulez celles qui sont des tests (elles sortent alors des statistiques
-- sans perdre l'historique) :
--
--   update public.orders set order_status = 'cancelled'
--   where tracking_code in ('AWP-…', 'AWP-…');
-- -----------------------------------------------------------------------------
