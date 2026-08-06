import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  User,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  MapPin,
  ArrowLeft,
  UserPlus,
  CheckCircle2,
  AlertCircle,
  Building2
} from "lucide-react";
import { createWorker } from "../../services/workerService";

const AddWorker = ({ onBack, onWorkerAdded }) => {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
    wardId: "",
    password: "",
  });

  const [wards, setWards] = useState([]);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    fetchWards();
  }, []);

  const fetchWards = async () => {
    try {
      const response = await axios.get("http://localhost:5214/api/Ward");
      setWards(response.data || []);
    } catch (error) {
      console.error("Error fetching wards:", error);
    }
  };

  const validateField = (name, value) => {
    let error = "";
    if (name === "fullName") {
      if (!value.trim()) error = "Full name is required";
      else if (value.trim().length < 3) error = "Name must be at least 3 characters";
    } else if (name === "email") {
      if (!value.trim()) error = "Email address is required";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) error = "Enter a valid email address";
    } else if (name === "phoneNumber") {
      if (!value.trim()) error = "Phone number is required";
      else if (!/^\d{10}$/.test(value.trim())) error = "Phone number must be exactly 10 digits";
    } else if (name === "wardId") {
      if (!value) error = "Please select an assigned Ward";
    } else if (name === "password") {
      if (!value) error = "Password is required";
      else if (value.length < 6) error = "Password must be at least 6 characters";
    }
    return error;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    const error = validateField(name, value);
    setErrors((prev) => ({ ...prev, [name]: error }));
    setServerError("");
  };

  const validateForm = () => {
    const newErrors = {};
    Object.keys(formData).forEach((key) => {
      const err = validateField(key, formData[key]);
      if (err) newErrors[key] = err;
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError("");
    setSuccessMsg("");

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      await createWorker({
        fullName: formData.fullName,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        wardId: formData.wardId,
        password: formData.password
      });

      setSuccessMsg("Worker Login Details Created Successfully!");
      setTimeout(() => {
        if (onWorkerAdded) onWorkerAdded();
      }, 1500);
    } catch (error) {
      console.error("Error creating worker:", error);
      if (error.response && error.response.data) {
        setServerError(
          typeof error.response.data === "string"
            ? error.response.data
            : error.response.data.message || "Failed to create worker login credentials."
        );
      } else {
        setServerError("Failed to connect to server. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Bar */}
      <div className="bg-white rounded-2xl p-6 border border-emerald-100/80 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-[#0a4d2c] transition-colors cursor-pointer"
            title="Back to Worker Details"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-gray-800 tracking-tight flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-[#0a4d2c]" />
              Create Worker Login Credentials
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Add a new Haritha Karma Sena worker and generate their login details
            </p>
          </div>
        </div>
      </div>

      {/* Form Card */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-emerald-100/80 shadow-xs">
        {serverError && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{serverError}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-semibold flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-700" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Worker Full Name */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                Full Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="Enter worker's full name"
                  className={`w-full pl-10 pr-4 py-2.5 text-xs bg-gray-50 border rounded-xl focus:outline-none focus:ring-2 focus:bg-white transition-all ${
                    errors.fullName ? "border-red-400 focus:ring-red-400" : "border-gray-200 focus:ring-emerald-600"
                  }`}
                />
              </div>
              {errors.fullName && <p className="text-red-500 text-[11px] font-medium">{errors.fullName}</p>}
            </div>

            {/* Worker Email Address */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                Email Address (Login Username) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="worker@ecomind.com"
                  className={`w-full pl-10 pr-4 py-2.5 text-xs bg-gray-50 border rounded-xl focus:outline-none focus:ring-2 focus:bg-white transition-all ${
                    errors.email ? "border-red-400 focus:ring-red-400" : "border-gray-200 focus:ring-emerald-600"
                  }`}
                />
              </div>
              {errors.email && <p className="text-red-500 text-[11px] font-medium">{errors.email}</p>}
            </div>

            {/* Phone Number */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Phone className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  placeholder="10-digit mobile number"
                  className={`w-full pl-10 pr-4 py-2.5 text-xs bg-gray-50 border rounded-xl focus:outline-none focus:ring-2 focus:bg-white transition-all ${
                    errors.phoneNumber ? "border-red-400 focus:ring-red-400" : "border-gray-200 focus:ring-emerald-600"
                  }`}
                />
              </div>
              {errors.phoneNumber && <p className="text-red-500 text-[11px] font-medium">{errors.phoneNumber}</p>}
            </div>

            {/* Ward Selection */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                Assigned Ward <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Building2 className="w-4 h-4" />
                </div>
                <select
                  name="wardId"
                  value={formData.wardId}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-4 py-2.5 text-xs bg-gray-50 border rounded-xl focus:outline-none focus:ring-2 focus:bg-white transition-all cursor-pointer ${
                    errors.wardId ? "border-red-400 focus:ring-red-400" : "border-gray-200 focus:ring-emerald-600"
                  }`}
                >
                  <option value="">-- Select Ward --</option>
                  {wards.map((ward, idx) => (
                    <option key={ward.id || ward.wardId || idx} value={ward.wardId || ward.wardName}>
                      {ward.wardName} {ward.wardId ? `(${ward.wardId})` : ''} - {ward.panchayatName || 'Panchayat'}
                    </option>
                  ))}
                </select>
              </div>
              {errors.wardId && <p className="text-red-500 text-[11px] font-medium">{errors.wardId}</p>}
            </div>

            {/* Worker Login Password */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                Worker Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Set initial password for worker login"
                  className={`w-full pl-10 pr-10 py-2.5 text-xs bg-gray-50 border rounded-xl focus:outline-none focus:ring-2 focus:bg-white transition-all ${
                    errors.password ? "border-red-400 focus:ring-red-400" : "border-gray-200 focus:ring-emerald-600"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-[11px] font-medium">{errors.password}</p>}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onBack}
              className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 text-xs font-bold transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-[#0a4d2c] hover:bg-[#063820] text-white px-6 py-2.5 rounded-xl font-bold text-xs shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <UserPlus className="w-4 h-4" />
              <span>{loading ? "Creating Login..." : "Create Worker Login"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddWorker;
