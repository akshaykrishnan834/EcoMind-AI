import React, { useState } from 'react';
import { X, CheckCircle2, AlertCircle, Loader2, KeyRound } from 'lucide-react';
import { completePickupRequest } from '../services/pickupRequestService';

const OTPVerificationModal = ({ isOpen, onClose, requestId, workerId, onSuccess }) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleVerify = async (e) => {
    e.preventDefault();
    const cleanCode = code.trim();
    if (!cleanCode || cleanCode.length !== 4) {
      setError('Please enter the 4-digit verification code.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      await completePickupRequest(requestId, workerId, cleanCode);
      setSuccessMsg('Verification successful! Pickup marked as Completed.');
      setTimeout(() => {
        onSuccess(requestId);
        onClose();
        setCode('');
        setSuccessMsg('');
      }, 1200);
    } catch (err) {
      console.error('Pickup Verification Error:', err);
      const errMsg = err.response?.data?.message || err.response?.data || err.message || 'Invalid verification code. Please check with the citizen.';
      setError(typeof errMsg === 'string' ? errMsg : 'Invalid verification code. Please check with the citizen.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setCode('');
      setError('');
      setSuccessMsg('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative border border-emerald-100">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-emerald-50/80">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-[#0a4d2c] text-white rounded-xl">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-[#0a4d2c]">Pickup Verification</h2>
              <p className="text-[11px] text-gray-500 font-semibold">Request: {requestId}</p>
            </div>
          </div>
          <button 
            onClick={handleClose}
            className="p-1.5 hover:bg-emerald-100 rounded-full transition-colors text-emerald-800 cursor-pointer"
            disabled={loading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          <div className="text-center space-y-1">
            <p className="text-xs text-gray-600 font-medium">
              Please ask the citizen for their <span className="font-extrabold text-[#0a4d2c]">4-digit verification code</span> displayed on their EcoMind dashboard.
            </p>
          </div>

          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-2xl flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-2xl flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleVerify} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 block text-center uppercase tracking-wider">
                Citizen Verification Code
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => {
                  setError('');
                  setCode(e.target.value.replace(/\D/g, '').slice(0, 4));
                }}
                placeholder="••••"
                maxLength={4}
                autoFocus
                className="w-full text-center text-3xl tracking-[12px] font-black font-mono border-2 border-emerald-300 rounded-2xl p-3 focus:outline-none focus:border-[#0a4d2c] focus:ring-3 focus:ring-emerald-100 transition-all bg-emerald-50/20 text-[#0a4d2c]"
                disabled={loading || !!successMsg}
              />
              <span className="text-[10px] text-gray-400 block text-center">
                Enter 4-digit code provided by citizen
              </span>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="w-1/3 py-3 border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold rounded-xl text-xs transition-all cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || code.trim().length !== 4 || !!successMsg}
                className="flex-1 py-3 bg-[#0a4d2c] hover:bg-[#0f5b37] text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying Code...</span>
                  </>
                ) : (
                  <span>Verify & Complete</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default OTPVerificationModal;
