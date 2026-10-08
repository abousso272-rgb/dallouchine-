import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { supabase } from '../../lib/supabase';
import { friendlyError } from '../../lib/db';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Field';
import { InlineAlert } from '../../components/ui/States';
import { CONTACT, whatsappLink } from '../../lib/config';

export default function PasswordPage() {
  const { query, resetPassword, navigate, toast } = useApp();
  const updateMode = query.get('mode') === 'update';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function requestReset(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) return setError('Saisissez l’adresse email de votre compte.');
    setLoading(true);
    try {
      await resetPassword(email);
      setSent(true);
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  }

  async function updatePassword(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) return setError('8 caractères minimum.');
    if (password !== confirm) return setError('Les deux mots de passe ne correspondent pas.');
    setLoading(true);
    try {
      const { error: err } = await supabase.auth.updateUser({ password });
      if (err) throw err;
      toast('success', 'Mot de passe mis à jour');
      navigate('/compte', { replace: true });
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container-page max-w-md py-12">
      <h1 className="text-2xl font-bold">{updateMode ? 'Nouveau mot de passe' : 'Mot de passe oublié'}</h1>
      <div className="card mt-6 p-5 sm:p-6">
        {updateMode ? (
          <form onSubmit={updatePassword} className="space-y-4">
            <Input label="Nouveau mot de passe" type="password" value={password} onChange={e => setPassword(e.target.value)} autoComplete="new-password" />
            <Input label="Confirmer" type="password" value={confirm} onChange={e => setConfirm(e.target.value)} autoComplete="new-password" />
            {error && <InlineAlert tone="danger">{error}</InlineAlert>}
            <Button type="submit" block loading={loading}>
              Enregistrer
            </Button>
          </form>
        ) : sent ? (
          <InlineAlert tone="success" title="Email envoyé">
            Si un compte existe pour {email}, vous recevrez un lien pour choisir un nouveau mot de passe.
          </InlineAlert>
        ) : (
          <form onSubmit={requestReset} className="space-y-4">
            <p className="text-sm text-muted">Indiquez l’email de votre compte : nous vous envoyons un lien de réinitialisation.</p>
            <Input label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" />
            {error && <InlineAlert tone="danger">{error}</InlineAlert>}
            <Button type="submit" block loading={loading}>
              Envoyer le lien
            </Button>
            <p className="text-[12.5px] leading-relaxed text-muted">
              Compte créé avec un numéro de téléphone uniquement ? Contactez-nous sur{' '}
              <a href={whatsappLink('Bonjour, je souhaite réinitialiser mon mot de passe DALUCHE.')} className="font-semibold text-ink underline" target="_blank" rel="noreferrer">
                WhatsApp ({CONTACT.phoneDisplay})
              </a>
              .
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
