import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Truck,
  Eye,
  EyeOff,
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Phone,
  Building,
  Headphones,
  Compass,
  FileCheck2,
  Video
} from 'lucide-react';

export const AuthPage: React.FC = () => {
  const { loginUser, navigate, addToast } = useApp();
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [identifier, setIdentifier] = useState('+221 77 450 12 34');
  const [password, setPassword] = useState('dallou2026');
  const [fullName, setFullName] = useState('Amadou Cheikh Diop');
  const [companyName, setCompanyName] = useState('Diop Logistique & E-commerce SARL');
  const [accountType, setAccountType] = useState<'b2b' | 'individual'>('b2b');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      loginUser({
        name: authMode === 'register' ? fullName : 'Amadou Diallo',
        email: identifier.includes('@') ? identifier : 'amadou.diallo@sahelmobilite.sn',
        phone: identifier.includes('@') ? '+221 77 450 12 34' : identifier,
        role: 'client',
        city: 'Dakar, Almadies'
      });
      addToast({
        title: authMode === 'login' ? 'Connexion réussie' : 'Compte créé avec succès',
        message: 'Bienvenue sur votre portail sécurisé Dallou Chine.',
        type: 'success'
      });
      navigate('/dashboard');
    }, 600);
  };

  const handleWhatsAppAuth = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      loginUser({
        name: 'Amadou Diallo',
        email: 'amadou.diallo@sahelmobilite.sn',
        phone: '+221 77 450 12 34',
        role: 'client',
        city: 'Dakar, Almadies'
      });
      addToast({
        title: 'Authentification WhatsApp validée',
        message: 'Votre session sécurisée est désormais active.',
        type: 'success'
      });
      navigate('/dashboard');
    }, 500);
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center py-6 sm:py-12 px-3 sm:px-6 relative overflow-hidden">
      {/* Ambient background refractions */}
      <div className="absolute -top-24 -left-20 w-96 h-96 rounded-full bg-[#FF4500]/10 blur-3xl pointer-events-none -z-10" />
      <div className="absolute -bottom-24 -right-20 w-96 h-96 rounded-full bg-[#0B192C]/10 blur-3xl pointer-events-none -z-10" />

      {/* Master Split Card */}
      <div className="w-full max-w-6xl rounded-3xl overflow-hidden shadow-2xl bg-white/95 border border-slate-200/80 backdrop-blur-xl grid grid-cols-1 lg:grid-cols-12">
        {/* LEFT COLUMN: Brand, Imagery & Value Pillars (5 cols) */}
        <div className="lg:col-span-5 relative flex flex-col justify-between p-8 md:p-12 overflow-hidden bg-gradient-to-br from-[#0B192C] to-[#1E3E62] text-white">
          {/* Background image scrim */}
          <div
            className="absolute inset-0 z-0 bg-cover bg-center opacity-20"
            style={{
              backgroundImage: `url('https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=1200&q=80')`
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0B192C]/95 via-[#0B192C]/85 to-[#0B192C]/95 z-0" />

          {/* Top brand mark & signature */}
          <div className="relative z-10 flex flex-col items-start gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#E63900] to-[#FF4500] flex items-center justify-center text-white shadow-lg shadow-orange-500/30">
                <Truck className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xl font-black text-white tracking-tight block">Dallou Chine</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-orange-300">
                  Sourcing • Fret • Dakar
                </span>
              </div>
            </div>
            <p className="text-lg text-slate-200 font-semibold mt-2 leading-snug">
              Commandez de la Chine vers l’Afrique de l’Ouest en un clic.
            </p>
          </div>

          {/* Center / Mid: Dynamic Route Indicator Graphic */}
          <div className="relative z-10 my-8 p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15">
            <div className="flex items-center justify-between text-xs text-slate-200 font-bold mb-2">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#FF4500] animate-pulse" /> Ningbo / Yiwu
              </span>
              <span className="text-orange-300 font-mono text-sm">35 jours</span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" /> Dakar Port
              </span>
            </div>

            {/* Progress track */}
            <div className="w-full h-2 bg-white/15 rounded-full overflow-hidden flex">
              <div className="w-2/3 h-full bg-gradient-to-r from-[#FF4500] to-amber-400 rounded-full" />
            </div>

            <div className="flex justify-between items-center text-[11px] text-slate-300 font-medium mt-2.5">
              <span>Conteneurs FCL &amp; LCL</span>
              <span className="text-orange-300 font-semibold">Dédouanement garanti</span>
            </div>
          </div>

          {/* Bottom Glass Pillars */}
          <div className="relative z-10 flex flex-col gap-3">
            <div className="flex items-center gap-3.5 p-3.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md">
              <div className="w-8 h-8 rounded-lg bg-[#FF4500]/20 flex items-center justify-center shrink-0 text-orange-300">
                <Compass className="w-4 h-4" />
              </div>
              <span className="text-xs text-slate-200 font-medium leading-tight">
                Suivi temps réel de vos conteneurs Chine → Dakar
              </span>
            </div>

            <div className="flex items-center gap-3.5 p-3.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md">
              <div className="w-8 h-8 rounded-lg bg-[#FF4500]/20 flex items-center justify-center shrink-0 text-orange-300">
                <Building className="w-4 h-4" />
              </div>
              <span className="text-xs text-slate-200 font-medium leading-tight">
                Accès direct aux tarifs usines 1688, Taobao &amp; négociation
              </span>
            </div>

            <div className="flex items-center gap-3.5 p-3.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md">
              <div className="w-8 h-8 rounded-lg bg-[#FF4500]/20 flex items-center justify-center shrink-0 text-orange-300">
                <Video className="w-4 h-4" />
              </div>
              <span className="text-xs text-slate-200 font-medium leading-tight">
                Devis personnalisés et historique des inspections vidéo
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Authentication Form & Quick Connect (7 cols) */}
        <div className="lg:col-span-7 p-6 sm:p-10 lg:p-12 flex flex-col justify-between bg-white">
          <div>
            {/* Toggle Tabs */}
            <div className="flex items-center justify-between mb-8">
              <div className="inline-flex p-1 rounded-full bg-slate-100 border border-slate-200">
                <button
                  type="button"
                  onClick={() => setAuthMode('login')}
                  className={`px-6 py-2 rounded-full text-xs font-bold transition-all ${
                    authMode === 'login'
                      ? 'bg-white text-[#0B192C] shadow-sm'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Connexion
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMode('register')}
                  className={`px-6 py-2 rounded-full text-xs font-bold transition-all ${
                    authMode === 'register'
                      ? 'bg-white text-[#0B192C] shadow-sm'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Créer un compte
                </button>
              </div>

              <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                <ShieldCheck className="w-4 h-4 text-[#FF4500]" />
                <span>Portail Sécurisé</span>
              </div>
            </div>

            {/* Headline context */}
            <div className="mb-6">
              <h1 className="text-2xl sm:text-3xl font-black text-[#0B192C] tracking-tight">
                {authMode === 'login' ? 'Bienvenue sur votre portail' : 'Rejoignez le réseau commercial'}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                {authMode === 'login'
                  ? 'Gérez vos expéditions maritimes, vos cotations de fret et vos approvisionnements.'
                  : 'Accédez aux meilleures usines chinoises avec livraison assurée au Sénégal.'}
              </p>
            </div>

            {/* Priority WhatsApp Quick Auth Button */}
            <button
              type="button"
              onClick={handleWhatsAppAuth}
              disabled={isLoading}
              className="w-full h-12 flex items-center justify-center gap-3 rounded-2xl bg-[#128C7E]/10 hover:bg-[#128C7E]/15 text-[#075E54] font-bold text-xs sm:text-sm transition-all border border-[#128C7E]/20 shadow-2xs group cursor-pointer"
            >
              <svg className="w-5 h-5 fill-current text-[#128C7E] group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.771-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.007c.106.005.249-.04.39.299.144.347.491 1.2.534 1.288.043.088.072.19.014.305-.058.115-.087.187-.173.289l-.26.309c-.087.088-.18.183-.077.36.103.177.458.756.983 1.224.675.602 1.244.788 1.421.875.177.087.279.073.383-.045.103-.118.442-.516.56-.693.118-.177.236-.148.397-.088.161.06 1.02.481 1.196.569.176.088.293.132.336.206.043.074.043.43-.101.835z" />
              </svg>
              <span>Continuer avec WhatsApp (+221)</span>
            </button>

            {/* Divider */}
            <div className="relative flex py-5 items-center">
              <div className="flex-grow border-t border-slate-200" />
              <span className="flex-shrink mx-4 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                ou avec vos identifiants
              </span>
              <div className="flex-grow border-t border-slate-200" />
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {authMode === 'register' && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Nom complet
                      </label>
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={e => setFullName(e.target.value)}
                        placeholder="Ex: Amadou Diallo"
                        className="w-full h-11 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-[#0B192C] focus:bg-white focus:border-[#FF4500] outline-hidden transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Type de compte
                      </label>
                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          type="button"
                          onClick={() => setAccountType('b2b')}
                          className={`h-11 rounded-xl text-xs font-bold border transition-all ${
                            accountType === 'b2b'
                              ? 'bg-[#0B192C] text-white border-[#0B192C]'
                              : 'bg-slate-50 text-slate-600 border-slate-200'
                          }`}
                        >
                          Entreprise B2B
                        </button>
                        <button
                          type="button"
                          onClick={() => setAccountType('individual')}
                          className={`h-11 rounded-xl text-xs font-bold border transition-all ${
                            accountType === 'individual'
                              ? 'bg-[#0B192C] text-white border-[#0B192C]'
                              : 'bg-slate-50 text-slate-600 border-slate-200'
                          }`}
                        >
                          Particulier
                        </button>
                      </div>
                    </div>
                  </div>

                  {accountType === 'b2b' && (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Raison sociale / Entreprise
                      </label>
                      <input
                        type="text"
                        value={companyName}
                        onChange={e => setCompanyName(e.target.value)}
                        placeholder="Ex: Sahel Mobility SARL"
                        className="w-full h-11 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-[#0B192C] focus:bg-white focus:border-[#FF4500] outline-hidden transition-all"
                      />
                    </div>
                  )}
                </>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Numéro de téléphone ou Email
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={identifier}
                    onChange={e => setIdentifier(e.target.value)}
                    placeholder="+221 77 000 00 00 ou contact@entreprise.sn"
                    className="w-full h-11 pl-10 pr-4 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-[#0B192C] focus:bg-white focus:border-[#FF4500] outline-hidden transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mot de passe
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Votre mot de passe sécurisé"
                    className="w-full h-11 pl-10 pr-10 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-[#0B192C] focus:bg-white focus:border-[#FF4500] outline-hidden transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(prev => !prev)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-hidden"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-600 font-medium">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={e => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded text-[#FF4500] accent-[#FF4500] cursor-pointer"
                  />
                  <span>Se souvenir de moi</span>
                </label>

                <button
                  type="button"
                  onClick={() => addToast({ title: 'Réinitialisation mot de passe', message: 'Un lien de réinitialisation sécurisé vous a été envoyé par SMS et WhatsApp.', type: 'info' })}
                  className="text-xs font-bold text-[#FF4500] hover:underline"
                >
                  Mot de passe oublié ?
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 rounded-xl bg-[#FF4500] hover:bg-[#E03D00] text-white font-bold text-xs sm:text-sm shadow-md shadow-orange-500/25 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                <span>{isLoading ? 'Connexion en cours...' : authMode === 'login' ? 'Se connecter à mon espace' : 'Créer mon compte Dallou Chine'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>

          {/* Lower Sub-panel */}
          <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-orange-50 text-[#FF4500] flex items-center justify-center shrink-0">
                  <Building className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#0B192C]">
                    {authMode === 'login' ? 'Nouveau sur Dallou Chine ?' : 'Déjà un compte ?'}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {authMode === 'login'
                      ? 'Ouvrez un compte Entreprise B2B ou Particulier en 1 minute.'
                      : 'Connectez-vous pour retrouver vos dossiers.'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAuthMode(prev => (prev === 'login' ? 'register' : 'login'))}
                className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-[#0B192C] hover:bg-slate-50 transition-colors shadow-2xs self-start sm:self-auto shrink-0 cursor-pointer"
              >
                {authMode === 'login' ? 'Inscription directe' : 'Se connecter'}
              </button>
            </div>

            {/* Compliance badges */}
            <div className="flex flex-wrap items-center justify-between gap-3 text-slate-500 text-[11px] pt-1">
              <div className="flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-emerald-600" />
                <span>Chiffrement SSL 256-bit</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#FF4500]" />
                <span>Conformité CDP Sénégal (Loi 2008-12)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Headphones className="w-3.5 h-3.5 text-[#0B192C]" />
                <span>Support Dakar &amp; Yiwu 24/7</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
