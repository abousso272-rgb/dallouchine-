import React from 'react';
import { TrackingEvent, TrackingStatus } from '../../types';
import {
  CheckCircle2,
  Clock,
  MapPin,
  Plane,
  Ship,
  ShieldCheck,
  Package,
  Building,
  Truck,
  CheckCircle
} from 'lucide-react';

interface TrackingTimelineProps {
  timeline: TrackingEvent[];
  className?: string;
}

export const TrackingTimeline: React.FC<TrackingTimelineProps> = ({
  timeline = [],
  className = ''
}) => {
  const getStepIcon = (status: TrackingStatus) => {
    switch (status) {
      case 'order_confirmed':
      case 'payment_received':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'groupage_consolidated':
      case 'purchased_in_china':
        return <Building className="w-4 h-4" />;
      case 'quality_control_passed':
        return <ShieldCheck className="w-4 h-4" />;
      case 'shipped_from_china':
      case 'in_transit':
        return <Plane className="w-4 h-4" />;
      case 'arrived_in_senegal':
      case 'customs_cleared':
        return <Package className="w-4 h-4" />;
      case 'arrived_at_hub':
      case 'ready_for_pickup':
      case 'out_for_delivery':
        return <Truck className="w-4 h-4" />;
      case 'delivered':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="relative pl-6 sm:pl-8 border-l-2 border-slate-200/80 space-y-6 ml-3">
        {(timeline || []).map((event, idx) => {
          const isCurrent = event.current;
          const isCompleted = event.completed;

          return (
            <div key={event.id || idx} className="relative group">
              {/* Timeline Node Bullet */}
              <div
                className={`absolute -left-[31px] sm:-left-[39px] top-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                  isCurrent
                    ? 'bg-[#2A6DFF] text-white ring-4 ring-blue-100 shadow-md scale-110'
                    : isCompleted
                    ? 'bg-[#0D2C7A] text-white'
                    : 'bg-slate-200 text-slate-400'
                }`}
              >
                {getStepIcon(event.status)}
              </div>

              {/* Event Content Box */}
              <div
                className={`glass-panel rounded-2xl p-4 sm:p-5 border transition-all duration-200 ${
                  isCurrent
                    ? 'bg-blue-50/70 border-[#2A6DFF]/30 shadow-md ring-1 ring-[#2A6DFF]/20'
                    : 'bg-white/70 border-slate-200/70'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                  <div className="flex items-center gap-2">
                    <h4
                      className={`text-sm sm:text-base font-black ${
                        isCurrent ? 'text-[#2A6DFF]' : 'text-[#0D2C7A]'
                      }`}
                    >
                      {event.title}
                    </h4>

                    {isCurrent && (
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-[#2A6DFF] text-white">
                        En cours
                      </span>
                    )}
                  </div>

                  <span className="text-xs text-slate-500 font-mono-numeric">
                    {event.timestamp}
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mt-1">
                  {event.description}
                </p>

                {event.location && (
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mt-2 pt-2 border-t border-slate-100">
                    <MapPin className="w-3.5 h-3.5 text-[#2A6DFF]" />
                    <span>{event.location}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
