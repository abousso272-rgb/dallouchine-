import React, { useEffect, useState } from 'react';
import { Eye, EyeOff, Lock, Mail, Phone, User } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Button } from '../ui/Button';
import { Input } from '../ui/Field';
import { InlineAlert } from '../ui/States';
import { Link } from '../ui/Link';
import { friendlyError } from '../../lib/db';
import { usePrefs } from '../../context/PrefsContext';
import { getEnabledProviders, signInWithProvider, type SocialProvider } from '../../lib/socialAuth';

export function AuthForm({
  initialMode = 'login',
  onSuccess,
  compact,
  loginOnly
}: {
  initialMode?: 'login' | 'register';
  onSuccess?: () => void;
  compact?: boolean;
  /** Masque l’inscription (espace équipe : accès sur invitation). */
  loginOnly?: boolean;
}) {
  const { signIn, signUp, toast } = useApp();
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('Dakar');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmSent, setConfirmSent] = useState(false);
  const { t } = usePrefs();
  const [providers, setProviders] = useState<SocialProvider[]>([]);
  const [socialBusy, setSocialBusy] = useState<SocialProvider | null>(null);

  useEffect(() => {
    let alive = true;
    getEnabledProviders().then(p => alive && setProviders(p));
    return () => {
      alive = false;
    };
  }, []);

  async function social(p: SocialProvider) {
    setError(null);
    setSocialBusy(p);
    try {
      await signInWithProvider(p);
    } catch {
      setError(t('auth.socialError'));
      setSocialBusy(null);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (mode === 'register') {
      if (fullName.trim().length < 2) return setError('Indiquez votre nom complet.');
      if (phone.replace(/\D/g, '').length < 8) return setError('Indiquez un numéro de téléphone valide.');
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) return setError('Indiquez une adresse email valide : elle sert à confirmer votre compte.');
      if (password.length < 8) return setError('Le mot de passe doit contenir au moins 8 caractères.');
    } else if (!identifier.trim() || !password) {
      return setError('Renseignez votre identifiant et votre mot de passe.');
    }
    setLoading(true);
    try {
      if (mode === 'login') {
        const u = await signIn(identifier, password);
        toast('success', `Bonjour ${u.fullName.split(' ')[0] || ''}`.trim(), 'Vous êtes connecté.');
        onSuccess?.();
      } else {
        const res = await signUp({
          fullName,
          phone,
          email: email.trim(),
          password,
          city
        });
        if (res.needsConfirmation) {
          setConfirmSent(true);
        } else {
          toast('success', 'Compte créé', 'Bienvenue sur Dallou Chine !');
          onSuccess?.();
        }
      }
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  }

  if (confirmSent) {
    return (
      <InlineAlert tone="success" title="Vérifiez votre boîte email">
        Un lien de confirmation a été envoyé à <strong>{email}</strong>. Cliquez dessus pour activer votre compte : vous serez connecté automatiquement. Pensez à vérifier vos courriers indésirables.
      </InlineAlert>
    );
  }

  return (
    <div>
      {!loginOnly && (
        <div className="mb-5 grid grid-cols-2 gap-1 rounded-full bg-paper-2 p-1" role="tablist">
          {(['login', 'register'] as const).map(m => (
            <button
              key={m}
              type="button"
              role="tab"
              aria-selected={mode === m}
              onClick={() => {
                setMode(m);
                setError(null);
              }}
              className={`h-10 rounded-full text-[13.5px] font-semibold transition-all ${mode === m ? 'bg-white text-brand-600 shadow-sm' : 'text-muted hover:text-ink'}`}
            >
              {m === 'login' ? 'Connexion' : 'Créer un compte'}
            </button>
          ))}
        </div>
      )}

      {!loginOnly && providers.length > 0 && (
        <div className="mb-5">
          <div className="space-y-2.5">
            {providers.map(p => (
              <button
                key={p}
                type="button"
                onClick={() => social(p)}
                disabled={socialBusy !== null}
                className="flex h-12 w-full items-center justify-center gap-3 rounded-full border border-line-2 bg-white text-[14.5px] font-semibold transition-colors hover:border-brand/40 disabled:opacity-60"
              >
                <ProviderIcon provider={p} />
                {t(p === 'google' ? 'auth.google' : p === 'facebook' ? 'auth.facebook' : 'auth.linkedin')}
              </button>
            ))}
          </div>
          <div className="my-5 flex items-center gap-3 text-[12px] font-semibold uppercase tracking-wide text-subtle" aria-hidden>
            <span className="h-px flex-1 bg-line" />
            {t('auth.or')}
            <span className="h-px flex-1 bg-line" />
          </div>
        </div>
      )}

      <form onSubmit={submit} className="space-y-3.5" noValidate>
        {mode === 'register' ? (
          <>
            <Input label="Nom complet" required value={fullName} onChange={e => setFullName(e.target.value)} prefix={<User className="h-4 w-4" />} autoComplete="name" />
            <div className={`grid gap-3.5 ${compact ? '' : 'sm:grid-cols-2'}`}>
              <Input
                label="Téléphone (WhatsApp)"
                required
                type="tel"
                inputMode="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                prefix={<Phone className="h-4 w-4" />}
                placeholder="77 123 45 67"
                autoComplete="tel"
              />
              <Input label="Ville" value={city} onChange={e => setCity(e.target.value)} autoComplete="address-level2" />
            </div>
            <Input
              label="Email"
              required
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              prefix={<Mail className="h-4 w-4" />}
              hint="Un lien de confirmation vous sera envoyé. Vous pourrez ensuite vous connecter par email ou téléphone."
              autoComplete="email"
            />
          </>
        ) : (
          <Input
            label="Email ou téléphone"
            required
            value={identifier}
            onChange={e => setIdentifier(e.target.value)}
            prefix={<User className="h-4 w-4" />}
            placeholder="vous@exemple.com ou 77 123 45 67"
            autoComplete="username"
          />
        )}
        <div className="relative">
          <Input
            label="Mot de passe"
            required
            type={showPw ? 'text' : 'password'}
            value={password}
            onChange={e => setPassword(e.target.value)}
            prefix={<Lock className="h-4 w-4" />}
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            hint={mode === 'register' ? '8 caractères minimum.' : undefined}
          />
          <button
            type="button"
            onClick={() => setShowPw(v => !v)}
            className="absolute right-2 top-[30px] rounded-lg p-2 text-muted hover:text-ink"
            aria-label={showPw ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
          >
            {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>

        {error && <InlineAlert tone="danger">{error}</InlineAlert>}

        <Button type="submit" block size="lg" loading={loading}>
          {mode === 'login' ? 'Se connecter' : 'Créer mon compte'}
        </Button>

        {mode === 'login' && (
          <p className="text-center text-[13px] text-muted">
            <Link to="/mot-de-passe" className="font-semibold text-ink underline-offset-4 hover:underline">
              Mot de passe oublié ?
            </Link>
          </p>
        )}
        {mode === 'register' && (
          <p className="text-center text-[12px] leading-relaxed text-muted">En créant un compte, vous pourrez suivre vos commandes, groupages, demandes et devis en temps réel.</p>
        )}
      </form>
    </div>
  );
}

function ProviderIcon({ provider }: { provider: SocialProvider }) {
  if (provider === 'google')
    return (
      <svg viewBox="0 0 48 48" className="h-5 w-5" aria-hidden>
        <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z" />
        <path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.4c-.5 2.9-2.2 5.3-4.6 6.9l7.1 5.5c4.2-3.9 7.2-9.6 7.2-16.9z" />
        <path fill="#FBBC05" d="M10.5 28.7c-.5-1.4-.8-3-.8-4.7s.3-3.2.8-4.7l-7.9-6.1C.9 16.4 0 20.1 0 24s.9 7.6 2.6 10.8l7.9-6.1z" />
        <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.1-5.5c-2 1.4-4.9 2.3-8.8 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z" />
      </svg>
    );
  if (provider === 'facebook')
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
        <circle cx="12" cy="12" r="12" fill="#1877F2" />
        <path fill="#fff" d="M13.4 19v-6.2h2.1l.4-2.5h-2.5V8.7c0-.7.3-1.3 1.4-1.3h1.2V5.2c-.2 0-1-.1-1.9-.1-1.9 0-3.2 1.200-3.2 3.300v1.900H8.800v2.500H11V19z" />
      </svg>
    );
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
      <rect width="24" height="24" rx="4" fill="#0A66C2" />
      <path fill="#fff" d="M7.1 9.6H4.7V19h2.4zM5.900 5.100a1.400 1.400 0 100 2.800 1.400 1.400 0 000-2.800zM19.300 13.600c0-2.500-1.300-4.200-3.600-4.200-1.200 0-2 .6-2.400 1.200V9.600H11V19h2.400v-5.200c0-1.400.7-2.200 1.800-2.200 1.100 0 1.700.8 1.700 2.200V19h2.400z" />
    </svg>
  );
}
