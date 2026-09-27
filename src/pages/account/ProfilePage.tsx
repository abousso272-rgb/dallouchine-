import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { updateProfile } from '../../services/account';
import { supabase } from '../../lib/supabase';
import { friendlyError } from '../../lib/db';
import { PageHeader, Card, CardTitle } from '../../components/ui/Layout';
import { Input } from '../../components/ui/Field';
import { Button } from '../../components/ui/Button';
import { InlineAlert } from '../../components/ui/States';
import { ROLE_LABEL } from '../../lib/status';

export default function ProfilePage() {
  const { user, refreshUser, toast, signOut } = useApp();
  const [fullName, setFullName] = useState(user!.fullName);
  const [phone, setPhone] = useState(user!.phone);
  const [city, setCity] = useState(user!.city);
  const [address, setAddress] = useState(user!.address);
  const [company, setCompany] = useState(user!.companyName);
  const [saving, setSaving] = useState(false);
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [pwSaving, setPwSaving] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (fullName.trim().length < 2) return toast('error', 'Nom requis');
    setSaving(true);
    try {
      await updateProfile(user!.id, { fullName, phone, city, address, companyName: company });
      await refreshUser();
      toast('success', 'Profil mis à jour');
    } catch (err) {
      toast('error', 'Enregistrement impossible', friendlyError(err));
    } finally {
      setSaving(false);
    }
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwError(null);
    if (pw.length < 8) return setPwError('8 caractères minimum.');
    if (pw !== pw2) return setPwError('Les mots de passe ne correspondent pas.');
    setPwSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: pw });
      if (error) throw error;
      setPw('');
      setPw2('');
      toast('success', 'Mot de passe modifié');
    } catch (err) {
      setPwError(friendlyError(err));
    } finally {
      setPwSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader title="Profil" description={`Compte ${ROLE_LABEL[user!.role] || 'client'}${user!.email ? ` · ${user!.email}` : ''}`} />
      <Card>
        <CardTitle>Informations personnelles</CardTitle>
        <form onSubmit={save} className="grid gap-4 sm:grid-cols-2">
          <Input label="Nom complet" required value={fullName} onChange={e => setFullName(e.target.value)} autoComplete="name" />
          <Input label="Téléphone / WhatsApp" type="tel" value={phone} onChange={e => setPhone(e.target.value)} autoComplete="tel" />
          <Input label="Ville" value={city} onChange={e => setCity(e.target.value)} />
          <Input label="Entreprise (optionnel)" value={company} onChange={e => setCompany(e.target.value)} />
          <Input label="Adresse de livraison" value={address} onChange={e => setAddress(e.target.value)} wrapperClassName="sm:col-span-2" autoComplete="street-address" />
          <div className="sm:col-span-2">
            <Button type="submit" loading={saving}>
              Enregistrer
            </Button>
          </div>
        </form>
      </Card>
      <Card>
        <CardTitle>Sécurité</CardTitle>
        <form onSubmit={changePassword} className="grid gap-4 sm:grid-cols-2">
          <Input label="Nouveau mot de passe" type="password" value={pw} onChange={e => setPw(e.target.value)} autoComplete="new-password" />
          <Input label="Confirmer" type="password" value={pw2} onChange={e => setPw2(e.target.value)} autoComplete="new-password" />
          {pwError && (
            <div className="sm:col-span-2">
              <InlineAlert tone="danger">{pwError}</InlineAlert>
            </div>
          )}
          <div className="flex flex-wrap gap-2 sm:col-span-2">
            <Button type="submit" variant="dark" loading={pwSaving}>
              Changer le mot de passe
            </Button>
            <Button variant="danger" onClick={signOut}>
              Se déconnecter
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
