import React, { useState } from 'react';
import {
  GitCompare,
  Clock,
  Bookmark,
  Check,
  Sparkles,
  X,
  Info,
} from 'lucide-react';
import {
  ScenarioDiff,
  ScenarioSnapshot,
  CriteriaWeights,
  VendorScoreResult,
} from '../types';

interface ScenarioTrackerProps {
  scenarioDiff: ScenarioDiff | null;
  snapshots: ScenarioSnapshot[];
  onSaveSnapshot: (name: string) => void;
  onRestoreSnapshot: (snapshot: ScenarioSnapshot) => void;
  onDeleteSnapshot: (id: string) => void;
  /** Opens the Vendor Evaluation page, where the weights are set. */
  onGoToEvaluation: () => void;
  /** False while the weights don't total 100%: there is no valid configuration to save. */
  canSave: boolean;
  currentWinner: VendorScoreResult | undefined;
  currentWeights: CriteriaWeights;
}

export const ScenarioTracker: React.FC<ScenarioTrackerProps> = ({
  scenarioDiff,
  snapshots,
  onSaveSnapshot,
  onRestoreSnapshot,
  onDeleteSnapshot,
  onGoToEvaluation,
  canSave,
  currentWeights,
}) => {
  const [snapshotName, setSnapshotName] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave || !snapshotName.trim()) return;
    onSaveSnapshot(snapshotName.trim());
    setSnapshotName('');
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-5">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center">
            <GitCompare className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Scenario Analysis & Sensitivity Tracker
            </h2>
            <p className="text-xs text-slate-500">
              Detect shifts when rebalancing weights across business priorities
            </p>
          </div>
        </div>
      </div>

      {/* Real-time Scenario Shift Alert Banner */}
      {scenarioDiff ? (
        <div className="mt-4">
          {scenarioDiff.changed ? (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200/90 text-amber-950">
              <div className="flex items-center space-x-2 font-bold text-sm text-amber-900 mb-1">
                <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Recommendation Shift Detected!</span>
              </div>
              <p className="text-sm font-medium mt-1">
                Recommendation changed from{' '}
                <strong className="text-slate-900 underline decoration-amber-400">
                  {scenarioDiff.previousWinner}
                </strong>{' '}
                ({scenarioDiff.previousScore.toFixed(2)}) to{' '}
                <strong className="text-slate-900 underline decoration-emerald-500">
                  {scenarioDiff.newWinner}
                </strong>{' '}
                ({scenarioDiff.newScore.toFixed(2)}) because{' '}
                <span className="font-semibold text-amber-900">
                  {scenarioDiff.primaryCause}
                </span>
                .
              </p>

              {/* Weight Deltas Pill List */}
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                {scenarioDiff.weightDeltas
                  .filter((d) => d.diff !== 0)
                  .map((d) => (
                    <span
                      key={d.criterion}
                      className={`px-2.5 py-1 rounded-md font-semibold border ${
                        d.diff > 0
                          ? 'bg-emerald-100/80 text-emerald-800 border-emerald-200'
                          : 'bg-rose-100/80 text-rose-800 border-rose-200'
                      }`}
                    >
                      {d.label}: {d.oldVal}% → {d.newVal}% ({d.diff > 0 ? `+${d.diff}` : d.diff}%)
                    </span>
                  ))}
              </div>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  <strong>Stable Recommendation:</strong> {scenarioDiff.newWinner} remains Rank #1 ({scenarioDiff.newScore.toFixed(2)} pts).
                </span>
              </div>
              <span className="text-slate-500 italic hidden sm:inline">
                {scenarioDiff.primaryCause}
              </span>
            </div>
          )}
        </div>
      ) : (
        <div className="mt-4 p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-xs flex items-center space-x-2">
          <Clock className="w-4 h-4 text-slate-400 shrink-0" />
          <span>
            Adjust criteria weights or select a preset to benchmark real-time scenario sensitivity shifts.
          </span>
        </div>
      )}

      {/* How saving works: a scenario is a snapshot of the CURRENT weights, not something typed in */}
      <div className="mt-4 rounded-xl bg-brand-50/60 border border-brand-100 p-3.5 flex gap-3">
        <Info className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-700 min-w-0 space-y-2">
          <p className="font-semibold text-slate-900">How to save a scenario</p>
          <ol className="list-decimal pl-4 space-y-0.5 leading-relaxed">
            <li>
              First set your weights: adjust the sliders or pick a Strategic Scenario Preset on the{' '}
              <button
                type="button"
                onClick={onGoToEvaluation}
                className="font-semibold text-brand-700 underline hover:text-brand-900"
              >
                Vendor Evaluation page
              </button>
              .
            </li>
            <li>Then enter a scenario name below.</li>
            <li>
              Click <strong>Save Scenario</strong>. It saves the weights that are active right now.
            </li>
          </ol>
          <p className="text-slate-500">
            Typing a name alone does not change any weights.
          </p>
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
            <span className="font-semibold text-slate-600">Weights that will be saved:</span>
            {(
              [
                ['Cost', currentWeights.cost],
                ['Quality', currentWeights.quality],
                ['Delivery', currentWeights.delivery],
                ['Reliability', currentWeights.reliability],
                ['ESG', currentWeights.sustainability],
              ] as const
            ).map(([label, value]) => (
              <span
                key={label}
                className="px-2 py-0.5 rounded-md bg-white border border-brand-100 text-slate-600 whitespace-nowrap"
              >
                {label} <span className="font-semibold text-slate-800">{value}%</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Save Scenario & Snapshot History */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        {/* Save Form */}
        <div className="flex-1 max-w-md">
          <form onSubmit={handleSave} className="flex items-center space-x-2">
            <input
              type="text"
              aria-label="Scenario name"
              placeholder="Scenario name, e.g. Q4 Capex Squeeze"
              value={snapshotName}
              onChange={(e) => setSnapshotName(e.target.value)}
              className="flex-1 px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
            <button
              type="submit"
              disabled={!canSave}
              title={canSave ? undefined : 'Fix the weights (they must total 100%) before saving a scenario'}
              className="inline-flex items-center space-x-1 px-3 py-1.5 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-900 rounded-lg shadow-2xs transition-colors shrink-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-slate-800"
            >
              {isSaved ? <Check className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
              <span>{isSaved ? 'Saved' : 'Save Scenario'}</span>
            </button>
          </form>
          {canSave ? (
            <p className="mt-1.5 text-[11px] text-slate-500">
              Scenario names label your current weight configuration.
            </p>
          ) : (
            <p className="mt-1.5 text-[11px] font-medium text-rose-700">
              Saving is unavailable: the weights must total 100%. Fix them on the Vendor Evaluation page.
            </p>
          )}
        </div>

        {/* Saved Snapshots list */}
        {snapshots.length > 0 && (
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1">
            <span className="text-xs font-semibold text-slate-400 uppercase mr-1">
              History:
            </span>
            {snapshots.map((snap) => (
              <span
                key={snap.id}
                className="inline-flex items-center rounded-md bg-slate-100 border border-slate-200 shrink-0"
              >
                <button
                  onClick={() => onRestoreSnapshot(snap)}
                  className="inline-flex items-center space-x-1 pl-2.5 pr-1.5 py-1 text-xs font-medium rounded-l-md hover:bg-slate-200 text-slate-700 transition-colors"
                  title={`Restore these weights: ${snap.name} (Winner: ${snap.recommendedVendorName})`}
                >
                  <span>{snap.name}</span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    ({snap.recommendedScore})
                  </span>
                </button>
                <button
                  onClick={() => onDeleteSnapshot(snap.id)}
                  className="px-1.5 py-1 rounded-r-md text-slate-400 hover:text-rose-600 hover:bg-slate-200 transition-colors"
                  title={`Delete scenario "${snap.name}"`}
                  aria-label={`Delete scenario ${snap.name}`}
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
