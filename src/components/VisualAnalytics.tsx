import React, { useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
} from 'chart.js';
import { Bar, Radar } from 'react-chartjs-2';
import { BarChart3 } from 'lucide-react';
import { VendorScoreResult, CriteriaWeights } from '../types';
import { CRITERIA_METADATA } from '../services/scoringEngine';

// Register Chart.js elements
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler
);

interface VisualAnalyticsProps {
  rankedVendors: VendorScoreResult[];
  weights: CriteriaWeights;
  selectedVendorId: string | null;
  onSelectVendor: (id: string) => void;
}

export const VisualAnalytics: React.FC<VisualAnalyticsProps> = ({
  rankedVendors,
  weights,
  selectedVendorId,
  onSelectVendor,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'radar' | 'breakdown'>('overview');

  const selectedVendor =
    rankedVendors.find((v) => v.id === selectedVendorId) || rankedVendors[0];
  const runnerUp = rankedVendors[1];

  // 1. Overall Scores Bar Chart Data
  const barChartData = {
    labels: rankedVendors.map((v) => v.name),
    datasets: [
      {
        label: 'Overall Composite Score',
        data: rankedVendors.map((v) => v.overallScore),
        backgroundColor: rankedVendors.map((v) =>
          v.rank === 1
            ? 'rgba(16, 185, 129, 0.85)' // Emerald
            : v.rank === 2
            ? 'rgba(37, 99, 235, 0.85)' // Brand Blue
            : 'rgba(148, 163, 184, 0.7)' // Slate
        ),
        borderColor: rankedVendors.map((v) =>
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
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (context: any) => `Score: ${context.raw} / 100`,
        },
      },
    },
    scales: {
      y: {
        min: 0,
        max: 100,
        grid: {
          color: 'rgba(226, 232, 240, 0.8)',
        },
        ticks: {
          font: { family: 'Inter', size: 11 },
        },
      },
      x: {
        grid: { display: false },
        ticks: {
          font: { family: 'Inter', size: 11, weight: 'bold' },
        },
      },
    },
  };

  // 2. Radar Chart Data (Selected Vendor vs Peer Benchmark or Runner Up)
  const radarLabels = ['Cost', 'Quality', 'Delivery', 'Reliability', 'Sustainability'];
  const selectedCriteriaData = selectedVendor
    ? [
        selectedVendor.criteria.cost,
        selectedVendor.criteria.quality,
        selectedVendor.criteria.delivery,
        selectedVendor.criteria.reliability,
        selectedVendor.criteria.sustainability,
      ]
    : [0, 0, 0, 0, 0];

  const runnerUpCriteriaData = runnerUp
    ? [
        runnerUp.criteria.cost,
        runnerUp.criteria.quality,
        runnerUp.criteria.delivery,
        runnerUp.criteria.reliability,
        runnerUp.criteria.sustainability,
      ]
    : [0, 0, 0, 0, 0];

  const radarChartData = {
    labels: radarLabels,
    datasets: [
      {
        label: selectedVendor?.name || 'Selected Vendor',
        data: selectedCriteriaData,
        backgroundColor: 'rgba(37, 99, 235, 0.25)',
        borderColor: 'rgb(37, 99, 235)',
        pointBackgroundColor: 'rgb(37, 99, 235)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgb(37, 99, 235)',
        borderWidth: 2,
      },
      ...(runnerUp && runnerUp.id !== selectedVendor?.id
        ? [
            {
              label: `${runnerUp.name} (Runner-Up)`,
              data: runnerUpCriteriaData,
              backgroundColor: 'rgba(148, 163, 184, 0.15)',
              borderColor: 'rgb(148, 163, 184)',
              borderDash: [5, 5],
              pointBackgroundColor: 'rgb(148, 163, 184)',
              borderWidth: 1.5,
            },
          ]
        : []),
    ],
  };

  const radarChartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          font: { family: 'Inter', size: 12 },
          boxWidth: 14,
        },
      },
      tooltip: {
        callbacks: {
          label: (context: any) =>
            `${context.dataset.label}: ${context.raw} / 100`,
        },
      },
    },
    scales: {
      r: {
        min: 50,
        max: 100,
        angleLines: { color: 'rgba(226, 232, 240, 0.9)' },
        grid: { color: 'rgba(226, 232, 240, 0.8)' },
        pointLabels: {
          font: { family: 'Inter', size: 12, weight: 'bold' },
          color: '#334155',
        },
        ticks: {
          stepSize: 10,
          backdropColor: 'transparent',
          font: { size: 10 },
          color: '#94a3b8',
        },
      },
    },
  };

  // 3. Stacked Contribution Breakdown Chart Data
  const stackedChartData = {
    labels: rankedVendors.map((v) => v.name),
    datasets: [
      {
        label: `Cost (${weights.cost}%)`,
        data: rankedVendors.map((v) => v.contributions.cost),
        backgroundColor: CRITERIA_METADATA.cost.color,
      },
      {
        label: `Quality (${weights.quality}%)`,
        data: rankedVendors.map((v) => v.contributions.quality),
        backgroundColor: CRITERIA_METADATA.quality.color,
      },
      {
        label: `Delivery (${weights.delivery}%)`,
        data: rankedVendors.map((v) => v.contributions.delivery),
        backgroundColor: CRITERIA_METADATA.delivery.color,
      },
      {
        label: `Reliability (${weights.reliability}%)`,
        data: rankedVendors.map((v) => v.contributions.reliability),
        backgroundColor: CRITERIA_METADATA.reliability.color,
      },
      {
        label: `Sustainability (${weights.sustainability}%)`,
        data: rankedVendors.map((v) => v.contributions.sustainability),
        backgroundColor: CRITERIA_METADATA.sustainability.color,
      },
    ],
  };

  const stackedChartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          font: { family: 'Inter', size: 11 },
          boxWidth: 12,
        },
      },
    },
    scales: {
      x: {
        stacked: true,
        grid: { display: false },
        ticks: { font: { family: 'Inter', size: 11, weight: 'bold' } },
      },
      y: {
        stacked: true,
        min: 0,
        max: 100,
        grid: { color: 'rgba(226, 232, 240, 0.8)' },
        ticks: { font: { family: 'Inter', size: 11 } },
      },
    },
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-5">
      {/* Header and View Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-100 gap-3">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Visual Comparative Analytics
            </h2>
            <p className="text-xs text-slate-500">
              Interactive multi-dimensional performance benchmarks
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="inline-flex rounded-lg p-1 bg-slate-100 border border-slate-200 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'overview'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Overall Scores
          </button>
          <button
            onClick={() => setActiveTab('radar')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'radar'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Criteria Radar
          </button>
          <button
            onClick={() => setActiveTab('breakdown')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'breakdown'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Stacked Breakdown
          </button>
        </div>
      </div>

      {/* Chart Canvas Area */}
      <div className="mt-4">
        {activeTab === 'overview' && (
          <div>
            <div className="h-72 w-full">
              <Bar data={barChartData} options={barChartOptions} />
            </div>
            <p className="text-xs text-slate-400 text-center mt-3">
              Green = Rank #1 Recommended Vendor • Blue = Rank #2 Primary Alternative • Gray = Qualified Suppliers
            </p>
          </div>
        )}

        {activeTab === 'radar' && (
          <div>
            {/* Vendor Selector Dropdown for Radar */}
            <div className="flex items-center justify-between mb-3 px-1">
              <span className="text-xs font-semibold text-slate-600">
                Focus Supplier:
              </span>
              <select
                value={selectedVendor?.id}
                onChange={(e) => onSelectVendor(e.target.value)}
                className="text-xs font-semibold border border-slate-300 rounded-md px-2.5 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
              >
                {rankedVendors.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} (#{v.rank} — {v.overallScore})
                  </option>
                ))}
              </select>
            </div>
            <div className="h-72 w-full">
              <Radar data={radarChartData} options={radarChartOptions} />
            </div>
            <p className="text-xs text-slate-400 text-center mt-3">
              Comparing {selectedVendor?.name} across all 5 evaluation dimensions against the peer runner-up
            </p>
          </div>
        )}

        {activeTab === 'breakdown' && (
          <div>
            <div className="h-72 w-full">
              <Bar data={stackedChartData} options={stackedChartOptions} />
            </div>
            <p className="text-xs text-slate-400 text-center mt-3">
              Proportional contribution of each criterion to each vendor's total score out of 100
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
