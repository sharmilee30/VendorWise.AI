import React from 'react';
import { VendorRanking } from '../components/VendorRanking';
import { ScenarioTracker } from '../components/ScenarioTracker';
import { VisualAnalytics } from '../components/VisualAnalytics';
import { WeightsInvalidNotice } from '../components/WeightsInvalidNotice';
import { PageId } from '../components/Sidebar';
import {
  VendorScoreResult,
  CriteriaWeights,
  ScenarioDiff,
  ScenarioSnapshot,
} from '../types';

interface AnalysisScenariosPageProps {
  rankedVendors: VendorScoreResult[];
  weights: CriteriaWeights;
  selectedVendorId: string | null;
  onSelectVendor: (id: string) => void;
  scenarioDiff: ScenarioDiff | null;
  snapshots: ScenarioSnapshot[];
  onSaveSnapshot: (name: string) => void;
  onRestoreSnapshot: (snapshot: ScenarioSnapshot) => void;
  onDeleteSnapshot: (id: string) => void;
  isValid: boolean;
  totalWeight: number;
  onNavigate: (page: PageId) => void;
}

export const AnalysisScenariosPage: React.FC<AnalysisScenariosPageProps> = ({
  rankedVendors,
  weights,
  selectedVendorId,
  onSelectVendor,
  scenarioDiff,
  snapshots,
  onSaveSnapshot,
  onRestoreSnapshot,
  onDeleteSnapshot,
  isValid,
  totalWeight,
  onNavigate,
}) => {
  return (
    <div className="space-y-6">
      {!isValid && (
        <WeightsInvalidNotice
          totalWeight={totalWeight}
          subject="The ranking and charts are"
          onFix={() => onNavigate('evaluation')}
        />
      )}

      {/* 1. Scenario Shift Tracker & Sensitivity Presets */}
      <ScenarioTracker
        scenarioDiff={scenarioDiff}
        snapshots={snapshots}
        onSaveSnapshot={onSaveSnapshot}
        onRestoreSnapshot={onRestoreSnapshot}
        onDeleteSnapshot={onDeleteSnapshot}
        onGoToEvaluation={() => onNavigate('evaluation')}
        canSave={isValid && rankedVendors.length > 0}
        currentWinner={rankedVendors[0]}
        currentWeights={weights}
      />

      {/* 2. Deterministic Vendor Ranking Table */}
      {isValid && rankedVendors.length > 0 && (
        <VendorRanking
          rankedVendors={rankedVendors}
          weights={weights}
          selectedVendorId={selectedVendorId}
          onSelectVendor={onSelectVendor}
        />
      )}

      {/* 3. Visual Comparative Analytics (Bar, Radar, Stacked) */}
      {isValid && rankedVendors.length > 0 && (
        <VisualAnalytics
          rankedVendors={rankedVendors}
          weights={weights}
          selectedVendorId={selectedVendorId}
          onSelectVendor={onSelectVendor}
        />
      )}
    </div>
  );
};
