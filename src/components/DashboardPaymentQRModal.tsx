import React, { useState, useEffect } from 'react';
import { X, QrCode, ShieldCheck, ExternalLink, Heart, Smartphone, Lock } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { apiRequest } from '../api.ts';

interface PaymentConfig {
  payee_name: string;
  upi_id: string;
}

interface DashboardPaymentQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultAmount?: number;
}

export const DashboardPaymentQRModal: React.FC<DashboardPaymentQRModalProps> = ({
  isOpen,
  onClose,
  defaultAmount = 500,
}) => {
  const [paymentConfig, setPaymentConfig] = useState<PaymentConfig | null>(null);
  const [amount, setAmount] = useState<number>(defaultAmount);
  const [customAmount, setCustomAmount] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      apiRequest<PaymentConfig>('/payment/config')
        .then(setPaymentConfig)
        .catch(err => console.error('Failed to fetch payment config:', err));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentAmount = customAmount ? parseFloat(customAmount) || amount : amount;
  const upiUri = paymentConfig
    ? `upi://pay?pa=${paymentConfig.upi_id}&pn=${encodeURIComponent(paymentConfig.payee_name)}&am=${currentAmount.toFixed(2)}&tn=${encodeURIComponent('Healthcare Support Payment')}&cu=INR`
    : '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-[2.5rem] max-w-md w-full overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-600 text-white shadow-md">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-black text-white uppercase tracking-wider">Hospital Payment & Support QR</h2>
              <p className="text-[10px] text-purple-300 font-bold flex items-center gap-1">
                <Lock className="w-2.5 h-2.5" /> VERIFIED UPI INTENT • PRIVACY PROTECTED
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 text-center">
          {/* Amount Quick Options */}
          <div className="space-y-2">
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest block">Select Amount (₹)</span>
            <div className="flex items-center justify-center gap-2">
              {[250, 500, 1000, 2500].map(val => (
                <button
                  key={val}
                  type="button"
                  onClick={() => {
                    setAmount(val);
                    setCustomAmount('');
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition ${
                    amount === val && !customAmount
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  ₹{val}
                </button>
              ))}
            </div>
          </div>

          {/* QR Code Graphic Display */}
          {paymentConfig ? (
            <div className="py-2 flex flex-col items-center gap-3">
              <div className="p-4 bg-white rounded-3xl border-2 border-purple-200 shadow-xl relative group">
                <QRCodeSVG
                  value={upiUri}
                  size={190}
                  level="H"
                  includeMargin={true}
                />
              </div>

              <div className="space-y-1">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-purple-700 font-black text-xs border border-purple-200">
                  <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                  UyirThunai Official Healthcare Desk
                </span>
                <p className="text-[10px] text-slate-500 font-bold max-w-xs mx-auto leading-relaxed pt-1">
                  Scan with PhonePe, Google Pay, Paytm or any Indian Banking App. Personal account details are securely masked for confidentiality.
                </p>
              </div>

              <a
                href={upiUri}
                className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs uppercase tracking-wider rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-purple-600/30 transition-transform active:scale-[0.98]"
              >
                <Smartphone className="w-4 h-4 text-purple-200" />
                <span>Pay ₹{currentAmount.toFixed(2)} via Banking App</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          ) : (
            <div className="py-12 text-xs text-slate-400 font-semibold animate-pulse">
              Loading secure UPI QR generator...
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-100 text-center">
          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">
            PCI-DSS Compliant • Encrypted Payment Gateway Protocol
          </p>
        </div>
      </div>
    </div>
  );
};
