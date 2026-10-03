import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, AlertCircle, Loader2, MessageSquare, Clock, Calendar } from 'lucide-react';
import { submitDueReason, formatPickupDate } from '../services/pickupRequestService';

const CITIZEN_REASONS = [
  'House was locked / Family was away',
  'Plastic waste was not yet ready or segregated',
  'Worker did not arrive on the scheduled date',
  'Could not hand over waste due to personal emergency',
  'Kept waste outside but was missed by collection team'
];

const WORKER_REASONS = [
  'House gate locked / Citizen unavailable at location',
  'Waste was not kept outside or not segregated',
  'Adverse weather / heavy rain delayed collection',
  'Collection vehicle breakdown or route bottleneck',
  'Citizen requested collection on a subsequent day'
];

const DueReasonModal = ({
  isOpen,
  onClose,
  request,
  userRole = 'worker',
  userName = '',
  onSuccess
}) => {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (isOpen && request) {
      setReason(request.dueReason || '');
      setError('');
      setSuccessMsg('');
    }
  }, [isOpen, request]);

  if (!isOpen || !request) return null;

  const requestId = request.requestId || request.id;
  const scheduledDateStr = request.scheduledDate || request.collectionDate;
  const formattedDate = formatPickupDate(scheduledDateStr);
  const quickSuggestions = WORKER_REASONS;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanReason = reason.trim();
    if (!cleanReason) {
      setError('Please provide a reason why the pickup was not completed.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMsg('');

    const submitterLabel = 'Haritha Karma Sena Worker';

    try {
      await submitDueReason(requestId, cleanReason, submitterLabel);
      setSuccessMsg('Reason recorded successfully. Awaiting Admin review.');
      setTimeout(() => {
        if (onSuccess) onSuccess(requestId, cleanReason);
        handleClose();
      }, 1300);
    } catch (err) {
      console.error('Due reason submission error:', err);
      const msg = err.response?.data?.message || err.message || 'Failed to submit reason.';
      setError(typeof msg === 'string' ? msg : 'Failed to submit reason. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setReason('');
      setError('');
      setSuccessMsg('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-white dark:bg-[#121e17] rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden relative border border-emerald-100 dark:border-emerald-950/60">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800 bg-rose-50/70 dark:bg-rose-950/20">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-rose-600 text-white rounded-xl shadow-xs">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-gray-900 dark:text-gray-100 text-base">
                Missed Pickup - Enter Reason (Worker)
              </h3>
              <p className="text-[11px] font-bold text-rose-700 dark:text-rose-400">
                Admin must review this reason before rescheduling is unlocked
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={loading}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-xl hover:bg-white/60 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content & Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* Request Meta Banner */}
          <div className="bg-gray-50 dark:bg-[#1a2d22] p-3.5 rounded-2xl border border-gray-100 dark:border-emerald-950/40 space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-gray-500 dark:text-gray-400 font-medium">Request ID:</span>
              <span className="font-mono font-black text-gray-900 dark:text-gray-100">{requestId}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500 dark:text-gray-400 font-medium flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-emerald-600" /> Scheduled Date:
              </span>
              <span className="font-bold text-gray-800 dark:text-gray-200">{formattedDate}</span>
            </div>
            {request.dueReason && (
              <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                <span className="text-[11px] font-bold text-purple-700 dark:text-purple-300 block">
                  Previously Submitted Reason:
                </span>
                <p className="text-xs text-gray-700 dark:text-gray-300 italic mt-0.5">
                  "{request.dueReason}"
                </p>
              </div>
            )}
          </div>

          {/* Quick suggestions */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-extrabold uppercase tracking-wider text-gray-500 dark:text-gray-400 block">
              Quick Select Reason:
            </label>
            <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pr-1">
              {quickSuggestions.map((sug, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setReason(sug)}
                  className={`text-xs px-2.5 py-1.5 rounded-xl border text-left transition cursor-pointer ${
                    reason === sug
                      ? 'bg-rose-100 dark:bg-rose-950/60 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200 font-bold'
                      : 'bg-white dark:bg-[#1a2d22] border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-rose-200'
                  }`}
                >
                  {sug}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Reason Textarea */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-800 dark:text-gray-200 block">
              Explain why this pickup was not completed:
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter explanation for delay or missed pickup..."
              disabled={loading}
              className="w-full text-xs p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a2d22] text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>

          {/* Status Notifications inside modal */}
          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl flex items-center gap-2 text-xs text-rose-700 dark:text-rose-300 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center gap-2 text-xs text-emerald-800 dark:text-emerald-200 font-bold">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !reason.trim()}
              className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <MessageSquare className="w-4 h-4" />
                  <span>Submit Reason</span>
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};

export default DueReasonModal;
