import React from 'react';
import {
  X,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Lock,
  Calendar,
  ShieldCheck,
  User,
  MapPin
} from 'lucide-react';
import { formatPickupDate, getPickupScheduleStatus } from '../services/pickupRequestService';

const DueAlertDetailsModal = ({
  isOpen,
  onClose,
  request,
  onOpenUpdateReason,
  userRole = 'worker'
}) => {
  if (!isOpen || !request) return null;

  const sched = getPickupScheduleStatus(request);
  const requestId = request.requestId || request.id || 'N/A';
  const scheduledDate = request.scheduledDate || request.collectionDate;
  const formattedDate = formatPickupDate(scheduledDate, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  const dueReason = request.dueReason || sched.dueReason || '';
  const dueReasonSubmittedBy = request.dueReasonSubmittedBy || sched.dueReasonSubmittedBy || 'Haritha Karma Sena Worker';
  const dueReasonSubmittedAt = request.dueReasonSubmittedAt || sched.dueReasonSubmittedAt;
  const adminApprovalStatus = request.adminApprovalStatus || sched.adminApprovalStatus || 'Pending';

  const isApproved = adminApprovalStatus === 'Approved';
  const isRejected = adminApprovalStatus === 'Rejected';
  const isPending = !isApproved && !isRejected;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[#121e17] rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden relative border border-rose-200 dark:border-rose-900/60 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-rose-100 dark:border-rose-950/60 bg-gradient-to-r from-rose-50 via-amber-50 to-rose-50 dark:bg-rose-950/30 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-600 text-white rounded-2xl shadow-sm shrink-0">
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-black tracking-wider text-rose-800 dark:text-rose-300 block">
                  Pickup Due Alert & Status
                </span>
                {userRole === 'citizen' && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300">
                    Citizen Review (View-Only)
                  </span>
                )}
              </div>
              <h3 className="text-base font-black text-gray-900 dark:text-white flex items-center gap-2">
                <span>Request #{requestId}</span>
                {request.houseNumber && (
                  <span className="text-xs font-bold text-gray-500 dark:text-gray-400">
                    (House #{request.houseNumber})
                  </span>
                )}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-white/70 dark:hover:bg-white/10 rounded-xl transition cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {/* 1. Scheduled Date Passed Alert */}
          <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-2xl space-y-1">
            <div className="flex items-center justify-between text-xs font-black text-rose-900 dark:text-rose-200">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-rose-600" />
                Scheduled Collection Date Passed:
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-rose-200/80 dark:bg-rose-900 text-rose-950 dark:text-rose-100 font-extrabold text-[11px]">
                {formattedDate}
              </span>
            </div>
            <p className="text-[11px] text-rose-800 dark:text-rose-300 leading-relaxed font-medium">
              This pickup was not completed on the scheduled date. It has been marked as <strong>Due / Review Required</strong> in accordance with ward collection policy.
            </p>
          </div>

          {/* 2. Worker Due Reason */}
          <div className="p-4 bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-2xl space-y-2">
            <div className="flex items-center justify-between text-xs font-black text-amber-900 dark:text-amber-200">
              <span className="flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                <MessageSquare className="w-4 h-4 text-amber-600" />
                Worker Missed Reason:
              </span>
              {dueReasonSubmittedAt && (
                <span className="text-[10px] text-amber-800 dark:text-amber-300 font-semibold">
                  {formatPickupDate(dueReasonSubmittedAt)}
                </span>
              )}
            </div>

            {dueReason ? (
              <div className="p-3 bg-white dark:bg-[#14231b] rounded-xl border border-amber-200 dark:border-amber-900/60 shadow-2xs">
                <p className="text-gray-900 dark:text-gray-100 font-bold text-sm italic">
                  "{dueReason}"
                </p>
                <span className="text-[10px] text-gray-500 dark:text-gray-400 font-semibold block mt-1">
                  Recorded by {dueReasonSubmittedBy}
                </span>
              </div>
            ) : (
              <div className="p-3 bg-white dark:bg-[#14231b] rounded-xl border border-dashed border-rose-300 text-xs text-rose-700 font-bold">
                No reason recorded yet. Worker must enter a reason explaining why pickup was missed.
              </div>
            )}
          </div>

          {/* 3. Panchayat Admin Review & Status */}
          <div className="p-4 bg-white dark:bg-[#14231b] border-2 border-gray-200 dark:border-gray-800 rounded-2xl space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-gray-700 dark:text-gray-300">
                Panchayat Admin Review
              </span>
              <span className={`px-2.5 py-1 rounded-full text-xs font-black flex items-center gap-1 border ${
                isApproved
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300'
                  : isRejected
                    ? 'bg-rose-50 text-rose-800 border-rose-300 dark:bg-rose-950 dark:text-rose-300'
                    : 'bg-amber-50 text-amber-900 border-amber-300 dark:bg-amber-950 dark:text-amber-300'
              }`}>
                {isApproved ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Admin Approved</span>
                  </>
                ) : isRejected ? (
                  <>
                    <XCircle className="w-3.5 h-3.5 text-rose-600" />
                    <span>Admin Rejected</span>
                  </>
                ) : (
                  <>
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    <span>Waiting for Admin Approval</span>
                  </>
                )}
              </span>
            </div>

            <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed font-medium">
              {isApproved
                ? 'Admin has approved the missed pickup explanation. "Schedule New Date" has been unlocked for the worker within the 20th–25th collection window.'
                : isRejected
                  ? 'Admin reviewed and rejected the reason. This pickup remains locked and cannot be rescheduled.'
                  : 'The missed pickup reason is awaiting review by the Panchayat Administrator. Worker cannot reschedule or complete until approval is granted.'}
            </p>
          </div>

          {/* 4. Safeguard & Workflow Summary */}
          <div className="p-3 bg-gray-50 dark:bg-[#0f1712] border border-gray-200 dark:border-gray-800 rounded-2xl text-[11px] text-gray-600 dark:text-gray-400 space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-gray-800 dark:text-gray-200 text-xs">
              <Lock className="w-3.5 h-3.5 text-gray-500" />
              <span>Workflow Locks & Rules:</span>
            </div>
            <ul className="list-disc pl-4 space-y-1">
              <li><strong>Complete (OTP)</strong> is hidden & disabled while the request is Due.</li>
              <li>Worker cannot reschedule until Panchayat Admin grants approval.</li>
              <li>Once approved, worker can choose a new collection date within the 20th–25th drive window.</li>
              <li>OTP completion will unlock automatically on the newly scheduled pickup.</li>
            </ul>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/70 dark:bg-[#14231b] flex items-center justify-between gap-3 shrink-0">
          {onOpenUpdateReason && userRole === 'worker' ? (
            <button
              type="button"
              onClick={onOpenUpdateReason}
              className="px-4 py-2 bg-white hover:bg-amber-50 text-amber-900 border border-amber-300 font-extrabold text-xs rounded-xl shadow-2xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5 text-amber-600" />
              <span>{dueReason ? 'Update Missed Reason' : 'Enter Missed Reason'}</span>
            </button>
          ) : (
            <div />
          )}

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-gray-900 hover:bg-gray-800 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default DueAlertDetailsModal;
