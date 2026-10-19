import React, { useState, useEffect } from 'react';
import {
  X,
  Upload,
  Check,
  Trash2,
  Sparkles,
  Edit3,
  Layers,
  Briefcase,
  Phone,
  FolderPlus,
  AlertCircle,
  ExternalLink,
  Image as ImageIcon,
} from 'lucide-react';
import {
  SiteSettings,
  Project,
  PortfolioSection,
  ServiceItem,
} from '../../types.ts';
import {
  updateAdminSettings,
  createAdminProject,
  updateAdminProject,
  deleteAdminProject,
  createAdminService,
  updateAdminService,
  deleteAdminService,
  createAdminSection,
  uploadImageFile,
} from '../../services/api.ts';

export type PublicEditorMode =
  | 'hero'
  | 'about'
  | 'project'
  | 'service'
  | 'category'
  | 'contact';

interface PublicSiteEditorModalProps {
  mode: PublicEditorMode;
  item?: any; // For editing existing project or service
  sections: PortfolioSection[];
  settings: SiteSettings;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

export const PublicSiteEditorModal: React.FC<PublicSiteEditorModalProps> = ({
  mode,
  item,
  sections,
  settings,
  onClose,
  onSuccess,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Hero form state
  const [heroForm, setHeroForm] = useState({
    hero_label: settings.hero_label || 'GRAPHIC DESIGNER',
    hero_headline: settings.hero_headline || 'CREATIVE DESIGN.\nBOLD IDEAS.',
    hero_description:
      settings.hero_description ||
      "I'm Lord Zicco, a graphic designer focused on creating modern, bold and memorable visual identities.",
    hero_image: settings.hero_image || '',
    hero_bg_image: settings.hero_bg_image || '',
    brand_logo_image: settings.brand_logo_image || '',
    social_instagram: settings.social_instagram || 'https://instagram.com/lordzicco',
    social_x: settings.social_x || 'https://x.com/lordzicco',
    social_behance: settings.social_behance || 'https://behance.net/lordzicco',
    social_youtube: settings.social_youtube || 'https://youtube.com/@lordzicco',
  });

  // About form state
  const [aboutForm, setAboutForm] = useState({
    about_title: settings.about_title || 'TURNING IDEAS INTO\nVISUAL EXPERIENCES.',
    about_description:
      settings.about_description ||
      "I'm a graphic designer with a passion for turning ideas into powerful visual experiences. I specialize in branding, digital design, poster design, apparel and UI/UX.",
    about_quote:
      settings.about_quote ||
      "Great design isn't just what it looks like. It's how it makes you feel.",
    about_image: settings.about_image || '',
    stat_experience: settings.stat_experience || '06+',
    stat_projects: settings.stat_projects || '140+',
    stat_clients: settings.stat_clients || '85+',
  });

  // Project form state (with cover image and multiple gallery pictures)
  const [projectForm, setProjectForm] = useState({
    id: item?.id || null,
    title: item?.title || '',
    slug: item?.slug || '',
    sectionId: item?.sectionId || (sections[0]?.id || 1),
    shortDescription: item?.shortDescription || '',
    description: item?.description || '',
    coverImage: item?.coverImage || '',
    galleryImages: (item?.images || []).map((img: any) =>
      typeof img === 'string' ? img : img.imageUrl
    ) as string[],
    client: item?.client || '',
    projectDate: item?.projectDate || new Date().getFullYear().toString(),
    tools: item?.tools || 'Photoshop, Illustrator, InDesign',
    tags: item?.tags || 'Branding, Typography',
    projectUrl: item?.projectUrl || '',
    isFeatured: item?.isFeatured ?? true,
    isPublished: item?.isPublished ?? true,
  });

  // Service form state
  const [serviceForm, setServiceForm] = useState({
    id: item?.id || null,
    number: item?.number || '01',
    title: item?.title || '',
    description: item?.description || '',
    icon: item?.icon || 'Sparkles',
    isVisible: item?.isVisible ?? true,
  });

  // Category form state (with cover image upload)
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    slug: '',
    description: '',
    coverImage: '',
  });

  // Contact form state
  const [contactForm, setContactForm] = useState({
    contact_email: settings.contact_email || 'lordzicco@gmail.com',
    contact_phone: settings.contact_phone || '+233 54 123 4567',
    contact_location: settings.contact_location || 'Accra, Ghana',
  });

  // Image Upload helper
  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    onUploaded: (url: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setErrorMessage('');

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const fileData = reader.result as string;
        const uploadedUrl = await uploadImageFile(fileData, file.name);
        onUploaded(uploadedUrl);
      } catch (err: any) {
        setErrorMessage(err.message || 'Image upload failed');
      } finally {
        setIsUploading(false);
      }
    };
    reader.onerror = () => {
      setErrorMessage('Failed to read image file');
      setIsUploading(false);
    };
  };

  const handleMultipleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    onUploadedMany: (urls: string[]) => void
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setErrorMessage('');

    try {
      const uploadedUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        const url = await uploadImageFile(dataUrl, file.name);
        uploadedUrls.push(url);
      }
      onUploadedMany(uploadedUrls);
    } catch (err: any) {
      setErrorMessage(err.message || 'Gallery images upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveHero = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');
    try {
      await updateAdminSettings(heroForm);
      onSuccess('Hero section updated successfully!');
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update hero section');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveAbout = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');
    try {
      await updateAdminSettings(aboutForm);
      onSuccess('About section updated successfully!');
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update about section');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectForm.title.trim()) {
      setErrorMessage('Project title is required.');
      return;
    }

    const slug =
      projectForm.slug.trim() ||
      projectForm.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      if (projectForm.id) {
        await updateAdminProject(projectForm.id, {
          ...projectForm,
          slug,
        });
        onSuccess(`Project "${projectForm.title}" updated successfully!`);
      } else {
        await createAdminProject({
          ...projectForm,
          slug,
          coverImage:
            projectForm.coverImage ||
            'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
        });
        onSuccess(`Project "${projectForm.title}" created successfully!`);
      }
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save project');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!projectForm.id) return;
    if (!window.confirm(`Are you sure you want to delete "${projectForm.title}"?`)) return;

    setIsSubmitting(true);
    try {
      await deleteAdminProject(projectForm.id);
      onSuccess('Project deleted successfully.');
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to delete project');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceForm.title.trim()) {
      setErrorMessage('Service title is required.');
      return;
    }
    setIsSubmitting(true);
    setErrorMessage('');
    try {
      if (serviceForm.id) {
        await updateAdminService(serviceForm.id, serviceForm);
        onSuccess(`Service "${serviceForm.title}" updated!`);
      } else {
        await createAdminService({
          ...serviceForm,
          sortOrder: 0,
        });
        onSuccess(`Service "${serviceForm.title}" added!`);
      }
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save service');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteService = async () => {
    if (!serviceForm.id) return;
    if (!window.confirm(`Delete service "${serviceForm.title}"?`)) return;

    setIsSubmitting(true);
    try {
      await deleteAdminService(serviceForm.id);
      onSuccess('Service removed.');
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to delete service');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryForm.name.trim()) {
      setErrorMessage('Category name is required.');
      return;
    }
    const slug =
      categoryForm.slug.trim() ||
      categoryForm.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

    setIsSubmitting(true);
    setErrorMessage('');
    try {
      await createAdminSection({
        name: categoryForm.name.trim(),
        slug,
        description: categoryForm.description.trim(),
        coverImage: categoryForm.coverImage || '',
        sortOrder: sections.length + 1,
        isVisible: true,
      });
      onSuccess(`New category "${categoryForm.name}" created!`);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to create category');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');
    try {
      await updateAdminSettings(contactForm);
      onSuccess('Contact details updated successfully!');
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save contact settings');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl border border-[#24304A] bg-[#070B17] shadow-2xl relative overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#24304A] bg-[#0D1326]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#4D8DFF] to-[#8B5CF6] p-[1px]">
              <div className="w-full h-full bg-[#070B17] rounded-[11px] flex items-center justify-center text-[#4D8DFF]">
                {mode === 'hero' && <Sparkles className="w-4 h-4" />}
                {mode === 'about' && <Edit3 className="w-4 h-4" />}
                {mode === 'project' && <Briefcase className="w-4 h-4" />}
                {mode === 'service' && <Layers className="w-4 h-4" />}
                {mode === 'category' && <FolderPlus className="w-4 h-4" />}
                {mode === 'contact' && <Phone className="w-4 h-4" />}
              </div>
            </div>
            <div>
              <h3 className="font-display font-bold text-base text-[#F8FAFC]">
                {mode === 'hero' && 'Edit Hero & Intro Section'}
                {mode === 'about' && 'Edit About Story, Bio & Statistics'}
                {mode === 'project' && (projectForm.id ? 'Edit Portfolio Project' : 'Add New Portfolio Project')}
                {mode === 'service' && (serviceForm.id ? 'Edit Creative Service' : 'Add Creative Service')}
                {mode === 'category' && 'Add New Portfolio Category'}
                {mode === 'contact' && 'Edit Public Contact Info'}
              </h3>
              <p className="text-[11px] text-[#94A3B8]">
                Changes are saved directly to your live portfolio database.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#94A3B8] hover:text-white hover:bg-[#111A30] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error notice */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-2.5 text-xs text-red-400">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Modal Body / Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* 1. HERO SECTION FORM */}
          {mode === 'hero' && (
            <form onSubmit={handleSaveHero} id="public-editor-form" className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-1.5">
                  Hero Eyebrow Label
                </label>
                <input
                  type="text"
                  value={heroForm.hero_label}
                  onChange={(e) => setHeroForm({ ...heroForm, hero_label: e.target.value })}
                  placeholder="GRAPHIC DESIGNER"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0D1326] border border-[#24304A] focus:border-[#4D8DFF] text-sm text-[#F8FAFC] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-1.5">
                  Hero Description
                </label>
                <textarea
                  rows={3}
                  value={heroForm.hero_description}
                  onChange={(e) => setHeroForm({ ...heroForm, hero_description: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0D1326] border border-[#24304A] focus:border-[#4D8DFF] text-sm text-[#F8FAFC] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-1.5">
                  Hero Portrait Image (URL or Upload File)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={heroForm.hero_image}
                    onChange={(e) => setHeroForm({ ...heroForm, hero_image: e.target.value })}
                    placeholder="/src/assets/images/... or https://..."
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#0D1326] border border-[#24304A] focus:border-[#4D8DFF] text-xs text-[#F8FAFC] outline-none"
                  />
                  <label className="px-3.5 py-2.5 rounded-xl border border-[#24304A] bg-[#111A30] hover:bg-[#16223e] hover:border-[#4D8DFF]/50 text-xs font-medium text-[#F8FAFC] flex items-center gap-1.5 cursor-pointer">
                    <Upload className="w-3.5 h-3.5 text-[#4D8DFF]" />
                    <span>{isUploading ? 'Uploading...' : 'Upload'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        handleFileUpload(e, (url) => setHeroForm((p) => ({ ...p, hero_image: url })))
                      }
                      className="hidden"
                      disabled={isUploading}
                    />
                  </label>
                </div>
                {heroForm.hero_image && (
                  <div className="mt-3 relative w-32 aspect-[3/4] rounded-xl overflow-hidden border border-[#24304A]">
                    <img
                      src={heroForm.hero_image}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-1.5">
                  Hero Background Banner / Graphic (Optional)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={heroForm.hero_bg_image}
                    onChange={(e) => setHeroForm({ ...heroForm, hero_bg_image: e.target.value })}
                    placeholder="https://... or upload custom background visual"
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#0D1326] border border-[#24304A] focus:border-[#4D8DFF] text-xs text-[#F8FAFC] outline-none"
                  />
                  <label className="px-3.5 py-2.5 rounded-xl border border-[#24304A] bg-[#111A30] hover:bg-[#16223e] hover:border-[#4D8DFF]/50 text-xs font-medium text-[#F8FAFC] flex items-center gap-1.5 cursor-pointer">
                    <Upload className="w-3.5 h-3.5 text-[#8B5CF6]" />
                    <span>Upload</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        handleFileUpload(e, (url) => setHeroForm((p) => ({ ...p, hero_bg_image: url })))
                      }
                      className="hidden"
                      disabled={isUploading}
                    />
                  </label>
                </div>
                {heroForm.hero_bg_image && (
                  <div className="mt-2 relative w-48 h-20 rounded-xl overflow-hidden border border-[#24304A]">
                    <img
                      src={heroForm.hero_bg_image}
                      alt="Background preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-1.5">
                  Custom Brand Logo / Mark (Optional)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={heroForm.brand_logo_image}
                    onChange={(e) => setHeroForm({ ...heroForm, brand_logo_image: e.target.value })}
                    placeholder="https://... or upload PNG/SVG logo"
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#0D1326] border border-[#24304A] focus:border-[#4D8DFF] text-xs text-[#F8FAFC] outline-none"
                  />
                  <label className="px-3.5 py-2.5 rounded-xl border border-[#24304A] bg-[#111A30] hover:bg-[#16223e] hover:border-[#4D8DFF]/50 text-xs font-medium text-[#F8FAFC] flex items-center gap-1.5 cursor-pointer">
                    <Upload className="w-3.5 h-3.5 text-[#22D3EE]" />
                    <span>Upload</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        handleFileUpload(e, (url) => setHeroForm((p) => ({ ...p, brand_logo_image: url })))
                      }
                      className="hidden"
                      disabled={isUploading}
                    />
                  </label>
                </div>
                {heroForm.brand_logo_image && (
                  <div className="mt-2 relative w-16 h-16 rounded-xl overflow-hidden border border-[#24304A] p-2 bg-[#0D1326]">
                    <img
                      src={heroForm.brand_logo_image}
                      alt="Logo preview"
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-[#24304A]">
                <span className="block text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-2">
                  Social Links
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-[#94A3B8] mb-1">Instagram URL</label>
                    <input
                      type="text"
                      value={heroForm.social_instagram}
                      onChange={(e) => setHeroForm({ ...heroForm, social_instagram: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-[#0D1326] border border-[#24304A] text-xs text-[#F8FAFC] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-[#94A3B8] mb-1">X (Twitter) URL</label>
                    <input
                      type="text"
                      value={heroForm.social_x}
                      onChange={(e) => setHeroForm({ ...heroForm, social_x: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-[#0D1326] border border-[#24304A] text-xs text-[#F8FAFC] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-[#94A3B8] mb-1">Behance URL</label>
                    <input
                      type="text"
                      value={heroForm.social_behance}
                      onChange={(e) => setHeroForm({ ...heroForm, social_behance: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-[#0D1326] border border-[#24304A] text-xs text-[#F8FAFC] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-[#94A3B8] mb-1">YouTube URL</label>
                    <input
                      type="text"
                      value={heroForm.social_youtube}
                      onChange={(e) => setHeroForm({ ...heroForm, social_youtube: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-[#0D1326] border border-[#24304A] text-xs text-[#F8FAFC] outline-none"
                    />
                  </div>
                </div>
              </div>
            </form>
          )}

          {/* 2. ABOUT SECTION FORM */}
          {mode === 'about' && (
            <form onSubmit={handleSaveAbout} id="public-editor-form" className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-1.5">
                  About Section Headline
                </label>
                <textarea
                  rows={2}
                  value={aboutForm.about_title}
                  onChange={(e) => setAboutForm({ ...aboutForm, about_title: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0D1326] border border-[#24304A] text-sm text-[#F8FAFC] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-1.5">
                  Bio & Professional Journey
                </label>
                <textarea
                  rows={4}
                  value={aboutForm.about_description}
                  onChange={(e) => setAboutForm({ ...aboutForm, about_description: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0D1326] border border-[#24304A] text-sm text-[#F8FAFC] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-1.5">
                  Philosophy / Quote
                </label>
                <input
                  type="text"
                  value={aboutForm.about_quote}
                  onChange={(e) => setAboutForm({ ...aboutForm, about_quote: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0D1326] border border-[#24304A] text-sm text-[#F8FAFC] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-1.5">
                  Studio Image (URL or Upload)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={aboutForm.about_image}
                    onChange={(e) => setAboutForm({ ...aboutForm, about_image: e.target.value })}
                    placeholder="/src/assets/images/... or https://..."
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#0D1326] border border-[#24304A] text-xs text-[#F8FAFC] outline-none"
                  />
                  <label className="px-3.5 py-2.5 rounded-xl border border-[#24304A] bg-[#111A30] hover:bg-[#16223e] text-xs font-medium text-[#F8FAFC] flex items-center gap-1.5 cursor-pointer">
                    <Upload className="w-3.5 h-3.5 text-[#4D8DFF]" />
                    <span>Upload</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        handleFileUpload(e, (url) => setAboutForm((p) => ({ ...p, about_image: url })))
                      }
                      className="hidden"
                      disabled={isUploading}
                    />
                  </label>
                </div>
              </div>

              <div className="pt-2 border-t border-[#24304A] grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] text-[#94A3B8] mb-1">Years Experience</label>
                  <input
                    type="text"
                    value={aboutForm.stat_experience}
                    onChange={(e) => setAboutForm({ ...aboutForm, stat_experience: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#0D1326] border border-[#24304A] text-xs text-[#F8FAFC] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-[#94A3B8] mb-1">Projects Count</label>
                  <input
                    type="text"
                    value={aboutForm.stat_projects}
                    onChange={(e) => setAboutForm({ ...aboutForm, stat_projects: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#0D1326] border border-[#24304A] text-xs text-[#F8FAFC] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-[#94A3B8] mb-1">Clients Stat</label>
                  <input
                    type="text"
                    value={aboutForm.stat_clients}
                    onChange={(e) => setAboutForm({ ...aboutForm, stat_clients: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#0D1326] border border-[#24304A] text-xs text-[#F8FAFC] outline-none"
                  />
                </div>
              </div>
            </form>
          )}

          {/* 3. PROJECT FORM (CREATE OR EDIT) */}
          {mode === 'project' && (
            <form onSubmit={handleSaveProject} id="public-editor-form" className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-1.5">
                    Project Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={projectForm.title}
                    onChange={(e) => {
                      const title = e.target.value;
                      setProjectForm((prev) => ({
                        ...prev,
                        title,
                        slug: prev.id
                          ? prev.slug
                          : title
                              .toLowerCase()
                              .replace(/[^a-z0-9]+/g, '-')
                              .replace(/^-|-$/g, ''),
                      }));
                    }}
                    placeholder="e.g. Neo-Tokyo Cyberpunk Brand"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0D1326] border border-[#24304A] text-sm text-[#F8FAFC] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-1.5">
                    Category / Section *
                  </label>
                  <select
                    value={projectForm.sectionId}
                    onChange={(e) =>
                      setProjectForm({ ...projectForm, sectionId: parseInt(e.target.value, 10) })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0D1326] border border-[#24304A] text-sm text-[#F8FAFC] outline-none"
                  >
                    {sections.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-1.5">
                  Cover Image (File Upload or Direct URL)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={projectForm.coverImage}
                    onChange={(e) => setProjectForm({ ...projectForm, coverImage: e.target.value })}
                    placeholder="https://... or upload local image file"
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#0D1326] border border-[#24304A] text-xs text-[#F8FAFC] outline-none"
                  />
                  <label className="px-3.5 py-2.5 rounded-xl border border-[#24304A] bg-[#111A30] hover:bg-[#16223e] text-xs font-medium text-[#F8FAFC] flex items-center gap-1.5 cursor-pointer">
                    <Upload className="w-3.5 h-3.5 text-[#4D8DFF]" />
                    <span>Upload</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        handleFileUpload(e, (url) =>
                          setProjectForm((p) => ({ ...p, coverImage: url }))
                        )
                      }
                      className="hidden"
                      disabled={isUploading}
                    />
                  </label>
                </div>
                {projectForm.coverImage && (
                  <div className="mt-2 relative w-44 aspect-[4/3] rounded-xl overflow-hidden border border-[#24304A]">
                    <img
                      src={projectForm.coverImage}
                      alt="Project cover preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>

              {/* Additional Gallery Photos / Mockups */}
              <div className="p-4 rounded-xl border border-[#24304A] bg-[#0D1326]/60 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">
                      Project Gallery Pictures ({projectForm.galleryImages.length})
                    </label>
                    <span className="text-[11px] text-[#94A3B8]/70 block">
                      Upload case study mockups, alternate posters, details, and branding collateral.
                    </span>
                  </div>
                  <label className="px-3 py-1.5 rounded-lg border border-[#4D8DFF]/40 bg-[#4D8DFF]/10 hover:bg-[#4D8DFF] hover:text-white text-xs font-semibold text-[#4D8DFF] flex items-center gap-1.5 cursor-pointer transition-all self-start sm:self-auto">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Pictures</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) =>
                        handleMultipleFileUpload(e, (newUrls) =>
                          setProjectForm((prev) => ({
                            ...prev,
                            galleryImages: [...prev.galleryImages, ...newUrls],
                          }))
                        )
                      }
                      className="hidden"
                      disabled={isUploading}
                    />
                  </label>
                </div>

                {/* Uploaded Gallery Thumbnails */}
                {projectForm.galleryImages.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                    {projectForm.galleryImages.map((imgUrl, idx) => (
                      <div
                        key={idx}
                        className="relative group aspect-[4/3] rounded-lg overflow-hidden border border-[#24304A] bg-[#111A30]"
                      >
                        <img
                          src={imgUrl}
                          alt={`Gallery photo ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setProjectForm((prev) => ({
                              ...prev,
                              galleryImages: prev.galleryImages.filter((_, i) => i !== idx),
                            }))
                          }
                          className="absolute top-1.5 right-1.5 p-1 rounded-md bg-red-500/80 hover:bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity shadow"
                          title="Remove picture"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-1.5">
                  Short Hook / Subtitle
                </label>
                <input
                  type="text"
                  value={projectForm.shortDescription}
                  onChange={(e) => setProjectForm({ ...projectForm, shortDescription: e.target.value })}
                  placeholder="Comprehensive visual identity system for next-gen apparel brand."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0D1326] border border-[#24304A] text-xs text-[#F8FAFC] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-1.5">
                  Full Project Case Study / Story
                </label>
                <textarea
                  rows={4}
                  value={projectForm.description}
                  onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
                  placeholder="Detail the creative process, typography choices, color palette, and results delivered for this client..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0D1326] border border-[#24304A] text-xs text-[#F8FAFC] outline-none leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] text-[#94A3B8] mb-1">Client</label>
                  <input
                    type="text"
                    value={projectForm.client}
                    onChange={(e) => setProjectForm({ ...projectForm, client: e.target.value })}
                    placeholder="Aethelgard Records"
                    className="w-full px-3 py-2 rounded-xl bg-[#0D1326] border border-[#24304A] text-xs text-[#F8FAFC] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-[#94A3B8] mb-1">Year / Date</label>
                  <input
                    type="text"
                    value={projectForm.projectDate}
                    onChange={(e) => setProjectForm({ ...projectForm, projectDate: e.target.value })}
                    placeholder="2026"
                    className="w-full px-3 py-2 rounded-xl bg-[#0D1326] border border-[#24304A] text-xs text-[#F8FAFC] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-[#94A3B8] mb-1">External Link</label>
                  <input
                    type="text"
                    value={projectForm.projectUrl}
                    onChange={(e) => setProjectForm({ ...projectForm, projectUrl: e.target.value })}
                    placeholder="https://behance.net/..."
                    className="w-full px-3 py-2 rounded-xl bg-[#0D1326] border border-[#24304A] text-xs text-[#F8FAFC] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-[#94A3B8] mb-1">Tools Used</label>
                  <input
                    type="text"
                    value={projectForm.tools}
                    onChange={(e) => setProjectForm({ ...projectForm, tools: e.target.value })}
                    placeholder="Photoshop, Illustrator, Blender"
                    className="w-full px-3 py-2 rounded-xl bg-[#0D1326] border border-[#24304A] text-xs text-[#F8FAFC] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-[#94A3B8] mb-1">Tags (comma separated)</label>
                  <input
                    type="text"
                    value={projectForm.tags}
                    onChange={(e) => setProjectForm({ ...projectForm, tags: e.target.value })}
                    placeholder="Identity, 3D, Poster"
                    className="w-full px-3 py-2 rounded-xl bg-[#0D1326] border border-[#24304A] text-xs text-[#F8FAFC] outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-[#F8FAFC]">
                  <input
                    type="checkbox"
                    checked={projectForm.isFeatured}
                    onChange={(e) => setProjectForm({ ...projectForm, isFeatured: e.target.checked })}
                    className="rounded bg-[#0D1326] border-[#24304A] text-[#4D8DFF] focus:ring-0"
                  />
                  <span>Feature on Highlight Showcase</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs text-[#F8FAFC]">
                  <input
                    type="checkbox"
                    checked={projectForm.isPublished}
                    onChange={(e) => setProjectForm({ ...projectForm, isPublished: e.target.checked })}
                    className="rounded bg-[#0D1326] border-[#24304A] text-[#4D8DFF] focus:ring-0"
                  />
                  <span>Published to Public Site</span>
                </label>
              </div>
            </form>
          )}

          {/* 4. SERVICE FORM */}
          {mode === 'service' && (
            <form onSubmit={handleSaveService} id="public-editor-form" className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-1.5">
                    Service Number (e.g. 01, 02)
                  </label>
                  <input
                    type="text"
                    value={serviceForm.number}
                    onChange={(e) => setServiceForm({ ...serviceForm, number: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0D1326] border border-[#24304A] text-sm text-[#F8FAFC] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-1.5">
                    Icon Theme
                  </label>
                  <select
                    value={serviceForm.icon}
                    onChange={(e) => setServiceForm({ ...serviceForm, icon: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0D1326] border border-[#24304A] text-sm text-[#F8FAFC] outline-none"
                  >
                    <option value="PenTool">PenTool (Branding & Logo)</option>
                    <option value="Sparkles">Sparkles (Creative Direction)</option>
                    <option value="Layers">Layers (Poster & Print)</option>
                    <option value="Shirt">Shirt (Apparel & Merch)</option>
                    <option value="Share2">Share2 (Social Content)</option>
                    <option value="Layout">Layout (UI / Web)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-1.5">
                  Service Title *
                </label>
                <input
                  type="text"
                  required
                  value={serviceForm.title}
                  onChange={(e) => setServiceForm({ ...serviceForm, title: e.target.value })}
                  placeholder="e.g. Brand Identity & Logo Design"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0D1326] border border-[#24304A] text-sm text-[#F8FAFC] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-1.5">
                  Service Description
                </label>
                <textarea
                  rows={3}
                  value={serviceForm.description}
                  onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
                  placeholder="Detail deliverables, craft approach, and value for the client..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0D1326] border border-[#24304A] text-sm text-[#F8FAFC] outline-none"
                />
              </div>
            </form>
          )}

          {/* 5. CATEGORY FORM */}
          {mode === 'category' && (
            <form onSubmit={handleSaveCategory} id="public-editor-form" className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-1.5">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  value={categoryForm.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    setCategoryForm({
                      ...categoryForm,
                      name,
                      slug: name
                        .toLowerCase()
                        .replace(/[^a-z0-9]+/g, '-')
                        .replace(/^-|-$/g, ''),
                    });
                  }}
                  placeholder="e.g. 3D Motion & Spatial"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0D1326] border border-[#24304A] text-sm text-[#F8FAFC] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-1.5">
                  URL Slug
                </label>
                <input
                  type="text"
                  value={categoryForm.slug}
                  onChange={(e) => setCategoryForm({ ...categoryForm, slug: e.target.value })}
                  placeholder="3d-motion-spatial"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0D1326] border border-[#24304A] text-xs text-[#F8FAFC] font-mono outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-1.5">
                  Category Description (Optional)
                </label>
                <input
                  type="text"
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                  placeholder="Visual explorations in 3D and spatial interaction"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0D1326] border border-[#24304A] text-xs text-[#F8FAFC] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-1.5">
                  Category Banner / Cover Image (Optional)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={categoryForm.coverImage}
                    onChange={(e) => setCategoryForm({ ...categoryForm, coverImage: e.target.value })}
                    placeholder="https://... or upload image"
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#0D1326] border border-[#24304A] text-xs text-[#F8FAFC] outline-none"
                  />
                  <label className="px-3.5 py-2.5 rounded-xl border border-[#24304A] bg-[#111A30] hover:bg-[#16223e] text-xs font-medium text-[#F8FAFC] flex items-center gap-1.5 cursor-pointer">
                    <Upload className="w-3.5 h-3.5 text-[#4D8DFF]" />
                    <span>Upload</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        handleFileUpload(e, (url) => setCategoryForm((p) => ({ ...p, coverImage: url })))
                      }
                      className="hidden"
                      disabled={isUploading}
                    />
                  </label>
                </div>
                {categoryForm.coverImage && (
                  <div className="mt-2 relative w-40 h-20 rounded-xl overflow-hidden border border-[#24304A]">
                    <img
                      src={categoryForm.coverImage}
                      alt="Category preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>
            </form>
          )}

          {/* 6. CONTACT FORM */}
          {mode === 'contact' && (
            <form onSubmit={handleSaveContact} id="public-editor-form" className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-1.5">
                  Public Contact Email
                </label>
                <input
                  type="email"
                  value={contactForm.contact_email}
                  onChange={(e) => setContactForm({ ...contactForm, contact_email: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0D1326] border border-[#24304A] text-sm text-[#F8FAFC] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-1.5">
                  Public Phone / WhatsApp
                </label>
                <input
                  type="text"
                  value={contactForm.contact_phone}
                  onChange={(e) => setContactForm({ ...contactForm, contact_phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0D1326] border border-[#24304A] text-sm text-[#F8FAFC] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-1.5">
                  Studio Location
                </label>
                <input
                  type="text"
                  value={contactForm.contact_location}
                  onChange={(e) => setContactForm({ ...contactForm, contact_location: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0D1326] border border-[#24304A] text-sm text-[#F8FAFC] outline-none"
                />
              </div>
            </form>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[#24304A] bg-[#0D1326]">
          <div>
            {mode === 'project' && projectForm.id && (
              <button
                type="button"
                onClick={handleDeleteProject}
                disabled={isSubmitting}
                className="px-3.5 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Project</span>
              </button>
            )}

            {mode === 'service' && serviceForm.id && (
              <button
                type="button"
                onClick={handleDeleteService}
                disabled={isSubmitting}
                className="px-3.5 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Service</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl text-xs font-medium text-[#94A3B8] hover:text-[#F8FAFC] transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              form="public-editor-form"
              disabled={isSubmitting || isUploading}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#4D8DFF] to-[#8B5CF6] hover:from-[#3b7bed] hover:to-[#7c3aed] text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-[#4D8DFF]/25 disabled:opacity-50 transition-all"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Saving to Live Site...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Save & Publish</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
