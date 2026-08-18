import React from 'react';
import { Home, MapPin, Send, ArrowLeft, CheckCircle, Info, Package } from 'lucide-react';

const PickupSummary = ({
  citizenData,
  confirmedData,
  onSubmit,
  onBack,
  isSubmitting,
  error
}) => {
  const {
    estimatedVolume = 'Medium',
    overallCategory = 'Recyclable Plastic'
  } = confirmedData || {};

  const citizenId = citizenData?.citizenId || citizenData?.id || citizenData?._id || 'CIT001';
  const houseName = citizenData?.houseName || 'Not Set';
  const houseNumber = citizenData?.houseNumber || 'Not Set';
  const address = citizenData?.address || 'Address Not Set';
  const wardId = citizenData?.wardId || 'Ward 1';
  const panchayatName = citizenData?.panchayatName || 'Ponkunnam';

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-emerald-100/80 space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#0a4d2c] block mb-1">
            Step 2 of 2: Final Verification
          </span>
          <h2 className="text-xl font-extrabold text-gray-900">
            Monthly Plastic Pickup Summary
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Please verify your household details and selected waste volume before submitting your request.
          </p>
        </div>

        <button
          type="button"
          onClick={onBack}
          disabled={isSubmitting}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition-colors cursor-pointer shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Change Volume</span>
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs flex items-center gap-2">
          <Info className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Citizen Address & Location Info Card */}
        <div className="bg-emerald-50/50 border border-emerald-100 p-5 rounded-2xl space-y-4">
          <div className="flex items-center gap-2 text-[#0a4d2c]">
            <Home className="w-5 h-5 text-[#0a4d2c]" />
            <h3 className="text-sm font-extrabold text-gray-900">
              Residence Details
            </h3>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-emerald-100">
              <span className="text-gray-500 font-medium">Citizen ID:</span>
              <span className="font-extrabold text-gray-900">{citizenId}</span>
            </div>

            <div className="flex justify-between py-1 border-b border-emerald-100">
              <span className="text-gray-500 font-medium">House Name:</span>
              <span className="font-bold text-gray-900">{houseName}</span>
            </div>

            <div className="flex justify-between py-1 border-b border-emerald-100">
              <span className="text-gray-500 font-medium">House Number:</span>
              <span className="font-bold text-gray-900">{houseNumber}</span>
            </div>

            <div className="flex justify-between py-1 border-b border-emerald-100">
              <span className="text-gray-500 font-medium">Address:</span>
              <span className="font-bold text-gray-900 text-right max-w-[200px] truncate">
                {address}
              </span>
            </div>

            <div className="flex justify-between py-1">
              <span className="text-gray-500 font-medium flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                Ward / Panchayat:
              </span>
              <span className="font-extrabold text-[#0a4d2c]">
                {wardId} • {panchayatName}
              </span>
            </div>
          </div>
        </div>

        {/* Waste Details & Volume Card */}
        <div className="bg-emerald-50/50 border border-emerald-100 p-5 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-gray-900 flex items-center gap-2">
              <Package className="w-5 h-5 text-[#0a4d2c]" />
              Plastic Waste Details
            </h3>

            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-100 text-[#0a4d2c] font-bold text-[11px] rounded-full">
              Recyclable Plastic
            </span>
          </div>

          <div className="space-y-3 pt-1">
            <div className="flex justify-between text-xs py-1 border-b border-emerald-100">
              <span className="text-gray-500 font-medium">Collection Window:</span>
              <span className="font-extrabold text-[#0a4d2c]">
                15th – 25th of Month
              </span>
            </div>

            <div className="flex justify-between text-xs py-1 border-b border-emerald-100">
              <span className="text-gray-500 font-medium">Waste Category:</span>
              <span className="px-2.5 py-0.5 bg-[#0a4d2c] text-white font-bold text-[11px] rounded-md">
                Recyclable Plastic
              </span>
            </div>

            <div className="flex justify-between text-xs py-2 border-b border-emerald-100 items-center">
              <span className="text-gray-500 font-medium">Selected Volume:</span>
              <span className="px-3.5 py-1 bg-[#0a4d2c] text-white font-extrabold text-xs rounded-lg shadow-2xs">
                {estimatedVolume} Volume
              </span>
            </div>

            <div className="p-3 bg-white border border-emerald-200 rounded-xl text-[11px] text-emerald-900 mt-2">
              <span className="font-bold block text-emerald-800">Notice:</span>
              Haritha Karma Sena workers will collect recyclable plastic waste during the 15th–25th monthly collection window.
            </div>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-gray-100">
        <button
          type="button"
          onClick={onBack}
          disabled={isSubmitting}
          className="w-full sm:w-auto px-5 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
        >
          Change Volume
        </button>

        <button
          type="button"
          onClick={onSubmit}
          disabled={isSubmitting}
          className="w-full sm:w-auto px-8 py-3.5 bg-[#0a4d2c] hover:bg-emerald-800 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Submitting Request...</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4 text-emerald-300" />
              <span>Submit Monthly Request</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default PickupSummary;
