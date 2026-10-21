import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, ClipboardPaste, Download, ExternalLink, FileSpreadsheet, Plus, Save, Search, Sparkles, Trash2, Upload, Wand2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAsync } from '../../lib/hooks';
import { friendlyError } from '../../lib/db';
import { getFinanceContext } from '../../services/finance';
import { downloadTemplate, exportRows, loadCostSheet, readFileToRows, saveCostSheet, type SaveResult } from '../../services/costSheet';
import {
  COLUMNS,
  computeRow,
  emptyRow,
  makeSheetContext,
  normalizeMode,
  parseDelimited,
  parseNumber,
  prepareRows,
  rowsFromMatrix,
  type ColumnKey,
  type Level,
  type RowEconomics,
  type SheetContext,
  type SheetRow
} from '../../lib/costSheet';
import { formatXOF } from '../../lib/format';
import { PageHeader, Card } from '../../components/ui/Layout';
import { Button } from '../../components/ui/Button';
import { Link } from '../../components/ui/Link';
import { ErrorState, InlineAlert, Skeleton } from '../../components/ui/States';
import { ExchangeRateDialog } from '../../components/pro/ExchangeRateDialog';

/** Colonnes secondaires, masquées par défaut (toujours importées et enregistrées). */
const ADVANCED = new Set<ColumnKey>(['sku', 'supplier', 'supplierUrl', 'listCny', 'delay', 'stock', 'notes']);

const MODE_OPTIONS = [
  { value: '', label: 'Avion (défaut)' },
  { value: 'Avion', label: 'Avion' },
  { value: 'Bateau', label: 'Bateau' },
  { value: 'Express', label: 'Express' }
];

const LEVEL_STYLE: Record<Level, { chip: string; label: string }> = {
  ok: { chip: 'bg-jade-50 text-jade', label: 'Bonne marge' },
  low: { chip: 'bg-amber-50 text-amber-800', label: 'Marge faible' },
  loss: { chip: 'bg-red-50 text-red-700', label: 'À perte' },
  incomplete: { chip: 'bg-paper-2 text-muted', label: 'À compléter' }
};

export default function CostSheetPage() {
  const { user, categories, toast } = useApp();
  const canSetFx = user?.role === 'admin' || user?.role === 'transitaire';
  const ctxQ = useAsync(() => getFinanceContext(), [], { cacheKey: 'finance:context', maxAge: 30000 });
  const sheetQ = useAsync(() => loadCostSheet(), []);

  const [rows, setRows] = useState<SheetRow[]>([]);
  const [loadedOnce, setLoadedOnce] = useState(false);
  const [query, setQuery] = useState('');
  const [saving, setSaving] = useState(false);
  const [results, setResults] = useState<Record<string, SaveResult>>({});
  const [problems, setProblems] = useState<Record<string, string>>({});
  const [fxOpen, setFxOpen] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (sheetQ.data && !loadedOnce) {
      setRows(sheetQ.data.rows.length ? sheetQ.data.rows : [emptyRow()]);
      setLoadedOnce(true);
    }
  }, [sheetQ.data, loadedOnce]);

  const ctx: SheetContext | null = useMemo(() => (ctxQ.data ? makeSheetContext(ctxQ.data) : null), [ctxQ.data]);
  const categoryNames = useMemo(() => categories.filter(c => c.isActive && !c.parentId).map(c => c.name), [categories]);
  const categoryIds = useMemo(() => new Map(categories.filter(c => c.isActive).map(c => [c.name, c.id])), [categories]);

  const cols = useMemo(() => (showAdvanced ? COLUMNS : COLUMNS.filter(c => !ADVANCED.has(c.key))), [showAdvanced]);
  const dirtyCount = rows.filter(r => r.dirty).length;
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? rows.filter(r => `${r.values.name} ${r.values.sku} ${r.values.supplier}`.toLowerCase().includes(q)) : rows;
  }, [rows, query]);

  // Avertit avant de quitter avec des modifications non enregistrées
  useEffect(() => {
    if (!dirtyCount) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirtyCount]);

  const setCell = useCallback((rid: string, key: ColumnKey, value: string) => {
    setRows(prev => prev.map(r => (r.rid === rid ? { ...r, dirty: true, values: { ...r.values, [key]: value } } : r)));
    setProblems(p => (p[rid] ? { ...p, [rid]: '' } : p));
  }, []);

  const removeRow = useCallback((rid: string) => setRows(prev => (prev.length > 1 ? prev.filter(r => r.rid !== rid) : [emptyRow()])), []);

  /** Ajoute des lignes (import, collage) : une ligne de même référence ou de même nom est mise à jour. */
  const mergeRows = useCallback((incoming: SheetRow[]) => {
    let added = 0;
    let updated = 0;
    setRows(prev => {
      const next = [...prev.filter(r => Object.values(r.values).some(v => v.trim()) || r.productId)];
      for (const inc of incoming) {
        const sku = inc.values.sku.trim().toLowerCase();
        const name = inc.values.name.trim().toLowerCase();
        const at = next.findIndex(r => (sku && r.values.sku.trim().toLowerCase() === sku) || (!sku && r.values.name.trim().toLowerCase() === name));
        if (at >= 0) {
          const merged = { ...next[at].values };
          for (const c of COLUMNS) if (inc.values[c.key].trim()) merged[c.key] = inc.values[c.key];
          next[at] = { ...next[at], values: merged, dirty: true };
          updated++;
        } else {
          next.push(inc);
          added++;
        }
      }
      return next.length ? next : [emptyRow()];
    });
    return { added, updated };
  }, []);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const res = await readFileToRows(file);
      if (!res.rows.length) return toast('error', 'Aucune ligne trouvée', 'Vérifiez que la première colonne contient le nom des produits.');
      const { added, updated } = mergeRows(res.rows);
      const notes = [
        `${added} ajoutée(s)`,
        updated ? `${updated} mise(s) à jour` : '',
        res.ignored.length ? `colonnes ignorées : ${res.ignored.slice(0, 3).join(', ')}` : '',
        res.missing.length ? `à compléter : ${res.missing.join(', ')}` : ''
      ].filter(Boolean);
      toast('success', 'Fichier importé', `${notes.join(' · ')}. Vérifiez puis enregistrez.`);
    } catch (err) {
      toast('error', 'Import impossible', friendlyError(err));
    }
  }

  /** Collage depuis Excel dans une cellule : tableau entier (avec ou sans en-têtes) ou bloc de cellules. */
  const onPasteCells = useCallback(
    (e: React.ClipboardEvent, rid: string, colIdx: number) => {
      const text = e.clipboardData.getData('text');
      if (!/[\t\n]/.test(text)) return;
      e.preventDefault();
      const grid = parseDelimited(text).filter(r => r.some(c => c.trim()));
      if (!grid.length) return;
      const asTable = rowsFromMatrix(grid);
      if (asTable.hadHeader) {
        const { added, updated } = mergeRows(asTable.rows);
        toast('success', 'Tableau collé', `${added} ligne(s) ajoutée(s)${updated ? `, ${updated} mise(s) à jour` : ''}.`);
        return;
      }
      // Bloc de cellules : rempli à partir de la cellule active, en ajoutant des lignes si besoin
      setRows(prev => {
        const next = [...prev];
        const start = Math.max(0, next.findIndex(r => r.rid === rid));
        grid.forEach((cells, i) => {
          if (!next[start + i]) next.push(emptyRow());
          const row = next[start + i];
          const values = { ...row.values };
          cells.forEach((v, j) => {
            const col = cols[colIdx + j];
            if (col) values[col.key] = v.trim();
          });
          next[start + i] = { ...row, values, dirty: true };
        });
        return next;
      });
    },
    [mergeRows, toast, cols]
  );

  function applySuggested(rid: string, price: number) {
    setCell(rid, 'priceXof', String(price));
  }

  function applyAllSuggested() {
    if (!ctx) return;
    let n = 0;
    setRows(prev =>
      prev.map(r => {
        const e = computeRow(r, ctx);
        if (e.suggestedPriceXOF && !(parseNumber(r.values.priceXof) ?? 0)) {
          n++;
          return { ...r, dirty: true, values: { ...r.values, priceXof: String(e.suggestedPriceXOF) } };
        }
        return r;
      })
    );
    window.setTimeout(() => toast('success', n ? `${n} prix conseillé(s) appliqué(s)` : 'Aucune ligne sans prix', n ? 'Ajustez-les si besoin avant d’enregistrer.' : undefined), 0);
  }

  async function save() {
    if (!ctx) return;
    const targets = rows.filter(r => r.dirty && Object.values(r.values).some(v => v.trim()));
    if (!targets.length) return toast('success', 'Rien à enregistrer');
    const { ready, problems: probs } = prepareRows(targets, ctx, categoryNames);
    setProblems(Object.fromEntries(probs.map(p => [p.rid, p.message])));
    if (!ready.length) return toast('error', 'Aucune ligne enregistrable', 'Corrigez les lignes en rouge.');
    setSaving(true);
    try {
      const res = await saveCostSheet(ready, categoryIds);
      setResults(Object.fromEntries(res.map(r => [r.rid, r])));
      const ok = new Map(res.filter(r => r.status !== 'error').map(r => [r.rid, r]));
      setRows(prev => prev.map(r => (ok.has(r.rid) ? { ...r, dirty: false, productId: ok.get(r.rid)!.productId || r.productId } : r)));
      const bad = res.filter(r => r.status === 'error');
      setProblems(p => ({ ...p, ...Object.fromEntries(bad.map(r => [r.rid, r.message || 'Erreur'])) }));
      const created = res.filter(r => r.status === 'created').length;
      const updated = res.filter(r => r.status === 'updated').length;
      toast(bad.length ? 'error' : 'success', bad.length ? `${bad.length} ligne(s) refusée(s)` : 'Tableau enregistré', `${created} créé(s), ${updated} mis à jour${probs.length ? `, ${probs.length} à corriger` : ''}.`);
    } catch (err) {
      toast('error', 'Enregistrement impossible', friendlyError(err));
    } finally {
      setSaving(false);
    }
  }

  if ((sheetQ.loading && !sheetQ.data) || (ctxQ.loading && !ctxQ.data)) return <Skeleton className="h-[480px] w-full" />;
  if (sheetQ.error) {
    return (
      <ErrorState
        message={/permission|42501/i.test(sheetQ.error) ? 'Votre profil n’a pas encore le droit de gérer des produits. Demandez à l’administrateur d’activer « Gérer ses produits » sur votre compte.' : sheetQ.error}
        onRetry={sheetQ.reload}
      />
    );
  }
  if (ctxQ.error || !ctxQ.data || !ctx) return <ErrorState message={ctxQ.error || 'Tarifs indisponibles.'} onRetry={ctxQ.reload} />;

  const problemList = Object.entries(problems).filter(([, m]) => m);
  const savedOk = Object.values(results).filter(r => r.status !== 'error');

  return (
    <>
      <PageHeader
        eyebrow="Produits"
        title="Tableur produits"
        description="Une ligne par produit : prix négocié, poids, cargo, prix de vente. Le coût livré et la marge se calculent tout seuls."
        actions={
          <>
            <Button variant="secondary" icon={<Download className="h-4 w-4" />} onClick={() => downloadTemplate(categoryNames).catch(err => toast('error', 'Téléchargement impossible', friendlyError(err)))}>
              Modèle Excel
            </Button>
            <Button variant="secondary" icon={<Upload className="h-4 w-4" />} onClick={() => fileRef.current?.click()}>
              Importer
            </Button>
            <Button variant="secondary" icon={<FileSpreadsheet className="h-4 w-4" />} onClick={() => exportRows(rows.filter(r => r.values.name.trim())).catch(err => toast('error', 'Export impossible', friendlyError(err)))}>
              Exporter
            </Button>
            <input ref={fileRef} type="file" accept=".xlsx,.xlsm,.csv,.txt,.tsv,text/csv" className="sr-only" onChange={onFile} aria-label="Importer un fichier Excel ou CSV" />
          </>
        }
      />

      <div className="mb-4 grid gap-3 lg:grid-cols-[1fr_auto]">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-2xl border border-line bg-white px-4 py-3 text-[13.5px]">
          <span>
            Taux : <strong className="num">1 ¥ = {ctx.fx.toLocaleString('fr-FR')} FCFA</strong>
          </span>
          <span className="text-muted">
            Marge visée <strong className="num text-ink">{ctx.targetMarginPct} %</strong> · minimum <strong className="num text-ink">{ctx.minMarginPct} %</strong>
          </span>
          {canSetFx && (
            <button type="button" onClick={() => setFxOpen(true)} className="font-semibold text-brand-700 hover:underline">
              Modifier le taux
            </button>
          )}
          <button type="button" onClick={() => setShowAdvanced(v => !v)} aria-pressed={showAdvanced} className="font-semibold text-muted hover:text-ink">
            {showAdvanced ? 'Moins de colonnes' : 'Plus de colonnes (référence, fournisseur, délai…)'}
          </button>
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Chercher un produit, une référence…"
            aria-label="Chercher dans le tableau"
            className="h-12 w-full rounded-2xl border border-line bg-white pl-10 pr-3 text-[14px] focus:border-brand/50 focus:outline-none lg:w-72"
          />
        </div>
      </div>

      {rows.length <= 1 && !rows[0]?.values.name && (
        <Card className="mb-4">
          <p className="mb-3 text-[15px] font-bold">Trois façons d’ajouter vos produits</p>
          <div className="grid gap-3 text-[13.5px] sm:grid-cols-3">
            <div className="rounded-2xl bg-paper p-4">
              <Plus className="mb-2 h-5 w-5 text-brand" />
              <p className="font-semibold">Remplir le tableau</p>
              <p className="mt-0.5 text-muted">Tapez directement dans les cases ci-dessous, comme sur Excel.</p>
            </div>
            <div className="rounded-2xl bg-paper p-4">
              <ClipboardPaste className="mb-2 h-5 w-5 text-brand" />
              <p className="font-semibold">Copier-coller depuis Excel</p>
              <p className="mt-0.5 text-muted">Copiez vos cellules (avec ou sans titres) et collez-les dans une case.</p>
            </div>
            <div className="rounded-2xl bg-paper p-4">
              <Upload className="mb-2 h-5 w-5 text-brand" />
              <p className="font-semibold">Importer un fichier</p>
              <p className="mt-0.5 text-muted">
                Excel ou CSV. Pas de fichier ? Téléchargez le <button type="button" className="font-semibold text-brand-700 hover:underline" onClick={() => downloadTemplate(categoryNames)}>modèle</button>.
              </p>
            </div>
          </div>
        </Card>
      )}

      {problemList.length > 0 && (
        <div className="mb-4">
          <InlineAlert tone="danger" title={`${problemList.length} ligne(s) à corriger avant l’enregistrement`}>
            <ul className="mt-1 list-disc space-y-0.5 pl-5">
              {problemList.slice(0, 6).map(([rid, m]) => (
                <li key={rid}>{m}</li>
              ))}
            </ul>
          </InlineAlert>
        </div>
      )}
      {savedOk.some(r => r.status === 'created') && (
        <div className="mb-4">
          <InlineAlert tone="success" title="Produits créés en brouillon">
            Ils ne sont pas encore visibles par les clients. Ouvrez chaque fiche (icône <ExternalLink className="inline h-3.5 w-3.5" />) pour ajouter photos et description, puis publiez-la depuis{' '}
            <Link to="/espace-pro/produits" className="font-semibold underline">
              la liste des produits
            </Link>
            .
          </InlineAlert>
        </div>
      )}

      <div className="overflow-hidden rounded-[var(--radius-card)] border border-line bg-white shadow-[var(--shadow-soft)]">
        <div className="max-h-[68vh] overflow-auto">
          <table className="w-max min-w-full border-separate border-spacing-0 text-[13px]">
            <thead>
              <tr>
                <th className="sticky left-0 top-0 z-30 w-[34px] border-b border-r border-line bg-paper-2 px-1" aria-label="Actions" />
                {cols.map((c, i) => (
                  <th
                    key={c.key}
                    title={c.hint}
                    style={{ minWidth: c.width }}
                    className={`sticky top-0 border-b border-line bg-paper-2 px-2 py-2.5 text-left text-[11.5px] font-bold uppercase tracking-wide text-muted ${i === 0 ? 'left-[34px] z-30 border-r' : 'z-20'}`}
                  >
                    {c.label}
                  </th>
                ))}
                <th className="sticky right-0 top-0 z-30 min-w-[230px] border-b border-l border-line bg-brand-50 px-3 py-2.5 text-left text-[11.5px] font-bold uppercase tracking-wide text-brand-700" title="Coût livré par unité, marge et prix conseillé">
                  Résultat
                </th>
              </tr>
            </thead>
            <tbody>
              {visible.map((r, ri) => (
                <SheetRowView key={r.rid} row={r} rowIndex={ri} cols={cols} ctx={ctx} categoryNames={categoryNames} problem={problems[r.rid]} result={results[r.rid]} onChange={setCell} onRemove={removeRow} onSuggest={applySuggested} onPaste={onPasteCells} />
              ))}
              {visible.length === 0 && (
                <tr>
                  <td colSpan={cols.length + 2} className="px-4 py-10 text-center text-sm text-muted">
                    Aucun produit ne correspond à « {query} ».
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line bg-paper/60 px-4 py-3">
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" icon={<Plus className="h-4 w-4" />} onClick={() => setRows(prev => [...prev, emptyRow()])}>
              Ajouter une ligne
            </Button>
            <Button variant="secondary" size="sm" icon={<Wand2 className="h-4 w-4" />} onClick={applyAllSuggested}>
              Prix conseillé pour les lignes sans prix
            </Button>
          </div>
          <p className="text-[12.5px] text-muted">{rows.filter(r => r.values.name.trim()).length} produit(s)</p>
        </div>
      </div>

      <div className="safe-bottom sticky bottom-3 z-30 mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-white/95 px-4 py-3 shadow-[var(--shadow-lift)] backdrop-blur">
        <p className="text-[13.5px]">
          {dirtyCount > 0 ? (
            <>
              <strong>{dirtyCount}</strong> ligne(s) modifiée(s), pas encore enregistrée(s).
            </>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-muted">
              <CheckCircle2 className="h-4 w-4 text-jade" /> Tout est enregistré.
            </span>
          )}
        </p>
        <Button onClick={save} loading={saving} disabled={dirtyCount === 0} icon={<Save className="h-4 w-4" />}>
          Enregistrer le tableau
        </Button>
      </div>

      <ExchangeRateDialog open={fxOpen} onClose={() => setFxOpen(false)} context={ctxQ.data} onSaved={ctxQ.reload} />
    </>
  );
}

// ---------------------------------------------------------------------------

const SheetRowView = memo(function SheetRowView({
  row,
  rowIndex,
  cols,
  ctx,
  categoryNames,
  problem,
  result,
  onChange,
  onRemove,
  onSuggest,
  onPaste
}: {
  row: SheetRow;
  rowIndex: number;
  cols: typeof COLUMNS;
  ctx: SheetContext;
  categoryNames: string[];
  problem?: string;
  result?: SaveResult;
  onChange: (rid: string, key: ColumnKey, value: string) => void;
  onRemove: (rid: string) => void;
  onSuggest: (rid: string, price: number) => void;
  onPaste: (e: React.ClipboardEvent, rid: string, colIdx: number) => void;
}) {
  const e: RowEconomics = useMemo(() => computeRow(row, ctx), [row, ctx]);
  const bad = Boolean(problem);
  const bg = bad ? 'bg-red-50' : row.dirty ? 'bg-amber-50' : 'bg-white';
  const style = LEVEL_STYLE[e.level];

  // Entrée = cellule du dessous, comme dans Excel
  function onKeyDown(ev: React.KeyboardEvent<HTMLInputElement | HTMLSelectElement>, colIdx: number) {
    if (ev.key !== 'Enter') return;
    ev.preventDefault();
    const next = document.querySelector<HTMLElement>(`[data-cell="${rowIndex + 1}-${colIdx}"]`);
    next?.focus();
  }

  return (
    <>
      <tr className={bg}>
        <td className={`sticky left-0 z-10 border-b border-r border-line px-1 text-center ${bg}`}>
          {row.productId ? (
            <Link to={`/espace-pro/produits/${row.productId}`} className="inline-flex rounded-lg p-1.5 text-subtle hover:bg-paper-2 hover:text-ink" aria-label="Ouvrir la fiche produit" title="Ouvrir la fiche (photos, description, publication)">
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          ) : (
            <button type="button" onClick={() => onRemove(row.rid)} className="rounded-lg p-1.5 text-subtle hover:bg-red-50 hover:text-red-700" aria-label="Retirer la ligne" title="Retirer la ligne">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </td>
        {cols.map((c, ci) => {
          const common = {
            'data-cell': `${rowIndex}-${ci}`,
            'aria-label': `${c.label}, ligne ${rowIndex + 1}`,
            onPaste: (ev: React.ClipboardEvent) => onPaste(ev, row.rid, ci),
            onKeyDown: (ev: React.KeyboardEvent<HTMLInputElement | HTMLSelectElement>) => onKeyDown(ev, ci),
            className: 'h-10 w-full bg-transparent px-2 outline-none focus:bg-brand-50/70 focus:ring-2 focus:ring-inset focus:ring-brand/40'
          };
          return (
            <td key={c.key} className={`border-b border-line p-0 ${ci === 0 ? `sticky left-[34px] z-10 border-r ${bg}` : ''}`} style={{ minWidth: c.width }}>
              {c.kind === 'category' ? (
                <select {...common} value={row.values.category} onChange={ev => onChange(row.rid, c.key, ev.target.value)}>
                  <option value="">Choisir…</option>
                  {categoryNames.map(n => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                  {row.values.category && !categoryNames.includes(row.values.category) && <option value={row.values.category}>{row.values.category} (inconnue)</option>}
                </select>
              ) : c.kind === 'mode' ? (
                <select {...common} value={normalizeMode(row.values.mode) ? MODE_OPTIONS.find(o => normalizeMode(o.value) === normalizeMode(row.values.mode))?.value || '' : ''} onChange={ev => onChange(row.rid, c.key, ev.target.value)}>
                  {MODE_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  {...common}
                  value={row.values[c.key]}
                  onChange={ev => onChange(row.rid, c.key, ev.target.value)}
                  inputMode={c.kind === 'number' ? 'decimal' : undefined}
                  className={`${common.className} ${c.kind === 'number' ? 'num text-right' : ''} ${c.key === 'name' ? 'font-semibold' : ''}`}
                />
              )}
            </td>
          );
        })}
        <td className={`sticky right-0 z-10 min-w-[230px] border-b border-l border-line px-3 py-1.5 ${bad ? 'bg-red-50' : row.dirty ? 'bg-amber-50' : 'bg-white'}`}>
          <div className="flex items-start justify-between gap-2">
            <span className={`inline-flex flex-col rounded-lg px-2 py-1 ${style.chip}`} title={e.messages.join(' ')}>
              <span className="text-[11.5px] font-bold">{style.label}</span>
              {e.marginPct !== null && (
                <span className="num text-[12px]">
                  {e.marginPct} % · {formatXOF(e.marginXOF)}
                </span>
              )}
            </span>
            {e.landedUnitXOF !== null && (
              <span className="num text-right text-[12px] leading-tight" title={e.cargoIsEstimate ? 'Cargo estimé avec la grille de fret' : 'Cargo saisi'}>
                <span className="block text-muted">coût livré</span>
                <span className="block font-semibold">{formatXOF(e.landedUnitXOF)}</span>
                <span className="block text-[11px] text-muted">
                  cargo {formatXOF(e.cargoUnitXOF)}
                  {e.cargoIsEstimate ? ' est.' : ''}
                </span>
              </span>
            )}
          </div>
          {e.suggestedPriceXOF !== null ? (
            <button type="button" onClick={() => onSuggest(row.rid, e.suggestedPriceXOF!)} className="num mt-1 inline-flex items-center gap-1.5 rounded-lg bg-brand-50 px-2 py-1 text-[12px] font-semibold text-brand-700 hover:bg-brand-100" title="Appliquer ce prix de vente">
              <Sparkles className="h-3.5 w-3.5" /> Conseillé {formatXOF(e.suggestedPriceXOF)}
            </button>
          ) : (
            <span className="mt-1 block text-[11.5px] text-muted">{e.messages[0] || ''}</span>
          )}
          {e.negotiationGainPct !== null && e.negotiationGainPct > 0 && <span className="num mt-0.5 block text-[11px] text-jade">négocié −{e.negotiationGainPct} %</span>}
        </td>
      </tr>
      {(bad || (result && result.message && result.status !== 'error')) && (
        <tr className={bad ? 'bg-red-50/60' : 'bg-jade-50/50'}>
          <td colSpan={cols.length + 2} className={`border-b border-line px-4 py-1.5 text-[12.5px] ${bad ? 'text-red-700' : 'text-jade'}`}>
            <span className="inline-flex items-center gap-1.5">
              {bad ? <AlertTriangle className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />} {problem || result?.message}
            </span>
          </td>
        </tr>
      )}
    </>
  );
});
