import { computePricing, DEFAULT_FEES, type FeesStructure, type FinanceContext, type TransportMode } from './pricing';
import { slugify } from './format';

/**
 * Tableur produits : une ligne = un produit avec son prix négocié, son poids, son cargo et son prix de vente.
 * Les cellules restent du texte (saisie libre, collage depuis Excel) ; les calculs convertissent à la volée.
 */

export type ColumnKey =
  | 'name'
  | 'sku'
  | 'category'
  | 'supplier'
  | 'supplierUrl'
  | 'listCny'
  | 'buyCny'
  | 'moq'
  | 'weightKg'
  | 'cbm'
  | 'mode'
  | 'cargoXof'
  | 'priceXof'
  | 'delay'
  | 'stock'
  | 'notes';

export interface Column {
  key: ColumnKey;
  label: string;
  hint: string;
  kind: 'text' | 'number' | 'mode' | 'category';
  width: number;
  /** Intitulés acceptés à l'import (comparés sans accents ni ponctuation). */
  synonyms: string[];
}

export const COLUMNS: Column[] = [
  { key: 'name', label: 'Produit', hint: 'Nom du produit tel que vu par le client.', kind: 'text', width: 230, synonyms: ['produit', 'nom', 'designation', 'article', 'product', 'name', 'libelle'] },
  { key: 'sku', label: 'Référence', hint: 'Code interne. Sert à retrouver le produit pour le mettre à jour.', kind: 'text', width: 110, synonyms: ['reference', 'ref', 'sku', 'code'] },
  { key: 'category', label: 'Catégorie', hint: 'Une catégorie existante du catalogue.', kind: 'category', width: 170, synonyms: ['categorie', 'category', 'famille', 'rayon'] },
  { key: 'supplier', label: 'Fournisseur', hint: 'Nom du fournisseur ou de l’usine.', kind: 'text', width: 150, synonyms: ['fournisseur', 'supplier', 'usine', 'vendeur'] },
  { key: 'supplierUrl', label: 'Lien fournisseur', hint: 'Lien 1688, Alibaba ou autre.', kind: 'text', width: 150, synonyms: ['lien', 'lienfournisseur', 'url', 'link', '1688', 'alibaba'] },
  { key: 'listCny', label: 'Prix affiché (¥)', hint: 'Prix annoncé par le fournisseur avant négociation.', kind: 'number', width: 105, synonyms: ['prixaffiche', 'prixinitial', 'prixcatalogue', 'prixlistecny', 'listprice', 'prixavantnegociation'] },
  { key: 'buyCny', label: 'Prix négocié (¥)', hint: 'Prix d’achat obtenu, par unité, en yuans.', kind: 'number', width: 110, synonyms: ['prixnegocie', 'prixachat', 'prixdachat', 'prixachatcny', 'purchaseprice', 'negotiatedprice', 'prixunitaire', 'prixcny'] },
  { key: 'moq', label: 'Quantité minimum', hint: 'Quantité minimale exigée par le fournisseur.', kind: 'number', width: 100, synonyms: ['quantiteminimum', 'quantiteminimale', 'qtemin', 'moq', 'minimum', 'quantitemin'] },
  { key: 'weightKg', label: 'Poids (kg)', hint: 'Poids d’UNE unité emballée, en kilos.', kind: 'number', width: 90, synonyms: ['poids', 'poidskg', 'poidsunitaire', 'weight', 'kg'] },
  { key: 'cbm', label: 'Volume (m³)', hint: 'Volume d’UNE unité emballée. Exemple : 0,002 pour 12 × 12 × 14 cm.', kind: 'number', width: 95, synonyms: ['volume', 'volumem3', 'cbm', 'm3'] },
  { key: 'mode', label: 'Transport', hint: 'Avion, bateau ou express.', kind: 'mode', width: 110, synonyms: ['transport', 'mode', 'modetransport', 'modedetransport', 'shipping'] },
  { key: 'cargoXof', label: 'Cargo / unité (FCFA)', hint: 'Prix du cargo par unité. Laissez vide : il est calculé avec la grille de fret.', kind: 'number', width: 125, synonyms: ['cargo', 'cargounite', 'prixcargo', 'fret', 'coutcargo', 'transportparunite', 'freight', 'logistique'] },
  { key: 'priceXof', label: 'Prix de vente (FCFA)', hint: 'Prix payé par le client, par unité, livré.', kind: 'number', width: 125, synonyms: ['prixvente', 'prixdevente', 'prixvendu', 'prixclient', 'sellingprice', 'price', 'prix'] },
  { key: 'delay', label: 'Délai', hint: 'Délai de livraison annoncé, par exemple « 15-25 jours ».', kind: 'text', width: 100, synonyms: ['delai', 'delailivraison', 'delivery', 'delaiestime'] },
  { key: 'stock', label: 'Stock', hint: 'Unités disponibles à Dakar (0 = sur commande).', kind: 'number', width: 75, synonyms: ['stock', 'quantitedisponible', 'disponible', 'qtestock'] },
  { key: 'notes', label: 'Notes', hint: 'Remarques internes (visibles par l’équipe seulement).', kind: 'text', width: 170, synonyms: ['notes', 'note', 'remarque', 'remarques', 'commentaire'] }
];

export interface SheetRow {
  rid: string;
  productId: string | null;
  values: Record<ColumnKey, string>;
  /** Modifiée depuis le dernier enregistrement. */
  dirty: boolean;
}

let counter = 0;
export const newRid = () => `r${Date.now().toString(36)}${(counter++).toString(36)}`;

export function emptyRow(partial: Partial<Record<ColumnKey, string>> = {}, productId: string | null = null, dirty = true): SheetRow {
  const values = Object.fromEntries(COLUMNS.map(c => [c.key, partial[c.key] ?? ''])) as Record<ColumnKey, string>;
  return { rid: newRid(), productId, values, dirty };
}

// ---------------------------------------------------------------------------
// Lecture des nombres et des modes de transport
// ---------------------------------------------------------------------------

/** « 12,5 », « 1 250 », « 12.5 ¥ », « 5 000 FCFA », « 1.250,50 » → nombre. Retourne null si illisible. */
export function parseNumber(input: unknown): number | null {
  if (typeof input === 'number') return Number.isFinite(input) ? input : null;
  let s = String(input ?? '').trim();
  if (!s) return null;
  s = s.replace(/[\s  ]/g, '').replace(/[^\d.,-]/g, '');
  if (!/\d/.test(s)) return null;
  const lastComma = s.lastIndexOf(',');
  const lastDot = s.lastIndexOf('.');
  if (lastComma >= 0 && lastDot >= 0) {
    // Les deux présents : le dernier est la virgule décimale, l'autre sépare les milliers
    s = lastComma > lastDot ? s.replace(/\./g, '').replace(',', '.') : s.replace(/,/g, '');
  } else if (lastComma >= 0) {
    // Une seule virgule = décimale (usage français : « 0,002 », « 12,5 ») ; plusieurs = séparateurs de milliers
    s = s.indexOf(',') === lastComma ? s.replace(',', '.') : s.replace(/,/g, '');
  } else if (lastDot >= 0 && /^[1-9]\d{0,2}(\.\d{3})+$/.test(s)) {
    s = s.replace(/\./g, '');
  }
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

export function normalizeMode(input: string): TransportMode | '' {
  const t = fold(input);
  if (!t) return '';
  if (/(^|[^a-z])(air|avion|aerien|aerienne)/.test(t)) return 'air';
  if (/(sea|mer|maritime|bateau|navire|conteneur|cbm)/.test(t)) return 'sea';
  if (/(express|dhl|fedex|ups|rapide)/.test(t)) return 'express';
  return '';
}

/** Minuscules sans accents ni ponctuation, pour comparer des intitulés. */
export function fold(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '');
}

// ---------------------------------------------------------------------------
// Import : grille de cellules (Excel, CSV ou collage) → lignes
// ---------------------------------------------------------------------------

function matchColumn(header: string): ColumnKey | null {
  const h = fold(header);
  if (!h) return null;
  const exact = COLUMNS.find(c => c.synonyms.includes(h) || fold(c.label) === h);
  if (exact) return exact.key;
  // Intitulé plus long que le synonyme (« Prix négocié en yuans ») : on prend le synonyme le plus long contenu
  let best: { key: ColumnKey; len: number } | null = null;
  for (const c of COLUMNS) {
    for (const syn of c.synonyms) {
      if (syn.length >= 3 && h.includes(syn) && (!best || syn.length > best.len)) best = { key: c.key, len: syn.length };
    }
  }
  return best?.key ?? null;
}

export interface MatrixResult {
  rows: SheetRow[];
  /** Intitulés non reconnus (ignorés). */
  ignored: string[];
  /** Colonnes importantes absentes du fichier. */
  missing: string[];
  /** Les en-têtes ont été reconnus (sinon, colonnes lues dans l'ordre du modèle). */
  hadHeader: boolean;
}

const cell = (v: unknown) => (v === null || v === undefined ? '' : v instanceof Date ? v.toISOString().slice(0, 10) : String(v).trim());

export function rowsFromMatrix(matrix: unknown[][]): MatrixResult {
  const grid = matrix.map(r => (Array.isArray(r) ? r : [])).filter(r => r.some(c => cell(c) !== ''));
  if (!grid.length) return { rows: [], ignored: [], missing: [], hadHeader: false };

  // Ligne d'en-têtes : la première qui contient au moins deux intitulés reconnus
  const headerIdx = grid.slice(0, 6).findIndex(r => r.filter(c => matchColumn(cell(c))).length >= 2);
  let mapping: (ColumnKey | null)[];
  let body: unknown[][];
  const ignored: string[] = [];
  if (headerIdx >= 0) {
    mapping = grid[headerIdx].map(c => {
      const k = matchColumn(cell(c));
      if (!k && cell(c)) ignored.push(cell(c));
      return k;
    });
    body = grid.slice(headerIdx + 1);
  } else {
    mapping = COLUMNS.map(c => c.key);
    body = grid;
  }
  // Si deux colonnes visent la même clé, la première gagne
  const seen = new Set<ColumnKey>();
  mapping = mapping.map(k => (k && !seen.has(k) ? (seen.add(k), k) : null));

  const rows: SheetRow[] = [];
  for (const r of body) {
    const partial: Partial<Record<ColumnKey, string>> = {};
    mapping.forEach((k, i) => {
      if (k) partial[k] = cell(r[i]);
    });
    const name = partial.name || '';
    if (!name || /^exemple/i.test(name)) continue;
    rows.push(emptyRow(partial));
  }
  const present = new Set(mapping.filter(Boolean) as ColumnKey[]);
  const important: ColumnKey[] = ['name', 'buyCny', 'weightKg', 'priceXof'];
  const missing = important.filter(k => !present.has(k)).map(k => COLUMNS.find(c => c.key === k)!.label);
  return { rows, ignored, missing, hadHeader: headerIdx >= 0 };
}

/** CSV / texte collé depuis Excel (tabulations) → grille. Détecte le séparateur (; , ou tabulation) et gère les guillemets. */
export function parseDelimited(text: string): string[][] {
  const src = text.replace(/^﻿/, '');
  const firstLine = src.split(/\r?\n/, 1)[0] || '';
  const counts: [string, number][] = [
    ['\t', (firstLine.match(/\t/g) || []).length],
    [';', (firstLine.match(/;/g) || []).length],
    [',', (firstLine.match(/,/g) || []).length]
  ];
  const delim = counts.sort((a, b) => b[1] - a[1])[0][1] > 0 ? counts.sort((a, b) => b[1] - a[1])[0][0] : ';';
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (quoted) {
      if (ch === '"' && src[i + 1] === '"') {
        field += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === delim) {
      row.push(field);
      field = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && src[i + 1] === '\n') i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else field += ch;
  }
  if (field !== '' || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

// ---------------------------------------------------------------------------
// Calculs par ligne : coût livré, marge, prix conseillé
// ---------------------------------------------------------------------------

export type Level = 'incomplete' | 'ok' | 'low' | 'loss';

export interface RowEconomics {
  level: Level;
  messages: string[];
  /** Coût livré à Dakar, par unité (achat + cargo + douane + contrôle). */
  landedUnitXOF: number | null;
  cargoUnitXOF: number | null;
  cargoIsEstimate: boolean;
  /** Prix d'achat converti au taux du jour, sans tampon. */
  purchaseXOF: number | null;
  /** Tout ce qui s'ajoute à l'achat : cargo, douane, contrôle, tampon de change. */
  logisticsXOF: number | null;
  marginXOF: number | null;
  marginPct: number | null;
  suggestedPriceXOF: number | null;
  negotiationGainPct: number | null;
}

export interface SheetContext {
  fx: number;
  fees: FeesStructure;
  context: FinanceContext;
  targetMarginPct: number;
  minMarginPct: number;
  paymentFeePct: number;
}

export function makeSheetContext(context: FinanceContext): SheetContext {
  return {
    fx: context.fx.cny_to_xof ?? 0,
    fees: { ...DEFAULT_FEES, ...context.fees },
    context,
    targetMarginPct: context.targets.target_margin_pct ?? 35,
    minMarginPct: context.targets.min_margin_pct ?? 15,
    paymentFeePct: 2
  };
}

const num = (v: string) => parseNumber(v);

export function computeRow(row: SheetRow, ctx: SheetContext): RowEconomics {
  const v = row.values;
  const out: RowEconomics = {
    level: 'incomplete',
    messages: [],
    landedUnitXOF: null,
    cargoUnitXOF: null,
    cargoIsEstimate: false,
    purchaseXOF: null,
    logisticsXOF: null,
    marginXOF: null,
    marginPct: null,
    suggestedPriceXOF: null,
    negotiationGainPct: null
  };
  const buy = num(v.buyCny);
  const list = num(v.listCny);
  if (buy !== null && list !== null && list > 0 && buy <= list) out.negotiationGainPct = Math.round(((list - buy) / list) * 1000) / 10;
  if (buy !== null && list !== null && buy > list) out.messages.push('Le prix négocié dépasse le prix affiché.');

  if (!(buy !== null && buy > 0)) {
    out.messages.push('Indiquez le prix négocié en yuans.');
    return out;
  }
  if (!ctx.fx) {
    out.messages.push('Taux de change yuan → FCFA indisponible.');
    return out;
  }
  const mode = normalizeMode(v.mode) || 'air';
  const moq = Math.max(1, Math.floor(num(v.moq) ?? 1));
  const cargoGiven = num(v.cargoXof);
  const weight = num(v.weightKg) ?? 0;
  const cbm = num(v.cbm) ?? 0;
  if (cargoGiven === null && !(weight > 0) && !(cbm > 0)) {
    out.messages.push('Indiquez le poids (ou le volume), ou saisissez le cargo par unité.');
    return out;
  }

  const rate = ctx.context.freight.find(r => r.transport_mode === mode);
  const res = computePricing({
    quantity: moq,
    unitPriceCNY: buy,
    weightKg: weight,
    cbm,
    mode,
    cnyToXof: ctx.fx,
    rate,
    fees: ctx.fees,
    marginPct: 0,
    paymentFeePct: 0,
    extraCostXOF: 0,
    freightPerUnitOverrideXOF: cargoGiven !== null && cargoGiven > 0 ? cargoGiven : undefined
  });
  if (!res.ok) {
    out.messages.push(...res.errors);
    return out;
  }
  const landed = res.landedCostXOF / moq;
  const purchase = Math.round(buy * ctx.fx);
  out.landedUnitXOF = Math.round(landed);
  out.cargoUnitXOF = Math.round(res.freightXOF / moq);
  out.cargoIsEstimate = !(cargoGiven !== null && cargoGiven > 0);
  out.purchaseXOF = purchase;
  out.logisticsXOF = Math.max(0, Math.round(landed) - purchase);
  const fee = Math.max(0, ctx.paymentFeePct);
  out.suggestedPriceXOF = Math.ceil(landed / (1 - (ctx.targetMarginPct + fee) / 100) / 100) * 100;

  const price = num(v.priceXof);
  if (price !== null && price > 0) {
    const margin = price * (1 - fee / 100) - landed;
    out.marginXOF = Math.round(margin);
    out.marginPct = Math.round((margin / price) * 1000) / 10;
    out.level = margin < 0 ? 'loss' : out.marginPct < ctx.minMarginPct ? 'low' : 'ok';
    if (out.level === 'loss') out.messages.push('Vendu à perte : le prix de vente ne couvre pas le coût livré.');
    else if (out.level === 'low') out.messages.push(`Marge sous le seuil de ${ctx.minMarginPct} %.`);
  } else {
    out.messages.push('Indiquez le prix de vente (ou appliquez le prix conseillé).');
  }
  return out;
}

// ---------------------------------------------------------------------------
// Validation et préparation de l'enregistrement
// ---------------------------------------------------------------------------

export interface PreparedRow {
  rid: string;
  productId: string | null;
  name: string;
  slug: string;
  sku: string | null;
  category: string;
  supplier_name: string | null;
  supplier_url: string | null;
  list_price_cny: number | null;
  purchase_price_cny: number | null;
  purchase_price_xof: number;
  logistics_cost_xof: number;
  /** Cargo par unité saisi à la main ; null = estimé avec la grille de fret. */
  cargo_unit_xof: number | null;
  moq: number;
  weight_kg: number;
  cbm: number;
  transport_mode: TransportMode;
  price_xof: number;
  delivery_days: string | null;
  stock: number;
  notes: string | null;
}

export interface RowProblem {
  rid: string;
  message: string;
}

export function prepareRows(rows: SheetRow[], ctx: SheetContext, categoryNames: string[]): { ready: PreparedRow[]; problems: RowProblem[] } {
  const ready: PreparedRow[] = [];
  const problems: RowProblem[] = [];
  const cats = new Map(categoryNames.map(n => [fold(n), n]));
  const usedSlugs = new Map<string, string>();

  for (const r of rows) {
    const v = r.values;
    const name = v.name.trim();
    if (name.length < 2) {
      problems.push({ rid: r.rid, message: 'Nom du produit manquant.' });
      continue;
    }
    const catKey = fold(v.category);
    const matched = cats.get(catKey) || categoryNames.find(n => fold(n).includes(catKey) && catKey.length >= 4) || null;
    if (!v.category.trim()) {
      problems.push({ rid: r.rid, message: `« ${name} » : choisissez une catégorie.` });
      continue;
    }
    if (!matched) {
      problems.push({ rid: r.rid, message: `« ${name} » : catégorie « ${v.category} » inconnue.` });
      continue;
    }
    const price = num(v.priceXof);
    if (!(price !== null && price > 0)) {
      problems.push({ rid: r.rid, message: `« ${name} » : prix de vente manquant.` });
      continue;
    }
    const e = computeRow(r, ctx);
    const slug = slugify(v.sku.trim() ? `${name}-${v.sku}` : name) || slugify(name);
    if (usedSlugs.has(slug) && usedSlugs.get(slug) !== r.rid) {
      problems.push({ rid: r.rid, message: `« ${name} » : doublon dans le tableau (même nom et même référence).` });
      continue;
    }
    usedSlugs.set(slug, r.rid);
    const buy = num(v.buyCny);
    ready.push({
      rid: r.rid,
      productId: r.productId,
      name,
      slug,
      sku: v.sku.trim() || null,
      category: matched,
      supplier_name: v.supplier.trim() || null,
      supplier_url: v.supplierUrl.trim() || null,
      list_price_cny: num(v.listCny),
      purchase_price_cny: buy,
      purchase_price_xof: e.purchaseXOF ?? (buy && ctx.fx ? Math.round(buy * ctx.fx) : 0),
      logistics_cost_xof: e.logisticsXOF ?? 0,
      cargo_unit_xof: (num(v.cargoXof) ?? 0) > 0 ? num(v.cargoXof) : null,
      moq: Math.max(1, Math.floor(num(v.moq) ?? 1)),
      weight_kg: Math.max(0, num(v.weightKg) ?? 0),
      cbm: Math.max(0, num(v.cbm) ?? 0),
      transport_mode: normalizeMode(v.mode) || 'air',
      price_xof: Math.round(price),
      delivery_days: v.delay.trim() || null,
      stock: Math.max(0, Math.floor(num(v.stock) ?? 0)),
      notes: v.notes.trim() || null
    });
  }
  return { ready, problems };
}
