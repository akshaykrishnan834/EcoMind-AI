import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  ShieldCheck,
  Calendar,
  Truck,
  MapPin,
  CheckCircle2,
  ChevronRight,
  ChevronDown,
  ArrowRight,
  Bot,
  Layers,
  Activity,
  Smartphone,
  Eye,
  RefreshCw,
  Clock,
  Menu,
  X,
  FileCheck,
  Check,
  AlertCircle,
  ExternalLink,
  Lock,
  BarChart3,
  Users,
  User,
  LogOut,
  Leaf,
  Navigation,
  CreditCard,
  Radio,
  Recycle,
  Award,
  Heart,
  QrCode,
  Sun,
  Zap,
  Star,
  Shield,
  Play,
  Home,
  Globe,
  Settings,
  Sprout,
  LayoutGrid,
  Scan,
  Route
} from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';
import ecomindlogo from "../assets/images/logo-ecomind.png";
import harithaWorkersImg from "../assets/images/harithakarmasena-workers.jpg";
import keralaGovImg from "../assets/images/Government-of-kerala.png";
import harithaKarmaSenaImg from "../assets/images/harithaKarma-sena.jpg";
import suchitwaMissionImg from "../assets/images/img22.jpg";
import { TermsModal, PrivacyModal } from '../components/Modals';

export const LandingPage = () => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const userMenuRef = useRef(null);

  // User auth state
  const [isLoggedIn, setIsLoggedIn] = useState(() => localStorage.getItem('isLoggedIn') === 'true');
  const [userObj, setUserObj] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('user') || '{}');
    } catch {
      return {};
    }
  });
  const [storedUserName, setStoredUserName] = useState(() => localStorage.getItem('userName') || '');

  useEffect(() => {
    const syncUser = () => {
      setIsLoggedIn(localStorage.getItem('isLoggedIn') === 'true');
      try {
        setUserObj(JSON.parse(localStorage.getItem('user') || '{}'));
      } catch {
        setUserObj({});
      }
      setStoredUserName(localStorage.getItem('userName') || '');
    };
    window.addEventListener('storage', syncUser);
    return () => window.removeEventListener('storage', syncUser);
  }, []);

  const effectiveUserName = useMemo(() => {
    const name = storedUserName || userObj.fullName || userObj.name;
    if (name) return name;
    return 'Citizen';
  }, [storedUserName, userObj]);

  const userInitial = useMemo(() => {
    const trimmed = (effectiveUserName || '').trim();
    return trimmed ? trimmed[0].toUpperCase() : 'U';
  }, [effectiveUserName]);

  const userRole = useMemo(() => {
    const roleStr = (userObj.role || userObj.userType || '').toLowerCase();
    if (roleStr.includes('worker')) return 'worker';
    if (roleStr.includes('admin')) return 'admin';
    return 'citizen';
  }, [userObj]);

  const roleLabel = useMemo(() => {
    if (userRole === 'worker') return 'Worker Panel';
    if (userRole === 'admin') return 'Admin Panel';
    return 'Citizen Panel';
  }, [userRole]);

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    sessionStorage.clear();
    setIsLoggedIn(false);
    setUserDropdownOpen(false);
    navigate('/', { replace: true });
  };

  const handleProfileClick = () => {
    setUserDropdownOpen(false);
    if (userRole === 'worker') {
      sessionStorage.setItem('workerActiveTab', 'Profile');
      navigate('/worker');
    } else if (userRole === 'admin') {
      navigate('/admin');
    } else {
      sessionStorage.setItem('citizenActiveTab', 'Profile');
      navigate('/citizen');
    }
  };

  // Close user dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Interactive Section States
  const [activeWorkflowStep, setActiveWorkflowStep] = useState(0);
  const [activeCitizenStep, setActiveCitizenStep] = useState(0);
  const [heroActiveTab, setHeroActiveTab] = useState('radar'); // 'radar' | 'ai' | 'otp'
  const [heroTruckDistance, setHeroTruckDistance] = useState(135);

  // Smooth periodic distance simulation for Hero Live Radar Showcase
  useEffect(() => {
    const timer = setInterval(() => {
      setHeroTruckDistance((prev) => {
        if (prev <= 40) return 175;
        return prev - 15;
      });
    }, 2500);
    return () => clearInterval(timer);
  }, []);

  // Modals
  const [modalState, setModalState] = useState({
    terms: false,
    privacy: false
  });

  // Track scroll position for sticky header glass styling
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Workflow Pipeline Steps (English with Harithamithram & Kudumbashree context)
  const workflowSteps = [
    {
      num: '01',
      title: 'Household Segregation',
      tag: 'Dry Plastic Preparation',
      desc: 'Residents rinse, clean, and segregate clean plastic covers, bottles, and non-biodegradable recyclables for the scheduled collection drive.'
    },
    {
      num: '02',
      title: 'AI Waste Analysis',
      tag: 'Computer Vision AI',
      desc: 'AI Vision model scans waste items, classifies polymers (PET, HDPE, LDPE), and validates cleanliness criteria before collection.'
    },
    {
      num: '03',
      title: 'Ward Route Clustering',
      tag: 'Dynamic Ward Routing',
      desc: 'Intelligent engine aggregates household requests by Ward and Lane, sequencing stops to minimize transit time and physical exhaustion.'
    },
    {
      num: '04',
      title: 'HKS On-Duty Dispatch',
      tag: 'Live GPS Broadcast',
      desc: 'Kudumbashree Haritha Karma Sena workers activate On-Duty mode, broadcasting real-time location to residents within the ward.'
    },
    {
      num: '05',
      title: 'Live Citizen Tracking',
      tag: 'Doorstep Proximity',
      desc: 'Citizens track collection vehicle movement on an interactive map with doorstep arrival proximity alerts within 150 meters.'
    },
    {
      num: '06',
      title: 'Verified Handover',
      tag: '4-Digit OTP Code',
      desc: 'Handover is confirmed exclusively with a 4-digit citizen OTP, instantly issuing a digital receipt for the ₹50 monthly user fee.'
    },
    {
      num: '07',
      title: 'MCF & Circular Recovery',
      tag: 'Zero Landfill Baling',
      desc: 'Clean plastic bales are consolidated at Panchayat Material Collection Facilities (MCF) and sent to certified recycling partners.'
    }
  ];

  // Citizen Journey Steps (English)
  const citizenJourney = [
    {
      step: '01',
      title: 'Check Schedule',
      badge: '20th–25th Drive',
      desc: 'View your exact monthly collection dates synced with the Ward Haritha Karma Sena calendar.'
    },
    {
      step: '02',
      title: 'Request Pickup',
      badge: '1-Click Portal',
      desc: 'Schedule on-demand plastic pickup or get segregation advice from AI Assistant Mittu.'
    },
    {
      step: '03',
      title: 'Track Live Worker',
      badge: 'Real-Time Map',
      desc: 'See the Haritha Karma Sena vehicle approaching on Leaflet map with doorstep proximity alerts.'
    },
    {
      step: '04',
      title: 'Direct Worker Chat',
      badge: 'Instant Support',
      desc: 'Coordinate gate access, special bulky plastics, or slight delays directly with your field worker.'
    },
    {
      step: '05',
      title: 'OTP Verification',
      badge: '4-Digit Code',
      desc: 'Share your 4-digit verification code to confirm handover and eliminate disputed collections.'
    },
    {
      step: '06',
      title: 'Digital Card & History',
      badge: '₹50 Fee Sync',
      desc: 'Access transparent monthly user fee payment history and earn eco-points for plastic diverted.'
    }
  ];

  // Smooth scroll handler
  const scrollToSection = (id) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#0c0e12] text-slate-900 dark:text-slate-100 font-sans selection:bg-emerald-500/20 selection:text-emerald-700 dark:selection:text-emerald-300 transition-colors duration-200 overflow-x-hidden antialiased">


      {/* ========================================================
          1. HEADER NAVIGATION BAR
          ======================================================== */}
      <header className={`sticky top-0 z-50 w-full transition-all duration-300 ${scrolled
        ? 'bg-white/95 dark:bg-[#0c0e12]/95 backdrop-blur-xl border-b border-emerald-100 dark:border-white/10 shadow-md'
        : 'bg-white dark:bg-[#0c0e12] border-b border-slate-100 dark:border-white/5 shadow-xs'
        }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-3 xl:gap-4">

          {/* Left: Brand Identity */}
          <a href="#" className="flex items-center gap-2.5 group focus:outline-hidden shrink-0">
            <img
              src={ecomindlogo}
              alt="EcoMind AI Logo"
              className="w-9 h-9 object-contain drop-shadow-xs shrink-0"
            />
            <div className="flex flex-col text-left">
              <span className="text-base sm:text-lg font-black tracking-tight text-slate-950 dark:text-white leading-none whitespace-nowrap">
                EcoMind AI
              </span>
              <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 tracking-tight mt-0.5 whitespace-nowrap">
                Smart Recyclable Waste System
              </span>
            </div>
          </a>

          {/* Center: Desktop Navigation Pills */}
          <nav className="hidden lg:flex items-center gap-0.5 xl:gap-1 text-xs font-bold shrink-0">
            <button
              onClick={() => scrollToSection('home')}
              className="px-2.5 xl:px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-[#0a4d2c] dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/80 inline-flex items-center gap-1.5 cursor-pointer shadow-xs whitespace-nowrap shrink-0"
            >
              <Home className="w-3.5 h-3.5 text-[#0a4d2c] dark:text-emerald-300 shrink-0" />
              <span>Home</span>
            </button>
            <button
              onClick={() => scrollToSection('features')}
              className="px-2 xl:px-2.5 py-1.5 rounded-xl text-slate-700 dark:text-slate-300 hover:text-emerald-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
            >
              <LayoutGrid className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>Features</span>
            </button>
            <button
              onClick={() => scrollToSection('how-it-works')}
              className="px-2 xl:px-2.5 py-1.5 rounded-xl text-slate-700 dark:text-slate-300 hover:text-emerald-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
            >
              <Settings className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>How It Works</span>
            </button>
            <button
              onClick={() => scrollToSection('for-citizens')}
              className="px-2 xl:px-2.5 py-1.5 rounded-xl text-slate-700 dark:text-slate-300 hover:text-emerald-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
            >
              <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>For Citizens</span>
            </button>
            <button
              onClick={() => scrollToSection('for-workers')}
              className="px-2 xl:px-2.5 py-1.5 rounded-xl text-slate-700 dark:text-slate-300 hover:text-emerald-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
            >
              <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>For Workers</span>
            </button>
          </nav>

          {/* Right: ThemeToggle, Sign In, Join / Register */}
          <div className="hidden md:flex items-center gap-2 shrink-0">
            <div className="shrink-0">
              <ThemeToggle />
            </div>
            {isLoggedIn ? (
              <div className="relative shrink-0" ref={userMenuRef}>
                <button
                  type="button"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-[#181b20] hover:bg-emerald-100/70 dark:hover:bg-[#22272e] border border-emerald-200/90 dark:border-white/10 hover:border-emerald-500 shadow-xs transition-all duration-200 cursor-pointer group whitespace-nowrap shrink-0"
                  title="User menu"
                  aria-expanded={userDropdownOpen}
                >
                  <div className="relative shrink-0">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#0a4d2c] to-emerald-600 text-white flex items-center justify-center font-black text-xs shadow-xs group-hover:scale-105 transition-transform">
                      {userInitial}
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-600 text-white flex items-center justify-center border-2 border-white dark:border-[#181b20] shadow-xs">
                      <Leaf className="w-2 h-2 fill-current" />
                    </div>
                  </div>
                  <div className="flex items-center text-left min-w-0 max-w-[130px] md:max-w-[170px]">
                    <span className="text-xs font-extrabold text-slate-800 dark:text-slate-100 truncate group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                      {effectiveUserName}
                    </span>
                  </div>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 dark:text-slate-500 transition-transform duration-200 shrink-0 ${userDropdownOpen ? 'rotate-180 text-emerald-600' : ''}`} />
                </button>

                {/* User Dropdown Menu */}
                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2.5 w-64 rounded-2xl bg-white dark:bg-[#181b22] border border-emerald-200/90 dark:border-white/10 shadow-2xl p-2 z-50 animate-fadeIn">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100/60 dark:from-[#121418] dark:to-[#18201a] border border-emerald-100 dark:border-white/5 mb-1.5 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#0a4d2c] text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
                        {userInitial}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-black text-slate-900 dark:text-white truncate">
                          {effectiveUserName}
                        </p>
                        <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-bold truncate">
                          {roleLabel}
                        </p>
                      </div>
                    </div>

                    <div className="h-px bg-slate-100 dark:bg-white/5 my-1" />

                    <button
                      type="button"
                      onClick={handleProfileClick}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-700 transition-colors cursor-pointer group"
                    >
                      <User className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Open Dashboard / Profile</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer group mt-0.5"
                    >
                      <LogOut className="w-4 h-4 text-rose-500 shrink-0" />
                      <span>Log Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <button
                  onClick={() => navigate('/login')}
                  className="px-3.5 py-1.5 text-xs font-bold rounded-xl border border-emerald-300 dark:border-emerald-700 text-[#0a4d2c] dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  Sign In
                </button>
                <button
                  onClick={() => navigate('/signup')}
                  className="px-4 py-1.5 text-xs font-bold rounded-xl bg-[#0a4d2c] hover:bg-[#073921] text-white shadow-xs transition-all cursor-pointer inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
                >
                  <span>Join / Register</span>
                  <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                </button>
              </>
            )}
          </div>

          {/* Mobile / Tablet Hamburger Toggle */}
          <div className="flex lg:hidden items-center gap-2 shrink-0">
            <ThemeToggle />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>

        {/* Mobile / Tablet Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-b border-emerald-100 dark:border-white/10 bg-white dark:bg-[#121417] px-6 py-5 space-y-4 shadow-xl">
            <nav className="flex flex-col space-y-3 text-sm font-bold text-slate-700 dark:text-slate-200">
              <button onClick={() => { setMobileMenuOpen(false); scrollToSection('home'); }} className="text-left py-1 hover:text-emerald-600">Home</button>
              <button onClick={() => { setMobileMenuOpen(false); scrollToSection('features'); }} className="text-left py-1 hover:text-emerald-600">Features</button>
              <button onClick={() => { setMobileMenuOpen(false); scrollToSection('how-it-works'); }} className="text-left py-1 hover:text-emerald-600">How It Works</button>
              <button onClick={() => { setMobileMenuOpen(false); scrollToSection('for-citizens'); }} className="text-left py-1 hover:text-emerald-600">For Citizens</button>
              <button onClick={() => { setMobileMenuOpen(false); scrollToSection('for-workers'); }} className="text-left py-1 hover:text-emerald-600">For Workers</button>
            </nav>
            <div className="pt-4 border-t border-slate-100 dark:border-white/10 flex flex-col gap-2.5">
              {isLoggedIn ? (
                <>
                  <button
                    onClick={() => { setMobileMenuOpen(false); handleProfileClick(); }}
                    className="w-full py-2.5 text-center text-sm font-extrabold rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center gap-2"
                  >
                    <User className="w-4 h-4" />
                    <span>Open Dashboard</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setMobileMenuOpen(false); handleLogout(); }}
                    className="w-full py-2.5 text-center text-sm font-extrabold rounded-xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Log Out</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => { setMobileMenuOpen(false); navigate('/login'); }}
                    className="w-full py-2.5 text-center text-sm font-bold text-slate-700 dark:text-slate-200 border border-slate-200 rounded-xl"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => { setMobileMenuOpen(false); navigate('/signup'); }}
                    className="w-full py-2.5 text-center text-sm font-bold rounded-xl bg-[#0a4d2c] text-white shadow-md"
                  >
                    Join / Register
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* ========================================================
          2. HERO SECTION & 4 FEATURE TILES (EXACT REFERENCE DESIGN)
          ======================================================== */}
      <section id="home" className="relative pt-8 pb-12 sm:pt-12 sm:pb-16 overflow-hidden bg-gradient-to-b from-[#eaf6ef]/70 via-[#f5fbf7]/50 to-white dark:from-[#0a1810] dark:via-[#0c1410] dark:to-[#0c0e12]">

        {/* Soft Organic Green Background Decorative Shapes matching reference */}
        <div className="absolute top-0 left-0 w-96 h-96 -translate-x-24 -translate-y-12 opacity-40 dark:opacity-20 pointer-events-none">
          <svg viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full text-emerald-300 dark:text-emerald-700">
            <path d="M-50,150 Q100,50 180,180 T350,220 C280,320 120,380 -50,300 Z" fill="currentColor" fillOpacity="0.3" />
          </svg>
        </div>
        <div className="absolute top-4 right-0 w-[500px] h-[500px] translate-x-32 -translate-y-16 opacity-40 dark:opacity-20 pointer-events-none">
          <svg viewBox="0 0 500 500" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full text-emerald-400 dark:text-emerald-600">
            <path d="M250,50 C380,80 480,200 460,350 C380,450 200,480 120,380 C50,280 100,120 250,50 Z" fill="currentColor" fillOpacity="0.25" />
          </svg>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

          {/* Main Hero Header */}
          <div className="max-w-3xl space-y-5 text-left">

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-[3.6rem] font-black tracking-tight text-slate-900 dark:text-white leading-[1.12]">
              Smart Recyclable<br />
              Waste Collection,<br />
              <span className="text-[#0a4d2c] dark:text-emerald-400">Powered by </span>
              <span className="text-emerald-600 dark:text-emerald-300">AI & GPS.</span>
            </h1>

            {/* Description */}
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed font-medium max-w-2xl">
              EcoMind AI digitizes door-to-door recyclable waste operations across Kerala. Featuring real-time vehicle GPS tracking, AI waste classification, and tamper-proof digital receipts — empowering 30,000+ Kudumbashree women and 940+ Panchayats.
            </p>

          </div>

          {/* Underneath Hero: 4 Feature Cards in a Row (Unified Green Theme) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-10">

            {/* Tile 1: AI Waste Classification */}
            <div
              onClick={() => scrollToSection('features')}
              className="bg-emerald-50/70 dark:bg-[#0c1a12] border border-emerald-200/90 dark:border-emerald-800/60 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-2xs hover:shadow-md hover:border-emerald-400 dark:hover:border-emerald-600 transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-[#0a4d2c] text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                  <Scan className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <h4 className="font-extrabold text-xs text-slate-900 dark:text-white">AI Waste Classification</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug mt-0.5">
                    Upload an image and instantly identify recyclable categories.
                  </p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-emerald-600 dark:text-emerald-400 group-hover:translate-x-1 transition-transform shrink-0" />
            </div>

            {/* Tile 2: Smart Pickup Scheduling */}
            <div
              onClick={() => scrollToSection('features')}
              className="bg-emerald-50/70 dark:bg-[#0c1a12] border border-emerald-200/90 dark:border-emerald-800/60 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-2xs hover:shadow-md hover:border-emerald-400 dark:hover:border-emerald-600 transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-[#0a4d2c] text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                  <Calendar className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <h4 className="font-extrabold text-xs text-slate-900 dark:text-white">Smart Pickup Scheduling</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug mt-0.5">
                    Request recyclable waste pickup from your home.
                  </p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-emerald-600 dark:text-emerald-400 group-hover:translate-x-1 transition-transform shrink-0" />
            </div>

            {/* Tile 3: Real-Time GPS Tracking */}
            <div
              onClick={() => scrollToSection('features')}
              className="bg-emerald-50/70 dark:bg-[#0c1a12] border border-emerald-200/90 dark:border-emerald-800/60 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-2xs hover:shadow-md hover:border-emerald-400 dark:hover:border-emerald-600 transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-[#0a4d2c] text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                  <Route className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <h4 className="font-extrabold text-xs text-slate-900 dark:text-white">Real-Time GPS Tracking</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug mt-0.5">
                    Track collection routes and worker locations live.
                  </p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-emerald-600 dark:text-emerald-400 group-hover:translate-x-1 transition-transform shrink-0" />
            </div>

            {/* Tile 4: Reports & Analytics */}
            <div
              onClick={() => scrollToSection('features')}
              className="bg-emerald-50/70 dark:bg-[#0c1a12] border border-emerald-200/90 dark:border-emerald-800/60 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-2xs hover:shadow-md hover:border-emerald-400 dark:hover:border-emerald-600 transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-[#0a4d2c] text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <h4 className="font-extrabold text-xs text-slate-900 dark:text-white">Reports & Analytics</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug mt-0.5">
                    View collection statistics and environmental impact.
                  </p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-emerald-600 dark:text-emerald-400 group-hover:translate-x-1 transition-transform shrink-0" />
            </div>

          </div>

        </div>
      </section>


      {/* ========================================================
          4. STATE-WIDE IMPACT STATS COUNTERS (VIBRANT CARDS)
          ======================================================== */}
      <section className="py-16 bg-slate-50 dark:bg-[#101216] border-b border-emerald-100 dark:border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

            {/* Stat 1: Kudumbashree HKS Members */}
            <div className="bg-gradient-to-br from-[#0a4d2c] via-[#0d5933] to-[#083b22] text-white rounded-3xl p-6 shadow-xl relative overflow-hidden group hover:-translate-y-1 transition-all border border-emerald-500/20">
              <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />
              <div className="flex items-center justify-between pb-3">
                <span className="text-xs font-black uppercase tracking-wider text-emerald-200">Kudumbashree Field Force</span>
                <div className="p-2.5 bg-white/15 rounded-xl text-emerald-100">
                  <Users className="w-5 h-5" />
                </div>
              </div>
              <p className="text-4xl font-black tracking-tight">30,000+</p>
              <p className="text-xs font-bold text-emerald-100 mt-2">
                Haritha Karma Sena women empowered across Kerala
              </p>
            </div>

            {/* Stat 2: Local Bodies */}
            <div className="bg-gradient-to-br from-[#083b22] via-[#0b4e2c] to-[#062c19] text-white rounded-3xl p-6 shadow-xl relative overflow-hidden group hover:-translate-y-1 transition-all border border-emerald-500/20">
              <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />
              <div className="flex items-center justify-between pb-3">
                <span className="text-xs font-black uppercase tracking-wider text-emerald-200">Local Self Governments</span>
                <div className="p-2.5 bg-white/15 rounded-xl text-emerald-100">
                  <Award className="w-5 h-5" />
                </div>
              </div>
              <p className="text-4xl font-black tracking-tight">941+</p>
              <p className="text-xs font-bold text-emerald-100 mt-2">
                Grama Panchayats & Municipalities implementing smart collection
              </p>
            </div>

            {/* Stat 3: 100% Segregated Collection */}
            <div className="bg-gradient-to-br from-[#0a4d2c] via-[#0d5933] to-[#083b22] text-white rounded-3xl p-6 shadow-xl relative overflow-hidden group hover:-translate-y-1 transition-all border border-emerald-500/20">
              <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />
              <div className="flex items-center justify-between pb-3">
                <span className="text-xs font-black uppercase tracking-wider text-emerald-200">Scientific Segregation</span>
                <div className="p-2.5 bg-white/15 rounded-xl text-emerald-100">
                  <Recycle className="w-5 h-5" />
                </div>
              </div>
              <p className="text-4xl font-black tracking-tight">100%</p>
              <p className="text-xs font-bold text-emerald-100 mt-2">
                Segregated dry plastics diverted from water bodies & burning
              </p>
            </div>

            {/* Stat 4: Zero Blind Runs with AI */}
            <div className="bg-gradient-to-br from-[#083b22] via-[#0b4e2c] to-[#062c19] text-white rounded-3xl p-6 shadow-xl relative overflow-hidden group hover:-translate-y-1 transition-all border border-emerald-500/20">
              <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />
              <div className="flex items-center justify-between pb-3">
                <span className="text-xs font-black uppercase tracking-wider text-emerald-200">Digital Transparency</span>
                <div className="p-2.5 bg-white/15 rounded-xl text-emerald-100">
                  <Lock className="w-5 h-5" />
                </div>
              </div>
              <p className="text-4xl font-black tracking-tight">Zero</p>
              <p className="text-xs font-bold text-emerald-100 mt-2">
                Blind runs or disputes via 4-digit OTP doorstep handshake
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* ========================================================
          5. HARITHAMITHRAM 6 CORE PILLARS (UNIFIED GREEN THEME)
          ======================================================== */}
      <section id="features" className="py-24 bg-white dark:bg-[#0c0e12] relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">

            <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-950 dark:text-white">
              Transforming Waste Management Through<br />
              <span className="text-[#0a4d2c] dark:text-emerald-400">
                Modern Technology & Community Dignity
              </span>
            </h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
              Six essential pillars engineered to make Haritha Karma Sena operations seamless, transparent, and citizen-friendly.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">

            {/* Pillar 1: Doorstep Collection Window */}
            <div className="p-7 rounded-3xl bg-emerald-50/40 hover:bg-emerald-50/80 dark:bg-[#0f1f17] dark:hover:bg-[#13271d] border-2 border-emerald-200/80 dark:border-emerald-800/40 hover:border-emerald-400 dark:hover:border-emerald-600 shadow-sm hover:shadow-xl transition-all duration-300 group hover:-translate-y-1">
              <div className="w-12 h-12 rounded-2xl bg-[#0a4d2c] text-white flex items-center justify-center font-black shadow-md group-hover:scale-110 transition-transform">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white mt-5">
                20th–25th Monthly Collection Drive
              </h3>
              <p className="text-xs font-bold text-[#0a4d2c] dark:text-emerald-400 mt-1">
                Fixed Household Collection Window
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-3 leading-relaxed">
                Standardized monthly collection window runs across every ward from the 20th to 25th of each month, removing guesswork for households.
              </p>
            </div>

            {/* Pillar 2: Kudumbashree Women Empowerment */}
            <div className="p-7 rounded-3xl bg-emerald-50/40 hover:bg-emerald-50/80 dark:bg-[#0f1f17] dark:hover:bg-[#13271d] border-2 border-emerald-200/80 dark:border-emerald-800/40 hover:border-emerald-400 dark:hover:border-emerald-600 shadow-sm hover:shadow-xl transition-all duration-300 group hover:-translate-y-1">
              <div className="w-12 h-12 rounded-2xl bg-[#0a4d2c] text-white flex items-center justify-center font-black shadow-md group-hover:scale-110 transition-transform">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white mt-5">
                Kudumbashree Women Empowerment
              </h3>
              <p className="text-xs font-bold text-[#0a4d2c] dark:text-emerald-400 mt-1">
                Field Dignity & Fair Living Wages
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-3 leading-relaxed">
                Empowering Haritha Karma Sena field volunteers with ergonomic digital tools, transparent user fee collection, and community respect.
              </p>
            </div>

            {/* Pillar 3: AI Computer Vision Scanner */}
            <div className="p-7 rounded-3xl bg-emerald-50/40 hover:bg-emerald-50/80 dark:bg-[#0f1f17] dark:hover:bg-[#13271d] border-2 border-emerald-200/80 dark:border-emerald-800/40 hover:border-emerald-400 dark:hover:border-emerald-600 shadow-sm hover:shadow-xl transition-all duration-300 group hover:-translate-y-1">
              <div className="w-12 h-12 rounded-2xl bg-[#0a4d2c] text-white flex items-center justify-center font-black shadow-md group-hover:scale-110 transition-transform">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white mt-5">
                AI Mittu Waste Classifier
              </h3>
              <p className="text-xs font-bold text-[#0a4d2c] dark:text-emerald-400 mt-1">
                Computer Vision Polymer Identification
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-3 leading-relaxed">
                Scan milk packets, bottles, and packaging with your phone camera to instantly identify polymer grade and proper rinsing instructions.
              </p>
            </div>

            {/* Pillar 4: Live Worker GPS Navigation & Geofence */}
            <div className="p-7 rounded-3xl bg-emerald-50/40 hover:bg-emerald-50/80 dark:bg-[#0f1f17] dark:hover:bg-[#13271d] border-2 border-emerald-200/80 dark:border-emerald-800/40 hover:border-emerald-400 dark:hover:border-emerald-600 shadow-sm hover:shadow-xl transition-all duration-300 group hover:-translate-y-1">
              <div className="w-12 h-12 rounded-2xl bg-[#0a4d2c] text-white flex items-center justify-center font-black shadow-md group-hover:scale-110 transition-transform">
                <Navigation className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white mt-5">
                Real-Time Vehicle GPS Tracking
              </h3>
              <p className="text-xs font-bold text-[#0a4d2c] dark:text-emerald-400 mt-1">
                Interactive Leaflet Map & Doorstep Proximity
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-3 leading-relaxed">
                Track your ward's Haritha Karma Sena vehicle live on duty. Automated alerts notify residents when the vehicle approaches within 150 meters.
              </p>
            </div>

            {/* Pillar 5: OTP Handshake & Digital Receipts */}
            <div className="p-7 rounded-3xl bg-emerald-50/40 hover:bg-emerald-50/80 dark:bg-[#0f1f17] dark:hover:bg-[#13271d] border-2 border-emerald-200/80 dark:border-emerald-800/40 hover:border-emerald-400 dark:hover:border-emerald-600 shadow-sm hover:shadow-xl transition-all duration-300 group hover:-translate-y-1">
              <div className="w-12 h-12 rounded-2xl bg-[#0a4d2c] text-white flex items-center justify-center font-black shadow-md group-hover:scale-110 transition-transform">
                <Lock className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white mt-5">
                4-Digit OTP Secure Handshake
              </h3>
              <p className="text-xs font-bold text-[#0a4d2c] dark:text-emerald-400 mt-1">
                Tamper-Proof Digital Verification
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-3 leading-relaxed">
                Confirm collection exclusively with a one-time 4-digit code. Eliminates disputes, tracks weight, and issues digital ₹50 user fee receipts.
              </p>
            </div>

            {/* Pillar 6: Material Recovery Facility */}
            <div className="p-7 rounded-3xl bg-emerald-50/40 hover:bg-emerald-50/80 dark:bg-[#0f1f17] dark:hover:bg-[#13271d] border-2 border-emerald-200/80 dark:border-emerald-800/40 hover:border-emerald-400 dark:hover:border-emerald-600 shadow-sm hover:shadow-xl transition-all duration-300 group hover:-translate-y-1">
              <div className="w-12 h-12 rounded-2xl bg-[#0a4d2c] text-white flex items-center justify-center font-black shadow-md group-hover:scale-110 transition-transform">
                <Recycle className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white mt-5">
                Material Collection Facility (MCF)
              </h3>
              <p className="text-xs font-bold text-[#0a4d2c] dark:text-emerald-400 mt-1">
                Complete Circular Economy Tracking
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-3 leading-relaxed">
                Collected plastics are baled at Panchayat Material Collection Facilities and dispatched to certified recyclers for zero-landfill diversion.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* ========================================================
          6. INTERACTIVE END-TO-END WORKFLOW PIPELINE (DARK THEME)
          ======================================================== */}
      <section id="how-it-works" className="py-24 bg-gradient-to-b from-[#0a0f14] via-[#09150e] to-[#0a0f14] text-white relative overflow-hidden">
        {/* Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[350px] bg-emerald-500/15 blur-[140px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">

            <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
              From Household Doorstep to Recycler<br />
              <span className="text-emerald-400">One Continuous Digital Lifecycle</span>
            </h2>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              Synchronizing citizens, Haritha Karma Sena field volunteers, and local body administration into one transparent system.
            </p>
          </div>

          {/* Workflow Interactive Timeline */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
              {workflowSteps.map((step, idx) => {
                const isActive = activeWorkflowStep === idx;
                return (
                  <button
                    key={idx}
                    onClick={() => setActiveWorkflowStep(idx)}
                    className={`text-left p-4 rounded-2xl border transition-all cursor-pointer relative ${isActive
                      ? 'bg-emerald-950/80 border-emerald-400 shadow-xl shadow-emerald-500/20 scale-102'
                      : 'bg-white/5 border-white/10 hover:border-white/30 hover:bg-white/10'
                      }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-[10px] font-mono font-black ${isActive ? 'text-emerald-300' : 'text-slate-400'}`}>
                        {step.num}
                      </span>
                      {idx < 6 && (
                        <ArrowRight className="w-3.5 h-3.5 text-slate-600 hidden md:block" />
                      )}
                    </div>
                    <div className="text-xs font-black text-white tracking-tight">{step.title}</div>
                    <div className="text-[10px] text-emerald-300 font-bold truncate mt-0.5">{step.tag}</div>
                  </button>
                );
              })}
            </div>

            {/* Active Workflow Focus Box */}
            <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#121b16] via-[#16291e] to-[#0f1f17] border-2 border-emerald-500/40 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="space-y-2.5">
                <div className="inline-flex items-center gap-2 text-xs font-mono text-emerald-400 font-bold">
                  <span>STEP {workflowSteps[activeWorkflowStep].num}</span>
                  <span>•</span>
                  <span>{workflowSteps[activeWorkflowStep].tag}</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-black text-white">
                  {workflowSteps[activeWorkflowStep].title}
                </h3>
                <p className="text-sm text-slate-200 max-w-2xl leading-relaxed">
                  {workflowSteps[activeWorkflowStep].desc}
                </p>
              </div>
              <button
                onClick={() => navigate('/login')}
                className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs uppercase tracking-wider shrink-0 transition-all flex items-center gap-2 cursor-pointer shadow-lg"
              >
                <span>Experience In Portal</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

          </div>

        </div>
      </section>

      {/* ========================================================
          7. RESIDENT EXPERIENCE (HORIZONTAL COLORFUL TIMELINE)
          ======================================================== */}
      <section id="for-citizens" className="py-24 bg-slate-50 dark:bg-[#0c0e12] border-b border-emerald-100 dark:border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">

            <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-950 dark:text-white">
              Household Recyclable Collection,<br />
              <span className="text-emerald-700 dark:text-emerald-400">Without Confusion or Uncertainty</span>
            </h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
              No more hoarding plastic without knowing pickup dates. Track your ward's Haritha Karma Sena vehicle and keep dry plastics ready at the gate.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
            {citizenJourney.map((card, idx) => {
              const isSelected = activeCitizenStep === idx;
              return (
                <div
                  key={idx}
                  onClick={() => setActiveCitizenStep(idx)}
                  className={`p-5 rounded-3xl border-2 transition-all cursor-pointer flex flex-col justify-between ${isSelected
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 shadow-xl scale-103'
                    : 'bg-white dark:bg-[#15181f] border-slate-200 dark:border-white/10 hover:border-emerald-400'
                    }`}
                >
                  <div>
                    <span className="text-xs font-mono font-black text-emerald-700 dark:text-emerald-400">
                      STEP {card.step}
                    </span>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white mt-2">
                      {card.title}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mt-2.5">
                      {card.desc}
                    </p>
                  </div>
                  <div className="mt-4 pt-2 border-t border-slate-100 dark:border-white/10">
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                      {card.badge}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Registration CTA */}
          <div className="mt-12 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#0a4d2c] via-[#0f5c36] to-emerald-800 text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6 border-2 border-emerald-400/40">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md text-emerald-200 flex items-center justify-center shrink-0 shadow-md">
                <Smartphone className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-white">
                  Register Your Household in Under 60 Seconds
                </h3>
                <p className="text-xs sm:text-sm text-emerald-100 mt-0.5">
                  Select your Grama Panchayat, Ward Number, and start receiving verified collection notices.
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/signup')}
              className="px-7 py-3.5 rounded-xl bg-white hover:bg-emerald-50 text-[#0a4d2c] font-black text-xs uppercase tracking-wider shadow-lg shrink-0 cursor-pointer transition-all flex items-center gap-2"
            >
              <span>Register Household</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </div>
      </section>

      {/* ========================================================
          8. HARITHA KARMA SENA FIELD TECHNOLOGY SECTION
          ======================================================== */}
      <section id="for-workers" className="py-24 bg-[#0a0d12] text-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

          <div className="max-w-3xl mb-16 space-y-3">
            
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
              Technology Designed for Field Force Volunteers
            </h2>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-normal">
              Built in direct consultation with Haritha Karma Sena workers. Provides sunlight legibility, intuitive map navigation, real-time GPS broadcasting, and transparent monthly recordkeeping.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">

            {/* Left: Haritha Karma Sena Worker Image + Field Terminal Overlay (7 cols) */}
            <div className="lg:col-span-7 relative">
              <div className="relative rounded-3xl overflow-hidden border-2 border-emerald-500/40 shadow-2xl">
                <img
                  src={harithaWorkersImg}
                  alt="Haritha Karma Sena Team"
                  className="w-full h-[420px] sm:h-[480px] object-cover filter brightness-95"
                />

                {/* Field Mode Terminal HUD Overlay */}
                <div className="absolute inset-4 sm:inset-6 flex flex-col justify-between pointer-events-none">

                  {/* Top HUD Bar */}
                  

                  {/* Bottom Active Target Dispatch Card */}
                  

                </div>
              </div>
            </div>

            {/* Right: Worker Capabilities Checklist (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              {[
                { title: 'Live GPS Check-in', desc: 'Automatic ward boundary detection confirms authorized geofence presence.' },
                { title: 'Smart Route Navigation', desc: 'Sequenced collection maps eliminate skip errors and zigzag walking.' },
                { title: 'OTP Handshake Verification', desc: 'Enter 4-digit code to immediately complete handovers without paperwork.' },
                { title: 'Direct Calling & Support', desc: '1-click phone dialer for gate access or special bulky plastic pickups.' }
              ].map((feat, idx) => (
                <div
                  key={idx}
                  className="p-4.5 rounded-2xl bg-white/5 border border-white/10 hover:border-emerald-500/50 transition-colors flex items-start gap-4"
                >
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white">{feat.title}</h3>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">{feat.desc}</p>
                  </div>
                </div>
              ))}
            </div>

          </div>

        </div>
      </section>


      {/* ========================================================
          10. FINAL DRAMATIC CTA SECTION
          ======================================================== */}
      <section className="py-24 bg-gradient-to-br from-[#052b17] via-[#0a4d2c] to-[#04331d] text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.3),transparent_65%)] pointer-events-none" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-60 bg-emerald-400/20 blur-[130px] pointer-events-none" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 space-y-7">

         

          <h2 className="text-3xl sm:text-6xl font-black tracking-tight text-white leading-tight">
            Building a Cleaner Kerala,<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-teal-200 to-emerald-400">
              One Smart Collection at a Time.
            </span>
          </h2>

          <p className="max-w-2xl mx-auto text-sm sm:text-base text-emerald-100 leading-relaxed font-medium">
            EcoMind AI connects households, Kudumbashree collection workers, and Panchayat administration into one synchronized circular platform.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-3">
            <button
              onClick={() => navigate('/signup')}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-white font-black text-xs uppercase tracking-wider shadow-xl shadow-emerald-950/50 hover:shadow-emerald-500/30 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Register Household Free</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => navigate('/login')}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-black text-xs uppercase tracking-wider border border-emerald-400/30 backdrop-blur-md transition-all cursor-pointer"
            >
              Sign In to Dashboard
            </button>
          </div>

        </div>
      </section>

      {/* ========================================================
          11. PROFESSIONAL HARITHAMITHRAM FOOTER
          ======================================================== */}
      <footer className="w-full bg-[#041a0f] text-slate-300 text-xs py-14 px-4 sm:px-6 lg:px-8 border-t-2 border-emerald-500/40">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-5 gap-10 mb-12">

          {/* Col 1 & 2: Branding & Mission Statement */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <img src={ecomindlogo} alt="EcoMind AI Logo" className="w-9 h-9 object-contain" />
              <span className="text-lg font-black text-white tracking-tight">EcoMind AI</span>
            </div>
            <p className="text-xs text-slate-300 max-w-sm leading-relaxed">
              AI-Powered Door-to-Door Recyclable Waste Management & Verification System for Kerala. Developed in coordination with Local Self Government Department, Suchitwa Mission, and Kudumbashree Haritha Karma Sena.
            </p>

            {/* Institutional Logos Row */}
            <div className="flex items-center gap-4 pt-2">
              <img
                src={keralaGovImg}
                alt="Government of Kerala"
                className="h-9 w-auto object-contain filter brightness-95"
                title="Government of Kerala"
              />
              <img
                src={harithaKarmaSenaImg}
                alt="Haritha Karma Sena"
                className="h-8 w-auto rounded object-contain filter brightness-95"
                title="Haritha Karma Sena"
              />
              <img
                src={suchitwaMissionImg}
                alt="Suchitwa Mission"
                className="h-8 w-auto rounded object-contain filter brightness-95"
                title="Suchitwa Mission"
              />
            </div>
          </div>

          {/* Col 3: Navigation Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-black text-emerald-400 uppercase tracking-wider">Platform</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button onClick={() => scrollToSection('features')} className="hover:text-emerald-300 cursor-pointer">
                  Features
                </button>
              </li>
              <li>
                <button onClick={() => scrollToSection('how-it-works')} className="hover:text-emerald-300 cursor-pointer">
                  How It Works
                </button>
              </li>
              <li>
                <button onClick={() => scrollToSection('for-citizens')} className="hover:text-emerald-300 cursor-pointer">
                  For Citizens
                </button>
              </li>
              <li>
                <button onClick={() => scrollToSection('for-workers')} className="hover:text-emerald-300 cursor-pointer">
                  HKS Workers
                </button>
              </li>
            </ul>
          </div>

          {/* Col 4: Quick Portals */}
          <div className="space-y-3">
            <h4 className="text-xs font-black text-emerald-400 uppercase tracking-wider">Portal Access</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button onClick={() => navigate('/login')} className="hover:text-emerald-300 cursor-pointer">
                  Citizen Portal Login
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/login')} className="hover:text-emerald-300 cursor-pointer">
                  HKS Worker Login
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/login')} className="hover:text-emerald-300 cursor-pointer">
                  Admin & LSGD Login
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/signup')} className="hover:text-emerald-300 cursor-pointer">
                  New Household Registration
                </button>
              </li>
            </ul>
          </div>

          {/* Col 5: Governance */}
          <div className="space-y-3">
            <h4 className="text-xs font-black text-emerald-400 uppercase tracking-wider">Governance</h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Local Self Government Department (LSGD), Govt. of Kerala.
            </p>
            <div className="flex items-center gap-3 text-xs pt-1 text-emerald-300">
              <button
                onClick={() => setModalState(prev => ({ ...prev, privacy: true }))}
                className="hover:underline cursor-pointer"
              >
                Privacy Policy
              </button>
              <span>•</span>
              <button
                onClick={() => setModalState(prev => ({ ...prev, terms: true }))}
                className="hover:underline cursor-pointer"
              >
                Terms of Service
              </button>
            </div>
          </div>

        </div>

        {/* Bottom Copyright */}
        <div className="max-w-7xl mx-auto pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-emerald-200/80">
          <div>
            © 2026 EcoMind AI . Developed in Assistance with Haritha Karma Sena & Kudumbashree Mission.
          </div>
          <div className="flex items-center gap-3 text-emerald-300 font-semibold">
            <span>Clean Kerala Movement</span>
            <span>•</span>
            <span>Zero Waste Circular Economy</span>
          </div>
        </div>
      </footer>

      {/* Institutional Legal Modals */}
      <TermsModal
        isOpen={modalState.terms}
        onClose={() => setModalState(prev => ({ ...prev, terms: false }))}
      />
      <PrivacyModal
        isOpen={modalState.privacy}
        onClose={() => setModalState(prev => ({ ...prev, privacy: false }))}
      />

    </div>
  );
};

export default LandingPage;
