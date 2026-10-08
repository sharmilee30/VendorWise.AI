import React from 'react';
import {
  SlidersHorizontal,
  AlertTriangle,
  CheckCircle2,
  Wand2,
} from 'lucide-react';
import { CriteriaWeights as WeightsType } from '../types';
import {
  CRITERIA_METADATA,
  PRESET_SCENARIOS,
  DEFAULT_WEIGHTS,
} from '../services/scoringEngine';

interface CriteriaWeightsProps {
  weights: WeightsType;
  onChangeWeight: (criterion: keyof WeightsType, value: number) => void;
  onApplyPreset: (presetWeights: WeightsType, presetName: string) => void;
  onNormalizeWeights: () => void;
  totalWeight: number;
  isValid: boolean;
  disabled?: boolean;
}

export const CriteriaWeights: React.FC<CriteriaWeightsProps> = ({
  weights,
  onChangeWeight,
  onApplyPreset,
  onNormalizeWeights,
  totalWeight,
  isValid,
  disabled = false,
}) => {
  const criteriaKeys = Object.keys(DEFAULT_WEIGHTS) as (keyof WeightsType)[];
  const delta = Number((100 - totalWeight).toFixed(1));

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-5">
      {/* Title & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-100 gap-2">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center">
            <SlidersHorizontal className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Evaluation Criteria & Weights
            </h2>
            <p className="text-xs text-slate-500">
              Deterministic weighting model • Must sum to exactly 100%
            </p>
          </div>
        </div>

        {/* Total Weight Counter Pill */}
        <div className="flex items-center space-x-2">
          <div
            className={`inline-flex items-center space-x-2 px-3 py-1.5 rounded-lg border text-sm font-semibold transition-all ${
              isValid
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200 shadow-xs'
                : 'bg-rose-50 text-rose-800 border-rose-200 animate-pulse'
            }`}
          >
            {isValid ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600" />
            )}
            <span>Total Weight:</span>
            <span className="font-extrabold text-base">{totalWeight}%</span>
            <span className="text-xs font-normal opacity-80">/ 100%</span>
          </div>

          {!isValid && (
            <button
              onClick={onNormalizeWeights}
              title="Automatically rebalance all sliders to sum to exactly 100%"
              className="inline-flex items-center space-x-1 px-2.5 py-1.5 text-xs font-semibold text-brand-700 bg-brand-50 hover:bg-brand-100 rounded-lg border border-brand-200 transition-colors"
            >
              <Wand2 className="w-3.5 h-3.5" />
              <span>Auto-Normalize</span>
            </button>
          )}
        </div>
      </div>

      {/* Validation Warning Alert */}
      {!isValid && (
        <div className="mt-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start space-x-2.5">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-bold">Invalid Weight Distribution: </span>
            {delta > 0 ? (
              <span>
                Total is under by <strong>+{delta}%</strong>. Add {delta}% across criteria to reach 100%.
              </span>
            ) : (
              <span>
                Total exceeds 100% by <strong>{Math.abs(delta)}%</strong>. Reduce weights by {Math.abs(delta)}%.
              </span>
            )}
            <span className="block mt-0.5 text-rose-700/90 font-medium">
              Scoring analysis is locked until total equals exactly 100%. Click "Auto-Normalize" to resolve instantly.
            </span>
          </div>
        </div>
      )}

      {/* Preset Scenarios Quick Selector */}
      <div className="mt-4 pt-1">
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
          Strategic Scenario Presets:
        </label>
        <div className="flex flex-wrap gap-1.5">
          {PRESET_SCENARIOS.map((preset) => {
            const isMatch =
              weights.cost === preset.weights.cost &&
              weights.quality === preset.weights.quality &&
              weights.delivery === preset.weights.delivery &&
              weights.reliability === preset.weights.reliability &&
              weights.sustainability === preset.weights.sustainability;

            return (
              <button
                key={preset.name}
                type="button"
                onClick={() => onApplyPreset(preset.weights, preset.name)}
                title={preset.description}
                className={`text-xs px-2.5 py-1 rounded-md font-medium transition-colors border ${
                  isMatch
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {preset.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Sliders Grid */}
      <div className="mt-5 space-y-4">
        {criteriaKeys.map((criterion) => {
          const meta = CRITERIA_METADATA[criterion];
          const val = weights[criterion] ?? 0;

          return (
            <div
              key={criterion}
              className="p-3 rounded-lg border border-slate-100 hover:border-slate-200 transition-colors bg-slate-50/40"
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center space-x-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: meta.color }}
                  />
                  <label
                    htmlFor={`weight-${criterion}`}
                    className="text-sm font-bold text-slate-800"
                  >
                    {meta.label}
                  </label>
                  <span className="text-xs text-slate-500 hidden md:inline">
                    — {meta.description}
                  </span>
                </div>

                {/* Direct Number Input */}
                <div className="flex items-center space-x-1">
                  <input
                    id={`weight-${criterion}`}
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    disabled={disabled}
                    value={val}
                    onChange={(e) => {
                      const num = parseFloat(e.target.value);
                      onChangeWeight(criterion, isNaN(num) ? 0 : Math.max(0, Math.min(100, num)));
                    }}
                    className="w-16 px-2 py-1 text-right text-sm font-bold border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                  />
                  <span className="text-xs font-semibold text-slate-500">%</span>
                </div>
              </div>

              {/* Slider Track & Fill */}
              <div className="flex items-center space-x-3">
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  disabled={disabled}
                  value={val}
                  onChange={(e) =>
                    onChangeWeight(criterion, parseInt(e.target.value, 10))
                  }
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer focus:outline-none"
                  style={{
                    accentColor: meta.color,
                  }}
                />
              </div>

              {/* Progress bar visual indicator */}
              <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1">
                <span>0%</span>
                <span className="font-semibold text-slate-600">
                  Weight: {val}% ({Number((val / 100).toFixed(2))} coefficient)
                </span>
                <span>100%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
