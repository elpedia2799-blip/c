import React from 'react';
import { Compass, Lightbulb, PenTool, CheckCircle, Package } from 'lucide-react';

export const Process: React.FC = () => {
  const steps = [
    {
      num: '01',
      title: 'DISCOVER',
      subtitle: 'Research & Goal Mapping',
      desc: "Understand the client's core needs, brand ethos, target audience, and competitive landscape.",
      icon: Compass,
    },
    {
      num: '02',
      title: 'CONCEPT',
      subtitle: 'Creative Ideation',
      desc: 'Explore divergent visual directions, mood boards, typographic pairings, and rough structural sketches.',
      icon: Lightbulb,
    },
    {
      num: '03',
      title: 'DESIGN',
      subtitle: 'Precision Execution',
      desc: 'Transform the chosen concept into high-fidelity vectors, layouts, 3D elements, or responsive interfaces.',
      icon: PenTool,
    },
    {
      num: '04',
      title: 'REFINE',
      subtitle: 'Feedback Iteration',
      desc: 'Polish micro-details, contrast balances, and edge cases incorporating constructive collaborative feedback.',
      icon: CheckCircle,
    },
    {
      num: '05',
      title: 'DELIVER',
      subtitle: 'Production & Assets',
      desc: 'Provide production-ready vector masters, font packages, web formats, and comprehensive brand guideline books.',
      icon: Package,
    },
  ];

  return (
    <section id="process" className="py-24 relative bg-[#0D1326] border-t border-[#24304A]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 mb-2">
            <span className="w-6 h-[2px] bg-[#4D8DFF]" />
            <span className="font-mono text-xs font-semibold tracking-widest text-[#4D8DFF] uppercase">
              — MY PROCESS
            </span>
            <span className="w-6 h-[2px] bg-[#4D8DFF]" />
          </div>
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-[#F8FAFC] tracking-tight">
            HOW I WORK
          </h2>
          <p className="text-sm sm:text-base text-[#94A3B8] mt-3">
            A disciplined, 5-stage design workflow that transforms abstract ambitions into world-class visual executions.
          </p>
        </div>

        {/* 5-Step Process Pipeline */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div
                key={step.num}
                className="group relative rounded-2xl border border-[#24304A] bg-[#070B17] p-6 flex flex-col justify-between transition-all duration-300 hover:border-[#4D8DFF] hover:shadow-lg hover:shadow-[#4D8DFF]/15"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="w-9 h-9 rounded-lg bg-[#111A30] border border-[#24304A] flex items-center justify-center text-[#4D8DFF] group-hover:border-[#4D8DFF]/40 transition-colors">
                      <Icon className="w-4 h-4" />
                    </span>
                    <span className="font-mono text-xs font-bold text-[#8B5CF6]">
                      STEP {step.num}
                    </span>
                  </div>

                  <h3 className="font-display font-bold text-base text-[#F8FAFC] tracking-tight group-hover:text-[#4D8DFF] transition-colors mb-1">
                    {step.title}
                  </h3>
                  <h4 className="text-[11px] font-mono text-[#22D3EE] uppercase tracking-wider mb-3">
                    {step.subtitle}
                  </h4>

                  <p className="text-xs text-[#94A3B8] leading-relaxed">
                    {step.desc}
                  </p>
                </div>

                <div className="mt-6 pt-3 border-t border-[#24304A]/50 flex items-center justify-between text-[11px] font-mono text-[#94A3B8]/60">
                  <span>PHASE 0{idx + 1}</span>
                  {idx < steps.length - 1 ? <span>→</span> : <span>✓</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
