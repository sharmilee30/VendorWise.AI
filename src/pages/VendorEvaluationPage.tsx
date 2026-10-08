import React from 'react';
import { AlertCircle, ArrowRight, CheckCircle2, Trophy } from 'lucide-react';
import { CriteriaWeights as CriteriaWeightsComponent } from '../components/CriteriaWeights';
import { VendorTable } from '../components/VendorTable';
import {
  Vendor,
  CriteriaWeights,
  ValidationResult,
} from '../types';

interface VendorEvaluationPageProps {
  vendors: Vendor[];
  weights: CriteriaWeights;
  validation: ValidationResult;
  onWeightChange: (criterion: keyof CriteriaWeights, value: number) => void;
  onApplyPreset: (presetWeights: CriteriaWeights, presetName: string) => void;
  onNormalizeWeights: () => void;
  onAddVendor: (vendor: Omit<Vendor, 'id'>) => void;
  onUpdateVendor: (vendor: Vendor) => void;
  onDeleteVendor: (vendorId: string) => void;
  onResetSampleVendors: () => void;
  /** Current leader under the live weights, for the preview in the action bar. */
  leader?: { name: string; score: number };
  onCalculate: () => void;
}

export const VendorEvaluationPage: React.FC<VendorEvaluationPageProps> = ({
  vendors,
  weights,
  validation,
  onWeightChange,
  onApplyPreset,
  onNormalizeWeights,
  onAddVendor,
  onUpdateVendor,
  onDeleteVendor,
  onResetSampleVendors,
  leader,
  onCalculate,
}) => {
  return (
    <div className="space-y-6">
      {/* Global Validation Banner if inputs are invalid */}
      {!validation.isValid && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 shadow-xs">
          <div className="flex items-center space-x-2 font-bold text-sm">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>Evaluation Blocked: Input Validation Required</span>
          </div>
          <ul className="list-disc pl-5 mt-2 space-y-1 text-xs">
            {validation.errors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Two-Column Balanced Layout on desktop or clean stack */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (5 Cols): Criteria Weights & Presets */}
        <div className="lg:col-span-5 space-y-6 min-w-0">
          <CriteriaWeightsComponent
            weights={weights}
            onChangeWeight={onWeightChange}
            onApplyPreset={onApplyPreset}
            onNormalizeWeights={onNormalizeWeights}
            totalWeight={validation.totalWeight}
            isValid={validation.isValid}
          />
        </div>

        {/* Right Column (7 Cols): Vendor Master Matrix */}
        <div className="lg:col-span-7 space-y-6 min-w-0">
          <VendorTable
            vendors={vendors}
            onAddVendor={onAddVendor}
            onUpdateVendor={onUpdateVendor}
            onDeleteVendor={onDeleteVendor}
            onResetSampleVendors={onResetSampleVendors}
          />
        </div>
      </div>

      {/* Action bar: stays visible while scrolling so the next step is always one click away */}
      <div className="sticky bottom-4 z-10">
        <div className="rounded-xl border border-slate-200 bg-white/95 backdrop-blur shadow-lg p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="min-w-0 text-xs sm:text-sm">
            {validation.isValid ? (
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <div className="font-semibold text-slate-900">
                    Weights total 100% · {vendors.length} suppliers ready
                  </div>
                  {leader && (
                    <div className="text-slate-500 flex items-center gap-1 truncate">
                      <Trophy className="w-3 h-3 text-amber-500 shrink-0" />
                      <span className="truncate">
                        Current leader: <strong className="text-slate-700">{leader.name}</strong> (
                        {leader.score.toFixed(2)})
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="font-semibold text-rose-800">
                  Weights total {validation.totalWeight}%. They must total exactly 100% to calculate.
                </div>
              </div>
            )}
          </div>

          <button
            onClick={onCalculate}
            disabled={!validation.isValid}
            title={
              validation.isValid
                ? 'See the full ranking, charts and scenario analysis'
                : 'Fix the weights (or use Auto-Normalize) first'
            }
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-lg shadow-xs transition-colors shrink-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-brand-600"
          >
            Calculate &amp; View Results
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
