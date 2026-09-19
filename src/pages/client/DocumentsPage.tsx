import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  FileText,
  Search,
  Download,
  Eye,
  CheckCircle2,
  Lock,
  Ship,
  ShieldCheck,
  Video,
  FileCheck2,
  FolderArchive,
  ExternalLink,
  Calendar,
  Building,
  QrCode,
  Printer,
  X,
  Sparkles,
  ArrowRight,
  Package,
  Layers,
  FileSpreadsheet
} from 'lucide-react';

interface OfficialDoc {
  id: string;
  title: string;
  ref: string;
  orderId?: string;
  category: 'freight' | 'inspection' | 'invoice' | 'cert';
  categoryLabel: string;
  issuer: string;
  format: string;
  size: string;
  date: string;
  signature: string;
  hash: string;
  verified: boolean;
  isPriority?: boolean;
}

export const DocumentsPage: React.FC = () => {
  const { addToast } = useApp();

  const [activeFilter, setActiveFilter] = useState<'all' | 'freight' | 'inspection' | 'invoice' | 'cert'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDoc, setSelectedDoc] = useState<OfficialDoc | null>(null);

  // 14 Official Archive Documents
  const [documents] = useState<OfficialDoc[]>([
    // CMD-2026-0048 (Priority)
    {
      id: 'doc-1',
      title: 'Connaissement Maritime (Bill of Lading - B/L)',
      ref: 'MSK-DKR-982341',
      orderId: 'CMD-2026-0048',
      category: 'freight',
      categoryLabel: 'Connaissement Maritime',
      issuer: 'Maersk Line Ningbo',
      format: 'PDF',
      size: '1.4 Mo',
      date: '14 Juil. 2026',
      signature: 'Numérique VeriSign',
      hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      verified: true,
      isPriority: true
    },
    {
      id: 'doc-2',
      title: 'Rapport d\'inspection vidéo & banc SGS',
      ref: 'SGS-NB-2026-882',
      orderId: 'CMD-2026-0048',
      category: 'inspection',
      categoryLabel: 'Inspection Usine SGS',
      issuer: 'SGS Industrial Ningbo',
      format: 'MP4 (1080p)',
      size: '42.0 Mo',
      date: '05 Juil. 2026',
      signature: 'SGS China Seal #90234',
      hash: 'a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e',
      verified: true,
      isPriority: true
    },
    {
      id: 'doc-3',
      title: 'Certificat d\'Origine Form E & Homologation CE',
      ref: 'CO-ZJ-2026-4491',
      orderId: 'CMD-2026-0048',
      category: 'cert',
      categoryLabel: 'Certificat d\'Origine',
      issuer: 'CCPIT Zhejiang & Bureau Veritas',
      format: 'PDF',
      size: '2.1 Mo',
      date: '08 Juil. 2026',
      signature: 'Tampon Consulaire Chine-Sénégal',
      hash: 'dffd6021bb2bd5b0af676290809ec3a53191dd81c7f70a4b28688a362182986f',
      verified: true,
      isPriority: true
    },
    {
      id: 'doc-4',
      title: 'Facture d\'Acompte 30% & Enregistrement OHADA',
      ref: 'FAC-2026-0048-A',
      orderId: 'CMD-2026-0048',
      category: 'invoice',
      categoryLabel: 'Facture Fiscale OHADA',
      issuer: 'Dallou Chine SARL (Dakar)',
      format: 'PDF',
      size: '890 Ko',
      date: '18 Juin 2026',
      signature: 'Quittance Séquestre N°SN-DKR-892',
      hash: '8f434346648f6b96df89dda901c5176b10a6d83961dd3c1ac88b59b2dc327aa4',
      verified: true,
      isPriority: true
    },

    // Additional History Documents
    {
      id: 'doc-5',
      title: 'Quittance de Dédouanement GAINDE Port Dakar',
      ref: 'DOU-PAD-2026-0182',
      orderId: 'CMD-2026-0031',
      category: 'freight',
      categoryLabel: 'Douane GAINDE',
      issuer: 'Direction Générale des Douanes Sénégal',
      format: 'PDF',
      size: '1.8 Mo',
      date: '03 Juin 2026',
      signature: 'Certificat Mainlevée PAD #0441',
      hash: '6b86b273ff34fce19d6b804eff5a3f5747ada4eaa22f1d49c01e52ddb7875b4b',
      verified: true
    },
    {
      id: 'doc-6',
      title: 'Connaissement Maritime LCL 40HQ Tangier',
      ref: 'CMA-DKR-772910',
      orderId: 'CMD-2026-0031',
      category: 'freight',
      categoryLabel: 'Connaissement Maritime',
      issuer: 'CMA CGM Line Dakar Agency',
      format: 'PDF',
      size: '1.2 Mo',
      date: '02 Juin 2026',
      signature: 'Validé Terminal Dakar',
      hash: 'd4735e3a265e16eee03f59718b9b5d03019c07d8b6c51f90da3a666eec13ab35',
      verified: true
    },
    {
      id: 'doc-7',
      title: 'Rapport Audit Électrique Panneaux TOPCon 580W',
      ref: 'SGS-WX-2026-512',
      orderId: 'DEV-2026-0089',
      category: 'inspection',
      categoryLabel: 'Inspection Usine SGS',
      issuer: 'SGS Wuxi Solar Laboratory',
      format: 'PDF',
      size: '6.5 Mo',
      date: '28 Mai 2026',
      signature: 'Rapport d\'essai Flash Test IEC61215',
      hash: '4e07408562bedb8b60ce05c1decfe3ad16b72230967de01f640b7e4729b49fce',
      verified: true
    },
    {
      id: 'doc-8',
      title: 'Vidéo Test Banc Moteur & Étancheité IP67',
      ref: 'AUD-GZ-2026-104',
      orderId: 'CMD-2026-0031',
      category: 'inspection',
      categoryLabel: 'Inspection Usine SGS',
      issuer: 'Bureau Dallou Chine Guangzhou',
      format: 'MP4',
      size: '34.0 Mo',
      date: '15 Mai 2026',
      signature: 'Contrôle métrologique certifié',
      hash: '4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a',
      verified: true
    },
    {
      id: 'doc-9',
      title: 'Facture Proforma Négociée Ligne Solaire',
      ref: 'PRO-2026-0089-V3',
      orderId: 'DEV-2026-0089',
      category: 'invoice',
      categoryLabel: 'Facture Proforma',
      issuer: 'Jinko Solar Partner Wuxi',
      format: 'PDF',
      size: '1.1 Mo',
      date: '25 Mai 2026',
      signature: 'Contre-signature Acheteur B2B',
      hash: 'ef2d127de37b942baad06145e54b0c619a1f22327b2ebbcfbec78f5564afe39d',
      verified: true
    },
    {
      id: 'doc-10',
      title: 'Reçu de Séquestre Bancaire OHADA (1 450 000 F)',
      ref: 'SEQ-CBAO-2026-009',
      orderId: 'CMD-2026-0024',
      category: 'invoice',
      categoryLabel: 'Facture Fiscale OHADA',
      issuer: 'CBAO Groupe Attijariwafa Bank',
      format: 'PDF',
      size: '720 Ko',
      date: '14 Mai 2026',
      signature: 'Attestation séquestre bancaire',
      hash: 'e7f6c011776e8db7cd330b54174fd76f7d0216b612387a5ffcfb81e6f0919683',
      verified: true
    },
    {
      id: 'doc-11',
      title: 'Facture Acquittée Transit Maritime & Douane',
      ref: 'FAC-2026-0031-F',
      orderId: 'CMD-2026-0031',
      category: 'invoice',
      categoryLabel: 'Facture Fiscale OHADA',
      issuer: 'Dallou Chine Transit Dakar',
      format: 'PDF',
      size: '950 Ko',
      date: '02 Juin 2026',
      signature: 'Facture clôturée avec quittance',
      hash: '7902699be42c8a8e46fbbb4501726517e86b22c56a189f7625a6da49081b2451',
      verified: true
    },
    {
      id: 'doc-12',
      title: 'Quittance d\'Honoraires SGS Audit Usine',
      ref: 'FAC-SGS-2026-041',
      orderId: 'CMD-2026-0012',
      category: 'invoice',
      categoryLabel: 'Facture Fiscale OHADA',
      issuer: 'SGS China Services',
      format: 'PDF',
      size: '540 Ko',
      date: '27 Avr. 2026',
      signature: 'Reçu fiscal acquitté Wave',
      hash: '2c624232cdd221771294dfbb310aca000a0df6ec8b6602f7f70404a050d37e55',
      verified: true
    },
    {
      id: 'doc-13',
      title: 'Certificat Sanitaire & Non-Contamination LCL',
      ref: 'SAN-CN-2026-7890',
      orderId: 'CMD-2026-0031',
      category: 'cert',
      categoryLabel: 'Certificat Sanitaire',
      issuer: 'China Customs Quarantine Bureau',
      format: 'PDF',
      size: '1.3 Mo',
      date: '12 Mai 2026',
      signature: 'Tampon CIQ Chine',
      hash: '19581e27de7ced00ff1ce50b2047e7a567c76b1cbaebabe5ef03f7c3017bb5b7',
      verified: true
    },
    {
      id: 'doc-14',
      title: 'Rapport d\'Audit Usine Machines & Matériaux',
      ref: 'AUD-SGS-2026-118',
      orderId: 'CMD-2026-0012',
      category: 'inspection',
      categoryLabel: 'Inspection Usine SGS',
      issuer: 'SGS Industrial Services Guangzhou',
      format: 'PDF',
      size: '4.8 Mo',
      date: '26 Avr. 2026',
      signature: 'Audit complet 24 pages certifié',
      hash: '3a52ce780950d4d969792a2559cd519d7ee8c727ea3684787d3f420f050f115e',
      verified: true
    }
  ]);

  const filteredDocs = documents.filter(doc => {
    const matchesCategory = activeFilter === 'all' || doc.category === activeFilter;
    const matchesSearch =
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.ref.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.orderId && doc.orderId.toLowerCase().includes(searchQuery.toLowerCase())) ||
      doc.issuer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleDownloadSingle = (doc: OfficialDoc) => {
    addToast({
      title: 'Téléchargement lancé',
      message: `${doc.title} (${doc.ref}) • Format ${doc.format} (${doc.size}).`,
      type: 'success'
    });
  };

  const handleDownloadDossierZip = () => {
    addToast({
      title: 'Archive Téléchargée (.ZIP)',
      message: 'Dossier complet CMD-2026-0048 généré (4 actes certifiés, 48.4 Mo).',
      type: 'success'
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-6 sm:py-8 flex flex-col gap-8 pb-20">
      {/* 1. Editorial Header Section */}
      <div className="pt-2 sm:pt-4 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="max-w-3xl space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-[#FF4500] animate-pulse" />
            <span className="font-mono text-[11px] uppercase tracking-wider">
              Coffre-Fort Numérique Dakar • Ningbo
            </span>
            <span className="text-slate-300">|</span>
            <span className="text-[#FF4500] font-bold">SYSCOHADA & DOUANES GAINDE</span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#0B192C] font-heading tracking-tight">
            Centre de Documents & Certificats
          </h1>

          <p className="text-sm text-slate-600 leading-relaxed">
            Retrouvez l'ensemble de vos pièces contractuelles, connaissements maritimes, factures OHADA et rapports d'inspection physique scellés pour l'ensemble de vos opérations d'importation.
          </p>
        </div>

        {/* Quick Metrics Bento */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-3.5 sm:p-4 shadow-sm flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Statut Dépôt</div>
              <div className="text-base sm:text-lg font-black text-[#0B192C]">100% Conforme</div>
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl p-3.5 sm:p-4 shadow-sm flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-orange-50 text-[#FF4500] flex items-center justify-center">
              <FolderArchive className="w-6 h-6" />
            </div>
            <div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Archives Actives</div>
              <div className="text-base sm:text-lg font-black text-[#0B192C]">14 Actes Scellés</div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Search Bar & Filter Chips */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-4 sm:p-6 shadow-sm space-y-4">
        <div className="relative w-full">
          <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Rechercher par numéro de dossier, produit ou référence douanière (ex: B/L, CMD, DEV)..."
            className="w-full h-12 sm:h-14 pl-12 pr-24 rounded-full bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#FF4500]"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 px-3 py-1 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold cursor-pointer"
            >
              Effacer
            </button>
          )}
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all shrink-0 flex items-center gap-2 cursor-pointer ${
              activeFilter === 'all'
                ? 'bg-[#0B192C] text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <span>Tous les documents</span>
            <span className="w-5 h-5 rounded-full bg-[#FF4500] text-white text-[10px] font-bold flex items-center justify-center">
              14
            </span>
          </button>

          <button
            onClick={() => setActiveFilter('freight')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all shrink-0 flex items-center gap-2 cursor-pointer ${
              activeFilter === 'freight'
                ? 'bg-[#0B192C] text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <Ship className="w-4 h-4 text-[#FF4500]" />
            <span>Connaissements & Fret (B/L)</span>
            <span className="px-1.5 py-0.2 rounded-md bg-white/40 text-xs font-bold">3</span>
          </button>

          <button
            onClick={() => setActiveFilter('inspection')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all shrink-0 flex items-center gap-2 cursor-pointer ${
              activeFilter === 'inspection'
                ? 'bg-[#0B192C] text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <FileCheck2 className="w-4 h-4 text-emerald-600" />
            <span>Rapports d'Inspection SGS</span>
            <span className="px-1.5 py-0.2 rounded-md bg-white/40 text-xs font-bold">4</span>
          </button>

          <button
            onClick={() => setActiveFilter('invoice')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all shrink-0 flex items-center gap-2 cursor-pointer ${
              activeFilter === 'invoice'
                ? 'bg-[#0B192C] text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <FileText className="w-4 h-4 text-blue-600" />
            <span>Factures Proforma & OHADA</span>
            <span className="px-1.5 py-0.2 rounded-md bg-white/40 text-xs font-bold">5</span>
          </button>

          <button
            onClick={() => setActiveFilter('cert')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all shrink-0 flex items-center gap-2 cursor-pointer ${
              activeFilter === 'cert'
                ? 'bg-[#0B192C] text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-purple-600" />
            <span>Certificats d'Origine & Homologations</span>
            <span className="px-1.5 py-0.2 rounded-md bg-white/40 text-xs font-bold">2</span>
          </button>
        </div>
      </div>

      {/* 3. Prominent Shipment Archive Box (CMD-2026-0048) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-[#FF4500]" />
            <span className="text-base sm:text-lg font-black text-[#0B192C] font-heading tracking-tight">
              Expédition Prioritaire • Dossier Scellé
            </span>
          </div>
          <div className="flex items-center gap-2 text-slate-500 text-xs font-medium">
            <Lock className="w-4 h-4 text-[#FF8A00]" />
            <span>Horodatage SHA-256 certifié par la Chambre de Commerce Sino-Africaine</span>
          </div>
        </div>

        {/* Dossier Card Envelope */}
        <div className="relative bg-white border-2 border-orange-200 rounded-3xl p-6 sm:p-8 shadow-md overflow-hidden">
          {/* Top orange luxury accent stripe */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#FF4500] via-[#FF8A00] to-[#E63900]" />

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 bg-slate-50/80 border border-slate-200/70 rounded-2xl p-5">
            <div className="flex items-start sm:items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-orange-100 text-[#FF4500] flex items-center justify-center shrink-0">
                <Ship className="w-7 h-7" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-full bg-[#FF4500] text-white text-[11px] font-black uppercase tracking-wide">
                    Dossier Complet
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-700">ID: CMD-2026-0048</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                  <span className="text-xs text-slate-500">4 documents certifiés déposés</span>
                </div>
                <h2 className="text-lg sm:text-xl font-black text-[#0B192C] tracking-tight">
                  Dossier Logistique Complet — CMD-2026-0048 (Motos Électriques 2000W)
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Conteneur 40HC • Navire: CMA CGM TANGIER • Ningbo Port → Port Autonome de Dakar (Zone Nord) • Client: Diallo Motors Dakar
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={handleDownloadDossierZip}
                className="h-11 px-5 rounded-full bg-gradient-to-r from-[#FF4500] to-[#FF8A00] hover:from-[#E03D00] hover:to-[#E67A00] text-white text-xs sm:text-sm font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Télécharger le dossier complet (.ZIP 48 Mo)</span>
              </button>
            </div>
          </div>

          {/* 4 Dossier Document Cards Inside */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
            {documents.slice(0, 4).map(doc => (
              <div
                key={doc.id}
                className="bg-slate-50/60 hover:bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-orange-100 text-[#FF4500] group-hover:bg-[#FF4500] group-hover:text-white flex items-center justify-center transition-colors">
                      {doc.category === 'freight' ? (
                        <Ship className="w-5 h-5" />
                      ) : doc.category === 'inspection' ? (
                        <Video className="w-5 h-5" />
                      ) : doc.category === 'cert' ? (
                        <ShieldCheck className="w-5 h-5" />
                      ) : (
                        <FileText className="w-5 h-5" />
                      )}
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Scellé
                    </span>
                  </div>

                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-[#0B192C] leading-snug line-clamp-2">
                      {doc.title}
                    </h3>
                    <div className="mt-1 font-mono text-[11px] text-slate-500">{doc.ref}</div>
                  </div>

                  <div className="pt-2 text-[11px] text-slate-500 space-y-1 border-t border-slate-200/60">
                    <div className="flex justify-between">
                      <span>Émetteur :</span>
                      <span className="font-semibold text-slate-800 truncate max-w-[120px]">{doc.issuer}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Format :</span>
                      <span className="font-semibold text-slate-800 font-mono">{doc.format} ({doc.size})</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Signature :</span>
                      <span className="text-[#FF4500] font-medium truncate max-w-[120px]">{doc.signature}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 flex items-center gap-2">
                  <button
                    onClick={() => handleDownloadSingle(doc)}
                    className="flex-1 h-9 rounded-full bg-white hover:bg-slate-100 border border-slate-200 text-slate-800 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-[#FF4500]" />
                    <span>Télécharger</span>
                  </button>
                  <button
                    onClick={() => setSelectedDoc(doc)}
                    className="w-9 h-9 rounded-full bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
                    title="Aperçu du document"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Complete Archives Table / Grid */}
      <div className="rounded-3xl bg-white border border-slate-200/80 p-6 sm:p-8 shadow-sm flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-[#0B192C] font-heading">
              Répertoire Général des Documents
            </h2>
            <p className="text-xs text-slate-500">
              {filteredDocs.length} acte(s) disponible(s) au téléchargement immédiat.
            </p>
          </div>
        </div>

        {/* Table representation */}
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[760px]">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                <th className="py-3 px-4 rounded-l-xl">Intitulé & Référence</th>
                <th className="py-3 px-4">Dossier</th>
                <th className="py-3 px-4">Catégorie</th>
                <th className="py-3 px-4">Émetteur</th>
                <th className="py-3 px-4">Date & Format</th>
                <th className="py-3 px-4">Validité</th>
                <th className="py-3 px-4 rounded-r-xl text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
              {filteredDocs.map(doc => (
                <tr key={doc.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-900">{doc.title}</span>
                      <span className="text-[11px] text-slate-400 font-mono">{doc.ref}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    {doc.orderId ? (
                      <span className="px-2.5 py-1 rounded-full bg-slate-100 font-mono text-xs font-bold text-slate-800">
                        {doc.orderId}
                      </span>
                    ) : (
                      <span className="text-slate-400 text-xs">-</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-xs font-medium text-slate-700">
                      {doc.category === 'freight' ? (
                        <Ship className="w-3.5 h-3.5 text-[#FF4500]" />
                      ) : doc.category === 'inspection' ? (
                        <FileCheck2 className="w-3.5 h-3.5 text-emerald-600" />
                      ) : doc.category === 'cert' ? (
                        <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                      ) : (
                        <FileText className="w-3.5 h-3.5 text-blue-600" />
                      )}
                      <span>{doc.categoryLabel}</span>
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="text-slate-700 text-xs">{doc.issuer}</span>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex flex-col">
                      <span className="text-slate-900 font-semibold">{doc.date}</span>
                      <span className="text-[11px] text-slate-400 font-mono">{doc.format} • {doc.size}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Conforme</span>
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="inline-flex items-center gap-1">
                      <button
                        onClick={() => setSelectedDoc(doc)}
                        className="p-1.5 rounded-full hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
                        title="Aperçu"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDownloadSingle(doc)}
                        className="p-1.5 rounded-full hover:bg-orange-50 text-[#FF4500] transition-colors cursor-pointer"
                        title="Télécharger"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Document Preview Modal */}
      {selectedDoc && (
        <div className="fixed inset-0 z-50 bg-[#0B192C]/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-2xl rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-slate-100 flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-orange-50 text-[#FF4500] flex items-center justify-center shrink-0">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs uppercase font-bold text-[#FF4500]">{selectedDoc.categoryLabel}</span>
                    <span className="text-xs text-slate-400 font-mono">#{selectedDoc.ref}</span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-black text-[#0B192C]">{selectedDoc.title}</h3>
                </div>
              </div>
              <button
                onClick={() => setSelectedDoc(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Simulated Official Legal Paper / Document View */}
            <div className="relative rounded-2xl bg-slate-50 border-2 border-dashed border-slate-300 p-6 flex flex-col gap-4">
              {/* Official Seal Stamp Graphic */}
              <div className="absolute right-6 top-6 w-24 h-24 rounded-full border-4 border-[#FF4500]/40 text-[#FF4500] flex flex-col items-center justify-center transform -rotate-12 pointer-events-none opacity-85 select-none font-bold">
                <span className="text-[9px] uppercase tracking-tighter">DALLOU CHINE</span>
                <span className="text-[11px] font-black tracking-wider">CERTIFIÉ</span>
                <span className="text-[8px] font-mono">PORT DAKAR</span>
              </div>

              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div>
                  <span className="text-xs text-slate-400 uppercase">Organisme Émetteur</span>
                  <div className="text-sm font-bold text-slate-900">{selectedDoc.issuer}</div>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400 uppercase">Date d'Émission</span>
                  <div className="text-sm font-bold text-slate-900">{selectedDoc.date}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-white border border-slate-200/80">
                  <span className="text-slate-400 block text-[10px] uppercase">Format</span>
                  <span className="font-bold text-slate-900 font-mono">{selectedDoc.format}</span>
                </div>
                <div className="p-3 rounded-xl bg-white border border-slate-200/80">
                  <span className="text-slate-400 block text-[10px] uppercase">Poids Fichier</span>
                  <span className="font-bold text-slate-900 font-mono">{selectedDoc.size}</span>
                </div>
                <div className="p-3 rounded-xl bg-white border border-slate-200/80">
                  <span className="text-slate-400 block text-[10px] uppercase">Statut Légal</span>
                  <span className="font-bold text-emerald-600">Archivage Scellé</span>
                </div>
                <div className="p-3 rounded-xl bg-white border border-slate-200/80">
                  <span className="text-slate-400 block text-[10px] uppercase">Dossier Lié</span>
                  <span className="font-bold text-slate-900 font-mono">{selectedDoc.orderId || 'N/A'}</span>
                </div>
              </div>

              {/* Integrity Hash */}
              <div className="p-3 rounded-xl bg-white border border-slate-200/80 space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-500 font-semibold flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    Empreinte Numérique Cryptographique (SHA-256) :
                  </span>
                  <span className="text-emerald-700 font-bold">Intégrité Validée</span>
                </div>
                <div className="font-mono text-[10px] text-slate-500 break-all bg-slate-50 p-1.5 rounded">
                  {selectedDoc.hash}
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                onClick={() => window.print()}
                className="h-11 px-4 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimer</span>
              </button>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedDoc(null)}
                  className="h-11 px-5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer transition-colors"
                >
                  Fermer
                </button>
                <button
                  onClick={() => {
                    handleDownloadSingle(selectedDoc);
                    setSelectedDoc(null);
                  }}
                  className="h-11 px-6 rounded-full bg-gradient-to-r from-[#FF4500] to-[#FF8A00] text-white text-xs font-bold shadow-md flex items-center gap-2 cursor-pointer transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>Télécharger le document</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentsPage;
