import React, { useState, useEffect } from 'react';
import { Home, MapPin, Truck, CheckCircle2, AlertCircle, Clock, Calendar, Info, Send, Package } from 'lucide-react';
import { createPickupRequest, getMonthlyStatus } from '../services/pickupRequestService';

const PickupRequest = ({ citizenData }) => {
  // Steps: 'summary' | 'success'
  const [step, setStep] = useState('summary');

  // Monthly Limit Check State
  const [checkingMonthlyStatus, setCheckingMonthlyStatus] = useState(true);
  const [existingMonthlyRequest, setExistingMonthlyRequest] = useState(null);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState(null);
  const [error, setError] = useState('');

  // Extract Citizen details
  const userObj = JSON.parse(localStorage.getItem('user') || '{}');
  const citizenId = citizenData?.citizenId || citizenData?.id || citizenData?._id || userObj.citizenId || 'CIT001';
  const houseName = citizenData?.houseName || userObj.houseName || '';
  const houseNumber = citizenData?.houseNumber || userObj.houseNumber || 'Not Set';
  const address = citizenData?.address || userObj.address || 'Address Not Set';
  const wardId = citizenData?.wardId || userObj.wardId || 'Ward 1';
  const panchayatName = citizenData?.panchayatName || userObj.panchayatName || 'Ponkunnam';
  const isProfileVerified = Boolean(
    citizenData?.isVerified ||
    citizenData?.status === 'Verified' ||
    userObj?.isVerified ||
    userObj?.status === 'Verified'
  );

  // Check if citizen has already submitted a request for current calendar month
  const checkMonthlyLimit = async () => {
    setCheckingMonthlyStatus(true);
    try {
      const statusRes = await getMonthlyStatus(citizenId);
      if (statusRes?.hasMonthlyRequest && statusRes?.request) {
        setExistingMonthlyRequest(statusRes.request);
      } else {
        setExistingMonthlyRequest(null);
      }
    } catch (err) {
      console.warn("Could not verify monthly pickup limit:", err);
    } finally {
      setCheckingMonthlyStatus(false);
    }
  };

  useEffect(() => {
    checkMonthlyLimit();
  }, [citizenId]);

  // Direct Submission to POST /api/PickupRequest
  const handleSubmitPickupRequest = async () => {
    setIsSubmitting(true);
    setError('');

    const payload = {
      citizenId: citizenId,
      overallCategory: 'Recyclable Plastic'
    };

    try {
      const response = await createPickupRequest(payload);
      setSubmissionResult({
        requestId: response.requestId || response.id || `REQ-${Math.floor(1000 + Math.random() * 9000)}`,
        status: response.status || 'Pending',
        message: response.message || 'Pickup request submitted successfully.'
      });
      setStep('success');
      checkMonthlyLimit();
    } catch (err) {
      console.error('Error submitting pickup request:', err);
      setError(
        err.response?.data?.message ||
        err.response?.data ||
        err.message ||
        'Failed to submit pickup request.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch ((status || '').toLowerCase()) {
      case 'scheduled':
      case 'accepted':
        return 'bg-[#0a4d2c] text-white border-emerald-800';
      case 'completed':
      case 'collected':
        return 'bg-blue-100 text-blue-900 border-blue-300';
      default:
        return 'bg-amber-100 text-amber-900 border-amber-300';
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fadeIn pb-12">
      {/* Top Banner Card showing Auto-filled Citizen Profile Info */}
      <div className="bg-gradient-to-r from-[#0a4d2c] via-[#0f5b37] to-emerald-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-1/4 -translate-y-1/4 w-72 h-72 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-emerald-200 text-xs font-semibold mb-2">
                <Truck className="w-3.5 h-3.5 text-emerald-300" />
                <span>Haritha Karma Sena Doorstep Plastic Pickup</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Monthly Plastic Pickup Request
              </h1>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs bg-emerald-900/90 border border-emerald-400/40 text-emerald-200 px-3 py-1.5 rounded-xl font-bold">
                Citizen ID: {citizenId}
              </span>
            </div>
          </div>

          {/* Read-Only Citizen Details */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-2 border-t border-emerald-700/60">
            <div className="bg-emerald-950/40 border border-emerald-500/20 p-2.5 rounded-xl">
              <span className="text-emerald-300 text-[10px] uppercase font-bold block">House Name</span>
              <span className="font-extrabold truncate block text-white">{houseName || 'N/A'}</span>
            </div>

            <div className="bg-emerald-950/40 border border-emerald-500/20 p-2.5 rounded-xl">
              <span className="text-emerald-300 text-[10px] uppercase font-bold block">House Number</span>
              <span className="font-extrabold truncate block text-white">{houseNumber}</span>
            </div>

            <div className="bg-emerald-950/40 border border-emerald-500/20 p-2.5 rounded-xl">
              <span className="text-emerald-300 text-[10px] uppercase font-bold block">Address</span>
              <span className="font-extrabold truncate block text-white">{address}</span>
            </div>

            <div className="bg-emerald-950/40 border border-emerald-500/20 p-2.5 rounded-xl">
              <span className="text-emerald-300 text-[10px] uppercase font-bold block">Ward & Location</span>
              <span className="font-extrabold truncate block text-white">{wardId} • {panchayatName}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Scheduled Collection Window Notice Banner (15th - 25th) */}
      <div className="bg-emerald-50/90 border border-emerald-200/90 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-emerald-950 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[#0a4d2c] text-white rounded-xl shrink-0 shadow-xs">
            <Calendar className="w-5 h-5 text-emerald-300" />
          </div>
          <div>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#0a4d2c] block">
              Scheduled Monthly Collection Window
            </span>
            <p className="text-xs font-semibold text-emerald-900 mt-0.5">
              Haritha Karma Sena workers collect requested waste between <span className="font-extrabold text-[#0a4d2c] underline">15th to 25th of every month</span>.
            </p>
          </div>
        </div>

        <span className="px-3 py-1.5 bg-[#0a4d2c] text-white text-xs font-extrabold rounded-xl shrink-0 self-start sm:self-center shadow-xs">
          Collection: 15th – 25th
        </span>
      </div>

      {!isProfileVerified ? (
        /* PENDING ADMIN VERIFICATION BANNER */
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-amber-200 space-y-6">
          <div className="p-5 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-4 text-amber-900">
            <div className="p-3 bg-amber-500 text-white rounded-xl shrink-0 shadow-xs">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-extrabold text-amber-900">
                Profile Verification Required by Admin
              </h3>
              <p className="text-xs text-amber-800 leading-relaxed">
                Your completed profile must be verified by an Administrator before you can submit plastic waste pickup requests. Your profile has been submitted and is currently <span className="font-extrabold underline">Pending Verification</span>.
              </p>
            </div>
          </div>
          <div className="text-xs text-gray-500 bg-gray-50 p-4 rounded-xl border border-gray-100 flex items-center justify-between">
            <span>Current Status: <strong className="text-amber-700 font-bold">{citizenData?.status || 'Pending Verification'}</strong></span>
            <span className="text-[11px] text-gray-400">Please check back after Admin approval.</span>
          </div>
        </div>
      ) : checkingMonthlyStatus ? (
        <div className="bg-white rounded-3xl p-8 text-center border border-emerald-100 shadow-sm space-y-3">
          <div className="w-8 h-8 border-3 border-[#0a4d2c] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-gray-500 font-medium">Checking monthly pickup request status...</p>
        </div>
      ) : existingMonthlyRequest && step !== 'success' ? (
        /* MONTHLY LIMIT REACHED BANNER */
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-emerald-200/80 space-y-6">
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3 text-emerald-900">
            <Info className="w-5 h-5 text-[#0a4d2c] shrink-0 mt-0.5" />
            <div>
              <h3 className="text-base font-extrabold text-[#0a4d2c]">
                Your monthly plastic pickup request has already been submitted.
              </h3>
              <p className="text-xs text-emerald-800 mt-1">
                A citizen can submit only ONE plastic pickup request per month. Below are the details of your active request for the current calendar month.
              </p>
            </div>
          </div>

          {/* Active Monthly Request Status Card */}
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-200 pb-3">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-gray-500 font-bold block">
                  Current Month Request ID
                </span>
                <span className="text-lg font-extrabold text-[#0a4d2c]">
                  {existingMonthlyRequest.requestId}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-500">Status:</span>
                <span className={`px-3 py-1 text-xs font-extrabold rounded-full border ${getStatusBadgeClass(existingMonthlyRequest.status)}`}>
                  {existingMonthlyRequest.status}
                </span>
              </div>
            </div>

            {/* Highlighted Scheduled Collection Date Banner */}
            {existingMonthlyRequest.collectionDate ? (
              <div className="p-4 bg-emerald-100/90 border border-emerald-300 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#0a4d2c] text-white rounded-xl shrink-0">
                    <Calendar className="w-5 h-5 text-emerald-300" />
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#0a4d2c] block">
                      Scheduled Collection Date
                    </span>
                    <span className="text-base font-extrabold text-[#0a4d2c]">
                      {new Date(existingMonthlyRequest.collectionDate).toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                </div>
                <span className="px-3 py-1 bg-[#0a4d2c] text-white font-extrabold text-xs rounded-xl shrink-0 self-start sm:self-center shadow-xs">
                  Worker Scheduled
                </span>
              </div>
            ) : (
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between text-xs">
                <span className="font-bold text-amber-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-700 shrink-0" />
                  Scheduled Collection Date:
                </span>
                <span className="font-extrabold text-amber-900">
                  Awaiting worker schedule (15th–25th Window)
                </span>
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs pt-1">
              <div>
                <span className="text-gray-500 font-medium block">Requested Date:</span>
                <span className="font-bold text-gray-800">
                  {existingMonthlyRequest.requestedAt
                    ? new Date(existingMonthlyRequest.requestedAt).toLocaleDateString('en-US', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })
                    : 'This Month'}
                </span>
              </div>

              <div>
                <span className="text-gray-500 font-medium block">Collection Window:</span>
                <span className="font-extrabold text-[#0a4d2c]">15th – 25th of Month</span>
              </div>

              <div>
                <span className="text-gray-500 font-medium block">Waste Type:</span>
                <span className="font-bold text-[#0a4d2c]">Recyclable Plastic</span>
              </div>

              <div>
                <span className="text-gray-500 font-medium block">Ward / Panchayat:</span>
                <span className="font-bold text-[#0a4d2c]">{wardId} • {panchayatName}</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* DIRECT PICKUP REQUEST CONFIRMATION */
        step === 'summary' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-emerald-100/80 space-y-6 animate-fadeIn">
            {/* Header */}
            <div className="border-b border-gray-100 pb-4">
              <h2 className="text-xl font-extrabold text-gray-900">
                Confirm Monthly Plastic Pickup Request
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Please verify your household residence details before submitting your monthly request to Haritha Karma Sena.
              </p>
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

              {/* Waste Details & Schedule Window Card */}
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

                  <div className="p-3.5 bg-white border border-emerald-200 rounded-xl text-xs text-emerald-900 mt-2 space-y-1">
                    <span className="font-extrabold block text-[#0a4d2c]">Monthly Collection Notice:</span>
                    <p className="text-gray-600 leading-relaxed text-[11px]">
                      Haritha Karma Sena workers will collect your recyclable plastic waste during the 15th–25th monthly collection window. Please keep plastic items clean, dry, and bundled.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex items-center justify-end pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={handleSubmitPickupRequest}
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
        )
      )}

      {/* SUCCESS CONFIRMATION SCREEN */}
      {step === 'success' && (
        <div className="bg-white rounded-3xl p-8 sm:p-12 shadow-sm border border-emerald-100/80 text-center space-y-6 max-w-2xl mx-auto">
          <div className="w-20 h-20 rounded-full bg-emerald-100 text-[#0a4d2c] flex items-center justify-center mx-auto shadow-md animate-bounce">
            <CheckCircle2 className="w-10 h-10 text-[#0a4d2c]" />
          </div>

          <div className="space-y-2">
            <span className="px-3 py-1 bg-emerald-100 text-[#0a4d2c] text-xs font-bold rounded-full inline-block">
              Request Submitted
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
              Pickup request submitted successfully
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 max-w-md mx-auto">
              Your monthly plastic pickup request has been assigned to Haritha Karma Sena waste collectors for {wardId}.
            </p>
          </div>

          {/* Request ID & Status Card */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 grid grid-cols-2 gap-4 max-w-md mx-auto text-center">
            <div>
              <span className="text-[11px] text-gray-500 font-bold uppercase tracking-wider block">
                Generated Request ID
              </span>
              <span className="text-lg font-extrabold text-[#0a4d2c]">
                {submissionResult?.requestId}
              </span>
            </div>

            <div>
              <span className="text-[11px] text-gray-500 font-bold uppercase tracking-wider block">
                Status
              </span>
              <span className="inline-flex items-center gap-1 text-sm font-extrabold text-amber-700 bg-amber-100 px-3 py-1 rounded-full mt-1">
                <Clock className="w-3.5 h-3.5" />
                {submissionResult?.status || 'Pending'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PickupRequest;
