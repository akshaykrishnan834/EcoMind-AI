import React, { useState, useRef, useEffect } from 'react';
import { UserPlus, User, Mail, Phone, Lock, Eye, EyeOff } from 'lucide-react';
import { SignUpHeroIllustration } from './Logos';
import {
  validateField,
  validateForm,
} from "../validations/signupValidation";
import { registerUser, checkEmailExists, checkPhoneExists } from "../services/authService";

export const SignUpForm = ({ onSwitchToLogin, onOpenTerms, onOpenPrivacy, onSubmitSignUp }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    agreeTerms: false
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Live validation states for Email and Phone
  const [emailStatus, setEmailStatus] = useState({
    isChecking: false,
    isAvailable: false,
    error: ''
  });

  const [phoneStatus, setPhoneStatus] = useState({
    isChecking: false,
    isAvailable: false,
    error: ''
  });

  // Debounce timers and AbortControllers
  const emailTimerRef = useRef(null);
  const phoneTimerRef = useRef(null);
  const emailAbortRef = useRef(null);
  const phoneAbortRef = useRef(null);

  // Clean up timers & abort controllers on unmount
  useEffect(() => {
    return () => {
      if (emailTimerRef.current) clearTimeout(emailTimerRef.current);
      if (phoneTimerRef.current) clearTimeout(phoneTimerRef.current);
      if (emailAbortRef.current) emailAbortRef.current.abort();
      if (phoneAbortRef.current) phoneAbortRef.current.abort();
    };
  }, []);

  const triggerEmailLiveCheck = (emailValue) => {
    if (emailTimerRef.current) clearTimeout(emailTimerRef.current);
    if (emailAbortRef.current) emailAbortRef.current.abort();

    if (!emailValue || !emailValue.trim()) {
      setEmailStatus({ isChecking: false, isAvailable: false, error: '' });
      return;
    }

    const formatErr = validateField('email', emailValue, formData);
    if (formatErr) {
      setEmailStatus({ isChecking: false, isAvailable: false, error: formatErr });
      return;
    }

    // Format is valid -> start debounced uniqueness check
    setEmailStatus({ isChecking: true, isAvailable: false, error: '' });

    const controller = new AbortController();
    emailAbortRef.current = controller;

    emailTimerRef.current = setTimeout(async () => {
      try {
        const res = await checkEmailExists(emailValue.trim(), controller.signal);
        if (res?.exists) {
          setEmailStatus({ isChecking: false, isAvailable: false, error: 'This email address is already registered.' });
        } else {
          setEmailStatus({ isChecking: false, isAvailable: true, error: '' });
        }
      } catch (err) {
        if (err?.name !== 'CanceledError' && err?.message !== 'canceled' && err?.code !== 'ERR_CANCELED') {
          setEmailStatus({ isChecking: false, isAvailable: false, error: 'Failed to verify email availability.' });
        }
      }
    }, 500);
  };

  const triggerPhoneLiveCheck = (phoneValue) => {
    if (phoneTimerRef.current) clearTimeout(phoneTimerRef.current);
    if (phoneAbortRef.current) phoneAbortRef.current.abort();

    if (!phoneValue || !phoneValue.trim()) {
      setPhoneStatus({ isChecking: false, isAvailable: false, error: '' });
      return;
    }

    const formatErr = validateField('phone', phoneValue, formData);
    if (formatErr) {
      setPhoneStatus({ isChecking: false, isAvailable: false, error: formatErr });
      return;
    }

    // Structurally valid (10 digits starting with 6-9) -> start debounced uniqueness check
    setPhoneStatus({ isChecking: true, isAvailable: false, error: '' });

    const controller = new AbortController();
    phoneAbortRef.current = controller;

    phoneTimerRef.current = setTimeout(async () => {
      try {
        const res = await checkPhoneExists(phoneValue.trim(), controller.signal);
        if (res?.exists) {
          setPhoneStatus({ isChecking: false, isAvailable: false, error: 'This phone number is already registered.' });
        } else {
          setPhoneStatus({ isChecking: false, isAvailable: true, error: '' });
        }
      } catch (err) {
        if (err?.name !== 'CanceledError' && err?.message !== 'canceled' && err?.code !== 'ERR_CANCELED') {
          setPhoneStatus({ isChecking: false, isAvailable: false, error: 'Failed to verify phone number availability.' });
        }
      }
    }, 500);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    let fieldValue = type === 'checkbox' ? checked : value;

    if (name === 'phone') {
      // Strip any non-numeric characters automatically and cap at 10 digits
      fieldValue = value.replace(/\D/g, '').slice(0, 10);
    }

    const updatedForm = {
      ...formData,
      [name]: fieldValue
    };

    setFormData(updatedForm);

    if (name === 'email') {
      triggerEmailLiveCheck(fieldValue);
    } else if (name === 'phone') {
      triggerPhoneLiveCheck(fieldValue);
    }

    if (touched[name] || isSubmitted) {
      const fieldError = validateField(name, fieldValue, updatedForm);
      setErrors((prev) => ({
        ...prev,
        [name]: fieldError
      }));
    }

    if ((touched.confirmPassword || isSubmitted) && name === 'password' && formData.confirmPassword) {
      const confirmErr = validateField('confirmPassword', formData.confirmPassword, updatedForm);
      setErrors((prev) => ({
        ...prev,
        confirmPassword: confirmErr
      }));
    }
  };

  const handleBlur = (e) => {
    const { name, value, type, checked } = e.target;
    const fieldValue = type === 'checkbox' ? checked : value;

    setTouched((prev) => ({ ...prev, [name]: true }));

    const fieldError = validateField(name, fieldValue, formData);
    setErrors((prev) => ({
      ...prev,
      [name]: fieldError
    }));

    if (name === 'email') {
      triggerEmailLiveCheck(fieldValue);
    } else if (name === 'phone') {
      triggerPhoneLiveCheck(fieldValue);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitted(true);

    const validationErrors = validateForm(formData);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    if (emailStatus.error || !emailStatus.isAvailable || emailStatus.isChecking) {
      setErrors((prev) => ({ ...prev, email: emailStatus.error || 'Please enter a valid, available email address.' }));
      return;
    }

    if (phoneStatus.error || !phoneStatus.isAvailable || phoneStatus.isChecking) {
      setErrors((prev) => ({ ...prev, phone: phoneStatus.error || 'Please enter a valid, available Indian mobile number.' }));
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await registerUser({
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        phoneNumber: formData.phone.trim(),
        password: formData.password,
      });

      if (onSubmitSignUp) {
        onSubmitSignUp({
          fullName: formData.fullName.trim(),
          email: formData.email.trim(),
          phoneNumber: formData.phone.trim(),
          password: formData.password,
        });
      }

      setFormData({
        fullName: "",
        email: "",
        phone: "",
        password: "",
        confirmPassword: "",
        agreeTerms: false,
      });

      setErrors({});
      setTouched({});
      setEmailStatus({ isChecking: false, isAvailable: false, error: '' });
      setPhoneStatus({ isChecking: false, isAvailable: false, error: '' });
      setIsSubmitted(false);

      if (onSwitchToLogin) {
        onSwitchToLogin();
      }

    } catch (error) {
      console.log("Registration Error:", error);

      if (error.response) {
        const errorMsg = typeof error.response.data === 'string'
          ? error.response.data
          : (error.response.data?.message || 'Registration failed.');

        if (errorMsg.toLowerCase().includes('phone')) {
          setPhoneStatus({ isChecking: false, isAvailable: false, error: errorMsg });
          setErrors((prev) => ({ ...prev, phone: errorMsg }));
        } else if (errorMsg.toLowerCase().includes('email')) {
          setEmailStatus({ isChecking: false, isAvailable: false, error: errorMsg });
          setErrors((prev) => ({ ...prev, email: errorMsg }));
        } else {
          alert(errorMsg);
        }
      } else if (error.request) {
        alert("Unable to reach backend API server. Please ensure backend is running.");
      } else {
        alert(error.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const getFieldError = (fieldName) => {
    return (touched[fieldName] || isSubmitted) ? errors[fieldName] : '';
  };

  const isFormValid =
    formData.fullName.trim().length >= 3 &&
    emailStatus.isAvailable &&
    !emailStatus.isChecking &&
    !emailStatus.error &&
    phoneStatus.isAvailable &&
    !phoneStatus.isChecking &&
    !phoneStatus.error &&
    formData.password.length >= 8 &&
    formData.password === formData.confirmPassword &&
    formData.agreeTerms &&
    !isSubmitting;

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8 md:py-12">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">

        {/* Left Panel: Hero Banner & Info */}
        <div className="lg:col-span-6 flex flex-col justify-between space-y-6">
          <div className="space-y-3">
            <h1 className="text-3xl md:text-4xl font-extrabold text-[#0f5b37] tracking-tight leading-tight">
              Join Hands for a<br />
              <span className="text-emerald-700">Cleaner, Greener</span><br />
              Kerala
            </h1>
            <p className="text-sm md:text-base text-gray-600 font-medium leading-relaxed max-w-md">
              Create your account and be a part of the smart waste management revolution.
            </p>
          </div>

          <div className="w-full flex-1 min-h-[340px]">
            <SignUpHeroIllustration />
          </div>
        </div>

        {/* Right Panel: Sign Up Card Form */}
        <div className="lg:col-span-6 flex items-center justify-center">
          <div className="w-full max-w-lg bg-white rounded-2xl p-6 sm:p-8 shadow-xl border border-gray-100 relative">

            {/* Header Icon */}
            <div className="flex justify-center mb-3">
              <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-[#0f5b37]">
                <UserPlus className="w-7 h-7 stroke-[1.8]" />
              </div>
            </div>

            {/* Title & Subtitle */}
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Create Your Account</h2>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">Sign up to get started with EcoMind AI</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">Full Name *</label>
                <div className="relative rounded-lg shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="Enter your full name"
                    className={`w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm bg-gray-50 border rounded-lg focus:outline-none focus:ring-2 focus:bg-white transition-colors ${
                      getFieldError('fullName') ? 'border-red-400 focus:ring-red-400 bg-red-50/20' : 'border-gray-200 focus:ring-emerald-600'
                    }`}
                  />
                </div>
                {getFieldError('fullName') && <p className="text-xs text-red-500 mt-1 font-medium">❌ {getFieldError('fullName')}</p>}
              </div>

              {/* Row 2: Email & Phone Number */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                
                {/* Email Address */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">Email Address *</label>
                  <div className="relative rounded-lg shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      placeholder="Enter your email"
                      className={`w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm bg-gray-50 border rounded-lg focus:outline-none focus:ring-2 focus:bg-white transition-colors ${
                        emailStatus.error || getFieldError('email')
                          ? 'border-red-400 focus:ring-red-400 bg-red-50/20'
                          : emailStatus.isAvailable
                          ? 'border-emerald-500 focus:ring-emerald-500 bg-emerald-50/20'
                          : emailStatus.isChecking
                          ? 'border-amber-400 focus:ring-amber-400 bg-amber-50/20'
                          : 'border-gray-200 focus:ring-emerald-600'
                      }`}
                    />
                  </div>

                  {/* Email Live Validation Messages */}
                  {emailStatus.isChecking && (
                    <p className="text-xs text-amber-600 mt-1 font-medium flex items-center gap-1">
                      <span className="animate-spin text-xs">⏳</span> Checking email availability...
                    </p>
                  )}
                  {!emailStatus.isChecking && emailStatus.error && (
                    <p className="text-xs text-red-500 mt-1 font-medium flex items-center gap-1">
                      ❌ {emailStatus.error}
                    </p>
                  )}
                  {!emailStatus.isChecking && !emailStatus.error && emailStateIsAvailable(emailStatus) && (
                    <p className="text-xs text-emerald-600 mt-1 font-semibold flex items-center gap-1">
                      ✓ Email is available.
                    </p>
                  )}
                  {!emailStatus.isChecking && !emailStatus.error && !emailStatus.isAvailable && getFieldError('email') && (
                    <p className="text-xs text-red-500 mt-1 font-medium flex items-center gap-1">
                      ❌ {getFieldError('email')}
                    </p>
                  )}
                </div>

                {/* Phone Number */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">Phone Number *</label>
                  <div className="relative rounded-lg shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                      <Phone className="w-4 h-4" />
                    </div>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      maxLength={10}
                      placeholder="10-digit mobile number"
                      className={`w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm bg-gray-50 border rounded-lg focus:outline-none focus:ring-2 focus:bg-white transition-colors ${
                        phoneStatus.error || getFieldError('phone')
                          ? 'border-red-400 focus:ring-red-400 bg-red-50/20'
                          : phoneStatus.isAvailable
                          ? 'border-emerald-500 focus:ring-emerald-500 bg-emerald-50/20'
                          : phoneStatus.isChecking
                          ? 'border-amber-400 focus:ring-amber-400 bg-amber-50/20'
                          : 'border-gray-200 focus:ring-emerald-600'
                      }`}
                    />
                  </div>

                  {/* Phone Live Validation Messages */}
                  {phoneStatus.isChecking && (
                    <p className="text-xs text-amber-600 mt-1 font-medium flex items-center gap-1">
                      <span className="animate-spin text-xs">⏳</span> Checking phone availability...
                    </p>
                  )}
                  {!phoneStatus.isChecking && phoneStatus.error && (
                    <p className="text-xs text-red-500 mt-1 font-medium flex items-center gap-1">
                      ❌ {phoneStatus.error}
                    </p>
                  )}
                  {!phoneStatus.isChecking && !phoneStatus.error && phoneStateIsAvailable(phoneStatus) && (
                    <p className="text-xs text-emerald-600 mt-1 font-semibold flex items-center gap-1">
                      ✓ Phone number is available.
                    </p>
                  )}
                  {!phoneStatus.isChecking && !phoneStatus.error && !phoneStatus.isAvailable && getFieldError('phone') && (
                    <p className="text-xs text-red-500 mt-1 font-medium flex items-center gap-1">
                      ❌ {getFieldError('phone')}
                    </p>
                  )}
                </div>

              </div>

              {/* Row 3: Password & Confirm Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">Password *</label>
                  <div className="relative rounded-lg shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      placeholder="Create a password"
                      className={`w-full pl-9 pr-8 py-2.5 text-xs sm:text-sm bg-gray-50 border rounded-lg focus:outline-none focus:ring-2 focus:bg-white transition-colors ${
                        getFieldError('password') ? 'border-red-400 focus:ring-red-400 bg-red-50/20' : 'border-gray-200 focus:ring-emerald-600'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  {getFieldError('password') && <p className="text-xs text-red-500 mt-1 font-medium">❌ {getFieldError('password')}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">Confirm Password *</label>
                  <div className="relative rounded-lg shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      placeholder="Confirm your password"
                      className={`w-full pl-9 pr-8 py-2.5 text-xs sm:text-sm bg-gray-50 border rounded-lg focus:outline-none focus:ring-2 focus:bg-white transition-colors ${
                        getFieldError('confirmPassword') ? 'border-red-400 focus:ring-red-400 bg-red-50/20' : 'border-gray-200 focus:ring-emerald-600'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-[#9ca3af] hover:text-gray-600"
                    >
                      {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  {getFieldError('confirmPassword') && <p className="text-xs text-red-500 mt-1 font-medium">❌ {getFieldError('confirmPassword')}</p>}
                </div>
              </div>

              {/* Terms Checkbox */}
              <div className="pt-1">
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="agreeTerms"
                    checked={formData.agreeTerms}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className="mt-0.5 w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 accent-[#0f5b37]"
                  />
                  <span className="text-xs text-gray-600 leading-tight">
                    I agree to the{' '}
                    <button
                      type="button"
                      onClick={onOpenTerms}
                      className="font-bold text-[#0f5b37] hover:underline"
                    >
                      Terms & Conditions
                    </button>{' '}
                    and{' '}
                    <button
                      type="button"
                      onClick={onOpenPrivacy}
                      className="font-bold text-[#0f5b37] hover:underline"
                    >
                      Privacy Policy
                    </button>
                  </span>
                </label>
                {getFieldError('agreeTerms') && <p className="text-xs text-red-500 mt-1 font-medium">❌ {getFieldError('agreeTerms')}</p>}
              </div>

              {/* Create Account Button */}
              <button
                type="submit"
                disabled={!isFormValid}
                className="w-full mt-2 py-3 px-4 bg-[#0f5b37] hover:bg-[#0a4d2c] text-white font-bold text-sm uppercase tracking-wider rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#0f5b37]"
              >
                <UserPlus className="w-4 h-4 group-hover:scale-110 transition-transform" />
                <span>{isSubmitting ? 'CREATING ACCOUNT...' : 'CREATE ACCOUNT'}</span>
              </button>

              {/* Switch to Login */}
              <div className="pt-3 text-center border-t border-gray-100">
                <p className="text-xs text-gray-600">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={onSwitchToLogin}
                    className="font-bold text-[#0f5b37] hover:underline focus:outline-none"
                  >
                    Login
                  </button>
                </p>
              </div>

            </form>

          </div>
        </div>

      </div>
    </div>
  );
};

// Helper functions for clean boolean checking
function emailStateIsAvailable(status) {
  return status.isAvailable && !status.isChecking && !status.error;
}

function phoneStateIsAvailable(status) {
  return status.isAvailable && !status.isChecking && !status.error;
}

export default SignUpForm;
