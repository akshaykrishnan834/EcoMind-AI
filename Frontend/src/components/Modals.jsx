import React, { useState } from 'react';
import { X, ShieldAlert, KeyRound, CheckCircle2 } from 'lucide-react';

export const TermsModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl relative border border-gray-100 max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between border-b pb-3 mb-4">
          <h3 className="text-lg font-bold text-[#0f5b37]">Terms & Conditions</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto pr-2 space-y-3 text-xs text-gray-600 leading-relaxed flex-1">
          <p className="font-semibold text-gray-800">
            Welcome to EcoMind AI – Government of Kerala's AI-Powered Smart Recyclable Waste Management System.
          </p>
          <p>
            1. <strong>User Responsibilities:</strong> All residents, shops, and institutions must segregation recyclable waste at source prior to collection by Haritha Karma Sena workers.
          </p>
          <p>
            2. <strong>Account Veracity:</strong> The information provided during registration (Name, Ward Number, Address, Phone) must be accurate to ensure proper waste collection routing.
          </p>
          <p>
            3. <strong>Service Availability:</strong> EcoMind AI service schedules and notifications are managed in coordination with Local Self Government Department (LSGD) ward councillors and Haritha Karma Sena coordinators.
          </p>
          <p>
            4. <strong>System Integrity:</strong> Misuse of the AI notification system or submitting false waste pickup alerts is strictly prohibited.
          </p>
          <p>
            5. <strong>Benefits :</strong> Haritha Karma Sena records maintained by the Panchayat are important because they are required for citizens to receive various benefits and government services.
          </p>
        </div>

        <div className="mt-5 pt-3 border-t flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-[#0f5b37] hover:bg-[#0a4d2c] text-white font-semibold text-xs rounded-lg shadow-sm"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
};

export const PrivacyModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl relative border border-gray-100 max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between border-b pb-3 mb-4">
          <h3 className="text-lg font-bold text-[#0f5b37]">Privacy Policy</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto pr-2 space-y-3 text-xs text-gray-600 leading-relaxed flex-1">
          <p className="font-semibold text-gray-800">
            Government of Kerala Local Self Government Department Privacy Commitment:
          </p>
          <p>
            1. <strong>Data Encryption:</strong> All personal data including name, contact number, ward details, and addresses are encrypted end-to-end.
          </p>
          <p>
            2. <strong>Purpose of Collection:</strong> Your data is strictly used for waste collection route optimization, user account authentication, and Haritha Karma Sena monthly fee ledger tracking.
          </p>
          <p>
            3. <strong>Third-Party Sharing:</strong> We do NOT sell, rent, or trade your personal information to third parties.
          </p>
        </div>

        <div className="mt-5 pt-3 border-t flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-[#0f5b37] hover:bg-[#0a4d2c] text-white font-semibold text-xs rounded-lg shadow-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export const ForgotPasswordModal = ({ isOpen, onClose }) => {
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password, 4: Success
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [devOtp, setDevOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleResetState = () => {
    setStep(1);
    setEmail('');
    setOtp('');
    setDevOtp('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    setSuccessMsg('');
    setLoading(false);
  };

  const handleClose = () => {
    handleResetState();
    onClose();
  };

  // Step 1: Send OTP to Gmail
  const handleSendOtp = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your registered email address.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const res = await import('../services/authService').then(m => m.forgotPassword(email.trim()));
      if (res?.devOtpCode) {
        setDevOtp(res.devOtpCode);
      }
      setSuccessMsg(res.message || 'OTP code sent to your Gmail inbox!');
      setStep(2);
    } catch (err) {
      console.error('Send OTP error:', err);
      const msg = err.response?.data?.message || err.response?.data || err.message || 'Failed to send OTP code.';
      setError(typeof msg === 'string' ? msg : 'Failed to send OTP code.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp.trim()) {
      setError('Please enter the 6-digit OTP sent to your email.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const res = await import('../services/authService').then(m => m.verifyOtp(email.trim(), otp.trim()));
      setSuccessMsg(res.message || 'OTP verified successfully!');
      setStep(3);
    } catch (err) {
      console.error('Verify OTP error:', err);
      const msg = err.response?.data?.message || err.response?.data || err.message || 'Invalid or expired OTP.';
      setError(typeof msg === 'string' ? msg : 'Invalid or expired OTP.');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please confirm your new password.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const res = await import('../services/authService').then(m => m.resetPassword(email.trim(), otp.trim(), newPassword));
      setSuccessMsg(res.message || 'Password reset successfully!');
      setStep(4);
    } catch (err) {
      console.error('Reset password error:', err);
      const msg = err.response?.data?.message || err.response?.data || err.message || 'Failed to reset password.';
      setError(typeof msg === 'string' ? msg : 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative border border-emerald-100">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
          <div className="flex items-center gap-2 text-[#0f5b37]">
            <KeyRound className="w-5 h-5" />
            <h3 className="text-base font-bold">
              {step === 1 && 'Forgot Password'}
              {step === 2 && 'Verify Gmail OTP'}
              {step === 3 && 'Set New Password'}
              {step === 4 && 'Password Reset Complete'}
            </h3>
          </div>
          <button
            onClick={handleClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator Pills */}
        <div className="flex items-center justify-between mb-5 px-1">
          <div className={`h-1.5 flex-1 rounded-full mx-0.5 transition-all ${step >= 1 ? 'bg-[#0f5b37]' : 'bg-gray-200'}`} />
          <div className={`h-1.5 flex-1 rounded-full mx-0.5 transition-all ${step >= 2 ? 'bg-[#0f5b37]' : 'bg-gray-200'}`} />
          <div className={`h-1.5 flex-1 rounded-full mx-0.5 transition-all ${step >= 3 ? 'bg-[#0f5b37]' : 'bg-gray-200'}`} />
          <div className={`h-1.5 flex-1 rounded-full mx-0.5 transition-all ${step >= 4 ? 'bg-[#0f5b37]' : 'bg-gray-200'}`} />
        </div>

        {/* Error Callout Banner */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-800 text-xs font-semibold rounded-r-lg">
            {error}
          </div>
        )}

        {/* Success Notice Banner */}
        {successMsg && step !== 4 && (
          <div className="mb-4 p-3 bg-emerald-50 border-l-4 border-emerald-500 text-emerald-800 text-xs font-semibold rounded-r-lg">
            {successMsg}
          </div>
        )}

        {/* STEP 1: ENTER EMAIL */}
        {step === 1 && (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <p className="text-xs text-gray-600 leading-relaxed">
              Enter your registered EcoMind AI email address. We will send a 6-digit verification OTP code to your Gmail inbox.
            </p>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Registered Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. resident@gmail.com"
                className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:bg-white focus:outline-none transition-all"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 bg-gray-100 text-gray-700 font-semibold text-xs rounded-xl hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 bg-[#0f5b37] hover:bg-[#0a4d2c] text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {loading ? 'Sending OTP...' : 'Send OTP via Gmail'}
              </button>
            </div>
          </form>
        )}

        {/* STEP 2: VERIFY OTP */}
        {step === 2 && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <p className="text-xs text-gray-600 leading-relaxed">
              Enter the 6-digit OTP code sent to <strong className="text-emerald-900">{email}</strong>. Please check your Gmail inbox and spam folder.
            </p>

            {devOtp && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-[#0a4d2c] space-y-1">
                <div className="flex items-center justify-between font-bold">
                  <span>Testing OTP Code:</span>
                  <span className="font-mono font-extrabold text-sm tracking-widest bg-white px-2.5 py-0.5 rounded border border-emerald-300 shadow-2xs text-[#0a4d2c]">
                    {devOtp}
                  </span>
                </div>
                <p className="text-[10px] text-emerald-800">
                  (Use the 6-digit code above to complete testing if your Gmail blocks SMTP passwords.)
                </p>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                6-Digit OTP Code
              </label>
              <input
                type="text"
                required
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="123456"
                className="w-full text-center tracking-[8px] font-mono text-xl font-bold px-3.5 py-3 bg-emerald-50/50 border border-emerald-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:bg-white focus:outline-none transition-all"
              />
            </div>

            <div className="flex items-center justify-between text-xs text-gray-500 pt-1">
              <span>Didn't receive email?</span>
              <button
                type="button"
                onClick={handleSendOtp}
                disabled={loading}
                className="font-bold text-[#0f5b37] hover:underline cursor-pointer"
              >
                Resend OTP
              </button>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2 bg-gray-100 text-gray-700 font-semibold text-xs rounded-xl hover:bg-gray-200 transition-colors"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 bg-[#0f5b37] hover:bg-[#0a4d2c] text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {loading ? 'Verifying...' : 'Verify OTP Code'}
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: SET NEW PASSWORD */}
        {step === 3 && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <p className="text-xs text-gray-600 leading-relaxed">
              Create a new password for account <strong className="text-emerald-900">{email}</strong>.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:bg-white focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:bg-white focus:outline-none transition-all"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-4 py-2 bg-gray-100 text-gray-700 font-semibold text-xs rounded-xl hover:bg-gray-200 transition-colors"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 bg-[#0f5b37] hover:bg-[#0a4d2c] text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {loading ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </form>
        )}

        {/* STEP 4: SUCCESS */}
        {step === 4 && (
          <div className="py-6 text-center space-y-4">
            <CheckCircle2 className="w-14 h-14 text-emerald-600 mx-auto animate-bounce" />
            <div className="space-y-1">
              <h4 className="font-extrabold text-lg text-gray-900">Password Reset Complete!</h4>
              <p className="text-xs text-gray-500 max-w-xs mx-auto">
                Your EcoMind AI account password has been updated successfully. You can now log in using your new password.
              </p>
            </div>

            <button
              onClick={handleClose}
              className="w-full py-3 bg-[#0f5b37] hover:bg-[#0a4d2c] text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all cursor-pointer mt-4"
            >
              Back to Login
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export const ToastNotification = ({ toast, onClose }) => {
  if (!toast) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-sm bg-white border border-emerald-200 shadow-2xl rounded-xl p-4 flex items-start gap-3 animate-slide-up">
      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
      <div className="flex-1">
        <h4 className="text-xs font-bold text-gray-900">{toast.title}</h4>
        <p className="text-[11px] text-gray-600 mt-0.5">{toast.message}</p>
      </div>
      <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
