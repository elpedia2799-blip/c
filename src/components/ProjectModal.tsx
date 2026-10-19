import React, { useEffect, useState } from 'react';
import {
  X,
  ExternalLink,
  Calendar,
  User,
  Wrench,
  Tag,
  ArrowLeft,
  ArrowRight,
  Image as ImageIcon,
  Upload,
  Camera,
  Loader2,
  Trash2,
} from 'lucide-react';
import { Project, ProjectImage } from '../types.ts';
import { fetchProjectBySlug, uploadImageFile, updateAdminProject } from '../services/api.ts';
import { useAuth } from '../context/AuthContext.tsx';

interface ProjectModalProps {
  slug: string;
  onClose: () => void;
  onSelectProjectSlug: (slug: string) => void;
  onEditProject?: (project: Project) => void;
}

export const ProjectModal: React.FC<ProjectModalProps> = ({
  slug,
  onClose,
  onSelectProjectSlug,
  onEditProject,
}) => {
  const { isAuthenticated } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploadingGallery, setIsUploadingGallery] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const handleUploadGalleryPhotos = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !project) return;
    setIsUploadingGallery(true);
    try {
      const newUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        const url = await uploadImageFile(dataUrl, file.name);
        newUrls.push(url);
      }
      const existingImages = (project.images || []).map((img) => img.imageUrl);
      const combined = [...existingImages, ...newUrls];
      await updateAdminProject(project.id, {
        ...project,
        galleryImages: combined,
      });
      setProject((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          images: combined.map((url, i) => ({ imageUrl: url, sortOrder: i + 1 })),
        };
      });
    } catch (err: any) {
      alert(err.message || 'Failed to upload project pictures');
    } finally {
      setIsUploadingGallery(false);
    }
  };

  const handleDeleteGalleryPhoto = async (idxToDelete: number) => {
    if (!project || idxToDelete === 0) return;
    if (!window.confirm('Remove this photo from the project showcase?')) return;
    const imageToDeleteIndex = idxToDelete - 1;
    const remaining = (project.images || [])
      .filter((_, i) => i !== imageToDeleteIndex)
      .map((img) => img.imageUrl);
    try {
      await updateAdminProject(project.id, {
        ...project,
        galleryImages: remaining,
      });
      setProject((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          images: remaining.map((url, i) => ({ imageUrl: url, sortOrder: i + 1 })),
        };
      });
      setActiveImageIndex(0);
    } catch (err: any) {
      alert(err.message || 'Failed to remove picture');
    }
  };

  const handleChangeCoverPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !project) return;
    setIsUploadingGallery(true);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const url = await uploadImageFile(dataUrl, file.name);
      await updateAdminProject(project.id, {
        ...project,
        coverImage: url,
      });
      setProject((prev) => (prev ? { ...prev, coverImage: url } : null));
    } catch (err: any) {
      alert(err.message || 'Failed to update cover picture');
    } finally {
      setIsUploadingGallery(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    fetchProjectBySlug(slug)
      .then((data) => {
        if (isMounted) {
          setProject(data);
          setActiveImageIndex(0);
        }
      })
      .catch((err) => {
        console.error('Failed to load project details:', err);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [slug]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-[#4D8DFF] border-t-transparent rounded-full animate-spin" />
          <span className="font-mono text-xs text-[#94A3B8]">Loading project specifications...</span>
        </div>
      </div>
    );
  }

  if (!project) return null;

  const gallery: ProjectImage[] = [
    { imageUrl: project.coverImage, caption: 'Cover Artwork' },
    ...(project.images || []),
  ];
  const activeImage = gallery[activeImageIndex] || gallery[0];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md p-3 sm:p-6 lg:p-10 flex justify-center items-start animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl rounded-2xl border border-[#24304A] bg-[#070B17] shadow-2xl my-auto overflow-hidden">
        {/* Modal Top Bar */}
        <div className="sticky top-0 z-20 flex items-center justify-between px-6 py-4 bg-[#070B17]/95 backdrop-blur-md border-b border-[#24304A]">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 rounded bg-[#111A30] border border-[#24304A] text-[11px] font-mono text-[#22D3EE] font-semibold">
              {project.sectionName || 'Project'}
            </span>
            <h3 className="font-display font-bold text-base sm:text-lg text-[#F8FAFC] truncate">
              {project.title}
            </h3>
          </div>

          <div className="flex items-center gap-2">
            {onEditProject && (
              <button
                onClick={() => onEditProject(project)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#4D8DFF]/20 border border-[#4D8DFF]/40 text-[#4D8DFF] hover:bg-[#4D8DFF] hover:text-white text-xs font-semibold transition-colors"
                title="Edit this project"
              >
                <span>Edit Project</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-[#111A30] border border-[#24304A] text-[#94A3B8] hover:text-white hover:border-[#4D8DFF] transition-colors"
              aria-label="Close project view"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Content Body */}
        <div className="p-6 sm:p-8 lg:p-10">
          {/* Main Showcase Image */}
          <div className="relative aspect-[16/9] w-full rounded-xl overflow-hidden bg-[#0D1326] border border-[#24304A] shadow-inner mb-6 group">
            <img
              src={activeImage.imageUrl}
              alt={project.title}
              referrerPolicy="no-referrer"
              className="w-full h-full object-contain object-center"
            />
            {activeImage.caption && (
              <div className="absolute bottom-3 left-4 px-3 py-1.5 rounded-lg bg-black/70 backdrop-blur-sm text-xs text-[#F8FAFC] font-medium border border-[#24304A]">
                {activeImage.caption}
              </div>
            )}

            {/* Quick change cover photo for admin when viewing cover */}
            {isAuthenticated && activeImageIndex === 0 && (
              <label
                className="absolute top-4 right-4 z-10 px-3 py-1.5 rounded-lg bg-[#0D1326]/90 backdrop-blur-md border border-[#4D8DFF]/40 text-[#4D8DFF] hover:bg-[#4D8DFF] hover:text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-lg transition-all opacity-0 group-hover:opacity-100"
                title="Upload replacement cover image"
              >
                {isUploadingGallery ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Camera className="w-3.5 h-3.5" />
                )}
                <span>Change Cover Photo</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleChangeCoverPhoto}
                  className="hidden"
                  disabled={isUploadingGallery}
                />
              </label>
            )}
          </div>

          {/* Multiple Gallery Image Thumbnails & Admin Photo Upload */}
          {(gallery.length > 1 || isAuthenticated) && (
            <div className="mb-10">
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-[#4D8DFF]" />
                  <span className="text-xs font-mono uppercase text-[#94A3B8]">
                    Project Showcase Images ({gallery.length})
                  </span>
                </div>

                {isAuthenticated && (
                  <label className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#4D8DFF]/15 border border-[#4D8DFF]/40 text-[#4D8DFF] hover:bg-[#4D8DFF] hover:text-white text-xs font-semibold transition-all cursor-pointer">
                    {isUploadingGallery ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Upload className="w-3.5 h-3.5" />
                    )}
                    <span>+ Add Picture to Gallery</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleUploadGalleryPhotos}
                      className="hidden"
                      disabled={isUploadingGallery}
                    />
                  </label>
                )}
              </div>

              <div className="flex items-center gap-3 overflow-x-auto pb-2 no-scrollbar">
                {gallery.map((img, idx) => (
                  <div key={idx} className="relative group shrink-0">
                    <button
                      onClick={() => setActiveImageIndex(idx)}
                      className={`relative w-24 h-16 rounded-lg overflow-hidden border transition-all block ${
                        activeImageIndex === idx
                          ? 'border-[#4D8DFF] ring-2 ring-[#4D8DFF]/40 scale-105'
                          : 'border-[#24304A] opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={img.imageUrl}
                        alt={`View ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>

                    {/* Delete gallery image (except index 0 which is main cover) */}
                    {isAuthenticated && idx > 0 && (
                      <button
                        onClick={() => handleDeleteGalleryPhoto(idx)}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow hover:bg-red-600"
                        title="Delete photo"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}

                {/* Inline Add Photo Tile */}
                {isAuthenticated && (
                  <label className="relative w-24 h-16 rounded-lg border-2 border-dashed border-[#4D8DFF]/40 bg-[#111A30]/50 hover:bg-[#111A30] hover:border-[#4D8DFF] flex flex-col items-center justify-center gap-1 cursor-pointer shrink-0 text-[#4D8DFF] transition-all">
                    {isUploadingGallery ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4" />
                    )}
                    <span className="text-[10px] font-mono uppercase font-semibold">Upload</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleUploadGalleryPhotos}
                      className="hidden"
                      disabled={isUploadingGallery}
                    />
                  </label>
                )}
              </div>
            </div>
          )}

          {/* Two-Column Details Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-4 border-t border-[#24304A]">
            {/* Left 8 cols: Description & Design Process */}
            <div className="lg:col-span-8 space-y-6">
              <div>
                <h4 className="text-xs font-mono uppercase tracking-wider text-[#4D8DFF] mb-2">
                  Project Overview
                </h4>
                <p className="text-sm sm:text-base text-[#94A3B8] leading-relaxed whitespace-pre-line">
                  {project.description}
                </p>
              </div>

              {project.designProcess && (
                <div className="pt-4 border-t border-[#24304A]/60">
                  <h4 className="text-xs font-mono uppercase tracking-wider text-[#8B5CF6] mb-3">
                    Design Process & Methodology
                  </h4>
                  <div className="p-4 rounded-xl bg-[#0D1326] border border-[#24304A] text-xs sm:text-sm text-[#94A3B8] leading-relaxed whitespace-pre-line">
                    {project.designProcess}
                  </div>
                </div>
              )}
            </div>

            {/* Right 4 cols: Metadata Specs */}
            <div className="lg:col-span-4 space-y-4">
              <div className="p-5 rounded-xl bg-[#0D1326] border border-[#24304A] space-y-4">
                <h4 className="text-xs font-mono uppercase tracking-wider text-[#22D3EE] border-b border-[#24304A] pb-2">
                  Project Specs
                </h4>

                {project.client && (
                  <div className="flex items-start gap-3 text-xs">
                    <User className="w-4 h-4 text-[#4D8DFF] shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[#94A3B8] block">Client</span>
                      <span className="text-[#F8FAFC] font-medium">{project.client}</span>
                    </div>
                  </div>
                )}

                {project.projectDate && (
                  <div className="flex items-start gap-3 text-xs">
                    <Calendar className="w-4 h-4 text-[#8B5CF6] shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[#94A3B8] block">Year</span>
                      <span className="text-[#F8FAFC] font-medium">{project.projectDate}</span>
                    </div>
                  </div>
                )}

                {project.tools && (
                  <div className="flex items-start gap-3 text-xs">
                    <Wrench className="w-4 h-4 text-[#22D3EE] shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[#94A3B8] block">Tools Used</span>
                      <span className="text-[#F8FAFC] font-medium">{project.tools}</span>
                    </div>
                  </div>
                )}

                {project.tags && (
                  <div className="flex items-start gap-3 text-xs">
                    <Tag className="w-4 h-4 text-[#94A3B8] shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[#94A3B8] block">Tags</span>
                      <span className="text-[#F8FAFC]">{project.tags}</span>
                    </div>
                  </div>
                )}

                {project.projectUrl && (
                  <div className="pt-2">
                    <a
                      href={project.projectUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-gradient-to-r from-[#4D8DFF] to-[#8B5CF6] hover:from-[#3b7bed] hover:to-[#7c3aed] text-white font-semibold text-xs transition-colors"
                    >
                      <span>Visit Live Project</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Previous / Next Project Navigation */}
          <div className="mt-12 pt-6 border-t border-[#24304A] flex items-center justify-between">
            {project.prevProject ? (
              <button
                onClick={() => onSelectProjectSlug(project.prevProject!.slug)}
                className="group flex items-center gap-2 text-xs font-semibold text-[#94A3B8] hover:text-[#4D8DFF] transition-colors"
              >
                <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                <span className="hidden sm:inline">Previous:</span>
                <span className="text-[#F8FAFC]">{project.prevProject.title}</span>
              </button>
            ) : (
              <div />
            )}

            {project.nextProject && (
              <button
                onClick={() => onSelectProjectSlug(project.nextProject!.slug)}
                className="group flex items-center gap-2 text-xs font-semibold text-[#94A3B8] hover:text-[#4D8DFF] transition-colors"
              >
                <span className="hidden sm:inline">Next:</span>
                <span className="text-[#F8FAFC]">{project.nextProject.title}</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
