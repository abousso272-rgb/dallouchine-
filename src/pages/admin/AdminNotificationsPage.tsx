import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { NotificationTemplate } from '../../types';
import {
  Send,
  MessageSquare,
  Mail,
  Smartphone,
  CheckCircle2,
  Edit2,
  X,
  Play
} from 'lucide-react';

export const AdminNotificationsPage: React.FC = () => {
  const {
    notificationTemplates,
    updateNotificationTemplate,
    sendTestNotification,
    showToast
  } = useApp();

  const [editingTemplate, setEditingTemplate] = useState<NotificationTemplate | null>(null);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTemplate) return;

    updateNotificationTemplate(editingTemplate.id, {
      title: editingTemplate.title,
      messageTemplate: editingTemplate.messageTemplate,
      channels: editingTemplate.channels
    });

    setEditingTemplate(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0a183d] p-5 rounded-2xl border border-blue-900/50 shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-white tracking-tight">Notifications & Modèles de Communication</h1>
            <span className="bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs px-2.5 py-0.5 rounded-full font-bold">
              WhatsApp & SMS Automatiques
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Personnalisez les messages automatiques envoyés aux clients à chaque étape du suivi AWP SinoSenegal.
          </p>
        </div>
      </div>

      {/* Grid of Templates */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {notificationTemplates.map(tmpl => (
          <div
            key={tmpl.id}
            className="p-5 rounded-2xl bg-[#0a183d] border border-blue-900/50 hover:border-blue-500/50 transition-all shadow-md space-y-3 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] font-mono text-blue-300 uppercase tracking-wider bg-blue-950 px-2 py-0.5 rounded border border-blue-800">
                    Déclencheur : {tmpl.triggerEvent}
                  </span>
                  <h3 className="font-bold text-sm text-white mt-1.5">{tmpl.title}</h3>
                </div>

                <div className="flex items-center gap-1">
                  {(tmpl.channels || []).map(ch => (
                    <span key={ch} className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded uppercase font-bold">
                      {ch}
                    </span>
                  ))}
                </div>
              </div>

              {/* Message preview */}
              <div className="mt-3 p-3 rounded-xl bg-[#06102b] border border-blue-900/40 text-xs text-slate-300 font-mono leading-relaxed">
                {tmpl.messageTemplate}
              </div>
            </div>

            <div className="pt-2 border-t border-blue-900/40 flex items-center justify-between">
              <button
                onClick={() => sendTestNotification(tmpl.id)}
                className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 font-bold"
              >
                <Play className="w-3 h-3" />
                <span>Tester l'envoi WhatsApp</span>
              </button>

              <button
                onClick={() => setEditingTemplate(tmpl)}
                className="px-3 py-1 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/5 font-semibold text-xs flex items-center gap-1"
              >
                <Edit2 className="w-3 h-3" />
                <span>Modifier Modèle</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* EDIT MODAL */}
      {editingTemplate && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#0a183d] border border-blue-700/50 rounded-2xl shadow-2xl p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-blue-900/50 pb-3">
              <h2 className="text-base font-black text-white">Modifier le Modèle de Notification</h2>
              <button onClick={() => setEditingTemplate(null)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Titre descriptif</label>
                <input
                  type="text"
                  value={editingTemplate.title}
                  onChange={e => setEditingTemplate({ ...editingTemplate, title: e.target.value })}
                  className="w-full bg-[#06102b] border border-blue-900/60 rounded-xl px-3 py-2 text-white focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Corps du message (Variables: &#123;&#123;trackingCode&#125;&#125;, &#123;&#123;productName&#125;&#125;, &#123;&#123;eta&#125;&#125;)
                </label>
                <textarea
                  rows={4}
                  value={editingTemplate.messageTemplate}
                  onChange={e => setEditingTemplate({ ...editingTemplate, messageTemplate: e.target.value })}
                  className="w-full bg-[#06102b] border border-blue-900/60 rounded-xl px-3 py-2 text-white font-mono text-xs focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingTemplate(null)}
                  className="px-4 py-2 rounded-xl bg-white/5 text-slate-300 font-bold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-md"
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
