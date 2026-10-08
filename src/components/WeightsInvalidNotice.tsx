import React from 'react';
import { AlertTriangle, ArrowRight } from 'lucide-react';

interface WeightsInvalidNoticeProps {
  totalWeight: number;
  onFix: () => void;
  /** What is unavailable on the page showing this notice, e.g. "The vendor ranking". */
  subject?: string;
}

/**
 * Shown on pages whose content depends on a valid scoring model. Scoring is blocked until the
 * criteria weights total exactly 100%, so explain why the page is empty and how to fix it.
 */
export const WeightsInvalidNotice: React.FC<WeightsInvalidNoticeProps> = ({
  totalWeight,
  onFix,
  subject = 'The ranking is',
}) => (
  <div
    role="alert"
    className="rounded-xl border border-rose-200 bg-rose-50 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
  >
    <div className="flex items-start gap-3">
      <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
      <div>
        <h3 className="text-sm font-bold text-rose-900">Scoring is paused</h3>
        <p className="text-xs text-rose-800 mt-0.5">
          {subject} hidden because the criteria weights currently total{' '}
          <strong>{totalWeight}%</strong> instead of 100%. Fix the weights (or use Auto-Normalize)
          on the Vendor Evaluation page.
        </p>
      </div>
    </div>
    <button
      onClick={onFix}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shrink-0 self-start sm:self-center"
    >
      Fix weights
      <ArrowRight className="w-3.5 h-3.5" />
    </button>
  </div>
);
