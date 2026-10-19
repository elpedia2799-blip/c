import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { Lock, Mail, Shield, ArrowRight, AlertCircle, Sparkles, Eye, EyeOff, ShieldAlert } from 'lucide-react';

interface AdminLoginProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onSuccess, onCancel }) => {
  const { loginWithCredentials } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);

    try {
      await loginWithCredentials(email.trim(), password);
      onSuccess();
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-2xl border border-[#24304A] bg-[#070B17] p-8 shadow-2xl relative overflow-hidden">
        {/* Glow ambient */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-[#4D8DFF]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-[#8B5CF6]/20 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header */}
        <div className="text-center mb-8 relative z-10">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#4D8DFF] to-[#8B5CF6] p-[1.5px] mx-auto mb-3">
            <div className="w-full h-full bg-[#070B17] rounded-[10px] flex items-center justify-center text-[#4D8DFF]">
              <Shield className="w-6 h-6" />
            </div>
          </div>
          <h2 className="font-display font-black text-2xl text-[#F8FAFC]">
            Lord Zicco Admin
          </h2>
          <p className="text-xs text-[#94A3B8] mt-1">
            Authenticate to manage portfolio projects, live sections, services, and incoming transmissions.
          </p>
        </div>

        {errorMessage && (
          <div className="mb-6 p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-2.5 text-xs text-red-400">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
          <div>
            <label className="block text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-1.5">
              Admin Email
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="lordzicco@gmail.com"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#0D1326] border border-[#24304A] focus:border-[#4D8DFF] focus:ring-1 focus:ring-[#4D8DFF] text-sm text-[#F8FAFC] outline-none transition-colors"
              />
              <Mail className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">
                Master Password
              </label>
              <span className="text-[10px] font-mono text-[#4D8DFF]">Restricted Access</span>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password..."
                className="w-full pl-10 pr-12 py-3 rounded-xl bg-[#0D1326] border border-[#24304A] focus:border-[#4D8DFF] focus:ring-1 focus:ring-[#4D8DFF] text-sm text-[#F8FAFC] outline-none transition-colors"
              />
              <Lock className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#F8FAFC] transition-colors p-1"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#0D1326] border border-[#24304A] text-[11px] text-[#94A3B8] flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-[#4D8DFF] shrink-0" />
            <span>5 consecutive invalid attempts trigger a 15-minute security lockout.</span>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#4D8DFF] to-[#8B5CF6] hover:from-[#3b7bed] hover:to-[#7c3aed] text-white font-semibold text-xs uppercase tracking-wider transition-all duration-300 shadow-lg shadow-[#4D8DFF]/25 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Enter Admin Console</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={onCancel}
            className="text-xs text-[#94A3B8] hover:text-[#F8FAFC] transition-colors"
          >
            Cancel & Return to Portfolio
          </button>
        </div>
      </div>
    </div>
  );
};
