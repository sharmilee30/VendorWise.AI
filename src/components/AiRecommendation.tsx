import React from 'react';
import {
  Sparkles,
  Award,
  ShieldAlert,
  TrendingUp,
  RefreshCw,
  CheckCircle2,
  Info,
  Scale,
} from 'lucide-react';
import {
  AiRecommendationResponse,
  VendorScoreResult,
  CriteriaWeights,
} from '../types';

interface AiRecommendationProps {
  recommendation: AiRecommendationResponse | null;
  isLoading: boolean;
  onRefresh: () => void;
  isAiConfigured: boolean;
  rankedVendors: VendorScoreResult[];
  weights: CriteriaWeights;
}

export const AiRecommendation: React.FC<AiRecommendationProps> = ({
  recommendation,
  isLoading,
  onRefresh,
  rankedVendors,
}) => {
  const winner = rankedVendors[0];

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-gradient-to-r from-slate-900 to-brand-950 text-white">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-brand-500/20 border border-brand-400/30 flex items-center justify-center text-brand-300">
            <Sparkles className="w-5 h-5 text-brand-300" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-bold tracking-tight">
                AI Executive Recommendation & Decision Support
              </h2>
              <span
                className={`text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full border ${
                  recommendation?.isAiGenerated
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                }`}
              >
                {recommendation?.isAiGenerated
                  ? recommendation.modelName || 'Gemini'
                  : 'Deterministic Engine'}
              </span>
            </div>
            <p className="text-xs text-slate-300">
              Interprets deterministic calculations into strategic procurement rationale
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={onRefresh}
            disabled={isLoading || rankedVendors.length === 0}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-500 rounded-lg shadow-2xs transition-colors disabled:opacity-50"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`}
            />
            <span>{isLoading ? 'Synthesizing...' : 'Re-analyze Decision'}</span>
          </button>
        </div>
      </div>

      {/* API Notice / Fallback Banner */}
      {recommendation?.error && (
        <div className="px-5 py-3 bg-amber-50 border-b border-amber-200/80 text-amber-900 text-xs flex items-center">
          <div className="flex items-center space-x-2">
            <Info className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{recommendation.error}</span>
          </div>
        </div>
      )}

      {/* Main Body */}
      {isLoading ? (
        <div className="p-12 text-center">
          <div className="inline-block p-4 rounded-full bg-brand-50 text-brand-600 mb-3 animate-spin">
            <RefreshCw className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">
            Synthesizing Procurement Briefing...
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Extracting mathematical drivers, operational risk tradeoffs, and dual-sourcing justifications for Nova Manufacturing Ltd.
          </p>
        </div>
      ) : recommendation ? (
        <div className="p-5 sm:p-6 space-y-6">
          {/* Executive Verdict Banner */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs font-bold text-brand-600 uppercase tracking-wider">
                Recommended Decision
              </span>
              <div className="flex items-center space-x-2">
                <Award className="w-6 h-6 text-amber-500 shrink-0" />
                <h3 className="text-xl font-extrabold text-slate-900">
                  {recommendation.recommendedVendor}
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800">
                  Rank #1 Leader ({winner?.overallScore}/100)
                </span>
              </div>
              <p className="text-xs text-slate-600 font-medium">
                {recommendation.executiveSummary}
              </p>
            </div>

            <div className="shrink-0 flex md:flex-col items-center md:items-end justify-between border-t md:border-t-0 pt-2 md:pt-0 border-slate-200">
              <span className="text-[11px] font-semibold text-slate-400 uppercase">
                Dual-Source Runner-Up
              </span>
              <span className="text-sm font-bold text-slate-800">
                {recommendation.bestAlternative.name}
              </span>
            </div>
          </div>

          {/* Grid: Why it ranked highest & Weight sensitivity */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* 1. Why it ranked highest */}
            <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-bold text-slate-900">
                  Why It Ranked Highest
                </h4>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">
                {recommendation.whyRankedHighest}
              </p>
            </div>

            {/* 2. Weight Sensitivity Dynamics */}
            <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Scale className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-bold text-slate-900">
                  Weight Sensitivity & Trade-offs
                </h4>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">
                {recommendation.weightSensitivity}
              </p>
            </div>
          </div>

          {/* Grid: Strengths vs Weaknesses & Risks */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Strengths */}
            <div className="p-4 rounded-xl border border-emerald-100 bg-emerald-50/30">
              <div className="flex items-center space-x-2 mb-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <h4 className="text-sm font-bold text-emerald-950">
                  Major Strengths & Advantages
                </h4>
              </div>
              <ul className="space-y-1.5 text-xs text-slate-700">
                {recommendation.majorStrengths.map((strength, idx) => (
                  <li key={idx} className="flex items-start space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                    <span>{strength}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Weaknesses & Mitigation */}
            <div className="p-4 rounded-xl border border-amber-200/80 bg-amber-50/30">
              <div className="flex items-center space-x-2 mb-2.5">
                <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                <h4 className="text-sm font-bold text-amber-950">
                  Vulnerabilities & Risk Mitigation
                </h4>
              </div>
              <ul className="space-y-1.5 text-xs text-slate-700">
                {recommendation.majorWeaknesses.map((weakness, idx) => (
                  <li key={idx} className="flex items-start space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                    <span>{weakness}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Best Alternative Vendor Card */}
          <div className="p-4 rounded-xl border border-sky-100 bg-sky-50/40">
            <div className="flex items-center space-x-2 mb-1.5">
              <span className="text-xs font-bold text-sky-900 uppercase tracking-wide">
                Dual-Sourcing Recommendation:
              </span>
              <span className="font-extrabold text-sm text-slate-900">
                {recommendation.bestAlternative.name}
              </span>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed">
              {recommendation.bestAlternative.justification}
            </p>
          </div>
        </div>
      ) : (
        <div className="p-8 text-center text-slate-400 text-xs">
          Click "Re-analyze Decision" to generate structured procurement guidance.
        </div>
      )}
    </div>
  );
};
