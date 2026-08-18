import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  X,
  Home,
  Navigation,
  Compass,
  Search,
  Map as MapIcon,
  Info,
  LocateFixed
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';
import {
  getCitizenByEmail,
  updateCitizenProfile,
  getAllPanchayats,
  getAllWards
} from '../services/citizenService';
import { getUserByEmail } from '../services/userService';

// Fix Leaflet default icon paths in React Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom Component to change map center smoothly when coordinates change
function ChangeView({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.setView(center, zoom, { animate: true });
    }
  }, [center, zoom, map]);
  return null;
}

// Custom Component to handle map clicks to move marker
function MapClickHandler({ onLocationSelect }) {
  useMapEvents({
    click(e) {
      if (e.latlng) {
        onLocationSelect(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
}

const DEFAULT_CENTER = [9.5583, 76.7842]; // Fallback coordinates (Kerala)

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

  // Profile Form Data (Unified Address + House Name + House Number + Map GPS Coordinates)
  const [formData, setFormData] = useState({
    fullName: userObj.fullName || '',
    email: userEmail,
    phoneNumber: userObj.phoneNumber || '',
    houseName: '',   // Manually entered house name
    houseNumber: '', // Manually entered house number
    address: '',     // Unified Address field (supports manual typing + geocoding search)
    panchayatName: '',
    wardId: '',
    latitude: DEFAULT_CENTER[0],
    longitude: DEFAULT_CENTER[1]
  });

  // Saved / Original Citizen Profile Data (to revert on Cancel)
  const [savedData, setSavedData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    houseName: '',
    houseNumber: '',
    address: '',
    panchayatName: '',
    wardId: '',
    latitude: DEFAULT_CENTER[0],
    longitude: DEFAULT_CENTER[1]
  });

  const [citizenId, setCitizenId] = useState('');
  const [profileCompleted, setProfileCompleted] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState('Pending');
  const [panchayats, setPanchayats] = useState([]);
  const [wards, setWards] = useState([]);

  // Geocoding & Suggestions State for Unified Address Input
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);
  const [gettingLiveLocation, setGettingLiveLocation] = useState(false);
  const [zoom, setZoom] = useState(15);
  const markerRef = useRef(null);

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
              const hasCoords = Boolean(citizenData.latitude && citizenData.longitude);
              const lat = hasCoords ? citizenData.latitude : DEFAULT_CENTER[0];
              const lng = hasCoords ? citizenData.longitude : DEFAULT_CENTER[1];

              const loaded = {
                fullName: citizenData.fullName || userAccountData?.fullName || userObj.fullName || '',
                email: citizenData.email || userEmail,
                phoneNumber: finalPhone,
                houseName: citizenData.houseName || '',
                houseNumber: citizenData.houseNumber || '',
                address: cleanedAddr,
                panchayatName: citizenData.panchayatName || '',
                wardId: citizenData.wardId || '',
                latitude: lat,
                longitude: lng
              };

              if (loaded.panchayatName) {
                pSet.add(loaded.panchayatName.trim());
              }

              setFormData(loaded);
              setSavedData(loaded);
              setCitizenId(citizenData.citizenId || '');
              setProfileCompleted(Boolean(citizenData.profileCompleted));
              const verifiedState = Boolean(citizenData.isVerified || citizenData.status === 'Verified');
              setIsVerified(verifiedState);
              setVerificationStatus(citizenData.status || (verifiedState ? 'Verified' : 'Pending Verification'));
            } else if (userAccountData) {
              const loaded = {
                fullName: userAccountData.fullName || userObj.fullName || '',
                email: userAccountData.email || userEmail,
                phoneNumber: userAccountData.phoneNumber || userObj.phoneNumber || '',
                houseName: '',
                houseNumber: '',
                address: '',
                panchayatName: '',
                wardId: '',
                latitude: DEFAULT_CENTER[0],
                longitude: DEFAULT_CENTER[1]
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

  // Debounced geocoding search as user types into the unified Address input
  useEffect(() => {
    if (!formData.address || formData.address.trim().length < 3 || !isEditing) {
      setSuggestions([]);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const response = await axios.get(
          `https://nominatim.openstreetmap.org/search`,
          {
            params: {
              q: formData.address,
              format: 'json',
              addressdetails: 1,
              limit: 5,
            },
            headers: {
              'Accept-Language': 'en',
            },
          }
        );
        setSuggestions(response.data || []);
      } catch (err) {
        console.error("Nominatim geocoding error:", err);
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [formData.address, isEditing]);

  // Reverse geocode when marker is dragged or map is clicked
  const reverseGeocode = async (lat, lng) => {
    setIsReverseGeocoding(true);
    try {
      const response = await axios.get(`https://nominatim.openstreetmap.org/reverse`, {
        params: {
          lat: lat,
          lon: lng,
          format: 'json',
          addressdetails: 1
        }
      });
      if (response.data && response.data.display_name) {
        const cleaned = cleanAddressString(response.data.display_name);
        setFormData((prev) => ({
          ...prev,
          address: cleaned
        }));
      }
    } catch (err) {
      console.warn("Reverse geocoding error:", err);
    } finally {
      setIsReverseGeocoding(false);
    }
  };

  // Live GPS Location Detection Button
  const handleGetLiveLocation = () => {
    if (!navigator.geolocation) {
      setProfileError('Geolocation is not supported by your browser.');
      return;
    }

    setGettingLiveLocation(true);
    setProfileError('');
    setProfileSuccess('');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = parseFloat(pos.coords.latitude.toFixed(6));
        const lng = parseFloat(pos.coords.longitude.toFixed(6));

        setFormData((prev) => ({
          ...prev,
          latitude: lat,
          longitude: lng
        }));
        setZoom(17);

        reverseGeocode(lat, lng);
        setGettingLiveLocation(false);
        setProfileSuccess('Live GPS location detected successfully!');
      },
      (err) => {
        console.error("Geolocation error:", err);
        setGettingLiveLocation(false);
        let msg = 'Failed to get live location.';
        if (err.code === err.PERMISSION_DENIED) {
          msg = 'Geolocation permission denied. Please allow location access in your browser.';
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          msg = 'Location information unavailable. Please try again.';
        } else if (err.code === err.TIMEOUT) {
          msg = 'Location request timed out. Please try again.';
        }
        setProfileError(msg);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Handle selecting an address suggestion from dropdown
  const handleSelectSuggestion = (item) => {
    const lat = parseFloat(parseFloat(item.lat).toFixed(6));
    const lon = parseFloat(parseFloat(item.lon).toFixed(6));
    const selectedAddr = cleanAddressString(item.display_name);

    setFormData((prev) => ({
      ...prev,
      latitude: lat,
      longitude: lon,
      address: selectedAddr
    }));
    setZoom(16);
    setShowSuggestions(false);
    setSuggestions([]);
    setProfileError('');
    setProfileSuccess('');
  };

  // Handle marker drag end
  const handleMarkerDragEnd = (newLat, newLng) => {
    const lat = parseFloat(newLat.toFixed(6));
    const lng = parseFloat(newLng.toFixed(6));
    setFormData((prev) => ({
      ...prev,
      latitude: lat,
      longitude: lng
    }));
    setProfileError('');
    setProfileSuccess('');
    reverseGeocode(lat, lng);
  };

  const markerEventHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current;
        if (marker != null) {
          const latLng = marker.getLatLng();
          handleMarkerDragEnd(latLng.lat, latLng.lng);
        }
      },
    }),
    []
  );

  // Handle direct map click to set location
  const handleMapClick = (lat, lng) => {
    const cleanLat = parseFloat(lat.toFixed(6));
    const cleanLng = parseFloat(lng.toFixed(6));
    setFormData((prev) => ({
      ...prev,
      latitude: cleanLat,
      longitude: cleanLng
    }));
    setProfileError('');
    setProfileSuccess('');
    reverseGeocode(cleanLat, cleanLng);
  };

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
    if (name === 'address') {
      setShowSuggestions(true);
    }
    setProfileError('');
    setProfileSuccess('');
  };

  const handleCancelEdit = () => {
    setFormData(savedData);
    setShowSuggestions(false);
    setSuggestions([]);
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
        houseName: formData.houseName?.trim() || '',
        houseNumber: formData.houseNumber.trim(),
        address: cleanedAddress,
        panchayatName: formData.panchayatName,
        wardId: formData.wardId,
        latitude: formData.latitude,
        longitude: formData.longitude
      });

      const updated = {
        ...formData,
        fullName: formData.fullName.trim(),
        phoneNumber: formData.phoneNumber.trim(),
        houseName: formData.houseName?.trim() || '',
        houseNumber: formData.houseNumber.trim(),
        address: cleanedAddress,
        latitude: formData.latitude,
        longitude: formData.longitude
      };

      setFormData(updated);
      setSavedData(updated);
      setProfileSuccess(response.message || 'Profile updated successfully!');
      
      if (cleanedAddress && (formData.panchayatName || formData.wardId)) {
        setProfileCompleted(true);
        if (!isVerified) {
          setVerificationStatus('Pending Verification');
        }
      }

      const updatedUser = {
        ...userObj,
        fullName: formData.fullName.trim(),
        phoneNumber: formData.phoneNumber.trim(),
        houseName: formData.houseName?.trim() || '',
        houseNumber: formData.houseNumber.trim(),
        address: cleanedAddress,
        latitude: formData.latitude,
        longitude: formData.longitude
      };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      localStorage.setItem('userName', formData.fullName.trim());

      window.dispatchEvent(new Event('storage'));
      setIsEditing(false);
      setShowSuggestions(false);
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

  const mapCenter = [formData.latitude || DEFAULT_CENTER[0], formData.longitude || DEFAULT_CENTER[1]];

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

              {isVerified ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/30 text-emerald-200 border border-emerald-400/50 shadow-xs">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
                  Verified by Admin
                </span>
              ) : profileCompleted ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/30 text-amber-100 border border-amber-400/50 shadow-xs">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-300" />
                  Pending Admin Verification
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-white/10 text-white/80 border border-white/20">
                  Unverified Profile
                </span>
              )}
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

        {/* Verification Status Informational Banners */}
        {profileCompleted && !isVerified && (
          <div className="p-4 bg-amber-50 border-l-4 border-amber-500 text-amber-900 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-3 shadow-xs animate-fadeIn">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <p className="font-bold text-amber-900">Profile Pending Admin Verification</p>
              <p className="text-xs text-amber-800 mt-0.5">
                Your completed profile details have been submitted. An Administrator must verify your profile before you can submit plastic waste pickup requests.
              </p>
            </div>
          </div>
        )}

        {isVerified && (
          <div className="p-4 bg-emerald-50 border-l-4 border-emerald-500 text-emerald-900 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-3 shadow-xs animate-fadeIn">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <p className="font-bold text-emerald-900">Profile Verified by Admin</p>
              <p className="text-xs text-emerald-800 mt-0.5">
                Your residence profile has been verified by the administrator. You have full access to submit pickup requests.
              </p>
            </div>
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

            {/* Local Body & House Location Grid */}
            <div className="space-y-4 pt-4 border-t border-gray-100">
              <div className="flex items-center gap-2 pb-2">
                <Building2 className="w-5 h-5 text-emerald-700" />
                <h3 className="text-base font-bold text-gray-800">Local Body & House Details</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                {/* House Name */}
                <div className="p-4 rounded-xl bg-gray-50/80 border border-gray-100">
                  <span className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">House Name</span>
                  <p className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <Home className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{formData.houseName || 'Not provided'}</span>
                  </p>
                </div>

                {/* House Number */}
                <div className="p-4 rounded-xl bg-gray-50/80 border border-gray-100">
                  <span className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">House Number</span>
                  <p className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <Home className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{formData.houseNumber || 'Not provided'}</span>
                  </p>
                </div>

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

              {/* Residential House Address */}
              <div className="p-4 rounded-xl bg-gray-50/80 border border-gray-100">
                <span className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Residential House Address</span>
                <p className="text-sm font-medium text-gray-800 flex items-start gap-2 pt-0.5">
                  <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span className="whitespace-pre-line">{cleanAddressString(formData.address) || 'No address provided.'}</span>
                </p>
              </div>

              {/* Saved Map Location & GPS Coordinates */}
              <div className="pt-2 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Navigation className="w-4 h-4 text-emerald-700" />
                    <span className="text-xs font-extrabold text-gray-700 uppercase tracking-wider">Pinpointed Map Location & GPS</span>
                  </div>
                  <div className="flex items-center gap-2 font-mono text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                    <Compass className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Lat: {formData.latitude ? formData.latitude.toFixed(6) : '0.000000'}, Lng: {formData.longitude ? formData.longitude.toFixed(6) : '0.000000'}</span>
                  </div>
                </div>

                <div className="h-[280px] w-full rounded-2xl overflow-hidden border border-emerald-200 shadow-inner relative z-0">
                  <MapContainer
                    center={mapCenter}
                    zoom={15}
                    scrollWheelZoom={false}
                    className="h-full w-full"
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <ChangeView center={mapCenter} zoom={15} />
                    <Marker position={mapCenter} draggable={false}>
                      <Popup>
                        <div className="p-1 text-xs">
                          <p className="font-bold text-emerald-900">Your House Location Pin</p>
                          <p className="text-gray-600 mt-1 max-w-[200px] truncate">{cleanAddressString(formData.address) || 'Saved Location'}</p>
                        </div>
                      </Popup>
                    </Marker>
                  </MapContainer>
                </div>
              </div>

            </div>

          </div>
        ) : (
          /* EDITABLE FORM MODE */
          <form onSubmit={handleProfileSubmit} className="bg-white rounded-2xl p-6 sm:p-8 border border-emerald-100 shadow-md space-y-8 animate-fadeIn">
            
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <h2 className="text-xl font-extrabold text-[#0a4d2c]">Edit Citizen Profile</h2>
                <p className="text-xs text-gray-500 mt-0.5">Enter your address manually or search location in the unified address field below.</p>
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

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
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

            {/* Section 2: Local Body & House Details */}
            <div className="space-y-4 pt-4 border-t border-gray-100">
              <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
                <Building2 className="w-5 h-5 text-emerald-700" />
                <h3 className="text-base font-bold text-gray-800">Local Body & House Details</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                {/* House Name (Manually Entered by Citizen) */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">House Name</label>
                  <div className="relative rounded-lg shadow-2xs">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                      <Home className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      name="houseName"
                      value={formData.houseName}
                      onChange={handleProfileChange}
                      placeholder="e.g. Newhouse"
                      className="w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-colors"
                    />
                  </div>
                </div>

                {/* House Number (Manually Entered by Citizen) */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">House Number</label>
                  <div className="relative rounded-lg shadow-2xs">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                      <Home className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      name="houseNumber"
                      value={formData.houseNumber}
                      onChange={handleProfileChange}
                      placeholder="e.g. 12/345"
                      className="w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-colors"
                    />
                  </div>
                </div>

                {/* Panchayat Name Dropdown */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">Panchayat *</label>
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
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">Ward *</label>
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
                        <option value="">-- Select a Panchayat --</option>
                      ) : filteredWards.length === 0 ? (
                        <option value="">-- No Wards found --</option>
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

              {/* UNIFIED RESIDENTIAL HOUSE ADDRESS (Manual Entry + Auto Suggestions) */}
              <div className="space-y-1.5 pt-2 relative">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                    Residential House Address (Enter / Search Location) *
                  </label>
                  {isSearching && (
                    <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1 animate-pulse">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Searching location suggestions...
                    </span>
                  )}
                </div>

                <div className="relative rounded-xl shadow-2xs">
                  <div className="absolute top-3 left-0 pl-3 flex items-start pointer-events-none text-gray-400">
                    <MapPin className="w-4 h-4 text-emerald-600" />
                  </div>
                  <textarea
                    name="address"
                    rows={3}
                    value={formData.address}
                    onChange={handleProfileChange}
                    onFocus={() => setShowSuggestions(true)}
                    placeholder="Type house name, street, landmark or search area (e.g. Newhouse, Cheruvally, Kanjirappally)"
                    className="w-full pl-9 pr-4 py-2.5 text-xs sm:text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-colors"
                  />
                </div>

                {/* Suggestions Dropdown attached to the Unified Address Field */}
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-emerald-100 rounded-xl shadow-xl max-h-60 overflow-y-auto divide-y divide-gray-100">
                    <div className="px-3 py-1.5 bg-emerald-50/70 border-b border-emerald-100 text-[10px] font-bold text-emerald-900 uppercase tracking-wider">
                      Location Search Suggestions (Click to pin on map)
                    </div>
                    {suggestions.map((item, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectSuggestion(item)}
                        className="w-full text-left px-4 py-3 hover:bg-emerald-50/80 transition-colors flex items-start gap-3 group cursor-pointer"
                      >
                        <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                        <div>
                          <p className="text-xs sm:text-sm font-semibold text-gray-800 group-hover:text-[#0a4d2c]">
                            {item.display_name}
                          </p>
                          <p className="text-[10px] text-gray-400 uppercase tracking-wider mt-0.5">
                            {item.type || 'Location'} • {item.class || 'Address'}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Section 3: Interactive Live Location Map & GPS Capture */}
            <div className="space-y-5 pt-4 border-t border-gray-100">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <MapIcon className="w-5 h-5 text-emerald-700" />
                  <div>
                    <h3 className="text-base font-bold text-gray-800">Pinpoint Live House Location on Map</h3>
                    <p className="text-xs text-gray-500">Capture live GPS coordinates or drag the map pin to mark your exact house position.</p>
                  </div>
                </div>

                {/* Detect Live GPS Location Button */}
                <button
                  type="button"
                  onClick={handleGetLiveLocation}
                  disabled={gettingLiveLocation}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-xs hover:shadow transition-all cursor-pointer disabled:opacity-50 shrink-0"
                >
                  {gettingLiveLocation ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Detecting Live GPS...</span>
                    </>
                  ) : (
                    <>
                      <LocateFixed className="w-4 h-4 text-emerald-200" />
                      <span>Use Current Live Location</span>
                    </>
                  )}
                </button>
              </div>

              {/* Leaflet Map Display */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-gray-700 flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-emerald-600" />
                    Drag marker or click anywhere on map to adjust exact house position
                  </span>
                  {isReverseGeocoding && (
                    <span className="text-emerald-700 font-semibold flex items-center gap-1 animate-pulse">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Updating location pin...
                    </span>
                  )}
                </div>

                <div className="h-[360px] w-full rounded-2xl overflow-hidden border border-emerald-200 shadow-inner relative z-0">
                  <MapContainer
                    center={mapCenter}
                    zoom={zoom}
                    scrollWheelZoom={true}
                    className="h-full w-full"
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <ChangeView center={mapCenter} zoom={zoom} />
                    <MapClickHandler onLocationSelect={handleMapClick} />

                    <Marker
                      position={mapCenter}
                      draggable={true}
                      eventHandlers={markerEventHandlers}
                      ref={markerRef}
                    >
                      <Popup>
                        <div className="p-1 text-xs">
                          <p className="font-bold text-emerald-900">Your House Location Pin</p>
                          <p className="text-gray-600 mt-1 truncate max-w-[200px]">{formData.address || 'Selected Location'}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">Drag to adjust position</p>
                        </div>
                      </Popup>
                    </Marker>
                  </MapContainer>
                </div>
              </div>

              {/* Coordinates Preview Cards (Read-only Display, No Manual Typing Required) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200 shadow-2xs">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Latitude (GPS)</span>
                  <p className="text-sm font-mono font-extrabold text-gray-800 mt-0.5">
                    {formData.latitude ? formData.latitude.toFixed(6) : '0.000000'}
                  </p>
                </div>

                <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200 shadow-2xs">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Longitude (GPS)</span>
                  <p className="text-sm font-mono font-extrabold text-gray-800 mt-0.5">
                    {formData.longitude ? formData.longitude.toFixed(6) : '0.000000'}
                  </p>
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
