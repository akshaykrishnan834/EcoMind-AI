import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import CitizenSidebar from '../components/CitizenSidebar';
import CitizenProfile from '../components/CitizenProfile';
import PickupRequest from '../components/PickupRequest';
import CollectionRecords from '../components/CollectionRecords';
import MonthlyPaymentSection from '../components/MonthlyPaymentSection';
import CitizenSchedule from '../components/CitizenSchedule';
import CitizenLocation from '../components/CitizenLocation';
import CitizenGuidelines from '../components/CitizenGuidelines';
import AIChatBot from '../components/AIChatBot';
import AIFloatingChat from '../components/AIFloatingChat';
import CitizenSettings from '../components/CitizenSettings';
import CitizenWorkerChat from '../components/CitizenWorkerChat';
import Footer from '../components/Footer';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Home,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  Truck,
  Recycle,
  Award,
  TrendingUp,
  Calendar,
  Phone,
  Mail,
  User,
  ArrowRight,
  ShieldCheck,
  Check,
  ChevronRight,
  FileText,
  RefreshCw,
  Leaf,
  CreditCard,
  KeyRound,
  Bot
} from 'lucide-react';
import { getCitizenByEmail } from '../services/citizenService';
import { getCitizenRequests, getMonthlyStatus } from '../services/pickupRequestService';
import { getAllWorkers } from '../services/workerService';

const CitizenDashboard = () => {
  const [activeTab, setActiveTabState] = useState(() => {
    return sessionStorage.getItem('citizenActiveTab') || 'Dashboard';
  });

  const setActiveTab = (tab) => {
    setActiveTabState(tab);
    sessionStorage.setItem('citizenActiveTab', tab);
  };

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const userObj = JSON.parse(localStorage.getItem('user') || '{}');
  const citizenEmail = userObj.email || localStorage.getItem('userEmail') || '';

  const [citizenData, setCitizenData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [realRequests, setRealRequests] = useState([]);
  const [monthlyStatusData, setMonthlyStatusData] = useState(null);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [assignedWorker, setAssignedWorker] = useState(null);

  // Time-based greeting helper
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  // Fetch logged-in citizen details from database
  useEffect(() => {
    const fetchCitizenProfile = async () => {
      if (!citizenEmail) {
        setLoading(false);
        return;
      }
      try {
        const profile = await getCitizenByEmail(citizenEmail);
        setCitizenData(profile);
      } catch (err) {
        console.warn("Could not load citizen database profile:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCitizenProfile();
  }, [citizenEmail]);

  // Fetch worker for citizen ward helpdesk
  useEffect(() => {
    const fetchWorker = async () => {
      try {
        const workers = await getAllWorkers().catch(() => []);
        if (Array.isArray(workers) && workers.length > 0) {
          const citizenWard = (citizenData?.wardId || userObj.wardId || 'Ward 1').trim().toLowerCase();
          const matched = workers.find(
            (w) => w.wardId && w.wardId.trim().toLowerCase() === citizenWard
          );
          setAssignedWorker(matched || workers[0]);
        }
      } catch (err) {
        console.warn("Could not load worker info for helpdesk:", err);
      }
    };

    fetchWorker();
  }, [citizenData?.wardId, userObj.wardId]);

  // Fetch pickup requests & monthly status for citizen
  useEffect(() => {
    const loadRequests = async () => {
      const citizenId = citizenData?.citizenId || citizenData?.id || citizenData?._id || userObj.citizenId;
      if (!citizenId) {
        setLoadingRequests(false);
        return;
      }
      try {
        setLoadingRequests(true);
        const [reqs, mStatus] = await Promise.all([
          getCitizenRequests(citizenId).catch(() => []),
          getMonthlyStatus(citizenId).catch(() => null)
        ]);
        setRealRequests(Array.isArray(reqs) ? reqs : []);
        setMonthlyStatusData(mStatus || null);
      } catch (err) {
        console.warn("Could not fetch pickup requests for dashboard:", err);
      } finally {
        setLoadingRequests(false);
      }
    };

    if (citizenData || citizenEmail) {
      loadRequests();
    }
  }, [citizenData, citizenEmail]);

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

  // Citizen Info derived values
  const citizenName = citizenData?.fullName || userObj.fullName || localStorage.getItem('userName') || 'Citizen';
  const houseNo = citizenData?.houseNumber || 'Not Set';
  const houseName = citizenData?.houseName || '';
  const wardId = citizenData?.wardId || 'Ward 1';
  const panchayat = citizenData?.panchayatName || 'Ponkunnam';
  const isProfileComplete = Boolean(
    citizenData?.profileCompleted || (citizenData?.houseNumber && citizenData?.address)
  );
  const isVerified = Boolean(
    citizenData?.isVerified ||
    citizenData?.status === 'Verified' ||
    userObj?.isVerified ||
    userObj?.status === 'Verified'
  );

  // Worker & Helpline derived contact details
  const senaWorkerName = assignedWorker?.fullName || 'Haritha Karma Sena Unit 4';
  const senaWorkerPhone = assignedWorker?.phoneNumber || '+91 98470 12345';
  const panchayatHelpline = '04828-221376';
  const panchayatEmail = 'chirakkadavugpktm@gmail.com';
  const panchayatDistrict = 'Kottayam';
  const panchayatPincode = '686506';

  // Active / Current pickup request derived state
  const currentMonthRequest = monthlyStatusData?.request || realRequests.find(
    (r) => (r.status || '').toLowerCase() === 'pending' || (r.status || '').toLowerCase() === 'scheduled' || (r.status || '').toLowerCase() === 'completed' || (r.status || '').toLowerCase() === 'collected'
  );

  const isRequestCompleted = Boolean(
    currentMonthRequest && (
      (currentMonthRequest.status || '').toLowerCase() === 'completed' ||
      (currentMonthRequest.status || '').toLowerCase() === 'collected'
    )
  );

  // Ongoing work mock/real state
  const ongoingWork = currentMonthRequest ? {
    id: currentMonthRequest.requestId || currentMonthRequest.id || 'REQ-8492',
    category: currentMonthRequest.overallCategory || 'Non-Biodegradable Plastic & Dry Waste',
    scheduledDate: isRequestCompleted
      ? (currentMonthRequest.collectedAt
          ? `Collected on ${new Date(currentMonthRequest.collectedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`
          : currentMonthRequest.collectionDate
            ? `Completed on ${new Date(currentMonthRequest.collectionDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`
            : 'Completed')
      : (currentMonthRequest.collectionDate
          ? new Date(currentMonthRequest.collectionDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
          : '15th - 25th Collection Drive Window'),
    status: currentMonthRequest.status || 'Pending',
    currentStep: isRequestCompleted ? 4 : (currentMonthRequest.status || '').toLowerCase() === 'scheduled' ? 2 : 1,
    workerName: currentMonthRequest.acceptedByWorkerId ? `Haritha Karma Sena (${currentMonthRequest.acceptedByWorkerId})` : senaWorkerName,
    workerPhone: senaWorkerPhone,
    verificationCode: currentMonthRequest.verificationCode || '',
    isCompleted: isRequestCompleted,
    notes: isRequestCompleted ? 'Plastic waste pickup verified and completed.' : 'Please keep dried non-biodegradable plastics ready at the gate.'
  } : {
    id: 'REQ-8492',
    category: 'Non-Biodegradable Plastic & Dry Waste',
    scheduledDate: '15th - 25th Monthly Drive Window',
    status: 'Scheduled',
    currentStep: 2, // 1: Requested, 2: Scheduled, 3: In Transit, 4: Completed
    workerName: senaWorkerName,
    workerPhone: senaWorkerPhone,
    isCompleted: false,
    notes: 'Please keep dried non-biodegradable plastics ready at the gate.'
  };

  // Completed work history mock/real state
  const completedWorkHistory = realRequests.filter(
    (r) => (r.status || '').toLowerCase() === 'completed' || (r.status || '').toLowerCase() === 'collected'
  ).length > 0 ? realRequests.filter(
    (r) => (r.status || '').toLowerCase() === 'completed' || (r.status || '').toLowerCase() === 'collected'
  ).map(r => ({
    id: r.requestId || r.id,
    date: r.collectedAt ? new Date(r.collectedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '10 Aug 2026',
    category: r.overallCategory || 'Clean Plastic & Dry Waste',
    quantity: r.estimatedVolume || '4.5 kg',
    worker: 'Haritha Karma Sena Unit 4',
    ecoPoints: '+50 Points',
    status: 'Completed'
  })) : [
    {
      id: 'REQ-8102',
      date: '10 Aug 2026',
      category: 'Clean Plastic & Dry Bottles',
      quantity: '4.5 kg',
      worker: 'Haritha Karma Sena Unit 4',
      ecoPoints: '+50 Points',
      status: 'Completed'
    },
    {
      id: 'REQ-7921',
      date: '28 Jul 2026',
      category: 'Paper & Cardboard Packaging',
      quantity: '8.0 kg',
      worker: 'Haritha Karma Sena Unit 4',
      ecoPoints: '+80 Points',
      status: 'Completed'
    },
    {
      id: 'REQ-7540',
      date: '15 Jul 2026',
      category: 'E-Waste & Electronics',
      quantity: '2.1 kg',
      worker: 'Haritha Karma Sena Special Team',
      ecoPoints: '+120 Points',
      status: 'Completed'
    }
  ];

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-[#f6faf7] dark:bg-[#09110d] font-sans print:h-auto print:w-auto print:overflow-visible print:bg-white">
      {/* Top Header (Fixed at top) */}
      <div className="shrink-0 z-40 print:hidden">
        <Header
          onSelectTab={setActiveTab}
          activeTab={activeTab}
          role="citizen"
          onLogout={handleLogout}
          user={citizenData || userObj}
        />
      </div>

      {/* Main Content Layout with Sidebar */}
      <div className="flex-1 flex overflow-hidden min-h-0 print:overflow-visible print:block">
        <div className="print:hidden">
          <CitizenSidebar
            activeItem={activeTab}
            setActiveItem={setActiveTab}
            onLogout={handleLogout}
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            isOpen={isMobileSidebarOpen}
            onClose={() => setIsMobileSidebarOpen(false)}
          />
        </div>

        {/* Main Workspace (Scrolls Vertically) */}
        <main className="flex-1 h-full overflow-y-auto flex flex-col justify-between bg-[#f6faf7] dark:bg-[#09110d] min-w-0 print:overflow-visible print:h-auto print:p-0 print:bg-white print:block">
          <div className="p-4 sm:p-6 lg:p-8 space-y-6 flex-1 print:p-0 print:space-y-0">
            {activeTab === 'Profile' ? (
              <CitizenProfile />
            ) : activeTab === 'Monthly Payments' ? (
              <MonthlyPaymentSection citizenData={citizenData} />
            ) : activeTab === 'Pickup Request' ? (
              <PickupRequest citizenData={citizenData} />
            ) : activeTab === 'Messages' || activeTab === 'Worker Chat' || activeTab === 'Chat' ? (
              <CitizenWorkerChat
                currentUser={{
                  id: citizenData?.citizenId || citizenData?.id || citizenData?._id || userObj.citizenId || userObj.email,
                  name: citizenData?.fullName || userObj.fullName || 'Citizen',
                  role: 'Citizen',
                  email: citizenData?.email || userObj.email
                }}
                pickupRequests={realRequests}
                assignedContact={assignedWorker}
                onBack={() => setActiveTab('Dashboard')}
              />
            ) : activeTab === 'Collection Records' ? (
              <CollectionRecords citizenData={citizenData} />
            ) : activeTab === 'Collection Schedule' || activeTab === 'My Collection Schedule' ? (
              <CitizenSchedule
                citizenData={citizenData}
                monthlyStatusData={monthlyStatusData}
                realRequests={realRequests}
                assignedWorker={assignedWorker}
                setActiveTab={setActiveTab}
              />
            ) : activeTab === 'My Location' ? (
              <CitizenLocation
                citizenData={citizenData}
                setActiveTab={setActiveTab}
              />
            ) : activeTab === 'Help & Guidelines' || activeTab === 'Guidelines' ? (
              <CitizenGuidelines
                citizenData={citizenData}
                assignedWorker={assignedWorker}
                setActiveTab={setActiveTab}
              />
            ) : activeTab === 'Settings' || activeTab === 'Theme & Settings' ? (
              <CitizenSettings citizenData={citizenData} setActiveTab={setActiveTab} />
            ) : activeTab === 'AI Assistant' || activeTab === 'EcoMind AI Chat' || activeTab === 'Mittu AI Chat' || activeTab === 'Mittu AI' || activeTab === 'Mittu' ? (
              <AIChatBot
                citizenData={citizenData}
                monthlyStatusData={monthlyStatusData}
                realRequests={realRequests}
                assignedWorker={assignedWorker}
                setActiveTab={setActiveTab}
              />
            ) : (
              /* CITIZEN DASHBOARD OVERVIEW */
              <div className="max-w-6xl mx-auto space-y-6 animate-fadeIn pb-8">

                {/* Glassmorphic Hero Banner */}
                <div className="bg-gradient-to-r from-[#0a4d2c] via-[#0f5b37] to-emerald-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
                  <div className="absolute right-0 top-0 translate-x-1/4 -translate-y-1/4 w-72 h-72 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />

                  <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-2">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-emerald-200 text-xs font-semibold">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
                        <span>{getGreeting()}, {citizenName}!</span>
                      </div>

                      <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                        EcoMind AI Citizen Portal
                      </h1>

                      <p className="text-xs sm:text-sm text-emerald-100/90 font-medium max-w-xl">
                        Track ongoing household waste pickup requests, view completed recycling history, and pay monthly Haritha Karma Sena fees.
                      </p>

                      <div className="pt-2 flex flex-wrap items-center gap-3 text-xs">
                        <span className="px-3 py-1 bg-emerald-900/80 text-emerald-200 font-extrabold rounded-xl flex items-center gap-1.5">
                          <Home className="w-3.5 h-3.5 text-emerald-300" />
                          House No: {houseNo} {houseName ? `(${houseName})` : ''}
                        </span>

                        <span className="px-3 py-1 bg-emerald-900/80 text-emerald-200 font-extrabold rounded-xl flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-emerald-300" />
                          {wardId} • {panchayat}
                        </span>

                        <span className={`px-3 py-1 font-extrabold rounded-xl flex items-center gap-1.5 ${isVerified
                            ? 'bg-emerald-500/30 text-emerald-100'
                            : isProfileComplete
                              ? 'bg-amber-500/30 text-amber-100'
                              : 'bg-red-500/30 text-red-100'
                          }`}>
                          <ShieldCheck className="w-3.5 h-3.5" />
                          {isVerified
                            ? 'Verified by Admin'
                            : isProfileComplete
                              ? 'Pending Verification'
                              : 'Incomplete Profile'}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
                      <button
                        type="button"
                        onClick={() => setActiveTab('AI Assistant')}
                        className="px-4 py-3 bg-emerald-950/60 hover:bg-emerald-950/80 text-emerald-200 font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Bot className="w-4 h-4 text-emerald-300" />
                        <span>Ask Mittu</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab('Monthly Payments')}
                        className="px-5 py-3 bg-emerald-400 text-emerald-950 hover:bg-emerald-300 font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <CreditCard className="w-4 h-4 text-emerald-950" />
                        <span>Monthly Payments</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab('Pickup Request')}
                        className="px-5 py-3 bg-white hover:bg-emerald-50 text-[#0a4d2c] font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Truck className="w-4 h-4 text-[#0a4d2c]" />
                        <span>Request Pickup</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Profile Completion Warning Banner */}
                {!isProfileComplete && (
                  <div className="bg-amber-50 dark:bg-[#20180d] rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-amber-500 text-white rounded-xl shrink-0">
                        <AlertCircle className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-extrabold text-amber-900 dark:text-amber-200">Residence Profile Incomplete</h4>
                        <p className="text-xs text-amber-700 dark:text-amber-300 font-medium">Please set your House Number & complete address so Haritha Karma Sena can locate your house for pickup.</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setActiveTab('Profile')}
                      className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shrink-0 cursor-pointer shadow-xs"
                    >
                      Complete Profile
                    </button>
                  </div>
                )}

                {/* DASHBOARD METRICS SUMMARY CARDS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

                  {/* Card 1: Monthly Pickup Request Status */}
                  <div className="bg-white dark:bg-[#121e17] p-5 rounded-2xl shadow-xs hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 space-y-3 relative overflow-hidden">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Monthly Request</span>
                      <div className="p-2 bg-emerald-50 dark:bg-[#1a3325] text-[#0a4d2c] dark:text-emerald-400 rounded-xl">
                        <Truck className="w-4 h-4" />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-base font-black ${currentMonthRequest ? 'text-[#0a4d2c] dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
                          }`}>
                          {currentMonthRequest ? (currentMonthRequest.status || 'Submitted') : 'Window Open'}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-[#1a3325] text-[#0a4d2c] dark:text-emerald-400">
                          Aug 2026
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-0.5">Collection drive: 15th to 25th</p>
                    </div>
                  </div>

                  {/* Card 2: User Fee Record Status */}
                  <div className="bg-white dark:bg-[#121e17] p-5 rounded-2xl shadow-xs hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 space-y-3 relative overflow-hidden">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">User Fee Record</span>
                      <div className="p-2 bg-emerald-50 dark:bg-[#1a3325] text-[#0a4d2c] dark:text-emerald-400 rounded-xl">
                        <FileText className="w-4 h-4" />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-base font-black text-gray-900 dark:text-gray-100">₹ 50 / Month</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-[#1a3325] text-[#0a4d2c] dark:text-emerald-400">
                          Household Card
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-0.5">Recorded on physical card</p>
                    </div>
                  </div>

                  {/* Card 3: Total Recycled Dry Plastics */}
                  <div className="bg-white dark:bg-[#121e17] p-5 rounded-2xl shadow-xs hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 space-y-3 relative overflow-hidden">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Waste Recycled</span>
                      <div className="p-2 bg-emerald-50 dark:bg-[#1a3325] text-[#0a4d2c] dark:text-emerald-400 rounded-xl">
                        <Recycle className="w-4 h-4" />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-base font-black text-[#0a4d2c] dark:text-emerald-400">14.6 kg Plastics</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/70 text-blue-800 dark:text-blue-300">
                          +250 Points
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-0.5">{completedWorkHistory.length} collection drives completed</p>
                    </div>
                  </div>

                  {/* Card 4: Service Ward & Haritha Karma Sena */}
                  <div className="bg-white dark:bg-[#121e17] p-5 rounded-2xl shadow-xs hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 space-y-3 relative overflow-hidden">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Service Ward</span>
                      <div className="p-2 bg-emerald-50 dark:bg-[#1a3325] text-[#0a4d2c] dark:text-emerald-400 rounded-xl">
                        <MapPin className="w-4 h-4" />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-base font-black text-gray-900 dark:text-gray-100">{wardId}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-[#1a3325] text-[#0a4d2c] dark:text-emerald-400">
                          {panchayat}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-0.5">Haritha Karma Sena Unit Active</p>
                    </div>
                  </div>
                </div>

                {/* ACTIVE HOUSEHOLD PICKUP STATUS & LIVE TRACKER / VERIFICATION PENDING */}
                {isVerified ? (
                  <div className="bg-white dark:bg-[#121e17] rounded-3xl p-6 shadow-xs space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="p-2 bg-emerald-100 dark:bg-[#1a3325] text-[#0a4d2c] dark:text-emerald-400 rounded-xl font-bold">
                            <Truck className="w-5 h-5" />
                          </span>
                          <div>
                            <h2 className="text-lg font-black text-gray-900 dark:text-gray-100">Active Monthly Pickup Tracker</h2>
                            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Status for current month waste collection drive</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 bg-emerald-100 dark:bg-[#1a3325] text-[#0a4d2c] dark:text-emerald-300 text-xs font-black rounded-full">
                          Status: {ongoingWork.status}
                        </span>
                        <span className="text-xs font-bold text-gray-400">ID: {ongoingWork.id}</span>
                      </div>
                    </div>

                    {/* Stepper Progress Bar */}
                    <div className="relative py-2">
                      <div className="grid grid-cols-4 gap-2 text-center relative z-10">

                        {/* Step 1: Requested */}
                        <div className="space-y-2">
                          <div className={`w-9 h-9 mx-auto rounded-full flex items-center justify-center font-extrabold text-xs shadow-xs transition-all ${ongoingWork.currentStep >= 1
                              ? 'bg-[#0a4d2c] text-white ring-4 ring-emerald-100 dark:ring-emerald-950/60'
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
                            }`}>
                            {ongoingWork.currentStep > 1 ? <Check className="w-4 h-4" /> : '1'}
                          </div>
                          <div>
                            <p className="text-xs font-extrabold text-gray-900 dark:text-gray-100">Requested</p>
                            <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">Request Logged</p>
                          </div>
                        </div>

                        {/* Step 2: Scheduled */}
                        <div className="space-y-2">
                          <div className={`w-9 h-9 mx-auto rounded-full flex items-center justify-center font-extrabold text-xs shadow-xs transition-all ${ongoingWork.currentStep >= 2
                              ? 'bg-[#0a4d2c] text-white ring-4 ring-emerald-100 dark:ring-emerald-950/60'
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
                            }`}>
                            {ongoingWork.currentStep > 2 ? <Check className="w-4 h-4" /> : '2'}
                          </div>
                          <div>
                            <p className="text-xs font-extrabold text-gray-900 dark:text-gray-100">Scheduled</p>
                            <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">15th - 25th Window</p>
                          </div>
                        </div>

                        {/* Step 3: Out for Collection */}
                        <div className="space-y-2">
                          <div className={`w-9 h-9 mx-auto rounded-full flex items-center justify-center font-extrabold text-xs shadow-xs transition-all ${ongoingWork.currentStep >= 3
                              ? 'bg-[#0a4d2c] text-white ring-4 ring-emerald-100 dark:ring-emerald-950/60 animate-pulse'
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
                            }`}>
                            {ongoingWork.currentStep > 3 ? <Check className="w-4 h-4" /> : '3'}
                          </div>
                          <div>
                            <p className="text-xs font-extrabold text-gray-900 dark:text-gray-100">In Transit</p>
                            <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">Haritha Sena Active</p>
                          </div>
                        </div>

                        {/* Step 4: Completed */}
                        <div className="space-y-2">
                          <div className={`w-9 h-9 mx-auto rounded-full flex items-center justify-center font-extrabold text-xs shadow-xs transition-all ${ongoingWork.currentStep >= 4
                              ? 'bg-[#0a4d2c] text-white ring-4 ring-emerald-100 dark:ring-emerald-950/60'
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
                            }`}>
                            {ongoingWork.currentStep >= 4 ? <Check className="w-4 h-4" /> : '4'}
                          </div>
                          <div>
                            <p className="text-xs font-extrabold text-gray-900 dark:text-gray-100">Completed</p>
                            <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">Card & Fee Logged</p>
                          </div>
                        </div>

                      </div>
                    </div>

                    {/* Detailed Request Box */}
                    <div className="bg-[#f2faf5] dark:bg-[#16291e] rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <span className="text-[10px] uppercase font-bold text-gray-400">Waste Category</span>
                        <h4 className="text-sm font-extrabold text-[#0a4d2c] dark:text-emerald-400">{ongoingWork.category}</h4>
                        <p className="text-xs text-gray-600 dark:text-gray-300 font-medium flex items-center gap-1.5 pt-1">
                          <Calendar className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                          {ongoingWork.isCompleted ? 'Collection Status:' : 'Collection Schedule:'}{' '}
                          <span className="font-extrabold text-gray-900 dark:text-gray-100">{ongoingWork.scheduledDate}</span>
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                          Assigned Team: <span className="font-extrabold text-gray-800 dark:text-gray-200">{ongoingWork.workerName}</span> ({ongoingWork.workerPhone})
                        </p>
                        {ongoingWork.verificationCode && (
                          <div className="mt-2 inline-flex items-center gap-2 bg-emerald-100 dark:bg-[#1f3a2b] px-3 py-1.5 rounded-xl">
                            <KeyRound className="w-3.5 h-3.5 text-[#0a4d2c] dark:text-emerald-400" />
                            <span className="text-[11px] font-bold text-[#0a4d2c] dark:text-emerald-400">
                              {ongoingWork.isCompleted ? 'Verification Code (Verified):' : 'Pickup Verification Code:'}
                            </span>
                            <span className="text-sm font-black font-mono tracking-widest text-[#0a4d2c] dark:text-emerald-300">
                              {ongoingWork.verificationCode}
                            </span>
                            {ongoingWork.isCompleted && (
                              <span className="text-[10px] bg-emerald-700 text-white font-extrabold px-2 py-0.5 rounded-full ml-1 flex items-center gap-1">
                                <Check className="w-3 h-3" /> Verified
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-3 shrink-0">
                        <button
                          onClick={() => setActiveTab('Collection Schedule')}
                          className="px-3.5 py-2.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-[#1a3325] dark:hover:bg-[#224431] text-[#0a4d2c] dark:text-emerald-300 font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <Calendar className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                          <span>Schedule</span>
                        </button>
                        <button
                          onClick={() => setActiveTab('Pickup Request')}
                          className="px-4 py-2.5 bg-[#0a4d2c] hover:bg-emerald-900 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer"
                        >
                          <Truck className="w-3.5 h-3.5" />
                          <span>{monthlyStatusData?.hasMonthlyRequest ? 'View Request' : 'Submit Pickup Request'}</span>
                        </button>
                        <button
                          onClick={() => setActiveTab('Collection Records')}
                          className="px-4 py-2.5 bg-white dark:bg-[#1a3325] text-[#0a4d2c] dark:text-emerald-300 hover:bg-emerald-50 font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                          <span>Card History</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* VERIFICATION PENDING CONTAINER */
                  <div className="bg-white dark:bg-[#121e17] rounded-3xl p-6 shadow-xs space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4">
                      <div className="flex items-center gap-2">
                        <span className="p-2 bg-amber-100 dark:bg-[#2a2012] text-amber-800 dark:text-amber-400 rounded-xl font-bold">
                          <Clock className="w-5 h-5" />
                        </span>
                        <div>
                          <h2 className="text-lg font-black text-gray-900 dark:text-gray-100">Verification Pending</h2>
                          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Account verification required to access monthly pickup tracker</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 bg-amber-100 dark:bg-[#2a2012] text-amber-800 dark:text-amber-400 text-xs font-black rounded-full flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                          Status: Verification Pending
                        </span>
                      </div>
                    </div>

                    <div className="bg-amber-50/70 dark:bg-[#20180e] rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                      <div className="space-y-2 max-w-2xl">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-amber-200/60 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 text-[11px] font-bold">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Admin Approval Required</span>
                        </div>
                        <h3 className="text-base font-extrabold text-amber-950 dark:text-amber-100">
                          Pickup Tracker Unavailable
                        </h3>
                        <p className="text-xs text-amber-900/90 dark:text-amber-200/90 leading-relaxed font-medium">
                          {isProfileComplete
                            ? "Your residence profile has been submitted and is currently pending verification by the Panchayat Administrator. Once verified, your active monthly pickup tracker and collection schedules will appear here."
                            : "Your residence profile is incomplete. Please set your House Number and address details so your account can be verified by the Administrator."}
                        </p>
                      </div>

                      <div className="flex flex-col sm:flex-row md:flex-col items-stretch gap-2.5 w-full md:w-auto shrink-0">
                        <button
                          onClick={() => setActiveTab('Profile')}
                          className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <User className="w-4 h-4" />
                          <span>{isProfileComplete ? 'View Profile Status' : 'Complete Profile Now'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* TWO COLUMN / FULL GRID: SEGREGATION INSTRUCTIONS & HELPDESK */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                  {/* Segregation Rules Card */}
                  <div className="bg-white dark:bg-[#121e17] rounded-3xl p-6 shadow-xs space-y-4">
                    <div className="flex items-center gap-2 pb-3">
                      <div className="p-2 bg-emerald-50 dark:bg-[#1a3325] text-[#0a4d2c] dark:text-emerald-400 rounded-xl">
                        <Leaf className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-extrabold text-gray-900 dark:text-gray-100">Plastic Segregation Rules</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Haritha Karma Sena collection guidelines</p>
                      </div>
                    </div>

                    <div className="space-y-3 text-xs font-medium text-gray-700 dark:text-gray-300">
                      <div className="flex items-start gap-2.5 p-2.5 bg-emerald-50/60 dark:bg-[#162b1e] rounded-xl">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-extrabold text-[#0a4d2c] dark:text-emerald-400 block">Rinse & Dry Plastics</span>
                          Ensure milk packets, covers, and containers are cleaned and dried before handing over.
                        </div>
                      </div>

                      <div className="flex items-start gap-2.5 p-2.5 bg-emerald-50/60 dark:bg-[#162b1e] rounded-xl">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-extrabold text-[#0a4d2c] dark:text-emerald-400 block">15th - 25th Collection Drive</span>
                          Haritha Karma Sena visits households every month between 15th and 25th dates.
                        </div>
                      </div>

                      <div className="flex items-start gap-2.5 p-2.5 bg-amber-50 dark:bg-[#20180d] rounded-xl">
                        <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-extrabold text-amber-900 dark:text-amber-200 block">No Wet Waste</span>
                          Do not mix wet food remnants or bio-waste with dry plastics.
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Panchayath Helpdesk Card */}
                  <div className="bg-gradient-to-br from-[#0a4d2c] to-emerald-900 text-white rounded-3xl p-6 shadow-md space-y-4 relative overflow-hidden flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2.5 pb-3">
                        <Phone className="w-5 h-5 text-emerald-300 shrink-0" />
                        <div>
                          <h4 className="font-extrabold text-sm tracking-wide">Grama Panchayat Helpdesk</h4>
                          <p className="text-[11px] text-emerald-200/90 font-medium">Chirakkadavu Grama Panchayat HKS UNIT</p>
                        </div>
                      </div>

                      <div className="space-y-2.5 pt-1 text-xs">
                        {/* Haritha Karma Sena Worker Name & Phone */}
                        <div className="bg-white/10 p-3 rounded-2xl space-y-1">
                          <div className="flex items-center justify-between text-[10px] text-emerald-200 font-extrabold uppercase tracking-wider">
                            <span>Haritha Karma Sena Field Worker</span>
                            <span className="px-2 py-0.5 bg-emerald-500/30 text-emerald-100 rounded-md">{wardId}</span>
                          </div>
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 font-bold pt-1">
                            <span className="text-white font-extrabold text-sm">{senaWorkerName}</span>
                            <a href={`tel:${senaWorkerPhone}`} className="text-emerald-300 font-extrabold hover:underline flex items-center gap-1.5 shrink-0">
                              <Phone className="w-3.5 h-3.5 text-emerald-300" />
                              {senaWorkerPhone}
                            </a>
                          </div>
                        </div>

                        {/* Grama Panchayat Office Details */}
                        <div className="bg-white/10 p-3.5 rounded-2xl space-y-2">
                          <div className="flex items-center justify-between text-[10px] text-emerald-200 font-extrabold uppercase tracking-wider pb-1">
                            <span>For Complaints and Feedback</span>
                            <span>Chirakkadavu Grama Panchayat</span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-0.5 text-xs font-semibold">
                            <div className="flex items-center gap-1.5 text-emerald-100">
                              <MapPin className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
                              <span>District: <strong className="text-white font-extrabold">{panchayatDistrict}</strong></span>
                            </div>

                            <div className="flex items-center gap-1.5 text-emerald-100">
                              <Home className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
                              <span>Pincode: <strong className="text-white font-extrabold">{panchayatPincode}</strong></span>
                            </div>

                            <div className="flex items-center gap-1.5 text-emerald-100">
                              <Phone className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
                              <a href={`tel:${panchayatHelpline}`} className="text-emerald-300 font-extrabold hover:underline">
                                {panchayatHelpline}
                              </a>
                            </div>

                            <div className="flex items-center gap-1.5 text-emerald-100 min-w-0">
                              <Mail className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
                              <a href={`mailto:${panchayatEmail}`} className="text-emerald-300 font-extrabold hover:underline truncate" title={panchayatEmail}>
                                {panchayatEmail}
                              </a>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        onClick={() => setActiveTab('Collection Records')}
                        className="w-full py-2.5 bg-white/15 hover:bg-white/25 text-white font-extrabold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
                      >
                        <FileText className="w-4 h-4 text-emerald-300" />
                        <span>View Full Collection Records</span>
                      </button>
                    </div>
                  </div>

                </div>

              </div>
            )}
          </div>

          <div className="print:hidden">
            <Footer />
          </div>
        </main>
      </div>

      {/* Persistent Floating AI Chatbot Widget */}
      <div className="print:hidden">
        <AIFloatingChat
          citizenData={citizenData}
          monthlyStatusData={monthlyStatusData}
          realRequests={realRequests}
          assignedWorker={assignedWorker}
          setActiveTab={setActiveTab}
          onExpandFull={() => setActiveTab('AI Assistant')}
        />
      </div>
    </div>
  );
};

export default CitizenDashboard;