import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Sidebar, PageId } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardPage } from './pages/DashboardPage';
import { VendorEvaluationPage } from './pages/VendorEvaluationPage';
import { AnalysisScenariosPage } from './pages/AnalysisScenariosPage';
import { AiRecommendationPage } from './pages/AiRecommendationPage';
import { ExportModal } from './components/ExportModal';

import {
  Vendor,
  CriteriaWeights,
  VendorScoreResult,
  ScenarioDiff,
  ScenarioSnapshot,
  AiRecommendationResponse,
} from './types';
import {
  DEFAULT_VENDORS,
  DEFAULT_WEIGHTS,
  validateInputs,
  calculateVendorScores,
  computeScenarioDiff,
  generateDeterministicRecommendation,
} from './services/scoringEngine';
import { createLogger } from './utils/logger';
import {
  loadJson,
  saveJson,
  isWeights,
  isVendorList,
  isSnapshotList,
  isOneOf,
} from './utils/storage';

const log = createLogger('app');
const PAGE_IDS = ['dashboard', 'evaluation', 'analysis', 'ai'] as const;

export const App: React.FC = () => {
  // Navigation & layout state
  // The page id is stored as a plain string (not JSON) for compatibility with earlier versions.
  const [activePage, setActivePage] = useState<PageId>(() => {
    try {
      const saved = localStorage.getItem('vendorwise_active_page');
      if (isOneOf(PAGE_IDS)(saved)) return saved;
      if (saved !== null) log.warn('Ignoring unknown saved page', { saved: saved.slice(0, 50) });
    } catch {
      // storage unavailable; start on the dashboard
    }
    return 'dashboard';
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // 1. Core State (Single Source of Truth)
  const [vendors, setVendors] = useState<Vendor[]>(() =>
    loadJson<Vendor[]>('vendorwise_vendors', DEFAULT_VENDORS, isVendorList)
  );

  const [weights, setWeights] = useState<CriteriaWeights>(() =>
    loadJson<CriteriaWeights>('vendorwise_weights', DEFAULT_WEIGHTS, isWeights)
  );

  // Track previous run state for scenario shift detection
  const [previousWinner, setPreviousWinner] = useState<string | null>(null);
  const [previousScore, setPreviousScore] = useState<number | null>(null);
  const [previousWeights, setPreviousWeights] = useState<CriteriaWeights | null>(null);
  const [scenarioDiff, setScenarioDiff] = useState<ScenarioDiff | null>(null);
  const [snapshots, setSnapshots] = useState<ScenarioSnapshot[]>(() =>
    loadJson<ScenarioSnapshot[]>('vendorwise_snapshots', [], isSnapshotList)
  );

  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null);

  // AI & Modals state
  const [aiRecommendation, setAiRecommendation] =
    useState<AiRecommendationResponse | null>(null);
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  // Fingerprint of the vendors+weights the current briefing was generated from.
  const [aiInputsKey, setAiInputsKey] = useState<string | null>(null);
  const [hasServerKey, setHasServerKey] = useState<boolean>(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // The API key lives only on the server (.env). Remove any key an older version of
  // this app saved in the browser.
  useEffect(() => {
    try {
      localStorage.removeItem('vendorwise_gemini_key');
    } catch {
      // storage unavailable; nothing to clear
    }
  }, []);

  // Check backend server status
  useEffect(() => {
    fetch('/api/config')
      .then((res) => res.json())
      .then((data) => {
        if (data && typeof data.hasServerApiKey === 'boolean') {
          setHasServerKey(data.hasServerApiKey);
        }
      })
      .catch((err) => {
        log.warn('Could not reach /api/config; is the backend running on port 5001?', err);
      });
  }, []);

  // Persist state to local storage
  // Every page change starts at the top, e.g. after "Calculate" at the bottom of the
  // Evaluation page the user should land on the top of the results, not mid-page.
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [activePage]);

  useEffect(() => {
    try {
      localStorage.setItem('vendorwise_active_page', activePage);
    } catch (err) {
      log.warn('Could not save active page', err);
    }
  }, [activePage]);

  useEffect(() => {
    saveJson('vendorwise_vendors', vendors);
  }, [vendors]);

  useEffect(() => {
    saveJson('vendorwise_weights', weights);
  }, [weights]);

  useEffect(() => {
    saveJson('vendorwise_snapshots', snapshots);
  }, [snapshots]);

  // 2. Deterministic Scoring Logic
  const validation = useMemo(() => {
    return validateInputs(vendors, weights);
  }, [vendors, weights]);

  const rankedVendors: VendorScoreResult[] = useMemo(() => {
    if (!validation.isValid) {
      return [];
    }
    return calculateVendorScores(vendors, weights);
  }, [vendors, weights, validation.isValid]);

  // Set default selected vendor
  useEffect(() => {
    if (
      rankedVendors.length > 0 &&
      (!selectedVendorId || !vendors.some((v) => v.id === selectedVendorId))
    ) {
      setSelectedVendorId(rankedVendors[0].id);
    }
  }, [rankedVendors, selectedVendorId, vendors]);

  // 3. Scenario Diff Calculation
  useEffect(() => {
    if (rankedVendors.length > 0) {
      const currentWinner = rankedVendors[0];
      if (previousWinner && previousScore !== null && previousWeights !== null) {
        const diff = computeScenarioDiff(
          previousWeights,
          weights,
          previousWinner,
          previousScore,
          currentWinner.name,
          currentWinner.overallScore
        );
        setScenarioDiff(diff);
      } else {
        // Initialize baseline
        setPreviousWinner(currentWinner.name);
        setPreviousScore(currentWinner.overallScore);
        setPreviousWeights({ ...weights });
      }
    }
  }, [weights]);

  // What the AI is asked to explain, and a fingerprint of it. The fingerprint is used both
  // for the reload cache and to detect when a briefing no longer matches the live numbers.
  // scenarioDiff is in-memory only (lost on reload), so it is not part of the fingerprint.
  const aiRequestBase = useMemo(
    () => ({
      companyContext: 'Nova Manufacturing Ltd.',
      rfqId: 'RFQ-2026-MFG-048',
      criteriaWeights: weights,
      rankedVendors: rankedVendors.map((v) => ({
        rank: v.rank,
        name: v.name,
        overallScore: v.overallScore,
        criteria: v.criteria,
        isRecommended: v.isRecommended,
      })),
    }),
    [rankedVendors, weights]
  );
  const currentInputsKey = useMemo(() => JSON.stringify(aiRequestBase), [aiRequestBase]);
  const isAiStale =
    aiRecommendation !== null && validation.isValid && aiInputsKey !== currentInputsKey;

  // 4. AI Recommendation Fetcher
  const fetchRecommendation = useCallback(
    async (overrideDiff?: ScenarioDiff | null, force = false) => {
      if (rankedVendors.length === 0) return;

      const diffToUse = overrideDiff !== undefined ? overrideDiff : scenarioDiff;

      const payload = { ...aiRequestBase, scenarioDiff: diffToUse };

      // Reuse a previous AI result for identical inputs (survives page reloads)
      // so a refresh doesn't spend Gemini quota. Re-analyze passes force=true.
      const cacheKey = 'vendorwise_ai_cache';
      const inputsKey = currentInputsKey;
      if (!force) {
        const cached = loadJson<{ inputsKey?: string; response?: AiRecommendationResponse } | null>(
          cacheKey,
          null
        );
        if (cached && cached.inputsKey === inputsKey && cached.response?.isAiGenerated) {
          log.debug('AI briefing served from cache (inputs unchanged); no request sent');
          setAiRecommendation(cached.response);
          setAiInputsKey(inputsKey);
          return;
        }
      }

      setIsAiLoading(true);
      const startedAt = performance.now();
      log.debug('Requesting AI briefing', { force, vendors: payload.rankedVendors.length });
      let requestId: string | null = null;
      try {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        const res = await fetch('/api/ai/recommendation', {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
        });

        // Matches the `requestId` field in the server's log lines.
        requestId = res.headers.get('X-Request-Id');

        if (!res.ok) {
          throw new Error(`Server returned ${res.status}`);
        }

        const data: AiRecommendationResponse = await res.json();
        log.debug('AI briefing received', {
          requestId,
          ms: Math.round(performance.now() - startedAt),
          isAiGenerated: data.isAiGenerated,
          model: data.modelName,
          serverNote: data.error,
        });
        setAiRecommendation(data);
        setAiInputsKey(inputsKey);
        if (data.isAiGenerated) saveJson(cacheKey, { inputsKey, response: data });
      } catch (err) {
        log.warn('AI request failed; showing rule-based fallback', {
          requestId,
          ms: Math.round(performance.now() - startedAt),
          err,
        });
        const fallback = generateDeterministicRecommendation(
          rankedVendors,
          weights,
          diffToUse
        );
        setAiRecommendation({
          ...fallback,
          isAiGenerated: false,
          error:
            'AI explanation is temporarily unavailable. The vendor ranking is still available based on the configured scoring model.',
        });
        setAiInputsKey(inputsKey);
      } finally {
        setIsAiLoading(false);
      }
    },
    [rankedVendors, weights, scenarioDiff, aiRequestBase, currentInputsKey]
  );

  // Automatically trigger recommendation analysis once on load. The ref guards
  // against re-fires while the request is in flight (fetchRecommendation changes
  // identity on every dependency update) and against StrictMode's double effect.
  const hasAutoFetched = useRef(false);
  useEffect(() => {
    if (rankedVendors.length > 0 && !hasAutoFetched.current) {
      hasAutoFetched.current = true;
      fetchRecommendation();
    }
  }, [rankedVendors.length, fetchRecommendation]);

  // The exported memo must agree with the numbers in its own tables, so a briefing that no
  // longer matches the live inputs is replaced by the rule-based summary for the current ones.
  const exportRecommendation = useMemo<AiRecommendationResponse | null>(() => {
    if (!aiRecommendation || !isAiStale || rankedVendors.length === 0) return aiRecommendation;
    return {
      ...generateDeterministicRecommendation(rankedVendors, weights, scenarioDiff),
      isAiGenerated: false,
    };
  }, [aiRecommendation, isAiStale, rankedVendors, weights, scenarioDiff]);

  // 5. User Actions
  const handleWeightChange = (criterion: keyof CriteriaWeights, value: number) => {
    setWeights((prev) => {
      if (rankedVendors[0]) {
        setPreviousWinner(rankedVendors[0].name);
        setPreviousScore(rankedVendors[0].overallScore);
        setPreviousWeights({ ...prev });
      }
      return {
        ...prev,
        [criterion]: value,
      };
    });
  };

  const handleApplyPreset = (presetWeights: CriteriaWeights, _presetName: string) => {
    if (rankedVendors[0]) {
      setPreviousWinner(rankedVendors[0].name);
      setPreviousScore(rankedVendors[0].overallScore);
      setPreviousWeights({ ...weights });
    }
    setWeights(presetWeights);
  };

  const handleNormalizeWeights = () => {
    const total =
      weights.cost +
      weights.quality +
      weights.delivery +
      weights.reliability +
      weights.sustainability;

    if (total <= 0) {
      setWeights(DEFAULT_WEIGHTS);
      return;
    }

    const keys = Object.keys(weights) as (keyof CriteriaWeights)[];
    const normalized: CriteriaWeights = { ...weights };
    let runningSum = 0;

    keys.forEach((k, idx) => {
      if (idx === keys.length - 1) {
        normalized[k] = Math.max(0, 100 - runningSum);
      } else {
        const scaled = Math.round((weights[k] / total) * 100);
        normalized[k] = scaled;
        runningSum += scaled;
      }
    });

    if (rankedVendors[0]) {
      setPreviousWinner(rankedVendors[0].name);
      setPreviousScore(rankedVendors[0].overallScore);
      setPreviousWeights({ ...weights });
    }
    setWeights(normalized);
  };

  const handleAddVendor = (newVendorData: Omit<Vendor, 'id'>) => {
    const newVendor: Vendor = {
      ...newVendorData,
      id: `vendor-${Date.now()}`,
    };
    setVendors((prev) => [...prev, newVendor]);
  };

  const handleUpdateVendor = (updatedVendor: Vendor) => {
    setVendors((prev) =>
      prev.map((v) => (v.id === updatedVendor.id ? updatedVendor : v))
    );
  };

  const handleDeleteVendor = (vendorId: string) => {
    setVendors((prev) => prev.filter((v) => v.id !== vendorId));
  };

  const handleResetDefaults = () => {
    if (
      confirm(
        'Reset all vendor profiles and criteria weights back to Nova Manufacturing default specifications?'
      )
    ) {
      setVendors(DEFAULT_VENDORS);
      setWeights(DEFAULT_WEIGHTS);
      setPreviousWinner(null);
      setPreviousScore(null);
      setPreviousWeights(null);
      setScenarioDiff(null);
      setAiRecommendation(null);
      setAiInputsKey(null);
    }
  };

  const handleSaveSnapshot = (name: string) => {
    if (rankedVendors.length === 0) return;
    const snap: ScenarioSnapshot = {
      id: `snap-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      name,
      weights: { ...weights },
      recommendedVendorName: rankedVendors[0].name,
      recommendedScore: rankedVendors[0].overallScore,
      secondVendorName: rankedVendors[1]?.name,
      secondScore: rankedVendors[1]?.overallScore,
    };
    setSnapshots((prev) => [...prev, snap]);
  };

  const handleDeleteSnapshot = (id: string) => {
    setSnapshots((prev) => prev.filter((s) => s.id !== id));
  };

  const handleRestoreSnapshot = (snap: ScenarioSnapshot) => {
    if (rankedVendors[0]) {
      setPreviousWinner(rankedVendors[0].name);
      setPreviousScore(rankedVendors[0].overallScore);
      setPreviousWeights({ ...weights });
    }
    setWeights(snap.weights);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* 1. Persistent Left Navigation Sidebar (240px) */}
      <Sidebar
        activePage={activePage}
        onSelectPage={setActivePage}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
        totalWeight={validation.totalWeight}
        isWeightValid={validation.isValid}
        vendorCount={vendors.length}
      />

      {/* 2. Main Content Canvas (Offset by sidebar width on desktop) */}
      <div className="flex-1 md:pl-64 flex flex-col min-h-screen w-full">
        {/* Top Header */}
        <Header
          activePage={activePage}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          onResetDefaults={handleResetDefaults}
          onOpenExportModal={() => setIsExportModalOpen(true)}
          isAiConfigured={hasServerKey}
          isExportDisabled={!validation.isValid}
        />

        {/* Page Container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {activePage === 'dashboard' && (
            <DashboardPage
              rankedVendors={rankedVendors}
              weights={weights}
              isValid={validation.isValid}
              totalWeight={validation.totalWeight}
              vendorCount={vendors.length}
              recommendation={aiRecommendation}
              onNavigate={setActivePage}
            />
          )}

          {activePage === 'evaluation' && (
            <VendorEvaluationPage
              vendors={vendors}
              weights={weights}
              validation={validation}
              onWeightChange={handleWeightChange}
              onApplyPreset={handleApplyPreset}
              onNormalizeWeights={handleNormalizeWeights}
              onAddVendor={handleAddVendor}
              onUpdateVendor={handleUpdateVendor}
              onDeleteVendor={handleDeleteVendor}
              leader={
                rankedVendors[0]
                  ? { name: rankedVendors[0].name, score: rankedVendors[0].overallScore }
                  : undefined
              }
              onCalculate={() => setActivePage('analysis')}
              onResetSampleVendors={() => {
                if (confirm('Replace all current vendors (including your edits and additions) with the 5 sample vendors?')) {
                  setVendors(DEFAULT_VENDORS);
                }
              }}
            />
          )}

          {activePage === 'analysis' && (
            <AnalysisScenariosPage
              rankedVendors={rankedVendors}
              weights={weights}
              selectedVendorId={selectedVendorId}
              onSelectVendor={setSelectedVendorId}
              scenarioDiff={scenarioDiff}
              snapshots={snapshots}
              onSaveSnapshot={handleSaveSnapshot}
              onRestoreSnapshot={handleRestoreSnapshot}
              onDeleteSnapshot={handleDeleteSnapshot}
              isValid={validation.isValid}
              totalWeight={validation.totalWeight}
              onNavigate={setActivePage}
            />
          )}

          {activePage === 'ai' && (
            <AiRecommendationPage
              recommendation={aiRecommendation}
              isLoading={isAiLoading}
              onRefresh={() => fetchRecommendation(undefined, true)}
              isAiConfigured={hasServerKey}
              isStale={isAiStale}
              isValid={validation.isValid}
              totalWeight={validation.totalWeight}
              onNavigate={setActivePage}
              rankedVendors={rankedVendors}
              weights={weights}
            />
          )}
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-slate-200 py-4 px-4 sm:px-6 lg:px-8 text-xs text-slate-500">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
            <div>
              <span className="font-semibold text-slate-700">VendorWise AI</span>{' '}
              • Nova Manufacturing Ltd. Sourcing Platform
            </div>
            <div className="text-[11px] text-slate-400 font-mono">
              Deterministic Scoring Engine v1.0.4 • RFQ-2026-MFG-048
            </div>
          </div>
        </footer>
      </div>

      {/* Modals */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        rankedVendors={rankedVendors}
        weights={weights}
        recommendation={exportRecommendation}
        isBriefingRefreshed={isAiStale}
      />
    </div>
  );
};
