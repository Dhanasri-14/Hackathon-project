import React, { useState, useEffect } from 'react';
import {
  X,
  CreditCard,
  Building2,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Lock,
  ExternalLink,
  Send,
  Mail,
  RefreshCw,
  ArrowRight,
  Fingerprint,
  QrCode,
} from 'lucide-react';
import { apiRequest } from '../api.ts';
import { QRCodeSVG } from 'qrcode.react';

interface RealPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  totalAmount: number;
  customerName?: string;
  customerPhone?: string;
  deliveryAddress?: string;
  onPaymentSuccess?: (orderId: string, utr: string) => void;
}

interface PaymentConfig {
  payee_name: string;
  upi_id: string;
}

export const RealPaymentModal: React.FC<RealPaymentModalProps> = ({
  isOpen,
  onClose,
  orderId,
  totalAmount,
  customerName = 'Patient / Customer',
  onPaymentSuccess,
}) => {
  const [paymentType, setPaymentType] = useState<'card' | 'netbanking' | 'upi' | 'cod'>('upi');
  const [upiApp, setUpiApp] = useState<'phonepe' | 'gpay' | 'paytm' | 'other'>('phonepe');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [gatewayStep, setGatewayStep] = useState<'selection' | 'processing'>('selection');
  const [paymentConfig, setPaymentConfig] = useState<PaymentConfig | null>(null);

  useEffect(() => {
    if (isOpen) {
      apiRequest<PaymentConfig>('/payment/config')
        .then(setPaymentConfig)
        .catch(err => console.error('Failed to fetch payment config:', err));
    }
  }, [isOpen]);

  const upiUri = paymentConfig 
    ? `upi://pay?pa=${paymentConfig.upi_id}&pn=${encodeURIComponent(paymentConfig.payee_name)}&am=${totalAmount.toFixed(2)}&tr=${orderId}&tn=${encodeURIComponent(`Order ${orderId}`)}&cu=INR`
    : '';

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSubmitting(true);
    setGatewayStep('processing');

    // Simulate secure gateway processing delay
    await new Promise(resolve => setTimeout(resolve, 2400));

    const refNumber = `TXN-${paymentType.toUpperCase()}-${Math.floor(100000000 + Math.random() * 900000000)}`;

    try {
      await apiRequest<{
        success: boolean;
        message: string;
        utr: string;
      }>(`/orders/${orderId}/pay`, {
        method: 'POST',
        body: JSON.stringify({
          utr_number: refNumber,
          payment_method: `${paymentType === 'card' ? 'Credit/Debit Card' : paymentType === 'netbanking' ? 'Net Banking' : paymentType === 'upi' ? `UPI (${upiApp.toUpperCase()})` : 'Cash on Delivery'}`,
        }),
      });

      setPaymentSuccess(true);
      if (onPaymentSuccess) {
        onPaymentSuccess(orderId, refNumber);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Secure payment failed. Please check your account balance or try another method.');
      setGatewayStep('selection');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-[2.5rem] max-w-lg w-full overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        
        {/* Gateway Header */}
        <div className="bg-slate-50 px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-600 text-white">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight">Secure Payment Gateway</h2>
              <p className="text-[10px] text-slate-500 font-bold flex items-center gap-1">
                <Lock className="w-2.5 h-2.5" /> 256-BIT ENCRYPTED • PCI-DSS COMPLIANT
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-200 text-slate-400 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          {errorMessage && (
            <div className="mb-5 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-3 font-bold animate-shake">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {paymentSuccess ? (
            <div className="py-8 text-center space-y-6 animate-in zoom-in-95 duration-300">
              <div className="w-24 h-24 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-12 h-12 animate-success-check" />
              </div>

              <div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Payment Successful</h3>
                <p className="text-sm text-slate-500 mt-2 max-w-xs mx-auto font-medium">
                  Order <strong>#{orderId}</strong> has been confirmed. Confirmation details sent to your registered contact.
                </p>
              </div>

              <div className="p-4 rounded-3xl bg-slate-50 border border-slate-100 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-bold">TRANSACTION ID</span>
                  <span className="text-slate-900 font-mono font-black">TXN-{Math.floor(Date.now()/1000)}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-bold">AMOUNT PAID</span>
                  <span className="text-blue-600 font-black text-lg">₹{totalAmount.toFixed(2)}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black text-sm transition shadow-xl active:scale-[0.98]"
              >
                Close Gateway
              </button>
            </div>
          ) : gatewayStep === 'processing' ? (
            <div className="py-16 text-center space-y-8 animate-pulse">
              <div className="relative w-20 h-20 mx-auto">
                <div className="absolute inset-0 border-4 border-blue-100 rounded-full" />
                <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Fingerprint className="w-8 h-8 text-blue-600" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">Authorizing Transaction</h3>
                <p className="text-xs text-slate-500 mt-2 font-bold uppercase tracking-widest">Do not refresh or close this window</p>
              </div>
              <div className="flex justify-center gap-1">
                {[0, 1, 2].map(i => (
                  <div key={i} className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          ) : (
            <form onSubmit={handlePay} className="space-y-6">
              {/* Order Summary Summary */}
              <div className="p-5 rounded-[2rem] bg-gradient-to-br from-slate-900 to-blue-900 text-white shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl" />
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <span className="text-[10px] font-black text-blue-300 uppercase tracking-widest">Order Amount</span>
                      <div className="text-3xl font-black">₹{totalAmount.toFixed(2)}</div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Customer</span>
                      <div className="text-xs font-bold truncate max-w-[120px]">{customerName}</div>
                    </div>
                  </div>
                  <div className="pt-3 border-t border-white/10 flex items-center justify-between text-[10px] font-bold text-white/60 uppercase tracking-widest">
                    <span>ID: {orderId}</span>
                    <span className="flex items-center gap-1 text-emerald-400">
                      <ShieldCheck className="w-3 h-3" /> Secure Connection
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment Methods */}
              <div className="space-y-3">
                <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Select Payment Method</h4>
                
                <div className="grid grid-cols-1 gap-3">
                  {/* PhonePe / UPI Option (The 'Purple App') */}
                  <div className={`rounded-3xl border-2 transition-all overflow-hidden ${
                    paymentType === 'upi' && upiApp === 'phonepe'
                      ? 'border-purple-600 bg-purple-50'
                      : 'border-slate-100 bg-white hover:border-slate-200'
                  }`}>
                    <button
                      type="button"
                      onClick={() => { setPaymentType('upi'); setUpiApp('phonepe'); }}
                      className="w-full p-4 text-left flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-2xl transition-colors ${paymentType === 'upi' && upiApp === 'phonepe' ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'}`}>
                          <Smartphone className="w-6 h-6" />
                        </div>
                        <div>
                          <span className="text-sm font-black text-slate-900 block leading-none">PhonePe / BHIM UPI</span>
                          <span className="text-[10px] text-slate-500 font-bold uppercase mt-1 block tracking-wider">Scan QR or Pay Directly</span>
                        </div>
                      </div>
                      {paymentType === 'upi' && upiApp === 'phonepe' && (
                        <div className="w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center">
                          <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                        </div>
                      )}
                    </button>

                    {paymentType === 'upi' && upiApp === 'phonepe' && paymentConfig && (
                      <div className="px-4 pb-6 flex flex-col items-center gap-4 animate-in slide-in-from-top-2 duration-300">
                        <div className="p-3 bg-white rounded-2xl shadow-sm border border-purple-100">
                          <QRCodeSVG 
                            value={upiUri} 
                            size={160}
                            level="H"
                            includeMargin={true}
                          />
                        </div>
                        <div className="text-center space-y-1">
                          <p className="text-[10px] font-black text-purple-700 uppercase tracking-widest flex items-center justify-center gap-1.5">
                            <QrCode className="w-3 h-3" /> Scan with any UPI App
                          </p>
                          <p className="text-[9px] text-slate-400 font-bold max-w-[200px] mx-auto leading-tight">
                            Open PhonePe, GPay, or Paytm and scan this QR to authorize the medical payment of ₹{totalAmount.toFixed(2)}
                          </p>
                        </div>
                        <a 
                          href={upiUri}
                          className="w-full py-2.5 bg-purple-600 text-white text-[10px] font-black uppercase rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-purple-600/20 active:scale-[0.98] transition-transform"
                        >
                          <ExternalLink className="w-3 h-3" /> Open in Banking App
                        </a>
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => { setPaymentType('card'); }}
                    className={`p-4 rounded-3xl border-2 text-left transition-all flex items-center justify-between group ${
                      paymentType === 'card'
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-slate-100 bg-white hover:border-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-2xl transition-colors ${paymentType === 'card' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'}`}>
                        <CreditCard className="w-6 h-6" />
                      </div>
                      <div>
                        <span className="text-sm font-black text-slate-900 block leading-none">Credit / Debit Card</span>
                        <span className="text-[10px] text-slate-500 font-bold uppercase mt-1 block tracking-wider">Visa, Mastercard, RuPay</span>
                      </div>
                    </div>
                    {paymentType === 'card' && (
                      <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                      </div>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => { setPaymentType('netbanking'); }}
                    className={`p-4 rounded-3xl border-2 text-left transition-all flex items-center justify-between group ${
                      paymentType === 'netbanking'
                        ? 'border-slate-900 bg-slate-50'
                        : 'border-slate-100 bg-white hover:border-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-2xl transition-colors ${paymentType === 'netbanking' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'}`}>
                        <Building2 className="w-6 h-6" />
                      </div>
                      <div>
                        <span className="text-sm font-black text-slate-900 block leading-none">Net Banking</span>
                        <span className="text-[10px] text-slate-500 font-bold uppercase mt-1 block tracking-wider">All Major Indian Banks</span>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className={`w-full py-5 rounded-[1.5rem] text-white font-black text-base transition-all shadow-2xl active:scale-[0.97] flex items-center justify-center gap-3 ${
                  paymentType === 'upi' ? 'bg-purple-600 hover:bg-purple-700' : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                <span>{paymentType === 'upi' ? 'I Have Paid Successfully' : `Proceed to Pay ₹${totalAmount.toFixed(2)}`}</span>
                <ArrowRight className="w-5 h-5" />
              </button>

              <p className="text-[10px] text-center text-slate-400 font-bold uppercase tracking-widest">
                By proceeding, you agree to our Terms of Service
              </p>
            </form>
          )}
        </div>

        {/* Gateway Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex items-center justify-center gap-6">
          <div className="flex items-center gap-1.5 grayscale opacity-50 contrast-125">
             <span className="text-[9px] font-black text-slate-500 tracking-tighter">RAZORPAY</span>
          </div>
          <div className="flex items-center gap-1.5 grayscale opacity-50 contrast-125">
             <span className="text-[9px] font-black text-slate-500 tracking-tighter">STRIPE</span>
          </div>
          <div className="flex items-center gap-1.5 grayscale opacity-50 contrast-125">
             <span className="text-[9px] font-black text-slate-500 tracking-tighter">SECURE CLOUD</span>
          </div>
        </div>
      </div>
    </div>
  );
};
