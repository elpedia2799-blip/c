import React from 'react';
import {
  PenTool,
  Sparkles,
  Layers,
  Shirt,
  Share2,
  Layout,
  ArrowRight,
  LucideIcon,
  Edit3,
  Trash2,
  Plus,
} from 'lucide-react';
import { ServiceItem } from '../types.ts';

const iconMap: Record<string, LucideIcon> = {
  PenTool,
  Sparkles,
  Layers,
  Shirt,
  Share2,
  Layout,
};

interface ServicesProps {
  services: ServiceItem[];
  onSelectService: (service: ServiceItem) => void;
  isAuthenticated?: boolean;
  isEditMode?: boolean;
  onEditService?: (service: ServiceItem) => void;
  onAddService?: () => void;
  onDeleteService?: (service: ServiceItem) => void;
}

export const Services: React.FC<ServicesProps> = ({
  services,
  onSelectService,
  isAuthenticated = false,
  isEditMode = true,
  onEditService,
  onAddService,
  onDeleteService,
}) => {
  return (
    <section id="services" className="py-24 relative bg-[#070B17]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 mb-2">
            <span className="w-6 h-[2px] bg-[#22D3EE]" />
            <span className="font-mono text-xs font-semibold tracking-widest text-[#22D3EE] uppercase">
              — WHAT I DO
            </span>
            <span className="w-6 h-[2px] bg-[#22D3EE]" />
          </div>
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-[#F8FAFC] tracking-tight">
            CREATIVE SERVICES
          </h2>
          <p className="text-sm sm:text-base text-[#94A3B8] mt-3">
            Comprehensive creative solutions spanning brand strategy, digital design, merchandise, and interactive craft.
          </p>

          {isAuthenticated && isEditMode && onAddService && (
            <div className="mt-5 flex justify-center">
              <button
                onClick={onAddService}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#22D3EE]/15 border border-[#22D3EE]/40 text-[#22D3EE] hover:bg-[#22D3EE] hover:text-black text-xs font-semibold transition-all shadow-sm group"
                title="Add a new service offering"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add Service Offering</span>
              </button>
            </div>
          )}
        </div>

        {/* 6-Card Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((srv) => {
            const IconComponent = iconMap[srv.icon] || Sparkles;
            return (
              <div
                key={srv.id}
                onClick={() => onSelectService(srv)}
                className="group relative rounded-2xl border border-[#24304A] bg-[#0D1326] p-8 flex flex-col justify-between transition-all duration-300 hover:border-[#4D8DFF] hover:bg-[#111A30] hover:shadow-xl hover:shadow-[#4D8DFF]/10 cursor-pointer"
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-12 h-12 rounded-xl bg-[#111A30] border border-[#24304A] flex items-center justify-center text-[#4D8DFF] group-hover:text-[#22D3EE] group-hover:border-[#4D8DFF]/40 transition-colors">
                      <IconComponent className="w-6 h-6" />
                    </div>
                    <div className="flex items-center gap-2">
                      {isAuthenticated && isEditMode && onEditService && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditService(srv);
                          }}
                          className="w-7 h-7 rounded-lg bg-[#111A30] border border-[#24304A] text-[#94A3B8] hover:text-white hover:bg-[#4D8DFF] flex items-center justify-center transition-colors"
                          title="Edit Service"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {isAuthenticated && isEditMode && onDeleteService && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteService(srv);
                          }}
                          className="w-7 h-7 rounded-lg bg-[#111A30] border border-[#24304A] text-[#94A3B8] hover:text-white hover:bg-red-500 flex items-center justify-center transition-colors"
                          title="Delete Service"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <span className="font-mono text-sm font-bold text-[#94A3B8]/60 group-hover:text-[#4D8DFF] transition-colors">
                        {srv.number}
                      </span>
                    </div>
                  </div>

                  <h3 className="font-display font-bold text-xl text-[#F8FAFC] group-hover:text-[#4D8DFF] transition-colors mb-2.5">
                    {srv.title}
                  </h3>

                  <p className="text-sm text-[#94A3B8] leading-relaxed">
                    {srv.description}
                  </p>
                </div>

                <div className="mt-8 pt-4 border-t border-[#24304A]/60 flex items-center justify-between text-xs font-semibold text-[#94A3B8] group-hover:text-[#F8FAFC] transition-colors">
                  <span>Inquire Service</span>
                  <div className="w-7 h-7 rounded-full bg-[#111A30] border border-[#24304A] flex items-center justify-center text-[#4D8DFF] group-hover:bg-[#4D8DFF] group-hover:text-white transition-all">
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </div>
              </div>
            );
          })}

          {/* Inline Add Service Card for Admin */}
          {isAuthenticated && isEditMode && onAddService && (
            <div
              onClick={onAddService}
              className="rounded-2xl border-2 border-dashed border-[#22D3EE]/40 hover:border-[#22D3EE] bg-[#0D1326]/60 hover:bg-[#111A30]/80 p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 min-h-[300px] group"
            >
              <div className="w-12 h-12 rounded-2xl bg-[#22D3EE]/15 border border-[#22D3EE]/40 text-[#22D3EE] group-hover:bg-[#22D3EE] group-hover:text-black flex items-center justify-center transition-all duration-300 mb-4 group-hover:scale-110">
                <Plus className="w-6 h-6" />
              </div>
              <h4 className="font-display font-bold text-base text-[#F8FAFC] group-hover:text-[#22D3EE] transition-colors">
                Add Creative Service
              </h4>
              <p className="text-xs text-[#94A3B8] max-w-xs mt-1.5 leading-relaxed">
                Add a new design offering, icon, pricing and deliverables directly to your public services section.
              </p>
              <span className="mt-4 px-3 py-1.5 rounded-lg bg-[#22D3EE]/20 text-[#22D3EE] font-mono text-[11px] font-semibold group-hover:bg-[#22D3EE] group-hover:text-black transition-all">
                + Create Offering
              </span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
