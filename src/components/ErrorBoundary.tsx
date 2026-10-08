import React from 'react';
import { createLogger } from '../utils/logger';

const log = createLogger('ui');

interface State {
  error: Error | null;
}

/**
 * Catches render-time crashes so users see a recovery screen instead of a blank page,
 * and logs the component stack to the console for debugging.
 */
export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    log.error('Uncaught UI error', { error, componentStack: info.componentStack });
  }

  // A corrupted localStorage entry is the most likely cause of a crash on every load.
  private resetSavedData = () => {
    try {
      Object.keys(localStorage)
        .filter((k) => k.startsWith('vendorwise_'))
        .forEach((k) => localStorage.removeItem(k));
    } catch {
      // storage unavailable; reload anyway
    }
    window.location.reload();
  };

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div role="alert" className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="max-w-md bg-white border border-slate-200 rounded-xl shadow-xs p-6 text-center">
          <h1 className="text-lg font-bold text-slate-900">Something went wrong</h1>
          <p className="mt-2 text-sm text-slate-600">
            The page hit an unexpected error. Your data is saved in this browser. Try reloading;
            if it keeps failing, reset the saved data.
          </p>
          <p className="mt-3 text-xs font-mono text-slate-500 break-words">
            {this.state.error.message}
          </p>
          <div className="mt-5 flex justify-center gap-3">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-lg"
            >
              Reload
            </button>
            <button
              onClick={this.resetSavedData}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg"
            >
              Reset saved data
            </button>
          </div>
        </div>
      </div>
    );
  }
}
