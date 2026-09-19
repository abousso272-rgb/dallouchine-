import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { AdminRole } from '../../types';
import {
  User,
  ShieldCheck,
  Phone,
  Mail,
  Lock,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  ShoppingBag,
  Building,
  KeyRound,
  Plane,
  Truck,
  Layers,
  HelpCircle
} from 'lucide-react';

interface UnifiedAuthFormProps {
  defaultTab?: 'client' | 'admin';
  onSuccess?: () => void;
  title?: string;
  subtitle?: string;
  redirectTo?: string;
}

export const UnifiedAuthForm: React.FC<UnifiedAuthFormProps> = ({
  defaultTab = 'client',
  onSuccess,
  title,
  subtitle,
  redirectTo
}) => {
  const { loginUser, registerUser, resetPassword, navigate } = useApp();

  const [activeTab, setActiveTab] = useState<'client' | 'admin'>(defaultTab);
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Client form state
  const [clientIdentifier, setClientIdentifier] = useState('amadou.diallo@gmail.com');
  const [clientPassword, setClientPassword] = useState('Password123!');
  const [clientName, setClientName] = useState('Amadou Diallo');
  const [clientCity, setClientCity] = useState('Dakar');
  const [rememberMe, setRememberMe] = useState(true);

  // Admin form state
  const [adminEmail, setAdminEmail] = useState('admin@sinosenegal.sn');
  const [adminPassword, setAdminPassword] = useState('AdminPassword2026!');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');

  // Handle Client Login / Register via Supabase Auth
  const handleClientSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setInfoMsg('');

    if (!clientIdentifier.trim()) {
      setErrorMsg('Veuillez renseigner votre email ou votre numéro de téléphone.');
      return;
    }
    if (!clientPassword.trim()) {
      setErrorMsg('Veuillez saisir votre mot de passe.');
      return;
    }

    setIsLoading(true);

    if (isRegisterMode) {
      const isEmail = clientIdentifier.includes('@');
      const res = await registerUser({
        email: isEmail ? clientIdentifier : undefined,
        phone: !isEmail ? clientIdentifier : undefined,
        password: clientPassword,
        fullName: clientName || 'Nouveau Client',
        city: clientCity
      });
      setIsLoading(false);

      if (res.success) {
        if (onSuccess) {
          onSuccess();
        } else if (redirectTo) {
          navigate(redirectTo);
        } else {
          navigate('/account');
        }
      } else {
        setErrorMsg(res.error || 'Erreur lors de l\'inscription.');
      }
    } else {
      const res = await loginUser({
        identifier: clientIdentifier,
        password: clientPassword,
        role: 'client'
      });
      setIsLoading(false);

      if (res.success) {
        if (onSuccess) {
          onSuccess();
        } else if (redirectTo) {
          navigate(redirectTo);
        } else {
          navigate('/account');
        }
      } else {
        setErrorMsg(res.error || 'Identifiant ou mot de passe incorrect.');
      }
    }
  };

  // Handle Admin Login via Supabase Auth
  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setInfoMsg('');

    if (!adminEmail.trim() || !adminPassword.trim()) {
      setErrorMsg('Identifiant et mot de passe administrateur requis.');
      return;
    }

    setIsLoading(true);
    const res = await loginUser({
      identifier: adminEmail,
      password: adminPassword,
      role: 'admin'
    });
    setIsLoading(false);

    if (res.success) {
      if (onSuccess) {
        onSuccess();
      } else if (redirectTo) {
        navigate(redirectTo);
      } else {
        navigate('/admin');
      }
    } else {
      setErrorMsg(res.error || 'Accès refusé. Vérifiez vos identifiants administrateur.');
    }
  };

  // Handle Forgot Password via Supabase Auth
  const handleForgotPassword = async () => {
    setErrorMsg('');
    setInfoMsg('');
    if (!clientIdentifier.trim()) {
      setErrorMsg('Veuillez d\'abord saisir votre email ou numéro ci-dessus.');
      return;
    }
    setIsLoading(true);
    const res = await resetPassword(clientIdentifier);
    setIsLoading(false);
    if (res.success) {
      setInfoMsg('Un lien de réinitialisation sécurisé a été généré via Supabase Auth.');
    } else {
      setErrorMsg(res.error || 'Échec de l\'envoi de réinitialisation.');
    }
  };

  // Quick 1-Click Demo Logins (Connected to real Supabase test accounts)
  const handleQuickDemoClient = async () => {
    setClientIdentifier('amadou.diallo@gmail.com');
    setClientPassword('Password123!');
    setIsLoading(true);
    setErrorMsg('');
    setInfoMsg('');
    const res = await loginUser({
      identifier: 'amadou.diallo@gmail.com',
      password: 'Password123!',
      role: 'client'
    });
    setIsLoading(false);
    if (res.success) {
      if (onSuccess) onSuccess();
      else if (redirectTo) navigate(redirectTo);
      else navigate('/account');
    } else {
      setErrorMsg(res.error || 'Échec de connexion rapide client.');
    }
  };

  const handleQuickDemoAdmin = async () => {
    setAdminEmail('admin@sinosenegal.sn');
    setAdminPassword('AdminPassword2026!');
    setIsLoading(true);
    setErrorMsg('');
    setInfoMsg('');
    const res = await loginUser({
      identifier: 'admin@sinosenegal.sn',
      password: 'AdminPassword2026!',
      role: 'admin'
    });
    setIsLoading(false);
    if (res.success) {
      if (onSuccess) onSuccess();
      else if (redirectTo) navigate(redirectTo);
      else navigate('/admin');
    } else {
      setErrorMsg(res.error || 'Échec de connexion rapide administrateur.');
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto">
      <div className="glass-panel bg-white/95 backdrop-blur-2xl rounded-3xl p-6 sm:p-9 border border-white shadow-2xl space-y-6">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FF4500]/10 text-[#0B192C] text-xs font-black uppercase tracking-wider mb-1">
            <Plane className="w-3.5 h-3.5 -rotate-45 text-[#FF4500]" />
            <span>Portail Unique SinoSenegal</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-[#0B192C] tracking-tight">
            {title || (activeTab === 'client' ? 'Espace Client & Suivi AWP' : 'Espace Administrateur & Logistique')}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
            {subtitle || (activeTab === 'client'
              ? 'Connectez-vous pour suivre vos commandes, vos participations aux groupages et vos adresses de retrait à Dakar.'
              : 'Connexion sécurisée pour la gestion des lots, du sourcing 1688, du fret aérien/maritime et des finances.')}
          </p>
        </div>

        {/* UNIFIED TAB SELECTOR (CLIENT vs ADMIN) */}
        <div className="grid grid-cols-2 p-1.5 rounded-2xl bg-slate-100/90 border border-slate-200 gap-1.5 shadow-inner">
          <button
            type="button"
            onClick={() => {
              setActiveTab('client');
              setErrorMsg('');
            }}
            className={`py-3 px-3 rounded-xl text-xs sm:text-sm font-extrabold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'client'
                ? 'bg-[#0B192C] text-white shadow-md'
                : 'text-slate-600 hover:text-[#0B192C] hover:bg-white/60'
            }`}
          >
            <User className="w-4 h-4 shrink-0" />
            <span>Espace Client</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('admin');
              setErrorMsg('');
            }}
            className={`py-3 px-3 rounded-xl text-xs sm:text-sm font-extrabold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'admin'
                ? 'bg-[#0B192C] text-white shadow-md'
                : 'text-slate-600 hover:text-[#0B192C] hover:bg-white/60'
            }`}
          >
            <ShieldCheck className="w-4 h-4 shrink-0 text-[#FF4500]" />
            <span>Espace Administrateur</span>
          </button>
        </div>

        {/* Error Notification */}
        {errorMsg && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2.5 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Info Notification */}
        {infoMsg && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2.5 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{infoMsg}</span>
          </div>
        )}

        {/* TAB 1: CLIENT AUTH FORM */}
        {activeTab === 'client' && (
          <form onSubmit={handleClientSubmit} className="space-y-4">
            {/* Mode Toggle (Login vs Register) */}
            <div className="flex items-center justify-between pb-1 text-xs">
              <span className="font-bold text-slate-700">
                {isRegisterMode ? 'Créer un nouveau compte' : 'Accéder à mon compte'}
              </span>
              <button
                type="button"
                onClick={() => setIsRegisterMode(!isRegisterMode)}
                className="text-[#FF4500] hover:text-[#0B192C] font-extrabold hover:underline"
              >
                {isRegisterMode ? 'Déjà inscrit ? Se connecter' : 'Nouveau ? Créer un compte'}
              </button>
            </div>

            {/* Name Field (if register) */}
            {isRegisterMode && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Nom et Prénom *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={clientName}
                    onChange={e => setClientName(e.target.value)}
                    placeholder="Ex: Fatou Sow"
                    className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 text-xs sm:text-sm text-slate-800 focus:outline-hidden focus:border-[#FF4500] shadow-xs"
                    required
                  />
                </div>
              </div>
            )}

            {/* Phone or Email */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Numéro de Téléphone Sénégal (Wave / OM) ou Email *
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                  <Phone className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={clientIdentifier}
                  onChange={e => setClientIdentifier(e.target.value)}
                  placeholder="+221 77 000 00 00 ou email@exemple.sn"
                  className="w-full bg-white border border-slate-200 rounded-2xl pl-10 pr-4 py-3 text-xs sm:text-sm text-slate-800 font-semibold focus:outline-hidden focus:border-[#FF4500] shadow-xs"
                  required
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Utilisé pour recevoir vos avis de retrait Hub par SMS/WhatsApp.
              </p>
            </div>

            {/* City (if register) */}
            {isRegisterMode && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Ville / Région de Retrait *
                </label>
                <select
                  value={clientCity}
                  onChange={e => setClientCity(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 text-xs sm:text-sm text-slate-800 font-semibold focus:outline-hidden focus:border-[#FF4500] shadow-xs"
                >
                  <option value="Dakar">Dakar (Hub Ouest Foire / Sandaga / Almadies)</option>
                  <option value="Pikine / Guédiawaye">Pikine & Banlieue</option>
                  <option value="Rufisque / Diamniadio">Rufisque & Diamniadio</option>
                  <option value="Thiès">Thiès (Hub Régional)</option>
                  <option value="Mbour">Mbour & Petite Côte</option>
                  <option value="Saint-Louis">Saint-Louis</option>
                  <option value="Touba">Touba / Diourbel</option>
                </select>
              </div>
            )}

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Mot de passe *
                </label>
                {!isRegisterMode && (
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-[11px] text-slate-400 hover:text-[#FF4500] cursor-pointer"
                  >
                    Mot de passe oublié ?
                  </button>
                )}
              </div>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={clientPassword}
                  onChange={e => setClientPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white border border-slate-200 rounded-2xl pl-10 pr-10 py-3 text-xs sm:text-sm text-slate-800 font-semibold focus:outline-hidden focus:border-[#FF4500] shadow-xs"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="rememberClient"
                checked={rememberMe}
                onChange={e => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded text-[#FF4500] focus:ring-[#FF4500]"
              />
              <label htmlFor="rememberClient" className="text-xs text-slate-600 font-medium cursor-pointer">
                Rester connecté sur cet appareil
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-6 rounded-2xl bg-[#0B192C] hover:bg-[#1B2A47] text-white font-extrabold text-xs sm:text-sm shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <span>Connexion en cours...</span>
              ) : (
                <>
                  <span>{isRegisterMode ? 'Créer mon compte client' : 'Se connecter à mon Espace Client'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Fast 1-Click Demo Client */}
            <div className="pt-3 border-t border-slate-200/80">
              <button
                type="button"
                onClick={handleQuickDemoClient}
                className="w-full py-2.5 px-4 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-900 border border-amber-400/40 text-xs font-black transition-all flex items-center justify-center gap-2"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>⚡ Connexion Rapide 1-Clic Démo Client (Amadou Diallo)</span>
              </button>
            </div>
          </form>
        )}

        {/* TAB 2: ADMIN AUTH FORM */}
        {activeTab === 'admin' && (
          <form onSubmit={handleAdminSubmit} className="space-y-4">
            {/* Security Badge Banner */}
            <div className="p-3 rounded-2xl bg-[#0B192C] text-white flex items-center justify-between border border-slate-700/60 shadow-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#FF4500] to-orange-400 flex items-center justify-center text-white shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-black text-white">SinoSenegal Operations Gateway</div>
                  <div className="text-[10px] text-slate-300">Connexion Chiffrée SSL 256-bit • HQ Dakar</div>
                </div>
              </div>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                Direct Chine
              </span>
            </div>

            {/* Admin Identifier */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Identifiant / Email Professionnel SinoSenegal *
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={adminEmail}
                  onChange={e => setAdminEmail(e.target.value)}
                  placeholder="admin@sinosenegal.sn ou operations@sinosenegal.sn"
                  className="w-full bg-white border border-slate-200 rounded-2xl pl-10 pr-4 py-3 text-xs sm:text-sm text-slate-800 font-semibold focus:outline-hidden focus:border-[#FF4500] shadow-xs"
                  required
                />
              </div>
            </div>

            {/* Admin Password */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Code PIN Sécurisé / Mot de passe Superviseur *
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={adminPassword}
                  onChange={e => setAdminPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white border border-slate-200 rounded-2xl pl-10 pr-10 py-3 text-xs sm:text-sm text-slate-800 font-semibold focus:outline-hidden focus:border-[#FF4500] shadow-xs"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Role Verification Notice (Infalsifiable) */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1">
              <div className="flex items-center gap-2 font-bold text-slate-800">
                <Lock className="w-3.5 h-3.5 text-emerald-600" />
                <span>Rôle certifié par Supabase Auth &amp; PostgreSQL</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Les privilèges administratifs (Super Admin, Opérations, Sourcing, Fret, Finance) sont vérifiés de manière infalsifiable côté serveur. Aucune élévation client n'est autorisée.
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#0B192C] to-[#FF4500] hover:from-[#1B2A47] hover:to-[#E03D00] text-white font-extrabold text-xs sm:text-sm shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <span>Authentification en cours...</span>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4 text-emerald-300" />
                  <span>Accéder au Centre de Contrôle Admin</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Fast 1-Click Demo Admin Button */}
            <div className="pt-3 border-t border-slate-200/80">
              <button
                type="button"
                onClick={() => handleQuickDemoAdmin()}
                className="w-full py-2.5 px-4 rounded-xl bg-orange-500/15 hover:bg-orange-500/25 text-[#0B192C] border border-orange-400/40 text-xs font-black transition-all flex items-center justify-center gap-2"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#FF4500]" />
                <span>⚡ Accès Rapide 1-Clic Super Admin (HQ Dakar)</span>
              </button>
            </div>
          </form>
        )}

        {/* Feature Guarantees footer */}
        <div className="grid grid-cols-3 gap-2 pt-4 border-t border-slate-100 text-center">
          <div className="p-2 rounded-xl bg-slate-50 space-y-0.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mx-auto" />
            <span className="text-[10px] font-bold text-slate-700 block">Gaindé 2000</span>
            <span className="text-[9px] text-slate-400 block">Dédouanement</span>
          </div>
          <div className="p-2 rounded-xl bg-slate-50 space-y-0.5">
            <Truck className="w-3.5 h-3.5 text-[#FF4500] mx-auto" />
            <span className="text-[10px] font-bold text-slate-700 block">Suivi AWP</span>
            <span className="text-[9px] text-slate-400 block">Temps Réel</span>
          </div>
          <div className="p-2 rounded-xl bg-slate-50 space-y-0.5">
            <Layers className="w-3.5 h-3.5 text-amber-600 mx-auto" />
            <span className="text-[10px] font-bold text-slate-700 block">Groupage</span>
            <span className="text-[9px] text-slate-400 block">-40% Économie</span>
          </div>
        </div>

      </div>
    </div>
  );
};
