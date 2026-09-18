import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { MessageSquare, Send, Sparkles, X, Bot, User, ArrowRight, Package, Clock, ShieldCheck } from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  timestamp: string;
  actionButton?: { label: string; path: string };
}

export const ClientAIAssistant: React.FC = () => {
  const { isClientChatOpen, setClientChatOpen, getOrderByTrackingCode, navigate, orders } = useApp();
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm-1',
      sender: 'bot',
      text: 'Bonjour ! Je suis l\'Assistant SinoSenegal 🇸🇳🇨🇳. Je peux vous aider à suivre votre colis (ex: AWP-10482), comprendre le fonctionnement du groupage ou estimer vos délais de livraison.',
      timestamp: 'Maintenant'
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  const quickQuestions = [
    { label: '📦 Suivre ma commande AWP-10482', prompt: 'Où est ma commande AWP-10482 ?' },
    { label: '🤝 Comment fonctionne le groupage ?', prompt: 'Comment fonctionne le système de groupage Chine-Sénégal ?' },
    { label: '⏱️ Quels sont les délais de livraison ?', prompt: 'Quels sont vos délais réels pour le fret aérien et maritime ?' },
    { label: '📍 Comment récupérer au Hub Dakar ?', prompt: 'Où se trouvent vos points de retrait à Dakar ?' }
  ];

  const generateBotReply = (query: string): { text: string; actionButton?: { label: string; path: string } } => {
    const q = (query || '').toLowerCase();

    // Check for tracking pattern
    const trackingMatch = query.match(/AWP-\d{4,6}/i);
    if (trackingMatch) {
      const code = trackingMatch[0].toUpperCase();
      const order = getOrderByTrackingCode(code);
      if (order) {
        const statusMap: Record<string, string> = {
          order_confirmed: 'Commande validée',
          payment_received: 'Paiement reçu',
          groupage_consolidated: 'Groupage clôturé & consolidé',
          purchased_in_china: 'Acheté auprès de l\'usine en Chine',
          quality_control_passed: 'Contrôle qualité 100% validé en Chine',
          shipped_from_china: 'Expédié de Chine (En vol direct ou transit cargo)',
          in_transit: 'En transit international',
          arrived_in_senegal: 'Arrivé à Dakar / Aéroport AIBD',
          customs_cleared: 'Dédouanement terminé avec succès',
          arrived_at_hub: 'Disponible au Hub Sénégal',
          ready_for_pickup: 'Prêt pour retrait client',
          delivered: 'Livré au destinataire'
        };
        const latestStatus = statusMap[order.currentStatus] || order.currentStatus;
        const items = (order.items || []).map(i => `${i.quantity}x ${i.productName || 'Article'}`).join(', ');

        return {
          text: `✅ **Commande ${order.trackingCode} trouvée !**\n\n- **Contenu :** ${items}\n- **Statut actuel :** ${latestStatus}\n- **Mode :** ${order.deliveryType === 'home_delivery' ? 'Livraison à domicile' : 'Retrait au Hub'}\n- **Livraison estimée :** ${order.estimatedDeliveryDate}\n\nVotre colis est bien pris en charge et sécurisé.`,
          actionButton: { label: 'Voir la timeline complète', path: `/tracking?code=${order.trackingCode}` }
        };
      } else {
        return {
          text: `Je ne trouve pas la référence **${code}**. Veuillez vérifier les chiffres ou nous contacter sur WhatsApp (+221 77 540 22 11). Nos commandes types sont formatées ainsi : AWP-10482.`,
          actionButton: { label: 'Ouvrir la page de suivi', path: '/tracking' }
        };
      }
    }

    if (q.includes('groupage') || q.includes('comment')) {
      return {
        text: `💡 **Le groupage SinoSenegal en 4 étapes simples :**\n\n1. **Vous commandez** au tarif groupé (jusqu'à -50% par rapport aux boutiques locales).\n2. **Nous regroupons** les commandes pour atteindre la quantité minimale requise auprès des usines partenaires.\n3. **Nos équipes en Chine** (Guangzhou & Yiwu) achètent, inspectent et testent chaque article.\n4. **Acheminement & Dédouanement :** Transport groupé sécurisé jusqu'au Sénégal avec retrait en Hub ou livraison à domicile.`,
        actionButton: { label: 'Explorer les groupages actifs', path: '/groupages' }
      };
    }

    if (q.includes('delai') || q.includes('délai') || q.includes('temps') || q.includes('combien de temps')) {
      return {
        text: `⏱️ **Nos délais d'acheminement Chine → Sénégal :**\n\n✈️ **Fret Aérien Régulier :** 12 à 18 jours après clôture du lot (Idéal high-tech, accessoires, mode).\n🚢 **Fret Maritime Consolidé :** 30 à 45 jours après départ du conteneur (Idéal mobilier, équipements lourds, gros volume).\n\nNos délais intègrent l'inspection qualité en Chine et les formalités douanières complètes au Sénégal.`,
        actionButton: { label: 'Consulter la FAQ logistique', path: '/how-it-works' }
      };
    }

    if (q.includes('hub') || q.includes('retrait') || q.includes('adresse') || q.includes('dakar')) {
      return {
        text: `📍 **Nos Hubs de retrait au Sénégal :**\n\n• **Dakar Almadies :** Route des Almadies (face station Total)\n• **Dakar Plateau / Sandaga :** Avenue Lamine Guèye\n• **Pikine / Guédiawaye :** Tally Boubess\n• **Diamniadio :** Pôle Urbain Bâtiment C\n• **Thiès :** Boulevard de la République\n\nVous recevez un SMS et un message WhatsApp dès que votre colis est scanné et prêt au retrait.`,
        actionButton: { label: 'Commander maintenant', path: '/products' }
      };
    }

    if (q.includes('paiement') || q.includes('wave') || q.includes('orange money') || q.includes('payer')) {
      return {
        text: `💳 **Moyens de paiement acceptés :**\n\n• **Wave** (Instantané, 0% frais additionnels)\n• **Orange Money Sénégal**\n• **Free Money**\n• **Carte bancaire VISA / Mastercard**\n\nTous les paiements sont sécurisés sur un compte séquestre jusqu'à validation de la commande en usine.`
      };
    }

    if (q.includes('b2b') || q.includes('gros') || q.includes('personnalise') || q.includes('conteneur')) {
      return {
        text: `🏭 **Service Sourcing B2B & Grossistes :**\n\nPour les commandes volumineuses ou produits sur-mesure, notre bureau de sourcing à Guangzhou négocie directement avec les fabricants et vous fournit un devis sous 48h.`,
        actionButton: { label: 'Déposer une demande B2B', path: '/b2b' }
      };
    }

    // Default friendly response
    return {
      text: `Merci pour votre message ! Pour une assistance personnalisée, vous pouvez nous transmettre votre numéro de commande (ex: **AWP-10482**) ou contacter notre support client direct à Dakar au **+221 77 540 22 11** (disponible également sur WhatsApp).`
    };
  };

  const handleSendMessage = (textToSend?: string) => {
    const text = (textToSend || inputValue).trim();
    if (!text) return;

    const userMsg: ChatMessage = {
      id: 'm-' + Date.now(),
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);

    setTimeout(() => {
      const reply = generateBotReply(text);
      const botMsg: ChatMessage = {
        id: 'm-reply-' + Date.now(),
        sender: 'bot',
        text: reply.text,
        timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        actionButton: reply.actionButton
      };
      setMessages(prev => [...prev, botMsg]);
      setIsTyping(false);
    }, 650);
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setClientChatOpen(true)}
        className="fixed bottom-6 left-6 z-40 bg-gradient-to-r from-[#0D2C7A] to-[#2A6DFF] text-white p-3.5 sm:px-4 sm:py-3 rounded-full shadow-2xl hover:shadow-[#2A6DFF]/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-2.5 group border border-white/20"
        aria-label="Assistant Client SinoSenegal"
      >
        <div className="relative">
          <Sparkles className="w-5 h-5 animate-pulse text-amber-300" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-[#0D2C7A]" />
        </div>
        <span className="hidden sm:inline text-xs font-bold tracking-wide">
          Besoin d'aide ? Assistant IA
        </span>
      </button>

      {/* Chat Drawer / Modal */}
      {isClientChatOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-end sm:p-6 pointer-events-none">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs pointer-events-auto sm:hidden"
            onClick={() => setClientChatOpen(false)}
          />
          <div className="pointer-events-auto w-full sm:max-w-md h-[90vh] sm:h-[620px] bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col border border-slate-200 overflow-hidden z-10 animate-in slide-in-from-bottom duration-300">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#0D2C7A] to-[#2A6DFF] p-4 text-white flex items-center justify-between shadow-md">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
                  <Bot className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <h3 className="text-sm font-bold flex items-center gap-1.5">
                    Assistant SinoSenegal
                    <span className="inline-block w-2 h-2 rounded-full bg-emerald-400"></span>
                  </h3>
                  <p className="text-[11px] text-white/80">Support Sourcing, Groupages & Suivi</p>
                </div>
              </div>
              <button
                onClick={() => setClientChatOpen(false)}
                className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                aria-label="Fermer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Questions Carousel */}
            <div className="bg-slate-50 border-b border-slate-100 p-2.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {quickQuestions.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(q.prompt)}
                  className="shrink-0 text-[11px] bg-white border border-slate-200 hover:border-[#2A6DFF] hover:text-[#0D2C7A] text-slate-700 font-medium px-2.5 py-1 rounded-full shadow-2xs transition-all whitespace-nowrap"
                >
                  {q.label}
                </button>
              ))}
            </div>

            {/* Message Thread */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-[#F8F6F2]">
              {messages.map(m => (
                <div
                  key={m.id}
                  className={`flex items-start gap-2.5 ${
                    m.sender === 'user' ? 'flex-row-reverse' : ''
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                      m.sender === 'user'
                        ? 'bg-[#2A6DFF] text-white'
                        : 'bg-[#0D2C7A] text-amber-300'
                    }`}
                  >
                    {m.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>

                  <div
                    className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 text-xs sm:text-xs leading-relaxed shadow-xs ${
                      m.sender === 'user'
                        ? 'bg-[#2A6DFF] text-white rounded-tr-xs'
                        : 'bg-white text-slate-800 border border-slate-100 rounded-tl-xs'
                    }`}
                  >
                    <div className="whitespace-pre-line">{m.text}</div>
                    {m.actionButton && (
                      <button
                        onClick={() => {
                          setClientChatOpen(false);
                          navigate(m.actionButton!.path);
                        }}
                        className="mt-2.5 inline-flex items-center gap-1.5 bg-[#0D2C7A] text-white text-[11px] font-semibold px-3 py-1.5 rounded-lg hover:bg-[#2A6DFF] transition-colors"
                      >
                        {m.actionButton.label}
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                    <div
                      className={`text-[9px] mt-1 text-right ${
                        m.sender === 'user' ? 'text-blue-100' : 'text-slate-400'
                      }`}
                    >
                      {m.timestamp}
                    </div>
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex items-center gap-2 text-slate-400 text-xs pl-9">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-[#2A6DFF] rounded-full animate-bounce"></span>
                    <span className="w-1.5 h-1.5 bg-[#2A6DFF] rounded-full animate-bounce [animation-delay:0.2s]"></span>
                    <span className="w-1.5 h-1.5 bg-[#2A6DFF] rounded-full animate-bounce [animation-delay:0.4s]"></span>
                  </div>
                  <span className="text-[11px]">Assistant rédige une réponse...</span>
                </div>
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Input Bar */}
            <div className="p-3 bg-white border-t border-slate-100">
              <form
                onSubmit={e => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  placeholder="Posez une question ou entrez AWP-XXXXX..."
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#2A6DFF] focus:bg-white transition-all"
                />
                <button
                  type="submit"
                  disabled={!inputValue.trim() || isTyping}
                  className="p-2.5 bg-[#0D2C7A] hover:bg-[#2A6DFF] disabled:opacity-50 text-white rounded-xl transition-colors shrink-0"
                  aria-label="Envoyer"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
