import React, { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { RealtimeProvider, useRealtime } from './context/RealtimeContext.tsx';
import { Navbar } from './components/Navbar.tsx';
import { Hero } from './components/Hero.tsx';
import { PortfolioGrid } from './components/PortfolioGrid.tsx';
import { ProjectModal } from './components/ProjectModal.tsx';
import { About } from './components/About.tsx';
import { Services } from './components/Services.tsx';
import { Process } from './components/Process.tsx';
import { Contact } from './components/Contact.tsx';
import { Footer } from './components/Footer.tsx';
import { ToastContainer } from './components/ToastContainer.tsx';
import { MessagesModal } from './components/MessagesModal.tsx';
import { AdminLogin } from './components/admin/AdminLogin.tsx';
import { AdminDashboard } from './components/admin/AdminDashboard.tsx';
import { AdminPublicDock } from './components/admin/AdminPublicDock.tsx';
import { PublicSiteEditorModal, PublicEditorMode } from './components/admin/PublicSiteEditorModal.tsx';
import {
  fetchSections,
  fetchProjects,
  fetchServices,
  fetchSettings,
  deleteAdminProject,
  updateAdminProject,
  deleteAdminService,
} from './services/api.ts';
import { PortfolioSection, Project, ServiceItem, SiteSettings } from './types.ts';

function PortfolioApp() {
  const { isAuthenticated } = useAuth();
  const { subscribe } = useRealtime();

  const [sections, setSections] = useState<PortfolioSection[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [settings, setSettings] = useState<SiteSettings>({});

  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedProjectSlug, setSelectedProjectSlug] = useState<string | null>(null);
  const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);
  const [adminOpen, setAdminOpen] = useState(false);
  const [messagesModalOpen, setMessagesModalOpen] = useState(false);
  const [contactPrefillSubject, setContactPrefillSubject] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Live public site editing state
  const [isEditMode, setIsEditMode] = useState(true);
  const [publicEditor, setPublicEditor] = useState<{
    isOpen: boolean;
    mode: PublicEditorMode;
    item?: any;
  }>({
    isOpen: false,
    mode: 'hero',
  });

  // Load public data from database
  const loadPublicData = useCallback(async () => {
    try {
      const [secData, srvData, settData] = await Promise.all([
        fetchSections(),
        fetchServices(),
        fetchSettings(),
      ]);
      setSections(secData);
      setServices(srvData);
      setSettings(settData);
    } catch (err) {
      console.error('Error loading public data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load projects based on active filter
  const loadProjects = useCallback(async (filter: string) => {
    try {
      const projData = await fetchProjects(filter);
      setProjects(projData);
    } catch (err) {
      console.error('Error loading projects:', err);
    }
  }, []);

  useEffect(() => {
    loadPublicData();
  }, [loadPublicData]);

  useEffect(() => {
    loadProjects(activeFilter);
  }, [activeFilter, loadProjects]);

  // Handle URL route for project slugs or admin query param
  useEffect(() => {
    const path = window.location.pathname;
    if (path.includes('/admin')) {
      setAdminOpen(true);
    }
    const match = path.match(/\/portfolio\/project\/([a-zA-Z0-9-_]+)/);
    if (match && match[1]) {
      setSelectedProjectSlug(match[1]);
    }
  }, []);

  // Listen to real-time events to auto-refresh public content when Admin changes it
  useEffect(() => {
    const unsubProjectCreated = subscribe('project.created', () => {
      loadProjects(activeFilter);
    });
    const unsubProjectUpdated = subscribe('project.updated', () => {
      loadProjects(activeFilter);
    });
    const unsubProjectDeleted = subscribe('project.deleted', () => {
      loadProjects(activeFilter);
    });
    const unsubSectionCreated = subscribe('section.created', () => {
      loadPublicData();
    });
    const unsubSectionUpdated = subscribe('section.updated', () => {
      loadPublicData();
    });
    const unsubSectionDeleted = subscribe('section.deleted', () => {
      loadPublicData();
    });

    return () => {
      unsubProjectCreated();
      unsubProjectUpdated();
      unsubProjectDeleted();
      unsubSectionCreated();
      unsubSectionUpdated();
      unsubSectionDeleted();
    };
  }, [subscribe, loadProjects, loadPublicData, activeFilter]);

  const handleOpenContact = () => {
    const el = document.getElementById('contact');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSelectService = (srv: ServiceItem) => {
    setContactPrefillSubject(`Inquiry: ${srv.title} Package`);
    handleOpenContact();
  };

  const handleEditProject = (proj: Project) => {
    // Open in-page quick editor directly on the public site
    setPublicEditor({
      isOpen: true,
      mode: 'project',
      item: proj,
    });
  };

  // Public site quick editor actions
  const handleOpenPublicEditor = (mode: PublicEditorMode, item?: any) => {
    setPublicEditor({
      isOpen: true,
      mode,
      item,
    });
  };

  const handleClosePublicEditor = () => {
    setPublicEditor((prev) => ({ ...prev, isOpen: false, item: undefined }));
  };

  const handleDeleteProject = async (proj: Project) => {
    if (!window.confirm(`Delete project "${proj.title}" from portfolio?`)) return;
    try {
      await deleteAdminProject(proj.id);
      loadProjects(activeFilter);
    } catch (err: any) {
      console.error('Failed to delete project:', err);
    }
  };

  const handleToggleFeatureProject = async (proj: Project) => {
    const nextFeatured = !proj.isFeatured;
    // Optimistically update UI so toggle feels instantaneous
    setProjects((prev) =>
      prev.map((p) => (p.id === proj.id ? { ...p, isFeatured: nextFeatured } : p))
    );
    try {
      await updateAdminProject(proj.id, {
        isFeatured: nextFeatured,
      });
      loadProjects(activeFilter);
    } catch (err: any) {
      console.warn('Could not persist featured status toggle:', err?.message || err);
      // Revert if API request failed
      setProjects((prev) =>
        prev.map((p) => (p.id === proj.id ? { ...p, isFeatured: proj.isFeatured } : p))
      );
    }
  };

  const handleDeleteService = async (srv: ServiceItem) => {
    if (!window.confirm(`Delete service "${srv.title}"?`)) return;
    try {
      await deleteAdminService(srv.id);
      loadPublicData();
    } catch (err: any) {
      console.error('Failed to delete service:', err);
    }
  };

  return (
    <div className="min-h-screen bg-[#070B17] text-[#F8FAFC] selection:bg-[#4D8DFF] selection:text-white">
      {/* Top Navbar */}
      <Navbar
        settings={settings}
        onOpenContact={handleOpenContact}
        onOpenAdmin={() => {
          setProjectToEdit(null);
          setAdminOpen(true);
        }}
        onOpenMessages={() => setMessagesModalOpen(true)}
        activeSection=""
      />

      {/* Hero Section */}
      <Hero
        settings={settings}
        onExplore={() => {
          const el = document.getElementById('portfolio');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }}
        onContact={handleOpenContact}
        isAuthenticated={isAuthenticated}
        isEditMode={isEditMode}
        onEditHero={() => handleOpenPublicEditor('hero')}
      />

      {/* Dynamic Portfolio Grid with Real-Time Search, Live Inline Add/Edit/Delete */}
      <PortfolioGrid
        sections={sections}
        projects={projects}
        activeFilter={activeFilter}
        onSelectFilter={(slug) => setActiveFilter(slug)}
        onOpenProject={(p) => {
          setSelectedProjectSlug(p.slug);
          window.history.pushState({}, '', `/portfolio/project/${p.slug}`);
        }}
        onOpenAdminNewProject={() => handleOpenPublicEditor('project')}
        onEditProject={handleEditProject}
        onDeleteProject={handleDeleteProject}
        onToggleFeatureProject={handleToggleFeatureProject}
        onAddCategory={() => handleOpenPublicEditor('category')}
        isAuthenticated={isAuthenticated}
        isEditMode={isEditMode}
      />

      {/* About Section */}
      <About
        settings={settings}
        isAuthenticated={isAuthenticated}
        isEditMode={isEditMode}
        onEditAbout={() => handleOpenPublicEditor('about')}
      />

      {/* Services Section */}
      <Services
        services={services}
        onSelectService={handleSelectService}
        isAuthenticated={isAuthenticated}
        isEditMode={isEditMode}
        onEditService={(srv) => handleOpenPublicEditor('service', srv)}
        onAddService={() => handleOpenPublicEditor('service')}
        onDeleteService={handleDeleteService}
      />

      {/* Design Process */}
      <Process />

      {/* Real Contact Section */}
      <Contact
        settings={settings}
        prefillSubject={contactPrefillSubject}
        onOpenMessages={() => setMessagesModalOpen(true)}
        isAuthenticated={isAuthenticated}
        isEditMode={isEditMode}
        onEditContact={() => handleOpenPublicEditor('contact')}
      />

      {/* Footer */}
      <Footer
        settings={settings}
        onOpenAdmin={() => {
          setProjectToEdit(null);
          setAdminOpen(true);
        }}
        onOpenMessages={() => setMessagesModalOpen(true)}
      />

      {/* Real-time Toast Alerts */}
      <ToastContainer />

      {/* Admin Floating Dock on Public Website */}
      {isAuthenticated && (
        <AdminPublicDock
          isEditMode={isEditMode}
          onToggleEditMode={() => setIsEditMode(!isEditMode)}
          onOpenNewProject={() => handleOpenPublicEditor('project')}
          onOpenEditHero={() => handleOpenPublicEditor('hero')}
          onOpenEditAbout={() => handleOpenPublicEditor('about')}
          onOpenEditServices={() => handleOpenPublicEditor('service')}
          onOpenEditContact={() => handleOpenPublicEditor('contact')}
          onOpenFullDashboard={() => {
            setProjectToEdit(null);
            setAdminOpen(true);
          }}
        />
      )}

      {/* In-Page Quick Editor Modal for Public Site */}
      {publicEditor.isOpen && (
        <PublicSiteEditorModal
          mode={publicEditor.mode}
          item={publicEditor.item}
          sections={sections}
          settings={settings}
          onClose={handleClosePublicEditor}
          onSuccess={(msg) => {
            loadPublicData();
            loadProjects(activeFilter);
          }}
        />
      )}

      {/* Individual Project View Modal */}
      {selectedProjectSlug && (
        <ProjectModal
          slug={selectedProjectSlug}
          onClose={() => {
            setSelectedProjectSlug(null);
            window.history.pushState({}, '', '/');
          }}
          onSelectProjectSlug={(newSlug) => {
            setSelectedProjectSlug(newSlug);
            window.history.pushState({}, '', `/portfolio/project/${newSlug}`);
          }}
          onEditProject={handleEditProject}
        />
      )}

      {/* Sent & Received Messages Modal */}
      {messagesModalOpen && (
        <MessagesModal
          onClose={() => setMessagesModalOpen(false)}
          onOpenAdminLogin={() => {
            setMessagesModalOpen(false);
            setAdminOpen(true);
          }}
        />
      )}

      {/* Admin Interface Modal / Screen */}
      {adminOpen && (
        isAuthenticated ? (
          <AdminDashboard
            initialEditProject={projectToEdit}
            initialTab={projectToEdit ? 'new_project' : 'overview'}
            onClose={() => {
              setAdminOpen(false);
              setProjectToEdit(null);
            }}
            onRefreshPublicData={() => {
              loadPublicData();
              loadProjects(activeFilter);
            }}
          />
        ) : (
          <AdminLogin
            onSuccess={() => {}}
            onCancel={() => {
              setAdminOpen(false);
              setProjectToEdit(null);
            }}
          />
        )
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <RealtimeProvider>
        <PortfolioApp />
      </RealtimeProvider>
    </AuthProvider>
  );
}
