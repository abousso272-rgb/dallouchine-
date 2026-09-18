import React from 'react';
import { UnifiedAuthForm } from './UnifiedAuthForm';
import { X } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'client' | 'admin';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'client'
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl my-8">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute -top-3 -right-3 z-10 w-9 h-9 rounded-full bg-white text-slate-700 hover:text-slate-950 shadow-lg flex items-center justify-center border border-slate-200 transition-all hover:scale-105"
          aria-label="Fermer"
        >
          <X className="w-5 h-5" />
        </button>

        <UnifiedAuthForm
          defaultTab={defaultTab}
          onSuccess={onClose}
        />
      </div>
    </div>
  );
};
