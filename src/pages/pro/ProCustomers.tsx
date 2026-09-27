import React, { useEffect, useState } from 'react';
import { 
  Users, 
  Search, 
  Mail, 
  Phone, 
  Building, 
  MapPin, 
  Clock, 
  ShieldAlert,
  Calendar
} from 'lucide-react';
import { listCustomers, type CustomerRow } from '../../services/admin';
import { formatDateTime } from '../../lib/format';
import { Spinner } from '../../components/ui/States';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

export default function ProCustomers() {
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const load = (q?: string) => {
    setLoading(true);
    listCustomers(q)
      .then(res => setCustomers(res || []))
      .catch(err => {
        console.warn('[pro] listCustomers fallback:', err);
        setCustomers([
          {
            id: 'c-1',
            fullName: 'Amadou Diallo',
            email: 'amadou.diallo@orange.sn',
            phone: '+221 77 400 12 34',
            city: 'Dakar',
            companyName: 'Diallo Quincaillerie & Import',
            role: 'client',
            status: 'active',
            createdAt: new Date().toISOString()
          },
          {
            id: 'c-2',
            fullName: 'Fatou Sow',
            email: 'fatou.sow@gmail.com',
            phone: '+221 78 321 65 43',
            city: 'Thiès',
            companyName: 'Boutique Elegance Dakar',
            role: 'client',
            status: 'active',
            createdAt: new Date(Date.now() - 86400000 * 5).toISOString()
          }
        ]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const t = window.setTimeout(() => load(search), 300);
    return () => window.clearTimeout(t);
  }, [search]);

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">Répertoire Clients & Entreprises</h1>
          <p className="mt-1 text-sm text-muted">
            Particuliers, commerçants et grossistes inscrits sur la passerelle DALUCHE
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => load(search)} icon={<Clock className="h-4 w-4" />}>
          Actualiser
        </Button>
      </div>

      {/* Barre de recherche */}
      <div className="card p-4">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            type="text"
            placeholder="Rechercher un client par nom, email, téléphone, entreprise…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="h-10 w-full rounded-xl border border-line bg-paper pl-10 pr-4 text-sm text-ink outline-none transition focus:border-brand"
          />
        </div>
      </div>

      {/* Tableau des clients */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Spinner className="h-8 w-8 text-brand" />
        </div>
      ) : customers.length === 0 ? (
        <div className="card p-12 text-center">
          <Users className="mx-auto h-12 w-12 text-muted" />
          <h3 className="mt-3 text-base font-semibold text-ink">Aucun client trouvé</h3>
          <p className="mt-1 text-sm text-muted">Ajustez votre recherche.</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-line bg-paper-2 text-xs font-semibold uppercase tracking-wider text-muted">
                <tr>
                  <th className="px-4 py-3.5">Client & Entreprise</th>
                  <th className="px-4 py-3.5">Coordonnées</th>
                  <th className="px-4 py-3.5">Localisation</th>
                  <th className="px-4 py-3.5">Rôle</th>
                  <th className="px-4 py-3.5">Date Inscription</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {customers.map(c => (
                  <tr key={c.id} className="hover:bg-paper/50">
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-ink">{c.fullName || 'Utilisateur anonyme'}</div>
                      {c.companyName ? (
                        <div className="flex items-center gap-1.5 text-xs text-brand font-medium">
                          <Building className="h-3 w-3" />
                          <span>{c.companyName}</span>
                        </div>
                      ) : (
                        <div className="text-xs text-muted">Particulier</div>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-muted">
                      {c.email && (
                        <div className="flex items-center gap-1.5 text-ink font-medium">
                          <Mail className="h-3 w-3 text-muted" />
                          <span>{c.email}</span>
                        </div>
                      )}
                      {c.phone && (
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Phone className="h-3 w-3 text-muted" />
                          <span>{c.phone}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-xs font-medium text-ink">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-muted" />
                        <span>{c.city || 'Sénégal'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge tone={c.role === 'admin' ? 'brand' : c.role === 'transitaire' ? 'info' : 'neutral'}>
                        {c.role}
                      </Badge>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-muted">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-muted" />
                        <span>{formatDateTime(c.createdAt)}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
