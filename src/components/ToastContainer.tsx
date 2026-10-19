import React from 'react';
import { useRealtime } from '../context/RealtimeContext.tsx';
import { Mail, X, Volume2, VolumeX } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast, soundEnabled, setSoundEnabled } = useRealtime();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto bg-[#111A30]/95 backdrop-blur-md border border-[#4D8DFF]/40 rounded-xl p-4 shadow-2xl transition-all duration-300 transform translate-y-0"
        >
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#4D8DFF]/20 border border-[#4D8DFF]/50 flex items-center justify-center text-[#4D8DFF] shrink-0">
              <Mail className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-[#4D8DFF] uppercase tracking-wider">
                  Real-Time Alert
                </span>
                <span className="text-[11px] text-[#94A3B8]">{toast.timestamp}</span>
              </div>
              <h4 className="text-sm font-semibold text-[#F8FAFC] truncate mt-0.5">{toast.title}</h4>
              <p className="text-xs text-[#94A3B8] line-clamp-2 mt-0.5">{toast.description}</p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-[#94A3B8] hover:text-[#F8FAFC] p-1 transition-colors"
              aria-label="Close notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="mt-2.5 pt-2 border-t border-[#24304A]/60 flex items-center justify-between text-[11px] text-[#94A3B8]">
            <span>Admin Inbox Updated</span>
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="flex items-center gap-1 hover:text-[#4D8DFF] transition-colors"
            >
              {soundEnabled ? (
                <>
                  <Volume2 className="w-3 h-3 text-[#22D3EE]" /> Sound On
                </>
              ) : (
                <>
                  <VolumeX className="w-3 h-3 text-[#94A3B8]" /> Muted
                </>
              )}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
