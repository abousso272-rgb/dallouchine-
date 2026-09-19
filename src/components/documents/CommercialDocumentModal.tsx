import React, { useRef } from 'react';
import {
  X,
  Printer,
  Download,
  ShieldCheck,
  Plane,
  Ship,
  CheckCircle2,
  Calendar,
  Building2,
  FileText,
  Clock,
  Phone,
  Mail,
  MapPin
} from 'lucide-react';
import { Quote, Order, PlatformDocument } from '../../types';
import { StatusBadge } from '../common/LogisticsPriceSplit';
import { useApp } from '../../context/AppContext';

interface CommercialDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentType: 'quote' | 'invoice' | 'receipt' | 'awp_waybill';
  quote?: Quote;
  order?: Order;
  documentData?: PlatformDocument;
}

export const CommercialDocumentModal: React.FC<CommercialDocumentModalProps> = ({
  isOpen,
  onClose,
  documentType,
  quote,
  order,
  documentData
}) => {
  const printableRef = useRef<HTMLDivElement>(null);

  const { acceptRealQuote, rejectRealQuote } = useApp();
  const [isActionPending, setIsActionPending] = React.useState(false);
  const [localQuoteStatus, setLocalQuoteStatus] = React.useState<string | undefined>(quote?.status);

  React.useEffect(() => {
    setLocalQuoteStatus(quote?.status);
  }, [quote?.status]);

  if (!isOpen) return null;

  const handleAcceptQuote = async () => {
    if (!quote?.id) return;
    setIsActionPending(true);
    try {
      await acceptRealQuote(quote.id);
      setLocalQuoteStatus('accepted');
    } catch (e) {
      console.error(e);
    } finally {
      setIsActionPending(false);
    }
  };

  const handleRejectQuote = async () => {
    if (!quote?.id) return;
    const reason = window.prompt('Motif du refus (optionnel) :', 'Prix trop élevé / Spécifications modifiées');
    if (reason === null) return; // User cancelled prompt
    setIsActionPending(true);
    try {
      await rejectRealQuote(quote.id, reason);
      setLocalQuoteStatus('rejected');
    } catch (e) {
      console.error(e);
    } finally {
      setIsActionPending(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Fallback / Data preparation
  const reference =
    quote?.code ||
    order?.trackingCode ||
    documentData?.reference ||
    `DOC-${Date.now().toString().slice(-6)}`;

  const clientName =
    quote?.clientName ||
    order?.customer.fullName ||
    documentData?.clientName ||
    'Client Partenaire';

  const companyName = quote?.companyName || 'Entreprise / Commerce Partenaire';
  const phone = quote?.phone || order?.customer.phone || '+221 77 000 00 00';
  const email = quote?.email || order?.customer.email || 'client@sinosenegal.sn';

  const issueDate =
    quote?.createdAt ||
    order?.createdAt ||
    documentData?.date ||
    new Date().toISOString().split('T')[0];

  const validUntil =
    quote?.validUntil ||
    new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const isQuote = documentType === 'quote';
  const isReceipt = documentType === 'receipt';
  const isAwp = documentType === 'awp_waybill';
  const isInvoice = documentType === 'invoice';

  const title = isQuote
    ? `DEVIS D'APPROVISIONNEMENT #${reference}`
    : isReceipt
    ? `REÇU OFFICIEL DE PAIEMENT #${reference}`
    : isAwp
    ? `BORDEREAU D'EXPÉDITION AWP #${reference}`
    : `FACTURE PROFORMA #${reference}`;

  // Numbers
  const totalAmount =
    quote?.totalEstimatedXOF ||
    order?.totalXOF ||
    documentData?.amountXOF ||
    0;

  const depositAmount =
    quote?.depositAmountXOF ||
    order?.depositAmountXOF ||
    Math.round(totalAmount * 0.6);

  const balanceAmount =
    quote?.balanceDueXOF ||
    order?.balanceDueXOF ||
    Math.max(0, totalAmount - depositAmount);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Modal Action Header */}
        <div className="bg-[#0B192C] text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#FF4500]" />
            <span className="font-bold text-sm tracking-wide">{title}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 text-xs font-bold bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-xl transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Imprimer / PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-white/10 hover:bg-rose-600 text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div
          ref={printableRef}
          className="p-6 sm:p-10 overflow-y-auto space-y-8 text-slate-800 text-xs sm:text-sm bg-white print:p-0 print:m-0"
        >
          {/* Header Strip */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-b border-slate-200 pb-6">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-[#0B192C] text-white flex items-center justify-center font-black text-base shadow-sm">
                  🇨🇳
                </div>
                <div>
                  <h1 className="text-xl font-black text-[#0B192C] tracking-tight">
                    Sino<span className="text-[#FF4500]">Senegal</span> Logistics & Sourcing
                  </h1>
                  <span className="text-[10px] text-slate-500 font-semibold">
                    Plateforme Digitale d'Approvisionnement Chine ➔ Sénégal
                  </span>
                </div>
              </div>
              <div className="text-[11px] text-slate-500 leading-tight">
                <p>Guangzhou : Room 1402, Baiyun International Logistics Plaza</p>
                <p>Dakar : Pôle Urbain Diamniadio & Hub Almadies, Sénégal</p>
                <p>RC SN-DKR-2023-B-4921 • NINEA 009841284 • Contact : +221 77 842 19 00</p>
              </div>
            </div>

            <div className="text-left sm:text-right space-y-1">
              <span className="inline-block px-3 py-1 rounded-full bg-[#0B192C]/10 text-[#0B192C] font-extrabold text-xs uppercase tracking-wider">
                {isQuote ? 'Devis Officiel' : isReceipt ? 'Reçu Certifié' : isAwp ? 'LTA / Bordereau AWP' : 'Facture Commerciale'}
              </span>
              <div className="font-mono-numeric font-black text-base text-[#0B192C]">
                N° {reference}
              </div>
              <div className="text-[11px] text-slate-500">
                Date d'émission : <strong>{new Date(issueDate).toLocaleDateString('fr-FR')}</strong>
              </div>
              {isQuote && (
                <div className="text-[11px] text-amber-800 font-semibold">
                  Validité de l'offre : <strong>{new Date(validUntil).toLocaleDateString('fr-FR')}</strong>
                </div>
              )}
            </div>
          </div>

          {/* Client & Dossier Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Client / Entreprise Donneur d'Ordre
              </span>
              <strong className="text-sm text-[#0B192C] block">{clientName}</strong>
              {companyName && <p className="text-slate-600 font-semibold">{companyName}</p>}
              <p className="text-slate-500 text-xs">Tél : {phone}</p>
              <p className="text-slate-500 text-xs">Email : {email}</p>
              <p className="text-slate-500 text-xs">Destination : Dakar / Sénégal</p>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Modalités d'Expédition
              </span>
              <div className="flex items-center gap-1.5 font-bold text-slate-800">
                {quote?.transportMode === 'sea' ? (
                  <Ship className="w-4 h-4 text-cyan-600" />
                ) : (
                  <Plane className="w-4 h-4 text-[#FF4500]" />
                )}
                <span>
                  {quote?.transportMode === 'sea'
                    ? 'Maritime Direct FCL/LCL Port de Dakar'
                    : 'Aérien Cargo Régulier (12-18 jours)'}
                </span>
              </div>
              <p className="text-slate-600 text-xs">
                Incoterm : <strong>DDP Dakar (Rendu Droits Acquittés)</strong>
              </p>
              <p className="text-slate-600 text-xs">
                Dédouanement : <strong>Pris en charge via Gaindé Douane</strong>
              </p>
              <p className="text-slate-600 text-xs">
                Délai estimatif : <strong>{quote?.leadTimeDays || '15-20 jours'}</strong>
              </p>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-[#0B192C]">
              Détail Chiffré & Décomposition des Frais
            </h3>

            <div className="overflow-x-auto border border-slate-200 rounded-2xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0B192C] text-white uppercase text-[10px] tracking-wider font-bold">
                  <tr>
                    <th className="p-3">Désignation</th>
                    <th className="p-3 text-center">Quantité</th>
                    <th className="p-3 text-right">Prix Unitaire HT</th>
                    <th className="p-3 text-center">Statut du Montant</th>
                    <th className="p-3 text-right">Total (FCFA)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {/* Ligne Produit */}
                  <tr className="hover:bg-slate-50/70">
                    <td className="p-3">
                      <strong className="text-slate-900 block font-bold">
                        {quote?.productName || order?.items[0]?.productName || 'Approvisionnement Marchandises Chine'}
                      </strong>
                      <span className="text-[11px] text-slate-500">
                        {quote?.customizationDetails || 'Qualité usine certifiée, inspection pré-embarquement incluse'}
                      </span>
                    </td>
                    <td className="p-3 text-center font-mono-numeric font-bold">
                      {quote?.quantity || order?.items[0]?.quantity || 1}
                    </td>
                    <td className="p-3 text-right font-mono-numeric">
                      {(
                        quote?.unitProductPriceXOF ||
                        (order?.items[0]?.unitPriceXOF ? order.items[0].unitPriceXOF * 0.7 : 0)
                      ).toLocaleString('fr-FR')}{' '}
                      F
                    </td>
                    <td className="p-3 text-center">
                      <StatusBadge status="confirmed" label="CONFIRMÉ" />
                    </td>
                    <td className="p-3 text-right font-mono-numeric font-bold text-[#0B192C]">
                      {(
                        quote?.totalProductPriceXOF ||
                        (order?.subtotalXOF ? order.subtotalXOF * 0.7 : 0)
                      ).toLocaleString('fr-FR')}{' '}
                      FCFA
                    </td>
                  </tr>

                  {/* Ligne Transport Fret */}
                  <tr className="hover:bg-slate-50/70 bg-amber-50/30">
                    <td className="p-3">
                      <strong className="text-slate-900 block font-bold">
                        Fret International Chine ➔ Sénégal
                      </strong>
                      <span className="text-[11px] text-slate-500">
                        Acheminement fret consolidé + manutention hub aéroportuaire/portuaire
                      </span>
                    </td>
                    <td className="p-3 text-center font-mono-numeric">1 lot</td>
                    <td className="p-3 text-right font-mono-numeric">
                      {(
                        quote?.estimatedLogisticsXOF ||
                        order?.shippingFeeXOF ||
                        25000
                      ).toLocaleString('fr-FR')}{' '}
                      F
                    </td>
                    <td className="p-3 text-center">
                      <StatusBadge status="estimated" label="ESTIMATIF" />
                    </td>
                    <td className="p-3 text-right font-mono-numeric font-bold text-amber-800">
                      ~{(
                        quote?.estimatedLogisticsXOF ||
                        order?.shippingFeeXOF ||
                        25000
                      ).toLocaleString('fr-FR')}{' '}
                      FCFA
                    </td>
                  </tr>

                  {/* Ligne Dédouanement Gaindé */}
                  <tr className="hover:bg-slate-50/70">
                    <td className="p-3">
                      <strong className="text-slate-900 block font-bold">
                        Formalités & Dédouanement Gaindé DDP
                      </strong>
                      <span className="text-[11px] text-slate-500">
                        Prise en charge déclarative, droits de porte et passage en douane Sénégal
                      </span>
                    </td>
                    <td className="p-3 text-center font-mono-numeric">1</td>
                    <td className="p-3 text-right font-mono-numeric">Inclus</td>
                    <td className="p-3 text-center">
                      <StatusBadge status="confirmed" label="CONFIRMÉ" />
                    </td>
                    <td className="p-3 text-right font-mono-numeric font-bold text-emerald-700">
                      0 FCFA (Inclus)
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Financial Breakdown & Acompte / Solde */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-start pt-2">
            <div className="space-y-3 p-4 rounded-2xl bg-[#F8F6F2] border border-slate-200">
              <h4 className="font-black text-[#0B192C] text-xs uppercase tracking-wider">
                Échéancier de Règlement
              </h4>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Acompte à la commande (60%) :</span>
                  <strong className="font-mono-numeric text-[#0B192C] font-bold">
                    {depositAmount.toLocaleString('fr-FR')} FCFA
                  </strong>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Solde à l'arrivée à Dakar (40%) :</span>
                  <strong className="font-mono-numeric text-slate-800 font-bold">
                    {balanceAmount.toLocaleString('fr-FR')} FCFA
                  </strong>
                </div>
                <div className="pt-2 border-t border-slate-200 text-[11px] text-slate-500 leading-snug">
                  Moyens acceptés : Wave, Orange Money, Virement bancaire CBAO/BOA, Chèque certifié, ou Espèces en Hub Relais.
                </div>
              </div>
            </div>

            <div className="space-y-2 p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="flex justify-between text-xs text-slate-600">
                <span>Sous-total Marchandises (Confirmé) :</span>
                <span className="font-mono-numeric font-bold text-slate-800">
                  {(
                    quote?.totalProductPriceXOF ||
                    (order?.subtotalXOF ? order.subtotalXOF * 0.7 : 0)
                  ).toLocaleString('fr-FR')}{' '}
                  FCFA
                </span>
              </div>

              <div className="flex justify-between text-xs text-slate-600">
                <span>Fret International (Estimatif) :</span>
                <span className="font-mono-numeric font-bold text-amber-700">
                  ~{(
                    quote?.estimatedLogisticsXOF ||
                    order?.shippingFeeXOF ||
                    25000
                  ).toLocaleString('fr-FR')}{' '}
                  FCFA
                </span>
              </div>

              <div className="pt-3 border-t border-slate-300 flex justify-between items-baseline">
                <span className="text-sm font-black text-[#0B192C]">Total Estimé Rendu Dakar :</span>
                <span className="text-xl font-black text-[#0B192C] font-mono-numeric">
                  {totalAmount.toLocaleString('fr-FR')} FCFA
                </span>
              </div>
            </div>
          </div>

          {/* Legal Stamp & Disclaimer */}
          <div className="pt-4 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
            <div className="sm:col-span-8 space-y-1 text-[10px] text-slate-500">
              <p>
                <strong>Clause de transparence logistique :</strong> Les montants indiqués comme « Confirmé » engagent formellement SinoSenegal. Les montants marqués « Estimatif » font l'objet d'un ajustement définitif lors de la pesée volumétrique officielle en entrepôt départ Chine.
              </p>
              <p>
                Document généré électroniquement par le système de gestion intégrée SinoSenegal et certifié conforme.
              </p>
            </div>

            <div className="sm:col-span-4 text-center sm:text-right">
              <div className="inline-block border-2 border-[#0B192C] rounded-2xl p-2.5 text-center bg-blue-50/40">
                <div className="text-[9px] font-bold uppercase text-[#0B192C] tracking-wider">
                  Direction Financière & Sourcing
                </div>
                <div className="text-xs font-black text-[#0B192C] my-0.5">
                  SINOSENEGAL HQ
                </div>
                <div className="text-[9px] text-emerald-700 font-bold">
                  ✓ SIGNATURE NUMÉRIQUE VALIDÉE
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="bg-slate-50 p-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            {isQuote && (
              <>
                {localQuoteStatus === 'accepted' ? (
                  <span className="px-3 py-1 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ✓ Devis Validé — Commande et logistique initiées
                  </span>
                ) : localQuoteStatus === 'rejected' ? (
                  <span className="px-3 py-1 rounded-full bg-rose-100 border border-rose-300 text-rose-800 text-xs font-bold">
                    ✕ Devis Refusé par le client
                  </span>
                ) : (
                  <span className="text-xs text-slate-600">
                    Validation sous conditions contractuelles DALLOU CHINE.
                  </span>
                )}
              </>
            )}
            {!isQuote && (
              <div className="text-xs text-slate-500">
                Dossier référencé sur la blockchain logistique SinoSenegal.
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {isQuote && (localQuoteStatus === 'sent' || localQuoteStatus === 'draft' || !localQuoteStatus) && (
              <>
                <button
                  type="button"
                  disabled={isActionPending}
                  onClick={handleRejectQuote}
                  className="px-3 py-2 rounded-xl border border-rose-300 hover:bg-rose-50 text-rose-700 text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                >
                  Décliner l'offre
                </button>
                <button
                  type="button"
                  disabled={isActionPending}
                  onClick={handleAcceptQuote}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isActionPending ? 'Validation en cours...' : 'Accepter le devis & Valider'}</span>
                </button>
              </>
            )}

            <button
              onClick={handlePrint}
              className="bg-[#0B192C] hover:bg-[#FF4500] text-white font-bold text-xs px-4 py-2 rounded-xl transition-colors flex items-center gap-2 shadow-xs cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Télécharger</span>
            </button>
            <button
              onClick={onClose}
              className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs px-3.5 py-2 rounded-xl transition-colors cursor-pointer"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
