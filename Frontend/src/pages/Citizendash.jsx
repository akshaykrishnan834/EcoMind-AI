import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import CitizenSidebar from '../components/CitizenSidebar';
import CitizenProfile from '../components/CitizenProfile';
import PickupRequest from '../components/PickupRequest';
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
  User,
  ArrowRight,
  ShieldCheck,
  Check,
  ChevronRight,
  FileText,
  RefreshCw,
  Leaf
} from 'lucide-react';
import { getCitizenByEmail } from '../services/citizenService';

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

  // Ongoing work mock/real state
  const ongoingWork = {
    id: 'REQ-8492',
    category: 'Non-Biodegradable Plastic & Dry Waste',
    scheduledDate: 'Today, 10:30 AM - 1:00 PM',
    status: 'In Progress',
    currentStep: 3, // 1: Requested, 2: Assigned, 3: In Transit, 4: Completed
    workerName: 'Haritha Karma Sena Unit 4',
    workerPhone: '+91 98470 12345',
    notes: 'Please keep dried non-biodegradable plastics ready at the gate.'
  };

  // Completed work history mock/real state
  const completedWorkHistory = [
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
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-[#f3f7f5] font-sans">
      {/* Top Header (Fixed at top) */}
      <div className="shrink-0 z-40 border-b border-emerald-100/80 shadow-2xs">
        <Header />
      </div>

      {/* Main Content Layout with Sidebar */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        <CitizenSidebar
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
            {activeTab === 'Profile' ? (
            <CitizenProfile />
          ) : activeTab === 'Pickup Request' ? (
            <PickupRequest citizenData={citizenData} />
          ) : (
            /* CITIZEN DASHBOARD OVERVIEW */
            <div className="max-w-6xl mx-auto space-y-6 animate-fadeIn">
              
              {/* Glassmorphic Hero Banner */}
              <div className="bg-gradient-to-r from-[#0a4d2c] via-[#0f5b37] to-emerald-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
                <div className="absolute right-0 top-0 translate-x-1/4 -translate-y-1/4 w-72 h-72 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="space-y-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-emerald-200 text-xs font-semibold">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
                      <span>{getGreeting()}, {citizenName}!</span>
                    </div>

                    <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                      EcoMind AI Citizen Portal
                    </h1>

                    <p className="text-xs sm:text-sm text-emerald-100/90 font-medium max-w-xl">
                      Track ongoing household waste pickup requests, view completed recycling history, and manage your residence location.
                    </p>

                    <div className="pt-2 flex flex-wrap items-center gap-3 text-xs">
                      <span className="px-3 py-1 bg-emerald-900/80 border border-emerald-400/40 text-emerald-200 font-extrabold rounded-xl flex items-center gap-1.5">
                        <Home className="w-3.5 h-3.5 text-emerald-300" />
                        House No: {houseNo} {houseName ? `(${houseName})` : ''}
                      </span>

                      <span className="px-3 py-1 bg-emerald-900/80 border border-emerald-400/40 text-emerald-200 font-extrabold rounded-xl flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-emerald-300" />
                        {wardId} • {panchayat}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
                    <button
                      type="button"
                      onClick={() => setActiveTab('Pickup Request')}
                      className="px-5 py-3 bg-white hover:bg-emerald-50 text-[#0a4d2c] font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Truck className="w-4 h-4 text-[#0a4d2c]" />
                      <span>Request Pickup</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('Profile')}
                      className="px-5 py-3 bg-emerald-900/80 hover:bg-emerald-950 border border-emerald-400/40 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <User className="w-4 h-4 text-emerald-300" />
                      <span>{isProfileComplete ? 'View Profile' : 'Complete Profile'}</span>
                    </button>
                  </div>
                </div>
              </div>

            </div>
          )}
          </div>

          <Footer />
        </main>
      </div>
    </div>
  );
};

export default CitizenDashboard;