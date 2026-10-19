import React, { useState, useMemo } from 'react';
import { ArrowUpRight, Filter, FolderPlus, Search, X, Edit3, Plus, Trash2, Star, Camera, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Project, PortfolioSection } from '../types.ts';
import { uploadImageFile, updateAdminProject } from '../services/api.ts';

interface PortfolioGridProps {
  sections: PortfolioSection[];
  projects: Project[];
  activeFilter: string;
  onSelectFilter: (slug: string) => void;
  onOpenProject: (project: Project) => void;
  onOpenAdminNewProject?: () => void;
  onEditProject?: (project: Project) => void;
  onDeleteProject?: (project: Project) => void;
  onToggleFeatureProject?: (project: Project) => void;
  onAddCategory?: () => void;
  isAuthenticated?: boolean;
  isEditMode?: boolean;
}

export const PortfolioGrid: React.FC<PortfolioGridProps> = ({
  sections,
  projects,
  activeFilter,
  onSelectFilter,
  onOpenProject,
  onOpenAdminNewProject,
  onEditProject,
  onDeleteProject,
  onToggleFeatureProject,
  onAddCategory,
  isAuthenticated = false,
  isEditMode = true,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [imageErrorMap, setImageErrorMap] = useState<Record<number, boolean>>({});
  const [uploadingProjectId, setUploadingProjectId] = useState<number | null>(null);

  const handleQuickProjectImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    project: Project
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingProjectId(project.id);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const fileData = reader.result as string;
        const uploadedUrl = await uploadImageFile(fileData, file.name);
        await updateAdminProject(project.id, {
          ...project,
          coverImage: uploadedUrl,
        });
        project.coverImage = uploadedUrl;
        setImageErrorMap((prev) => ({ ...prev, [project.id]: false }));
      } catch (err: any) {
        alert(err.message || 'Failed to update project picture');
      } finally {
        setUploadingProjectId(null);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleImageError = (projectId: number) => {
    setImageErrorMap((prev) => ({ ...prev, [projectId]: true }));
  };

  // Filter projects in real-time by search query and category
  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      // Category filter match
      const matchesCategory =
        activeFilter === 'all' || project.sectionSlug === activeFilter;

      if (!matchesCategory) return false;

      // Real-time search query match
      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase().trim();
      const titleMatch = project.title.toLowerCase().includes(q);
      const descMatch = (project.description || '').toLowerCase().includes(q);
      const shortDescMatch = (project.shortDescription || '').toLowerCase().includes(q);
      const toolsMatch = (project.tools || '').toLowerCase().includes(q);
      const tagsMatch = (project.tags || '').toLowerCase().includes(q);
      const clientMatch = (project.client || '').toLowerCase().includes(q);

      return titleMatch || descMatch || shortDescMatch || toolsMatch || tagsMatch || clientMatch;
    });
  }, [projects, activeFilter, searchQuery]);

  return (
    <section id="portfolio" className="py-24 relative bg-[#070B17]">
      {/* Decorative ambient glow */}
      <div className="absolute top-1/2 left-0 w-96 h-96 bg-[#4D8DFF]/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-0 w-96 h-96 bg-[#8B5CF6]/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-6 h-[2px] bg-[#4D8DFF]" />
              <span className="font-mono text-xs font-semibold tracking-widest text-[#4D8DFF] uppercase">
                — SELECTED WORK
              </span>
            </div>
            <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-[#F8FAFC] tracking-tight">
              MY PORTFOLIO
            </h2>
            <p className="text-sm sm:text-base text-[#94A3B8] max-w-xl mt-2">
              Explore custom identities, visual narratives, posters, apparel, and digital experiences crafted for ambitious brands worldwide.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {onOpenAdminNewProject && (
              <button
                onClick={onOpenAdminNewProject}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[#24304A] bg-[#0D1326] hover:bg-[#111A30] hover:border-[#4D8DFF]/50 text-xs font-medium text-[#94A3B8] hover:text-[#F8FAFC] transition-colors"
              >
                <FolderPlus className="w-3.5 h-3.5 text-[#4D8DFF]" />
                <span>+ Add / Edit Project</span>
              </button>
            )}
          </div>
        </div>

        {/* Real-time Search Input Bar */}
        <div className="mb-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-2 rounded-2xl bg-[#0D1326] border border-[#24304A]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search projects by title, description, tools, client, or tags in real-time..."
              className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#070B17] border border-[#24304A] focus:border-[#4D8DFF] focus:ring-1 focus:ring-[#4D8DFF] text-xs text-[#F8FAFC] placeholder-[#94A3B8]/60 outline-none transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#94A3B8] hover:text-white"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-3 px-2 text-xs font-mono text-[#94A3B8]">
            <span>
              Showing <strong className="text-[#4D8DFF] font-semibold">{filteredProjects.length}</strong> of{' '}
              {projects.length}
            </span>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-[11px] text-[#22D3EE] hover:underline"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Dynamic Category Filter Bar (Buttons / Segmented Tabs) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-10 no-scrollbar">
          <button
            onClick={() => onSelectFilter('all')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-200 border ${
              activeFilter === 'all'
                ? 'bg-[#4D8DFF] text-white border-[#4D8DFF] shadow-md shadow-[#4D8DFF]/25'
                : 'bg-[#0D1326] text-[#94A3B8] border-[#24304A] hover:border-[#4D8DFF]/40 hover:text-[#F8FAFC]'
            }`}
          >
            ALL
          </button>

          {sections.map((section) => {
            const isActive = activeFilter === section.slug;
            return (
              <button
                key={section.id}
                onClick={() => onSelectFilter(section.slug)}
                className={`px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap uppercase tracking-wider transition-all duration-200 border ${
                  isActive
                    ? 'bg-[#4D8DFF] text-white border-[#4D8DFF] shadow-md shadow-[#4D8DFF]/25'
                    : 'bg-[#0D1326] text-[#94A3B8] border-[#24304A] hover:border-[#4D8DFF]/40 hover:text-[#F8FAFC]'
                }`}
              >
                {section.name}
              </button>
            );
          })}

          {/* Inline Add Category Trigger for Admin */}
          {isAuthenticated && isEditMode && onAddCategory && (
            <button
              onClick={onAddCategory}
              className="px-3.5 py-2 rounded-lg text-xs font-medium whitespace-nowrap border border-dashed border-[#4D8DFF]/60 hover:border-[#4D8DFF] bg-[#4D8DFF]/10 text-[#4D8DFF] hover:text-white hover:bg-[#4D8DFF] transition-all flex items-center gap-1.5"
              title="Add a new portfolio category"
            >
              <FolderPlus className="w-3.5 h-3.5" />
              <span>+ New Category</span>
            </button>
          )}
        </div>

        {/* Responsive Project Grid */}
        {filteredProjects.length === 0 ? (
          <div className="py-20 text-center rounded-2xl border border-[#24304A] bg-[#0D1326]/60 p-8">
            <Filter className="w-10 h-10 text-[#4D8DFF]/40 mx-auto mb-3" />
            <h3 className="font-display font-semibold text-lg text-[#F8FAFC]">
              {searchQuery ? `No projects matching "${searchQuery}"` : 'No projects in this section yet.'}
            </h3>
            <p className="text-sm text-[#94A3B8] max-w-md mx-auto mt-1 mb-5">
              {searchQuery
                ? 'Try a different keyword or reset the search to view all creative projects.'
                : 'Lord Zicco is constantly updating work. You can create or edit projects directly from the Admin Dashboard!'}
            </p>
            <div className="flex items-center justify-center gap-3">
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="px-5 py-2 rounded-lg bg-[#4D8DFF] text-white text-xs font-medium hover:bg-[#3b7bed] transition-colors"
                >
                  Clear Search
                </button>
              )}
              {activeFilter !== 'all' && (
                <button
                  onClick={() => onSelectFilter('all')}
                  className="px-5 py-2 rounded-lg bg-[#111A30] border border-[#24304A] hover:border-[#4D8DFF]/50 text-xs font-medium text-[#F8FAFC] transition-colors"
                >
                  View All Projects
                </button>
              )}
            </div>
          </div>
        ) : (
          <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {/* Inline Add New Project Card for Admin */}
              {isAuthenticated && isEditMode && onOpenAdminNewProject && (
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  onClick={onOpenAdminNewProject}
                  className="rounded-2xl border-2 border-dashed border-[#4D8DFF]/40 hover:border-[#4D8DFF] bg-[#0D1326]/60 hover:bg-[#111A30]/80 p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 min-h-[380px] group"
                >
                  <div className="w-14 h-14 rounded-2xl bg-[#4D8DFF]/15 border border-[#4D8DFF]/40 text-[#4D8DFF] group-hover:bg-[#4D8DFF] group-hover:text-white flex items-center justify-center transition-all duration-300 mb-4 group-hover:scale-110 shadow-lg shadow-[#4D8DFF]/10">
                    <Plus className="w-7 h-7" />
                  </div>
                  <h4 className="font-display font-bold text-base text-[#F8FAFC] group-hover:text-[#4D8DFF] transition-colors">
                    Add New Project
                  </h4>
                  <p className="text-xs text-[#94A3B8] max-w-xs mt-1.5 leading-relaxed">
                    Upload cover, set case study details, tags and publish directly to{' '}
                    <span className="text-[#22D3EE] font-mono">
                      {activeFilter === 'all' ? 'Portfolio' : activeFilter}
                    </span>
                  </p>
                  <span className="mt-4 px-3.5 py-1.5 rounded-lg bg-[#4D8DFF]/20 text-[#4D8DFF] font-mono text-[11px] font-semibold group-hover:bg-[#4D8DFF] group-hover:text-white transition-all">
                    + Publish Project
                  </span>
                </motion.div>
              )}

              {filteredProjects.map((project, index) => {
                const hasError = imageErrorMap[project.id];
                return (
                  <motion.div
                    key={project.id}
                    layout
                    initial={{ opacity: 0, y: 36 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.15, margin: '0px 0px -40px 0px' }}
                    exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                    transition={{
                      duration: 0.55,
                      delay: Math.min((index % 3) * 0.1, 0.3),
                      ease: [0.16, 1, 0.3, 1],
                    }}
                    onClick={() => onOpenProject(project)}
                    className="group relative rounded-2xl border border-[#24304A] bg-[#0D1326] overflow-hidden cursor-pointer transition-all duration-300 hover:border-[#4D8DFF] hover:shadow-2xl hover:shadow-[#4D8DFF]/15 flex flex-col"
                  >
                    {/* Image Container with Zoom & Gradient */}
                    <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#111A30]">
                      {!hasError ? (
                        <img
                          src={project.coverImage}
                          alt={project.title}
                          onError={() => handleImageError(project.id)}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#0D1326] to-[#111A30] p-6 text-center">
                          <span className="font-display font-bold text-xl text-[#4D8DFF]">{project.title}</span>
                          <span className="text-xs text-[#94A3B8] mt-1">{project.sectionName}</span>
                        </div>
                      )}

                      {/* Dark gradient scrim */}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0D1326] via-transparent to-transparent opacity-80 group-hover:opacity-60 transition-opacity" />

                      {/* Hover Glow Edge */}
                      <div className="absolute inset-0 bg-gradient-to-tr from-[#4D8DFF]/10 via-transparent to-[#8B5CF6]/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                      {/* Quick Category Indicator & Featured Badge */}
                      <div className="absolute top-4 left-4 z-10 flex items-center gap-1.5">
                        <span className="px-2.5 py-1 rounded-md bg-[#070B17]/80 backdrop-blur-md border border-[#24304A] text-[11px] font-mono text-[#22D3EE] font-semibold">
                          {project.sectionName || 'Design'}
                        </span>
                        {project.isFeatured && (
                          <span className="px-2 py-1 rounded-md bg-amber-500/20 backdrop-blur-md border border-amber-500/40 text-[10px] font-mono text-amber-300 font-semibold flex items-center gap-1">
                            <Star className="w-2.5 h-2.5 fill-amber-300" />
                            <span>Featured</span>
                          </span>
                        )}
                      </div>

                      {/* Action Buttons (Edit Project, Star, Delete & View Arrow) */}
                      <div className="absolute bottom-4 right-4 z-10 flex items-center gap-1.5">
                        {isAuthenticated && isEditMode && onToggleFeatureProject && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleFeatureProject(project);
                            }}
                            title={project.isFeatured ? 'Unpin from Featured' : 'Pin to Featured'}
                            className={`w-8 h-8 rounded-full backdrop-blur-md border transition-all duration-200 flex items-center justify-center ${
                              project.isFeatured
                                ? 'bg-amber-500 text-black border-amber-400'
                                : 'bg-[#111A30]/90 border-[#24304A] text-[#94A3B8] hover:text-amber-300 hover:border-amber-400'
                            }`}
                          >
                            <Star className={`w-3.5 h-3.5 ${project.isFeatured ? 'fill-black' : ''}`} />
                          </button>
                        )}

                        {isAuthenticated && isEditMode && onDeleteProject && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteProject(project);
                            }}
                            title="Delete this project"
                            className="w-8 h-8 rounded-full bg-[#111A30]/90 backdrop-blur-md border border-[#24304A] text-[#94A3B8] hover:text-white hover:bg-red-500 hover:border-red-500 flex items-center justify-center transition-all duration-200"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {isAuthenticated && isEditMode && (
                          <label
                            onClick={(e) => e.stopPropagation()}
                            title="Upload new cover picture"
                            className="w-8 h-8 rounded-full bg-[#111A30]/90 backdrop-blur-md border border-[#24304A] text-[#94A3B8] hover:text-white hover:bg-[#22D3EE] hover:border-[#22D3EE] flex items-center justify-center transition-all duration-200 cursor-pointer"
                          >
                            {uploadingProjectId === project.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                            ) : (
                              <Camera className="w-3.5 h-3.5" />
                            )}
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleQuickProjectImageUpload(e, project)}
                              className="hidden"
                              disabled={uploadingProjectId === project.id}
                            />
                          </label>
                        )}

                        {onEditProject && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onEditProject(project);
                            }}
                            title="Edit this project"
                            className="w-8 h-8 rounded-full bg-[#111A30]/90 backdrop-blur-md border border-[#24304A] text-[#94A3B8] hover:text-white hover:bg-[#4D8DFF] hover:border-[#4D8DFF] flex items-center justify-center transition-all duration-200"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <div className="w-8 h-8 rounded-full bg-[#111A30]/90 backdrop-blur-md border border-[#24304A] text-[#F8FAFC] flex items-center justify-center transition-all duration-300 group-hover:bg-[#4D8DFF] group-hover:text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="p-6 flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="font-display font-bold text-lg text-[#F8FAFC] tracking-tight group-hover:text-[#4D8DFF] transition-colors transition-transform duration-300 group-hover:translate-x-1">
                          {project.title}
                        </h3>
                        {project.shortDescription && (
                          <p className="text-xs text-[#94A3B8] leading-relaxed mt-2 line-clamp-2">
                            {project.shortDescription}
                          </p>
                        )}
                      </div>

                      <div className="mt-4 pt-3 border-t border-[#24304A]/50 flex items-center justify-between text-[11px] text-[#94A3B8]">
                        <span>{project.client ? `Client: ${project.client}` : 'Visual Showcase'}</span>
                        {project.projectDate && <span className="font-mono">{project.projectDate}</span>}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </section>
  );
};
