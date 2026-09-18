import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { PaymentApiClient, ClientPaymentStatusResponse } from '../../services/paymentApiClient';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  ArrowRight,
  RotateCw,
  Package,
  ShieldCheck,
  CreditCard,
  Building
} from 'lucide-react';

interface PaymentStatusPageProps {
  initialStatus?: 'success' | 'pending' | 'error' | 'cancelled';
}

export const PaymentStatusPage: React.FC<PaymentStatusPageProps> = () => {
  const { navigate, updateOrderStatus } = useApp();

  const [searchParams] = useState(() => new URLSearchParams(window.location.search));
  const orderId = searchParams.get('orderId') || searchParams.get('id') || '';
  const paymentId = searchParams.get('paymentId') || '';

  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<ClientPaymentStatusResponse | null>(null);
  const [pollCount, setPollCount] = useState<number>(0);

  const checkStatus = async () => {
    if (!orderId && !paymentId) {
      setLoading(false);
      return;
    }

    try {
      const res = await PaymentApiClient.getPaymentStatus(orderId || paymentId);
      setData(res);

      // Si le paiement est validé, on synchronise le contexte local également
      if (res.success && res.order?.paymentStatus === 'paid') {
        if (res.order.id) {
          updateOrderStatus(res.order.id, 'payment_received', 'Paiement confirmé via GeniusPay');
        }
        setLoading(false);
        return;
      }
    } catch (err) {
      console.warn('[PaymentStatusPage] Verification check error:', err);
    }

    setLoading(false);
  };

  useEffect(() => {
    checkStatus();

    // Polling pendant 20 secondes si le paiement est en attente (temps de réception du webhook)
    const interval = setInterval(() => {
      setPollCount((prev) => {
        if (prev < 8) {
          checkStatus();
          return prev + 1;
        }
        clearInterval(interval);
        return prev;
      });
    }, 2500);

    return () => clearInterval(interval);
  }, [orderId, paymentId]);

  const paymentStatus = data?.order?.paymentStatus || data?.payment?.status || 'pending';
  const orderCode = data?.order?.trackingCode || data?.payment?.orderCode || orderId || 'AWP-N/A';
  const totalXOF = data?.order?.totalXOF || data?.payment?.amount || 0;

  return (
    <div className="max-w-2xl mx-auto py-12 px-4 space-y-6">
      <div className="glass-panel bg-white/95 rounded-3xl p-8 border border-white shadow-xl text-center space-y-6">
        {/* Loading State */}
        {loading ? (
          <div className="py-12 space-y-4">
            <div className="w-16 h-16 rounded-full border-4 border-blue-100 border-t-[#2A6DFF] animate-spin mx-auto" />
            <h2 className="text-xl font-black text-[#0D2C7A]">Vérification du paiement en cours...</h2>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Nous vérifions la confirmation de transaction auprès de la passerelle GeniusPay et des opérateurs Mobile Money.
            </p>
          </div>
        ) : paymentStatus === 'paid' ? (
          /* Success Paid State */
          <div className="space-y-5 animate-in fade-in zoom-in duration-300">
            <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-12 h-12" />
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                Paiement Sécurisé Confirmé
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-[#0D2C7A]">Merci pour votre commande !</h1>
              <p className="text-sm text-slate-600 max-w-lg mx-auto">
                Votre transaction a été validée par notre système. La commande a été transmise à notre équipe logistique en Chine.
              </p>
            </div>

            {/* Recap Box */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-left space-y-3 text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="text-slate-500">Numéro de suivi AWP :</span>
                <strong className="text-base font-black text-[#2A6DFF] font-mono-numeric">{orderCode}</strong>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Montant total réglé :</span>
                <strong className="text-sm font-black text-slate-800 font-mono-numeric">
                  {(totalXOF || 0).toLocaleString('fr-FR')} FCFA
                </strong>
              </div>
              {data?.payment?.providerReference && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Référence GeniusPay :</span>
                  <span className="font-mono text-slate-700">{data.payment.providerReference}</span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Statut commande :</span>
                <span className="text-emerald-700 font-bold bg-emerald-100/70 px-2 py-0.5 rounded text-[11px]">
                  En préparation usine
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => navigate(`/tracking?code=${orderCode}`)}
                className="bg-gradient-to-r from-[#0D2C7A] to-[#2A6DFF] hover:from-[#2A6DFF] hover:to-blue-600 text-white text-xs font-bold px-6 py-3.5 rounded-xl shadow-lg flex items-center justify-center gap-2"
              >
                <Package className="w-4 h-4" />
                <span>Suivre mon colis AWP</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => navigate('/account')}
                className="bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-bold px-6 py-3.5 rounded-xl shadow-xs"
              >
                Voir dans mon compte
              </button>
            </div>
          </div>
        ) : paymentStatus === 'failed' || paymentStatus === 'cancelled' ? (
          /* Failed / Cancelled State */
          <div className="space-y-5">
            <div className="w-20 h-20 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-inner">
              <XCircle className="w-12 h-12" />
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-600 bg-rose-50 px-3 py-1 rounded-full border border-rose-200">
                {paymentStatus === 'cancelled' ? 'Paiement Annulé' : 'Paiement non finalisé'}
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-[#0D2C7A]">Le paiement n'a pas pu aboutir</h1>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                La transaction n'a pas été débitée. Vous pouvez relancer le paiement en toute sécurité ou choisir un autre moyen.
              </p>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => navigate('/checkout')}
                className="bg-[#0D2C7A] hover:bg-[#2A6DFF] text-white text-xs font-bold px-6 py-3.5 rounded-xl shadow-md flex items-center justify-center gap-2"
              >
                <RotateCw className="w-4 h-4" />
                <span>Réessayer le paiement</span>
              </button>

              <button
                onClick={() => navigate('/cart')}
                className="bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-bold px-6 py-3.5 rounded-xl"
              >
                Retour au panier
              </button>
            </div>
          </div>
        ) : (
          /* Pending State */
          <div className="space-y-5">
            <div className="w-20 h-20 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto shadow-inner">
              <Clock className="w-12 h-12 animate-pulse" />
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                En attente de confirmation
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-[#0D2C7A]">Paiement en cours de validation</h1>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Si vous avez validé votre code sur votre téléphone (Wave ou Orange Money), votre commande sera automatiquement mise à jour dès réception de l'accusé de réception.
              </p>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => {
                  setLoading(true);
                  checkStatus();
                }}
                className="bg-[#0D2C7A] hover:bg-[#2A6DFF] text-white text-xs font-bold px-6 py-3.5 rounded-xl shadow-md flex items-center justify-center gap-2"
              >
                <RotateCw className="w-4 h-4" />
                <span>Actualiser le statut</span>
              </button>

              <button
                onClick={() => navigate(`/tracking?code=${orderCode}`)}
                className="bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-bold px-6 py-3.5 rounded-xl"
              >
                Aller au suivi colis
              </button>
            </div>
          </div>
        )}

        {/* Security Trust Footer */}
        <div className="pt-6 border-t border-slate-100 flex items-center justify-center gap-4 text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Paiement certifié 256-bit SSL</span>
          </div>
          <span>•</span>
          <div className="flex items-center gap-1.5">
            <Building className="w-4 h-4 text-[#2A6DFF]" />
            <span>Passerelle GeniusPay Sénégal</span>
          </div>
        </div>
      </div>
    </div>
  );
};
