import React from 'react';
import {
  LayoutDashboard,
  SlidersHorizontal,
  GitCompare,
  Sparkles,
  Building2,
  X,
  FileCheck2,
} from 'lucide-react';

export type PageId = 'dashboard' | 'evaluation' | 'analysis' | 'ai';

interface SidebarProps {
  activePage: PageId;
  onSelectPage: (page: PageId) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  totalWeight: number;
  isWeightValid: boolean;
  vendorCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activePage,
  onSelectPage,
  mobileOpen,
  onCloseMobile,
  totalWeight,
  isWeightValid,
  vendorCount,
}) => {
  const navItems = [
    {
      id: 'dashboard' as PageId,
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null,
      description: 'Executive overview & key decision',
    },
    {
      id: 'evaluation' as PageId,
      label: 'Vendor Evaluation',
      icon: SlidersHorizontal,
      badge: !isWeightValid ? 'Weight Alert' : `${vendorCount} Vendors`,
      badgeAlert: !isWeightValid,
      description: 'Criteria weights & supplier matrix',
    },
    {
      id: 'analysis' as PageId,
      label: 'Analysis & Scenarios',
      icon: GitCompare,
      badge: null,
      description: 'Rankings, sensitivity & charts',
    },
    {
      id: 'ai' as PageId,
      label: 'AI Recommendation',
      icon: Sparkles,
      badge: null,
      description: 'Strategic explanation & risks',
    },
  ];

  const handleNavClick = (page: PageId) => {
    onSelectPage(page);
    onCloseMobile();
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white border-r border-slate-200 w-64">
      {/* Top Branding */}
      <div className="h-16 px-5 border-b border-slate-100 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-700 to-brand-500 flex items-center justify-center text-white shadow-xs shadow-brand-500/30">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="text-base font-extrabold tracking-tight text-slate-900">
                VendorWise<span className="text-brand-600">.AI</span>
              </span>
            </div>
            <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase block">
              Decision Support
            </span>
          </div>
        </div>

        {/* Mobile close button */}
        <button
          onClick={onCloseMobile}
          className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          aria-label="Close menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation Section */}
      <div className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Navigation
        </div>

        {navItems.map((item) => {
          const isActive = activePage === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-brand-50 text-brand-700 font-bold border border-brand-200/60 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-transparent'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Icon
                  className={`w-4 h-4 shrink-0 transition-colors ${
                    isActive ? 'text-brand-600' : 'text-slate-400'
                  }`}
                />
                <span className="whitespace-nowrap">{item.label}</span>
              </div>

              {item.badge && (
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
                    item.badgeAlert
                      ? 'bg-rose-100 text-rose-700 animate-pulse'
                      : isActive
                      ? 'bg-brand-100 text-brand-800'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Model Status Card */}
      <div className="p-3 mx-3 mb-3 bg-slate-50 border border-slate-200/80 rounded-xl">
        <div className="flex items-center space-x-2 text-[11px] font-bold text-slate-700 mb-1">
          <FileCheck2 className="w-3.5 h-3.5 text-brand-600 shrink-0" />
          <span>Scoring Model Status</span>
        </div>
        <div className="text-[11px] text-slate-500 space-y-0.5">
          <div className="flex justify-between">
            <span>Weight Sum:</span>
            <span
              className={`font-mono font-bold ${
                isWeightValid ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              {totalWeight}%
            </span>
          </div>
          <div className="flex justify-between">
            <span>Formula:</span>
            <span className="text-slate-700 font-medium">Deterministic</span>
          </div>
        </div>
      </div>

      {/* Bottom Company Branding */}
      <div className="p-4 border-t border-slate-100 shrink-0 bg-slate-50/50">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-500 shadow-2xs shrink-0">
            <Building2 className="w-4 h-4 text-slate-600" />
          </div>
          <div className="truncate">
            <div className="text-xs font-bold text-slate-800 truncate">
              Nova Manufacturing Ltd.
            </div>
            <div className="text-[10px] text-slate-500 truncate font-mono">
              RFQ-2026-MFG-048
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:flex fixed inset-y-0 left-0 z-30">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white z-10 shadow-xl">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
