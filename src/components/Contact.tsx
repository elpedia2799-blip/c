import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, CheckCircle2, Instagram, Twitter, Youtube, ArrowRight, Edit3 } from 'lucide-react';
import { SiteSettings } from '../types.ts';
import { submitContactMessage } from '../services/api.ts';
import confetti from 'canvas-confetti';

interface ContactProps {
  settings: SiteSettings;
  prefillSubject?: string;
  onOpenMessages?: () => void;
  isAuthenticated?: boolean;
  isEditMode?: boolean;
  onEditContact?: () => void;
}

export const Contact: React.FC<ContactProps> = ({
  settings,
  prefillSubject,
  onOpenMessages,
  isAuthenticated = false,
  isEditMode = true,
  onEditContact,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState(prefillSubject || '');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const contactEmail = settings.contact_email || 'lordzicco@gmail.com';
  const contactPhone = settings.contact_phone || '+233 54 123 4567';
  const contactLocation = settings.contact_location || 'Accra, Ghana';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!name.trim() || !email.trim() || !subject.trim() || !message.trim()) {
      setErrorMessage('Please fill in all fields.');
      return;
    }

    setIsSubmitting(true);
    try {
      const savedMsg = await submitContactMessage({
        name: name.trim(),
        email: email.trim(),
        subject: subject.trim(),
        message: message.trim(),
      });

      // Save to local sent history
      try {
        const localSent = JSON.parse(localStorage.getItem('lord_zicco_sent_messages') || '[]');
        const newRecord = {
          id: savedMsg?.data?.id || Date.now(),
          name: name.trim(),
          email: email.trim(),
          subject: subject.trim(),
          message: message.trim(),
          sentAt: new Date().toISOString(),
          status: 'Delivered',
        };
        localStorage.setItem('lord_zicco_sent_messages', JSON.stringify([newRecord, ...localSent]));
      } catch (e) {}

      setIsSuccess(true);
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#4D8DFF', '#8B5CF6', '#22D3EE', '#F8FAFC'],
      });

      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
    } catch (err: any) {
      setErrorMessage(err.message || 'Unable to send message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="contact" className="py-24 relative bg-[#070B17] overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] bg-[#4D8DFF]/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-[500px] h-[500px] bg-[#8B5CF6]/10 rounded-full blur-[150px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
          {/* Left Column: Dramatic Headline & Contact Info */}
          <div className="lg:col-span-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-[2px] bg-gradient-to-r from-[#4D8DFF] to-[#8B5CF6]" />
                  <span className="font-mono text-xs font-semibold tracking-widest text-[#4D8DFF] uppercase">
                    — GET IN TOUCH
                  </span>
                </div>

                {isAuthenticated && isEditMode && onEditContact && (
                  <button
                    onClick={onEditContact}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#4D8DFF]/15 border border-[#4D8DFF]/40 text-[#4D8DFF] hover:bg-[#4D8DFF] hover:text-white text-xs font-semibold transition-all shadow-sm group"
                    title="Edit Public Contact Details"
                  >
                    <Edit3 className="w-3.5 h-3.5 transition-transform group-hover:scale-110" />
                    <span>Edit Contact</span>
                  </button>
                )}
              </div>

              <h2 className="font-display font-black text-4xl sm:text-5xl lg:text-6xl text-[#F8FAFC] tracking-tight leading-[1.08] mb-6">
                LET'S CREATE <br />
                SOMETHING <br />
                <span className="bg-gradient-to-r from-[#4D8DFF] via-[#8B5CF6] to-[#22D3EE] bg-clip-text text-transparent">
                  GREAT.
                </span>
              </h2>

              <p className="text-sm sm:text-base text-[#94A3B8] leading-relaxed mb-8 max-w-md">
                Have a new brand identity project, poster design, apparel series, or custom visual concept? Drop a message and let's craft something unforgettable.
              </p>

              {/* Direct Info List */}
              <div className="space-y-4 mb-10">
                <a
                  href={`mailto:${contactEmail}`}
                  className="group flex items-center gap-4 text-sm text-[#94A3B8] hover:text-[#4D8DFF] transition-colors"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#0D1326] border border-[#24304A] group-hover:border-[#4D8DFF]/50 flex items-center justify-center text-[#4D8DFF] transition-colors">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[11px] font-mono uppercase text-[#94A3B8]/60 block">Direct Email</span>
                    <span className="text-sm font-medium text-[#F8FAFC]">{contactEmail}</span>
                  </div>
                </a>

                <a
                  href={`tel:${contactPhone.replace(/\s+/g, '')}`}
                  className="group flex items-center gap-4 text-sm text-[#94A3B8] hover:text-[#4D8DFF] transition-colors"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#0D1326] border border-[#24304A] group-hover:border-[#4D8DFF]/50 flex items-center justify-center text-[#8B5CF6] transition-colors">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[11px] font-mono uppercase text-[#94A3B8]/60 block">Phone / WhatsApp</span>
                    <span className="text-sm font-medium text-[#F8FAFC]">{contactPhone}</span>
                  </div>
                </a>

                <div className="flex items-center gap-4 text-sm text-[#94A3B8]">
                  <div className="w-10 h-10 rounded-xl bg-[#0D1326] border border-[#24304A] flex items-center justify-center text-[#22D3EE]">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[11px] font-mono uppercase text-[#94A3B8]/60 block">Studio Base</span>
                    <span className="text-sm font-medium text-[#F8FAFC]">{contactLocation}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Social Links */}
            <div className="pt-6 border-t border-[#24304A]">
              <span className="text-xs font-mono text-[#94A3B8] block mb-3">FOLLOW LORD ZICCO</span>
              <div className="flex items-center gap-3">
                <a
                  href={settings.social_instagram || 'https://instagram.com/lordzicco'}
                  target="_blank"
                  rel="noreferrer"
                  className="w-10 h-10 rounded-xl border border-[#24304A] bg-[#0D1326] flex items-center justify-center text-[#94A3B8] hover:text-[#4D8DFF] hover:border-[#4D8DFF]/50 transition-colors"
                >
                  <Instagram className="w-4 h-4" />
                </a>
                <a
                  href={settings.social_x || 'https://x.com/lordzicco'}
                  target="_blank"
                  rel="noreferrer"
                  className="w-10 h-10 rounded-xl border border-[#24304A] bg-[#0D1326] flex items-center justify-center text-[#94A3B8] hover:text-[#4D8DFF] hover:border-[#4D8DFF]/50 transition-colors"
                >
                  <Twitter className="w-4 h-4" />
                </a>
                <a
                  href={settings.social_behance || 'https://behance.net/lordzicco'}
                  target="_blank"
                  rel="noreferrer"
                  className="w-10 h-10 rounded-xl border border-[#24304A] bg-[#0D1326] flex items-center justify-center text-[#94A3B8] hover:text-[#4D8DFF] hover:border-[#4D8DFF]/50 transition-colors font-bold text-xs"
                >
                  Bē
                </a>
                <a
                  href={settings.social_youtube || 'https://youtube.com/@lordzicco'}
                  target="_blank"
                  rel="noreferrer"
                  className="w-10 h-10 rounded-xl border border-[#24304A] bg-[#0D1326] flex items-center justify-center text-[#94A3B8] hover:text-[#4D8DFF] hover:border-[#4D8DFF]/50 transition-colors"
                >
                  <Youtube className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>

          {/* Right Column: Real Contact Form */}
          <div className="lg:col-span-7">
            <div className="rounded-2xl border border-[#24304A] bg-[#0D1326] p-8 sm:p-10 shadow-2xl relative">
              {isSuccess ? (
                <div className="py-12 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-[#4D8DFF]/20 border border-[#4D8DFF] flex items-center justify-center text-[#4D8DFF] mx-auto animate-bounce">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="font-display font-bold text-2xl text-[#F8FAFC]">
                    Message Sent Successfully!
                  </h3>
                  <p className="text-sm text-[#94A3B8] max-w-sm mx-auto">
                    Thank you! Your inquiry was transmitted directly to Lord Zicco's real-time admin inbox. Expect a response shortly.
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
                    <button
                      onClick={() => setIsSuccess(false)}
                      className="px-5 py-2.5 rounded-lg bg-[#111A30] border border-[#24304A] hover:border-[#4D8DFF] text-xs font-semibold text-[#F8FAFC] transition-colors"
                    >
                      Send Another Inquiry
                    </button>
                    {onOpenMessages && (
                      <button
                        onClick={onOpenMessages}
                        className="px-5 py-2.5 rounded-lg bg-[#4D8DFF]/20 border border-[#4D8DFF]/40 hover:bg-[#4D8DFF] hover:text-white text-xs font-semibold text-[#4D8DFF] transition-colors flex items-center gap-1.5"
                      >
                        <Mail className="w-3.5 h-3.5" />
                        <span>View Sent Messages History</span>
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h3 className="font-display font-bold text-xl text-[#F8FAFC]">Send an Inquiry</h3>
                      <p className="text-xs text-[#94A3B8] mt-1">
                        Directly delivers to Lord Zicco via real-time WebSocket / SSE connection.
                      </p>
                    </div>
                    {onOpenMessages && (
                      <button
                        type="button"
                        onClick={onOpenMessages}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#111A30] border border-[#24304A] hover:border-[#4D8DFF] text-xs text-[#94A3B8] hover:text-[#4D8DFF] transition-colors shrink-0"
                      >
                        <Mail className="w-3.5 h-3.5 text-[#4D8DFF]" />
                        <span className="hidden sm:inline">Sent Messages</span>
                      </button>
                    )}
                  </div>

                  {errorMessage && (
                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-400">
                      {errorMessage}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-2">
                        Your Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="John Doe"
                        className="w-full px-4 py-3 rounded-xl bg-[#070B17] border border-[#24304A] focus:border-[#4D8DFF] focus:ring-1 focus:ring-[#4D8DFF] text-sm text-[#F8FAFC] placeholder-[#94A3B8]/40 outline-none transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-2">
                        Your Email *
                      </label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="john@example.com"
                        className="w-full px-4 py-3 rounded-xl bg-[#070B17] border border-[#24304A] focus:border-[#4D8DFF] focus:ring-1 focus:ring-[#4D8DFF] text-sm text-[#F8FAFC] placeholder-[#94A3B8]/40 outline-none transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-2">
                      Subject / Project Type *
                    </label>
                    <input
                      type="text"
                      required
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="e.g. Brand Identity for Tech Collective"
                      className="w-full px-4 py-3 rounded-xl bg-[#070B17] border border-[#24304A] focus:border-[#4D8DFF] focus:ring-1 focus:ring-[#4D8DFF] text-sm text-[#F8FAFC] placeholder-[#94A3B8]/40 outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-2">
                      Message *
                    </label>
                    <textarea
                      required
                      rows={5}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Tell me about your project, goals, timeline, and budget..."
                      className="w-full px-4 py-3 rounded-xl bg-[#070B17] border border-[#24304A] focus:border-[#4D8DFF] focus:ring-1 focus:ring-[#4D8DFF] text-sm text-[#F8FAFC] placeholder-[#94A3B8]/40 outline-none transition-colors resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-4 rounded-xl bg-gradient-to-r from-[#4D8DFF] via-[#8B5CF6] to-[#22D3EE] hover:from-[#3b7bed] hover:to-[#7c3aed] text-white font-semibold text-sm shadow-xl shadow-[#4D8DFF]/20 hover:shadow-[#4D8DFF]/40 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 transform active:scale-[0.99]"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Sending Transmission...</span>
                      </>
                    ) : (
                      <>
                        <span>Send Message</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  {onOpenMessages && (
                    <div className="text-center pt-1">
                      <button
                        type="button"
                        onClick={onOpenMessages}
                        className="inline-flex items-center gap-1.5 text-xs text-[#94A3B8] hover:text-[#4D8DFF] transition-colors"
                      >
                        <Mail className="w-3.5 h-3.5" />
                        <span>View Sent Messages Log & Status</span>
                      </button>
                    </div>
                  )}
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
