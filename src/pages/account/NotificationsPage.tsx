import React, { useEffect } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAsync } from '../../lib/hooks';
import { listNotifications, markNotificationsRead } from '../../services/account';
import { formatDateTime } from '../../lib/format';
import { PageHeader } from '../../components/ui/Layout';
import { Button } from '../../components/ui/Button';
import { Link } from '../../components/ui/Link';
import { EmptyState, ErrorState, Skeleton } from '../../components/ui/States';

export default function NotificationsPage() {
  const { user, refreshUnread } = useApp();
  const { data, loading, error, reload, setData } = useAsync(() => listNotifications(user!.id, 100), [user?.id]);
  const unread = (data || []).filter(n => !n.isRead).length;

  async function markAll() {
    await markNotificationsRead(user!.id);
    setData((data || []).map(n => ({ ...n, isRead: true })));
    refreshUnread();
  }

  // Les notifications consultées sont marquées comme lues après quelques secondes
  useEffect(() => {
    if (!unread) return;
    const t = window.setTimeout(markAll, 4000);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unread]);

  return (
    <div>
      <PageHeader
        title="Notifications"
        description="Paiements, changements de statut, devis et messages de l’équipe."
        actions={
          unread > 0 ? (
            <Button variant="secondary" size="sm" icon={<CheckCheck className="h-4 w-4" />} onClick={markAll}>
              Tout marquer comme lu
            </Button>
          ) : undefined
        }
      />
      {error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : loading ? (
        <Skeleton className="h-64" />
      ) : !data?.length ? (
        <div className="card">
          <EmptyState icon={<Bell className="h-5 w-5" />} title="Aucune notification" description="Vous serez notifié à chaque étape de vos commandes et demandes." />
        </div>
      ) : (
        <ul className="card divide-y divide-line p-0">
          {data.map(n => {
            const inner = (
              <div className={`flex gap-3 px-4 py-4 sm:px-5 ${n.isRead ? '' : 'bg-brand-50/40'}`}>
                <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.isRead ? 'bg-transparent' : 'bg-brand'}`} aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{n.title}</p>
                  <p className="mt-0.5 text-[13.5px] text-muted">{n.message}</p>
                  <p className="mt-1 text-[12px] text-subtle">{formatDateTime(n.createdAt)}</p>
                </div>
              </div>
            );
            return <li key={n.id}>{n.link ? <Link to={n.link} className="block hover:bg-paper/60">{inner}</Link> : inner}</li>;
          })}
        </ul>
      )}
    </div>
  );
}
