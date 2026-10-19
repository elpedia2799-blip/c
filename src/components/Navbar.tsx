import React, { useState, useEffect } from 'react';
import { ArrowRight, Menu, X, Shield, Mail } from 'lucide-react';
import { useRealtime } from '../context/RealtimeContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';

import { SiteSettings } from '../types.ts';

interface NavbarProps {
  settings?: SiteSettings;
  onOpenContact: () => void;
  onOpenAdmin: () => void;
  onOpenMessages?: () => void;
  activeSection: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  settings,
  onOpenContact,
  onOpenAdmin,
  onOpenMessages,
  activeSection,
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { unreadCount } = useRealtime();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'Home', href: '#home' },
    { label: 'Portfolio', href: '#portfolio' },
    { label: 'About', href: '#about' },
    { label: 'Services', href: '#services' },
    { label: 'Process', href: '#process' },
    { label: 'Contact', href: '#contact' },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        isScrolled
          ? 'bg-[#070B17]/90 backdrop-blur-md border-b border-[#24304A]/70 py-3.5 shadow-lg shadow-black/20'
          : 'bg-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-8">
        {/* Zone 1: Brand Wordmark & Monogram */}
        <a
          href="#home"
          className="group flex items-center gap-3 text-left whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4D8DFF] rounded-lg p-1"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#4D8DFF] via-[#8B5CF6] to-[#22D3EE] p-[1.5px] transition-transform duration-300 group-hover:scale-105 overflow-hidden">
            <div className="w-full h-full bg-[#070B17] rounded-[10px] flex items-center justify-center font-display font-black text-sm tracking-wider text-[#F8FAFC] overflow-hidden">
              {settings?.brand_logo_image ? (
                <img
                  src={settings.brand_logo_image}
                  alt="Lord Zicco"
                  className="w-full h-full object-cover"
                />
              ) : (
                'LZ'
              )}
            </div>
          </div>
          <span className="font-display font-bold text-lg tracking-tight text-[#F8FAFC] group-hover:text-[#4D8DFF] transition-colors">
            {settings?.site_title || 'LORD ZICCO'}
          </span>
        </a>

        {/* Zone 2: Clean single-line text nav links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-[#94A3B8]">
          {navLinks.map((link) => {
            const isActive = activeSection === link.label.toLowerCase();
            return (
              <a
                key={link.label}
                href={link.href}
                className={`transition-colors whitespace-nowrap hover:text-[#F8FAFC] ${
                  isActive ? 'text-[#4D8DFF]' : 'text-[#94A3B8]'
                }`}
              >
                {link.label}
              </a>
            );
          })}
        </nav>

        {/* Zone 3: Primary Action & Admin Portal Trigger */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Messages link with live badge */}
          {onOpenMessages && (
            <button
              onClick={onOpenMessages}
              title="View Messages & Transmissions"
              className="relative p-2.5 rounded-lg border border-[#24304A] bg-[#0D1326]/60 hover:bg-[#111A30] hover:border-[#4D8DFF]/50 text-[#94A3B8] hover:text-[#F8FAFC] transition-all"
              aria-label="Messages"
            >
              <Mail className="w-4 h-4 text-[#4D8DFF]" />
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-gradient-to-r from-red-500 to-rose-600 text-white font-mono text-[10px] font-bold flex items-center justify-center animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>
          )}

          {/* Admin link */}
          <button
            onClick={onOpenAdmin}
            title="Admin Dashboard"
            className="relative p-2.5 rounded-lg border border-[#24304A] bg-[#0D1326]/60 hover:bg-[#111A30] hover:border-[#4D8DFF]/50 text-[#94A3B8] hover:text-[#F8FAFC] transition-all"
            aria-label="Admin Dashboard"
          >
            <Shield className="w-4 h-4" />
            {isAuthenticated && (
              <span className="absolute -bottom-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#22D3EE] ring-2 ring-[#070B17]" />
            )}
          </button>

          {/* Let's Talk CTA */}
          <button
            onClick={onOpenContact}
            className="group hidden sm:inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-gradient-to-r from-[#4D8DFF] to-[#8B5CF6] hover:from-[#3b7bed] hover:to-[#7c3aed] rounded-lg shadow-md hover:shadow-[#4D8DFF]/25 transition-all duration-300 transform active:scale-95 whitespace-nowrap"
          >
            <span>Let's Talk</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1" />
          </button>

          {/* Mobile hamburger toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2.5 rounded-lg border border-[#24304A] text-[#94A3B8] hover:text-white"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#0D1326] border-b border-[#24304A] px-6 py-6 transition-all">
          <nav className="flex flex-col gap-4 text-base font-medium">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="text-[#94A3B8] hover:text-[#4D8DFF] transition-colors py-1"
              >
                {link.label}
              </a>
            ))}
            <div className="pt-4 border-t border-[#24304A] flex flex-col gap-3">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenContact();
                }}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-gradient-to-r from-[#4D8DFF] to-[#8B5CF6] text-white text-sm font-semibold"
              >
                <span>Let's Talk</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              {onOpenMessages && (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenMessages();
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-[#24304A] bg-[#111A30] text-[#94A3B8] hover:text-white text-xs font-semibold"
                >
                  <Mail className="w-3.5 h-3.5 text-[#4D8DFF]" />
                  <span>Messages & Sent History {unreadCount > 0 && `(${unreadCount})`}</span>
                </button>
              )}
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAdmin();
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-[#24304A] bg-[#111A30] text-[#94A3B8] hover:text-white text-xs font-semibold"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Admin Console</span>
              </button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};
