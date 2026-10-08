import React from 'react';
import {
  FileText,
  Key,
  RotateCcw,
  Menu,
} from 'lucide-react';
import { PageId } from './Sidebar';

interface HeaderProps {
  activePage: PageId;
  onOpenMobileMenu: () => void;
  onResetDefaults: () => void;
  onOpenExportModal: () => void;
  isAiConfigured: boolean;
  isExportDisabled?: boolean;
}

const PAGE_META: Record<PageId, { title: string; subtitle: string }> = {
  dashboard: {
    title: 'Executive Dashboard',
    subtitle: 'Current procurement recommendation & decision summary',
  },
  evaluation: {
    title: 'Vendor Evaluation Matrix',
    subtitle: 'Configure criteria weights & maintain supplier metrics',
  },
  analysis: {
    title: 'Analysis & Scenario Sensitivity',
    subtitle: 'Deterministic ranking, weight simulations & comparative charts',
  },
  ai: {
    title: 'AI Recommendation & Advisory',
    subtitle: 'Strategic decision explanation, risk analysis & dual-sourcing',
  },
};

export const Header: React.FC<HeaderProps> = ({
  activePage,
  onOpenMobileMenu,
  onResetDefaults,
  onOpenExportModal,
  isAiConfigured,
  isExportDisabled = false,
}) => {
  const meta = PAGE_META[activePage];

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-xs h-16">
      <div className="h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-3">
        {/* Left: Mobile hamburger + Active Page Breadcrumb */}
        <div className="flex items-center space-x-3 min-w-0">
          <button
            onClick={onOpenMobileMenu}
            className="md:hidden p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 focus:outline-none"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="min-w-0">
            <h1 className="text-sm sm:text-lg font-bold text-slate-900 tracking-tight leading-tight truncate">
              {meta.title}
            </h1>
            <p className="text-xs text-slate-500 hidden lg:block truncate">
              {meta.subtitle}
            </p>
          </div>
        </div>

        {/* Right: Global Action Controls */}
        <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
          {/* AI status indicator (the key is configured server-side in .env) */}
          <div
            title={
              isAiConfigured
                ? 'Gemini API key is configured on the server'
                : 'No Gemini API key on the server; using the built-in rule engine'
            }
            className={`inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border whitespace-nowrap ${
              isAiConfigured
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-slate-50 text-slate-700 border-slate-200'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">
              {isAiConfigured ? 'Gemini AI: Connected' : 'Gemini AI: Local Engine'}
            </span>
            <span className="lg:hidden">AI</span>
            {isAiConfigured && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            )}
          </div>

          {/* Reset Defaults */}
          <button
            onClick={onResetDefaults}
            title="Reset all vendors and weights to Nova default values"
            aria-label="Reset defaults"
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 rounded-lg border border-slate-200 transition-colors whitespace-nowrap"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden lg:inline">Reset Defaults</span>
          </button>

          {/* Export Report */}
          <button
            onClick={onOpenExportModal}
            disabled={isExportDisabled}
            aria-label="Export brief"
            title={isExportDisabled ? 'Fix the criteria weights (must total 100%) to export a brief' : 'Export decision brief'}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-lg shadow-xs transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-brand-600"
          >
            <FileText className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export Brief</span>
          </button>
        </div>
      </div>
    </header>
  );
};
