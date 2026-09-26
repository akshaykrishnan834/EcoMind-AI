import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { validateField, validateForm } from '../validations/loginvalidation';
import { useNavigate } from "react-router-dom";
import { loginUser } from "../services/authService";

export const LoginForm = ({ onSwitchToSignUp, onOpenForgotPassword, onSubmitLogin }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const fieldValue = type === 'checkbox' ? checked : value;

    if (serverError) setServerError('');

    const updatedForm = {
      ...formData,
      [name]: fieldValue
    };

    setFormData(updatedForm);

    if (name !== 'rememberMe' && (touched[name] || isSubmitted)) {
      const fieldError = validateField(name, fieldValue);
      setErrors((prev) => ({
        ...prev,
        [name]: fieldError
      }));
    }
  };

  const handleBlur = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === 'rememberMe') return;

    const fieldValue = type === 'checkbox' ? checked : value;
    setTouched((prev) => ({ ...prev, [name]: true }));

    const fieldError = validateField(name, fieldValue);
    setErrors((prev) => ({
      ...prev,
      [name]: fieldError
    }));
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

    setIsSubmitting(true);

    try {
      const response = await loginUser({
        email: formData.email.trim(),
        password: formData.password,
      });

      if (onSubmitLogin) {
        onSubmitLogin(response);
      }

      const userRole = (response.role || "").toLowerCase();
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('user', JSON.stringify(response));
      if (response.fullName) {
        localStorage.setItem('userName', response.fullName);
      }

      // Reset active tab keys so user lands directly into their main Dashboard interface
      sessionStorage.removeItem('adminActiveTab');
      sessionStorage.removeItem('workerActiveTab');
      sessionStorage.removeItem('citizenActiveTab');

      if (userRole === "citizen") {
        navigate("/citizen");
      } else if (userRole === "worker" || userRole === "haritha karma sena worker") {
        navigate("/worker");
      } else if (userRole === "admin") {
        navigate("/admin");
      } else {
        navigate("/citizen");
      }

    } catch (error) {
      console.log("Login Error:", error);
      if (error.response) {
        const errorData = error.response.data;
        const msg = typeof errorData === 'string'
          ? errorData
          : (errorData?.message || 'Invalid email or password.');
        setServerError(msg);
      } else if (error.request) {
        setServerError("Unable to connect to backend server. Please ensure the backend is running.");
      } else {
        setServerError(error.message || 'An unexpected error occurred.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const getFieldError = (fieldName) => {
    return (touched[fieldName] || isSubmitted) ? errors[fieldName] : '';
  };

  return (
    <div className="w-full">
      {/* Server Error Alert Banner */}
      {serverError && (
        <div className="mb-5 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 text-red-700 dark:text-red-300 text-xs flex items-start gap-2.5 animate-fade-in">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
          <span className="leading-relaxed font-medium">{serverError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4.5" noValidate>
        {/* Email Address */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            Email Address
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
              className={`w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-xl bg-slate-50/80 dark:bg-[#121417] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 border transition-all duration-200 outline-none ${
                getFieldError('email')
                  ? 'border-red-400 dark:border-red-500 focus:ring-2 focus:ring-red-400/20'
                  : 'border-slate-200 dark:border-white/10 focus:border-emerald-500 dark:focus:border-emerald-400 focus:bg-white dark:focus:bg-[#15181e] focus:ring-2 focus:ring-emerald-500/20'
              }`}
            />
          </div>
          {getFieldError('email') && (
            <p className="text-[11px] text-red-500 dark:text-red-400 font-medium pl-1">
              {getFieldError('email')}
            </p>
          )}
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Password
            </label>
            <button
              type="button"
              onClick={onOpenForgotPassword}
              className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 hover:underline transition-colors cursor-pointer"
            >
              Forgot password?
            </button>
          </div>
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
              className={`w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm rounded-xl bg-slate-50/80 dark:bg-[#121417] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 border transition-all duration-200 outline-none ${
                getFieldError('password')
                  ? 'border-red-400 dark:border-red-500 focus:ring-2 focus:ring-red-400/20'
                  : 'border-slate-200 dark:border-white/10 focus:border-emerald-500 dark:focus:border-emerald-400 focus:bg-white dark:focus:bg-[#15181e] focus:ring-2 focus:ring-emerald-500/20'
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-pointer"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {getFieldError('password') && (
            <p className="text-[11px] text-red-500 dark:text-red-400 font-medium pl-1">
              {getFieldError('password')}
            </p>
          )}
        </div>

        {/* Remember Me */}
        <div className="flex items-center pt-0.5">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              name="rememberMe"
              checked={formData.rememberMe}
              onChange={handleChange}
              disabled={isSubmitting}
              className="w-4 h-4 rounded border-slate-300 dark:border-white/20 text-emerald-600 focus:ring-emerald-500/30 accent-emerald-600 cursor-pointer"
            />
            <span className="text-xs text-slate-600 dark:text-slate-400">
              Remember me on this device
            </span>
          </label>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-60 text-white font-bold text-xs sm:text-sm tracking-wide shadow-md hover:shadow-emerald-600/25 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer group disabled:cursor-not-allowed mt-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-white" />
              <span>Signing In...</span>
            </>
          ) : (
            <>
              <span>Sign In</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </>
          )}
        </button>

        {/* Switch to Sign Up */}
        <div className="pt-3 text-center">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Don't have an account?{' '}
            <button
              type="button"
              onClick={onSwitchToSignUp}
              className="font-bold text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 hover:underline transition-colors cursor-pointer"
            >
              Create Account
            </button>
          </p>
        </div>
      </form>
    </div>
  );
};

export default LoginForm;
