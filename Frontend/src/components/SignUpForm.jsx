import React, { useState } from 'react';
import { UserPlus, User, Mail, Phone, Lock, Eye, EyeOff } from 'lucide-react';
import { SignUpHeroIllustration } from './Logos';
import {
  validateField,
  validateForm,
} from "../validations/signupValidation";
import { registerUser } from "../services/authService";

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

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const fieldValue = type === 'checkbox' ? checked : value;

    const updatedForm = {
      ...formData,
      [name]: fieldValue
    };

    setFormData(updatedForm);

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
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitted(true);

    const validationErrors = validateForm(formData);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    try {
      const result = await registerUser({
        fullName: formData.fullName,
        email: formData.email,
        phoneNumber: formData.phone,
        password: formData.password,
      });

      if (onSubmitSignUp) {
        onSubmitSignUp({
          fullName: formData.fullName,
          email: formData.email,
          phoneNumber: formData.phone,
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
      setIsSubmitted(false);

    } catch (error) {
      console.log("Full Error:", error);

      if (error.response) {
        alert(typeof error.response.data === 'string' ? error.response.data : 'Registration failed.');
      } else if (error.request) {
        alert("Unable to reach backend API server. Please ensure backend is running.");
      } else {
        alert(error.message);
      }
    }
  };

  const getFieldError = (fieldName) => {
    return (touched[fieldName] || isSubmitted) ? errors[fieldName] : '';
  };

  const hasVisibleErrors = isSubmitted && Object.values(errors).some(Boolean);

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

            {/* General Error Banner on Submit */}
            {hasVisibleErrors && (
              <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-xs font-semibold rounded">
                Please fix the validation errors below to proceed.
              </div>
            )}

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
                      getFieldError('fullName') ? 'border-red-400 focus:ring-red-400' : 'border-gray-200 focus:ring-emerald-600'
                    }`}
                  />
                </div>
                {getFieldError('fullName') && <p className="text-xs text-red-500 mt-1 font-medium">{getFieldError('fullName')}</p>}
              </div>

              {/* Row 2: Email & Phone Number */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
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
                        getFieldError('email') ? 'border-red-400 focus:ring-red-400' : 'border-gray-200 focus:ring-emerald-600'
                      }`}
                    />
                  </div>
                  {getFieldError('email') && <p className="text-xs text-red-500 mt-1 font-medium">{getFieldError('email')}</p>}
                </div>

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
                      placeholder="Enter your phone number"
                      className={`w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm bg-gray-50 border rounded-lg focus:outline-none focus:ring-2 focus:bg-white transition-colors ${
                        getFieldError('phone') ? 'border-red-400 focus:ring-red-400' : 'border-gray-200 focus:ring-emerald-600'
                      }`}
                    />
                  </div>
                  {getFieldError('phone') && <p className="text-xs text-red-500 mt-1 font-medium">{getFieldError('phone')}</p>}
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
                        getFieldError('password') ? 'border-red-400 focus:ring-red-400' : 'border-gray-200 focus:ring-emerald-600'
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
                  {getFieldError('password') && <p className="text-xs text-red-500 mt-1 font-medium">{getFieldError('password')}</p>}
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
                        getFieldError('confirmPassword') ? 'border-red-400 focus:ring-red-400' : 'border-gray-200 focus:ring-emerald-600'
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
                  {getFieldError('confirmPassword') && <p className="text-xs text-red-500 mt-1 font-medium">{getFieldError('confirmPassword')}</p>}
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
                {getFieldError('agreeTerms') && <p className="text-xs text-red-500 mt-1 font-medium">{getFieldError('agreeTerms')}</p>}
              </div>

              {/* Create Account Button */}
              <button
                type="submit"
                className="w-full mt-2 py-3 px-4 bg-[#0f5b37] hover:bg-[#0a4d2c] text-white font-bold text-sm uppercase tracking-wider rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 group"
              >
                <UserPlus className="w-4 h-4 group-hover:scale-110 transition-transform" />
                <span>CREATE ACCOUNT</span>
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

export default SignUpForm;

