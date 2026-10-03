import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  AlertTriangle,
  Truck,
  Package,
  KeyRound,
  ShieldCheck,
  User,
  Phone,
  ArrowRight,
  Sparkles,
  Check,
  CalendarCheck,
  Info,
  Bell,
  MessageSquare,
  Loader2,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';
import { getPickupScheduleStatus, formatPickupDate, getAssignedCollectionPeriod } from '../services/pickupRequestService';

const CitizenSchedule = ({
  citizenData,
  monthlyStatusData,
  realRequests = [],
  assignedWorker,
  setActiveTab,
  onRefresh
}) => {
  const userObj = JSON.parse(localStorage.getItem('user') || '{}');
  const citizenName = citizenData?.fullName || userObj.fullName || 'Citizen';
  const wardId = citizenData?.wardId || userObj.wardId || 'Ward 1';
  const panchayatName = citizenData?.panchayatName || userObj.panchayatName || 'Chirakkadavu';

  const isUncompleted = (r) => {
    if (!r) return false;
    const s = (r.status || '').toLowerCase();
    return s !== 'completed' && s !== 'collected' && s !== 'cancelled';
  };

  // Extract active / current monthly request, prioritizing active unresolved requests with dueReason
  const activeOrDueRequest = 
    (monthlyStatusData?.hasMonthlyRequest && monthlyStatusData?.request && isUncompleted(monthlyStatusData.request) ? monthlyStatusData.request : null) ||
    realRequests.find(r => isUncompleted(r) && Boolean(r.dueReason && r.dueReason.trim())) ||
    realRequests.find(r => isUncompleted(r) && ((r.status || '').toLowerCase().includes('due') || (r.dueStatus || '').toLowerCase().includes('due'))) ||
    realRequests.find(r => isUncompleted(r) && (r.status || '').toLowerCase() === 'scheduled') ||
    realRequests.find(r => isUncompleted(r) && (r.status || '').toLowerCase() === 'pending') ||
    (monthlyStatusData?.hasMonthlyRequest ? monthlyStatusData?.request : null) ||
    realRequests.find(r => Boolean(r.dueReason && r.dueReason.trim())) ||
    realRequests[0] ||
    null;

  const matchedReal = realRequests.find(r => 
    (activeOrDueRequest?.requestId && r.requestId === activeOrDueRequest.requestId) ||
    (activeOrDueRequest?.id && r.id === activeOrDueRequest.id)
  );

  const currentRequest = activeOrDueRequest ? {
    ...activeOrDueRequest,
    ...(matchedReal || {}),
    dueReason: matchedReal?.dueReason || activeOrDueRequest?.dueReason || monthlyStatusData?.request?.dueReason || '',
    dueReasonSubmittedAt: matchedReal?.dueReasonSubmittedAt || activeOrDueRequest?.dueReasonSubmittedAt || monthlyStatusData?.request?.dueReasonSubmittedAt || null,
    dueReasonSubmittedBy: matchedReal?.dueReasonSubmittedBy || activeOrDueRequest?.dueReasonSubmittedBy || monthlyStatusData?.request?.dueReasonSubmittedBy || null,
    citizenApprovalStatus: matchedReal?.citizenApprovalStatus || activeOrDueRequest?.citizenApprovalStatus || monthlyStatusData?.request?.citizenApprovalStatus || 'Pending',
    adminApprovalStatus: matchedReal?.adminApprovalStatus || activeOrDueRequest?.adminApprovalStatus || monthlyStatusData?.request?.adminApprovalStatus || 'Pending',
  } : null;

  const hasRequest = Boolean(currentRequest);
  const schedStatus = getPickupScheduleStatus(currentRequest);
  const isCompleted = schedStatus.isCompleted;
  const isScheduled = schedStatus.isScheduled;
  const isPending = schedStatus.isPending;
  const isDue = schedStatus.isDue;
  const isToday = schedStatus.isToday;

  // Worker contact
  const senaWorkerName = assignedWorker?.fullName || 'Haritha Karma Sena Unit';
  const senaWorkerPhone = assignedWorker?.phoneNumber || '+91 98470 12345';

  const scheduledDateFormatted = currentRequest?.scheduledDate || currentRequest?.collectionDate
    ? formatPickupDate(currentRequest.scheduledDate || currentRequest.collectionDate, {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
    : '20th – 25th Collection Window';

  const collectedDateFormatted = currentRequest?.collectedAt
    ? formatPickupDate(currentRequest.collectedAt, {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
    : scheduledDateFormatted;

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fadeIn pb-12">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-[#0a4d2c] via-[#0f5b37] to-emerald-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-1/4 -translate-y-1/4 w-72 h-72 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-emerald-200 text-xs font-semibold mb-2">
              <Calendar className="w-3.5 h-3.5 text-emerald-300" />
              <span>Haritha Karma Sena Doorstep Collection Tracker</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              My Collection Schedule
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100/90 font-medium mt-1 max-w-xl">
              Real-time schedule, doorstep pickup dates, verification status, and request details for{' '}
              <span className="font-extrabold text-white underline">{wardId} • {panchayatName}</span>.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setActiveTab && setActiveTab('Pickup Request')}
              className="px-4 py-2.5 bg-white text-[#0a4d2c] hover:bg-emerald-50 font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <Truck className="w-4 h-4 text-[#0a4d2c]" />
              <span>{hasRequest ? 'View Full Request' : 'Submit Pickup Request'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Upcoming / Current Collection Spotlight Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-emerald-100/80 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
          <div>
            <span className="text-[10px] uppercase font-extrabold tracking-wider text-gray-500 block">
              Current Calendar Cycle
            </span>
            <h2 className="text-xl font-extrabold text-gray-900 flex items-center gap-2 mt-0.5">
              <span>Monthly Doorstep Plastic Pickup</span>
              {hasRequest ? (
                <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full border flex items-center gap-1 ${schedStatus.badgeClass}`}>
                  {isDue ? (
                    <AlertTriangle className="w-3.5 h-3.5" />
                  ) : isToday ? (
                    <Bell className="w-3.5 h-3.5" />
                  ) : isCompleted ? (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  ) : isScheduled ? (
                    <Calendar className="w-3.5 h-3.5" />
                  ) : (
                    <Clock className="w-3.5 h-3.5" />
                  )}
                  {schedStatus.label}
                </span>
              ) : (
                <span className="px-2.5 py-0.5 bg-gray-100 text-gray-700 text-xs font-bold rounded-full">
                  No Active Request
                </span>
              )}
            </h2>
          </div>

          <div className="flex items-center gap-2 bg-emerald-50/80 border border-emerald-200 px-3.5 py-2 rounded-2xl text-xs">
            <Clock className="w-4 h-4 text-[#0a4d2c]" />
            <span className="text-gray-600 font-medium">Collection Window:</span>
            <span className="font-extrabold text-[#0a4d2c]">
              20th – 25th of {currentRequest?.collectionPeriodName || getAssignedCollectionPeriod().periodName}
            </span>
          </div>
        </div>

        {/* Big Date Display Banner */}
        {(isDue || Boolean(currentRequest?.dueReason) || schedStatus.isReasonSubmitted) ? (
          <div className="space-y-4">
            <div className={`p-5 rounded-2xl border-2 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 ${
              schedStatus.isApprovedForReschedule
                ? 'bg-teal-50 border-teal-300'
                : schedStatus.isReasonSubmitted
                  ? 'bg-amber-50 border-amber-300'
                  : 'bg-rose-50 border-rose-300'
            }`}>
              <div className="flex items-center gap-4">
                <div className={`p-3 text-white rounded-2xl shadow-md shrink-0 ${
                  schedStatus.isApprovedForReschedule
                    ? 'bg-teal-600'
                    : schedStatus.isReasonSubmitted
                      ? 'bg-amber-600'
                      : 'bg-rose-600'
                }`}>
                  {schedStatus.isApprovedForReschedule ? (
                    <CheckCircle2 className="w-7 h-7 text-white" />
                  ) : (
                    <AlertTriangle className="w-7 h-7 text-white" />
                  )}
                </div>
                <div className="space-y-1">
                  <span className={`text-[11px] font-black uppercase tracking-wider block ${
                    schedStatus.isApprovedForReschedule
                      ? 'text-teal-900'
                      : schedStatus.isReasonSubmitted
                        ? 'text-amber-900'
                        : 'text-rose-800'
                  }`}>
                    {schedStatus.isApprovedForReschedule
                      ? 'Approved for Reschedule ✓'
                      : schedStatus.isReasonSubmitted
                        ? 'Due / Review Required'
                        : 'Pickup Status: Due'}
                  </span>
                  <span className="text-lg sm:text-xl font-black text-gray-950">
                    Scheduled Collection Date Passed ({scheduledDateFormatted})
                  </span>
                  <p className="text-xs text-gray-700 font-medium">
                    {schedStatus.isApprovedForReschedule
                      ? 'Panchayat Admin has approved the missed pickup. Your assigned worker is authorized to reschedule the collection date (20th–25th).'
                      : schedStatus.isReasonSubmitted
                        ? `Reason from ${schedStatus.dueReasonSubmittedBy || 'Worker'}: "${schedStatus.dueReason}"`
                        : "The scheduled pickup date has passed and waste was not collected. Waiting for your assigned worker to record the missed pickup reason."}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start md:self-center shrink-0">
                <span className="px-3.5 py-1.5 bg-white text-gray-700 border border-gray-300 text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Citizen View-Only</span>
                </span>
              </div>
            </div>

            {/* View-Only Worker Reason & Admin Status Card */}
            {(schedStatus.isReasonSubmitted || Boolean(currentRequest?.dueReason) || Boolean(schedStatus.dueReason)) && (
              <div className="bg-white p-5 rounded-3xl border-2 border-amber-300 shadow-md space-y-4 animate-fadeIn">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-amber-600" />
                      <span>Missed Pickup Review & Reschedule Status</span>
                    </h4>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Citizens have view-only access. Pickup rescheduling requires Panchayat Admin review and is scheduled by the worker.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-xs shrink-0">
                    <span className="font-semibold text-gray-500">Admin Review:</span>
                    <span className={`px-2.5 py-0.5 rounded-full font-bold text-xs border ${
                      schedStatus.adminApprovalStatus === 'Approved'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        : schedStatus.adminApprovalStatus === 'Rejected'
                          ? 'bg-red-50 text-red-800 border-red-300'
                          : 'bg-amber-50 text-amber-800 border-amber-300'
                    }`}>
                      {schedStatus.adminApprovalStatus === 'Approved'
                        ? '✓ Approved'
                        : schedStatus.adminApprovalStatus === 'Rejected'
                          ? '✕ Rejected'
                          : '⏳ Pending Review'}
                    </span>
                  </div>
                </div>

                {/* Prominent Worker Reason Callout */}
                <div className="bg-amber-50/80 p-4 rounded-2xl border border-amber-200 space-y-2">
                  <div className="flex items-center justify-between text-xs font-extrabold text-amber-900">
                    <span className="flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                      <MessageSquare className="w-3.5 h-3.5 text-amber-600" />
                      Reason Recorded by Worker ({schedStatus.dueReasonSubmittedBy || currentRequest?.dueReasonSubmittedBy || 'Haritha Karma Sena'}):
                    </span>
                    {(schedStatus.dueReasonSubmittedAt || currentRequest?.dueReasonSubmittedAt) && (
                      <span className="text-[11px] text-amber-700 font-semibold">
                        {formatPickupDate(schedStatus.dueReasonSubmittedAt || currentRequest?.dueReasonSubmittedAt)}
                      </span>
                    )}
                  </div>
                  <div className="bg-white p-3.5 rounded-xl border border-amber-100 text-gray-900 font-bold text-sm shadow-2xs">
                    "{schedStatus.dueReason || currentRequest?.dueReason}"
                  </div>
                </div>

                {/* Status Guidance */}
                <div className="pt-1">
                  {schedStatus.adminApprovalStatus === 'Approved' ? (
                    <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-xl flex items-start gap-2.5">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                      <div className="text-xs">
                        <span className="font-extrabold text-emerald-900 block">
                          Admin Approved • Reschedule Unlocked for Worker
                        </span>
                        <p className="text-emerald-800 mt-0.5">
                          Panchayat Admin has approved the missed pickup. Your assigned worker is authorized to select a new collection date within the 20th–25th window. You will be notified when the new date is confirmed.
                        </p>
                      </div>
                    </div>
                  ) : schedStatus.adminApprovalStatus === 'Rejected' ? (
                    <div className="p-3.5 bg-rose-50 border border-rose-300 rounded-xl flex items-start gap-2.5">
                      <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                      <div className="text-xs">
                        <span className="font-extrabold text-rose-900 block">
                          Admin Rejected • Pickup Locked
                        </span>
                        <p className="text-rose-800 mt-0.5">
                          Panchayat Admin reviewed and rejected the reason. This pickup remains locked. Contact Panchayat helpline for inquiries.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-xl flex items-start gap-2.5">
                      <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                      <div className="text-xs">
                        <span className="font-extrabold text-amber-900 block">
                          Awaiting Admin Review • Rescheduling Locked
                        </span>
                        <p className="text-amber-800 mt-0.5">
                          The worker's reason is awaiting review and approval by Panchayat Admin. The worker is not allowed to reschedule before Admin approval.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : isToday ? (
          <div className="p-5 bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 text-white border-2 border-amber-300 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-md">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 backdrop-blur-xs rounded-2xl shadow-md shrink-0">
                <Bell className="w-7 h-7 text-white animate-pulse" />
              </div>
              <div>
                <span className="text-[11px] font-black uppercase tracking-wider text-amber-200 block">
                  Scheduled For Today
                </span>
                <span className="text-xl sm:text-2xl font-black">
                  Your waste pickup is scheduled for today.
                </span>
                <p className="text-xs text-amber-100 font-medium mt-0.5">
                  Haritha Karma Sena workers will arrive for doorstep waste collection today.
                </p>
              </div>
            </div>
            <span className="px-4 py-2 bg-white text-amber-900 text-xs font-extrabold rounded-xl shadow-xs self-start sm:self-center flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-600" /> Today
            </span>
          </div>
        ) : isCompleted ? (
          <div className="p-5 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border-2 border-emerald-400/60 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-[#0a4d2c] text-white rounded-2xl shadow-md shrink-0">
                <CheckCircle2 className="w-7 h-7 text-emerald-300" />
              </div>
              <div>
                <span className="text-[11px] font-black uppercase tracking-wider text-emerald-800 block">
                  Collection Completed On
                </span>
                <span className="text-xl sm:text-2xl font-black text-[#0a4d2c]">
                  {collectedDateFormatted}
                </span>
                <p className="text-xs text-emerald-700 font-medium mt-0.5">
                  Verified with your 4-digit code & logged by Haritha Karma Sena.
                </p>
              </div>
            </div>
            <span className="px-4 py-2 bg-[#0a4d2c] text-white text-xs font-extrabold rounded-xl shadow-xs self-start sm:self-center flex items-center gap-1.5">
              <Check className="w-4 h-4 text-emerald-300" /> Card Logged
            </span>
          </div>
        ) : isScheduled ? (
          <div className="p-5 bg-gradient-to-r from-emerald-100/90 to-teal-100/80 border-2 border-emerald-300 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-[#0a4d2c] text-white rounded-2xl shadow-md shrink-0">
                <Calendar className="w-7 h-7 text-emerald-300" />
              </div>
              <div>
                <span className="text-[11px] font-black uppercase tracking-wider text-[#0a4d2c] block">
                  Scheduled Collection Date
                </span>
                <span className="text-xl sm:text-2xl font-black text-[#0a4d2c]">
                  {scheduledDateFormatted}
                </span>
                <p className="text-xs text-emerald-900 font-medium mt-0.5">
                  Haritha Karma Sena workers will arrive for doorstep waste collection on this date.
                </p>
              </div>
            </div>
            <span className="px-4 py-2 bg-[#0a4d2c] text-white text-xs font-extrabold rounded-xl shadow-xs self-start sm:self-center flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-emerald-300" /> Confirmed Schedule
            </span>
          </div>
        ) : isPending ? (
          <div className="p-5 bg-amber-50 border-2 border-amber-300 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-500 text-white rounded-2xl shadow-md shrink-0">
                <Clock className="w-7 h-7" />
              </div>
              <div>
                <span className="text-[11px] font-black uppercase tracking-wider text-amber-800 block">
                  Collection Window (20th – 25th)
                </span>
                <span className="text-lg sm:text-xl font-black text-amber-950">
                  Awaiting Haritha Karma Sena Worker Schedule
                </span>
                <p className="text-xs text-amber-800 font-medium mt-0.5">
                  Your request is queued. Assigned ward workers will confirm the collection date shortly.
                </p>
              </div>
            </div>
            <span className="px-4 py-2 bg-amber-200 text-amber-900 text-xs font-extrabold rounded-xl self-start sm:self-center">
              Pending Allocation
            </span>
          </div>
        ) : (
          <div className="p-6 bg-gray-50 border border-gray-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-center sm:text-left">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gray-200 text-gray-700 rounded-2xl shrink-0">
                <Info className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-base font-bold text-gray-900">No Pickup Request Submitted This Month</h4>
                <p className="text-xs text-gray-500 mt-0.5">
                  Submit your monthly request before the 20th to schedule dry plastic collection for your household.
                </p>
              </div>
            </div>
            <button
              onClick={() => setActiveTab && setActiveTab('Pickup Request')}
              className="px-5 py-2.5 bg-[#0a4d2c] hover:bg-emerald-800 text-white text-xs font-extrabold rounded-xl shadow-md transition-all shrink-0 cursor-pointer"
            >
              Submit Request Now
            </button>
          </div>
        )}

        {/* 4-Step Lifecycle Timeline */}
        <div className="pt-2">
          <span className="text-[11px] uppercase font-extrabold tracking-wider text-gray-400 block mb-4">
            Collection Lifecycle Tracking
          </span>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            {/* Step 1 */}
            <div className="p-4 rounded-2xl border bg-white space-y-2 border-emerald-200 shadow-2xs">
              <div className={`w-8 h-8 rounded-full mx-auto flex items-center justify-center font-black text-xs ${
                hasRequest ? 'bg-[#0a4d2c] text-white' : 'bg-gray-100 text-gray-400'
              }`}>
                {hasRequest ? <Check className="w-4 h-4" /> : '1'}
              </div>
              <div>
                <p className="text-xs font-bold text-gray-900">1. Request Placed</p>
                <p className="text-[10px] text-gray-500 font-medium">Monthly limit checked</p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="p-4 rounded-2xl border bg-white space-y-2 border-emerald-200 shadow-2xs">
              <div className={`w-8 h-8 rounded-full mx-auto flex items-center justify-center font-black text-xs ${
                isScheduled || isCompleted ? 'bg-[#0a4d2c] text-white' : 'bg-gray-100 text-gray-400'
              }`}>
                {isScheduled || isCompleted ? <Check className="w-4 h-4" /> : '2'}
              </div>
              <div>
                <p className="text-xs font-bold text-gray-900">2. Date Scheduled</p>
                <p className="text-[10px] text-gray-500 font-medium">20th–25th window set</p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="p-4 rounded-2xl border bg-white space-y-2 border-emerald-200 shadow-2xs">
              <div className={`w-8 h-8 rounded-full mx-auto flex items-center justify-center font-black text-xs ${
                isCompleted ? 'bg-[#0a4d2c] text-white' : isScheduled ? 'bg-amber-500 text-white animate-pulse' : 'bg-gray-100 text-gray-400'
              }`}>
                {isCompleted ? <Check className="w-4 h-4" /> : '3'}
              </div>
              <div>
                <p className="text-xs font-bold text-gray-900">3. Out for Collection</p>
                <p className="text-[10px] text-gray-500 font-medium">HKS worker at ward</p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="p-4 rounded-2xl border bg-white space-y-2 border-emerald-200 shadow-2xs">
              <div className={`w-8 h-8 rounded-full mx-auto flex items-center justify-center font-black text-xs ${
                isCompleted ? 'bg-[#0a4d2c] text-white ring-4 ring-emerald-100' : 'bg-gray-100 text-gray-400'
              }`}>
                {isCompleted ? <Check className="w-4 h-4" /> : '4'}
              </div>
              <div>
                <p className="text-xs font-bold text-gray-900">4. Handover & Verified</p>
                <p className="text-[10px] text-gray-500 font-medium">Code verified & logged</p>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Request Metadata & Verification Code */}
        {hasRequest && (
          <div className="bg-emerald-50/50 border border-emerald-100 p-5 rounded-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-emerald-100 pb-3">
              <div className="flex items-center gap-2 text-[#0a4d2c]">
                <Package className="w-5 h-5 text-[#0a4d2c]" />
                <h3 className="text-sm font-extrabold text-gray-900">
                  Request Specifications
                </h3>
              </div>
              <span className="text-xs font-extrabold text-[#0a4d2c] bg-white px-3 py-1 rounded-xl border border-emerald-200">
                ID: {currentRequest.requestId || 'REQ-AUTO'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-gray-500 font-medium block">Waste Category:</span>
                <span className="font-bold text-gray-900">{currentRequest.overallCategory || 'Recyclable Plastic'}</span>
              </div>

              <div>
                <span className="text-gray-500 font-medium block">Estimated Volume:</span>
                <span className="font-bold text-gray-900">{currentRequest.estimatedVolume || 'Medium (Household Standard)'}</span>
              </div>

              <div>
                <span className="text-gray-500 font-medium block">Requested Date:</span>
                <span className="font-bold text-gray-900">
                  {currentRequest.requestedAt ? formatPickupDate(currentRequest.requestedAt) : 'This Month'}
                </span>
              </div>

              <div>
                <span className="text-gray-500 font-medium block">Scheduled Collection:</span>
                <span className="font-extrabold text-[#0a4d2c]">{scheduledDateFormatted}</span>
              </div>
            </div>

            {/* 4-digit code banner */}
            {currentRequest.verificationCode && (
              <div className="p-4 bg-white border border-emerald-200 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xs">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-[#0a4d2c] text-white rounded-xl shrink-0">
                    {isCompleted ? <ShieldCheck className="w-5 h-5 text-emerald-300" /> : <KeyRound className="w-5 h-5 text-emerald-300" />}
                  </div>
                  <div>
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#0a4d2c] block">
                      {isCompleted ? 'Verification Code (Verified)' : 'Pickup Verification Code'}
                    </span>
                    <p className="text-xs text-gray-600 font-medium">
                      {isCompleted
                        ? 'Code was verified by the Haritha Karma Sena worker upon waste handover.'
                        : 'Provide this code to the visiting Haritha Karma Sena worker upon waste collection.'}
                    </p>
                  </div>
                </div>

                <div className="bg-emerald-50 px-5 py-2.5 rounded-2xl border-2 border-[#0a4d2c] text-center shrink-0">
                  <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
                    {isCompleted ? 'Verified OTP' : 'Your OTP'}
                  </span>
                  <span className="text-2xl font-black font-mono tracking-[8px] text-[#0a4d2c]">
                    {currentRequest.verificationCode}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Assigned Team & Instructions Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Team Card */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-emerald-100/80 space-y-4">
          <div className="flex items-center gap-2 text-[#0a4d2c]">
            <User className="w-5 h-5 text-[#0a4d2c]" />
            <h3 className="text-sm font-extrabold text-gray-900">
              Assigned Haritha Karma Sena Team
            </h3>
          </div>

          <div className="space-y-3 text-xs bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100">
            <div className="flex justify-between py-1 border-b border-emerald-100">
              <span className="text-gray-500 font-medium">Ward Jurisdiction:</span>
              <span className="font-extrabold text-gray-900">{wardId} • {panchayatName}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-emerald-100">
              <span className="text-gray-500 font-medium">Team In-charge:</span>
              <span className="font-bold text-gray-900">{senaWorkerName}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-gray-500 font-medium">Helpline / Phone:</span>
              <a
                href={`tel:${senaWorkerPhone}`}
                className="font-extrabold text-[#0a4d2c] flex items-center gap-1 hover:underline"
              >
                <Phone className="w-3.5 h-3.5" />
                {senaWorkerPhone}
              </a>
            </div>
          </div>

          <p className="text-[11px] text-gray-500 leading-relaxed">
            The Haritha Karma Sena squad operates on designated collection routes within {wardId}. For special collection requirements, contact the supervisor.
          </p>
        </div>

        {/* Preparation Guidelines Card */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-emerald-100/80 space-y-4">
          <div className="flex items-center gap-2 text-[#0a4d2c]">
            <Sparkles className="w-5 h-5 text-[#0a4d2c]" />
            <h3 className="text-sm font-extrabold text-gray-900">
              Pickup Preparation Checklist
            </h3>
          </div>

          <ul className="space-y-2.5 text-xs text-gray-600">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span><strong>Clean & Dry:</strong> Rinse milk packets, curd covers, and plastic food containers before storing.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span><strong>Bundle Neatly:</strong> Place dried plastic in sacks or bags and keep near gate on the collection day.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span><strong>Keep OTP Ready:</strong> Have your 4-digit verification code ready to verify upon handover.</span>
            </li>
          </ul>

          <div className="pt-2">
            <button
              onClick={() => setActiveTab && setActiveTab('Help & Guidelines')}
              className="text-xs font-bold text-[#0a4d2c] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>View full segregation & eligibility rules</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CitizenSchedule;
