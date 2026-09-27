import React from 'react';
import { ClipboardList, ExternalLink } from 'lucide-react';
import { useAsync } from '../../lib/hooks';
import { getRequest, listQuotes } from '../../services/requests';
import { formatDate, formatNumber, formatXOF } from '../../lib/format';
import {
  REQUEST_STATUS,
  REQUEST_STEPS,
  REQUEST_TYPE_LABEL,
  REQUEST_FINAL_STATUSES,
  REQUEST_CLOSED_STATUSES,
  currentStepIndex,
  statusMeta,
  type RequestType
} from '../../lib/status';
import { PageHeader, Card, CardTitle, DefinitionList } from '../../components/ui/Layout';
import { StatusBadge } from '../../components/ui/Badge';
import { Stepper } from '../../components/ui/Stepper';
import { Button } from '../../components/ui/Button';
import { EmptyState, ErrorState, InlineAlert, PageLoader } from '../../components/ui/States';
import { FileThumb } from '../../components/ui/Uploads';
import { Link } from '../../components/ui/Link';
import { QuoteCard } from '../../components/requests/QuoteCard';
import { MessageThread } from '../../components/requests/MessageThread';

export default function RequestDetailPage({ type, id }: { type: RequestType; id: string }) {
  const req = useAsync(() => getRequest(type, id), [type, id]);
  const quotes = useAsync(() => listQuotes(type, id), [type, id]);

  if (req.loading) return <PageLoader />;
  if (req.error) return <ErrorState message={req.error} onRetry={req.reload} />;
  const r = req.data;
  if (!r) return <EmptyState icon={<ClipboardList className="h-5 w-5" />} title="Demande introuvable" action={<Button to="/compte/demandes">Mes demandes</Button>} />;

  const steps = REQUEST_STEPS[type];
  const closed = REQUEST_CLOSED_STATUSES.includes(r.status);
  const step = currentStepIndex(steps, r.status, REQUEST_FINAL_STATUSES[type]);
  const meta = statusMeta(REQUEST_STATUS[type], r.status);
  const visibleQuotes = (quotes.data || []).filter(q => q.status !== 'cancelled' || (quotes.data || []).length === 1);

  function refresh() {
    req.reload();
    quotes.reload();
  }

  return (
    <div className="space-y-5">
      <PageHeader
        back={{ to: '/compte/demandes', label: 'Mes demandes' }}
        eyebrow={`${REQUEST_TYPE_LABEL[type]} · ${r.code}`}
        title={r.title}
        actions={<StatusBadge map={REQUEST_STATUS[type]} status={r.status} />}
      />

      <Card>
        <Stepper steps={steps} current={step} stopped={closed} />
        {meta.hint && !closed && <p className="mt-5 text-sm text-muted">{meta.hint}</p>}
        {closed && <InlineAlert tone="warning">Cette demande est close ({meta.label.toLowerCase()}). Vous pouvez en envoyer une nouvelle à tout moment.</InlineAlert>}
      </Card>

      {visibleQuotes.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Proposition{visibleQuotes.length > 1 ? 's' : ''}</h2>
          {visibleQuotes.map(q => (
            <QuoteCard key={q.id} quote={q} viewer="client" onChanged={refresh} />
          ))}
        </section>
      )}

      <div className="grid gap-5 xl:grid-cols-[1fr_1fr]">
        <Card>
          <CardTitle>Votre demande</CardTitle>
          {r.description && <p className="mb-4 whitespace-pre-line text-[14px] leading-relaxed text-muted">{r.description}</p>}
          <DefinitionList
            items={[
              { label: 'Quantité', value: formatNumber(r.quantity) },
              { label: 'Budget', value: r.budgetXOF ? formatXOF(r.budgetXOF) : null },
              { label: 'Catégorie', value: r.category },
              { label: 'Entreprise', value: r.company },
              ...Object.entries(r.extra).map(([label, value]) => ({ label, value: value === null ? null : String(value) })),
              { label: 'Envoyée le', value: formatDate(r.createdAt) }
            ]}
          />
          {r.notes && <p className="mt-4 rounded-xl bg-paper p-3 text-[13.5px] text-muted">{r.notes}</p>}
          {r.links.length > 0 && (
            <div className="mt-4 space-y-1.5">
              {r.links.map(l => (
                <Link key={l} to={l} className="flex items-center gap-1.5 truncate text-[13.5px] font-semibold text-ink hover:text-brand">
                  <ExternalLink className="h-3.5 w-3.5 shrink-0" /> <span className="truncate">{l}</span>
                </Link>
              ))}
            </div>
          )}
          {r.images.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {r.images.map(img => (
                <FileThumb key={img} refUrl={img} />
              ))}
            </div>
          )}
        </Card>
        <MessageThread type={type} threadId={r.id} viewer="client" />
      </div>
    </div>
  );
}
