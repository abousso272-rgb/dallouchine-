import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Bot,
  Sparkles,
  Send,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  Compass,
  ArrowRight,
  Calculator
} from 'lucide-react';

export const AdminAIAssistantPage: React.FC = () => {
  const { products, groupages, orders, navigate } = useApp();
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string; actionLink?: string; actionLabel?: string }>>([
    {
      role: 'assistant',
      text: 'Bonjour Amadou ! Je suis votre Copilote Opérationnel SinoSenegal. Je surveille vos lots, vos taux de fret et vos marges en direct. Comment puis-je vous aider ?'
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);

  const predefinedQuestions = [
    { label: 'Quels sont mes produits les plus rentables ?', prompt: 'Quels sont les 3 produits avec la plus forte marge nette ?' },
    { label: 'Analyse du groupage #024', prompt: 'Fais une analyse de rentabilité du groupage GRP-024 (projecteur)' },
    { label: 'Fret Aérien vs Maritime pour les panneaux solaires', prompt: 'Quel mode de transport recommandes-tu pour les kits solaires de 35kg ?' },
    { label: 'Pourquoi ma marge diminue ce mois-ci ?', prompt: 'Quels facteurs impactent la marge globale sur les 30 derniers jours ?' }
  ];

  const handleSend = (textToSend?: string) => {
    const text = textToSend || query;
    if (!text.trim()) return;

    const newMessages = [...messages, { role: 'user' as const, text }];
    setMessages(newMessages);
    setQuery('');
    setIsTyping(true);

    setTimeout(() => {
      let reply = '';
      let actionLink: string | undefined;
      let actionLabel: string | undefined;

      const lower = text.toLowerCase();
      if (lower.includes('rentable') || lower.includes('marge')) {
        reply = 'D\'après l\'analyse de vos 12 fiches produits, vos articles les plus rentables sont :\n\n1. **Vidéoprojecteur 4K Android** (Marge : +35%, soit +8 500 FCFA / unité)\n2. **Kit Panneau Solaire 300W** (Marge : +38%, soit +42 000 FCFA / unité)\n3. **Station Énergie Portable 600W** (Marge : +32%)\n\n💡 Recommandation : Concentrez vos prochaines campagnes de groupage sur la catégorie Énergie & High-Tech pour maximiser le ROI global.';
        actionLink = '/admin/calculator';
        actionLabel = 'Ouvrir le simulateur de marge';
      } else if (lower.includes('grp-024') || lower.includes('projecteur') || lower.includes('024')) {
        reply = 'Le groupage **GRP-024 (Vidéoprojecteur HY300 Pro)** est actuellement à **37 / 50 unités réservées (74%)**.\n\n- Coût d\'achat Chine : 85 ¥ (~7 522 FCFA)\n- Fret aérien consolidé : 7 500 FCFA\n- Coût total unitaire : 16 150 FCFA\n- Prix de vente : 24 500 FCFA\n- **Bénéfice net actuel : +308 950 FCFA (+34.1% de marge)**\n\n🎯 Il ne reste que 13 unités pour atteindre le palier d\'optimisation maximale de fret.';
        actionLink = '/admin/groupages';
        actionLabel = 'Voir la fiche du groupage';
      } else if (lower.includes('solaire') || lower.includes('fret') || lower.includes('maritime')) {
        reply = 'Pour les **Kits Solaires de 35 kg**, le **Fret Maritime Consolidé (Sea Freight)** est fortement recommandé :\n\n- **Fret Aérien** : 35 kg × 7 500 FCFA = 262 500 FCFA de transport (Marge négative ou nulle)\n- **Fret Maritime (CBM)** : Volume 0.12 CBM = 32 400 FCFA de transport\n\n💰 **Gain net par unité : +230 100 FCFA** en passant par voie maritime, pour un délai de 30 à 45 jours.';
        actionLink = '/admin/calculator';
        actionLabel = 'Comparer les modes de fret';
      } else {
        reply = `J'ai bien analysé votre demande relative à "${text}". Nos algorithmes confirment que les flux logistiques actuels de Guangzhou vers Dakar sont stables avec un taux de change de 1 CNY = 88.50 FCFA. N'hésitez pas à lancer une simulation détaillée dans le moteur de coûts.`;
        actionLink = '/admin/calculator';
        actionLabel = 'Accéder au Moteur de Coûts';
      }

      setMessages(prev => [...prev, { role: 'assistant', text: reply, actionLink, actionLabel }]);
      setIsTyping(false);
    }, 600);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0a183d] p-5 rounded-2xl border border-blue-900/50 shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-white tracking-tight">Assistant IA Décisionnel SinoSenegal</h1>
            <span className="bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              <span>Gemini 2.5 Intelligence Sourcing</span>
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Posez des questions en langage naturel sur vos groupages, prévisions de fret, marges et opportunités usines en Chine.
          </p>
        </div>
      </div>

      {/* Suggested Quick Questions Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        {predefinedQuestions.map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(q.prompt)}
            className="p-3 rounded-xl bg-[#0a183d] hover:bg-blue-900/40 border border-blue-900/50 hover:border-blue-500/40 text-left text-xs text-slate-300 hover:text-white transition-all space-y-1 group"
          >
            <div className="font-bold text-blue-300 group-hover:text-blue-200">{q.label}</div>
            <div className="text-[10px] text-slate-400">Cliquez pour analyser</div>
          </button>
        ))}
      </div>

      {/* Main Chat Container */}
      <div className="bg-[#0a183d] rounded-2xl border border-blue-900/50 shadow-lg flex flex-col h-[520px]">
        {/* Chat History */}
        <div className="flex-1 p-5 overflow-y-auto space-y-4 custom-scrollbar">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex items-start gap-3 ${
                m.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {m.role === 'assistant' && (
                <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shrink-0 shadow-md">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`p-4 rounded-2xl max-w-xl text-xs leading-relaxed space-y-2.5 ${
                  m.role === 'user'
                    ? 'bg-blue-600 text-white rounded-br-none'
                    : 'bg-[#06102b] text-slate-200 border border-blue-900/50 rounded-bl-none'
                }`}
              >
                <div className="whitespace-pre-line">{m.text}</div>

                {m.actionLink && (
                  <button
                    onClick={() => navigate(m.actionLink!)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 hover:text-white border border-blue-500/30 text-[11px] font-bold transition-all mt-1"
                  >
                    <span>{m.actionLabel}</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex items-center gap-2 text-xs text-blue-400 font-semibold p-2">
              <Sparkles className="w-4 h-4 animate-spin" />
              <span>Analyse des flux logistiques et calcul des marges en cours...</span>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-blue-900/50 bg-[#071330] rounded-b-2xl">
          <form
            onSubmit={e => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Ex: Analyse la rentabilité si j'augmente le lot à 100 pièces..."
              className="flex-1 bg-[#06102b] border border-blue-900/60 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-hidden focus:border-blue-500"
            />
            <button
              type="submit"
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Analyser</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
