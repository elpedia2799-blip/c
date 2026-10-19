import React from 'react';
import { Instagram, Twitter, Youtube, ArrowUp } from 'lucide-react';
import { SiteSettings } from '../types.ts';

interface FooterProps {
  settings: SiteSettings;
  onOpenAdmin: () => void;
  onOpenMessages?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ settings, onOpenAdmin, onOpenMessages }) => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-[#070B17] border-t border-[#24304A] py-16 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 items-center justify-between pb-12 border-b border-[#24304A]/60">
          {/* Left: Brand Monogram & Name */}
          <div className="md:col-span-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#4D8DFF] via-[#8B5CF6] to-[#22D3EE] p-[1.5px]">
              <div className="w-full h-full bg-[#070B17] rounded-[10px] flex items-center justify-center font-display font-black text-sm text-[#F8FAFC]">
                LZ
              </div>
            </div>
            <div>
              <span className="font-display font-bold text-lg text-[#F8FAFC] tracking-tight block">
                LORD ZICCO
              </span>
              <span className="font-mono text-[11px] text-[#94A3B8] tracking-widest block">
                GRAPHIC & CREATIVE DESIGNER
              </span>
            </div>
          </div>

          {/* Middle: Links & Social */}
          <div className="md:col-span-5 flex flex-col sm:flex-row items-center gap-6 justify-center">
            <nav className="flex items-center gap-6 text-xs font-medium text-[#94A3B8]">
              <a href="#home" className="hover:text-[#F8FAFC] transition-colors">Home</a>
              <a href="#portfolio" className="hover:text-[#F8FAFC] transition-colors">Portfolio</a>
              <a href="#about" className="hover:text-[#F8FAFC] transition-colors">About</a>
              <a href="#services" className="hover:text-[#F8FAFC] transition-colors">Services</a>
              <a href="#contact" className="hover:text-[#F8FAFC] transition-colors">Contact</a>
            </nav>

            <div className="flex items-center gap-2">
              <a
                href={settings.social_instagram || 'https://instagram.com/jxt_zicco'}
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-lg border border-[#24304A] flex items-center justify-center text-[#94A3B8] hover:text-[#4D8DFF] transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="w-3.5 h-3.5" />
              </a>
              <a
                href={settings.social_x || 'https://x.com/elpedia2799'}
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-lg border border-[#24304A] flex items-center justify-center text-[#94A3B8] hover:text-[#4D8DFF] transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="w-3.5 h-3.5" />
              </a>
              <a
                href={settings.social_behance || 'https://behance.net/lordzicco'}
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-lg border border-[#24304A] flex items-center justify-center text-[#94A3B8] hover:text-[#4D8DFF] transition-colors font-bold text-xs"
                aria-label="Behance"
              >
                Bē
              </a>
              <a
                href={settings.social_youtube || 'https://youtube.com/@lordzicco'}
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-lg border border-[#24304A] flex items-center justify-center text-[#94A3B8] hover:text-[#4D8DFF] transition-colors"
                aria-label="YouTube"
              >
                <Youtube className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Right: Back to top */}
          <div className="md:col-span-3 flex items-center justify-start md:justify-end">
            <button
              onClick={scrollToTop}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[#24304A] hover:border-[#4D8DFF] text-xs font-semibold text-[#94A3B8] hover:text-[#F8FAFC] transition-colors"
            >
              <span>Back to Top</span>
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Bottom Credits & Tagline */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#94A3B8]/60">
          <div>
            <span>© 2026 Lord Zicco. All rights reserved.</span>
          </div>

          <div className="font-mono text-[11px] text-[#4D8DFF]/80 tracking-widest uppercase">
            Design / Create / Inspire
          </div>

          <div className="flex items-center gap-4">
            {onOpenMessages && (
              <button
                onClick={onOpenMessages}
                className="hover:text-[#4D8DFF] transition-colors"
              >
                Messages / Transmissions
              </button>
            )}
            <span>•</span>
            <button
              onClick={onOpenAdmin}
              className="hover:text-[#4D8DFF] transition-colors"
            >
              Admin Portal
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
