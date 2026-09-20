import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { PaymentApiClient } from '../../services/paymentApiClient';
import {
  ShieldCheck,
  Lock,
  Smartphone,
  CreditCard,
  Building,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  Info,
  AlertTriangle
} from 'lucide-react';
import {
  WaveLogo,
  OrangeMoneyLogo,
  VisaMastercardLogo,
  GeniusPayLogo,
  GeniusPayBadge
} from '../../components/common/PaymentOperatorLogos';

export const PaymentHostedSimulatorPage: React.FC = () => {
  const { navigate } = useApp();
  const searchParams = new URLSearchParams(window.location.search);
  const txId = searchParams.get('tx') || `gp_tx_${Date.now()}`;
  const orderId = searchParams.get('orderId') || '';
  const orderCode = searchParams.get('code') || 'AWP-10482';
  const amountStr = searchParams.get('amount') || '0';
  const amount = parseInt(amountStr, 10) || 0;

  const [selectedMethod, setSelectedMethod] = useState<'wave' | 'orange_money' | 'card'>('wave');
  const [phoneNumber, setPhoneNumber] = useState('77 540 22 11');
  const [isSimulating, setIsSimulating] = useState(false);

  const handlePaySuccess = async () => {
    setIsSimulating(true);
    try {
      // Déclenche le webhook côté backend avec signature HMAC réelle
      const simRes = await PaymentApiClient.simulateSandboxWebhook(orderId, 'payment_success');
      console.log('[Simulator] Sandbox webhook response:', simRes);
      setTimeout(() => {
        setIsSimulating(false);
        navigate(`/payment/success?orderId=${orderId}&tx=${txId}`);
      }, 1000);
    } catch (e) {
      console.error('[Simulator] Webhook simulation failed:', e);
      setIsSimulating(false);
      navigate(`/payment/success?orderId=${orderId}&tx=${txId}`);
    }
  };

  const handlePayFail = async () => {
    setIsSimulating(true);
    try {
      await PaymentApiClient.simulateSandboxWebhook(orderId, 'payment_failed');
      setTimeout(() => {
        setIsSimulating(false);
        navigate(`/payment/error?orderId=${orderId}&tx=${txId}`);
      }, 1000);
    } catch {
      setIsSimulating(false);
      navigate(`/payment/error?orderId=${orderId}&tx=${txId}`);
    }
  };

  const handleCancel = () => {
    navigate(`/payment/cancelled?orderId=${orderId}`);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 py-10 px-4 flex items-center justify-center -mx-4 -mt-6">
      <div className="max-w-md w-full bg-slate-800 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        {/* GeniusPay Hosted Header */}
        <div className="flex items-center justify-between border-b border-slate-700 pb-4">
          <div className="flex items-center gap-3">
            <GeniusPayLogo className="w-9 h-9" />
            <div>
              <h2 className="text-sm font-black text-white tracking-wide">GeniusPay Checkout</h2>
              <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/70 px-2 py-0.5 rounded-full border border-emerald-800/60 inline-flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Mode Sandbox Sécurisé
              </span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-400 block">Montant à payer</span>
            <strong className="text-base font-black text-emerald-400 font-mono-numeric">
              {(amount || 0).toLocaleString('fr-FR')} XOF
            </strong>
          </div>
        </div>

        {/* Notice Explicative Sandbox Importante */}
        <div className="p-3.5 rounded-2xl bg-amber-950/30 border border-amber-500/40 text-amber-200 text-xs space-y-1.5">
          <div className="flex items-center gap-2 font-bold text-amber-300">
            <Info className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Mode Test / Environnement Sandbox</span>
          </div>
          <p className="text-[11px] text-amber-200/90 leading-relaxed">
            En mode Sandbox ou avec des clés de test, <strong>aucun SMS ni code USSD réel</strong> n’est envoyé sur votre téléphone physique. Cliquez sur le bouton vert ci-dessous pour <strong>valider immédiatement</strong> la commande de démonstration.
          </p>
        </div>

        {/* Order Details */}
        <div className="bg-slate-900/60 border border-slate-700/50 rounded-2xl p-4 space-y-2 text-xs">
          <div className="flex justify-between text-slate-400">
            <span>Marchand :</span>
            <strong className="text-white">Dallou Chine SARL (SinoSenegal)</strong>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Commande :</span>
            <strong className="text-blue-400 font-mono-numeric">{orderCode}</strong>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>ID Transaction :</span>
            <span className="text-slate-300 font-mono text-[11px] truncate max-w-[180px]">{txId}</span>
          </div>
        </div>

        {/* Payment Methods Selection */}
        <div className="space-y-2.5">
          <label className="text-xs font-bold text-slate-300 block">Choisissez votre mode de paiement :</label>

          {/* Wave */}
          <div
            onClick={() => setSelectedMethod('wave')}
            className={`p-3.5 rounded-2xl border cursor-pointer flex items-center justify-between transition-all ${
              selectedMethod === 'wave'
                ? 'border-blue-500 bg-blue-950/50 text-white shadow-md'
                : 'border-slate-700 bg-slate-900/40 text-slate-300 hover:border-slate-600'
            }`}
          >
            <div className="flex items-center gap-3">
              <WaveLogo className="w-9 h-9 shadow-xs" />
              <div>
                <strong className="text-xs font-bold block text-[#1DC3FF]">Wave Digital Finance (Sénégal)</strong>
                <span className="text-[10px] text-slate-400">Paiement instantané sans frais 0%</span>
              </div>
            </div>
            {selectedMethod === 'wave' && <CheckCircle2 className="w-4 h-4 text-blue-400" />}
          </div>

          {/* Orange Money */}
          <div
            onClick={() => setSelectedMethod('orange_money')}
            className={`p-3.5 rounded-2xl border cursor-pointer flex items-center justify-between transition-all ${
              selectedMethod === 'orange_money'
                ? 'border-orange-500 bg-orange-950/50 text-white shadow-md'
                : 'border-slate-700 bg-slate-900/40 text-slate-300 hover:border-slate-600'
            }`}
          >
            <div className="flex items-center gap-3">
              <OrangeMoneyLogo className="w-9 h-9 shadow-xs" />
              <div>
                <strong className="text-xs font-bold block text-[#FF7900]">Orange Money Sénégal (OM)</strong>
                <span className="text-[10px] text-slate-400">Validation via code secret #144# ou Maxit</span>
              </div>
            </div>
            {selectedMethod === 'orange_money' && <CheckCircle2 className="w-4 h-4 text-orange-400" />}
          </div>

          {/* Carte Bancaire */}
          <div
            onClick={() => setSelectedMethod('card')}
            className={`p-3.5 rounded-2xl border cursor-pointer flex items-center justify-between transition-all ${
              selectedMethod === 'card'
                ? 'border-blue-500 bg-slate-800/80 text-white shadow-md'
                : 'border-slate-700 bg-slate-900/40 text-slate-300 hover:border-slate-600'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center text-white border border-slate-600 shrink-0">
                <CreditCard className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <strong className="text-xs font-bold block">Carte Visa / Mastercard</strong>
                  <VisaMastercardLogo className="h-5" />
                </div>
                <span className="text-[10px] text-slate-400">Authentification 3D Secure</span>
              </div>
            </div>
            {selectedMethod === 'card' && <CheckCircle2 className="w-4 h-4 text-blue-400" />}
          </div>
        </div>

        {/* Action Form */}
        <div className="space-y-3 pt-2">
          {selectedMethod !== 'card' && (
            <div className="space-y-1">
              <label className="text-[11px] text-slate-400 font-bold">Numéro de téléphone mobile :</label>
              <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs">
                <span className="text-slate-400 font-bold">+221</span>
                <input
                  type="text"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="bg-transparent text-white font-mono-numeric outline-hidden flex-1"
                />
              </div>
            </div>
          )}

          {/* Sandbox Test Actions */}
          <div className="space-y-2 pt-2">
            <button
              disabled={isSimulating}
              onClick={handlePaySuccess}
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs py-3.5 px-4 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {isSimulating ? (
                <span>Validation sécurisée...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirmer et Valider ({(amount || 0).toLocaleString('fr-FR')} XOF)</span>
                </>
              )}
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                disabled={isSimulating}
                onClick={handlePayFail}
                className="bg-rose-950/60 hover:bg-rose-900/80 border border-rose-800/60 text-rose-300 text-[11px] font-bold py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Simuler Échec</span>
              </button>

              <button
                disabled={isSimulating}
                onClick={handleCancel}
                className="bg-slate-700/60 hover:bg-slate-700 text-slate-300 text-[11px] font-bold py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Annuler</span>
              </button>
            </div>
          </div>
        </div>

        {/* Security Footer */}
        <div className="pt-2 border-t border-slate-700/60 flex items-center justify-center gap-2 text-[10px] text-slate-400">
          <Lock className="w-3 h-3 text-emerald-400" />
          <span>Page de paiement cryptée TLS 1.3 certifiée GeniusPay</span>
        </div>
      </div>
    </div>
  );
};
