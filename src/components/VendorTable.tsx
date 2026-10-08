import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  AlertCircle,
  Building,
  RotateCcw,
} from 'lucide-react';
import { Vendor, VendorCriteria } from '../types';
import { CRITERIA_METADATA } from '../services/scoringEngine';

interface VendorTableProps {
  vendors: Vendor[];
  onAddVendor: (vendor: Omit<Vendor, 'id'>) => void;
  onUpdateVendor: (vendor: Vendor) => void;
  onDeleteVendor: (vendorId: string) => void;
  onResetSampleVendors: () => void;
  disabled?: boolean;
}

export const VendorTable: React.FC<VendorTableProps> = ({
  vendors,
  onAddVendor,
  onUpdateVendor,
  onDeleteVendor,
  onResetSampleVendors,
  disabled = false,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Vendor | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addForm, setAddForm] = useState<Omit<Vendor, 'id'>>({
    name: '',
    criteria: {
      cost: 80,
      quality: 80,
      delivery: 80,
      reliability: 80,
      sustainability: 80,
    },
    notes: '',
  });
  const [addError, setAddError] = useState<string | null>(null);

  // Inline edit handlers
  const handleStartEdit = (vendor: Vendor) => {
    setEditingId(vendor.id);
    setEditForm({ ...vendor, criteria: { ...vendor.criteria } });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm(null);
  };

  const handleSaveEdit = () => {
    if (!editForm) return;

    // Check blank name
    if (!editForm.name.trim()) {
      alert('Vendor name cannot be blank.');
      return;
    }

    // Check duplicate name
    const isDuplicate = vendors.some(
      (v) =>
        v.id !== editForm.id &&
        v.name.trim().toLowerCase() === editForm.name.trim().toLowerCase()
    );
    if (isDuplicate) {
      alert(`A vendor named "${editForm.name.trim()}" already exists.`);
      return;
    }

    // Check scores
    const keys: (keyof VendorCriteria)[] = [
      'cost',
      'quality',
      'delivery',
      'reliability',
      'sustainability',
    ];
    for (const k of keys) {
      const val = editForm.criteria[k];
      if (isNaN(val) || val < 0 || val > 100) {
        alert(
          `${CRITERIA_METADATA[k].label} score must be a number between 0 and 100.`
        );
        return;
      }
    }

    onUpdateVendor(editForm);
    setEditingId(null);
    setEditForm(null);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);

    const trimmedName = addForm.name.trim();
    if (!trimmedName) {
      setAddError('Vendor name is required.');
      return;
    }

    const isDuplicate = vendors.some(
      (v) => v.name.trim().toLowerCase() === trimmedName.toLowerCase()
    );
    if (isDuplicate) {
      setAddError(`Vendor "${trimmedName}" already exists. Names must be unique.`);
      return;
    }

    onAddVendor({
      ...addForm,
      name: trimmedName,
    });

    // Reset add form
    setAddForm({
      name: '',
      criteria: {
        cost: 80,
        quality: 80,
        delivery: 80,
        reliability: 80,
        sustainability: 80,
      },
      notes: '',
    });
    setIsAddModalOpen(false);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
      {/* Header bar */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center">
            <Building className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Vendor Master Evaluation Matrix
            </h2>
            <p className="text-xs text-slate-500">
              Direct supplier criteria metrics (Scale 0 – 100) • {vendors.length} vendors in evaluation pool
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={onResetSampleVendors}
            className="inline-flex items-center space-x-1 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Sample 5</span>
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center space-x-1 px-3 py-1.5 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-lg shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Supplier</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto w-full">
        <table className="w-full min-w-[620px] text-left text-sm">
          <thead className="bg-slate-50/75 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
            <tr>
              <th className="py-3 px-4 min-w-[160px]">Vendor / Supplier</th>
              <th className="py-3 px-3 text-center whitespace-nowrap">
                <span className="text-sky-700 font-bold">Cost</span>
              </th>
              <th className="py-3 px-3 text-center whitespace-nowrap">
                <span className="text-blue-700 font-bold">Quality</span>
              </th>
              <th className="py-3 px-3 text-center whitespace-nowrap">
                <span className="text-teal-700 font-bold">Delivery</span>
              </th>
              <th className="py-3 px-3 text-center whitespace-nowrap">
                <span className="text-purple-700 font-bold">Reliability</span>
              </th>
              <th className="py-3 px-3 text-center whitespace-nowrap">
                <span className="text-emerald-700 font-bold">Sustainability</span>
              </th>
              <th className="py-3 px-4 text-right whitespace-nowrap min-w-[80px] sticky right-0 z-10 bg-white shadow-[-8px_0_8px_-8px_rgba(15,23,42,0.12)]">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {vendors.map((vendor) => {
              const isEditing = editingId === vendor.id;

              if (isEditing && editForm) {
                return (
                  <tr key={vendor.id} className="bg-brand-50/40">
                    <td className="py-2.5 px-4">
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) =>
                          setEditForm({ ...editForm, name: e.target.value })
                        }
                        className="w-full px-2 py-1 text-sm font-semibold border border-brand-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                      />
                    </td>
                    {(['cost', 'quality', 'delivery', 'reliability', 'sustainability'] as (keyof VendorCriteria)[]).map(
                      (k) => (
                        <td key={k} className="py-2.5 px-3 text-center">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={editForm.criteria[k]}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value);
                              setEditForm({
                                ...editForm,
                                criteria: {
                                  ...editForm.criteria,
                                  [k]: isNaN(val) ? 0 : val,
                                },
                              });
                            }}
                            className="w-16 px-1.5 py-1 text-center text-sm font-bold border border-brand-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                          />
                        </td>
                      )
                    )}
                    <td className="py-2.5 px-4 text-right whitespace-nowrap sticky right-0 z-10 bg-white shadow-[-8px_0_8px_-8px_rgba(15,23,42,0.12)]">
                      <div className="flex items-center justify-end space-x-1">
                        <button
                          onClick={handleSaveEdit}
                          title="Save Changes"
                          aria-label="Save Changes"
                          className="p-1 rounded text-emerald-600 hover:bg-emerald-50"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          title="Cancel"
                          aria-label="Cancel"
                          className="p-1 rounded text-slate-400 hover:bg-slate-100"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              }

              return (
                <tr
                  key={vendor.id}
                  className="hover:bg-slate-50/60 transition-colors"
                >
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-900">{vendor.name}</div>
                    {vendor.notes && (
                      <div className="text-[11px] text-slate-400 truncate max-w-xs">
                        {vendor.notes}
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className="inline-block px-2 py-0.5 text-xs font-bold rounded bg-sky-50 text-sky-800 border border-sky-100">
                      {vendor.criteria.cost}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className="inline-block px-2 py-0.5 text-xs font-bold rounded bg-blue-50 text-blue-800 border border-blue-100">
                      {vendor.criteria.quality}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className="inline-block px-2 py-0.5 text-xs font-bold rounded bg-teal-50 text-teal-800 border border-teal-100">
                      {vendor.criteria.delivery}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className="inline-block px-2 py-0.5 text-xs font-bold rounded bg-purple-50 text-purple-800 border border-purple-100">
                      {vendor.criteria.reliability}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className="inline-block px-2 py-0.5 text-xs font-bold rounded bg-emerald-50 text-emerald-800 border border-emerald-100">
                      {vendor.criteria.sustainability}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right whitespace-nowrap sticky right-0 z-10 bg-white shadow-[-8px_0_8px_-8px_rgba(15,23,42,0.12)]">
                    <div className="flex items-center justify-end space-x-1">
                      <button
                        onClick={() => handleStartEdit(vendor)}
                        disabled={disabled}
                        title="Edit Vendor"
                        aria-label={`Edit ${vendor.name}`}
                        className="p-1 rounded text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (vendors.length <= 2) {
                            alert('A minimum of two vendors is required to maintain comparative procurement ranking.');
                            return;
                          }
                          if (confirm(`Remove "${vendor.name}" from the evaluation pool?`)) {
                            onDeleteVendor(vendor.id);
                          }
                        }}
                        disabled={disabled || vendors.length <= 2}
                        title={
                          vendors.length <= 2
                            ? 'Cannot delete: Minimum 2 vendors required'
                            : 'Delete Vendor'
                        }
                        aria-label={`Delete ${vendor.name}`}
                        className={`p-1 rounded transition-colors ${
                          vendors.length <= 2
                            ? 'text-slate-200 cursor-not-allowed'
                            : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                        }`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Add Vendor Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-lg w-full p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center">
                  <Building className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Add New Supplier / Vendor
                  </h3>
                  <p className="text-xs text-slate-500">
                    Specify vendor performance metrics across the 5 dimensions
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {addError && (
              <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{addError}</span>
              </div>
            )}

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Vendor / Corporation Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Zenith Precision Parts"
                  value={addForm.name}
                  onChange={(e) =>
                    setAddForm({ ...addForm, name: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-2">
                  Evaluation Criteria Scores (0 – 100) *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {(['cost', 'quality', 'delivery', 'reliability', 'sustainability'] as (keyof VendorCriteria)[]).map(
                    (criterion) => (
                      <div
                        key={criterion}
                        className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/50"
                      >
                        <label className="block text-xs font-semibold text-slate-700 capitalize mb-1">
                          {CRITERIA_METADATA[criterion].label}
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          required
                          value={addForm.criteria[criterion]}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            setAddForm({
                              ...addForm,
                              criteria: {
                                ...addForm.criteria,
                                [criterion]: isNaN(val)
                                  ? 0
                                  : Math.max(0, Math.min(100, val)),
                              },
                            });
                          }}
                          className="w-full px-2 py-1 text-sm font-bold text-center border border-slate-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                        />
                      </div>
                    )
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Procurement Notes / Background (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Certified ISO-9001, local logistics hub in Ohio"
                  value={addForm.notes || ''}
                  onChange={(e) =>
                    setAddForm({ ...addForm, notes: e.target.value })
                  }
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="pt-3 flex items-center justify-end space-x-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-lg shadow-xs transition-colors"
                >
                  Save & Evaluate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
