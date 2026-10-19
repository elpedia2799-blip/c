import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useRealtime } from '../../context/RealtimeContext.tsx';
import {
  fetchAdminStats,
  fetchAdminProjects,
  createAdminProject,
  updateAdminProject,
  deleteAdminProject,
  fetchAdminSections,
  createAdminSection,
  updateAdminSection,
  deleteAdminSection,
  fetchAdminMessages,
  updateAdminMessageStatus,
  deleteAdminMessage,
  fetchAdminServices,
  createAdminService,
  updateAdminService,
  deleteAdminService,
  fetchSettings,
  updateAdminSettings,
  uploadImageFile,
} from '../../services/api.ts';
import {
  AdminStats,
  Project,
  PortfolioSection,
  ContactMessage,
  ServiceItem,
  SiteSettings,
} from '../../types.ts';
import {
  LayoutDashboard,
  Briefcase,
  Layers,
  PlusCircle,
  Mail,
  Sliders,
  User,
  Settings as SettingsIcon,
  LogOut,
  X,
  Upload,
  Trash2,
  Edit2,
  Check,
  Star,
  Eye,
  EyeOff,
  ArrowUpDown,
  Search,
  ExternalLink,
  Sparkles,
} from 'lucide-react';

interface AdminDashboardProps {
  onClose: () => void;
  onRefreshPublicData: () => void;
  initialEditProject?: Project | null;
  initialTab?: TabType;
}

type TabType =
  | 'overview'
  | 'portfolio'
  | 'sections'
  | 'new_project'
  | 'messages'
  | 'services'
  | 'about'
  | 'settings';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onClose,
  onRefreshPublicData,
  initialEditProject,
  initialTab = 'overview',
}) => {
  const { user, logout } = useAuth();
  const { unreadCount, setUnreadCount, subscribe } = useRealtime();

  const [activeTab, setActiveTab] = useState<TabType>(
    initialEditProject ? 'new_project' : initialTab
  );
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [projectsList, setProjectsList] = useState<Project[]>([]);
  const [sectionsList, setSectionsList] = useState<PortfolioSection[]>([]);
  const [messagesList, setMessagesList] = useState<ContactMessage[]>([]);
  const [servicesList, setServicesList] = useState<ServiceItem[]>([]);
  const [settingsData, setSettingsData] = useState<SiteSettings>({});

  const [isLoading, setIsLoading] = useState(true);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Editing Project State
  const [editingProject, setEditingProject] = useState<Project | null>(initialEditProject || null);

  // New/Edit Project Form
  const [projectForm, setProjectForm] = useState({
    title: initialEditProject?.title || '',
    slug: initialEditProject?.slug || '',
    sectionId: initialEditProject?.sectionId || 1,
    shortDescription: initialEditProject?.shortDescription || '',
    description: initialEditProject?.description || '',
    coverImage: initialEditProject?.coverImage || '',
    client: initialEditProject?.client || '',
    projectDate: initialEditProject?.projectDate || new Date().getFullYear().toString(),
    tools: initialEditProject?.tools || '',
    tags: initialEditProject?.tags || '',
    projectUrl: initialEditProject?.projectUrl || '',
    designProcess: initialEditProject?.designProcess || '',
    isFeatured: initialEditProject ? initialEditProject.isFeatured : false,
    isPublished: initialEditProject ? initialEditProject.isPublished : true,
    galleryImages: initialEditProject?.images?.map((img) => img.imageUrl) || [],
  });

  useEffect(() => {
    if (initialEditProject) {
      setEditingProject(initialEditProject);
      setProjectForm({
        title: initialEditProject.title,
        slug: initialEditProject.slug,
        sectionId: initialEditProject.sectionId,
        shortDescription: initialEditProject.shortDescription || '',
        description: initialEditProject.description,
        coverImage: initialEditProject.coverImage,
        client: initialEditProject.client || '',
        projectDate: initialEditProject.projectDate || new Date().getFullYear().toString(),
        tools: initialEditProject.tools || '',
        tags: initialEditProject.tags || '',
        projectUrl: initialEditProject.projectUrl || '',
        designProcess: initialEditProject.designProcess || '',
        isFeatured: initialEditProject.isFeatured,
        isPublished: initialEditProject.isPublished,
        galleryImages: initialEditProject.images?.map((img) => img.imageUrl) || [],
      });
      setActiveTab('new_project');
    }
  }, [initialEditProject]);

  // New Section Form
  const [newSectionName, setNewSectionName] = useState('');
  const [newSectionDesc, setNewSectionDesc] = useState('');
  const [newSectionCoverImage, setNewSectionCoverImage] = useState('');

  // Selected Message in Viewer
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [messageSearch, setMessageSearch] = useState('');

  // Service Form
  const [newServiceTitle, setNewServiceTitle] = useState('');
  const [newServiceDesc, setNewServiceDesc] = useState('');
  const [newServiceIcon, setNewServiceIcon] = useState('Sparkles');

  // Load All Admin Data
  const loadAdminData = async () => {
    try {
      setIsLoading(true);
      const [sData, pData, secData, mData, srvData, settData] = await Promise.all([
        fetchAdminStats(),
        fetchAdminProjects(),
        fetchAdminSections(),
        fetchAdminMessages(),
        fetchAdminServices(),
        fetchSettings(),
      ]);

      setStats(sData);
      setProjectsList(pData);
      setSectionsList(secData);
      setMessagesList(mData);
      setServicesList(srvData);
      setSettingsData(settData);
      setUnreadCount(sData.unreadMessages);

      if (secData.length > 0 && !projectForm.sectionId) {
        setProjectForm((prev) => ({ ...prev, sectionId: secData[0].id }));
      }
    } catch (err: any) {
      if (err?.message === 'Unauthorized' || err?.message?.includes('Unauthorized')) {
        await logout();
        onClose();
      } else {
        console.warn('Admin dashboard data warning:', err?.message || err);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  // Subscribe to real-time events to auto-update lists without refresh!
  useEffect(() => {
    const unsubMsg = subscribe('message.created', (newMsg: ContactMessage) => {
      setMessagesList((prev) => [newMsg, ...prev]);
      setStats((prev) => (prev ? { ...prev, unreadMessages: prev.unreadMessages + 1 } : null));
    });

    const unsubProj = subscribe('project.created', (proj: Project) => {
      setProjectsList((prev) => [proj, ...prev]);
    });

    return () => {
      unsubMsg();
      unsubProj();
    };
  }, [subscribe]);

  const showNotification = (msg: string) => {
    setActionSuccess(msg);
    setTimeout(() => setActionSuccess(null), 3500);
  };

  // Image Upload Handler
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, isGallery = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const fileData = reader.result as string;
        const uploadedUrl = await uploadImageFile(fileData, file.name);
        if (isGallery) {
          setProjectForm((prev) => ({
            ...prev,
            galleryImages: [...prev.galleryImages, uploadedUrl],
          }));
        } else {
          setProjectForm((prev) => ({
            ...prev,
            coverImage: uploadedUrl,
          }));
        }
        showNotification('Image uploaded successfully!');
      } catch (err: any) {
        alert(err.message || 'Image upload failed');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleGenericFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    onUploaded: (url: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const fileData = reader.result as string;
        const uploadedUrl = await uploadImageFile(fileData, file.name);
        onUploaded(uploadedUrl);
        showNotification('Image uploaded successfully!');
      } catch (err: any) {
        alert(err.message || 'Image upload failed');
      }
    };
    reader.readAsDataURL(file);
  };

  // Save Project
  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingProject) {
        await updateAdminProject(editingProject.id, projectForm);
        showNotification(`Project "${projectForm.title}" updated!`);
      } else {
        await createAdminProject(projectForm);
        showNotification(`Project "${projectForm.title}" published!`);
      }

      setEditingProject(null);
      resetProjectForm();
      setActiveTab('portfolio');
      await loadAdminData();
      onRefreshPublicData();
    } catch (err: any) {
      alert(err.message || 'Failed to save project');
    }
  };

  const resetProjectForm = () => {
    setProjectForm({
      title: '',
      slug: '',
      sectionId: sectionsList[0]?.id || 1,
      shortDescription: '',
      description: '',
      coverImage: '',
      client: '',
      projectDate: new Date().getFullYear().toString(),
      tools: '',
      tags: '',
      projectUrl: '',
      designProcess: '',
      isFeatured: false,
      isPublished: true,
      galleryImages: [],
    });
  };

  const startEditProject = (p: Project) => {
    setEditingProject(p);
    setProjectForm({
      title: p.title,
      slug: p.slug,
      sectionId: p.sectionId,
      shortDescription: p.shortDescription || '',
      description: p.description,
      coverImage: p.coverImage,
      client: p.client || '',
      projectDate: p.projectDate || '',
      tools: p.tools || '',
      tags: p.tags || '',
      projectUrl: p.projectUrl || '',
      designProcess: p.designProcess || '',
      isFeatured: p.isFeatured,
      isPublished: p.isPublished,
      galleryImages: p.images?.map((img) => img.imageUrl) || [],
    });
    setActiveTab('new_project');
  };

  const handleDeleteProject = async (id: number, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return;
    try {
      await deleteAdminProject(id);
      showNotification('Project deleted');
      await loadAdminData();
      onRefreshPublicData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const togglePublish = async (p: Project) => {
    try {
      await updateAdminProject(p.id, { isPublished: !p.isPublished });
      await loadAdminData();
      onRefreshPublicData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const toggleFeatured = async (p: Project) => {
    try {
      await updateAdminProject(p.id, { isFeatured: !p.isFeatured });
      await loadAdminData();
      onRefreshPublicData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Section Management
  const handleCreateSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSectionName.trim()) return;
    try {
      await createAdminSection({
        name: newSectionName.trim(),
        description: newSectionDesc.trim(),
        coverImage: newSectionCoverImage,
      });
      setNewSectionName('');
      setNewSectionDesc('');
      setNewSectionCoverImage('');
      showNotification('Section created successfully!');
      await loadAdminData();
      onRefreshPublicData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteSection = async (id: number, name: string) => {
    if (!confirm(`Delete section "${name}" and all projects inside it?`)) return;
    try {
      await deleteAdminSection(id);
      showNotification('Section deleted');
      await loadAdminData();
      onRefreshPublicData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const toggleSectionVisibility = async (sec: PortfolioSection) => {
    try {
      await updateAdminSection(sec.id, { isVisible: !sec.isVisible });
      await loadAdminData();
      onRefreshPublicData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Messages Management
  const handleToggleMessageStatus = async (id: number, newStatus: 'unread' | 'read' | 'archived') => {
    try {
      await updateAdminMessageStatus(id, newStatus);
      await loadAdminData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteMsg = async (id: number) => {
    if (!confirm('Permanently delete this message?')) return;
    try {
      await deleteAdminMessage(id);
      if (selectedMessage?.id === id) setSelectedMessage(null);
      showNotification('Message deleted');
      await loadAdminData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Services Management
  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServiceTitle.trim()) return;
    try {
      await createAdminService({
        title: newServiceTitle.trim(),
        description: newServiceDesc.trim(),
        icon: newServiceIcon,
      });
      setNewServiceTitle('');
      setNewServiceDesc('');
      showNotification('Service created!');
      await loadAdminData();
      onRefreshPublicData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteService = async (id: number) => {
    if (!confirm('Delete this service?')) return;
    try {
      await deleteAdminService(id);
      showNotification('Service deleted');
      await loadAdminData();
      onRefreshPublicData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Settings Save
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateAdminSettings(settingsData as Record<string, string>);
      showNotification('Settings updated successfully!');
      onRefreshPublicData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const filteredMessages = messagesList.filter(
    (m) =>
      m.name.toLowerCase().includes(messageSearch.toLowerCase()) ||
      m.email.toLowerCase().includes(messageSearch.toLowerCase()) ||
      m.subject.toLowerCase().includes(messageSearch.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex bg-[#070B17] text-[#F8FAFC] overflow-hidden animate-in fade-in duration-200">
      {/* Sidebar Navigation */}
      <aside className="w-64 border-r border-[#24304A] bg-[#0D1326] flex flex-col justify-between shrink-0">
        <div>
          {/* Brand lockup */}
          <div className="p-5 border-b border-[#24304A] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#4D8DFF] to-[#8B5CF6] p-[1px]">
                <div className="w-full h-full bg-[#070B17] rounded-[7px] flex items-center justify-center font-bold text-xs text-[#F8FAFC]">
                  LZ
                </div>
              </div>
              <div>
                <span className="font-display font-bold text-sm tracking-tight block">
                  LORD ZICCO
                </span>
                <span className="font-mono text-[10px] text-[#4D8DFF] block">ADMIN CONSOLE</span>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1">
            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                activeTab === 'overview'
                  ? 'bg-[#4D8DFF] text-white shadow-md shadow-[#4D8DFF]/25'
                  : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#111A30]'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => setActiveTab('portfolio')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                activeTab === 'portfolio'
                  ? 'bg-[#4D8DFF] text-white shadow-md shadow-[#4D8DFF]/25'
                  : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#111A30]'
              }`}
            >
              <Briefcase className="w-4 h-4" />
              <span>Portfolio ({projectsList.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('sections')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                activeTab === 'sections'
                  ? 'bg-[#4D8DFF] text-white shadow-md shadow-[#4D8DFF]/25'
                  : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#111A30]'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Sections ({sectionsList.length})</span>
            </button>

            <button
              onClick={() => {
                setEditingProject(null);
                resetProjectForm();
                setActiveTab('new_project');
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                activeTab === 'new_project'
                  ? 'bg-[#4D8DFF] text-white shadow-md shadow-[#4D8DFF]/25'
                  : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#111A30]'
              }`}
            >
              <PlusCircle className="w-4 h-4" />
              <span>Add Project</span>
            </button>

            <button
              onClick={() => setActiveTab('messages')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                activeTab === 'messages'
                  ? 'bg-[#4D8DFF] text-white shadow-md shadow-[#4D8DFF]/25'
                  : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#111A30]'
              }`}
            >
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4" />
                <span>Messages</span>
              </div>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-red-500 text-white font-mono text-[10px] font-bold">
                  {unreadCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('services')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                activeTab === 'services'
                  ? 'bg-[#4D8DFF] text-white shadow-md shadow-[#4D8DFF]/25'
                  : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#111A30]'
              }`}
            >
              <Sliders className="w-4 h-4" />
              <span>Services</span>
            </button>

            <button
              onClick={() => setActiveTab('about')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                activeTab === 'about'
                  ? 'bg-[#4D8DFF] text-white shadow-md shadow-[#4D8DFF]/25'
                  : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#111A30]'
              }`}
            >
              <User className="w-4 h-4" />
              <span>About Editor</span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                activeTab === 'settings'
                  ? 'bg-[#4D8DFF] text-white shadow-md shadow-[#4D8DFF]/25'
                  : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#111A30]'
              }`}
            >
              <SettingsIcon className="w-4 h-4" />
              <span>Settings</span>
            </button>
          </nav>
        </div>

        {/* User Info & Logout */}
        <div className="p-4 border-t border-[#24304A]">
          <div className="flex items-center justify-between mb-3">
            <div className="truncate text-xs">
              <span className="font-semibold text-[#F8FAFC] block truncate">
                {user?.name || 'Lord Zicco'}
              </span>
              <span className="text-[#94A3B8] text-[11px] truncate block">{user?.email}</span>
            </div>
          </div>
          <button
            onClick={() => {
              logout();
              onClose();
            }}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-[#24304A] bg-[#111A30] hover:bg-red-500/10 hover:border-red-500/40 hover:text-red-400 text-xs font-medium text-[#94A3B8] transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden bg-[#070B17]">
        {/* Top bar with back to public view */}
        <div className="h-16 border-b border-[#24304A] bg-[#0D1326] px-8 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <h2 className="font-display font-bold text-lg text-[#F8FAFC] capitalize">
              {activeTab.replace('_', ' ')}
            </h2>
            {actionSuccess && (
              <span className="px-3 py-1 rounded-md bg-[#22D3EE]/20 border border-[#22D3EE]/50 text-xs font-medium text-[#22D3EE] animate-in fade-in">
                {actionSuccess}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#24304A] bg-[#111A30] hover:bg-[#24304A] text-xs font-medium text-[#94A3B8] hover:text-[#F8FAFC] transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5 text-[#4D8DFF]" />
              <span>View Public Website</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-[#111A30] border border-[#24304A] text-[#94A3B8] hover:text-white"
              aria-label="Close Admin"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Workspace */}
        <div className="flex-1 overflow-y-auto p-8">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 border-2 border-[#4D8DFF] border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-mono text-[#94A3B8]">Loading database records...</span>
            </div>
          ) : (
            <>
              {/* TAB 1: OVERVIEW */}
              {activeTab === 'overview' && stats && (
                <div className="space-y-8">
                  {/* Stat Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="p-6 rounded-2xl border border-[#24304A] bg-[#0D1326] space-y-2">
                      <div className="flex items-center justify-between text-xs font-semibold text-[#94A3B8] uppercase">
                        <span>Total Projects</span>
                        <Briefcase className="w-4 h-4 text-[#4D8DFF]" />
                      </div>
                      <div className="font-display font-black text-3xl text-[#F8FAFC] tabular-nums">
                        {stats.totalProjects}
                      </div>
                      <span className="text-[11px] text-[#94A3B8]">Connected in PostgreSQL</span>
                    </div>

                    <div className="p-6 rounded-2xl border border-[#24304A] bg-[#0D1326] space-y-2">
                      <div className="flex items-center justify-between text-xs font-semibold text-[#94A3B8] uppercase">
                        <span>Published</span>
                        <Eye className="w-4 h-4 text-[#22D3EE]" />
                      </div>
                      <div className="font-display font-black text-3xl text-[#22D3EE] tabular-nums">
                        {stats.publishedProjects}
                      </div>
                      <span className="text-[11px] text-[#94A3B8]">Live on Public Site</span>
                    </div>

                    <div className="p-6 rounded-2xl border border-[#24304A] bg-[#0D1326] space-y-2">
                      <div className="flex items-center justify-between text-xs font-semibold text-[#94A3B8] uppercase">
                        <span>Featured</span>
                        <Star className="w-4 h-4 text-[#8B5CF6]" />
                      </div>
                      <div className="font-display font-black text-3xl text-[#8B5CF6] tabular-nums">
                        {stats.featuredProjects}
                      </div>
                      <span className="text-[11px] text-[#94A3B8]">High Priority Showcase</span>
                    </div>

                    <div className="p-6 rounded-2xl border border-[#24304A] bg-[#0D1326] space-y-2">
                      <div className="flex items-center justify-between text-xs font-semibold text-[#94A3B8] uppercase">
                        <span>Unread Messages</span>
                        <Mail className="w-4 h-4 text-red-400" />
                      </div>
                      <div className="font-display font-black text-3xl text-red-400 tabular-nums">
                        {stats.unreadMessages}
                      </div>
                      <span className="text-[11px] text-[#94A3B8]">Real-time Incoming Inquiries</span>
                    </div>
                  </div>

                  {/* Quick Action Bar */}
                  <div className="p-6 rounded-2xl border border-[#24304A] bg-[#0D1326] flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <h3 className="font-display font-bold text-lg text-[#F8FAFC]">
                        Ready to showcase new design work?
                      </h3>
                      <p className="text-xs text-[#94A3B8] mt-0.5">
                        Create projects with multiple gallery images, tags, and design process stories.
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => {
                          setEditingProject(null);
                          resetProjectForm();
                          setActiveTab('new_project');
                        }}
                        className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#4D8DFF] to-[#8B5CF6] hover:from-[#3b7bed] hover:to-[#7c3aed] text-white text-xs font-semibold flex items-center gap-2 shadow-md shadow-[#4D8DFF]/25"
                      >
                        <PlusCircle className="w-4 h-4" />
                        <span>Add New Project</span>
                      </button>
                    </div>
                  </div>

                  {/* Recent Incoming Messages Preview */}
                  <div className="rounded-2xl border border-[#24304A] bg-[#0D1326] overflow-hidden">
                    <div className="p-5 border-b border-[#24304A] flex items-center justify-between">
                      <h3 className="font-display font-bold text-base text-[#F8FAFC]">
                        Recent Messages (Real-Time)
                      </h3>
                      <button
                        onClick={() => setActiveTab('messages')}
                        className="text-xs font-semibold text-[#4D8DFF] hover:underline"
                      >
                        View All Inbox →
                      </button>
                    </div>
                    <div className="divide-y divide-[#24304A]/60">
                      {messagesList.slice(0, 3).map((m) => (
                        <div key={m.id} className="p-4 flex items-center justify-between gap-4">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-sm text-[#F8FAFC]">{m.name}</span>
                              <span className="text-xs text-[#94A3B8]">({m.email})</span>
                              {m.status === 'unread' && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-red-500/20 text-red-400 font-semibold">
                                  UNREAD
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-[#94A3B8] truncate mt-0.5">{m.subject}</p>
                          </div>
                          <button
                            onClick={() => {
                              setSelectedMessage(m);
                              setActiveTab('messages');
                            }}
                            className="px-3 py-1.5 rounded-lg border border-[#24304A] bg-[#111A30] text-xs font-medium text-[#F8FAFC] hover:border-[#4D8DFF]"
                          >
                            Read
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: PORTFOLIO MANAGER */}
              {activeTab === 'portfolio' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-display font-bold text-xl text-[#F8FAFC]">
                        Portfolio Projects ({projectsList.length})
                      </h3>
                      <p className="text-xs text-[#94A3B8] mt-1">
                        Manage published projects, featured states, and image galleries.
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setEditingProject(null);
                        resetProjectForm();
                        setActiveTab('new_project');
                      }}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#4D8DFF] to-[#8B5CF6] text-white text-xs font-semibold flex items-center gap-2"
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span>+ Add Project</span>
                    </button>
                  </div>

                  <div className="rounded-2xl border border-[#24304A] bg-[#0D1326] overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-[#111A30] text-[#94A3B8] uppercase font-mono border-b border-[#24304A]">
                          <tr>
                            <th className="p-4">Cover</th>
                            <th className="p-4">Title</th>
                            <th className="p-4">Section</th>
                            <th className="p-4">Status</th>
                            <th className="p-4">Featured</th>
                            <th className="p-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#24304A]/60">
                          {projectsList.map((p) => (
                            <tr key={p.id} className="hover:bg-[#111A30]/50 transition-colors">
                              <td className="p-4">
                                <div className="w-14 h-10 rounded-lg overflow-hidden bg-[#070B17] border border-[#24304A]">
                                  <img
                                    src={p.coverImage}
                                    alt={p.title}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              </td>
                              <td className="p-4 font-semibold text-[#F8FAFC]">{p.title}</td>
                              <td className="p-4 font-mono text-[#22D3EE]">{p.sectionName}</td>
                              <td className="p-4">
                                <button
                                  onClick={() => togglePublish(p)}
                                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                                    p.isPublished
                                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                                      : 'bg-zinc-500/20 text-zinc-400 border border-zinc-500/40'
                                  }`}
                                >
                                  {p.isPublished ? 'Published' : 'Draft'}
                                </button>
                              </td>
                              <td className="p-4">
                                <button
                                  onClick={() => toggleFeatured(p)}
                                  className={`p-1.5 rounded-lg transition-colors ${
                                    p.isFeatured
                                      ? 'text-yellow-400 bg-yellow-400/10'
                                      : 'text-[#94A3B8] hover:text-white'
                                  }`}
                                >
                                  <Star className="w-4 h-4 fill-current" />
                                </button>
                              </td>
                              <td className="p-4 text-right space-x-2">
                                <button
                                  onClick={() => startEditProject(p)}
                                  className="p-1.5 rounded-lg border border-[#24304A] hover:border-[#4D8DFF] text-[#94A3B8] hover:text-[#4D8DFF]"
                                  title="Edit Project"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteProject(p.id, p.title)}
                                  className="p-1.5 rounded-lg border border-[#24304A] hover:border-red-500 text-[#94A3B8] hover:text-red-400"
                                  title="Delete Project"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: SECTIONS MANAGER */}
              {activeTab === 'sections' && (
                <div className="space-y-8">
                  <div>
                    <h3 className="font-display font-bold text-xl text-[#F8FAFC]">
                      Portfolio Sections ({sectionsList.length})
                    </h3>
                    <p className="text-xs text-[#94A3B8] mt-1">
                      Sections are 100% database driven. Any section you create immediately updates the public filter.
                    </p>
                  </div>

                  {/* Create New Section */}
                  <form
                    onSubmit={handleCreateSection}
                    className="p-6 rounded-2xl border border-[#24304A] bg-[#0D1326] space-y-4"
                  >
                    <h4 className="font-display font-semibold text-sm text-[#F8FAFC]">
                      + Create New Portfolio Section
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-[#94A3B8] mb-1">
                          Section Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={newSectionName}
                          onChange={(e) => setNewSectionName(e.target.value)}
                          placeholder="e.g. Motion Graphics, 3D Typography"
                          className="w-full px-4 py-2.5 rounded-xl bg-[#070B17] border border-[#24304A] focus:border-[#4D8DFF] text-xs text-[#F8FAFC] outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#94A3B8] mb-1">
                          Short Description
                        </label>
                        <input
                          type="text"
                          value={newSectionDesc}
                          onChange={(e) => setNewSectionDesc(e.target.value)}
                          placeholder="Brief summary of this creative category"
                          className="w-full px-4 py-2.5 rounded-xl bg-[#070B17] border border-[#24304A] focus:border-[#4D8DFF] text-xs text-[#F8FAFC] outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#94A3B8] mb-1">
                        Category Banner / Cover Image (Optional)
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newSectionCoverImage}
                          onChange={(e) => setNewSectionCoverImage(e.target.value)}
                          placeholder="https://... or upload local image file"
                          className="flex-1 px-4 py-2.5 rounded-xl bg-[#070B17] border border-[#24304A] text-xs text-[#F8FAFC] outline-none"
                        />
                        <label className="px-4 py-2.5 rounded-xl border border-[#24304A] bg-[#111A30] hover:bg-[#16223e] text-xs font-medium text-[#F8FAFC] flex items-center gap-1.5 cursor-pointer">
                          <Upload className="w-3.5 h-3.5 text-[#4D8DFF]" />
                          <span>Upload</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) =>
                              handleGenericFileUpload(e, (url) => setNewSectionCoverImage(url))
                            }
                            className="hidden"
                          />
                        </label>
                      </div>
                      {newSectionCoverImage && (
                        <div className="mt-2 relative w-36 h-20 rounded-xl overflow-hidden border border-[#24304A]">
                          <img
                            src={newSectionCoverImage}
                            alt="Category cover preview"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                    </div>
                    <button
                      type="submit"
                      className="px-5 py-2.5 rounded-xl bg-[#4D8DFF] hover:bg-[#3b7bed] text-white text-xs font-semibold"
                    >
                      Create Section
                    </button>
                  </form>

                  {/* Section List */}
                  <div className="rounded-2xl border border-[#24304A] bg-[#0D1326] divide-y divide-[#24304A]/60">
                    {sectionsList.map((sec) => (
                      <div
                        key={sec.id}
                        className="p-4 flex items-center justify-between gap-4 hover:bg-[#111A30]/40 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-xs text-[#94A3B8]">#{sec.sortOrder}</span>
                          <div>
                            <span className="font-semibold text-sm text-[#F8FAFC]">{sec.name}</span>
                            <span className="font-mono text-xs text-[#4D8DFF] ml-2">({sec.slug})</span>
                            {sec.description && (
                              <p className="text-xs text-[#94A3B8] mt-0.5">{sec.description}</p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleSectionVisibility(sec)}
                            className={`px-3 py-1 rounded-md text-xs font-medium border ${
                              sec.isVisible
                                ? 'bg-[#22D3EE]/10 border-[#22D3EE]/30 text-[#22D3EE]'
                                : 'bg-zinc-800 border-zinc-700 text-zinc-400'
                            }`}
                          >
                            {sec.isVisible ? 'Visible' : 'Hidden'}
                          </button>
                          <button
                            onClick={() => handleDeleteSection(sec.id, sec.name)}
                            className="p-1.5 rounded-lg border border-[#24304A] hover:border-red-500 text-[#94A3B8] hover:text-red-400"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 4: ADD / EDIT PROJECT */}
              {activeTab === 'new_project' && (
                <div className="space-y-6 max-w-4xl">
                  <div>
                    <h3 className="font-display font-bold text-xl text-[#F8FAFC]">
                      {editingProject ? `Edit Project: ${editingProject.title}` : 'Add New Portfolio Project'}
                    </h3>
                    <p className="text-xs text-[#94A3B8] mt-1">
                      Upload multiple gallery images, set category, client specs, and publishing states.
                    </p>
                  </div>

                  <form onSubmit={handleSaveProject} className="space-y-6">
                    <div className="p-6 rounded-2xl border border-[#24304A] bg-[#0D1326] space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-xs font-semibold text-[#94A3B8] uppercase mb-1.5">
                            Project Title *
                          </label>
                          <input
                            type="text"
                            required
                            value={projectForm.title}
                            onChange={(e) => setProjectForm({ ...projectForm, title: e.target.value })}
                            placeholder="e.g. MCRC Robotics Identity"
                            className="w-full px-4 py-2.5 rounded-xl bg-[#070B17] border border-[#24304A] focus:border-[#4D8DFF] text-xs text-[#F8FAFC] outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-[#94A3B8] uppercase mb-1.5">
                            Portfolio Section *
                          </label>
                          <select
                            value={projectForm.sectionId}
                            onChange={(e) =>
                              setProjectForm({ ...projectForm, sectionId: Number(e.target.value) })
                            }
                            className="w-full px-4 py-2.5 rounded-xl bg-[#070B17] border border-[#24304A] focus:border-[#4D8DFF] text-xs text-[#F8FAFC] outline-none"
                          >
                            {sectionsList.map((sec) => (
                              <option key={sec.id} value={sec.id}>
                                {sec.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#94A3B8] uppercase mb-1.5">
                          Short Description (Card Teaser)
                        </label>
                        <input
                          type="text"
                          value={projectForm.shortDescription}
                          onChange={(e) =>
                            setProjectForm({ ...projectForm, shortDescription: e.target.value })
                          }
                          placeholder="1-2 sentences summarizing the visual concept"
                          className="w-full px-4 py-2.5 rounded-xl bg-[#070B17] border border-[#24304A] focus:border-[#4D8DFF] text-xs text-[#F8FAFC] outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#94A3B8] uppercase mb-1.5">
                          Full Project Description *
                        </label>
                        <textarea
                          required
                          rows={4}
                          value={projectForm.description}
                          onChange={(e) =>
                            setProjectForm({ ...projectForm, description: e.target.value })
                          }
                          placeholder="Comprehensive project scope, design challenge, and aesthetic solutions..."
                          className="w-full px-4 py-2.5 rounded-xl bg-[#070B17] border border-[#24304A] focus:border-[#4D8DFF] text-xs text-[#F8FAFC] outline-none resize-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#94A3B8] uppercase mb-1.5">
                          Design Process & Methodology
                        </label>
                        <textarea
                          rows={3}
                          value={projectForm.designProcess}
                          onChange={(e) =>
                            setProjectForm({ ...projectForm, designProcess: e.target.value })
                          }
                          placeholder="1. Research and discovery... 2. Typography and mark creation... 3. Vector delivery"
                          className="w-full px-4 py-2.5 rounded-xl bg-[#070B17] border border-[#24304A] focus:border-[#4D8DFF] text-xs text-[#F8FAFC] outline-none resize-none"
                        />
                      </div>
                    </div>

                    {/* Image Assets Section */}
                    <div className="p-6 rounded-2xl border border-[#24304A] bg-[#0D1326] space-y-4">
                      <h4 className="font-display font-semibold text-sm text-[#F8FAFC]">
                        Cover Image & Gallery (Multiple Images)
                      </h4>

                      <div>
                        <label className="block text-xs font-semibold text-[#94A3B8] uppercase mb-1.5">
                          Cover Image URL or Upload
                        </label>
                        <div className="flex gap-3">
                          <input
                            type="text"
                            value={projectForm.coverImage}
                            onChange={(e) =>
                              setProjectForm({ ...projectForm, coverImage: e.target.value })
                            }
                            placeholder="/src/assets/images/... or https://..."
                            className="flex-1 px-4 py-2.5 rounded-xl bg-[#070B17] border border-[#24304A] focus:border-[#4D8DFF] text-xs text-[#F8FAFC] outline-none"
                          />
                          <label className="cursor-pointer px-4 py-2.5 rounded-xl bg-[#111A30] border border-[#24304A] hover:border-[#4D8DFF] text-xs font-semibold text-[#F8FAFC] flex items-center gap-2">
                            <Upload className="w-3.5 h-3.5 text-[#4D8DFF]" />
                            <span>Upload File</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleImageUpload(e, false)}
                              className="hidden"
                            />
                          </label>
                        </div>
                        {projectForm.coverImage && (
                          <div className="mt-3 w-40 aspect-[4/3] rounded-lg overflow-hidden border border-[#24304A]">
                            <img
                              src={projectForm.coverImage}
                              alt="Cover preview"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                      </div>

                      {/* Multiple Gallery Images */}
                      <div className="pt-4 border-t border-[#24304A]/60">
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-xs font-semibold text-[#94A3B8] uppercase">
                            Gallery Images ({projectForm.galleryImages.length})
                          </label>
                          <label className="cursor-pointer px-3 py-1.5 rounded-lg bg-[#111A30] border border-[#24304A] hover:border-[#4D8DFF] text-xs font-medium text-[#4D8DFF] flex items-center gap-1.5">
                            <Upload className="w-3 h-3" />
                            <span>Add Gallery Image</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleImageUpload(e, true)}
                              className="hidden"
                            />
                          </label>
                        </div>

                        {projectForm.galleryImages.length > 0 && (
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
                            {projectForm.galleryImages.map((imgUrl, i) => (
                              <div
                                key={i}
                                className="relative aspect-[4/3] rounded-lg overflow-hidden border border-[#24304A] group"
                              >
                                <img
                                  src={imgUrl}
                                  alt={`Gallery ${i + 1}`}
                                  className="w-full h-full object-cover"
                                />
                                <button
                                  type="button"
                                  onClick={() =>
                                    setProjectForm({
                                      ...projectForm,
                                      galleryImages: projectForm.galleryImages.filter((_, idx) => idx !== i),
                                    })
                                  }
                                  className="absolute top-1.5 right-1.5 p-1 rounded bg-black/70 text-red-400 hover:text-white"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Metadata Specs & Toggles */}
                    <div className="p-6 rounded-2xl border border-[#24304A] bg-[#0D1326] space-y-4">
                      <h4 className="font-display font-semibold text-sm text-[#F8FAFC]">
                        Project Specifications & Toggles
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-[#94A3B8] mb-1">Client</label>
                          <input
                            type="text"
                            value={projectForm.client}
                            onChange={(e) => setProjectForm({ ...projectForm, client: e.target.value })}
                            placeholder="Client Name"
                            className="w-full px-4 py-2.5 rounded-xl bg-[#070B17] border border-[#24304A] text-xs text-[#F8FAFC] outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-[#94A3B8] mb-1">Year</label>
                          <input
                            type="text"
                            value={projectForm.projectDate}
                            onChange={(e) =>
                              setProjectForm({ ...projectForm, projectDate: e.target.value })
                            }
                            placeholder="2026"
                            className="w-full px-4 py-2.5 rounded-xl bg-[#070B17] border border-[#24304A] text-xs text-[#F8FAFC] outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-[#94A3B8] mb-1">Tools</label>
                          <input
                            type="text"
                            value={projectForm.tools}
                            onChange={(e) => setProjectForm({ ...projectForm, tools: e.target.value })}
                            placeholder="Illustrator, Figma, Photoshop"
                            className="w-full px-4 py-2.5 rounded-xl bg-[#070B17] border border-[#24304A] text-xs text-[#F8FAFC] outline-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                        <div>
                          <label className="block text-xs font-semibold text-[#94A3B8] mb-1">
                            Tags (comma separated)
                          </label>
                          <input
                            type="text"
                            value={projectForm.tags}
                            onChange={(e) => setProjectForm({ ...projectForm, tags: e.target.value })}
                            placeholder="Branding, Logo, Print"
                            className="w-full px-4 py-2.5 rounded-xl bg-[#070B17] border border-[#24304A] text-xs text-[#F8FAFC] outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-[#94A3B8] mb-1">
                            Live Project URL (Optional)
                          </label>
                          <input
                            type="url"
                            value={projectForm.projectUrl}
                            onChange={(e) =>
                              setProjectForm({ ...projectForm, projectUrl: e.target.value })
                            }
                            placeholder="https://..."
                            className="w-full px-4 py-2.5 rounded-xl bg-[#070B17] border border-[#24304A] text-xs text-[#F8FAFC] outline-none"
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-8 pt-4 border-t border-[#24304A]/60">
                        <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-[#F8FAFC]">
                          <input
                            type="checkbox"
                            checked={projectForm.isPublished}
                            onChange={(e) =>
                              setProjectForm({ ...projectForm, isPublished: e.target.checked })
                            }
                            className="rounded border-[#24304A] text-[#4D8DFF] focus:ring-0"
                          />
                          <span>Published (Visible on site)</span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-[#F8FAFC]">
                          <input
                            type="checkbox"
                            checked={projectForm.isFeatured}
                            onChange={(e) =>
                              setProjectForm({ ...projectForm, isFeatured: e.target.checked })
                            }
                            className="rounded border-[#24304A] text-[#8B5CF6] focus:ring-0"
                          />
                          <span>Featured Project</span>
                        </label>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <button
                        type="submit"
                        className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#4D8DFF] to-[#8B5CF6] hover:from-[#3b7bed] hover:to-[#7c3aed] text-white font-semibold text-xs uppercase tracking-wider"
                      >
                        {editingProject ? 'Save Changes' : 'Publish Project'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingProject(null);
                          resetProjectForm();
                          setActiveTab('portfolio');
                        }}
                        className="px-6 py-3 rounded-xl border border-[#24304A] bg-[#111A30] text-xs font-semibold text-[#94A3B8] hover:text-[#F8FAFC]"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* TAB 5: REAL-TIME MESSAGES INBOX */}
              {activeTab === 'messages' && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="font-display font-bold text-xl text-[#F8FAFC]">
                        Incoming Transmissions ({messagesList.length})
                      </h3>
                      <p className="text-xs text-[#94A3B8] mt-1">
                        Live real-time inbox. New visitor messages arrive instantly without page refresh.
                      </p>
                    </div>

                    <div className="relative w-full sm:w-64">
                      <input
                        type="text"
                        value={messageSearch}
                        onChange={(e) => setMessageSearch(e.target.value)}
                        placeholder="Search sender, email, subject..."
                        className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#0D1326] border border-[#24304A] text-xs text-[#F8FAFC] outline-none"
                      />
                      <Search className="w-3.5 h-3.5 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Message List */}
                    <div className="lg:col-span-5 rounded-2xl border border-[#24304A] bg-[#0D1326] divide-y divide-[#24304A]/60 overflow-hidden">
                      {filteredMessages.length === 0 ? (
                        <div className="p-8 text-center text-xs text-[#94A3B8]">
                          No messages found.
                        </div>
                      ) : (
                        filteredMessages.map((msg) => (
                          <div
                            key={msg.id}
                            onClick={() => {
                              setSelectedMessage(msg);
                              if (msg.status === 'unread') {
                                handleToggleMessageStatus(msg.id, 'read');
                              }
                            }}
                            className={`p-4 cursor-pointer transition-colors ${
                              selectedMessage?.id === msg.id
                                ? 'bg-[#111A30] border-l-2 border-[#4D8DFF]'
                                : 'hover:bg-[#111A30]/50'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-semibold text-xs text-[#F8FAFC] truncate">
                                {msg.name}
                              </span>
                              {msg.status === 'unread' && (
                                <span className="w-2 h-2 rounded-full bg-red-500 shrink-0 animate-ping" />
                              )}
                            </div>
                            <h4 className="text-xs font-medium text-[#4D8DFF] truncate mt-0.5">
                              {msg.subject}
                            </h4>
                            <p className="text-[11px] text-[#94A3B8] line-clamp-2 mt-1">
                              {msg.message}
                            </p>
                            <span className="text-[10px] text-[#94A3B8]/60 mt-2 block font-mono">
                              {new Date(msg.createdAt).toLocaleString()}
                            </span>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Selected Message Reader */}
                    <div className="lg:col-span-7 rounded-2xl border border-[#24304A] bg-[#0D1326] p-6 flex flex-col justify-between">
                      {selectedMessage ? (
                        <div className="space-y-6">
                          <div className="flex items-start justify-between border-b border-[#24304A] pb-4">
                            <div>
                              <span className="font-mono text-[10px] text-[#22D3EE] uppercase tracking-wider block">
                                SENDER DETAILS
                              </span>
                              <h3 className="font-display font-bold text-lg text-[#F8FAFC]">
                                {selectedMessage.name}
                              </h3>
                              <a
                                href={`mailto:${selectedMessage.email}`}
                                className="text-xs text-[#4D8DFF] hover:underline"
                              >
                                {selectedMessage.email}
                              </a>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                onClick={() =>
                                  handleToggleMessageStatus(
                                    selectedMessage.id,
                                    selectedMessage.status === 'unread' ? 'read' : 'unread'
                                  )
                                }
                                className="px-3 py-1.5 rounded-lg border border-[#24304A] bg-[#111A30] text-xs font-medium text-[#94A3B8] hover:text-[#F8FAFC]"
                              >
                                Mark {selectedMessage.status === 'unread' ? 'Read' : 'Unread'}
                              </button>
                              <button
                                onClick={() => handleDeleteMsg(selectedMessage.id)}
                                className="p-1.5 rounded-lg border border-[#24304A] hover:border-red-500 text-[#94A3B8] hover:text-red-400"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          <div>
                            <span className="font-mono text-[10px] text-[#94A3B8] uppercase block">
                              SUBJECT
                            </span>
                            <h4 className="font-semibold text-sm text-[#F8FAFC] mt-0.5">
                              {selectedMessage.subject}
                            </h4>
                          </div>

                          <div>
                            <span className="font-mono text-[10px] text-[#94A3B8] uppercase block mb-1">
                              TRANSMISSION BODY
                            </span>
                            <div className="p-4 rounded-xl bg-[#070B17] border border-[#24304A] text-xs sm:text-sm text-[#F8FAFC] leading-relaxed whitespace-pre-line">
                              {selectedMessage.message}
                            </div>
                          </div>

                          <div className="pt-4 border-t border-[#24304A] flex items-center justify-between">
                            <span className="text-[11px] font-mono text-[#94A3B8]">
                              Received: {new Date(selectedMessage.createdAt).toLocaleString()}
                            </span>
                            <a
                              href={`mailto:${selectedMessage.email}?subject=Re: ${encodeURIComponent(
                                selectedMessage.subject
                              )}`}
                              className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#4D8DFF] to-[#8B5CF6] text-white text-xs font-semibold flex items-center gap-2"
                            >
                              <Mail className="w-3.5 h-3.5" />
                              <span>Reply via Email</span>
                            </a>
                          </div>
                        </div>
                      ) : (
                        <div className="py-24 text-center text-xs text-[#94A3B8]">
                          Select a message from the inbox to read its transmission.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 6: SERVICES */}
              {activeTab === 'services' && (
                <div className="space-y-8">
                  <div>
                    <h3 className="font-display font-bold text-xl text-[#F8FAFC]">Creative Services</h3>
                    <p className="text-xs text-[#94A3B8] mt-1">
                      Manage client service offerings shown on the public site.
                    </p>
                  </div>

                  <form
                    onSubmit={handleCreateService}
                    className="p-6 rounded-2xl border border-[#24304A] bg-[#0D1326] space-y-4"
                  >
                    <h4 className="font-display font-semibold text-sm text-[#F8FAFC]">
                      + Add New Service
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-[#94A3B8] mb-1">
                          Service Title *
                        </label>
                        <input
                          type="text"
                          required
                          value={newServiceTitle}
                          onChange={(e) => setNewServiceTitle(e.target.value)}
                          placeholder="e.g. 3D Spatial Design"
                          className="w-full px-4 py-2.5 rounded-xl bg-[#070B17] border border-[#24304A] text-xs text-[#F8FAFC] outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#94A3B8] mb-1">Icon</label>
                        <select
                          value={newServiceIcon}
                          onChange={(e) => setNewServiceIcon(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl bg-[#070B17] border border-[#24304A] text-xs text-[#F8FAFC] outline-none"
                        >
                          <option value="Sparkles">Sparkles</option>
                          <option value="PenTool">PenTool (Logo)</option>
                          <option value="Layers">Layers (Posters)</option>
                          <option value="Shirt">Shirt (Apparel)</option>
                          <option value="Share2">Share2 (Social)</option>
                          <option value="Layout">Layout (UI/UX)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#94A3B8] mb-1">
                          Description
                        </label>
                        <input
                          type="text"
                          value={newServiceDesc}
                          onChange={(e) => setNewServiceDesc(e.target.value)}
                          placeholder="Brief deliverables description"
                          className="w-full px-4 py-2.5 rounded-xl bg-[#070B17] border border-[#24304A] text-xs text-[#F8FAFC] outline-none"
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      className="px-5 py-2.5 rounded-xl bg-[#4D8DFF] text-white text-xs font-semibold"
                    >
                      Add Service
                    </button>
                  </form>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {servicesList.map((srv) => (
                      <div
                        key={srv.id}
                        className="p-5 rounded-2xl border border-[#24304A] bg-[#0D1326] flex items-start justify-between gap-4"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs text-[#4D8DFF] font-bold">
                              {srv.number}
                            </span>
                            <h4 className="font-display font-semibold text-sm text-[#F8FAFC]">
                              {srv.title}
                            </h4>
                          </div>
                          <p className="text-xs text-[#94A3B8] mt-1">{srv.description}</p>
                        </div>
                        <button
                          onClick={() => handleDeleteService(srv.id)}
                          className="p-1.5 rounded-lg border border-[#24304A] hover:border-red-500 text-[#94A3B8] hover:text-red-400"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 7: ABOUT */}
              {activeTab === 'about' && (
                <form onSubmit={handleSaveSettings} className="space-y-6 max-w-3xl">
                  <div>
                    <h3 className="font-display font-bold text-xl text-[#F8FAFC]">
                      About Lord Zicco Editor
                    </h3>
                    <p className="text-xs text-[#94A3B8] mt-1">
                      Edit biography, studio photo URL, quote, and numerical experience counters.
                    </p>
                  </div>

                  <div className="p-6 rounded-2xl border border-[#24304A] bg-[#0D1326] space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#94A3B8] mb-1">
                        About Title Headline
                      </label>
                      <input
                        type="text"
                        value={settingsData.about_title || ''}
                        onChange={(e) =>
                          setSettingsData({ ...settingsData, about_title: e.target.value })
                        }
                        className="w-full px-4 py-2.5 rounded-xl bg-[#070B17] border border-[#24304A] text-xs text-[#F8FAFC] outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#94A3B8] mb-1">
                        Biography Prose
                      </label>
                      <textarea
                        rows={4}
                        value={settingsData.about_description || ''}
                        onChange={(e) =>
                          setSettingsData({ ...settingsData, about_description: e.target.value })
                        }
                        className="w-full px-4 py-2.5 rounded-xl bg-[#070B17] border border-[#24304A] text-xs text-[#F8FAFC] outline-none resize-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#94A3B8] mb-1">
                        Signature Quote
                      </label>
                      <input
                        type="text"
                        value={settingsData.about_quote || ''}
                        onChange={(e) =>
                          setSettingsData({ ...settingsData, about_quote: e.target.value })
                        }
                        className="w-full px-4 py-2.5 rounded-xl bg-[#070B17] border border-[#24304A] text-xs text-[#F8FAFC] outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#94A3B8] mb-1">
                        Studio Portrait Image (URL or Upload File)
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={settingsData.about_image || ''}
                          onChange={(e) =>
                            setSettingsData({ ...settingsData, about_image: e.target.value })
                          }
                          placeholder="/src/assets/images/... or https://..."
                          className="flex-1 px-4 py-2.5 rounded-xl bg-[#070B17] border border-[#24304A] text-xs text-[#F8FAFC] outline-none"
                        />
                        <label className="px-4 py-2.5 rounded-xl border border-[#24304A] bg-[#111A30] hover:bg-[#16223e] text-xs font-medium text-[#F8FAFC] flex items-center gap-1.5 cursor-pointer">
                          <Upload className="w-3.5 h-3.5 text-[#4D8DFF]" />
                          <span>Upload</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) =>
                              handleGenericFileUpload(e, (url) =>
                                setSettingsData((prev) => ({ ...prev, about_image: url }))
                              )
                            }
                            className="hidden"
                          />
                        </label>
                      </div>
                      {settingsData.about_image && (
                        <div className="mt-2 relative w-36 aspect-[4/3] rounded-xl overflow-hidden border border-[#24304A]">
                          <img
                            src={settingsData.about_image}
                            alt="Studio preview"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-4 pt-2">
                      <div>
                        <label className="block text-xs font-semibold text-[#94A3B8] mb-1">
                          Years Experience
                        </label>
                        <input
                          type="text"
                          value={settingsData.stat_experience || ''}
                          onChange={(e) =>
                            setSettingsData({ ...settingsData, stat_experience: e.target.value })
                          }
                          className="w-full px-4 py-2.5 rounded-xl bg-[#070B17] border border-[#24304A] text-xs text-[#F8FAFC] outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#94A3B8] mb-1">
                          Projects Completed
                        </label>
                        <input
                          type="text"
                          value={settingsData.stat_projects || ''}
                          onChange={(e) =>
                            setSettingsData({ ...settingsData, stat_projects: e.target.value })
                          }
                          className="w-full px-4 py-2.5 rounded-xl bg-[#070B17] border border-[#24304A] text-xs text-[#F8FAFC] outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#94A3B8] mb-1">
                          Happy Clients
                        </label>
                        <input
                          type="text"
                          value={settingsData.stat_clients || ''}
                          onChange={(e) =>
                            setSettingsData({ ...settingsData, stat_clients: e.target.value })
                          }
                          className="w-full px-4 py-2.5 rounded-xl bg-[#070B17] border border-[#24304A] text-xs text-[#F8FAFC] outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="px-6 py-3 rounded-xl bg-[#4D8DFF] text-white text-xs font-semibold"
                  >
                    Save About Changes
                  </button>
                </form>
              )}

              {/* TAB 8: SETTINGS */}
              {activeTab === 'settings' && (
                <form onSubmit={handleSaveSettings} className="space-y-6 max-w-3xl">
                  <div>
                    <h3 className="font-display font-bold text-xl text-[#F8FAFC]">
                      Site & Contact Settings
                    </h3>
                    <p className="text-xs text-[#94A3B8] mt-1">
                      Configure public contact details, studio location, and social media handles.
                    </p>
                  </div>

                  <div className="p-6 rounded-2xl border border-[#24304A] bg-[#0D1326] space-y-4">
                    <h4 className="font-display font-semibold text-sm text-[#F8FAFC]">
                      Visual Branding & Artwork Assets
                    </h4>
                    <p className="text-xs text-[#94A3B8]">
                      Upload your high-resolution portrait, hero background visuals, and monogram/logo assets.
                    </p>

                    <div>
                      <label className="block text-xs font-semibold text-[#94A3B8] mb-1">
                        Hero Portrait Image
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={settingsData.hero_image || ''}
                          onChange={(e) =>
                            setSettingsData({ ...settingsData, hero_image: e.target.value })
                          }
                          placeholder="/src/assets/images/... or https://..."
                          className="flex-1 px-4 py-2.5 rounded-xl bg-[#070B17] border border-[#24304A] text-xs text-[#F8FAFC] outline-none"
                        />
                        <label className="px-4 py-2.5 rounded-xl border border-[#24304A] bg-[#111A30] hover:bg-[#16223e] text-xs font-medium text-[#F8FAFC] flex items-center gap-1.5 cursor-pointer">
                          <Upload className="w-3.5 h-3.5 text-[#4D8DFF]" />
                          <span>Upload</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) =>
                              handleGenericFileUpload(e, (url) =>
                                setSettingsData((prev) => ({ ...prev, hero_image: url }))
                              )
                            }
                            className="hidden"
                          />
                        </label>
                      </div>
                      {settingsData.hero_image && (
                        <div className="mt-2 relative w-28 aspect-[3/4] rounded-xl overflow-hidden border border-[#24304A]">
                          <img
                            src={settingsData.hero_image}
                            alt="Hero preview"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#94A3B8] mb-1">
                        Hero Background Banner / Graphic (Optional)
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={settingsData.hero_bg_image || ''}
                          onChange={(e) =>
                            setSettingsData({ ...settingsData, hero_bg_image: e.target.value })
                          }
                          placeholder="Custom background or texture URL"
                          className="flex-1 px-4 py-2.5 rounded-xl bg-[#070B17] border border-[#24304A] text-xs text-[#F8FAFC] outline-none"
                        />
                        <label className="px-4 py-2.5 rounded-xl border border-[#24304A] bg-[#111A30] hover:bg-[#16223e] text-xs font-medium text-[#F8FAFC] flex items-center gap-1.5 cursor-pointer">
                          <Upload className="w-3.5 h-3.5 text-[#8B5CF6]" />
                          <span>Upload</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) =>
                              handleGenericFileUpload(e, (url) =>
                                setSettingsData((prev) => ({ ...prev, hero_bg_image: url }))
                              )
                            }
                            className="hidden"
                          />
                        </label>
                      </div>
                      {settingsData.hero_bg_image && (
                        <div className="mt-2 relative w-48 h-16 rounded-xl overflow-hidden border border-[#24304A]">
                          <img
                            src={settingsData.hero_bg_image}
                            alt="Hero bg preview"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#94A3B8] mb-1">
                        Custom Brand Logo / Mark (Optional)
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={settingsData.brand_logo_image || ''}
                          onChange={(e) =>
                            setSettingsData({ ...settingsData, brand_logo_image: e.target.value })
                          }
                          placeholder="Logo image URL or upload"
                          className="flex-1 px-4 py-2.5 rounded-xl bg-[#070B17] border border-[#24304A] text-xs text-[#F8FAFC] outline-none"
                        />
                        <label className="px-4 py-2.5 rounded-xl border border-[#24304A] bg-[#111A30] hover:bg-[#16223e] text-xs font-medium text-[#F8FAFC] flex items-center gap-1.5 cursor-pointer">
                          <Upload className="w-3.5 h-3.5 text-[#22D3EE]" />
                          <span>Upload</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) =>
                              handleGenericFileUpload(e, (url) =>
                                setSettingsData((prev) => ({ ...prev, brand_logo_image: url }))
                              )
                            }
                            className="hidden"
                          />
                        </label>
                      </div>
                      {settingsData.brand_logo_image && (
                        <div className="mt-2 relative w-16 h-16 rounded-xl overflow-hidden border border-[#24304A] p-2 bg-[#070B17]">
                          <img
                            src={settingsData.brand_logo_image}
                            alt="Logo preview"
                            className="w-full h-full object-contain"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="p-6 rounded-2xl border border-[#24304A] bg-[#0D1326] space-y-4">
                    <h4 className="font-display font-semibold text-sm text-[#F8FAFC]">
                      Contact Information
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-[#94A3B8] mb-1">Email</label>
                        <input
                          type="email"
                          value={settingsData.contact_email || ''}
                          onChange={(e) =>
                            setSettingsData({ ...settingsData, contact_email: e.target.value })
                          }
                          className="w-full px-4 py-2.5 rounded-xl bg-[#070B17] border border-[#24304A] text-xs text-[#F8FAFC] outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#94A3B8] mb-1">Phone</label>
                        <input
                          type="text"
                          value={settingsData.contact_phone || ''}
                          onChange={(e) =>
                            setSettingsData({ ...settingsData, contact_phone: e.target.value })
                          }
                          className="w-full px-4 py-2.5 rounded-xl bg-[#070B17] border border-[#24304A] text-xs text-[#F8FAFC] outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#94A3B8] mb-1">Location</label>
                        <input
                          type="text"
                          value={settingsData.contact_location || ''}
                          onChange={(e) =>
                            setSettingsData({ ...settingsData, contact_location: e.target.value })
                          }
                          className="w-full px-4 py-2.5 rounded-xl bg-[#070B17] border border-[#24304A] text-xs text-[#F8FAFC] outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="p-6 rounded-2xl border border-[#24304A] bg-[#0D1326] space-y-4">
                    <h4 className="font-display font-semibold text-sm text-[#F8FAFC]">
                      Social Media Links
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-[#94A3B8] mb-1">
                          Instagram URL
                        </label>
                        <input
                          type="url"
                          value={settingsData.social_instagram || ''}
                          onChange={(e) =>
                            setSettingsData({ ...settingsData, social_instagram: e.target.value })
                          }
                          className="w-full px-4 py-2.5 rounded-xl bg-[#070B17] border border-[#24304A] text-xs text-[#F8FAFC] outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#94A3B8] mb-1">X URL</label>
                        <input
                          type="url"
                          value={settingsData.social_x || ''}
                          onChange={(e) =>
                            setSettingsData({ ...settingsData, social_x: e.target.value })
                          }
                          className="w-full px-4 py-2.5 rounded-xl bg-[#070B17] border border-[#24304A] text-xs text-[#F8FAFC] outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#94A3B8] mb-1">
                          Behance URL
                        </label>
                        <input
                          type="url"
                          value={settingsData.social_behance || ''}
                          onChange={(e) =>
                            setSettingsData({ ...settingsData, social_behance: e.target.value })
                          }
                          className="w-full px-4 py-2.5 rounded-xl bg-[#070B17] border border-[#24304A] text-xs text-[#F8FAFC] outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#94A3B8] mb-1">
                          YouTube URL
                        </label>
                        <input
                          type="url"
                          value={settingsData.social_youtube || ''}
                          onChange={(e) =>
                            setSettingsData({ ...settingsData, social_youtube: e.target.value })
                          }
                          className="w-full px-4 py-2.5 rounded-xl bg-[#070B17] border border-[#24304A] text-xs text-[#F8FAFC] outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="px-6 py-3 rounded-xl bg-[#4D8DFF] text-white text-xs font-semibold"
                  >
                    Save Site Settings
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
};
