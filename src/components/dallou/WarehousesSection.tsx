import React, { useState } from 'react';
import { MapPin, Copy, Check, Warehouse, Phone, Clock, AlertTriangle, FileText, CheckCircle2 } from 'lucide-react';

export const WarehousesSection: React.FC = () => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <section id="entrepots" className="space-y-8">
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FF4500]/10 text-[#FF4500] text-xs font-black tracking-wide uppercase">
          Présence Directe en Chine
        </span>
        <h2 className="text-2xl sm:text-4xl font-black text-[#0B192C] tracking-tight">
          Nos 2 Entrepôts Stratégiques en Chine
        </h2>
        <p className="text-xs sm:text-base text-slate-600">
          Situés au cœur des deux plus grands pôles manufacturiers mondiaux, nos entrepôts réceptionnent vos colis 6 jours sur 7 avec accusé de réception vidéo.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Entrepôt 1: Guangzhou */}
        <div className="rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 shadow-sm hover:shadow-md transition-all space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center">
                <Warehouse className="w-6 h-6 text-[#FF4500]" />
              </div>
              <div>
                <h3 className="text-lg font-black text-[#0B192C]">Entrepôt Guangzhou (广州)</h3>
                <span className="text-xs text-slate-500">Province du Guangdong • Hub Aérien & Maritime</span>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
              Ouvert
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-slate-500 uppercase text-[10px]">
                  Adresse en Chinois (中文地址)
                </span>
                <button
                  onClick={() =>
                    copyText(
                      '广东省广州市白云区石井街道大冈东街36号达路物流仓',
                      'gz-addr'
                    )
                  }
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-[#FF4500] hover:underline"
                >
                  {copiedId === 'gz-addr' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedId === 'gz-addr' ? 'Copié !' : 'Copier'}</span>
                </button>
              </div>
              <p className="font-mono font-bold text-slate-800 text-sm select-all leading-relaxed">
                广东省广州市白云区石井街道大冈东街36号达路物流仓
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-[10px] font-semibold text-slate-400 block">Destinataire (收件人)</span>
                <p className="font-mono font-bold text-slate-800 text-xs mt-0.5">
                  达路物流 [Votre Nom + Tel]
                </p>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-[10px] font-semibold text-slate-400 block">Téléphone entrepôt</span>
                <p className="font-mono font-bold text-slate-800 text-xs mt-0.5">
                  +86 138 2608 9912
                </p>
              </div>
            </div>

            <div className="space-y-1.5 pt-2 text-slate-600">
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-[#FF4500] shrink-0" />
                <span>Horaires : Lundi au Samedi, 09h00 - 21h00 (Heure de Chine)</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-[#FF4500] shrink-0" />
                <span>À 20 min de l'aéroport international de Guangzhou Baiyun (CAN)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Entrepôt 2: Yiwu */}
        <div className="rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 shadow-sm hover:shadow-md transition-all space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center">
                <Warehouse className="w-6 h-6 text-[#0B192C]" />
              </div>
              <div>
                <h3 className="text-lg font-black text-[#0B192C]">Entrepôt Yiwu (义乌)</h3>
                <span className="text-xs text-slate-500">Province du Zhejiang • Plus grand marché de gros</span>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
              Ouvert
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-slate-500 uppercase text-[10px]">
                  Adresse en Chinois (中文地址)
                </span>
                <button
                  onClick={() =>
                    copyText(
                      '浙江省金华市义乌市江东街道青口工业区通达路18号达路国际仓',
                      'yw-addr'
                    )
                  }
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-[#FF4500] hover:underline"
                >
                  {copiedId === 'yw-addr' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedId === 'yw-addr' ? 'Copié !' : 'Copier'}</span>
                </button>
              </div>
              <p className="font-mono font-bold text-slate-800 text-sm select-all leading-relaxed">
                浙江省金华市义乌市江东街道青口工业区通达路18号达路国际仓
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-[10px] font-semibold text-slate-400 block">Destinataire (收件人)</span>
                <p className="font-mono font-bold text-slate-800 text-xs mt-0.5">
                  达路义乌仓 [Votre Nom + Tel]
                </p>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-[10px] font-semibold text-slate-400 block">Téléphone entrepôt</span>
                <p className="font-mono font-bold text-slate-800 text-xs mt-0.5">
                  +86 186 5792 6631
                </p>
              </div>
            </div>

            <div className="space-y-1.5 pt-2 text-slate-600">
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-[#0B192C] shrink-0" />
                <span>Horaires : 7j/7, 08h30 - 22h00 (Heure de Chine)</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-[#0B192C] shrink-0" />
                <span>À proximité immédiate du Yiwu International Trade City</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Guide & Rules for Marking Cartons */}
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-3xl p-6 sm:p-8 space-y-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-6 h-6 text-[#FF4500] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-sm sm:text-base font-black text-amber-950">
              Règle d'or : Le marquage extérieur de vos colis (Shipping Mark)
            </h4>
            <p className="text-xs sm:text-sm text-amber-900/90 leading-relaxed">
              Pour que vos colis soient identifiés instantanément dès leur déchargement à l'entrepôt, demandez impérativement à vos fournisseurs d'écrire au marqueur indélébile sur chaque carton :
            </p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-amber-300/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Format de marquage recommandé :
            </span>
            <span className="font-mono font-black text-sm sm:text-base text-[#FF4500]">
              DC-DKR / [VOTRE NOM ET PRÉNOM] / [VOTRE NUMÉRO WHATSAPP SÉNÉGAL]
            </span>
          </div>
          <button
            onClick={() => copyText('DC-DKR / [NOM] / [TEL_SENEGAL]', 'mark-sample')}
            className="w-full sm:w-auto px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-950 font-bold text-xs rounded-xl border border-amber-400/40 transition-colors flex items-center justify-center gap-1.5 shrink-0"
          >
            {copiedId === 'mark-sample' ? <Check className="w-3.5 h-3.5 text-emerald-700" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedId === 'mark-sample' ? 'Copié !' : 'Copier le modèle'}</span>
          </button>
        </div>
      </div>
    </section>
  );
};
