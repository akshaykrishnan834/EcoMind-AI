import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import WorkerSidebar from '../components/WorkerSidebar';
import WorkerCitizens from './worker/WorkerCitizens';
import WorkerPickups from './worker/WorkerPickups';
import Footer from '../components/Footer';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Mail,
  Phone,
  ShieldCheck,
  Building2,
  CheckCircle2,
  MapPin,
  BadgeCheck,
  Edit3,
  X,
  Save,
  AlertCircle,
  Users,
  LocateFixed,
  Sparkles,
  TrendingUp,
  Calendar,
  Clock,
  ArrowRight,
  RefreshCw,
  Award,
  Truck
} from 'lucide-react';
import { getUserByEmail, updateUserProfile } from '../services/userService';
import { getAllCitizens, getCitizensByWard } from '../services/citizenService';
import { getAllWorkers } from '../services/workerService';

const WorkerDashboard = () => {
  const [activeTab, setActiveTabState] = useState(() => {
    return sessionStorage.getItem('workerActiveTab') || 'Dashboard';
  });

  const setActiveTab = (tab) => {
    setActiveTabState(tab);
    sessionStorage.setItem('workerActiveTab', tab);
  };

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const initialUser = JSON.parse(localStorage.getItem('user') || '{}');
  const [profile, setProfile] = useState({
    fullName: initialUser.fullName || localStorage.getItem('userName') || 'Worker',
    email: initialUser.email || '',
    phone: initialUser.phoneNumber || initialUser.phone || '',
    role: initialUser.role || 'Haritha Karma Sena Worker',
    wardId: initialUser.wardId || ''
  });

  // Ward & Citizen Summary Stats
  const [wardCitizens, setWardCitizens] = useState([]);
  const [loadingStats, setLoadingStats] = useState(true);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({ fullName: '', phone: '' });
  const [editError, setEditError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Time-based greeting helper
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  // Fetch worker profile & assigned ward citizens data
  const loadDashboardData = async () => {
    setLoadingStats(true);
    let workerWard = profile.wardId || initialUser.wardId || '';

    try {
      if (profile.email) {
        // Fetch user from db
        const dbUser = await getUserByEmail(profile.email).catch(() => null);
        const workersList = await getAllWorkers().catch(() => []);

        let matchedWorker = null;
        if (Array.isArray(workersList)) {
          matchedWorker = workersList.find(
            (w) => w.email && w.email.toLowerCase() === profile.email.toLowerCase()
          );
        }

        const finalName = matchedWorker?.fullName || dbUser?.fullName || profile.fullName;
        const finalPhone = matchedWorker?.phoneNumber || dbUser?.phoneNumber || profile.phone;
        const finalWard = matchedWorker?.wardId || dbUser?.wardId || workerWard;

        setProfile((prev) => ({
          ...prev,
          fullName: finalName,
          phone: finalPhone,
          wardId: finalWard
        }));
        workerWard = finalWard;

        // Sync localStorage
        const currentUserObj = JSON.parse(localStorage.getItem('user') || '{}');
        localStorage.setItem('user', JSON.stringify({
          ...currentUserObj,
          fullName: finalName,
          phoneNumber: finalPhone,
          wardId: finalWard
        }));
        localStorage.setItem('userName', finalName);
      }

      // Fetch citizens for assigned ward
      let citizensList = [];
      if (workerWard) {
        citizensList = await getCitizensByWard(workerWard).catch(() => []);
      }
      if (!Array.isArray(citizensList) || citizensList.length === 0) {
        const all = await getAllCitizens().catch(() => []);
        if (Array.isArray(all)) {
          if (workerWard) {
            const cleanW = workerWard.trim().toLowerCase();
            citizensList = all.filter(c => c.wardId && c.wardId.trim().toLowerCase() === cleanW);
          } else {
            citizensList = all;
          }
        }
      }

      setWardCitizens(citizensList || []);
    } catch (err) {
      console.error("Dashboard data load error:", err);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Protect route & prevent back-button access after logout
  useEffect(() => {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    if (!isLoggedIn) {
      navigate('/', { replace: true });
      return;
    }

    const handlePopState = () => {
      const stillLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
      if (!stillLoggedIn) {
        window.history.pushState(null, '', window.location.href);
        navigate('/', { replace: true });
      }
    };

    window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userName');
    sessionStorage.clear();
    navigate('/', { replace: true });
  };

  const handleOpenEditModal = () => {
    setEditFormData({
      fullName: profile.fullName,
      phone: profile.phone
    });
    setEditError('');
    setIsEditModalOpen(true);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setEditError('');

    const cleanPhone = editFormData.phone.replace(/\D/g, '').slice(0, 10);
    if (!cleanPhone) {
      setEditError('Mobile number is required.');
      return;
    }

    if (!/^[6-9]/.test(cleanPhone)) {
      setEditError('Mobile number must start with 6, 7, 8, or 9.');
      return;
    }

    if (cleanPhone.length !== 10) {
      setEditError('Mobile number must contain exactly 10 digits.');
      return;
    }

    if (!editFormData.fullName.trim() || editFormData.fullName.trim().length < 3) {
      setEditError('Full Name must contain at least 3 characters.');
      return;
    }

    try {
      setIsSaving(true);
      await updateUserProfile({
        email: profile.email,
        fullName: editFormData.fullName.trim(),
        phoneNumber: cleanPhone
      });

      setProfile((prev) => ({
        ...prev,
        fullName: editFormData.fullName.trim(),
        phone: cleanPhone
      }));

      // Sync localStorage
      const currentUserObj = JSON.parse(localStorage.getItem('user') || '{}');
      localStorage.setItem('user', JSON.stringify({
        ...currentUserObj,
        fullName: editFormData.fullName.trim(),
        phoneNumber: cleanPhone
      }));
      localStorage.setItem('userName', editFormData.fullName.trim());

      setIsEditModalOpen(false);
      setSuccessMsg('Profile updated successfully!');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.log('Update Profile Error:', err);
      if (err.response && typeof err.response.data === 'string') {
        setEditError(err.response.data);
      } else if (err.response && err.response.data?.message) {
        setEditError(err.response.data.message);
      } else {
        setEditError('Failed to update profile. Please try again.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Stats calculation
  const totalCitizensCount = wardCitizens.length;
  const mapPinCount = wardCitizens.filter((c) => c.latitude && c.longitude && (c.latitude !== 0 || c.longitude !== 0)).length;
  const completedProfilesCount = wardCitizens.filter((c) => c.profileCompleted || (c.address && c.houseNumber)).length;
  const completionRate = totalCitizensCount > 0 ? Math.round((completedProfilesCount / totalCitizensCount) * 100) : 0;

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-[#f3f7f5] font-sans">
      {/* Top Header (Fixed at top) */}
      <div className="shrink-0 z-40 border-b border-emerald-100/80 shadow-2xs">
        <Header />
      </div>

      {/* Main Content Layout with Sidebar */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        <WorkerSidebar
          activeItem={activeTab}
          setActiveItem={setActiveTab}
          onLogout={handleLogout}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          isOpen={isMobileSidebarOpen}
          onClose={() => setIsMobileSidebarOpen(false)}
        />

        {/* Main Workspace (Scrolls Vertically) */}
        <main className="flex-1 h-full overflow-y-auto flex flex-col justify-between bg-[#f3f7f5] min-w-0">
          <div className="p-4 sm:p-6 lg:p-8 space-y-6 flex-1">
            {successMsg && (
            <div className="max-w-5xl mx-auto p-4 bg-emerald-50 border-l-4 border-emerald-500 text-emerald-800 text-sm font-bold rounded-xl flex items-center gap-3 shadow-xs animate-fadeIn">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {activeTab === 'Profile' ? (
            /* WORKER PROFILE SECTION */
            <div className="max-w-5xl mx-auto space-y-6 animate-fadeIn">
              {/* Glassmorphic Profile Banner */}
              <div className="bg-gradient-to-r from-[#0a4d2c] via-[#0f5b37] to-emerald-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
                <div className="absolute right-0 top-0 translate-x-1/4 -translate-y-1/4 w-72 h-72 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
                  <div className="flex flex-col sm:flex-row items-center gap-6">
                    <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-white/10 border-4 border-white/20 flex items-center justify-center text-3xl font-extrabold shadow-inner shrink-0 backdrop-blur-md text-emerald-200">
                      {profile.fullName[0] ? profile.fullName[0].toUpperCase() : <User className="w-12 h-12" />}
                    </div>

                    <div className="space-y-2">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 text-xs font-semibold">
                        <BadgeCheck className="w-4 h-4 text-emerald-300" />
                        <span>Haritha Karma Sena Worker</span>
                      </div>

                      <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                        {profile.fullName}
                      </h1>

                      <p className="text-xs sm:text-sm text-emerald-100/90 font-medium">
                        Assigned Ward: <span className="font-extrabold text-white underline">{profile.wardId || 'Ward 1'}</span>
                      </p>

                      <div className="pt-1 flex flex-wrap items-center justify-center sm:justify-start gap-3">
                        <span className="inline-flex items-center gap-1.5 text-xs bg-white/15 px-3 py-1 rounded-full text-emerald-100 font-medium border border-white/20">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" /> Active Service Duty
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleOpenEditModal}
                    className="py-3 px-6 bg-white text-[#0a4d2c] hover:bg-emerald-50 font-extrabold text-xs sm:text-sm rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2 shrink-0 cursor-pointer"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>Edit Profile</span>
                  </button>
                </div>
              </div>

              {/* Profile Information Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Personal Information */}
                <div className="bg-white rounded-2xl p-6 border border-emerald-100 shadow-xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2.5 rounded-xl bg-emerald-50 text-[#0a4d2c]">
                        <User className="w-5 h-5" />
                      </div>
                      <div>
                        <h2 className="text-base font-extrabold text-gray-900">Personal Information</h2>
                        <p className="text-xs text-gray-500">Contact & personal profile details</p>
                      </div>
                    </div>

                    <button
                      onClick={handleOpenEditModal}
                      className="text-xs font-bold text-[#0a4d2c] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Edit
                    </button>
                  </div>

                  <div className="space-y-3 pt-1">
                    <div>
                      <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Full Name</label>
                      <p className="text-sm font-semibold text-gray-800 mt-0.5">{profile.fullName}</p>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Email Address</label>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Mail className="w-4 h-4 text-emerald-600 shrink-0" />
                        <p className="text-sm font-semibold text-gray-800">{profile.email}</p>
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Mobile Number</label>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Phone className="w-4 h-4 text-emerald-600 shrink-0" />
                        <p className="text-sm font-bold text-[#0a4d2c]">{profile.phone || 'N/A'}</p>
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Assigned Ward</label>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Award className="w-4 h-4 text-emerald-600 shrink-0" />
                        <p className="text-sm font-bold text-gray-900">{profile.wardId || 'Unassigned'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Organization & Scope Info */}
                <div className="bg-white rounded-2xl p-6 border border-emerald-100 shadow-xs space-y-4">
                  <div className="flex items-center gap-2.5 pb-3 border-b border-gray-100">
                    <div className="p-2.5 rounded-xl bg-emerald-50 text-[#0a4d2c]">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-base font-extrabold text-gray-900">Organization & Service Unit</h2>
                      <p className="text-xs text-gray-500">Government service affiliation</p>
                    </div>
                  </div>

                  <div className="space-y-3 pt-1">
                    <div>
                      <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Organization</label>
                      <p className="text-sm font-semibold text-gray-800 mt-0.5">Haritha Karma Sena (HKS)</p>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Department</label>
                      <p className="text-sm font-semibold text-gray-800 mt-0.5">Local Self Government Department (LSGD), Kerala</p>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Service Scope</label>
                      <div className="flex items-center gap-2 mt-0.5">
                        <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                        <p className="text-sm font-semibold text-gray-800">Smart Waste Collection & Recycling Management</p>
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Status</label>
                      <div className="mt-0.5">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          Active Registered Worker
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : activeTab === 'Pickup Requests' || activeTab === 'Plastic Pickups' ? (
            /* WARD PLASTIC PICKUPS TAB */
            <WorkerPickups wardId={profile.wardId || 'Ward 1'} workerId={profile.email || 'WORKER001'} />
          ) : activeTab === 'Assigned Citizens' || activeTab === 'Ward Citizens' ? (
            /* WARD CITIZENS DIRECTORY TAB */
            <WorkerCitizens />
          ) : (
            /* DEFAULT DASHBOARD HOME OVERVIEW */
            <div className="max-w-5xl mx-auto space-y-6 animate-fadeIn">
              
              {/* Glassmorphic Hero Banner */}
              <div className="bg-gradient-to-r from-[#0a4d2c] via-[#0f5b37] to-emerald-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
                <div className="absolute right-0 top-0 translate-x-1/4 -translate-y-1/4 w-72 h-72 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="space-y-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-emerald-200 text-xs font-semibold">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
                      <span>{getGreeting()}, {profile.fullName}!</span>
                    </div>

                    <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                      Haritha Karma Sena Worker Portal
                    </h1>

                    <p className="text-xs sm:text-sm text-emerald-100/90 font-medium max-w-xl">
                      Manage household waste collections, view citizen profiles, and navigate live GPS house maps for your assigned ward.
                    </p>

                    <div className="pt-2 flex flex-wrap items-center gap-3">
                      <span className="px-3 py-1 bg-emerald-900/80 border border-emerald-400/40 text-emerald-200 font-extrabold text-xs rounded-xl flex items-center gap-1.5">
                        <Award className="w-3.5 h-3.5 text-emerald-300" />
                        Assigned Ward: {profile.wardId || 'Ward 1'}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
                    <button
                      type="button"
                      onClick={() => setActiveTab('Pickup Requests')}
                      className="px-6 py-3 bg-white hover:bg-emerald-50 text-[#0a4d2c] font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Truck className="w-4 h-4 text-[#0a4d2c]" />
                      <span>Plastic Pickups</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('Assigned Citizens')}
                      className="px-6 py-3 bg-emerald-900/80 hover:bg-emerald-950 border border-emerald-400/40 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Users className="w-4 h-4 text-emerald-300" />
                      <span>Ward Citizens</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Interactive KPI Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Metric 1: Assigned Citizens */}
                <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-2xs hover:shadow-md transition-all space-y-2 group">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Assigned Citizens</span>
                    <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-700 group-hover:scale-110 transition-transform">
                      <Users className="w-5 h-5" />
                    </div>
                  </div>
                  <p className="text-2xl font-extrabold text-gray-900">{totalCitizensCount}</p>
                  <p className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Citizens in {profile.wardId || 'Assigned Ward'}
                  </p>
                </div>

                {/* Metric 2: GPS Map Locations Set */}
                <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-2xs hover:shadow-md transition-all space-y-2 group">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">GPS Map Pins Set</span>
                    <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-700 group-hover:scale-110 transition-transform">
                      <LocateFixed className="w-5 h-5" />
                    </div>
                  </div>
                  <p className="text-2xl font-extrabold text-gray-900">{mapPinCount}</p>
                  <p className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> Ready for live map navigation
                  </p>
                </div>

                {/* Metric 3: Profile Completion Rate */}
                <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-2xs hover:shadow-md transition-all space-y-2 group">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Profile Completion</span>
                    <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-700 group-hover:scale-110 transition-transform">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                  </div>
                  <p className="text-2xl font-extrabold text-gray-900">{completionRate}%</p>
                  <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-600 h-full rounded-full transition-all duration-500" style={{ width: `${completionRate}%` }} />
                  </div>
                </div>

                {/* Metric 4: Duty Status */}
                <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-2xs hover:shadow-md transition-all space-y-2 group">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Collection Duty</span>
                    <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-700 group-hover:scale-110 transition-transform">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                  </div>
                  <p className="text-lg font-extrabold text-emerald-800">Active</p>
                  <p className="text-[11px] font-semibold text-gray-500 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-emerald-600" /> Daily collection active
                  </p>
                </div>
              </div>

              {/* Dashboard Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Ward Collection Summary Card */}
                <div className="bg-white p-6 rounded-2xl border border-emerald-100 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2.5 rounded-xl bg-emerald-50 text-[#0a4d2c]">
                        <Users className="w-5 h-5" />
                      </div>
                      <div>
                        <h2 className="text-base font-extrabold text-gray-900">Ward Citizens Management</h2>
                        <p className="text-xs text-gray-500">Citizens registered under {profile.wardId || 'Assigned Ward'}</p>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-gray-600 leading-relaxed">
                    Access the complete directory of registered households in your assigned ward. View house numbers, residential addresses, and navigate house location pins on live Leaflet maps.
                  </p>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab('Assigned Citizens')}
                      className="w-full sm:w-auto px-5 py-2.5 bg-[#0a4d2c] hover:bg-[#063820] text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Users className="w-4 h-4 text-emerald-300" />
                      <span>Open Ward Citizens Directory</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Haritha Karma Sena Guidelines Card */}
                <div className="bg-white p-6 rounded-2xl border border-emerald-100 shadow-2xs space-y-4">
                  <div className="flex items-center gap-2.5 pb-3 border-b border-gray-100">
                    <div className="p-2.5 rounded-xl bg-emerald-50 text-[#0a4d2c]">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-base font-extrabold text-gray-900">Collection Duty Protocol</h2>
                      <p className="text-xs text-gray-500">Haritha Karma Sena standard operating guidelines</p>
                    </div>
                  </div>

                  <ul className="space-y-2.5 text-xs text-gray-600 font-medium">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Ensure non-biodegradable waste segregation at household level.</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Use live GPS map location pins to locate hard-to-find houses.</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Report unassigned or new households to Panchayat admin.</span>
                    </li>
                  </ul>
                </div>
              </div>

            </div>
          )}
          </div>

          <Footer />
        </main>
      </div>

      {/* Footer inside Main workspace */}
      {/* Edit Profile Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative border border-emerald-100 space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-emerald-50 text-[#0a4d2c]">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-gray-900">Edit Worker Profile</h3>
                  <p className="text-xs text-gray-500">Update your details in the database</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {editError && (
              <div className="p-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-xs font-semibold rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{editError}</span>
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Full Name *
                </label>
                <div className="relative rounded-xl shadow-2xs">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={editFormData.fullName}
                    onChange={(e) => setEditFormData({ ...editFormData, fullName: e.target.value })}
                    placeholder="Enter your full name"
                    className="w-full pl-10 pr-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Email Address (Read Only)
                </label>
                <div className="relative rounded-xl shadow-2xs">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    value={profile.email}
                    disabled
                    className="w-full pl-10 pr-3 py-2.5 text-sm bg-gray-100 border border-gray-200 rounded-xl text-gray-500 cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Mobile Number * (10 Digits)
                </label>
                <div className="relative rounded-xl shadow-2xs">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    type="tel"
                    maxLength={10}
                    value={editFormData.phone}
                    onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                    placeholder="10-digit mobile number"
                    className="w-full pl-10 pr-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="py-2.5 px-5 bg-[#0a4d2c] hover:bg-[#063820] text-white font-extrabold text-xs rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? 'Saving...' : 'Save Profile'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkerDashboard;
