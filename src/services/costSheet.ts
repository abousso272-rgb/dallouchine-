import { supabase } from '../lib/db';
import { AppError, friendlyError } from '../lib/db';
import { COLUMNS, emptyRow, parseDelimited, parseNumber, rowsFromMatrix, type MatrixResult, type PreparedRow, type SheetRow } from '../lib/costSheet';

// ---------------------------------------------------------------------------
// Lecture : produits et coûts déjà enregistrés
// ---------------------------------------------------------------------------

interface SheetRecord {
  product_id: string;
  name: string;
  sku: string | null;
  slug: string;
  category: string | null;
  price_xof: number | null;
  moq: number | null;
  weight_kg: number | null;
  cbm: number | null;
  transport_mode: string | null;
  delivery_days: string | null;
  stock: number | null;
  is_active: boolean;
  supplier_name: string | null;
  supplier_url: string | null;
  list_price_cny: number | null;
  purchase_price_cny: number | null;
  logistics_cost_xof: number | null;
  cargo_unit_xof: number | null;
  notes: string | null;
}

const s = (v: unknown) => (v === null || v === undefined ? '' : String(v));
const n = (v: unknown) => (v === null || v === undefined || Number(v) === 0 ? '' : String(Number(v)));

function toRow(r: SheetRecord): SheetRow {
  return emptyRow(
    {
      name: r.name,
      sku: s(r.sku),
      category: s(r.category),
      supplier: s(r.supplier_name),
      supplierUrl: s(r.supplier_url),
      listCny: n(r.list_price_cny),
      buyCny: n(r.purchase_price_cny),
      moq: n(r.moq),
      weightKg: n(r.weight_kg),
      cbm: n(r.cbm),
      mode: r.transport_mode === 'sea' ? 'Bateau' : r.transport_mode === 'express' ? 'Express' : r.transport_mode === 'air' ? 'Avion' : '',
      cargoXof: n(r.cargo_unit_xof),
      priceXof: n(r.price_xof),
      delay: s(r.delivery_days),
      stock: n(r.stock),
      notes: s(r.notes)
    },
    r.product_id,
    false
  );
}

/** La fonction SQL n'est pas (encore) installée sur la base. */
function isMissingFunction(err: { code?: string; message?: string } | null | undefined): boolean {
  return Boolean(err && (err.code === 'PGRST202' || err.code === '42883' || /could not find the function|schema cache/i.test(err.message || '')));
}

export async function loadCostSheet(): Promise<{ rows: SheetRow[]; limited: boolean }> {
  const rpc = await supabase.rpc('staff_cost_sheet');
  if (!rpc.error) return { rows: ((rpc.data || []) as SheetRecord[]).map(toRow), limited: false };
  if (!isMissingFunction(rpc.error)) throw new AppError(friendlyError(rpc.error), rpc.error.code);

  // Repli : lecture directe (admin et transitaire seulement, selon les droits de la base)
  const full = await supabase
    .from('products')
    .select('id, name, sku, slug, price_xof, moq, weight_kg, cbm, default_transport_mode, estimated_delivery_days, stock_quantity, is_active, categories(name), product_costs(*)')
    .order('name')
    .limit(1000);
  if (full.error) throw new AppError(friendlyError(full.error), full.error.code);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = (full.data || []).map((p: any) => {
    const c = Array.isArray(p.product_costs) ? p.product_costs[0] : p.product_costs;
    const cat = Array.isArray(p.categories) ? p.categories[0] : p.categories;
    return toRow({
      product_id: p.id,
      name: p.name,
      sku: p.sku,
      slug: p.slug,
      category: cat?.name ?? null,
      price_xof: p.price_xof,
      moq: p.moq,
      weight_kg: p.weight_kg,
      cbm: p.cbm,
      transport_mode: p.default_transport_mode,
      delivery_days: p.estimated_delivery_days,
      stock: p.stock_quantity,
      is_active: p.is_active,
      supplier_name: c?.supplier_name ?? null,
      supplier_url: c?.supplier_url ?? null,
      list_price_cny: c?.list_price_cny ?? null,
      purchase_price_cny: c?.purchase_price_cny ?? null,
      logistics_cost_xof: c?.logistics_cost_xof ?? null,
      cargo_unit_xof: c?.cargo_unit_xof ?? null,
      notes: c?.notes ?? null
    });
  });
  return { rows, limited: true };
}

// ---------------------------------------------------------------------------
// Enregistrement
// ---------------------------------------------------------------------------

export interface SaveResult {
  rid: string;
  status: 'created' | 'updated' | 'error';
  productId: string | null;
  message: string | null;
}

/** Enregistre les lignes préparées. Chaque ligne réussit ou échoue séparément. */
export async function saveCostSheet(rows: PreparedRow[], categoryIds: Map<string, string>): Promise<SaveResult[]> {
  const rpc = await supabase.rpc('staff_import_products', { p_rows: rows.map(r => ({ ...r, product_id: r.productId })) });
  if (!rpc.error) {
    const results = ((rpc.data as { results?: { rid: string; status: SaveResult['status']; product_id: string | null; message: string | null }[] })?.results || []).map(r => ({
      rid: r.rid,
      status: r.status,
      productId: r.product_id,
      message: r.message
    }));
    return results;
  }
  if (!isMissingFunction(rpc.error)) throw new AppError(friendlyError(rpc.error), rpc.error.code);
  return saveDirect(rows, categoryIds);
}

/** Repli sans fonction SQL : mêmes règles, via les droits d'écriture de la base (transitaire et admin). */
async function saveDirect(rows: PreparedRow[], categoryIds: Map<string, string>): Promise<SaveResult[]> {
  const out: SaveResult[] = [];
  for (const r of rows) {
    try {
      const categoryId = categoryIds.get(r.category);
      if (!categoryId) throw new Error(`Catégorie « ${r.category} » inconnue`);

      let existing: { id: string; is_active: boolean; price_xof: number } | null = null;
      if (r.productId) existing = (await supabase.from('products').select('id, is_active, price_xof').eq('id', r.productId).maybeSingle()).data;
      if (!existing && r.sku) existing = (await supabase.from('products').select('id, is_active, price_xof').ilike('sku', r.sku).limit(1).maybeSingle()).data;
      if (!existing) existing = (await supabase.from('products').select('id, is_active, price_xof').eq('slug', r.slug).maybeSingle()).data;

      const base = {
        name: r.name,
        sku: r.sku,
        category_id: categoryId,
        moq: r.moq,
        weight_kg: r.weight_kg,
        cbm: r.cbm,
        default_transport_mode: r.transport_mode,
        estimated_delivery_days: r.delivery_days,
        stock_quantity: r.stock
      };
      let productId: string;
      let status: SaveResult['status'];
      let message: string | null = null;
      if (existing) {
        productId = existing.id;
        // Le prix d'un produit en ligne n'est modifiable qu'avec la permission : la base l'ignore sinon, on le signale
        const { error } = await supabase.from('products').update({ ...base, price_xof: r.price_xof }).eq('id', productId);
        if (error) throw error;
        const check = await supabase.from('products').select('price_xof').eq('id', productId).maybeSingle();
        if (check.data && Number(check.data.price_xof) !== r.price_xof) message = 'Prix de vente en ligne inchangé : la permission « fixer les prix publics » est requise.';
        status = 'updated';
      } else {
        const ins = await supabase
          .from('products')
          .insert({ ...base, slug: r.slug, short_description: r.name, description: '', price_xof: r.price_xof, features: [], specifications: {}, is_active: false })
          .select('id')
          .single();
        if (ins.error) throw ins.error;
        productId = ins.data.id as string;
        status = 'created';
        message = 'Créé en brouillon : à publier depuis la liste des produits.';
      }

      const cost = {
        product_id: productId,
        purchase_price_cny: r.purchase_price_cny,
        purchase_price_xof: r.purchase_price_xof,
        logistics_cost_xof: r.logistics_cost_xof,
        supplier_name: r.supplier_name,
        supplier_url: r.supplier_url,
        notes: r.notes
      };
      let costRes = await supabase.from('product_costs').upsert({ ...cost, list_price_cny: r.list_price_cny, cargo_unit_xof: r.cargo_unit_xof });
      // Colonnes ajoutées par la migration : tant qu'elle n'est pas appliquée, on enregistre sans elles
      if (costRes.error?.code === '42703' || costRes.error?.code === 'PGRST204') {
        costRes = await supabase.from('product_costs').upsert(cost);
        if (!costRes.error && (r.list_price_cny !== null || r.cargo_unit_xof !== null)) {
          message = [message, 'Prix affiché et cargo saisi non conservés (mise à jour de la base requise) : le cargo sera recalculé avec la grille de fret.'].filter(Boolean).join(' ');
        }
      }
      if (costRes.error) throw costRes.error;
      out.push({ rid: r.rid, status, productId, message });
    } catch (err) {
      out.push({ rid: r.rid, status: 'error', productId: null, message: friendlyError(err) });
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Fichiers : lecture (Excel, CSV), modèle et export
// ---------------------------------------------------------------------------

const XLSX_TYPES = /\.(xlsx|xlsm)$/i;

export async function readFileToRows(file: File): Promise<MatrixResult> {
  if (file.size > 5 * 1024 * 1024) throw new AppError('Fichier trop volumineux (5 Mo maximum).');
  if (/\.xls$/i.test(file.name)) throw new AppError('Ancien format .xls non pris en charge : enregistrez le fichier au format .xlsx ou .csv depuis Excel.');
  if (XLSX_TYPES.test(file.name)) {
    const { default: readXlsxFile } = await import('read-excel-file/browser');
    const sheets = await readXlsxFile(file);
    // On prend la feuille « Produits » si elle existe, sinon la première
    const sheet = sheets.find(sh => /produit/i.test(sh.sheet)) || sheets[0];
    return rowsFromMatrix((sheet?.data || []) as unknown[][]);
  }
  if (/\.(csv|txt|tsv)$/i.test(file.name) || file.type.startsWith('text/')) return rowsFromMatrix(parseDelimited(await file.text()));
  throw new AppError('Format non reconnu : utilisez un fichier Excel (.xlsx) ou CSV.');
}

function saveBlob(blob: Blob, fileName: string) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = fileName;
  a.click();
  window.setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

const headerCell = (value: string) => ({ value, fontWeight: 'bold' as const, backgroundColor: '#fff1e5', color: '#9e2c08' });

/** Modèle Excel prêt à remplir : un onglet « Produits » avec 2 exemples et un onglet « Mode d'emploi ». */
export async function downloadTemplate(categoryNames: string[]) {
  const { default: writeXlsxFile } = await import('write-excel-file/browser');
  const example = (vals: (string | number)[]) => vals.map(v => (typeof v === 'number' ? { value: v, type: Number } : { value: v, type: String, color: '#8a929f' }));
  const cat = categoryNames[0] || 'Maison & Décoration';
  const sheets = [
    {
      sheet: 'Produits',
      columns: COLUMNS.map(c => ({ width: Math.max(12, Math.round(c.width / 6.5)) })),
      data: [
        COLUMNS.map(c => headerCell(c.label)),
        example(['EXEMPLE Lampe solaire LED', 'LAMP-01', cat, 'Shenzhen Light Co.', 'https://detail.1688.com/…', 14, 12.5, 100, 0.3, 0.002, 'Avion', '', 5500, '12-18 jours', 0, 'Exemple : supprimez cette ligne']),
        example(['EXEMPLE Ventilateur USB', 'FAN-02', cat, 'Yiwu Trading', '', 9, 8, 50, 0.4, 0.004, 'Bateau', 2400, 3500, '30-45 jours', 0, ''])
      ]
    },
    {
      sheet: 'Mode d’emploi',
      columns: [{ width: 28 }, { width: 90 }],
      data: [
        [headerCell('Colonne'), headerCell('À quoi elle sert')],
        ...COLUMNS.map(c => [{ value: c.label, fontWeight: 'bold' as const }, { value: c.hint }]),
        [{ value: '' }, { value: '' }],
        [{ value: 'Important', fontWeight: 'bold' as const }, { value: 'Les lignes dont le nom commence par EXEMPLE sont ignorées. Les nombres peuvent s’écrire avec une virgule (12,5). Le cargo laissé vide est calculé avec la grille de fret.' }],
        [{ value: 'Catégories valides', fontWeight: 'bold' as const }, { value: categoryNames.join(' · ') }]
      ]
    }
  ];
  const blob = await writeXlsxFile(sheets as never).toBlob();
  saveBlob(blob, 'modele-produits-dallou-chine.xlsx');
}

/** Exporte le tableau actuel (tel qu'affiché) en Excel. */
export async function exportRows(rows: SheetRow[]) {
  const { default: writeXlsxFile } = await import('write-excel-file/browser');
  const numeric = new Set(['listCny', 'buyCny', 'moq', 'weightKg', 'cbm', 'cargoXof', 'priceXof', 'stock']);
  const data = [
    COLUMNS.map(c => headerCell(c.label)),
    ...rows.map(r =>
      COLUMNS.map(c => {
        const raw = r.values[c.key];
        if (numeric.has(c.key)) {
          const v = parseNumber(raw);
          return v === null ? null : { value: v, type: Number };
        }
        return raw ? { value: raw, type: String } : null;
      })
    )
  ];
  const blob = await writeXlsxFile(data as never, { columns: COLUMNS.map(c => ({ width: Math.max(12, Math.round(c.width / 6.5)) })) } as never).toBlob();
  saveBlob(blob, `produits-${new Date().toISOString().slice(0, 10)}.xlsx`);
}
