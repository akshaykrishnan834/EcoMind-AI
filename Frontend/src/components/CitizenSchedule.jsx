import React from 'react';
import {
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
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
  Info
} from 'lucide-react';

const CitizenSchedule = ({
  citizenData,
  monthlyStatusData,
  realRequests = [],
  assignedWorker,
  setActiveTab
}) => {
  const userObj = JSON.parse(localStorage.getItem('user') || '{}');
  const citizenName = citizenData?.fullName || userObj.fullName || 'Citizen';
  const wardId = citizenData?.wardId || userObj.wardId || 'Ward 1';
  const panchayatName = citizenData?.panchayatName || userObj.panchayatName || 'Chirakkadavu';

  // Extract active / current monthly request
  const currentRequest = monthlyStatusData?.request || realRequests.find(
    (r) =>
      (r.status || '').toLowerCase() === 'pending' ||
      (r.status || '').toLowerCase() === 'scheduled' ||
      (r.status || '').toLowerCase() === 'completed' ||
      (r.status || '').toLowerCase() === 'collected'
  );

  const status = (currentRequest?.status || '').toLowerCase();
  const isCompleted = status === 'completed' || status === 'collected';
  const isScheduled = status === 'scheduled' || status === 'accepted';
  const isPending = status === 'pending';
  const hasRequest = Boolean(currentRequest);

  const now = new Date();
  const reqDate = new Date(currentRequest?.collectionDate || currentRequest?.requestedAt);
  const isPastMonth = Boolean(
    currentRequest && !isNaN(reqDate.getTime()) && (
      reqDate.getFullYear() < now.getFullYear() ||
      (reqDate.getFullYear() === now.getFullYear() && reqDate.getMonth() < now.getMonth())
    )
  );
  const isFailed = hasRequest && !isCompleted && isPastMonth;

  // Worker contact
  const senaWorkerName = assignedWorker?.fullName || 'Haritha Karma Sena Unit';
  const senaWorkerPhone = assignedWorker?.phoneNumber || '+91 98470 12345';

  // Format date helper
  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  const scheduledDateFormatted = currentRequest?.collectionDate
    ? formatDate(currentRequest.collectionDate)
    : '15th – 25th Collection Window';

  const collectedDateFormatted = currentRequest?.collectedAt
    ? formatDate(currentRequest.collectedAt)
    : currentRequest?.collectionDate
      ? formatDate(currentRequest.collectionDate)
      : 'This Month';

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
              {isFailed ? (
                <span className="px-2.5 py-0.5 bg-rose-100 text-rose-800 text-xs font-bold rounded-full flex items-center gap-1">
                  <XCircle className="w-3.5 h-3.5 text-rose-600" /> Failed to Complete
                </span>
              ) : isCompleted ? (
                <span className="px-2.5 py-0.5 bg-emerald-100 text-[#0a4d2c] text-xs font-bold rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Completed
                </span>
              ) : isScheduled ? (
                <span className="px-2.5 py-0.5 bg-emerald-700 text-white text-xs font-bold rounded-full flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> Scheduled
                </span>
              ) : isPending ? (
                <span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 text-xs font-bold rounded-full flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> Pending Schedule
                </span>
              ) : !hasRequest ? (
                <span className="px-2.5 py-0.5 bg-gray-100 text-gray-700 text-xs font-bold rounded-full">
                  No Active Request
                </span>
              ) : null}
            </h2>
          </div>

          <div className="flex items-center gap-2 bg-emerald-50/80 border border-emerald-200 px-3.5 py-2 rounded-2xl text-xs">
            <Clock className="w-4 h-4 text-[#0a4d2c]" />
            <span className="text-gray-600 font-medium">Standard Window:</span>
            <span className="font-extrabold text-[#0a4d2c]">15th – 25th of Month</span>
          </div>
        </div>

        {/* Big Date Display Banner */}
        {isFailed ? (
          <div className="p-5 bg-rose-50 border-2 border-rose-300 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-rose-600 text-white rounded-2xl shadow-md shrink-0">
                <XCircle className="w-7 h-7 text-white" />
              </div>
              <div>
                <span className="text-[11px] font-black uppercase tracking-wider text-rose-800 block">
                  Collection Cycle Expired
                </span>
                <span className="text-lg sm:text-xl font-black text-rose-950">
                  Failed to Complete (Month Passed)
                </span>
                <p className="text-xs text-rose-700 font-medium mt-0.5">
                  The collection cycle for this month has passed without waste handover. A new pickup request can be submitted.
                </p>
              </div>
            </div>
            <span className="px-4 py-2 bg-rose-200 text-rose-900 text-xs font-extrabold rounded-xl shadow-xs self-start sm:self-center">
              Failed
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
                  Collection Window (15th – 25th)
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
                  Submit your monthly request before the 15th to schedule dry plastic collection for your household.
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
                <p className="text-[10px] text-gray-500 font-medium">15th–25th window set</p>
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
                  {currentRequest.requestedAt ? formatDate(currentRequest.requestedAt) : 'This Month'}
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
