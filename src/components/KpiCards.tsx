import React from 'react';
import {
  Award,
  TrendingUp,
  Users,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { VendorScoreResult, CriteriaWeights } from '../types';

interface KpiCardsProps {
  rankedVendors: VendorScoreResult[];
  weights: CriteriaWeights;
  isValid: boolean;
  totalWeight: number;
  vendorCount: number;
}

export const KpiCards: React.FC<KpiCardsProps> = ({
  rankedVendors,
  weights,
  isValid,
  totalWeight,
  vendorCount,
}) => {
  const topVendor = rankedVendors[0];
  const runnerUp = rankedVendors[1];
  const topScore = topVendor ? topVendor.overallScore : 0;
  const runnerUpScore = runnerUp ? runnerUp.overallScore : 0;
  const leadMargin = topVendor && runnerUp ? Number((topScore - runnerUpScore).toFixed(2)) : 0;

  // Find dominant criteria
  const weightEntries = Object.entries(weights) as [keyof CriteriaWeights, number][];
  weightEntries.sort((a, b) => b[1] - a[1]);
  const primaryWeight = weightEntries[0];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
      {/* 1. Recommended Vendor */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-5 xl:p-4 2xl:p-5 shadow-xs relative overflow-hidden flex flex-col justify-between h-full">
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-emerald-500/10 to-transparent rounded-bl-full pointer-events-none" />
        
        {/* Row 1: Title & Icon */}
        <div className="flex items-center justify-between mb-3 h-8">
          <span className="text-xs xl:text-[11px] 2xl:text-xs font-semibold text-slate-500 uppercase tracking-wider xl:tracking-wide 2xl:tracking-wider truncate mr-2">
            Recommended Vendor
          </span>
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Award className="w-[18px] h-[18px]" />
          </div>
        </div>

        {/* Row 2: Main Value */}
        <div className="h-9 flex items-baseline space-x-2 mb-2 overflow-hidden">
          <h3
            className="text-2xl xl:text-xl 2xl:text-2xl font-extrabold text-slate-900 truncate"
            title={topVendor ? topVendor.name : undefined}
          >
            {topVendor ? topVendor.name : '—'}
          </h3>
        </div>

        {/* Row 3: Supporting Info */}
        <div className="h-5 flex items-center text-xs text-slate-500 overflow-hidden">
          {!isValid ? (
            <span className="truncate text-rose-600 font-medium">Scoring paused: weights must total 100%</span>
          ) : topVendor && runnerUp ? (
            <span
              className="inline-flex items-center text-emerald-600 font-medium truncate"
              title={`+${leadMargin} pts ahead of ${runnerUp.name}`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 shrink-0" />
              <span className="truncate">+{leadMargin} pts vs {runnerUp.name}</span>
            </span>
          ) : (
            <span className="truncate">Insufficient data for ranking</span>
          )}
        </div>
      </div>

      {/* 2. Highest Score */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-5 xl:p-4 2xl:p-5 shadow-xs relative overflow-hidden flex flex-col justify-between h-full">
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-brand-500/10 to-transparent rounded-bl-full pointer-events-none" />
        
        {/* Row 1: Title & Icon */}
        <div className="flex items-center justify-between mb-3 h-8">
          <span className="text-xs xl:text-[11px] 2xl:text-xs font-semibold text-slate-500 uppercase tracking-wider xl:tracking-wide 2xl:tracking-wider truncate mr-2">
            Highest Score
          </span>
          <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
            <TrendingUp className="w-[18px] h-[18px]" />
          </div>
        </div>

        {/* Row 2: Main Value */}
        <div className="h-9 flex items-baseline space-x-2 mb-2 overflow-hidden">
          <span className="text-2xl font-extrabold text-slate-900">
            {topVendor ? topScore.toFixed(2) : '—'}
          </span>
          {topVendor && <span className="text-xs font-semibold text-slate-400">/ 100</span>}
        </div>

        {/* Row 3: Supporting Info */}
        <div className="h-5 flex items-center text-xs text-slate-500 overflow-hidden">
          <span className="text-slate-600 font-medium truncate">
            {!topVendor ? 'Not available until weights total 100%' : <>Benchmark: {topScore >= 85 ? 'Grade A (Optimal)' : topScore >= 75 ? 'Grade B (Acceptable)' : 'Grade C (Borderline)'}</>}
          </span>
        </div>
      </div>

      {/* 3. Active Candidates */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-5 xl:p-4 2xl:p-5 shadow-xs relative overflow-hidden flex flex-col justify-between h-full">
        {/* Row 1: Title & Icon */}
        <div className="flex items-center justify-between mb-3 h-8">
          <span className="text-xs xl:text-[11px] 2xl:text-xs font-semibold text-slate-500 uppercase tracking-wider xl:tracking-wide 2xl:tracking-wider truncate mr-2">
            Active Candidates
          </span>
          <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
            <Users className="w-[18px] h-[18px]" />
          </div>
        </div>

        {/* Row 2: Main Value */}
        <div className="h-9 flex items-baseline space-x-2 mb-2 overflow-hidden">
          <span className="text-2xl font-extrabold text-slate-900">
            {vendorCount}
          </span>
          <span className="text-xs text-slate-500">
            {isValid ? 'Suppliers Evaluated' : 'Suppliers in pool'}
          </span>
        </div>

        {/* Row 3: Supporting Info */}
        <div className="h-5 flex items-center text-xs text-slate-500 overflow-hidden">
          {!isValid ? (
            <span className="truncate text-rose-600 font-medium">Ranking paused until weights total 100%</span>
          ) : runnerUp ? (
            <span
              className="text-slate-600 truncate"
              title={`Runner-up: ${runnerUp.name} (${runnerUp.overallScore})`}
            >
              Runner-up: <strong className="text-slate-800">{runnerUp.name}</strong> ({runnerUp.overallScore})
            </span>
          ) : (
            <span className="truncate">Add at least 2 suppliers to compare</span>
          )}
        </div>
      </div>

      {/* 4. Weight Allocation */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-5 xl:p-4 2xl:p-5 shadow-xs relative overflow-hidden flex flex-col justify-between h-full">
        {/* Row 1: Title & Icon */}
        <div className="flex items-center justify-between mb-3 h-8">
          <span className="text-xs xl:text-[11px] 2xl:text-xs font-semibold text-slate-500 uppercase tracking-wider xl:tracking-wide 2xl:tracking-wider truncate mr-2">
            Weight Allocation
          </span>
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
              isValid
                ? 'bg-emerald-50 text-emerald-600'
                : 'bg-rose-50 text-rose-600'
            }`}
          >
            {isValid ? (
              <CheckCircle2 className="w-[18px] h-[18px]" />
            ) : (
              <AlertCircle className="w-[18px] h-[18px]" />
            )}
          </div>
        </div>

        {/* Row 2: Main Value */}
        <div className="h-9 flex items-baseline space-x-2 mb-2 overflow-hidden">
          <span
            className={`text-2xl font-extrabold ${
              isValid ? 'text-slate-900' : 'text-rose-600'
            }`}
          >
            {totalWeight}%
          </span>
          <span
            className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
              isValid
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-rose-100 text-rose-800'
            }`}
          >
            {isValid ? '100% Balanced' : 'Imbalanced'}
          </span>
        </div>

        {/* Row 3: Supporting Info */}
        <div className="h-5 flex items-center text-xs text-slate-500 overflow-hidden">
          <span
            className="truncate"
            title={`Lead driver: ${primaryWeight[0]} (${primaryWeight[1]}%)`}
          >
            Lead driver: <strong className="capitalize text-slate-700">{primaryWeight[0]}</strong> ({primaryWeight[1]}%)
          </span>
        </div>
      </div>
    </div>
  );
};
