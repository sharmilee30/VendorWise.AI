import React from 'react';
import { AiRecommendation } from '../components/AiRecommendation';
import {
  VendorScoreResult,
  CriteriaWeights,
  AiRecommendationResponse,
} from '../types';
import { Award, ShieldAlert, Sparkles, Scale, RefreshCw } from 'lucide-react';
import { WeightsInvalidNotice } from '../components/WeightsInvalidNotice';
import { PageId } from '../components/Sidebar';

interface AiRecommendationPageProps {
  recommendation: AiRecommendationResponse | null;
  isLoading: boolean;
  onRefresh: () => void;
  isAiConfigured: boolean;
  /** The briefing was generated from different vendors/weights than the ones now on screen. */
  isStale: boolean;
  isValid: boolean;
  totalWeight: number;
  onNavigate: (page: PageId) => void;
  rankedVendors: VendorScoreResult[];
  weights: CriteriaWeights;
}

export const AiRecommendationPage: React.FC<AiRecommendationPageProps> = ({
  recommendation,
  isLoading,
  onRefresh,
  isAiConfigured,
  isStale,
  isValid,
  totalWeight,
  onNavigate,
  rankedVendors,
  weights,
}) => {
  const winner = rankedVendors[0];
  const runnerUp = rankedVendors[1];

  // With invalid weights there is no ranking, so any briefing on screen would describe numbers
  // that no longer exist. Say so instead of showing it.
  if (!isValid) {
    return (
      <div className="space-y-6">
        <WeightsInvalidNotice
          totalWeight={totalWeight}
          subject="The AI briefing is"
          onFix={() => onNavigate('evaluation')}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {isStale && (
        <div
          role="status"
          className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
        >
          <div className="text-xs text-amber-900">
            <strong>This briefing is out of date.</strong> The vendors or weights changed after it
            was generated, so the text below may not match the current ranking above. Re-analyze
            to refresh it.
          </div>
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shrink-0 self-start sm:self-center disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Re-analyze now
          </button>
        </div>
      )}

      {/* Context Summary Bar */}
      {winner && (
        <div className="bg-white rounded-xl border border-slate-200/90 p-4 sm:p-5 shadow-xs flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Current Ground-Truth Mathematical Result
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="text-base font-extrabold text-slate-900">{winner.name}</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 whitespace-nowrap">
                  {winner.overallScore.toFixed(2)} / 100
                </span>
                {runnerUp && (
                  <span className="text-xs font-medium text-slate-500">
                    (Runner-Up: {runnerUp.name} — {runnerUp.overallScore.toFixed(2)})
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 text-xs border-t lg:border-t-0 lg:border-l border-slate-100 pt-3 lg:pt-0 lg:pl-4">
            <span className="font-semibold text-slate-700 mr-1">Weights:</span>
            {[
              ['Cost', weights.cost],
              ['Qual', weights.quality],
              ['Del', weights.delivery],
              ['Rel', weights.reliability],
              ['ESG', weights.sustainability],
            ].map(([label, value]) => (
              <span
                key={label}
                className="px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200 text-slate-600 whitespace-nowrap"
              >
                {label} <span className="font-semibold text-slate-800">{value}%</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Main AI Executive Recommendation Section */}
      <AiRecommendation
        recommendation={recommendation}
        isLoading={isLoading}
        onRefresh={onRefresh}
        isAiConfigured={isAiConfigured}
        rankedVendors={rankedVendors}
        weights={weights}
      />
    </div>
  );
};
