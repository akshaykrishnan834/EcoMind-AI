import React, { useState, useEffect } from 'react';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Building2,
  CheckCircle2,
  AlertCircle,
  Save,
  Loader2,
  ShieldCheck,
  Award
} from 'lucide-react';
import {
  getCitizenByEmail,
  updateCitizenProfile,
  getAllPanchayats,
  getAllWards
} from '../services/citizenService';

export const CitizenProfile = () => {
  const userObj = JSON.parse(localStorage.getItem('user') || '{}');
  const userEmail = userObj.email || localStorage.getItem('userEmail') || '';

  const [formData, setFormData] = useState({
    fullName: userObj.fullName || '',
    email: userEmail,
    phoneNumber: userObj.phoneNumber || '',
    address: '',
    panchayatName: '',
    wardId: ''
  });

  const [citizenId, setCitizenId] = useState('');
  const [profileCompleted, setProfileCompleted] = useState(false);
  const [panchayats, setPanchayats] = useState([]);
  const [wards, setWards] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setErrorMsg('');

      try {
        // Fetch Panchayats and Wards
        const [panchayatRes, wardList] = await Promise.all([
          getAllPanchayats().catch(() => null),
          getAllWards().catch(() => [])
        ]);

        setWards(wardList || []);

        // Consolidate Panchayat names list into a clean array
        const pSet = new Set();

        if (Array.isArray(panchayatRes)) {
          panchayatRes.forEach((p) => {
            const name = typeof p === 'string' ? p : (p.panchayatName || p.name);
            if (name) pSet.add(name);
          });
        } else if (panchayatRes && typeof panchayatRes === 'object') {
          const name = panchayatRes.panchayatName || panchayatRes.name;
          if (name) pSet.add(name);
        }

        // Gather panchayat names from the ward list as well
        if (Array.isArray(wardList)) {
          wardList.forEach((w) => {
            const name = w.panchayatName || w.panchayat;
            if (name) pSet.add(name);
          });
        }

        const consolidatedPanchayats = Array.from(pSet);
        setPanchayats(consolidatedPanchayats);

        // Fetch Citizen profile by email
        if (userEmail) {
          try {
            const citizenData = await getCitizenByEmail(userEmail);
            if (citizenData) {
              setFormData({
                fullName: citizenData.fullName || userObj.fullName || '',
                email: citizenData.email || userEmail,
                phoneNumber: citizenData.phoneNumber || userObj.phoneNumber || '',
                address: citizenData.address || '',
                panchayatName: citizenData.panchayatName || '',
                wardId: citizenData.wardId || ''
              });
              setCitizenId(citizenData.citizenId || '');
              setProfileCompleted(Boolean(citizenData.profileCompleted));
            }
          } catch (err) {
            console.log("Could not fetch citizen details:", err);
          }
        }
      } catch (err) {
        console.error("Error loading profile data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userEmail]);

  // Filter wards dynamically based on selected panchayat
  const filteredWards = formData.panchayatName
    ? wards.filter((w) => {
        const pName = w.panchayatName || w.panchayat || '';
        return pName.toLowerCase() === formData.panchayatName.toLowerCase();
      })
    : [];

  const handleChange = (e) => {
    const { name, value } = e.target;

    let val = value;
    if (name === 'phoneNumber') {
      val = value.replace(/\D/g, '').slice(0, 10);
    }

    setFormData((prev) => {
      // If changing Panchayat, automatically reset selected ward
      if (name === 'panchayatName') {
        return {
          ...prev,
          panchayatName: val,
          wardId: ''
        };
      }
      return {
        ...prev,
        [name]: val
      };
    });
    setErrorMsg('');
    setSuccessMsg('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!formData.fullName.trim()) {
      setErrorMsg('Full Name is required.');
      return;
    }

    if (formData.phoneNumber) {
      if (
        formData.phoneNumber.length !== 10 ||
        !/^[6-9][0-9]{9}$/.test(formData.phoneNumber)
      ) {
        setErrorMsg(
          'Phone number must be exactly 10 digits starting with 6, 7, 8, or 9.'
        );
        return;
      }
    }

    setSaving(true);

    try {
      const response = await updateCitizenProfile({
        email: formData.email,
        fullName: formData.fullName.trim(),
        phoneNumber: formData.phoneNumber.trim(),
        address: formData.address.trim(),
        panchayatName: formData.panchayatName,
        wardId: formData.wardId
      });

      setSuccessMsg(response.message || 'Profile updated successfully!');
      
      // Check if profile complete
      if (formData.address.trim() && (formData.panchayatName || formData.wardId)) {
        setProfileCompleted(true);
      }

      // Update localStorage so sidebar/header update immediately
      const updatedUser = {
        ...userObj,
        fullName: formData.fullName.trim(),
        phoneNumber: formData.phoneNumber.trim()
      };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      localStorage.setItem('userName', formData.fullName.trim());

      // Trigger custom window event or force re-render signal if needed
      window.dispatchEvent(new Event('storage'));
    } catch (err) {
      console.error("Update failed:", err);
      const msg = err.response?.data || err.message || 'Failed to update profile.';
      setErrorMsg(typeof msg === 'string' ? msg : 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-gray-500">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mb-2" />
        <p className="text-sm font-medium">Loading your profile...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">

      {/* Top Banner Card */}
      <div className="bg-gradient-to-r from-[#0a4d2c] via-[#0f5b37] to-emerald-800 rounded-2xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-48 h-48 bg-white/5 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row items-center gap-6 relative z-10">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white font-extrabold text-3xl shadow-inner shrink-0">
            {formData.fullName ? formData.fullName[0].toUpperCase() : <User className="w-10 h-10" />}
          </div>

          <div className="text-center sm:text-left space-y-2 flex-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                {formData.fullName || 'Citizen'}
              </h1>

              {citizenId && (
                <span className="px-3 py-1 bg-emerald-900/60 border border-emerald-400/40 text-emerald-200 font-mono font-bold text-xs rounded-full">
                  ID: {citizenId}
                </span>
              )}
            </div>

            <p className="text-emerald-100 text-sm flex items-center justify-center sm:justify-start gap-2">
              <Mail className="w-4 h-4 text-emerald-300" />
              <span>{formData.email}</span>
            </p>

            <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-3">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                profileCompleted
                  ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-400/40'
                  : 'bg-amber-500/20 text-amber-200 border border-amber-400/40'
              }`}>
                {profileCompleted ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                    Profile Complete
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-3.5 h-3.5 text-amber-300" />
                    Incomplete Profile (Please fill address)
                  </>
                )}
              </span>

              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-white border border-white/20">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
                Verified Citizen Account
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Success Banner */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border-l-4 border-emerald-500 text-emerald-800 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-3 shadow-xs animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Error Banner */}
      {errorMsg && (
        <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-800 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-3 shadow-xs animate-fadeIn">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Profile Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 sm:p-8 border border-emerald-100 shadow-xs space-y-8">
        
        {/* Section 1: Personal Information */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
            <User className="w-5 h-5 text-emerald-700" />
            <h2 className="text-lg font-bold text-gray-800">Personal Information</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Full Name */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">Full Name *</label>
              <div className="relative rounded-lg shadow-2xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  required
                  className="w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-colors"
                />
              </div>
            </div>

            {/* Email Address (Read-only) */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">Email Address (Account ID)</label>
              <div className="relative rounded-lg shadow-2xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  readOnly
                  disabled
                  className="w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm bg-gray-100 border border-gray-200 rounded-lg text-gray-500 cursor-not-allowed"
                />
              </div>
              <p className="text-[11px] text-gray-400">Email address cannot be changed as it is linked to your login credentials.</p>
            </div>

            {/* Phone Number */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">Phone Number *</label>
              <div className="relative rounded-lg shadow-2xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Phone className="w-4 h-4" />
                </div>
                <input
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  maxLength={10}
                  placeholder="10-digit mobile number"
                  className="w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-colors"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Local Body & Address Details */}
        <div className="space-y-4 pt-4 border-t border-gray-100">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
            <Building2 className="w-5 h-5 text-emerald-700" />
            <h2 className="text-lg font-bold text-gray-800">Local Body & Location Details</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Panchayat Name Dropdown */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">Select Panchayat *</label>
              <div className="relative rounded-lg shadow-2xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Building2 className="w-4 h-4" />
                </div>
                <select
                  name="panchayatName"
                  value={formData.panchayatName}
                  onChange={handleChange}
                  className="w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-colors cursor-pointer"
                >
                  <option value="">-- Select Panchayat --</option>
                  {panchayats.map((pName, idx) => (
                    <option key={idx} value={pName}>
                      {pName}
                    </option>
                  ))}
                  {formData.panchayatName && !panchayats.includes(formData.panchayatName) && (
                    <option value={formData.panchayatName}>{formData.panchayatName}</option>
                  )}
                </select>
              </div>
            </div>

            {/* Ward Selection Dropdown (Filtered by Panchayat) */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">Select Ward *</label>
              <div className="relative rounded-lg shadow-2xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Award className="w-4 h-4" />
                </div>
                <select
                  name="wardId"
                  value={formData.wardId}
                  onChange={handleChange}
                  disabled={!formData.panchayatName}
                  className="w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-colors cursor-pointer disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                >
                  {!formData.panchayatName ? (
                    <option value="">-- Select a Panchayat first --</option>
                  ) : filteredWards.length === 0 ? (
                    <option value="">-- No Wards found under this Panchayat --</option>
                  ) : (
                    <option value="">-- Select Ward --</option>
                  )}
                  {filteredWards.map((w) => {
                    const wVal = w.wardId || w.id || w.wardName;
                    const wLabel = w.wardName ? `${w.wardName} (${w.wardId})` : w.wardId || w.id;
                    return (
                      <option key={w.id || w.wardId} value={wVal}>
                        {wLabel}
                      </option>
                    );
                  })}
                  {formData.wardId && !filteredWards.some(w => (w.wardId || w.id || w.wardName) === formData.wardId) && (
                    <option value={formData.wardId}>{formData.wardId}</option>
                  )}
                </select>
              </div>
            </div>
          </div>

          {/* Complete Residential Address */}
          <div className="space-y-1.5 pt-2">
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">Residential Address</label>
            <div className="relative rounded-lg shadow-2xs">
              <div className="absolute top-3 left-0 pl-3 flex items-start pointer-events-none text-gray-400">
                <MapPin className="w-4 h-4" />
              </div>
              <textarea
                name="address"
                rows={3}
                value={formData.address}
                onChange={handleChange}
                placeholder="House Name / Flat No, Street, Landmark, Pincode"
                className="w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-4 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="w-full sm:w-auto px-6 py-3 bg-[#0a4d2c] hover:bg-[#063820] text-white font-bold text-xs sm:text-sm uppercase tracking-wider rounded-xl shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving Changes...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Profile Changes</span>
              </>
            )}
          </button>
        </div>

      </form>
    </div>
  );
};

export default CitizenProfile;
