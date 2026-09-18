import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Customer } from '../../types';
import {
  Users,
  Search,
  Phone,
  Mail,
  MapPin,
  ShoppingBag,
  CreditCard,
  Plus,
  X,
  Star,
  CheckCircle2
} from 'lucide-react';

export const AdminCustomersPage: React.FC = () => {
  const { customers, addCustomer, showToast } = useApp();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '+221 77 ',
    email: '',
    city: 'Dakar',
    address: 'Ouest Foire, Villa 124',
    customerType: 'b2c' as Customer['customerType']
  });

  const filtered = customers.filter(c => {
    const q = (search || '').toLowerCase();
    return (
      (c?.fullName || '').toLowerCase().includes(q) ||
      (c?.phone || '').includes(q) ||
      (c?.email || '').toLowerCase().includes(q) ||
      (c?.city || '').toLowerCase().includes(q)
    );
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName.trim()) return;

    addCustomer({
      fullName: formData.fullName,
      phone: formData.phone,
      email: formData.email,
      city: formData.city,
      address: formData.address,
      customerType: formData.customerType,
      totalOrdersCount: 0,
      totalSpentXOF: 0,
      lastOrderDate: new Date().toISOString().split('T')[0],
      isVerified: true
    });

    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0a183d] p-5 rounded-2xl border border-blue-900/50 shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-white tracking-tight">Base Clients & CRM SinoSenegal</h1>
            <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs px-2.5 py-0.5 rounded-full font-bold">
              {customers.length} clients enregistrés
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Historique complet des achats individuels, réservations de lots groupages et coordonnées de livraison au Sénégal.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-md transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Nouveau Client</span>
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-amber-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher par nom, téléphone (+221...), ville..."
          className="w-full pl-9 pr-3 py-2 bg-[#06102b] border border-blue-900/60 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-hidden focus:border-amber-500"
        />
      </div>

      {/* Table */}
      <div className="bg-[#0a183d] rounded-2xl border border-blue-900/50 shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#071330] border-b border-blue-900/60 text-[10px] uppercase tracking-wider text-amber-300 font-bold">
                <th className="py-3 px-4">Client</th>
                <th className="py-3 px-3">Contact Téléphonique</th>
                <th className="py-3 px-3">Ville / Adresse</th>
                <th className="py-3 px-3">Type</th>
                <th className="py-3 px-3">Commandes Passées</th>
                <th className="py-3 px-3">Total Dépensé</th>
                <th className="py-3 px-3">Dernière Activité</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-blue-900/30">
              {filtered.map(c => (
                <tr key={c.id} className="hover:bg-blue-950/40 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-bold text-white">{c.fullName}</div>
                    <div className="text-[10px] text-slate-400">{c.email}</div>
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-200">
                    {c.phone}
                  </td>
                  <td className="py-3 px-3 text-slate-300">
                    {c.city} • {c.address}
                  </td>
                  <td className="py-3 px-3">
                    <span className="text-[10px] px-2 py-0.5 rounded font-bold uppercase bg-white/5 text-blue-300 border border-white/5">
                      {c.customerType}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono font-bold text-white">
                    {c.totalOrdersCount} commandes
                  </td>
                  <td className="py-3 px-3 font-mono font-bold text-emerald-300">
                    {(c.totalSpentXOF || 0).toLocaleString('fr-FR')} FCFA
                  </td>
                  <td className="py-3 px-3 text-slate-400 font-mono text-[10px]">
                    {c.lastOrderDate}
                  </td>
                  <td className="py-3 px-3 text-right">
                    <button
                      onClick={() => setSelectedCustomer(c)}
                      className="px-2.5 py-1 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/5 font-semibold"
                    >
                      Fiche
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#0a183d] border border-amber-700/50 rounded-2xl shadow-2xl p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-blue-900/50 pb-3">
              <h2 className="text-base font-black text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-400" />
                <span>Ajouter un Client</span>
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Nom et Prénom *</label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="Ex: Fatou Sow"
                  className="w-full bg-[#06102b] border border-blue-900/60 rounded-xl px-3 py-2 text-white focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Téléphone (Wave / OM) *</label>
                <input
                  type="text"
                  required
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+221 77 123 45 67"
                  className="w-full bg-[#06102b] border border-blue-900/60 rounded-xl px-3 py-2 text-white focus:outline-hidden font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  placeholder="fatou.sow@gmail.com"
                  className="w-full bg-[#06102b] border border-blue-900/60 rounded-xl px-3 py-2 text-white focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Ville</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={e => setFormData({ ...formData, city: e.target.value })}
                    className="w-full bg-[#06102b] border border-blue-900/60 rounded-xl px-3 py-2 text-white focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Type</label>
                  <select
                    value={formData.customerType}
                    onChange={e => setFormData({ ...formData, customerType: e.target.value as any })}
                    className="w-full bg-[#06102b] border border-blue-900/60 rounded-xl px-3 py-2 text-white focus:outline-hidden"
                  >
                    <option value="b2c">Particulier (B2C)</option>
                    <option value="b2b">Entreprise / Grossiste (B2B)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 text-slate-300 font-bold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold shadow-md"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
