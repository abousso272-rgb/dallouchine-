import React, { useState } from 'react';
import { Eye, EyeOff, Lock, Mail, Phone, User } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Button } from '../ui/Button';
import { Input } from '../ui/Field';
import { InlineAlert } from '../ui/States';
import { Link } from '../ui/Link';
import { friendlyError } from '../../lib/db';

export function AuthForm({
  initialMode = 'login',
  onSuccess,
  compact
}: {
  initialMode?: 'login' | 'register';
  onSuccess?: () => void;
  compact?: boolean;
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

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (mode === 'register') {
      if (fullName.trim().length < 2) return setError('Indiquez votre nom complet.');
      if (phone.replace(/\D/g, '').length < 8) return setError('Indiquez un numéro de téléphone valide.');
      if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return setError('Adresse email invalide.');
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
        const res = await signUp({ fullName, phone, email: email || undefined, password, city });
        if (res.needsConfirmation) {
          setConfirmSent(true);
        } else {
          toast('success', 'Compte créé', 'Bienvenue sur DALUCHE !');
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
        Un lien de confirmation a été envoyé à <strong>{email}</strong>. Cliquez dessus puis connectez-vous.
      </InlineAlert>
    );
  }

  return (
    <div>
      <div className="mb-5 grid grid-cols-2 gap-1 rounded-2xl bg-paper-2 p-1" role="tablist">
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
            className={`h-10 rounded-xl text-[13.5px] font-semibold transition-colors ${mode === m ? 'bg-white text-ink shadow-sm' : 'text-muted'}`}
          >
            {m === 'login' ? 'Connexion' : 'Créer un compte'}
          </button>
        ))}
      </div>

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
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              prefix={<Mail className="h-4 w-4" />}
              hint="Recommandé : permet de récupérer votre mot de passe."
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
          <p className="text-center text-[12px] leading-relaxed text-muted">
            En créant un compte, vous pourrez suivre vos commandes, groupages, demandes et devis en temps réel.
          </p>
        )}
      </form>
    </div>
  );
}
