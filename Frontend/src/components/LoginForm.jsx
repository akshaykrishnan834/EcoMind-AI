import React, { useState } from 'react';
import { User, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { LoginHeroIllustration } from './Logos';
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

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const fieldValue = type === 'checkbox' ? checked : value;

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

    const validationErrors = validateForm(formData);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    try {
      const response = await loginUser({
        email: formData.email,
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

      // Reset active tab keys so user logs directly into their main Dashboard interface
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
        alert(msg);
      } else if (error.request) {
        alert("Unable to connect to backend server. Please ensure the backend is running.");
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
              Building a<br />
              <span className="text-emerald-700">Clean & Green</span><br />
              Kerala Together
            </h1>
            <p className="text-sm md:text-base text-gray-600 font-medium leading-relaxed max-w-md">
              EcoMind AI supports Haritha Karma Sena in making waste collection smarter, efficient and eco-friendly.
            </p>
          </div>

          <div className="w-full flex-1 min-h-[300px]">
            <LoginHeroIllustration />
          </div>
        </div>

        {/* Right Panel: Login Card Form */}
        <div className="lg:col-span-6 flex items-center justify-center">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 sm:p-8 shadow-xl border border-gray-100 relative">

            {/* Header Icon */}
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-[#0f5b37]">
                <User className="w-8 h-8 stroke-[1.8]" />
              </div>
            </div>

            {/* Title & Subtitle */}
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Welcome Back!</h2>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">Login to your EcoMind AI account</p>
            </div>


            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Email Address Input */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Email Address
                </label>
                <div className="relative rounded-lg shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="Enter your email"
                    className={`w-full pl-10 pr-4 py-2.5 text-sm bg-gray-50 border rounded-lg focus:outline-none focus:ring-2 focus:bg-white transition-colors duration-150 ${getFieldError('email') ? 'border-red-400 focus:ring-red-400' : 'border-gray-200 focus:ring-emerald-600'
                      }`}
                  />
                </div>
                {getFieldError('email') && (
                  <p className="text-red-500 text-xs mt-1 font-medium">
                    {getFieldError('email')}
                  </p>
                )}
              </div>

              {/* Password Input */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Password
                </label>
                <div className="relative rounded-lg shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="Enter your password"
                    className={`w-full pl-10 pr-10 py-2.5 text-sm bg-gray-50 border rounded-lg focus:outline-none focus:ring-2 focus:bg-white transition-colors duration-150 ${getFieldError('password') ? 'border-red-400 focus:ring-red-400' : 'border-gray-200 focus:ring-emerald-600'
                      }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {getFieldError('password') && (
                  <p className="text-xs text-red-500 font-medium mt-1">
                    {getFieldError('password')}
                  </p>
                )}
              </div>

              {/* Forgot Password Link */}
              <div className="flex items-center justify-end pt-1">
                <button
                  type="button"
                  onClick={onOpenForgotPassword}
                  className="text-xs font-semibold text-[#0f5b37] hover:text-[#0a4d2c] hover:underline focus:outline-none transition-colors cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>

              {/* Login Button */}
              <button
                type="submit"
                className="w-full mt-2 py-3 px-4 bg-[#0f5b37] hover:bg-[#0a4d2c] text-white font-bold text-sm uppercase tracking-wider rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 group"
              >
                <Lock className="w-4 h-4 group-hover:scale-110 transition-transform" />
                <span>LOGIN</span>
              </button>

              {/* Switch to Sign Up */}
              <div className="pt-4 text-center border-t border-gray-100">
                <p className="text-xs text-gray-600">
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={onSwitchToSignUp}
                    className="font-bold text-[#0f5b37] hover:underline focus:outline-none"
                  >
                    Sign Up
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

export default LoginForm;

