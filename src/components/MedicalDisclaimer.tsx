import React from 'react';
import { AlertTriangle, ShieldCheck } from 'lucide-react';
import { useI18n } from '../i18n.tsx';

export const MedicalDisclaimer: React.FC<{ compact?: boolean; className?: string }> = ({
  compact = false,
  className = '',
}) => {
  const { t } = useI18n();

  if (compact) {
    return (
      <div className={`flex items-center gap-2 p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs ${className}`}>
        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
        <span>
          <strong>{t('blood.safeguard_title')}:</strong> {t('blood.safeguard_text')}
        </span>
      </div>
    );
  }

  return (
    <div className={`p-4 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 text-amber-950 shadow-xs ${className}`}>
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-amber-100 text-amber-700 shrink-0 mt-0.5">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-amber-900 flex items-center gap-1.5">
            {t('blood.safeguard_title')}
          </h4>
          <p className="text-xs text-amber-800/90 mt-1 leading-relaxed">
            {t('blood.safeguard_text')}
          </p>
        </div>
      </div>
    </div>
  );
};
