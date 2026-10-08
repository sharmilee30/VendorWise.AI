import React from 'react';
import {
  Award,
  ArrowRight,
  TrendingUp,
  SlidersHorizontal,
  Sparkles,
  BarChart3,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { KpiCards } from '../components/KpiCards';
import { WeightsInvalidNotice } from '../components/WeightsInvalidNotice';
import {
  VendorScoreResult,
  CriteriaWeights,
  AiRecommendationResponse,
} from '../types';
import { CRITERIA_METADATA } from '../services/scoringEngine';
import { PageId } from '../components/Sidebar';
import { Bar } from 'react-chartjs-2';

interface DashboardPageProps {
  rankedVendors: VendorScoreResult[];
  weights: CriteriaWeights;
  isValid: boolean;
  totalWeight: number;
  vendorCount: number;
  recommendation: AiRecommendationResponse | null;
  onNavigate: (page: PageId) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  rankedVendors,
  weights,
  isValid,
  totalWeight,
  vendorCount,
  recommendation,
  onNavigate,
}) => {
  const winner = rankedVendors[0];
  const runnerUp = rankedVendors[1];
  const leadMargin =
    winner && runnerUp
      ? Number((winner.overallScore - runnerUp.overallScore).toFixed(2))
      : 0;

  // Compact bar chart data for Dashboard
  const barChartData = {
    labels: rankedVendors.slice(0, 5).map((v) => v.name),
    datasets: [
      {
        label: 'Overall Score',
        data: rankedVendors.slice(0, 5).map((v) => v.overallScore),
        backgroundColor: rankedVendors.slice(0, 5).map((v) =>
          v.rank === 1
            ? 'rgba(16, 185, 129, 0.85)' // Emerald
            : v.rank === 2
            ? 'rgba(37, 99, 235, 0.85)' // Blue
            : 'rgba(148, 163, 184, 0.7)' // Slate
        ),
        borderColor: rankedVendors.slice(0, 5).map((v) =>
          v.rank === 1
            ? 'rgb(5, 150, 105)'
            : v.rank === 2
            ? 'rgb(29, 78, 216)'
            : 'rgb(100, 116, 139)'
        ),
        borderWidth: 1.5,
        borderRadius: 6,
      },
    ],
  };

  const barChartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context: any) => `Score: ${context.raw} / 100`,
        },
      },
    },
    scales: {
      y: {
        min: 60,
        max: 100,
        grid: { color: 'rgba(226, 232, 240, 0.8)' },
        ticks: { font: { family: 'Inter', size: 10 } },
      },
      x: {
        grid: { display: false },
        ticks: { font: { family: 'Inter', size: 11, weight: 'bold' } },
      },
    },
  };

  return (
    <div className="space-y-6">
      {!isValid && (
        <WeightsInvalidNotice
          totalWeight={totalWeight}
          subject="The vendor ranking, chart and recommendation are"
          onFix={() => onNavigate('evaluation')}
        />
      )}

      {/* 1. Four Standardized KPI Cards */}
      <KpiCards
        rankedVendors={rankedVendors}
        weights={weights}
        isValid={isValid}
        totalWeight={totalWeight}
        vendorCount={vendorCount}
      />

      {/* 2. Executive Decision Summary Banner */}
      {winner && (
        <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-brand-950 rounded-xl p-5 sm:p-6 text-white shadow-sm relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-2 max-w-3xl">
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Current Decision
                </span>
                <span className="text-xs text-slate-400">
                  Nova Manufacturing Evaluation Model
                </span>
              </div>

              <div className="flex items-center space-x-3">
                <Award className="w-7 h-7 text-amber-400 shrink-0" />
                <h2 className="text-2xl font-black text-white">
                  Recommended: {winner.name}
                </h2>
                <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
                  {winner.overallScore.toFixed(2)} / 100
                </span>
              </div>

              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {recommendation?.executiveSummary ||
                  `${winner.name} ranks #1 with a composite rating of ${winner.overallScore.toFixed(2)}/100, outperforming ${runnerUp?.name || 'alternatives'} by +${leadMargin} points. Strongest performance in ${
                    Object.entries(winner.criteria).sort((a, b) => b[1] - a[1])[0][0]
                  } matches Nova's active procurement criteria.`}
              </p>
            </div>

            <div className="shrink-0 flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-800 gap-2">
              <button
                onClick={() => onNavigate('ai')}
                className="inline-flex items-center space-x-1.5 px-4 py-2 text-xs font-bold text-slate-900 bg-white hover:bg-slate-100 rounded-lg shadow-xs transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-brand-600" />
                <span>Read Full AI Memo</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </button>
              <button
                onClick={() => onNavigate('analysis')}
                className="inline-flex items-center space-x-1 text-xs text-slate-300 hover:text-white transition-colors"
              >
                <span>Simulate Scenarios</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Balanced Two-Column Section: Top 5 Ranking & Visual Score Comparison */}
      {isValid && (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Column (7 cols): Compact Top 5 Ranking Table */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden flex flex-col justify-between h-full">
          <div>
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900">
                    Top 5 Vendor Rankings
                  </h3>
                  <p className="text-xs text-slate-500">
                    Ranked by deterministic weighted composite score
                  </p>
                </div>
              </div>

              <button
                onClick={() => onNavigate('analysis')}
                className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center space-x-1"
              >
                <span>Full Analysis</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50/75 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3 text-center w-14">Rank</th>
                    <th className="py-2.5 px-3">Vendor</th>
                    <th className="py-2.5 px-3 text-center">Score</th>
                    <th className="py-2.5 px-3 text-right">Lead Gap</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rankedVendors.slice(0, 5).map((vendor) => (
                    <tr
                      key={vendor.id}
                      className={
                        vendor.rank === 1
                          ? 'bg-emerald-50/30'
                          : 'hover:bg-slate-50/60 transition-colors'
                      }
                    >
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-black ${
                            vendor.rank === 1
                              ? 'bg-amber-400 text-amber-950'
                              : vendor.rank === 2
                              ? 'bg-slate-200 text-slate-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          #{vendor.rank}
                        </span>
                      </td>

                      <td className="py-2.5 px-3">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-slate-900 text-xs sm:text-sm">
                            {vendor.name}
                          </span>
                          {vendor.isRecommended && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              Recommended
                            </span>
                          )}
                          {vendor.isAlternative && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-sky-100 text-sky-800 border border-sky-200">
                              Alternative
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-900 text-xs sm:text-sm">
                        {vendor.overallScore.toFixed(2)}
                      </td>

                      <td className="py-2.5 px-3 text-right">
                        {vendor.rank === 1 ? (
                          <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                            Leader
                          </span>
                        ) : (
                          <span className="text-[11px] font-semibold text-slate-500 font-mono">
                            -{vendor.scoreGapToLeader.toFixed(2)} pts
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="p-3 bg-slate-50/50 border-t border-slate-100 text-right">
            <span className="text-[11px] text-slate-500">
              Showing top {Math.min(5, rankedVendors.length)} of {rankedVendors.length} active suppliers
            </span>
          </div>
        </div>

        {/* Right Column (5 cols): Compact Overall Score Chart */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200/90 shadow-xs p-5 flex flex-col justify-between h-full">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Comparative Scores
                  </h3>
                  <p className="text-xs text-slate-500">
                    Visual ranking distribution
                  </p>
                </div>
              </div>
            </div>

            <div className="h-56 w-full mt-3">
              <Bar data={barChartData} options={barChartOptions} />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center">
              <span className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5" />
              #1 Winner
            </span>
            <span className="flex items-center">
              <span className="w-2 h-2 rounded-full bg-brand-600 mr-1.5" />
              #2 Runner-Up
            </span>
            <span className="flex items-center">
              <span className="w-2 h-2 rounded-full bg-slate-400 mr-1.5" />
              Qualified
            </span>
          </div>
        </div>
      </div>
      )}

      {/* 4. Current Criteria Weighting Summary Card */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-slate-100 gap-2">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center">
              <SlidersHorizontal className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Active Weighting Configuration Summary
              </h3>
              <p className="text-xs text-slate-500">
                Current evaluation criteria weighting enforced across all scoring models
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigate('evaluation')}
            className="inline-flex items-center space-x-1 text-xs font-semibold text-brand-600 hover:text-brand-700 self-start sm:self-auto"
          >
            <span>Adjust Weights</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 5-Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-4">
          {(Object.keys(weights) as (keyof CriteriaWeights)[]).map((criterion) => {
            const meta = CRITERIA_METADATA[criterion];
            const val = weights[criterion];

            return (
              <div
                key={criterion}
                className="p-3 rounded-lg border border-slate-100 bg-slate-50/50 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700 capitalize">
                    <span>{meta.label}</span>
                    <span className="font-mono text-slate-900">{val}%</span>
                  </div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        backgroundColor: meta.color,
                        width: `${val}%`,
                      }}
                    />
                  </div>
                </div>
                <div className="text-[10px] text-slate-400 mt-2 truncate" title={meta.description}>
                  {meta.description}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
