import React, { useState, useEffect } from 'react';
import { SiteSettings } from '../types.ts';
import { Quote, Edit3, Camera, Upload, Loader2 } from 'lucide-react';
import { uploadImageFile, updateAdminSettings } from '../services/api.ts';

interface AboutProps {
  settings: SiteSettings;
  isAuthenticated?: boolean;
  isEditMode?: boolean;
  onEditAbout?: () => void;
}

export const About: React.FC<AboutProps> = ({
  settings,
  isAuthenticated = false,
  isEditMode = true,
  onEditAbout,
}) => {
  const initialAboutImage = settings.about_image || '/src/assets/images/about_lord_zicco_1792235847162.jpg';
  const [aboutImage, setAboutImage] = useState(initialAboutImage);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (settings.about_image) {
      setAboutImage(settings.about_image);
    }
  }, [settings.about_image]);

  const handleDirectAboutUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const fileData = reader.result as string;
        const uploadedUrl = await uploadImageFile(fileData, file.name);
        await updateAdminSettings({ about_image: uploadedUrl });
        setAboutImage(uploadedUrl);
      } catch (err: any) {
        alert(err.message || 'Failed to upload studio photo');
      } finally {
        setIsUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const aboutTitle = settings.about_title || 'TURNING IDEAS INTO VISUAL EXPERIENCES.';
  const aboutDesc =
    settings.about_description ||
    "I'm a graphic designer with a passion for turning ideas into powerful visual experiences. I specialize in branding, digital design, poster design, apparel and UI/UX.";
  const aboutQuote =
    settings.about_quote || "Great design isn't just what it looks like. It's how it makes you feel.";

  return (
    <section id="about" className="py-24 relative bg-[#0D1326] border-t border-b border-[#24304A]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Professional Studio Image */}
          <div className="lg:col-span-5 relative">
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-[#24304A] bg-[#111A30] shadow-2xl">
              <img
                src={aboutImage}
                alt="Lord Zicco in the Creative Studio"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover object-center filter contrast-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0D1326]/80 via-transparent to-transparent" />

              {/* Direct photo upload trigger and edit modal button */}
              {isAuthenticated && isEditMode && (
                <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
                  <label className="cursor-pointer px-3 py-1.5 rounded-lg bg-[#8B5CF6] text-white shadow-xl text-[11px] font-mono font-semibold flex items-center gap-1.5 hover:bg-[#7c3aed] transition-all">
                    {isUploading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Upload className="w-3.5 h-3.5" />
                    )}
                    <span>{isUploading ? 'Uploading...' : 'Upload Picture'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleDirectAboutUpload}
                      className="hidden"
                      disabled={isUploading}
                    />
                  </label>

                  {onEditAbout && (
                    <button
                      onClick={onEditAbout}
                      className="px-2.5 py-1.5 rounded-lg bg-[#0D1326]/90 backdrop-blur-md border border-[#8B5CF6]/40 text-[#8B5CF6] hover:bg-[#111A30] hover:text-white shadow-lg text-[11px] font-mono font-semibold flex items-center gap-1 transition-all"
                      title="Edit Bio & Numbers"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Edit Story</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Glowing Accent Border Pill */}
            <div className="absolute -bottom-4 -right-4 px-4 py-2 rounded-xl bg-[#111A30]/90 backdrop-blur-md border border-[#4D8DFF]/40 shadow-xl">
              <span className="font-mono text-xs text-[#22D3EE] font-semibold">
                ACCRA // CREATIVE STUDIO
              </span>
            </div>
          </div>

          {/* Right Column: Bio & Core Philosophy */}
          <div className="lg:col-span-7 flex flex-col justify-center">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-[2px] bg-[#8B5CF6]" />
                <span className="font-mono text-xs font-semibold tracking-widest text-[#8B5CF6] uppercase">
                  — ABOUT LORD ZICCO
                </span>
              </div>

              {isAuthenticated && isEditMode && onEditAbout && (
                <button
                  onClick={onEditAbout}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#8B5CF6]/15 border border-[#8B5CF6]/40 text-[#8B5CF6] hover:bg-[#8B5CF6] hover:text-white text-xs font-semibold transition-all shadow-sm group"
                  title="Edit About Story, Bio, Quote & Statistics"
                >
                  <Edit3 className="w-3.5 h-3.5 transition-transform group-hover:scale-110" />
                  <span>Edit About Section</span>
                </button>
              )}
            </div>

            <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-[#F8FAFC] tracking-tight whitespace-pre-line mb-6 leading-tight">
              {aboutTitle}
            </h2>

            <p className="text-base sm:text-lg text-[#94A3B8] leading-relaxed mb-8">
              {aboutDesc}
            </p>

            {/* Quote Card */}
            <div className="relative p-6 rounded-2xl bg-[#111A30]/60 border border-[#24304A] mb-8">
              <Quote className="w-6 h-6 text-[#4D8DFF]/40 mb-2" />
              <blockquote className="font-display italic text-base sm:text-lg text-[#F8FAFC] leading-snug">
                "{aboutQuote}"
              </blockquote>
              <span className="font-mono text-xs text-[#4D8DFF] mt-2 block font-medium">
                — Lord Zicco
              </span>
            </div>

            {/* Numerical Statistics */}
            <div className="grid grid-cols-3 gap-6 pt-4 border-t border-[#24304A]/60">
              <div>
                <div className="font-display font-black text-3xl text-[#4D8DFF] tabular-nums">
                  {settings.stat_experience || '2+'}
                </div>
                <div className="text-xs text-[#94A3B8] uppercase tracking-wider mt-1 font-medium">
                  Years Experience
                </div>
              </div>

              <div>
                <div className="font-display font-black text-3xl text-[#8B5CF6] tabular-nums">
                  {settings.stat_projects || '100+'}
                </div>
                <div className="text-xs text-[#94A3B8] uppercase tracking-wider mt-1 font-medium">
                  Projects Completed
                </div>
              </div>

              <div>
                <div className="font-display font-black text-3xl text-[#22D3EE] tabular-nums">
                  {settings.stat_clients || '50+'}
                </div>
                <div className="text-xs text-[#94A3B8] uppercase tracking-wider mt-1 font-medium">
                  Happy Clients
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
