import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import {
  Edit3,
  PlusCircle,
  Sliders,
  LogOut,
  ChevronUp,
  ChevronDown,
  Sparkles,
  Layers,
  Phone,
  LayoutDashboard,
  Eye,
  EyeOff,
} from 'lucide-react';

interface AdminPublicDockProps {
  isEditMode: boolean;
  onToggleEditMode: () => void;
  onOpenNewProject: () => void;
  onOpenEditHero: () => void;
  onOpenEditAbout: () => void;
  onOpenEditServices: () => void;
  onOpenEditContact: () => void;
  onOpenFullDashboard: () => void;
}

export const AdminPublicDock: React.FC<AdminPublicDockProps> = ({
  isEditMode,
  onToggleEditMode,
  onOpenNewProject,
  onOpenEditHero,
  onOpenEditAbout,
  onOpenEditServices,
  onOpenEditContact,
  onOpenFullDashboard,
}) => {
  const { user, logout } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 max-w-[95vw]">
      {isCollapsed ? (
        <button
          onClick={() => setIsCollapsed(false)}
          className="flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-[#0D1326]/95 backdrop-blur-md border border-[#4D8DFF]/60 text-white shadow-2xl shadow-[#4D8DFF]/20 hover:border-[#4D8DFF] transition-all group"
          title="Expand Admin Live Controls"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400" />
          <span className="text-xs font-mono font-semibold tracking-wider text-[#F8FAFC]">
            ADMIN EDITING
          </span>
          <ChevronUp className="w-4 h-4 text-[#4D8DFF] group-hover:-translate-y-0.5 transition-transform" />
        </button>
      ) : (
        <div className="rounded-2xl border border-[#24304A] bg-[#070B17]/95 backdrop-blur-xl p-2 sm:p-2.5 shadow-2xl shadow-black/80 flex flex-wrap items-center gap-1.5 sm:gap-2">
          {/* Status Badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#0D1326] border border-[#24304A]">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <div className="flex flex-col">
              <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold leading-none">
                Live Admin Mode
              </span>
              <span className="text-[10px] text-[#94A3B8] font-mono truncate max-w-[120px] sm:max-w-[150px] leading-tight">
                {user?.email || 'Admin'}
              </span>
            </div>
          </div>

          {/* Quick Edit Visual Highlights Toggle */}
          <button
            onClick={onToggleEditMode}
            title={isEditMode ? 'Hide visual edit markers' : 'Show visual edit markers on page'}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl text-xs font-medium transition-all ${
              isEditMode
                ? 'bg-[#4D8DFF] text-white shadow-md shadow-[#4D8DFF]/25 font-semibold'
                : 'bg-[#0D1326] text-[#94A3B8] hover:text-[#F8FAFC] border border-[#24304A]'
            }`}
          >
            {isEditMode ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">Edit Markers:</span>
            <span>{isEditMode ? 'ON' : 'OFF'}</span>
          </button>

          <div className="hidden lg:block h-6 w-[1px] bg-[#24304A] mx-0.5" />

          {/* Quick Edit Public Sections */}
          <button
            onClick={onOpenNewProject}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl bg-gradient-to-r from-[#4D8DFF] to-[#8B5CF6] hover:from-[#3b7bed] hover:to-[#7c3aed] text-white text-xs font-semibold shadow-md shadow-[#4D8DFF]/20 transition-all transform active:scale-95"
            title="Add a new project to your portfolio"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>+ Add Project</span>
          </button>

          <button
            onClick={onOpenEditHero}
            className="flex items-center gap-1.5 px-2 sm:px-2.5 py-2 rounded-xl bg-[#0D1326] hover:bg-[#111A30] border border-[#24304A] hover:border-[#4D8DFF]/50 text-xs text-[#94A3B8] hover:text-[#F8FAFC] transition-colors"
            title="Edit Hero Title, Subtitle, Photo and Socials"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#4D8DFF]" />
            <span className="hidden md:inline">Edit Hero</span>
          </button>

          <button
            onClick={onOpenEditAbout}
            className="flex items-center gap-1.5 px-2 sm:px-2.5 py-2 rounded-xl bg-[#0D1326] hover:bg-[#111A30] border border-[#24304A] hover:border-[#4D8DFF]/50 text-xs text-[#94A3B8] hover:text-[#F8FAFC] transition-colors"
            title="Edit About Story, Bio, Quote and Studio Photo"
          >
            <Edit3 className="w-3.5 h-3.5 text-[#8B5CF6]" />
            <span className="hidden md:inline">Edit About</span>
          </button>

          <button
            onClick={onOpenEditServices}
            className="flex items-center gap-1.5 px-2 sm:px-2.5 py-2 rounded-xl bg-[#0D1326] hover:bg-[#111A30] border border-[#24304A] hover:border-[#4D8DFF]/50 text-xs text-[#94A3B8] hover:text-[#F8FAFC] transition-colors"
            title="Manage Creative Services"
          >
            <Layers className="w-3.5 h-3.5 text-[#22D3EE]" />
            <span className="hidden md:inline">Services</span>
          </button>

          <button
            onClick={onOpenEditContact}
            className="flex items-center gap-1.5 px-2 sm:px-2.5 py-2 rounded-xl bg-[#0D1326] hover:bg-[#111A30] border border-[#24304A] hover:border-[#4D8DFF]/50 text-xs text-[#94A3B8] hover:text-[#F8FAFC] transition-colors"
            title="Edit Contact Info and Channels"
          >
            <Phone className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden md:inline">Contact</span>
          </button>

          <div className="h-6 w-[1px] bg-[#24304A] mx-0.5" />

          {/* Full Dashboard & Logout */}
          <button
            onClick={onOpenFullDashboard}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl bg-[#111A30] hover:bg-[#16223e] border border-[#24304A] hover:border-[#4D8DFF]/50 text-xs font-medium text-[#F8FAFC] transition-colors"
            title="Open comprehensive Admin Dashboard"
          >
            <LayoutDashboard className="w-3.5 h-3.5 text-[#4D8DFF]" />
            <span className="hidden sm:inline">Console</span>
          </button>

          <button
            onClick={logout}
            className="p-2 rounded-xl bg-[#0D1326] hover:bg-red-500/10 border border-[#24304A] hover:border-red-500/40 text-[#94A3B8] hover:text-red-400 transition-colors"
            title="Sign out of Admin session"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>

          {/* Minimize / Collapse */}
          <button
            onClick={() => setIsCollapsed(true)}
            className="p-2 rounded-xl bg-[#0D1326] hover:bg-[#111A30] border border-[#24304A] text-[#94A3B8] hover:text-[#F8FAFC] transition-colors"
            title="Collapse admin toolbar"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
