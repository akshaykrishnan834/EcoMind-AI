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
  Award,
  Edit3,
  X
} from 'lucide-react';
import {
  getCitizenByEmail,
  updateCitizenProfile,
  getAllPanchayats,
  getAllWards
} from '../services/citizenService';
import { getUserByEmail } from '../services/userService';

const cleanAddressString = (addr) => {
  if (!addr) return '';
  const lines = addr.split('\n').map((l) => l.trim()).filter(Boolean);
  return Array.from(new Set(lines)).join('\n');
};

export const CitizenProfile = () => {
  const userObj = JSON.parse(localStorage.getItem('user') || '{}');
  const userEmail = userObj.email || localStorage.getItem('userEmail') || '';

  // Edit Mode State for Profile
  const [isEditing, setIsEditing] = useState(false);

  // Profile Form Data
  const [formData, setFormData] = useState({
    fullName: userObj.fullName || '',
    email: userEmail,
    phoneNumber: userObj.phoneNumber || '',
    address: '',
    panchayatName: '',
    wardId: ''
  });

  // Saved / Original Citizen Profile Data (to revert on Cancel)
  const [savedData, setSavedData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
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
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setProfileError('');

      try {
        // Fetch Panchayats and Wards directly from MongoDB collections
        const [panchayatRes, wardList] = await Promise.all([
          getAllPanchayats().catch(() => null),
          getAllWards().catch(() => [])
        ]);

        const validWards = Array.isArray(wardList) ? wardList : [];
        setWards(validWards);

        const pSet = new Set();

        if (Array.isArray(panchayatRes)) {
          panchayatRes.forEach((p) => {
            const name = typeof p === 'string' ? p : (p.panchayatName || p.name);
            if (name) pSet.add(name.trim());
          });
        } else if (panchayatRes && typeof panchayatRes === 'object') {
          const name = panchayatRes.panchayatName || panchayatRes.name;
          if (name) pSet.add(name.trim());
        }

        validWards.forEach((w) => {
          const name = w.panchayatName || w.panchayat;
          if (name) pSet.add(name.trim());
        });

        // Fetch Citizen profile and User account by email
        if (userEmail) {
          try {
            const [citizenData, userAccountData] = await Promise.all([
              getCitizenByEmail(userEmail).catch(() => null),
              getUserByEmail(userEmail).catch(() => null)
            ]);

            const phoneFromUser = userAccountData?.phoneNumber || userObj.phoneNumber || '';
            const phoneFromCitizen = citizenData?.phoneNumber || '';
            const finalPhone = phoneFromCitizen || phoneFromUser;

            if (citizenData) {
              const cleanedAddr = cleanAddressString(citizenData.address || '');
              const loaded = {
                fullName: citizenData.fullName || userAccountData?.fullName || userObj.fullName || '',
                email: citizenData.email || userEmail,
                phoneNumber: finalPhone,
                address: cleanedAddr,
                panchayatName: citizenData.panchayatName || '',
                wardId: citizenData.wardId || ''
              };

              if (loaded.panchayatName) {
                pSet.add(loaded.panchayatName.trim());
              }

              setFormData(loaded);
              setSavedData(loaded);
              setCitizenId(citizenData.citizenId || '');
              setProfileCompleted(Boolean(citizenData.profileCompleted));
            } else if (userAccountData) {
              const loaded = {
                fullName: userAccountData.fullName || userObj.fullName || '',
                email: userAccountData.email || userEmail,
                phoneNumber: userAccountData.phoneNumber || userObj.phoneNumber || '',
                address: '',
                panchayatName: '',
                wardId: ''
              };
              setFormData(loaded);
              setSavedData(loaded);
            }
          } catch (err) {
            console.log("Could not fetch profile details:", err);
          }
        }

        setPanchayats(Array.from(pSet).filter(Boolean));
      } catch (err) {
        console.error("Error loading profile data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userEmail]);

  // Filter wards dynamically based on selected panchayat from database records
  const filteredWards = formData.panchayatName
    ? wards.filter((w) => {
        const pName = w.panchayatName || w.panchayat || '';
        return pName.toLowerCase() === formData.panchayatName.toLowerCase();
      })
    : [];

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    let val = value;

    if (name === 'phoneNumber') {
      val = value.replace(/\D/g, '').slice(0, 10);
    }

    setFormData((prev) => {
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
    setProfileError('');
    setProfileSuccess('');
  };

  const handleCancelEdit = () => {
    setFormData(savedData);
    setIsEditing(false);
    setProfileError('');
    setProfileSuccess('');
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');

    if (!formData.fullName.trim()) {
      setProfileError('Full Name is required.');
      return;
    }

    if (formData.phoneNumber) {
      if (
        formData.phoneNumber.length !== 10 ||
        !/^[6-9][0-9]{9}$/.test(formData.phoneNumber)
      ) {
        setProfileError(
          'Phone number must be exactly 10 digits starting with 6, 7, 8, or 9.'
        );
        return;
      }
    }

    setSaving(true);

    const cleanedAddress = cleanAddressString(formData.address);

    try {
      const response = await updateCitizenProfile({
        email: formData.email,
        fullName: formData.fullName.trim(),
        phoneNumber: formData.phoneNumber.trim(),
        address: cleanedAddress,
        panchayatName: formData.panchayatName,
        wardId: formData.wardId
      });

      const updated = {
        ...formData,
        fullName: formData.fullName.trim(),
        phoneNumber: formData.phoneNumber.trim(),
        address: cleanedAddress
      };

      setFormData(updated);
      setSavedData(updated);
      setProfileSuccess(response.message || 'Profile updated successfully!');
      
      if (cleanedAddress && (formData.panchayatName || formData.wardId)) {
        setProfileCompleted(true);
      }

      const updatedUser = {
        ...userObj,
        fullName: formData.fullName.trim(),
        phoneNumber: formData.phoneNumber.trim()
      };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      localStorage.setItem('userName', formData.fullName.trim());

      window.dispatchEvent(new Event('storage'));
      setIsEditing(false);
    } catch (err) {
      console.error("Update failed:", err);
      const msg = err.response?.data || err.message || 'Failed to update profile.';
      setProfileError(typeof msg === 'string' ? msg : 'Failed to update profile.');
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
                {formData.fullName || 'Citizen Profile'}
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
                    Incomplete Profile (Fill Address)
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

      {/* SECTION: CITIZEN PROFILE DETAILS */}
      <div className="space-y-6">
        {/* Success Banner */}
        {profileSuccess && (
          <div className="p-4 bg-emerald-50 border-l-4 border-emerald-500 text-emerald-800 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-3 shadow-xs animate-fadeIn">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{profileSuccess}</span>
          </div>
        )}

        {/* Error Banner */}
        {profileError && (
          <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-800 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-3 shadow-xs animate-fadeIn">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            <span>{profileError}</span>
          </div>
        )}

        {!isEditing ? (
          /* READ-ONLY PROFILE DETAILS VIEW */
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-emerald-100 shadow-xs space-y-8">
            
            {/* Header Action Bar */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <h2 className="text-xl font-extrabold text-gray-900">Citizen Profile Details</h2>
                <p className="text-xs text-gray-500 mt-0.5">Your official account profile records registered with EcoMind AI.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-4 py-2 bg-[#0a4d2c] hover:bg-[#063820] text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-sm hover:shadow transition-all cursor-pointer"
              >
                <Edit3 className="w-4 h-4" />
                <span>Edit Profile</span>
              </button>
            </div>

            {/* Personal Information Grid */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2">
                <User className="w-5 h-5 text-emerald-700" />
                <h3 className="text-base font-bold text-gray-800">Personal Information</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Full Name */}
                <div className="p-4 rounded-xl bg-gray-50/80 border border-gray-100">
                  <span className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Full Name</span>
                  <p className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <User className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{formData.fullName || 'Not provided'}</span>
                  </p>
                </div>

                {/* Email */}
                <div className="p-4 rounded-xl bg-gray-50/80 border border-gray-100">
                  <span className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Email Address</span>
                  <p className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <Mail className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="truncate">{formData.email || 'Not provided'}</span>
                  </p>
                </div>

                {/* Phone */}
                <div className="p-4 rounded-xl bg-gray-50/80 border border-gray-100">
                  <span className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Phone Number</span>
                  <p className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <Phone className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{formData.phoneNumber || 'Not provided'}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Local Body & Location Details Grid */}
            <div className="space-y-4 pt-4 border-t border-gray-100">
              <div className="flex items-center gap-2 pb-2">
                <Building2 className="w-5 h-5 text-emerald-700" />
                <h3 className="text-base font-bold text-gray-800">Local Body & Location Details</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Panchayat Name */}
                <div className="p-4 rounded-xl bg-gray-50/80 border border-gray-100">
                  <span className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Panchayat / Local Body</span>
                  <p className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{formData.panchayatName || 'Not selected'}</span>
                  </p>
                </div>

                {/* Ward */}
                <div className="p-4 rounded-xl bg-gray-50/80 border border-gray-100">
                  <span className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Ward Number / Name</span>
                  <p className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <Award className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{formData.wardId || 'Not selected'}</span>
                  </p>
                </div>
              </div>

              {/* Residential Address */}
              <div className="p-4 rounded-xl bg-gray-50/80 border border-gray-100">
                <span className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Residential Address</span>
                <p className="text-sm font-medium text-gray-800 flex items-start gap-2 pt-0.5">
                  <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span className="whitespace-pre-line">{cleanAddressString(formData.address) || 'No address provided.'}</span>
                </p>
              </div>
            </div>

          </div>
        ) : (
          /* EDITABLE FORM MODE */
          <form onSubmit={handleProfileSubmit} className="bg-white rounded-2xl p-6 sm:p-8 border border-emerald-100 shadow-md space-y-8 animate-fadeIn">
            
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <h2 className="text-xl font-extrabold text-[#0a4d2c]">Edit Citizen Profile</h2>
                <p className="text-xs text-gray-500 mt-0.5">Update your personal details and location settings below.</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                  <span>Cancel</span>
                </button>
              </div>
            </div>

            {/* Section 1: Personal Information */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
                <User className="w-5 h-5 text-emerald-700" />
                <h3 className="text-base font-bold text-gray-800">Personal Information</h3>
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
                      onChange={handleProfileChange}
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
                      onChange={handleProfileChange}
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
                <h3 className="text-base font-bold text-gray-800">Local Body & Location Details</h3>
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
                      onChange={handleProfileChange}
                      className="w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-colors cursor-pointer"
                    >
                      <option value="">-- Select Panchayat --</option>
                      {panchayats.map((pName, idx) => (
                        <option key={idx} value={pName}>
                          {pName}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Ward Selection Dropdown */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">Select Ward *</label>
                  <div className="relative rounded-lg shadow-2xs">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                      <Award className="w-4 h-4" />
                    </div>
                    <select
                      name="wardId"
                      value={formData.wardId}
                      onChange={handleProfileChange}
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
                    onChange={handleProfileChange}
                    placeholder="House Name / Flat No, Street, Landmark, Pincode"
                    className="w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleCancelEdit}
                disabled={saving}
                className="w-full sm:w-auto px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="w-full sm:w-auto px-6 py-2.5 bg-[#0a4d2c] hover:bg-[#063820] text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving Profile...</span>
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
        )}
      </div>

    </div>
  );
};

export default CitizenProfile;
