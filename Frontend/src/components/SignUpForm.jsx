import React, { useState, useRef, useEffect } from 'react';
import { User, Mail, Phone, Lock, Eye, EyeOff, ArrowRight, Loader2, Check, AlertCircle, CheckCircle2 } from 'lucide-react';
import {
  validateField,
  validateForm,
  getPasswordCriteria,
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
  const [serverError, setServerError] = useState('');

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

    setEmailStatus({ isChecking: true, isAvailable: false, error: '' });

    const controller = new AbortController();
    emailAbortRef.current = controller;

    emailTimerRef.current = setTimeout(async () => {
      try {
        const res = await checkEmailExists(emailValue.trim(), controller.signal);
        if (res?.exists) {
          setEmailStatus({ isChecking: false, isAvailable: false, error: 'This email is already registered.' });
        } else {
          setEmailStatus({ isChecking: false, isAvailable: true, error: '' });
        }
      } catch (err) {
        if (err?.name !== 'CanceledError' && err?.message !== 'canceled' && err?.code !== 'ERR_CANCELED') {
          setEmailStatus({ isChecking: false, isAvailable: false, error: 'Failed to verify email.' });
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
          setPhoneStatus({ isChecking: false, isAvailable: false, error: 'Failed to verify phone number.' });
        }
      }
    }, 500);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    let fieldValue = type === 'checkbox' ? checked : value;

    if (serverError) setServerError('');

    if (name === 'phone') {
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

    if (name === 'password') {
      const passErr = validateField('password', fieldValue, updatedForm);
      const confirmErr = updatedForm.confirmPassword ? validateField('confirmPassword', updatedForm.confirmPassword, updatedForm) : '';
      setErrors((prev) => ({
        ...prev,
        password: passErr,
        confirmPassword: confirmErr
      }));
    } else if (name === 'confirmPassword') {
      const confirmErr = validateField('confirmPassword', fieldValue, updatedForm);
      setErrors((prev) => ({
        ...prev,
        confirmPassword: confirmErr
      }));
    } else if (touched[name] || isSubmitted) {
      const fieldError = validateField(name, fieldValue, updatedForm);
      setErrors((prev) => ({
        ...prev,
        [name]: fieldError
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
    setServerError('');

    const validationErrors = validateForm(formData);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    if (emailStatus.error || !emailStatus.isAvailable || emailStatus.isChecking) {
      setErrors((prev) => ({ ...prev, email: emailStatus.error || 'Please enter an available email address.' }));
      return;
    }

    if (phoneStatus.error || !phoneStatus.isAvailable || phoneStatus.isChecking) {
      setErrors((prev) => ({ ...prev, phone: phoneStatus.error || 'Please enter an available phone number.' }));
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
          setServerError(errorMsg);
        }
      } else if (error.request) {
        setServerError("Unable to reach backend API server. Please ensure backend is running.");
      } else {
        setServerError(error.message || 'Registration error occurred.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const getFieldError = (fieldName) => {
    return (touched[fieldName] || isSubmitted) ? errors[fieldName] : '';
  };

  const passCriteria = getPasswordCriteria(formData.password);
  const isPasswordValid = validateField('password', formData.password, formData) === '';
  const isConfirmValid = validateField('confirmPassword', formData.confirmPassword, formData) === '';

  const isFormValid =
    formData.fullName.trim().length >= 3 &&
    emailStatus.isAvailable &&
    !emailStatus.isChecking &&
    !emailStatus.error &&
    phoneStatus.isAvailable &&
    !phoneStatus.isChecking &&
    !phoneStatus.error &&
    isPasswordValid &&
    isConfirmValid &&
    formData.agreeTerms &&
    !isSubmitting;

  return (
    <div className="w-full">
      {/* Server Error Alert Banner */}
      {serverError && (
        <div className="mb-5 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 text-red-700 dark:text-red-300 text-xs flex items-start gap-2.5 animate-fade-in">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
          <span className="leading-relaxed font-medium">{serverError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {/* Full Name */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            Full Name *
          </label>
          <div className="relative rounded-xl shadow-2xs">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
              <User className="w-4 h-4" />
            </div>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              onBlur={handleBlur}
              disabled={isSubmitting}
              placeholder="Enter the Full Name"
              className={`w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-xl bg-slate-50/80 dark:bg-[#121417] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 border transition-all duration-200 outline-none ${
                getFieldError('fullName')
                  ? 'border-red-400 dark:border-red-500 focus:ring-2 focus:ring-red-400/20'
                  : 'border-slate-200 dark:border-white/10 focus:border-emerald-500 dark:focus:border-emerald-400 focus:bg-white dark:focus:bg-[#15181e] focus:ring-2 focus:ring-emerald-500/20'
              }`}
            />
          </div>
          {getFieldError('fullName') && (
            <p className="text-[11px] text-red-500 dark:text-red-400 font-medium pl-1">
              {getFieldError('fullName')}
            </p>
          )}
        </div>

        {/* Email & Phone Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* Email */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Email Address *
            </label>
            <div className="relative rounded-xl shadow-2xs">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                onBlur={handleBlur}
                disabled={isSubmitting}
                placeholder="name@example.com"
                className={`w-full pl-10 pr-9 py-2.5 text-xs sm:text-sm rounded-xl bg-slate-50/80 dark:bg-[#121417] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 border transition-all duration-200 outline-none ${
                  getFieldError('email') || emailStatus.error
                    ? 'border-red-400 dark:border-red-500 focus:ring-2 focus:ring-red-400/20'
                    : emailStatus.isAvailable
                    ? 'border-emerald-500 dark:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20'
                    : 'border-slate-200 dark:border-white/10 focus:border-emerald-500 dark:focus:border-emerald-400 focus:bg-white dark:focus:bg-[#15181e] focus:ring-2 focus:ring-emerald-500/20'
                }`}
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                {emailStatus.isChecking ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />
                ) : emailStatus.isAvailable ? (
                  <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                ) : null}
              </div>
            </div>
            {(getFieldError('email') || emailStatus.error) && (
              <p className="text-[11px] text-red-500 dark:text-red-400 font-medium pl-1">
                {getFieldError('email') || emailStatus.error}
              </p>
            )}
          </div>

          {/* Phone Number */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Mobile Number *
            </label>
            <div className="relative rounded-xl shadow-2xs">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                <Phone className="w-4 h-4" />
              </div>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                onBlur={handleBlur}
                disabled={isSubmitting}
                maxLength={10}
                placeholder="Mobile Number"
                className={`w-full pl-10 pr-9 py-2.5 text-xs sm:text-sm rounded-xl bg-slate-50/80 dark:bg-[#121417] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 border transition-all duration-200 outline-none ${
                  getFieldError('phone') || phoneStatus.error
                    ? 'border-red-400 dark:border-red-500 focus:ring-2 focus:ring-red-400/20'
                    : phoneStatus.isAvailable
                    ? 'border-emerald-500 dark:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20'
                    : 'border-slate-200 dark:border-white/10 focus:border-emerald-500 dark:focus:border-emerald-400 focus:bg-white dark:focus:bg-[#15181e] focus:ring-2 focus:ring-emerald-500/20'
                }`}
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                {phoneStatus.isChecking ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />
                ) : phoneStatus.isAvailable ? (
                  <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                ) : null}
              </div>
            </div>
            {(getFieldError('phone') || phoneStatus.error) && (
              <p className="text-[11px] text-red-500 dark:text-red-400 font-medium pl-1">
                {getFieldError('phone') || phoneStatus.error}
              </p>
            )}
          </div>
        </div>

        {/* Password & Confirm Password Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* Password */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Password *
            </label>
            <div className="relative rounded-xl shadow-2xs">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                onBlur={handleBlur}
                disabled={isSubmitting}
                placeholder="••••••••"
                className={`w-full pl-10 pr-9 py-2.5 text-xs sm:text-sm rounded-xl bg-slate-50/80 dark:bg-[#121417] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 border transition-all duration-200 outline-none ${
                  getFieldError('password')
                    ? 'border-red-400 dark:border-red-500 focus:ring-2 focus:ring-red-400/20'
                    : isPasswordValid && formData.password
                    ? 'border-emerald-500 dark:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20'
                    : 'border-slate-200 dark:border-white/10 focus:border-emerald-500 dark:focus:border-emerald-400 focus:bg-white dark:focus:bg-[#15181e] focus:ring-2 focus:ring-emerald-500/20'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-pointer"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
            {getFieldError('password') && (
              <p className="text-[11px] text-red-500 dark:text-red-400 font-medium pl-1">
                {getFieldError('password')}
              </p>
            )}
          </div>

          {/* Confirm Password */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Confirm Password *
            </label>
            <div className="relative rounded-xl shadow-2xs">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                onBlur={handleBlur}
                disabled={isSubmitting}
                placeholder="••••••••"
                className={`w-full pl-10 pr-9 py-2.5 text-xs sm:text-sm rounded-xl bg-slate-50/80 dark:bg-[#121417] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 border transition-all duration-200 outline-none ${
                  getFieldError('confirmPassword')
                    ? 'border-red-400 dark:border-red-500 focus:ring-2 focus:ring-red-400/20'
                    : isConfirmValid && formData.confirmPassword
                    ? 'border-emerald-500 dark:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20'
                    : 'border-slate-200 dark:border-white/10 focus:border-emerald-500 dark:focus:border-emerald-400 focus:bg-white dark:focus:bg-[#15181e] focus:ring-2 focus:ring-emerald-500/20'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-pointer"
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              >
                {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
            {getFieldError('confirmPassword') && (
              <p className="text-[11px] text-red-500 dark:text-red-400 font-medium pl-1">
                {getFieldError('confirmPassword')}
              </p>
            )}
          </div>
        </div>

        {/* Compact Password Criteria Card */}
        {(formData.password.length > 0 || touched.password) && (
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#121417] border border-slate-200/80 dark:border-white/5 text-[11px] space-y-1 animate-fade-in">
            <span className="font-semibold text-slate-700 dark:text-slate-300 block mb-0.5">
              Password Strength:
            </span>
            <div className="grid grid-cols-2 gap-x-2 gap-y-1">
              <span className={`flex items-center gap-1 ${passCriteria.minLength ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-slate-400'}`}>
                {passCriteria.minLength ? '✓' : '•'} 8+ characters
              </span>
              <span className={`flex items-center gap-1 ${passCriteria.hasUpper ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-slate-400'}`}>
                {passCriteria.hasUpper ? '✓' : '•'} Uppercase (A-Z)
              </span>
              <span className={`flex items-center gap-1 ${passCriteria.hasLower ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-slate-400'}`}>
                {passCriteria.hasLower ? '✓' : '•'} Lowercase (a-z)
              </span>
              <span className={`flex items-center gap-1 ${passCriteria.hasNumber ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-slate-400'}`}>
                {passCriteria.hasNumber ? '✓' : '•'} Number (0-9)
              </span>
            </div>
          </div>
        )}

        {/* Terms & Conditions Checkbox */}
        <div className="pt-1">
          <label className="flex items-start gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              name="agreeTerms"
              checked={formData.agreeTerms}
              onChange={handleChange}
              onBlur={handleBlur}
              disabled={isSubmitting}
              className="mt-0.5 w-4 h-4 rounded border-slate-300 dark:border-white/20 text-emerald-600 focus:ring-emerald-500/30 accent-emerald-600 cursor-pointer"
            />
            <span className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-400 leading-snug">
              I agree to the{' '}
              <button
                type="button"
                onClick={onOpenTerms}
                className="font-bold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
              >
                Terms of Service
              </button>{' '}
              and{' '}
              <button
                type="button"
                onClick={onOpenPrivacy}
                className="font-bold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
              >
                Privacy Policy
              </button>
            </span>
          </label>
          {getFieldError('agreeTerms') && (
            <p className="text-[11px] text-red-500 dark:text-red-400 font-medium pl-1 mt-1">
              {getFieldError('agreeTerms')}
            </p>
          )}
        </div>

        {/* Create Account Button */}
        <button
          type="submit"
          disabled={!isFormValid}
          className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 text-white font-bold text-xs sm:text-sm tracking-wide shadow-md hover:shadow-emerald-600/25 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer group disabled:cursor-not-allowed mt-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-white" />
              <span>Creating Account...</span>
            </>
          ) : (
            <>
              <span>Create Account</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </>
          )}
        </button>

        {/* Switch to Sign In */}
        <div className="pt-2 text-center">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Already have an account?{' '}
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="font-bold text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 hover:underline transition-colors cursor-pointer"
            >
              Sign In
            </button>
          </p>
        </div>
      </form>
    </div>
  );
};

export default SignUpForm;
