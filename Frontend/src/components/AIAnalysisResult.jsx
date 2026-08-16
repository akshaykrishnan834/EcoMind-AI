import React, { useState } from 'react';
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Trash2,
  Camera,
  Edit2,
  FileText,
  ShieldAlert,
  ArrowRight,
  Info
} from 'lucide-react';

const ELIGIBLE_PICKUP_TYPES = [
  'Plastic Bottles',
  'Plastic Covers / Wrappers',
  'Medicine Blister Packs / Tablet Strips',
  'Other recyclable plastic'
];

const AIAnalysisResult = ({
  analysisResult,
  onConfirmWaste,
  onRetakePhoto,
  onSwitchToManual
}) => {
  const {
    detectedItems: rawDetectedItems = [],
    nonPlasticDetectedItems = [],
    hasNonPlasticItems = false,
    overallCategory = 'Monthly Recyclable Waste',
    confidence = 0,
    segregationAdvice = 'Keep plastics and medicine blister packs dry and bundled.',
    isLowConfidence = false
  } = analysisResult || {};

  // Filter detected items strictly to eligible monthly pickup categories (Plastics & Medicine Blister Packs / Tablet Strips)
  const initialEligibleItems = (rawDetectedItems || [])
    .filter(item => {
      const typeName = item.type || item.name || '';
      return ELIGIBLE_PICKUP_TYPES.includes(typeName);
    })
    .map(item => ({
      type: item.type || item.name || 'Other recyclable plastic',
      quantity: Math.max(1, parseInt(item.quantity, 10) || 1)
    }));

  const [items, setItems] = useState(initialEligibleItems);
  const [selectedNewType, setSelectedNewType] = useState(ELIGIBLE_PICKUP_TYPES[0]);
  const [newQuantity, setNewQuantity] = useState(1);
  const [isAddingItem, setIsAddingItem] = useState(false);

  const confidencePercent = Math.round((confidence <= 1 ? confidence : confidence / 100) * 100);
  const isUnclear = isLowConfidence || confidencePercent < 45 || items.length === 0;

  const handleQuantityChange = (index, delta) => {
    setItems(prev => {
      const updated = [...prev];
      const newQty = updated[index].quantity + delta;
      if (newQty > 0) {
        updated[index].quantity = newQty;
      }
      return updated;
    });
  };

  const handleManualQuantitySet = (index, val) => {
    const qty = parseInt(val, 10);
    setItems(prev => {
      const updated = [...prev];
      updated[index].quantity = isNaN(qty) || qty < 1 ? 1 : qty;
      return updated;
    });
  };

  const handleRemoveItem = (index) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddNewItem = () => {
    if (!selectedNewType) return;
    const existingIndex = items.findIndex(i => i.type === selectedNewType);
    if (existingIndex >= 0) {
      handleQuantityChange(existingIndex, newQuantity);
    } else {
      setItems(prev => [...prev, { type: selectedNewType, quantity: newQuantity }]);
    }
    setIsAddingItem(false);
    setNewQuantity(1);
  };

  const handleConfirm = () => {
    if (items.length === 0) {
      alert('Please select at least one eligible item before confirming.');
      return;
    }
    onConfirmWaste({
      wasteItems: items,
      overallCategory: 'Monthly Recyclable Waste',
      aiAnalyzed: true,
      aiConfidence: confidence <= 1 ? confidence : confidence / 100,
      segregationAdvice
    });
  };

  // IF AI CANNOT CLEARLY IDENTIFY ELIGIBLE WASTE (Requirement 5: EXACTLY TWO OPTIONS)
  if (isUnclear) {
    return (
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-amber-200/80 space-y-6">
        <div className="flex items-start gap-4 p-4 bg-amber-50 rounded-2xl border border-amber-200 text-amber-900">
          <ShieldAlert className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-base font-extrabold text-amber-900">
              {items.length === 0 ? 'No Eligible Monthly Pickup Items Identified' : `AI Analysis Unclear (${confidencePercent}% Confidence)`}
            </h3>
            <p className="text-xs text-amber-800 mt-1">
              Monthly doorstep pickup is strictly for plastics and medicine tablet strips / blister packs. Our AI did not detect eligible items or the photo was unclear. Please select one of the following two options to proceed:
            </p>
          </div>
        </div>

        {/* EXACTLY TWO OPTIONS AS SPECIFIED IN REQUIREMENT 5 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {/* Option 1: Take a Clearer Photo */}
          <button
            type="button"
            onClick={onRetakePhoto}
            className="p-6 bg-emerald-50 hover:bg-emerald-100 border-2 border-emerald-300 rounded-3xl text-left transition-all duration-200 group cursor-pointer space-y-3 flex flex-col justify-between"
          >
            <div className="w-12 h-12 rounded-2xl bg-[#0a4d2c] text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
              <Camera className="w-6 h-6 text-white" />
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-gray-900 group-hover:text-[#0a4d2c]">
                Take a Clearer Photo
              </h4>
              <p className="text-xs text-gray-600 mt-1">
                Upload another photo of your plastics or medicine tablet strips with better lighting or a closer angle.
              </p>
            </div>
            <div className="flex items-center text-xs font-bold text-[#0a4d2c] pt-2">
              <span>Try Again with Photo</span>
              <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          {/* Option 2: Enter Manually */}
          <button
            type="button"
            onClick={onSwitchToManual}
            className="p-6 bg-gray-50 hover:bg-gray-100 border-2 border-gray-300 rounded-3xl text-left transition-all duration-200 group cursor-pointer space-y-3 flex flex-col justify-between"
          >
            <div className="w-12 h-12 rounded-2xl bg-gray-800 text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-gray-900 group-hover:text-gray-800">
                Enter Manually
              </h4>
              <p className="text-xs text-gray-600 mt-1">
                Manually pick your plastics or tablet strips and quantities from the eligible categories.
              </p>
            </div>
            <div className="flex items-center text-xs font-bold text-gray-800 pt-2">
              <span>Select Items Manually</span>
              <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>
        </div>
      </div>
    );
  }

  // SUCCESSFUL IDENTIFICATION VIEW
  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-emerald-100/80 space-y-6">
      {/* Top Header & AI Metrics */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-[#0a4d2c] text-xs font-bold mb-1">
            <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
            <span>AI Classification Complete</span>
          </div>
          <h2 className="text-xl font-extrabold text-gray-900">
            Detected Recyclable Items
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Review and adjust detected items or quantities before confirming.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
            <span className="text-[10px] text-emerald-700 uppercase font-bold tracking-wider block">
              AI Confidence
            </span>
            <span className="text-base font-extrabold text-[#0a4d2c]">
              {confidencePercent}%
            </span>
          </div>
        </div>
      </div>

      {/* Excluded Materials Banner */}
      {(hasNonPlasticItems || (nonPlasticDetectedItems && nonPlasticDetectedItems.length > 0)) && (
        <div className="p-4 bg-amber-50/90 border border-amber-200 rounded-2xl text-amber-900 text-xs flex items-start gap-3">
          <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Excluded Non-Pickup Materials: </span>
            {nonPlasticDetectedItems && nonPlasticDetectedItems.length > 0 ? (
              <span>
                Items detected such as <span className="font-extrabold text-amber-950">{nonPlasticDetectedItems.join(', ')}</span> are excluded from monthly doorstep pickup requests.
              </span>
            ) : (
              <span>
                Glass, paper, cardboard, and metal cans are not included in monthly doorstep pickup. Non-pickup items detected in your photo have been excluded from this request.
              </span>
            )}
          </div>
        </div>
      )}

      {/* Segregation Advice Banner */}
      {segregationAdvice && (
        <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-2xl text-emerald-900 text-xs flex items-start gap-3">
          <Info className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Segregation Advice: </span>
            {segregationAdvice}
          </div>
        </div>
      )}

      {/* Editable Items List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
            <Edit2 className="w-4 h-4 text-[#0a4d2c]" />
            Detected Eligible Items ({items.length})
          </h3>
          <button
            type="button"
            onClick={() => setIsAddingItem(!isAddingItem)}
            className="text-xs font-extrabold text-[#0a4d2c] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Item</span>
          </button>
        </div>

        {/* Add Item Inline Dropdown */}
        {isAddingItem && (
          <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <select
              value={selectedNewType}
              onChange={(e) => setSelectedNewType(e.target.value)}
              className="flex-1 bg-white border border-gray-300 rounded-xl p-2.5 text-xs font-semibold text-gray-800 focus:outline-none focus:border-[#0a4d2c]"
            >
              {ELIGIBLE_PICKUP_TYPES.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>

            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-600 font-medium">Qty:</span>
              <input
                type="number"
                min="1"
                value={newQuantity}
                onChange={(e) => setNewQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="w-16 bg-white border border-gray-300 rounded-xl p-2 text-xs text-center font-bold"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleAddNewItem}
                className="px-4 py-2 bg-[#0a4d2c] text-white text-xs font-bold rounded-xl hover:bg-emerald-800 transition-colors cursor-pointer"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => setIsAddingItem(false)}
                className="px-3 py-2 bg-gray-200 text-gray-700 text-xs font-bold rounded-xl hover:bg-gray-300 transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {items.length === 0 ? (
          <div className="p-6 text-center text-xs text-gray-500 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
            No eligible items detected. Click "Add Item" above or switch to manual entry.
          </div>
        ) : (
          <div className="space-y-2.5">
            {items.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3.5 bg-gray-50 hover:bg-emerald-50/40 border border-gray-200 hover:border-emerald-200 rounded-2xl transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-[#0a4d2c] flex items-center justify-center font-bold text-xs">
                    {idx + 1}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-gray-800 block">
                      {item.type}
                    </span>
                    <span className="text-[11px] text-emerald-700">
                      Eligible monthly pickup material
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Quantity adjustment buttons */}
                  <div className="flex items-center border border-gray-300 bg-white rounded-xl overflow-hidden shadow-2xs">
                    <button
                      type="button"
                      onClick={() => handleQuantityChange(idx, -1)}
                      className="px-2.5 py-1 text-gray-600 hover:bg-gray-100 font-extrabold text-xs cursor-pointer"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => handleManualQuantitySet(idx, e.target.value)}
                      className="w-12 text-center text-xs font-extrabold text-gray-800 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleQuantityChange(idx, 1)}
                      className="px-2.5 py-1 text-gray-600 hover:bg-gray-100 font-extrabold text-xs cursor-pointer"
                    >
                      +
                    </button>
                  </div>

                  {/* Delete button */}
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(idx)}
                    className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                    title="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Overall Classification */}
      <div className="pt-2">
        <label className="block text-xs font-bold text-gray-700 mb-1">
          Service Classification
        </label>
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-[#0a4d2c] flex items-center justify-between">
          <span>Monthly Household Doorstep Pickup</span>
          <span className="px-2.5 py-0.5 bg-[#0a4d2c] text-white rounded-md text-[11px]">
            Recyclable Plastics & Tablet Strips
          </span>
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-gray-100">
        <button
          type="button"
          onClick={onRetakePhoto}
          className="w-full sm:w-auto px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
        >
          Upload Different Photo
        </button>

        <button
          type="button"
          onClick={handleConfirm}
          className="w-full sm:w-auto px-6 py-3 bg-[#0a4d2c] hover:bg-emerald-800 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-300" />
          <span>Confirm Items</span>
        </button>
      </div>
    </div>
  );
};

export default AIAnalysisResult;
