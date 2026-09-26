import React, { useState, useEffect, useMemo } from 'react';
import Header from '../components/Header';
import WorkerSidebar from '../components/WorkerSidebar';
import WorkerCitizens from './worker/WorkerCitizens';
import WorkerPickups from './worker/WorkerPickups';
import WorkerCollectionHistory from './worker/WorkerCollectionHistory';
import WorkerCollectionMap from './worker/WorkerCollectionMap';
import WorkerNotifications from './worker/WorkerNotifications';
import WorkerLocationZone from './worker/WorkerLocationZone';
import WorkerPaymentCollection from './worker/WorkerPaymentCollection';
import WorkerPerformance from './worker/WorkerPerformance';
import WorkerProfile from './worker/WorkerProfile';
import WorkerSmartCollection from './worker/WorkerSmartCollection';
import CitizenWorkerChat from '../components/CitizenWorkerChat';
import Footer from '../components/Footer';
import { getWardPickupRequests } from '../services/pickupRequestService';
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
  Truck,
  Map as MapIcon,
  Target,
  Compass,
  History,
  IndianRupee,
  BarChart3,
  Bell
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Polygon, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getUserByEmail, updateUserProfile } from '../services/userService';
import { getAllCitizens, getCitizensByWard, getAllWards } from '../services/citizenService';
import { getAllWorkers } from '../services/workerService';

// Fix Leaflet default icon paths in React Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function ChangeView({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.setView(center, zoom, { animate: true });
    }
  }, [center, zoom, map]);
  return null;
}

const getPolygonCenter = (polygon) => {
  if (!polygon || polygon.length === 0) return [9.5583, 76.7842];
  let latSum = 0;
  let lngSum = 0;
  for (const pt of polygon) {
    latSum += pt[0];
    lngSum += pt[1];
  }
  return [latSum / polygon.length, lngSum / polygon.length];
};

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
  const [wardPickupRequests, setWardPickupRequests] = useState([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [wardDetails, setWardDetails] = useState(null);
  const [mapZoom, setMapZoom] = useState(15);
  const [mapCenterOverride, setMapCenterOverride] = useState(null);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({ fullName: '', phone: '' });
  const [editError, setEditError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Center coordinate calculation for the worker's assigned boundary
  const mapCenter = useMemo(() => {
    if (mapCenterOverride) return mapCenterOverride;
    if (wardDetails?.boundary && wardDetails.boundary.length >= 3) {
      return getPolygonCenter(wardDetails.boundary);
    }
    const citizenWithPin = wardCitizens.find(
      (c) => c.latitude && c.longitude && (c.latitude !== 0 || c.longitude !== 0)
    );
    if (citizenWithPin) {
      return [citizenWithPin.latitude, citizenWithPin.longitude];
    }
    return [9.5583, 76.7842];
  }, [mapCenterOverride, wardDetails, wardCitizens]);

  const handleRecenterBoundary = () => {
    if (wardDetails?.boundary && wardDetails.boundary.length >= 3) {
      const center = getPolygonCenter(wardDetails.boundary);
      setMapCenterOverride([...center]);
      setMapZoom(15);
    }
  };

  // Time-based greeting helper
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  // Fetch worker profile, assigned ward boundary polygon & citizens data
  const loadDashboardData = async () => {
    setLoadingStats(true);
    let workerWard = profile.wardId || initialUser.wardId || '';

    try {
      if (profile.email) {
        // Fetch user from db, workers list, and official ward delimitation boundaries
        const [dbUser, workersList, wardsList] = await Promise.all([
          getUserByEmail(profile.email).catch(() => null),
          getAllWorkers().catch(() => []),
          getAllWards().catch(() => [])
        ]);

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

        // Match assigned ward details (boundary polygon, panchayat, wardName)
        if (workerWard && Array.isArray(wardsList)) {
          const cleanW = workerWard.trim().toLowerCase();
          const matched = wardsList.find(
            (w) =>
              (w.wardId && w.wardId.trim().toLowerCase() === cleanW) ||
              (w.id && w.id.trim().toLowerCase() === cleanW) ||
              (w.wardName && w.wardName.trim().toLowerCase() === cleanW)
          );
          setWardDetails(matched || null);
        }

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

      // Only show citizens who are verified by admin under workers
      const verifiedCitizensList = (citizensList || []).filter(
        c => Boolean(c.isVerified || c.status === 'Verified')
      );

      setWardCitizens(verifiedCitizensList);

      // Fetch ward pickup requests for worker chat & tasks
      const activeWorkerEmail = profile.email || initialUser.email || '';
      try {
        let reqs = await getWardPickupRequests(workerWard || 'Ward 1', activeWorkerEmail);
        if (!Array.isArray(reqs) || reqs.length === 0) {
          reqs = await getWardPickupRequests(workerWard || 'Ward 1');
        }
        setWardPickupRequests(Array.isArray(reqs) ? reqs : []);
      } catch (reqErr) {
        console.warn("Failed to load ward pickup requests:", reqErr);
      }
    } catch (err) {
      console.error("Dashboard data load error:", err);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Re-fetch ward pickup requests whenever worker enters Chat tab so new requests immediately appear
  useEffect(() => {
    if (activeTab === 'Messages' || activeTab === 'Citizen Chat' || activeTab === 'Chat') {
      const activeWorkerEmail = profile.email || initialUser.email || '';
      const workerWard = profile.wardId || initialUser.wardId || '';
      getWardPickupRequests(workerWard || 'Ward 1', activeWorkerEmail)
        .then((reqs) => {
          if (Array.isArray(reqs) && reqs.length > 0) {
            setWardPickupRequests(reqs);
          } else {
            return getWardPickupRequests(workerWard || 'Ward 1');
          }
        })
        .then((allReqs) => {
          if (Array.isArray(allReqs) && allReqs.length > 0) {
            setWardPickupRequests(allReqs);
          }
        })
        .catch((e) => console.warn('Chat tab requests refresh error:', e));
    }
  }, [activeTab, profile.email, profile.wardId]);

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

  // Listen for navigation requests from Header search
  useEffect(() => {
    const handleNav = (e) => {
      if (e.detail) {
        setActiveTab(e.detail);
        setIsMobileSidebarOpen(false);
      }
    };
    window.addEventListener('ecomind:navigate-tab', handleNav);
    return () => window.removeEventListener('ecomind:navigate-tab', handleNav);
  }, []);

  // Stats calculation
  const totalCitizensCount = wardCitizens.length;
  const mapPinCount = wardCitizens.filter((c) => c.latitude && c.longitude && (c.latitude !== 0 || c.longitude !== 0)).length;
  const completedProfilesCount = wardCitizens.filter((c) => c.profileCompleted || (c.address && c.houseNumber)).length;
  const completionRate = totalCitizensCount > 0 ? Math.round((completedProfilesCount / totalCitizensCount) * 100) : 0;

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-[#f6faf7] dark:bg-[#09110d] font-sans">
      {/* Top Header (Fixed at top) */}
      <div className="shrink-0 z-40">
        <Header
          onSelectTab={setActiveTab}
          activeTab={activeTab}
          role="worker"
          onLogout={handleLogout}
          user={profile}
        />
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
        <main className="flex-1 h-full overflow-y-auto flex flex-col justify-between bg-[#f6faf7] dark:bg-[#09110d] min-w-0">
          <div className="p-4 sm:p-6 lg:p-8 space-y-6 flex-1">
            {successMsg && (
            <div className="max-w-5xl mx-auto p-4 bg-emerald-50 border-l-4 border-emerald-500 text-emerald-800 text-sm font-bold rounded-xl flex items-center gap-3 shadow-xs animate-fadeIn">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {activeTab === 'Profile' || activeTab === 'My Profile' ? (
            /* WORKER PROFILE SECTION */
            <WorkerProfile
              profile={profile}
              wardDetails={wardDetails}
              onOpenEditModal={handleOpenEditModal}
            />
          ) : activeTab === 'Smart Collection' ? (
            /* SMART COLLECTION SEQUENTIAL ROUTE TAB */
            <WorkerSmartCollection
              wardId={profile.wardId || 'Ward 1'}
              wardDetails={wardDetails}
              workerProfile={profile}
              initialCitizens={wardCitizens}
            />
          ) : activeTab === 'Collection Map' ? (
            /* COLLECTION MAP & ROUTE NAVIGATOR TAB */
            <WorkerCollectionMap
              wardId={profile.wardId || 'Ward 1'}
              wardDetails={wardDetails}
              workerProfile={profile}
              initialCitizens={wardCitizens}
            />
          ) : activeTab === 'Pickup Requests' || activeTab === 'Plastic Pickups' ? (
            /* WARD PLASTIC PICKUPS TAB */
            <WorkerPickups wardId={profile.wardId || 'Ward 1'} workerId={profile.email || 'WORKER001'} />
          ) : activeTab === 'Messages' || activeTab === 'Citizen Chat' || activeTab === 'Chat' ? (
            /* CITIZEN DIRECT CHAT TAB */
            <CitizenWorkerChat
              currentUser={{
                id: profile.email || profile.workerId || 'WORKER001',
                name: profile.fullName || 'Worker',
                role: 'Worker',
                email: profile.email
              }}
              wardCitizens={wardCitizens}
              pickupRequests={wardPickupRequests}
              onBack={() => setActiveTab('Dashboard')}
            />
          ) : activeTab === 'Collection History' ? (
            /* COLLECTION HISTORY TAB */
            <WorkerCollectionHistory wardId={profile.wardId || 'Ward 1'} workerId={profile.email || 'WORKER001'} />
          ) : activeTab === 'Notifications' ? (
            /* NOTIFICATIONS TAB */
            <WorkerNotifications wardId={profile.wardId || 'Ward 1'} workerId={profile.email || 'WORKER001'} />
          ) : activeTab === 'Payment Collection' ? (
            /* CASH PAYMENT COLLECTION TAB */
            <WorkerPaymentCollection wardId={profile.wardId || 'Ward 1'} workerProfile={profile} />
          ) : activeTab === 'My Location' || activeTab === 'My Location / Zone' || activeTab === 'Current Zone' ? (
            /* LIVE LOCATION & BOUNDARY ZONE TAB */
            <WorkerLocationZone wardDetails={wardDetails} wardCitizens={wardCitizens} profile={profile} />
          ) : activeTab === 'My Performance' ? (
            /* PERFORMANCE ANALYTICS TAB */
            <WorkerPerformance wardId={profile.wardId || 'Ward 1'} workerId={profile.email || 'WORKER001'} profile={profile} />
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
                      <span className="px-3.5 py-1.5 bg-emerald-900/80 text-emerald-200 font-extrabold text-xs rounded-xl flex items-center gap-2">
                        <Award className="w-3.5 h-3.5 text-emerald-300" />
                        <span>Zone: {wardDetails?.wardName ? `${wardDetails.wardName} (${wardDetails.wardId})` : profile.wardId || 'Assigned Ward'}</span>
                        {wardDetails?.panchayatName && (
                          <span className="bg-emerald-800 text-emerald-100 text-[10px] px-2 py-0.5 rounded-full">
                            {wardDetails.panchayatName}
                          </span>
                        )}
                      </span>
                      {wardDetails?.boundary?.length >= 3 && (
                        <span className="px-3 py-1 bg-emerald-500/20 text-emerald-200 font-semibold text-xs rounded-xl flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                          Official Boundary Polygon Active
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
                    <button
                      type="button"
                      onClick={() => setActiveTab('Pickup Requests')}
                      className="px-6 py-3 bg-white hover:bg-emerald-50 text-[#0a4d2c] font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Truck className="w-4 h-4 text-[#0a4d2c]" />
                      <span>Plastic Pickups</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('Assigned Citizens')}
                      className="px-6 py-3 bg-emerald-900/90 hover:bg-emerald-950 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
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
                <div className="bg-white dark:bg-[#121e17] p-5 rounded-2xl shadow-xs hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 space-y-2 group">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Assigned Citizens</span>
                    <div className="p-2.5 bg-emerald-50 dark:bg-[#1a3325] rounded-xl text-emerald-700 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                      <Users className="w-5 h-5" />
                    </div>
                  </div>
                  <p className="text-2xl font-extrabold text-gray-900 dark:text-gray-100">{totalCitizensCount}</p>
                  <p className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Citizens in {profile.wardId || 'Assigned Ward'}
                  </p>
                </div>

                {/* Metric 2: GPS Map Locations Set */}
                <div className="bg-white dark:bg-[#121e17] p-5 rounded-2xl shadow-xs hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 space-y-2 group">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">GPS Map Pins Set</span>
                    <div className="p-2.5 bg-emerald-50 dark:bg-[#1a3325] rounded-xl text-emerald-700 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                      <LocateFixed className="w-5 h-5" />
                    </div>
                  </div>
                  <p className="text-2xl font-extrabold text-gray-900 dark:text-gray-100">{mapPinCount}</p>
                  <p className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> Ready for live map navigation
                  </p>
                </div>

                {/* Metric 3: Profile Completion Rate */}
                <div className="bg-white dark:bg-[#121e17] p-5 rounded-2xl shadow-xs hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 space-y-2 group">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Profile Completion</span>
                    <div className="p-2.5 bg-emerald-50 dark:bg-[#1a3325] rounded-xl text-emerald-700 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                  </div>
                  <p className="text-2xl font-extrabold text-gray-900 dark:text-gray-100">{completionRate}%</p>
                  <div className="w-full bg-gray-100 dark:bg-gray-800 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-600 h-full rounded-full transition-all duration-500" style={{ width: `${completionRate}%` }} />
                  </div>
                </div>

                {/* Metric 4: Duty Status */}
                <div className="bg-white dark:bg-[#121e17] p-5 rounded-2xl shadow-xs hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 space-y-2 group">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Collection Duty</span>
                    <div className="p-2.5 bg-emerald-50 dark:bg-[#1a3325] rounded-xl text-emerald-700 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                  </div>
                  <p className="text-lg font-extrabold text-emerald-800 dark:text-emerald-400">Active</p>
                  <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> Daily collection active
                  </p>
                </div>
              </div>

              {/* ASSIGNED WARD BOUNDARY ZONE & HOUSEHOLD COLLECTION MAP */}
              <div className="bg-white dark:bg-[#121e17] rounded-3xl p-6 sm:p-7 shadow-xs space-y-5 animate-fadeIn">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-[#1a3325] text-[#0a4d2c] dark:text-emerald-400">
                      <MapIcon className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-lg sm:text-xl font-extrabold text-gray-900 dark:text-gray-100">
                          Assigned Ward Boundary Zone
                        </h2>
                        {wardDetails?.boundary?.length >= 3 ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            Official Delimitation Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                            Digital Boundary Pending
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        Official service boundary polygon for {wardDetails?.wardName ? `${wardDetails.wardName} (${wardDetails.wardId})` : profile.wardId || 'Assigned Ward'}
                        {wardDetails?.panchayatName ? ` • ${wardDetails.panchayatName} Panchayat` : ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {wardDetails?.boundary?.length >= 3 && (
                      <button
                        type="button"
                        onClick={handleRecenterBoundary}
                        className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 dark:bg-[#1a3325] dark:hover:bg-[#203f2e] text-emerald-800 dark:text-emerald-300 rounded-xl text-xs font-bold transition cursor-pointer"
                        title="Reset map view to assigned ward boundary"
                      >
                        <Target className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                        <span>Center Boundary</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setActiveTab('Collection Map')}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                    >
                      <MapIcon className="w-3.5 h-3.5" />
                      <span>Collection Route Map</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab('Assigned Citizens')}
                      className="flex items-center gap-1.5 px-4 py-2 bg-[#0a4d2c] hover:bg-[#063820] text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                    >
                      <Users className="w-3.5 h-3.5 text-emerald-200" />
                      <span>View {wardCitizens.length} Households</span>
                    </button>
                  </div>
                </div>

                {/* Leaflet Map Display */}
                <div className="space-y-2">
                  <div className="h-[380px] w-full rounded-2xl overflow-hidden border border-emerald-200 shadow-inner relative z-0">
                    <MapContainer
                      center={mapCenter}
                      zoom={mapZoom}
                      scrollWheelZoom={true}
                      className="h-full w-full"
                    >
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      <ChangeView center={mapCenter} zoom={mapZoom} />

                      {/* Official Delimitation Boundary Polygon */}
                      {wardDetails?.boundary && wardDetails.boundary.length >= 3 && (
                        <Polygon
                          positions={wardDetails.boundary}
                          pathOptions={{
                            color: '#059669',
                            fillColor: '#10b981',
                            fillOpacity: 0.18,
                            weight: 3
                          }}
                        >
                          <Tooltip sticky>
                            <div className="p-1 text-xs">
                              <p className="font-extrabold text-emerald-950 text-sm">
                                {wardDetails.wardName || wardDetails.wardId} Official Boundary Zone
                              </p>
                              <p className="text-gray-600 font-medium">
                                {wardDetails.panchayatName || 'Chirakkadavu'} Panchayat
                              </p>
                              <p className="text-emerald-700 text-[10px] font-bold mt-0.5">
                                Official Delimitation (wardmap.ksmart.live)
                              </p>
                            </div>
                          </Tooltip>
                        </Polygon>
                      )}

                      {/* Registered Household Location Pins */}
                      {wardCitizens
                        .filter((c) => c.latitude && c.longitude && (c.latitude !== 0 || c.longitude !== 0))
                        .map((c, idx) => (
                          <Marker key={c.id || c.citizenId || idx} position={[c.latitude, c.longitude]}>
                            <Popup>
                              <div className="p-1 text-xs space-y-1 min-w-[160px]">
                                <p className="font-bold text-emerald-950 text-sm">{c.fullName}</p>
                                <p className="text-gray-700 font-semibold">
                                  House No: {c.houseNumber || 'N/A'}{c.houseName ? ` (${c.houseName})` : ''}
                                </p>
                                <p className="text-gray-500 text-[11px] line-clamp-2">{c.address || 'Address registered'}</p>
                                {c.phoneNumber && (
                                  <p className="text-[11px] text-emerald-800 font-mono font-bold flex items-center gap-1 pt-0.5">
                                    <Phone className="w-3 h-3 text-emerald-600" />
                                    <span>{c.phoneNumber}</span>
                                  </p>
                                )}
                                <div className="pt-1 border-t border-gray-100">
                                  <a
                                    href={`https://www.google.com/maps/dir/?api=1&destination=${c.latitude},${c.longitude}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:underline"
                                  >
                                    <Compass className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>Navigate to House</span>
                                  </a>
                                </div>
                              </div>
                            </Popup>
                          </Marker>
                        ))}
                    </MapContainer>
                  </div>

                  {/* Map Legend & Summary Strip */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs bg-gray-50/80 p-3 rounded-xl border border-gray-100">
                    <div className="flex flex-wrap items-center gap-4">
                      <div className="flex items-center gap-2">
                        <span className="w-3.5 h-3.5 rounded bg-emerald-500/30 border-2 border-emerald-600" />
                        <span className="font-bold text-gray-700">
                          {wardDetails?.wardName || profile.wardId || 'Assigned'} Official Boundary Zone
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-blue-600 border border-white shadow-2xs" />
                        <span className="text-gray-600 font-medium">
                          Household Pins ({mapPinCount} Mapped)
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-gray-500 text-[11px]">
                      <span>Coverage: </span>
                      <span className="font-bold text-emerald-800">
                        {totalCitizensCount > 0 ? `${Math.round((mapPinCount / totalCitizensCount) * 100)}% houses mapped` : '0 houses'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dashboard Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* 1. Ward Citizens Directory */}
                <div className="bg-white p-6 rounded-3xl border border-emerald-100 shadow-2xs space-y-4 flex flex-col justify-between hover:shadow-md transition-all">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2.5 pb-3 border-b border-gray-100">
                      <div className="p-2.5 rounded-2xl bg-emerald-50 text-[#0a4d2c]">
                        <Users className="w-5 h-5" />
                      </div>
                      <div>
                        <h2 className="text-base font-extrabold text-gray-900">Ward Citizens Directory</h2>
                        <p className="text-xs text-gray-500">Registered households in {profile.wardId || 'Ward 1'}</p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      Access the complete directory of registered households in your assigned ward. View house numbers, contact numbers, and navigate household GPS pins.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveTab('Assigned Citizens')}
                    className="w-full py-2.5 px-4 bg-[#0a4d2c] hover:bg-[#063820] text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Users className="w-4 h-4 text-emerald-300" />
                    <span>View Households</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                {/* 2. Collection History */}
                <div className="bg-white p-6 rounded-3xl border border-emerald-100 shadow-2xs space-y-4 flex flex-col justify-between hover:shadow-md transition-all">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2.5 pb-3 border-b border-gray-100">
                      <div className="p-2.5 rounded-2xl bg-emerald-50 text-[#0a4d2c]">
                        <History className="w-5 h-5" />
                      </div>
                      <div>
                        <h2 className="text-base font-extrabold text-gray-900">Collection History</h2>
                        <p className="text-xs text-gray-500">Completed pickups & monthly logs</p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      Browse previously completed plastic pickups with full citizen names, house numbers, request IDs, collection timestamps, and export CSV logs.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveTab('Collection History')}
                    className="w-full py-2.5 px-4 bg-emerald-50 hover:bg-emerald-100 text-[#0a4d2c] border border-emerald-200 font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <History className="w-4 h-4 text-emerald-700" />
                    <span>View Collection History</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                {/* 3. Doorstep Payment Collection */}
                <div className="bg-white p-6 rounded-3xl border border-emerald-100 shadow-2xs space-y-4 flex flex-col justify-between hover:shadow-md transition-all">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2.5 pb-3 border-b border-gray-100">
                      <div className="p-2.5 rounded-2xl bg-emerald-50 text-[#0a4d2c]">
                        <IndianRupee className="w-5 h-5" />
                      </div>
                      <div>
                        <h2 className="text-base font-extrabold text-gray-900">Payment Collection</h2>
                        <p className="text-xs text-gray-500">Doorstep ₹50 cash verification</p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      Collect monthly user fees for citizens choosing 'Pay Through Worker', mark payments as received, and generate instant printable receipts.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveTab('Payment Collection')}
                    className="w-full py-2.5 px-4 bg-emerald-50 hover:bg-emerald-100 text-[#0a4d2c] border border-emerald-200 font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <IndianRupee className="w-4 h-4 text-emerald-700" />
                    <span>Collect Payments</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                {/* 4. Real-time Location & Boundary */}
                <div className="bg-white p-6 rounded-3xl border border-emerald-100 shadow-2xs space-y-4 flex flex-col justify-between hover:shadow-md transition-all">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2.5 pb-3 border-b border-gray-100">
                      <div className="p-2.5 rounded-2xl bg-emerald-50 text-[#0a4d2c]">
                        <MapPin className="w-5 h-5" />
                      </div>
                      <div>
                        <h2 className="text-base font-extrabold text-gray-900">My Location & Zone</h2>
                        <p className="text-xs text-gray-500">Real-time GPS boundary verification</p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      Track your live GPS coordinates against the official delimitation polygon boundary to verify active coverage inside your assigned ward.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveTab('My Location')}
                    className="w-full py-2.5 px-4 bg-emerald-50 hover:bg-emerald-100 text-[#0a4d2c] border border-emerald-200 font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Compass className="w-4 h-4 text-emerald-700" />
                    <span>Open Live Zone Map</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                {/* 5. Performance Analytics */}
                <div className="bg-white p-6 rounded-3xl border border-emerald-100 shadow-2xs space-y-4 flex flex-col justify-between hover:shadow-md transition-all">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2.5 pb-3 border-b border-gray-100">
                      <div className="p-2.5 rounded-xl bg-emerald-50 text-[#0a4d2c]">
                        <BarChart3 className="w-5 h-5" />
                      </div>
                      <div>
                        <h2 className="text-base font-extrabold text-gray-900">My Performance</h2>
                        <p className="text-xs text-gray-500">Monthly pickup completion metrics</p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      Monitor your monthly completed vs pending pickups, completion percentages, total households served, and unlocked service badges.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveTab('My Performance')}
                    className="w-full py-2.5 px-4 bg-emerald-50 hover:bg-emerald-100 text-[#0a4d2c] border border-emerald-200 font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <TrendingUp className="w-4 h-4 text-emerald-700" />
                    <span>View Performance</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                {/* 6. Haritha Karma Sena Guidelines */}
                <div className="bg-white p-6 rounded-3xl border border-emerald-100 shadow-2xs space-y-4 flex flex-col justify-between hover:shadow-md transition-all">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2.5 pb-3 border-b border-gray-100">
                      <div className="p-2.5 rounded-xl bg-emerald-50 text-[#0a4d2c]">
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <h2 className="text-base font-extrabold text-gray-900">Collection Duty Protocol</h2>
                        <p className="text-xs text-gray-500">Standard operating guidelines</p>
                      </div>
                    </div>

                    <ul className="space-y-2 text-xs text-gray-600 font-medium">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Doorstep dry plastic collection from 15th to 25th.</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Verify doorstep cash fee payments and issue receipts.</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Enter citizen OTP verification code to complete pickup.</span>
                      </li>
                    </ul>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveTab('Notifications')}
                    className="w-full py-2.5 px-4 bg-emerald-50 hover:bg-emerald-100 text-[#0a4d2c] border border-emerald-200 font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Bell className="w-4 h-4 text-emerald-700" />
                    <span>View Notifications</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
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
