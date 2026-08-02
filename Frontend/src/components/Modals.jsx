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

export const ForgotPasswordModal = ({ isOpen, onClose, onSubmit }) => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email) {
      setSubmitted(true);
      setTimeout(() => {
        onSubmit(email);
        setSubmitted(false);
        setEmail('');
        onClose();
      }, 1500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative border border-gray-100">
        <div className="flex items-center justify-between border-b pb-3 mb-4">
          <div className="flex items-center gap-2 text-[#0f5b37]">
            <KeyRound className="w-5 h-5" />
            <h3 className="text-base font-bold">Reset Password</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {submitted ? (
          <div className="py-6 text-center space-y-2">
            <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto animate-bounce" />
            <h4 className="font-bold text-gray-900">Reset Link Sent!</h4>
            <p className="text-xs text-gray-500">
              We have sent password reset instructions to <strong>{email}</strong>.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-xs text-gray-600">
              Enter your registered email address and we will send you a link to reset your password.
            </p>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your registered email"
                className="w-full px-3 py-2 text-xs sm:text-sm bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-gray-100 text-gray-700 font-semibold text-xs rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-[#0f5b37] hover:bg-[#0a4d2c] text-white font-semibold text-xs rounded-lg shadow-sm"
              >
                Send Reset Link
              </button>
            </div>
          </form>
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
