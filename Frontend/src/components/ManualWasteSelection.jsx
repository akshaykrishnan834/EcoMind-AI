import React, { useState } from 'react';
import { FileText, CheckCircle2, Plus, Minus, Check, Camera, AlertCircle, Info } from 'lucide-react';

const ELIGIBLE_PICKUP_TYPES = [
  'Plastic Bottles',
  'Plastic Covers / Wrappers',
  'Medicine Blister Packs / Tablet Strips',
  'Other recyclable plastic'
];

const ManualWasteSelection = ({
  onConfirmWaste,
  onSwitchToPhotoUpload
}) => {
  // Store selections as map: { [type]: quantity }
  const [selections, setSelections] = useState({});
  const [error, setError] = useState('');

  const toggleSelection = (type) => {
    setError('');
    setSelections(prev => {
      const updated = { ...prev };
      if (updated[type]) {
        delete updated[type];
      } else {
        updated[type] = 1;
      }
      return updated;
    });
  };

  const updateQuantity = (type, delta) => {
    setSelections(prev => {
      const current = prev[type] || 0;
      const next = current + delta;
      if (next <= 0) {
        const copy = { ...prev };
        delete copy[type];
        return copy;
      }
      return { ...prev, [type]: next };
    });
  };

  const setManualQuantity = (type, val) => {
    const qty = parseInt(val, 10);
    setSelections(prev => {
      if (isNaN(qty) || qty <= 0) {
        const copy = { ...prev };
        delete copy[type];
        return copy;
      }
      return { ...prev, [type]: qty };
    });
  };

  const handleConfirm = () => {
    const selectedEntries = Object.entries(selections).filter(([_, qty]) => qty > 0);

    if (selectedEntries.length === 0) {
      setError('Please select at least one eligible item (plastic or medicine tablet strips) and specify quantity.');
      return;
    }

    const wasteItems = selectedEntries.map(([type, quantity]) => ({
      type,
      quantity
    }));

    onConfirmWaste({
      wasteItems,
      overallCategory: 'Monthly Recyclable Waste',
      aiAnalyzed: false,
      aiConfidence: 0,
      segregationAdvice: 'Manual selection. Ensure items are clean, dry, and bundled.'
    });
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-emerald-100/80 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
        <div>
          <h2 className="text-xl font-extrabold text-gray-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#0a4d2c]" />
            Manual Waste Selection
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Doorstep pickup requests are strictly for plastics & medicine tablet strips. Select your items below.
          </p>
        </div>

        {onSwitchToPhotoUpload && (
          <button
            type="button"
            onClick={onSwitchToPhotoUpload}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-[#0a4d2c] font-bold text-xs rounded-xl border border-emerald-200 transition-colors cursor-pointer shrink-0"
          >
            <Camera className="w-4 h-4 text-emerald-700" />
            <span>Use AI Photo Instead</span>
          </button>
        )}
      </div>

      {/* Info notice banner */}
      <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-2xl text-emerald-900 text-xs flex items-start gap-3">
        <Info className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Monthly Service Notice: </span>
          Recyclable plastics and medicine tablet strips / blister packs are collected during monthly doorstep pickup. Glass, paper, cardboard, and metal cans are excluded.
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Grid of 4 eligible categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {ELIGIBLE_PICKUP_TYPES.map((type) => {
          const isSelected = Boolean(selections[type]);
          const quantity = selections[type] || 0;

          return (
            <div
              key={type}
              className={`p-5 rounded-2xl border transition-all duration-200 flex flex-col justify-between space-y-4 ${
                isSelected
                  ? 'border-[#0a4d2c] bg-emerald-50/70 shadow-xs'
                  : 'border-gray-200 hover:border-emerald-300 bg-gray-50/50'
              }`}
            >
              <div
                onClick={() => toggleSelection(type)}
                className="flex items-start justify-between gap-2 cursor-pointer"
              >
                <div>
                  <span className="text-xs font-bold text-gray-900 leading-tight block">
                    {type}
                  </span>
                  <span className="text-[11px] text-emerald-700 font-medium mt-0.5 block">
                    Eligible Monthly Pickup Material
                  </span>
                </div>

                <div
                  className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors shrink-0 ${
                    isSelected
                      ? 'bg-[#0a4d2c] border-[#0a4d2c] text-white'
                      : 'border-gray-300 bg-white'
                  }`}
                >
                  {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
              </div>

              {/* Quantity Controls if Selected */}
              {isSelected ? (
                <div className="flex items-center justify-between pt-2 border-t border-emerald-200/60">
                  <span className="text-[11px] font-bold text-[#0a4d2c]">Quantity:</span>
                  <div className="flex items-center border border-emerald-300 bg-white rounded-xl overflow-hidden">
                    <button
                      type="button"
                      onClick={() => updateQuantity(type, -1)}
                      className="px-2.5 py-1 text-gray-600 hover:bg-emerald-100 font-extrabold text-xs cursor-pointer"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <input
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) => setManualQuantity(type, e.target.value)}
                      className="w-12 text-center text-xs font-extrabold text-[#0a4d2c] focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => updateQuantity(type, 1)}
                      className="px-2.5 py-1 text-gray-600 hover:bg-emerald-100 font-extrabold text-xs cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-[11px] text-gray-400 pt-2 border-t border-gray-200/50">
                  Click card to select
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Confirm Waste Button */}
      <div className="flex items-center justify-end pt-4 border-t border-gray-100">
        <button
          type="button"
          onClick={handleConfirm}
          className="w-full sm:w-auto px-6 py-3 bg-[#0a4d2c] hover:bg-emerald-800 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-300" />
          <span>Confirm Selected Items</span>
        </button>
      </div>
    </div>
  );
};

export default ManualWasteSelection;
