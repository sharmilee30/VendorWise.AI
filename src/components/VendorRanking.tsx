import React from 'react';
import { Award } from 'lucide-react';
import { VendorScoreResult, CriteriaWeights } from '../types';

interface VendorRankingProps {
  rankedVendors: VendorScoreResult[];
  weights: CriteriaWeights;
  selectedVendorId: string | null;
  onSelectVendor: (id: string) => void;
}

const CONTRIBUTION_SEGMENTS = [
  { key: 'cost', label: 'Cost', short: 'C', color: 'bg-sky-500' },
  { key: 'quality', label: 'Quality', short: 'Q', color: 'bg-blue-600' },
  { key: 'delivery', label: 'Delivery', short: 'D', color: 'bg-teal-500' },
  { key: 'reliability', label: 'Reliability', short: 'R', color: 'bg-purple-500' },
  { key: 'sustainability', label: 'Sustainability', short: 'S', color: 'bg-emerald-500' },
] as const;

export const VendorRanking: React.FC<VendorRankingProps> = ({
  rankedVendors,
  selectedVendorId,
  onSelectVendor,
}) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Award className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Deterministic Vendor Ranking
            </h2>
            <p className="text-xs text-slate-500">
              Ranked descending by weighted composite score • Click a vendor to inspect in charts
            </p>
          </div>
        </div>

        <div className="text-xs text-slate-500 font-medium hidden sm:block">
          Formula: <span className="font-mono text-slate-700">∑ (Score × Weight)</span>
        </div>
      </div>

      {/* Rankings Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50/75 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
            <tr>
              <th className="py-3 px-4 w-16 text-center">Rank</th>
              <th className="py-3 px-4">Vendor & Status</th>
              <th className="py-3 px-4 text-center">Composite Score</th>
              <th className="py-3 px-4 text-center hidden xl:table-cell">
                Contribution Breakdown
              </th>
              <th className="py-3 px-4 text-right">Lead Gap</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rankedVendors.map((vendor) => {
              const isSelected = selectedVendorId === vendor.id;

              return (
                <tr
                  key={vendor.id}
                  onClick={() => onSelectVendor(vendor.id)}
                  className={`cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-brand-50/70 border-l-4 border-brand-600'
                      : vendor.isRecommended
                      ? 'bg-emerald-50/30 hover:bg-emerald-50/50'
                      : 'hover:bg-slate-50/60'
                  }`}
                >
                  {/* Rank Badge */}
                  <td className="py-3.5 px-4 text-center">
                    <span
                      className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-black shadow-2xs ${
                        vendor.rank === 1
                          ? 'bg-amber-400 text-amber-950 ring-2 ring-amber-300/60'
                          : vendor.rank === 2
                          ? 'bg-slate-200 text-slate-800'
                          : vendor.rank === 3
                          ? 'bg-amber-700/20 text-amber-900'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      #{vendor.rank}
                    </span>
                  </td>

                  {/* Vendor Name & Status */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-900 text-sm">
                        {vendor.name}
                      </span>
                      {vendor.isRecommended && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300/60 shadow-2xs">
                          <Award className="w-3 h-3 mr-1 text-emerald-700" />
                          Recommended Vendor
                        </span>
                      )}
                      {vendor.isAlternative && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-sky-100 text-sky-800 border border-sky-300/60">
                          Primary Alternative
                        </span>
                      )}
                    </div>
                    {/* Individual scores preview */}
                    <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-slate-500">
                      <span>
                        Cost: <strong className="text-slate-700">{vendor.criteria.cost}</strong>
                      </span>
                      <span>•</span>
                      <span>
                        Quality: <strong className="text-slate-700">{vendor.criteria.quality}</strong>
                      </span>
                      <span>•</span>
                      <span>
                        Delivery: <strong className="text-slate-700">{vendor.criteria.delivery}</strong>
                      </span>
                      <span>•</span>
                      <span>
                        Reliability: <strong className="text-slate-700">{vendor.criteria.reliability}</strong>
                      </span>
                      <span>•</span>
                      <span>
                        ESG: <strong className="text-slate-700">{vendor.criteria.sustainability}</strong>
                      </span>
                    </div>
                  </td>

                  {/* Overall Score with Progress Bar */}
                  <td className="py-3.5 px-4 text-center">
                    <div className="inline-flex flex-col items-center">
                      <span className="text-base font-extrabold text-slate-900 font-mono">
                        {vendor.overallScore.toFixed(2)}
                      </span>
                      <div className="w-24 bg-slate-200 h-1.5 rounded-full mt-1 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            vendor.rank === 1
                              ? 'bg-emerald-500'
                              : vendor.rank === 2
                              ? 'bg-brand-500'
                              : 'bg-slate-400'
                          }`}
                          style={{ width: `${vendor.overallScore}%` }}
                        />
                      </div>
                    </div>
                  </td>

                  {/* Criteria Contribution Mini Bar */}
                  <td className="py-3.5 px-4 hidden xl:table-cell min-w-[180px]">
                    {/* Segment widths are proportional shares (flex-grow), so they always fill the bar exactly. */}
                    <div className="flex items-center gap-0.5 h-3 rounded-full overflow-hidden bg-slate-100 p-0.5">
                      {CONTRIBUTION_SEGMENTS.map(({ key, label, color }) => (
                        <div
                          key={key}
                          title={`${label} contribution: ${vendor.contributions[key]} pts`}
                          className={`h-full rounded-xs ${color}`}
                          style={{ flexGrow: vendor.contributions[key], flexBasis: 0, minWidth: 2 }}
                        />
                      ))}
                    </div>
                    <div className="grid grid-cols-5 gap-1 mt-1 text-center text-[10px] leading-tight">
                      {CONTRIBUTION_SEGMENTS.map(({ key, short }) => (
                        <div key={key}>
                          <div className="text-slate-400">{short}</div>
                          <div className="font-mono text-slate-600">
                            {vendor.contributions[key].toFixed(1)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </td>

                  {/* Lead Gap */}
                  <td className="py-3.5 px-4 text-right">
                    {vendor.rank === 1 ? (
                      <span className="inline-flex items-center text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        Rank #1 Leader
                      </span>
                    ) : (
                      <span className="text-xs font-semibold text-slate-500 font-mono">
                        -{vendor.scoreGapToLeader.toFixed(2)} pts
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
