import React, { useState, useEffect } from 'react';
import { Sparkles, Home, MapPin, Truck, CheckCircle2, AlertCircle, RefreshCw, ArrowLeft, Clock, FileText, Calendar, Info, ShieldCheck } from 'lucide-react';
import WasteImageUpload from './WasteImageUpload';
import AIAnalysisResult from './AIAnalysisResult';
import ManualWasteSelection from './ManualWasteSelection';
import PickupSummary from './PickupSummary';
import { analyzeWasteImage } from '../services/wasteAnalysisService';
import { createPickupRequest, getMonthlyStatus } from '../services/pickupRequestService';

const PickupRequest = ({ citizenData }) => {
  // Navigation & Step state: 'upload' | 'ai_result' | 'manual' | 'summary' | 'success'
  const [step, setStep] = useState('upload');

  // Monthly Limit Check State (Requirement 9)
  const [checkingMonthlyStatus, setCheckingMonthlyStatus] = useState(true);
  const [existingMonthlyRequest, setExistingMonthlyRequest] = useState(null);

  // Request Data state
  const [selectedFile, setSelectedFile] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [confirmedData, setConfirmedData] = useState(null);

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

  // Step 1 -> AI Analysis handler
  const handleAnalyzeImage = async (file) => {
    if (!file) return;
    setIsAnalyzing(true);
    setError('');

    try {
      const result = await analyzeWasteImage(file);
      setAnalysisResult(result);
      setStep('ai_result');
    } catch (err) {
      console.error('Error analyzing waste image:', err);
      setError(
        err.response?.data?.message ||
        err.message ||
        'Could not reach AI analysis backend service. You can choose Manual Entry below.'
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Callback from AI or Manual view to set confirmed items and move to Summary
  const handleWasteConfirmed = (data) => {
    setConfirmedData(data);
    setStep('summary');
    setError('');
  };

  // Final Submission to POST /api/PickupRequest
  const handleSubmitPickupRequest = async () => {
    if (!confirmedData) return;

    setIsSubmitting(true);
    setError('');

    const payload = {
      citizenId: citizenId,
      wasteItems: confirmedData.wasteItems,
      overallCategory: 'Recyclable Plastic',
      aiAnalyzed: confirmedData.aiAnalyzed,
      aiConfidence: confirmedData.aiAnalyzed ? (confirmedData.aiConfidence || 0) : 0,
      segregationAdvice: confirmedData.segregationAdvice || ''
    };

    try {
      const response = await createPickupRequest(payload);
      setSubmissionResult({
        requestId: response.requestId || response.id || `REQ-${Math.floor(1000 + Math.random() * 9000)}`,
        status: response.status || 'Pending',
        message: response.message || 'Pickup request submitted successfully.'
      });
      setStep('success');
      // Refresh monthly status
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
      case 'accepted':
        return 'bg-emerald-100 text-[#0a4d2c] border-emerald-300';
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

      {/* MONTHLY LIMIT CHECKING LOADING STATE */}
      {checkingMonthlyStatus ? (
        <div className="bg-white rounded-3xl p-8 text-center border border-emerald-100 shadow-sm space-y-3">
          <div className="w-8 h-8 border-3 border-[#0a4d2c] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-gray-500 font-medium">Checking monthly pickup request status...</p>
        </div>
      ) : existingMonthlyRequest && step !== 'success' ? (
        /* MONTHLY LIMIT REACHED BANNER (Requirement 9) */
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
                <span className="text-gray-500 font-medium block">Scheduled Date:</span>
                <span className="font-extrabold text-[#0a4d2c]">
                  {existingMonthlyRequest.collectionDate
                    ? new Date(existingMonthlyRequest.collectionDate).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })
                    : 'Pending Schedule'}
                </span>
              </div>

              <div>
                <span className="text-gray-500 font-medium block">Collection Window:</span>
                <span className="font-extrabold text-[#0a4d2c]">15th – 25th of Month</span>
              </div>

              <div>
                <span className="text-gray-500 font-medium block">Service Scope:</span>
                <span className="font-bold text-[#0a4d2c]">Monthly Recyclable Waste</span>
              </div>
            </div>

            {/* Waste Items breakdown */}
            {existingMonthlyRequest.wasteItems && existingMonthlyRequest.wasteItems.length > 0 && (
              <div className="pt-2">
                <span className="text-xs text-gray-500 font-medium block mb-2">Submitted Plastic Items:</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {existingMonthlyRequest.wasteItems.map((item, idx) => (
                    <div key={idx} className="bg-white p-2.5 rounded-xl border border-gray-200 text-xs flex justify-between items-center font-bold">
                      <span>{item.type}</span>
                      <span className="px-2 py-0.5 bg-emerald-100 text-[#0a4d2c] rounded-md">Qty: {item.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* NORMAL CREATION STEP WORKFLOW */
        <>
          {step === 'upload' && (
            <WasteImageUpload
              onImageSelected={(file) => setSelectedFile(file)}
              onAnalyze={handleAnalyzeImage}
              onSwitchToManual={() => {
                setStep('manual');
                setError('');
              }}
              isAnalyzing={isAnalyzing}
              error={error}
            />
          )}

          {step === 'ai_result' && (
            <AIAnalysisResult
              analysisResult={analysisResult}
              onConfirmWaste={handleWasteConfirmed}
              onRetakePhoto={() => {
                setStep('upload');
                setError('');
              }}
              onSwitchToManual={() => {
                setStep('manual');
                setError('');
              }}
            />
          )}

          {step === 'manual' && (
            <ManualWasteSelection
              onConfirmWaste={handleWasteConfirmed}
              onSwitchToPhotoUpload={() => {
                setStep('upload');
                setError('');
              }}
            />
          )}

          {step === 'summary' && (
            <PickupSummary
              citizenData={{
                citizenId,
                houseName,
                houseNumber,
                address,
                wardId,
                panchayatName
              }}
              confirmedData={confirmedData}
              onSubmit={handleSubmitPickupRequest}
              onBack={() => {
                if (confirmedData?.aiAnalyzed) {
                  setStep('ai_result');
                } else {
                  setStep('manual');
                }
              }}
              isSubmitting={isSubmitting}
              error={error}
            />
          )}
        </>
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
