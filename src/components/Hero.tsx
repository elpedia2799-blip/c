import React, { useState, useEffect } from 'react';
import { ArrowRight, Instagram, Twitter, Youtube, ExternalLink, Sparkles, Edit3, Camera, Upload, Loader2 } from 'lucide-react';
import { SiteSettings } from '../types.ts';
import { uploadImageFile, updateAdminSettings } from '../services/api.ts';

interface HeroProps {
  settings: SiteSettings;
  onExplore: () => void;
  onContact: () => void;
  isAuthenticated?: boolean;
  isEditMode?: boolean;
  onEditHero?: () => void;
}

export const Hero: React.FC<HeroProps> = ({
  settings,
  onExplore,
  onContact,
  isAuthenticated = false,
  isEditMode = true,
  onEditHero,
}) => {
  const initialHeroImage = settings.hero_image || '/src/assets/images/hero_lord_zicco_1792235845811.jpg';
  const [heroImage, setHeroImage] = useState(initialHeroImage);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (settings.hero_image) {
      setHeroImage(settings.hero_image);
    }
  }, [settings.hero_image]);

  const handleDirectHeroUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const fileData = reader.result as string;
        const uploadedUrl = await uploadImageFile(fileData, file.name);
        await updateAdminSettings({ hero_image: uploadedUrl });
        setHeroImage(uploadedUrl);
      } catch (err: any) {
        alert(err.message || 'Failed to upload hero image');
      } finally {
        setIsUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const label = settings.hero_label || 'GRAPHIC DESIGNER';
  const description =
    settings.hero_description ||
    "I'm Lord Zicco, a graphic designer focused on creating modern, bold and memorable visual identities.";

  return (
    <section id="home" className="relative min-h-[92vh] pt-28 pb-16 flex items-center overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#4D8DFF]/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-[450px] h-[450px] bg-[#8B5CF6]/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-[600px] h-32 bg-[#22D3EE]/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Subtle grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, #4D8DFF 1px, transparent 0)`,
          backgroundSize: '36px 36px',
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-10">
        {/* 2-Column Split: Typographic Column + Cinematic Designer Image */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Typographic Hierarchy */}
          <div className="lg:col-span-7 flex flex-col justify-center">
            {/* Small Label with Edit button */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="w-8 h-[2px] bg-gradient-to-r from-[#4D8DFF] to-[#8B5CF6]" />
                <span className="font-mono text-xs font-semibold tracking-widest text-[#4D8DFF] uppercase">
                  — {label}
                </span>
              </div>

              {isAuthenticated && isEditMode && onEditHero && (
                <button
                  onClick={onEditHero}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#4D8DFF]/15 border border-[#4D8DFF]/40 text-[#4D8DFF] hover:bg-[#4D8DFF] hover:text-white text-xs font-semibold transition-all shadow-sm group"
                  title="Edit Hero Title, Subtitle & Social Links"
                >
                  <Edit3 className="w-3.5 h-3.5 transition-transform group-hover:scale-110" />
                  <span>Edit Hero Section</span>
                </button>
              )}
            </div>

            {/* Main Headline */}
            <h1 className="font-display font-extrabold text-4xl sm:text-5xl lg:text-6xl tracking-tight text-[#F8FAFC] leading-[1.08] mb-6">
              CREATIVE DESIGN. <br />
              <span className="bg-gradient-to-r from-[#4D8DFF] via-[#8B5CF6] to-[#22D3EE] bg-clip-text text-transparent">
                BOLD
              </span>{' '}
              IDEAS.
            </h1>

            {/* Description */}
            <p className="text-base sm:text-lg text-[#94A3B8] leading-relaxed max-w-xl mb-8">
              {description}
            </p>

            {/* Buttons */}
            <div className="flex flex-wrap items-center gap-4 mb-10">
              <button
                onClick={onExplore}
                className="group px-7 py-3.5 rounded-xl bg-gradient-to-r from-[#4D8DFF] to-[#8B5CF6] hover:from-[#3b7bed] hover:to-[#7c3aed] text-white font-semibold text-sm shadow-lg shadow-[#4D8DFF]/20 hover:shadow-[#4D8DFF]/40 transition-all duration-300 flex items-center gap-2.5 transform active:scale-95"
              >
                <span>Explore Portfolio</span>
                <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
              </button>

              <button
                onClick={onContact}
                className="px-7 py-3.5 rounded-xl border border-[#24304A] hover:border-[#4D8DFF]/60 bg-[#111A30]/60 hover:bg-[#111A30] text-[#F8FAFC] font-semibold text-sm transition-all duration-300 flex items-center gap-2"
              >
                <span>Let's Work Together</span>
                <ArrowRight className="w-4 h-4 text-[#4D8DFF]" />
              </button>
            </div>

            {/* Hero Social Links */}
            <div className="flex items-center gap-5 pt-4 border-t border-[#24304A]/60">
              <span className="text-xs font-medium text-[#94A3B8]">CONNECT:</span>
              <div className="flex items-center gap-3">
                <a
                  href={settings.social_instagram || 'https://instagram.com/lordzicco'}
                  target="_blank"
                  rel="noreferrer"
                  className="w-9 h-9 rounded-lg border border-[#24304A] bg-[#0D1326] flex items-center justify-center text-[#94A3B8] hover:text-[#4D8DFF] hover:border-[#4D8DFF]/50 transition-colors"
                  aria-label="Instagram"
                >
                  <Instagram className="w-4 h-4" />
                </a>
                <a
                  href={settings.social_x || 'https://x.com/lordzicco'}
                  target="_blank"
                  rel="noreferrer"
                  className="w-9 h-9 rounded-lg border border-[#24304A] bg-[#0D1326] flex items-center justify-center text-[#94A3B8] hover:text-[#4D8DFF] hover:border-[#4D8DFF]/50 transition-colors"
                  aria-label="X (Twitter)"
                >
                  <Twitter className="w-4 h-4" />
                </a>
                <a
                  href={settings.social_behance || 'https://behance.net/lordzicco'}
                  target="_blank"
                  rel="noreferrer"
                  className="w-9 h-9 rounded-lg border border-[#24304A] bg-[#0D1326] flex items-center justify-center text-[#94A3B8] hover:text-[#4D8DFF] hover:border-[#4D8DFF]/50 transition-colors font-bold text-xs"
                  aria-label="Behance"
                >
                  Bē
                </a>
                <a
                  href={settings.social_youtube || 'https://youtube.com/@lordzicco'}
                  target="_blank"
                  rel="noreferrer"
                  className="w-9 h-9 rounded-lg border border-[#24304A] bg-[#0D1326] flex items-center justify-center text-[#94A3B8] hover:text-[#4D8DFF] hover:border-[#4D8DFF]/50 transition-colors"
                  aria-label="YouTube"
                >
                  <Youtube className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>

          {/* Right Column: Large Cinematic Designer Showcase */}
          <div className="lg:col-span-5 relative flex justify-center items-center">
            {/* Glowing Backdrop Border */}
            <div className="relative w-full max-w-md aspect-[3/4] rounded-2xl p-[2px] bg-gradient-to-b from-[#4D8DFF]/40 via-[#8B5CF6]/30 to-[#22D3EE]/20 shadow-2xl shadow-black/80">
              {/* Inner card container */}
              <div className="relative w-full h-full rounded-[14px] overflow-hidden bg-[#0D1326]">
                <img
                  src={heroImage}
                  alt="Lord Zicco — Graphic and Creative Designer"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover object-center filter contrast-105 brightness-95"
                />

                {/* Cinematic Gradient Overlays */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#070B17] via-[#070B17]/20 to-transparent pointer-events-none" />
                <div className="absolute inset-0 bg-gradient-to-tr from-[#4D8DFF]/15 via-transparent to-[#8B5CF6]/15 pointer-events-none mix-blend-screen" />

                {/* Hand-lettered / Decorative Brand Tag */}
                <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between pointer-events-none">
                  <div>
                    <span className="font-mono text-[11px] text-[#22D3EE] font-semibold tracking-widest uppercase">
                      VISUAL DIRECTOR
                    </span>
                    <h3 className="font-display font-black text-2xl text-[#F8FAFC] tracking-tight">
                      LORD ZICCO
                    </h3>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-[10px] text-[#94A3B8] tracking-widest block">
                      DESIGN · BUILD · INSPIRE
                    </span>
                  </div>
                </div>
              </div>

              {/* Floating decorative corner badges */}
              <div className="absolute -top-3 -right-3 px-3 py-1.5 rounded-lg bg-[#111A30]/90 backdrop-blur-md border border-[#4D8DFF]/40 shadow-lg text-[11px] font-mono text-[#4D8DFF] flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-[#22D3EE]" />
                <span>ACCRA // GHANA</span>
              </div>

              {isAuthenticated && isEditMode && (
                <div className="absolute -top-3.5 -left-3.5 z-20 flex items-center gap-1.5">
                  <label className="cursor-pointer px-3 py-1.5 rounded-lg bg-[#4D8DFF] text-white shadow-xl text-[11px] font-mono font-semibold flex items-center gap-1.5 hover:bg-[#3b7bed] transition-all">
                    {isUploading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Upload className="w-3.5 h-3.5" />
                    )}
                    <span>{isUploading ? 'Uploading...' : 'Upload Picture'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleDirectHeroUpload}
                      className="hidden"
                      disabled={isUploading}
                    />
                  </label>
                  {onEditHero && (
                    <button
                      onClick={onEditHero}
                      className="px-2.5 py-1.5 rounded-lg bg-[#0D1326]/90 backdrop-blur-md border border-[#4D8DFF]/40 text-[#4D8DFF] hover:bg-[#111A30] hover:text-white shadow-lg text-[11px] font-mono font-semibold flex items-center gap-1 transition-all"
                      title="Edit Hero Headline & Bio"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Edit Info</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Full-width Metrics Strip below the split */}
        <div className="mt-16 pt-8 border-t border-[#24304A]/60 grid grid-cols-2 sm:grid-cols-4 gap-6">
          <div>
            <div className="font-display font-extrabold text-3xl sm:text-4xl text-[#F8FAFC] tabular-nums">
              {settings.stat_experience || '2+'}
            </div>
            <div className="text-xs font-medium text-[#94A3B8] uppercase tracking-wider mt-1">
              Years Experience
            </div>
          </div>
          <div>
            <div className="font-display font-extrabold text-3xl sm:text-4xl text-[#4D8DFF] tabular-nums">
              {settings.stat_projects || '100+'}
            </div>
            <div className="text-xs font-medium text-[#94A3B8] uppercase tracking-wider mt-1">
              Projects Completed
            </div>
          </div>
          <div>
            <div className="font-display font-extrabold text-3xl sm:text-4xl text-[#8B5CF6] tabular-nums">
              {settings.stat_clients || '50+'}
            </div>
            <div className="text-xs font-medium text-[#94A3B8] uppercase tracking-wider mt-1">
              Happy Clients
            </div>
          </div>
          <div>
            <div className="font-display font-extrabold text-3xl sm:text-4xl text-[#22D3EE] tabular-nums">
              100%
            </div>
            <div className="text-xs font-medium text-[#94A3B8] uppercase tracking-wider mt-1">
              Creative Dedication
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
