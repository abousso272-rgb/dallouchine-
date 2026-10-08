import { apiFetch } from '../lib/api';
import { AppError } from '../lib/db';

export interface ProductAnalysis {
  productName: string;
  productNameZh: string | null;
  category: string | null;
  description: string;
  specs: { label: string; value: string }[];
  materials: string | null;
  listing: {
    priceMin: number | null;
    priceMax: number | null;
    currency: string | null;
    moq: number | null;
    supplierName: string | null;
    supplierLocation: string | null;
    ordersSold: string | null;
    leadTime: string | null;
  };
  estimate: { unitPriceCnyMin: number | null; unitPriceCnyMax: number | null; confidence: 'low' | 'medium' | 'high' } | null;
  searchKeywords: { en: string[]; zh: string[] };
  supplierQuestions: string[];
  warnings: string[];
  confidence: 'low' | 'medium' | 'high';
  source: 'image' | 'link' | 'both';
  pageStatus: 'ok' | 'thin' | 'unreachable' | 'not_requested';
}

/** Réduit la photo (1280 px max, JPEG) avant envoi : plus rapide et sous la limite du serveur. */
export function prepareImage(file: File): Promise<{ mediaType: string; data: string; previewUrl: string }> {
  return new Promise((resolve, reject) => {
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return reject(new AppError('Format non pris en charge : utilisez une photo JPG, PNG ou WebP.'));
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, 1280 / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new AppError('Image illisible.'));
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
      resolve({ mediaType: 'image/jpeg', data: dataUrl.split(',')[1], previewUrl: url });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new AppError('Image illisible.'));
    };
    img.src = url;
  });
}

export async function analyzeProduct(input: { url?: string; image?: { mediaType: string; data: string } }): Promise<ProductAnalysis> {
  const res = await apiFetch<{ analysis: ProductAnalysis }>('/api/ai/analyze-product', { method: 'POST', body: input });
  return res.analysis;
}

/** Liens de recherche fournisseurs prêts à ouvrir (recherches publiques, aucune donnée inventée). */
export function supplierSearchLinks(a: ProductAnalysis) {
  const en = a.searchKeywords.en[0] || a.productName;
  const zh = a.searchKeywords.zh[0] || a.productNameZh || '';
  const links = [
    { label: 'Alibaba', url: `https://www.alibaba.com/trade/search?SearchText=${encodeURIComponent(en)}` },
    { label: 'Made-in-China', url: `https://www.made-in-china.com/products-search/hot-china-products/${encodeURIComponent(en.replace(/\s+/g, '_'))}.html` },
    { label: 'AliExpress', url: `https://www.aliexpress.com/wholesale?SearchText=${encodeURIComponent(en)}` }
  ];
  if (zh) links.splice(1, 0, { label: '1688', url: `https://s.1688.com/selloffer/offer_search.htm?keywords=${encodeURIComponent(zh)}` });
  return links;
}

/** Bloc de texte joint à la demande pour que l'équipe voie ce que l'IA a compris. */
export function analysisToNotes(a: ProductAnalysis): string {
  const lines = ['— Analyse automatique (à vérifier) —', a.productName];
  if (a.specs.length) lines.push(a.specs.map(s => `${s.label} : ${s.value}`).join(' · '));
  const l = a.listing;
  const price = l.priceMin != null ? `${l.priceMin}${l.priceMax && l.priceMax !== l.priceMin ? `–${l.priceMax}` : ''} ${l.currency || ''}`.trim() : null;
  const facts = [price && `Prix affiché sur le lien : ${price}`, l.moq != null && `MOQ : ${l.moq}`, l.supplierName && `Fournisseur : ${l.supplierName}`, l.leadTime && `Délai : ${l.leadTime}`].filter(Boolean);
  if (facts.length) lines.push(facts.join(' · '));
  if (a.searchKeywords.zh.length) lines.push(`Mots-clés 1688 : ${a.searchKeywords.zh.join(' / ')}`);
  return lines.join('\n');
}
