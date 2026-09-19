import React from 'react';
import { Order, TrackingEvent } from '../../types';
import {
  CheckCircle2,
  Clock,
  MapPin,
  Plane,
  Ship,
  ShieldCheck,
  PackageCheck,
  Truck,
  Building2,
  Home,
  MessageCircle
} from 'lucide-react';

interface TrackingTimelineProps {
  order: Order;
}

export const TrackingTimeline: React.FC<TrackingTimelineProps> = ({ order }) => {
  const getStepIcon = (status: string, completed: boolean, isCurrent: boolean) => {
    if (completed && !isCurrent) {
      return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
    }
    if (isCurrent) {
      return (
        <div className="w-5 h-5 rounded-full bg-[#FF4500] border-4 border-orange-200 flex items-center justify-center animate-pulse">
          <div className="w-1.5 h-1.5 bg-white rounded-full" />
        </div>
      );
    }
    return <div className="w-4 h-4 rounded-full border-2 border-slate-300 bg-white" />;
  };

  const whatsappMessage = encodeURIComponent(
    `Bonjour Dallou Chine, je souhaite avoir une mise à jour sur ma commande ${order.trackingCode} (${order.customer.fullName}).`
  );

  return (
    <div className="space-y-6">
      {/* Top Tracking Status Summary Header */}
      <div className="bg-gradient-to-r from-[#0B192C] to-[#1E3E62] text-white p-6 rounded-2xl shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Numéro de Suivi AWP
              </span>
              <span className="bg-white/20 text-white font-mono text-xs px-2 py-0.5 rounded font-bold">
                {order.trackingCode}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black mt-1">
              {order.deliveryType === 'home_delivery' ? 'Livraison à Domicile' : 'Retrait en Hub'}
            </h2>
            <p className="text-xs text-slate-300 mt-1">
              Destinataire : <strong>{order.customer.fullName}</strong> • Tél : {order.customer.phone}
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-xl border border-white/20 flex items-center gap-3">
            <Clock className="w-5 h-5 text-amber-300 shrink-0" />
            <div>
              <span className="text-[10px] text-slate-300 uppercase font-bold block">
                Livraison Estimée à Dakar
              </span>
              <span className="text-sm font-bold text-white">
                {order.estimatedDeliveryDate}
              </span>
            </div>
          </div>
        </div>

        {/* WhatsApp Real-time Alert link */}
        <div className="mt-4 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="text-slate-200">
            Besoin d'assistance directe ou de changer l'adresse de livraison ?
          </span>
          <a
            href={`https://wa.me/221775402211?text=${whatsappMessage}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-3 py-1.5 rounded-lg shadow-sm transition-all"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>Assistance WhatsApp</span>
          </a>
        </div>
      </div>

      {/* Vertical Timeline */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <h3 className="text-sm font-bold text-[#0B192C] uppercase tracking-wider mb-6 flex items-center gap-2">
          <Plane className="w-4 h-4 text-[#FF4500]" />
          <span>Étapes d'Acheminement & Statut en Temps Réel</span>
        </h3>

        <div className="relative pl-6 sm:pl-8 space-y-8 before:absolute before:left-[11px] sm:before:left-[15px] before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
          {(order?.trackingTimeline || []).map((step, idx) => (
            <div key={step.id || idx} className="relative group">
              {/* Step indicator marker */}
              <div className="absolute -left-6 sm:-left-8 top-1 flex items-center justify-center">
                {getStepIcon(step.status, step.completed, step.current)}
              </div>

              {/* Step content */}
              <div
                className={`p-4 rounded-xl transition-all ${
                  step.current
                    ? 'bg-orange-50/70 border border-[#FF4500]/30 shadow-xs'
                    : step.completed
                    ? 'bg-slate-50/80 border border-slate-100'
                    : 'opacity-50'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <div className="flex items-center gap-2">
                    <h4 className={`text-xs sm:text-sm font-bold ${step.current ? 'text-[#FF4500]' : 'text-slate-800'}`}>
                      {step.title}
                    </h4>
                    {step.current && (
                      <span className="bg-[#FF4500] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                        Étape en cours
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] font-mono text-slate-500">{step.timestamp}</span>
                </div>

                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">{step.description}</p>

                {step.location && (
                  <div className="mt-2.5 flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
                    <MapPin className="w-3.5 h-3.5 text-[#FF4500] shrink-0" />
                    <span>{step.location}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Package Items & Delivery Summary Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-4">
          Contenu du Colis ({(order?.items || []).length} article(s))
        </h4>
        <div className="divide-y divide-slate-100">
          {(order?.items || []).map((item, idx) => (
            <div key={idx} className="py-3 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <img
                  src={item.productImage}
                  alt={item.productName}
                  className="w-12 h-12 rounded-xl object-cover border border-slate-100 bg-slate-50"
                />
                <div>
                  <h5 className="text-xs font-bold text-slate-900">{item.productName}</h5>
                  <span className="text-[11px] text-slate-500">
                    Quantité : <strong>{item.quantity}</strong> • Mode :{' '}
                    {item.transportMode === 'air' ? 'Fret Aérien' : 'Fret Maritime'}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-[#0B192C]">
                  {item.totalPriceXOF.toLocaleString('fr-FR')} FCFA
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-900">
          <span>Total TTC Réglé</span>
          <span className="text-sm font-black text-[#0B192C]">
            {order.totalXOF.toLocaleString('fr-FR')} FCFA
          </span>
        </div>
      </div>
    </div>
  );
};
