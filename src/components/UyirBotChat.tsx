import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  X,
  Send,
  Sparkles,
  Bot,
  User,
  HeartPulse,
  Pill,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
  Minimize2,
  Maximize2,
} from 'lucide-react';
import { useI18n } from '../i18n.tsx';
import { apiRequest } from '../api.ts';

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  time: string;
  suggestions?: string[];
  actionLink?: { label: string; page: string };
}

interface UyirBotChatProps {
  onNavigate: (page: string) => void;
}

export const UyirBotChat: React.FC<UyirBotChatProps> = ({ onNavigate }) => {
  const { t, lang } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize greeting on language change
  useEffect(() => {
    const isTa = lang === 'ta';
    const initialGreeting: ChatMessage = {
      id: 'msg-welcome',
      sender: 'bot',
      text: isTa
        ? 'வணக்கம்! நான் உங்கள் உயிர்த்துணை AI உதவியாளர் (UyirBot). அவசர இரத்த தான தகுதிகள், மருத்துவ சீட்டு விதிகள் மற்றும் நோயாளி மருந்து விநியோக கண்காணிப்பு தொடர்பாக என்னிடம் கேளுங்கள்.'
        : 'Hello! I am UyirBot, your dedicated healthcare operations assistant for UyirThunai. How can I help you today with blood coordination, donor guidelines, or medicine order tracking?',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      suggestions: isTa
        ? [
            'இரத்த தானம் செய்ய தகுதிகள் யாவை?',
            'O- நெகட்டிவ் அவசர இரத்த வகை ஏன் முக்கியம்?',
            'Schedule H மருந்துகளுக்கு சீட்டு தேவையா?',
            'நோயாளி மருந்து விநியோகத்தை எவ்வாறு கண்காணிப்பது?',
          ]
        : [
            'What are blood donor eligibility rules?',
            'Why is O- vital for trauma cases?',
            'Which medicines need doctor prescriptions?',
            'How to track inpatient medicine dispatch?',
          ],
    };
    setMessages([initialGreeting]);
  }, [lang]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await apiRequest<{
        reply: string;
        botName?: string;
        suggestions?: string[];
      }>('/ai/chat', {
        method: 'POST',
        body: JSON.stringify({ message: text, lang }),
      });

      // Detect smart action links based on context
      let actionLink: { label: string; page: string } | undefined = undefined;
      const lower = text.toLowerCase();
      if (lower.includes('blood') || lower.includes('ரத்தம்') || lower.includes('donor') || lower.includes('தானம்')) {
        actionLink = { label: lang === 'ta' ? 'இரத்தக் கோரிக்கைகளைக் காண்க' : 'View Blood Requests', page: 'blood-requests' };
      } else if (lower.includes('track') || lower.includes('order') || lower.includes('கண்காணி') || lower.includes('gps')) {
        actionLink = { label: lang === 'ta' ? 'சேர்க்கை & ஜிபிஎஸ் கண்காணிப்பு' : 'Inpatient Admission Tracking', page: 'admission-tracking' };
      } else if (lower.includes('rx') || lower.includes('prescription') || lower.includes('சீட்டு')) {
        actionLink = { label: lang === 'ta' ? 'பரிந்துரைச்சீட்டு பதிவேற்றுக' : 'Upload Prescription', page: 'prescriptions' };
      }

      const botMsg: ChatMessage = {
        id: `msg-${Date.now()}-bot`,
        sender: 'bot',
        text: res.reply,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestions: res.suggestions,
        actionLink,
      };

      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      console.error('Chat error:', err);
      const errorMsg: ChatMessage = {
        id: `msg-${Date.now()}-err`,
        sender: 'bot',
        text: lang === 'ta'
          ? 'மன்னிக்கவும், தகவல் பெறுவதில் சிறிய சிக்கல் ஏற்பட்டது. மீண்டும் முயற்சிக்கவும் அல்லது அவசர உதவிக்கு தொடர்பு கொள்ளவும்.'
          : 'I apologize, there was a temporary communication error. Please try again or reach the emergency operations desk.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    const isTa = lang === 'ta';
    setMessages([
      {
        id: 'msg-welcome-new',
        sender: 'bot',
        text: isTa
          ? 'உரையாடல் மீட்டமைக்கப்பட்டது. நான் உங்களுக்கு எவ்வாறு உதவ முடியும்?'
          : 'Conversation reset. How can I assist you with healthcare operations today?',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestions: isTa
          ? ['இரத்த தானம் செய்ய தகுதிகள் யாவை?', 'O- நெகட்டிவ் அவசர இரத்த வகை ஏன் முக்கியம்?']
          : ['What are blood donor eligibility rules?', 'Why is O- vital for trauma cases?'],
      },
    ]);
  };

  return (
    <>
      {/* Floating Launcher Button */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3">
          <button
            onClick={() => setIsOpen(true)}
            className="group relative flex items-center gap-2.5 px-4 py-3.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white shadow-2xl border-2 border-red-500/80 transition-all hover:scale-105 active:scale-95"
            aria-label="Open UyirBot Healthcare Assistant"
          >
            {/* Luminous beacon dot */}
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>

            <div className="p-1 rounded-full bg-red-600 text-white">
              <Sparkles className="w-4 h-4" />
            </div>

            <div className="text-left">
              <div className="text-xs font-black tracking-wide text-white group-hover:text-red-300 transition">
                UyirBot AI
              </div>
              <div className="text-[10px] text-slate-300 font-semibold leading-none">
                24/7 Clinical Guide
              </div>
            </div>
          </button>
        </div>
      )}

      {/* Floating Chat Window Modal */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[95vw] sm:w-[420px] h-[580px] max-h-[85vh] bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-red-600 to-rose-500 flex items-center justify-center text-white shadow-md shadow-red-600/40">
                  <Bot className="w-5 h-5" />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-slate-900"></span>
              </div>
              <div>
                <h3 className="text-sm font-black text-white flex items-center gap-1.5">
                  <span>UyirBot</span>
                  <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded bg-red-600 text-white uppercase tracking-wider">
                    AI Assistant
                  </span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  {lang === 'ta' ? 'உயிர்த்துணை மருத்துவ வழிகாட்டி' : 'UyirThunai Clinical Coordination'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleClear}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                title="Reset Conversation"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                title="Close UyirBot"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Messages Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'bot' && (
                  <div className="w-7 h-7 rounded-xl bg-red-600 text-white flex items-center justify-center shrink-0 text-xs shadow-xs mt-1">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed space-y-2 shadow-xs ${
                    msg.sender === 'user'
                      ? 'bg-slate-900 text-white rounded-br-xs'
                      : 'bg-white text-slate-800 border border-slate-200 rounded-bl-xs'
                  }`}
                >
                  <p className="whitespace-pre-line font-medium">{msg.text}</p>

                  {/* Contextual Action Link */}
                  {msg.actionLink && (
                    <div className="pt-2 border-t border-slate-100">
                      <button
                        onClick={() => {
                          setIsOpen(false);
                          onNavigate(msg.actionLink!.page);
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-[11px] transition shadow-xs"
                      >
                        <span>{msg.actionLink.label}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  <span className="block text-[9px] text-slate-400 text-right mt-1">
                    {msg.time}
                  </span>
                </div>

                {msg.sender === 'user' && (
                  <div className="w-7 h-7 rounded-xl bg-slate-800 text-slate-200 flex items-center justify-center shrink-0 text-xs shadow-xs mt-1">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 text-xs text-slate-500 py-2">
                <div className="w-7 h-7 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 animate-spin" />
                </div>
                <div className="px-3.5 py-2.5 rounded-2xl bg-white border border-slate-200 text-slate-600 flex items-center gap-1.5 shadow-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-bounce"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-bounce [animation-delay:0.4s]"></span>
                  <span className="text-[11px] font-semibold text-slate-500 ml-1">
                    UyirBot is processing...
                  </span>
                </div>
              </div>
            )}

            {/* Quick Prompt Suggestion Chips */}
            {messages.length > 0 && messages[messages.length - 1].suggestions && (
              <div className="pt-2 space-y-1.5">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {lang === 'ta' ? 'பரிந்துரைக்கப்பட்ட தலைப்புகள்:' : 'Suggested topics:'}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {messages[messages.length - 1].suggestions!.map((s, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSend(s)}
                      className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-white hover:bg-red-50 text-slate-700 hover:text-red-700 border border-slate-200 hover:border-red-300 transition text-left"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Footer Input */}
          <div className="p-3 bg-white border-t border-slate-200">
            <form
              onSubmit={e => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder={
                  lang === 'ta'
                    ? 'UyirBot-இடம் கேளுங்கள்...'
                    : 'Ask UyirBot about blood, rx, tracking...'
                }
                className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-red-500 focus:outline-hidden"
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="p-2.5 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white transition shadow-sm shrink-0"
                aria-label="Send message"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
            <p className="text-[10px] text-center text-slate-400 mt-1.5">
              UyirBot Clinical Knowledge Engine • 24/7 Operations Guide
            </p>
          </div>
        </div>
      )}
    </>
  );
};
