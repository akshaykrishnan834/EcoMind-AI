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
  Leaf
} from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';
import wokersimg from "../assets/images/harithakarmasena2.jpg";
import wokersimg2 from "../assets/images/harithakarmasena3jpg.png";
import harithaKarmaSenaImg from "../assets/images/harithaKarma-sena.jpg";
import suchitwaMissionImg from "../assets/images/img22.jpg";
import keralaGovImg from "../assets/images/Government-of-kerala.png";
import ecomindlogo from "../assets/images/logo-ecomind.png";
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
    return 'Akshay Krishnan';
  }, [storedUserName, userObj]);

  const userInitial = useMemo(() => {
    const trimmed = (effectiveUserName || '').trim();
    return trimmed ? trimmed[0].toUpperCase() : 'A';
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
    sessionStorage.clear();
    setIsLoggedIn(false);
    setUserDropdownOpen(false);
    navigate('/', { replace: true });
  };

  const handleProfileClick = () => {
    setUserDropdownOpen(false);
    if (userRole === 'worker') navigate('/worker');
    else if (userRole === 'admin') navigate('/admin');
    else navigate('/citizen');
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
  const [activeWorkflowStep, setActiveWorkflowStep] = useState(1);
  const [activeCitizenStep, setActiveCitizenStep] = useState(0);

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


  // Workflow Pipeline Steps
  const workflowSteps = [
    {
      num: '01',
      title: 'Citizen',
      tag: 'Household Segregation',
      desc: 'Citizen prepares clean dry recyclables, checks schedule or books an on-demand pickup via portal.'
    },
    {
      num: '02',
      title: 'AI Waste Analysis',
      tag: 'Computer Vision',
      desc: 'Edge vision model analyzes waste imagery, categorizes polymers, and provides segregation guidance.'
    },
    {
      num: '03',
      title: 'Pickup Request',
      tag: 'Ward Allocation',
      desc: 'Automated clustering aggregates requests by Ward and Street, generating a 4-digit verification token.'
    },
    {
      num: '04',
      title: 'Smart Route',
      tag: 'Dynamic TSP Path',
      desc: 'Intelligent engine computes the optimal collection sequence minimizing travel distance and steep inclines.'
    },
    {
      num: '05',
      title: 'HKS Worker',
      tag: 'Field App Dispatch',
      desc: 'Haritha Karma Sena workers receive turn-by-turn guidance and localized citizen handover notes.'
    },
    {
      num: '06',
      title: 'Verified Collection',
      tag: 'Cryptographic Handshake',
      desc: 'Collection confirmed exclusively with citizen 4-digit OTP. Weight logged digitally on spot.'
    },
    {
      num: '07',
      title: 'Recycling / Recovery',
      tag: 'Material Recovery Facility',
      desc: 'Clean sorted bales dispatched to authorized recyclers. Zero landfill, complete circular traceability.'
    }
  ];

  // Citizen Journey Steps
  const citizenJourney = [
    {
      step: '01',
      title: 'Request Pickup',
      desc: 'Schedule in seconds via the citizen portal or converse with AI Assistant Mittu.'
    },
    {
      step: '02',
      title: 'View Schedule',
      desc: 'Synced with Ward 12 Haritha Karma Sena monthly collection calendar.'
    },
    {
      step: '03',
      title: 'Track Collection',
      desc: 'Live proximity updates when collection workers enter your residential lane.'
    },
    {
      step: '04',
      title: 'Chat with Worker',
      desc: 'Direct communication channel for gate access, special items, or delays.'
    },
    {
      step: '05',
      title: 'Verify Collection',
      desc: 'Safe one-time 4-digit authorization ensures no unauthorized claims.'
    },
    {
      step: '06',
      title: 'View History',
      desc: 'Instant digital receipts, weight statistics, and transparent user-fee records.'
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
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0c0e12] text-slate-900 dark:text-slate-100 font-sans selection:bg-emerald-500/20 selection:text-emerald-700 dark:selection:text-emerald-300 transition-colors duration-200 overflow-x-hidden antialiased">

      {/* ========================================================
          1. HEADER (FLOATING / STICKY GLASS NAVIGATION)
          ======================================================== */}
      <header className={`sticky top-0 z-50 w-full transition-all duration-300 ${scrolled
        ? 'bg-white/80 dark:bg-[#0c0e12]/85 backdrop-blur-xl border-b border-slate-200/80 dark:border-white/10 shadow-xs'
        : 'bg-transparent border-b border-transparent'
        }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">

          {/* Left: Brand Identity */}
          <a href="#" className="flex items-center gap-3 group focus:outline-hidden">
            <div className="relative">
              <div className="absolute -inset-1 rounded-xl bg-emerald-500/20 blur-xs group-hover:bg-emerald-500/40 transition-colors" />
              <img
                src={ecomindlogo}
                alt="EcoMind AI Logo"
                className="relative w-10 h-10 object-contain drop-shadow-xs"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-black tracking-tight text-slate-950 dark:text-white flex items-center gap-1.5">
                EcoMind AI

              </span>
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 tracking-tight">
                Smart Recyclable Waste System
              </span>
            </div>
          </a>

          {/* Center: Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-7 text-xs font-semibold text-slate-600 dark:text-slate-300">
            <button
              onClick={() => scrollToSection('features')}
              className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer"
            >
              Features
            </button>
            <button
              onClick={() => scrollToSection('how-it-works')}
              className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer"
            >
              How It Works
            </button>
            <button
              onClick={() => scrollToSection('for-citizens')}
              className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer"
            >
              For Citizens
            </button>
            <button
              onClick={() => scrollToSection('for-workers')}
              className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer"
            >
              For Workers
            </button>
            <button
              onClick={() => scrollToSection('impact')}
              className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer"
            >
              Mission
            </button>
          </nav>

          {/* Right: Actions */}
          <div className="hidden sm:flex items-center gap-3">
            <ThemeToggle />
            {isLoggedIn ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  type="button"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-xl bg-slate-100/90 dark:bg-[#181b20] hover:bg-emerald-50/60 dark:hover:bg-[#22272e] border border-slate-200/80 dark:border-white/10 hover:border-emerald-500/40 dark:hover:border-emerald-500/40 shadow-2xs hover:shadow-xs transition-all duration-200 cursor-pointer group"
                  title="User menu"
                  aria-expanded={userDropdownOpen}
                >
                  <div className="relative shrink-0">
                    <div className="w-8 h-8 rounded-full bg-[#0a4d2c] text-white flex items-center justify-center font-bold text-xs shadow-xs group-hover:scale-105 transition-transform">
                      {userInitial}
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-[#65a30d] text-white flex items-center justify-center border-[1.5px] border-white dark:border-[#181b20] shadow-xs">
                      <Leaf className="w-1.5 h-1.5 fill-current text-white" />
                    </div>
                  </div>
                  <div className="flex items-center text-left min-w-0 max-w-[130px] md:max-w-[170px]">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                      Hi, {effectiveUserName}
                    </span>
                  </div>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-transform duration-200 ${
                    userDropdownOpen ? 'rotate-180 text-emerald-600 dark:text-emerald-400' : ''
                  }`} />
                </button>

                {/* User Dropdown Menu */}
                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2.5 w-64 rounded-2xl bg-white dark:bg-[#181b22] border border-slate-200/90 dark:border-white/10 shadow-xl shadow-slate-200/40 dark:shadow-black/70 p-2 z-50 animate-fadeIn">
                    <div className="p-3 rounded-xl bg-slate-50/90 dark:bg-[#121418] border border-slate-100 dark:border-white/5 mb-1.5 flex items-center gap-3">
                      <div className="relative shrink-0">
                        <div className="w-10 h-10 rounded-full bg-[#0a4d2c] text-white flex items-center justify-center font-bold text-sm shadow-xs">
                          {userInitial}
                        </div>
                        <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-[#65a30d] text-white flex items-center justify-center border-2 border-white dark:border-[#121418] shadow-xs">
                          <Leaf className="w-2 h-2 fill-current text-white" />
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {effectiveUserName}
                        </p>
                        <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium truncate">
                          {roleLabel}
                        </p>
                        {userObj.email && (
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                            {userObj.email}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="h-px bg-slate-100 dark:bg-white/5 my-1" />


                    {/* 2. Log Out Option (Under Profile) */}
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer group mt-0.5"
                    >
                      <div className="w-7 h-7 rounded-lg bg-rose-500/10 dark:bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 group-hover:bg-rose-600 group-hover:text-white transition-colors">
                        <LogOut className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="block leading-tight font-bold">Log Out</span>
                        <span className="text-[10px] text-rose-400/80 dark:text-rose-400/70 font-normal">Sign out of session</span>
                      </div>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <button
                  onClick={() => navigate('/login')}
                  className="px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer"
                >
                  Sign In
                </button>
                <button
                  onClick={() => navigate('/signup')}
                  className="px-4.5 py-2 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs hover:shadow-emerald-600/20 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <span>Join / Register</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>

          {/* Mobile Hamburger Toggle */}
          <div className="flex sm:hidden items-center gap-2">
            <ThemeToggle />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="sm:hidden border-b border-slate-200 dark:border-white/10 bg-white dark:bg-[#121417] px-6 py-5 space-y-4 shadow-xl">
            <nav className="flex flex-col space-y-3 text-sm font-semibold text-slate-700 dark:text-slate-200">
              <button
                onClick={() => scrollToSection('features')}
                className="text-left py-1 hover:text-emerald-600"
              >
                Features
              </button>
              <button
                onClick={() => scrollToSection('how-it-works')}
                className="text-left py-1 hover:text-emerald-600"
              >
                How It Works
              </button>
              <button
                onClick={() => scrollToSection('for-citizens')}
                className="text-left py-1 hover:text-emerald-600"
              >
                For Citizens
              </button>
              <button
                onClick={() => scrollToSection('for-workers')}
                className="text-left py-1 hover:text-emerald-600"
              >
                For Workers
              </button>
              <button
                onClick={() => scrollToSection('impact')}
                className="text-left py-1 hover:text-emerald-600"
              >
                Mission
              </button>
            </nav>
            <div className="pt-4 border-t border-slate-100 dark:border-white/10 flex flex-col gap-2.5">
              {isLoggedIn ? (
                <>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 flex items-center gap-3">
                    <div className="relative shrink-0">
                      <div className="w-9 h-9 rounded-full bg-[#0a4d2c] text-white flex items-center justify-center font-bold text-sm shadow-xs">
                        {userInitial}
                      </div>
                      <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-[#65a30d] text-white flex items-center justify-center border-2 border-white dark:border-[#181b20] shadow-xs">
                        <Leaf className="w-2 h-2 fill-current text-white" />
                      </div>
                    </div>
                    <div className="min-w-0 flex-1 text-left">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {effectiveUserName}
                      </p>
                      <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                        {roleLabel}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => { setMobileMenuOpen(false); handleLogout(); }}
                    className="w-full py-2.5 text-center text-sm font-bold rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 border border-rose-200 dark:border-rose-900/40 flex items-center justify-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Log Out</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => { setMobileMenuOpen(false); navigate('/login'); }}
                    className="w-full py-2.5 text-center text-sm font-bold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-white/10 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => { setMobileMenuOpen(false); navigate('/signup'); }}
                    className="w-full py-2.5 text-center text-sm font-bold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs"
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
          2. HERO SECTION & HERO VISUAL
          ======================================================== */}
      <section className="relative pt-12 pb-20 md:pt-20 md:pb-32 overflow-hidden">
        {/* Ambient Radial Background Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-emerald-500/10 dark:bg-emerald-500/15 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute top-10 right-0 w-[450px] h-[350px] bg-teal-500/5 dark:bg-teal-500/10 blur-[100px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">

            {/* Left Column: Hero Typography & CTAs (7 cols) */}
            <div className="lg:col-span-7 space-y-8 text-center lg:text-left">

              {/* Institutional Badges Pill */}
              <div className="inline-flex flex-wrap items-center justify-center lg:justify-start gap-2 px-3 py-1.5 rounded-full bg-slate-100/90 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 text-[11px] font-semibold text-slate-700 dark:text-slate-300 shadow-xs backdrop-blur-md">
                <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                <span className="text-emerald-700 dark:text-emerald-400 font-bold">Haritha Karma Sena Integrated</span>
                <span className="text-slate-400 dark:text-slate-600">•</span>
                <span>LSGD Integrated</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-950 dark:text-white leading-[1.08]">
                AI-Powered Smart<br />
                Recyclable Waste<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 dark:from-emerald-400 dark:via-emerald-300 dark:to-teal-400">
                  Management
                </span>
              </h1>

              {/* Supporting Subtitle */}
              <p className="max-w-2xl mx-auto lg:mx-0 text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
                Connecting citizens, Haritha Karma Sena workers and intelligent waste collection through AI, smart scheduling and real-time field technology.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 pt-2">

                <button
                  onClick={() => scrollToSection('features')}
                  className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-white dark:bg-[#181b20] hover:bg-slate-50 dark:hover:bg-[#20252c] text-slate-800 dark:text-slate-200 font-bold text-sm border border-slate-200 dark:border-white/10 shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4 text-emerald-500" />
                  <span>Explore EcoMind AI</span>
                </button>
              </div>

              {/* Trust Indicators */}
              <div className="pt-6 border-t border-slate-200/80 dark:border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-4 text-left">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-slate-100">AI Waste</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">Classification</div>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-slate-100">Smart Pickup</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">Scheduling</div>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-slate-100">Verified</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">Collection</div>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-slate-100">Real-Time</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">Monitoring</div>
                  </div>
                </div>
              </div>

            </div>

            {/* Right Column: Hero Visual with Floating Glass Cards (5 cols) */}
            <div className="lg:col-span-5 relative flex justify-center items-center">

              {/* Soft Environmental Radial Aura behind Image */}
              <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/20 via-teal-500/10 to-transparent blur-2xl rounded-3xl" />

              {/* Main Recycling Visual */}
              <div className="relative w-full max-w-md sm:max-w-lg rounded-3xl overflow-hidden border border-slate-200/80 dark:border-white/15 bg-white dark:bg-slate-900 shadow-2xl">
                <img
                  src={wokersimg2}
                  alt="EcoMind Smart Recyclable Waste Management"
                  className="w-full aspect-square object-cover object-center"
                />
              </div>

            </div>

          </div>
        </div>
      </section>

      {/* ========================================================
          3. SECTION 2 — THE PROBLEM (CINEMATIC STORYTELLING)
          ======================================================== */}
      <section id="features" className="py-24 bg-slate-100/70 dark:bg-[#101216] border-y border-slate-200/80 dark:border-white/5 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="max-w-3xl mb-16">
            <span className="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              The Operational Reality
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-950 dark:text-white mt-3 mb-6">
              Waste collection should be smarter.
            </h2>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
              Recyclable door-to-door collection across Kerala's Panchayats relies heavily on manual coordination. Without intelligent tooling, small inefficiencies multiply into missed collections, logistical friction, and unsegregated plastic piles.
            </p>
          </div>

          {/* Cinematic Telemetry Comparison Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">

            {/* Left: Traditional Pain Points (Large Typography List) */}
            <div className="lg:col-span-6 space-y-4">
              {[
                { title: 'Unscheduled Collection', desc: 'Households unsure when Haritha Karma Sena will arrive, leading to missed handovers.' },
                { title: 'Unclear Pickup Requests', desc: 'Workers arrive without prior knowledge of waste volume, polymer type, or condition.' },
                { title: 'Manual Route Planning', desc: 'Navigating hilly wards on memory leads to zig-zag transit and excessive physical exhaustion.' },
                { title: 'Poor Operational Visibility', desc: 'Panchayat officials lack real-time data on daily collection percentages and ward coverage.' },
                { title: 'Collection Verification Disputes', desc: 'Disagreements over monthly user fees and whether collection actually took place.' },
                { title: 'Limited Real-Time Information', desc: 'No channel for field workers to alert citizens when routes run ahead of or behind schedule.' }
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="p-5 rounded-xl bg-white dark:bg-[#181b20] border border-slate-200/80 dark:border-white/5 hover:border-emerald-500/40 transition-colors flex items-start gap-4 group"
                >
                  <span className="text-xs font-mono font-bold text-slate-400 dark:text-slate-500 group-hover:text-emerald-500 transition-colors mt-0.5">
                    0{idx + 1}
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Right: The Solution Transformation Panel */}
            <div className="lg:col-span-6 rounded-2xl bg-gradient-to-br from-slate-900 via-[#101915] to-[#09150f] border border-emerald-500/20 text-white p-8 flex flex-col justify-between shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 blur-3xl pointer-events-none" />

              <div className="relative z-10 space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
                  <Activity className="w-3.5 h-3.5 text-emerald-400" />
                  EcoMind AI Transformation
                </div>

                <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-white leading-snug">
                  From fragmented manual routines to one continuous AI data pipeline.
                </h3>

                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  EcoMind AI removes the guesswork. Households know the exact arrival window, workers follow algorithmically optimized ward sequences, and every collection is verified with a tamper-proof digital handshake.
                </p>
              </div>

              {/* Real-time telemetry indicators */}
              <div className="relative z-10 grid grid-cols-2 gap-4 pt-8 mt-8 border-t border-white/10">
                <div className="p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xs">
                  <div className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider">Route Efficiency</div>
                  <div className="text-xl sm:text-2xl font-black text-white mt-1">Zero Blind Runs</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Automated cluster stops</div>
                </div>
                <div className="p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xs">
                  <div className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider">Accountability</div>
                  <div className="text-xl sm:text-2xl font-black text-white mt-1">100% Digitized</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">4-digit OTP audit trail</div>
                </div>
              </div>

            </div>

          </div>

        </div>
      </section>

      {/* ========================================================
          4. SECTION 3 — ECO MIND SOLUTION (DARK WORKFLOW PIPELINE)
          ======================================================== */}
      <section id="how-it-works" className="py-24 bg-[#0a0d12] text-white relative overflow-hidden">
        {/* Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[300px] bg-emerald-500/10 blur-[130px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-emerald-400">
              End-to-End Coordination
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white mt-3 mb-5">
              One intelligent system.<br />
              <span className="text-slate-400">From household to collection.</span>
            </h2>
            <p className="text-sm sm:text-base text-slate-400 leading-relaxed font-normal">
              A synchronized digital lifecycle linking citizens, automated computer vision segregation, dynamic field routing, and authorized recycling recovery facilities.
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
                    className={`text-left p-4 rounded-xl border transition-all cursor-pointer relative ${isActive
                      ? 'bg-emerald-950/40 border-emerald-500/60 shadow-lg shadow-emerald-500/10'
                      : 'bg-white/5 border-white/5 hover:border-white/20 hover:bg-white/10'
                      }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-[10px] font-mono font-bold ${isActive ? 'text-emerald-400' : 'text-slate-500'}`}>
                        {step.num}
                      </span>
                      {idx < 6 && (
                        <ArrowRight className="w-3 h-3 text-slate-600 hidden md:block" />
                      )}
                    </div>
                    <div className="text-xs font-bold text-white tracking-tight">{step.title}</div>
                    <div className="text-[10px] text-emerald-400/80 font-medium truncate mt-0.5">{step.tag}</div>
                  </button>
                );
              })}
            </div>

            {/* Active Workflow Focus Box */}
            <div className="p-6 sm:p-8 rounded-2xl bg-[#12161f] border border-white/10 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 text-xs font-mono text-emerald-400">
                  <span>STEP {workflowSteps[activeWorkflowStep].num}</span>
                  <span>•</span>
                  <span>{workflowSteps[activeWorkflowStep].tag}</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-white">
                  {workflowSteps[activeWorkflowStep].title}
                </h3>
                <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
                  {workflowSteps[activeWorkflowStep].desc}
                </p>
              </div>
              <button
                onClick={() => navigate('/login')}
                className="px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs tracking-wide shrink-0 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <span>Experience In Portal</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>

        </div>
      </section>



      {/* ========================================================
          7. SECTION 6 — FOR HARITHA KARMA SENA (FIELD TECHNOLOGY)
          ======================================================== */}
      <section id="for-workers" className="py-24 bg-[#0a0d12] text-white relative overflow-hidden">
        {/* Ambient Glow */}
        <div className="absolute bottom-0 right-0 w-[500px] h-[400px] bg-emerald-600/10 blur-[130px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

          <div className="max-w-3xl mb-16">
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-emerald-400">
              Dignity Through Technology
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white mt-3 mb-5">
              Technology that works in the field.
            </h2>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-normal">
              Built in direct consultation with Haritha Karma Sena volunteers. Designed for Malayalam-first mobile clarity, bright sunlight legibility, and zero-confusion collection handovers.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">

            {/* Left: Haritha Karma Sena Worker Image + Field Terminal Overlay (7 cols) */}
            <div className="lg:col-span-7 relative">
              <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
                <img
                  src={wokersimg}
                  alt="Haritha Karma Sena Team"
                  className="w-full h-[400px] sm:h-[460px] object-cover filter brightness-90"
                />

                {/* Field Mode Terminal HUD Overlay */}
                <div className="absolute inset-4 sm:inset-6 flex flex-col justify-between pointer-events-none">

                  {/* Top HUD Bar */}
                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/85 backdrop-blur-md border border-white/15 text-white pointer-events-auto">
                    <div className="flex items-center gap-2.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-xs font-bold font-mono">FIELD MODE: ACTIVE</span>
                    </div>
                    <span className="text-xs font-bold text-emerald-400">
                      18 / 25 Houses Completed
                    </span>
                  </div>

                  {/* Bottom Active Target Dispatch Card */}
                  <div className="p-4 sm:p-5 rounded-xl bg-slate-950/90 backdrop-blur-md border border-emerald-500/40 text-white space-y-3 pointer-events-auto shadow-2xl">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold">
                        Next Pickup • Queue #19
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        Status: On Route
                      </span>
                    </div>

                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-sm sm:text-base font-black text-white">
                          House #19 — K. Raman Nair
                        </h3>
                        <p className="text-xs text-slate-300 mt-0.5">
                          Ward 12, Chirakkadavu • 2 Bags Clean Plastic • ₹50 Monthly Fee Paid
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-xs font-mono font-bold text-emerald-400">ETA 3 Mins</div>
                        <div className="text-[10px] text-slate-400">Distance: 140m</div>
                      </div>
                    </div>

                    {/* 4-digit code simulated verification input */}
                    <div className="pt-2 border-t border-white/10 flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2">
                        <Lock className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-slate-300 text-[11px]">Enter Citizen Code:</span>
                        <span className="font-mono font-bold tracking-widest bg-white/10 px-2 py-0.5 rounded text-white border border-white/20">
                          ••••
                        </span>
                      </div>
                      <button
                        onClick={() => navigate('/login')}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] cursor-pointer"
                      >
                        Verify Handover
                      </button>
                    </div>

                  </div>

                </div>
              </div>
            </div>

            {/* Right: Worker Capabilities Checklist (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              {[

                { title: 'Live GPS Check-in', desc: 'Automatic boundary detection updates completion status as pushcarts arrive.' },
                { title: 'Sequential Collection', desc: 'No skip errors. Transparent checklist ensures every registered home is reached.' },
                { title: 'Instant Pickup Verification', desc: '4-digit token closes collection record and issues digital receipt immediately.' },
                { title: 'Direct Citizen Communication', desc: 'Quick-dial or pre-translated Malayalam voice notes for gate access.' },

              ].map((feat, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-emerald-500/40 transition-colors flex items-start gap-3.5"
                >
                  <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3 h-3" />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-white">{feat.title}</h3>
                    <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{feat.desc}</p>
                  </div>
                </div>
              ))}
            </div>

          </div>

        </div>
      </section>


      {/* ========================================================
          9. SECTION 8 — CITIZEN EXPERIENCE (HORIZONTAL TIMELINE)
          ======================================================== */}
      <section id="for-citizens" className="py-24 bg-white dark:bg-[#0c0e12] border-b border-slate-200/80 dark:border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Resident Experience
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-950 dark:text-white mt-3 mb-5">
              From request to collection,<br />
              <span className="text-emerald-600 dark:text-emerald-400">without the uncertainty.</span>
            </h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
              A frictionless mobile-first journey for households. No more hoarding plastics without knowing pickup dates, and zero confusion over user fee receipts.
            </p>
          </div>

          {/* Interactive Horizontal Timeline */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
            {citizenJourney.map((card, idx) => {
              const isSelected = activeCitizenStep === idx;
              return (
                <div
                  key={idx}
                  onClick={() => setActiveCitizenStep(idx)}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${isSelected
                    ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-500 shadow-md scale-102'
                    : 'bg-slate-50/70 dark:bg-[#15181f] border-slate-200/80 dark:border-white/5 hover:border-emerald-500/40'
                    }`}
                >
                  <div>
                    <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      STEP {card.step}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-2 mb-2">
                      {card.title}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      {card.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Citizen Callout Box */}
          <div className="mt-12 p-6 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-[#112019] dark:to-[#0d1a14] border border-emerald-200 dark:border-emerald-500/20 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <Smartphone className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                  Register Your Household in Under 60 Seconds
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Select your Grama Panchayat, Ward Number, and start receiving verified collection notices.
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/signup')}
              className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs tracking-wide shadow-sm shrink-0 cursor-pointer transition-colors"
            >
              Register Household
            </button>
          </div>

        </div>
      </section>

      {/* ========================================================
          10. SECTION 9 — IMPACT (FEATURE NUMERALS — NO FAKE STATS)
          ======================================================== */}
      <section id="impact" className="py-24 bg-slate-100/70 dark:bg-[#101217] border-b border-slate-200/80 dark:border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="max-w-3xl mb-16">
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
              Core Capabilities
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-950 dark:text-white mt-3 mb-5">
              Built for real-world impact.
            </h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
              A serious, production-grade technology platform tailored to the unique socio-geographical landscape of Kerala's local self-governing bodies.
            </p>
          </div>

          {/* Minimal 01-04 Feature Numerals */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">

            <div className="space-y-3 border-l-2 border-emerald-500 pl-5">
              <span className="text-4xl sm:text-5xl font-mono font-extrabold text-slate-900 dark:text-white">
                01
              </span>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Smart Collection
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Automated ward-level cluster dispatch that calculates the most efficient traversal route, reducing manual strain for Haritha Karma Sena workers.
              </p>
            </div>

            <div className="space-y-3 border-l-2 border-emerald-500 pl-5">
              <span className="text-4xl sm:text-5xl font-mono font-extrabold text-slate-900 dark:text-white">
                02
              </span>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                AI-Assisted Classification
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Instant computer vision categorization for clean plastics, milk sachets, and paperboard, ensuring scientific segregation right at the doorstep.
              </p>
            </div>

            <div className="space-y-3 border-l-2 border-emerald-500 pl-5">
              <span className="text-4xl sm:text-5xl font-mono font-extrabold text-slate-900 dark:text-white">
                03
              </span>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Real-Time Worker Monitoring
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Live GPS breadcrumbs and field safety synchronization that keeps local Panchayat supervisors informed of route coverage without micromanagement.
              </p>
            </div>

            <div className="space-y-3 border-l-2 border-emerald-500 pl-5">
              <span className="text-4xl sm:text-5xl font-mono font-extrabold text-slate-900 dark:text-white">
                04
              </span>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Verified Pickup
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Cryptographic 4-digit code handshakes guarantee authentic collection records, eliminating disputes regarding user fee payments and missed houses.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* ========================================================
          11. SECTION 10 — FINAL DRAMATIC CTA
          ======================================================== */}
      <section className="py-24 bg-[#0a0d12] text-white relative overflow-hidden">
        {/* Cinematic Environmental Radial Glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.15),transparent_60%)] pointer-events-none" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-60 bg-emerald-500/10 blur-[140px] pointer-events-none" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 space-y-8">

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-emerald-300 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            Zero Waste Kerala Initiative
          </div>

          <h2 className="text-3xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Build a cleaner Kerala,<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-400">
              one smart collection at a time.
            </span>
          </h2>

          <p className="max-w-2xl mx-auto text-sm sm:text-base text-slate-300 leading-relaxed font-normal">
            EcoMind AI connects households, collection workers and intelligent waste management into one coordinated platform.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <button
              onClick={() => navigate('/login')}
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold text-sm tracking-wide shadow-lg shadow-emerald-600/30 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Enter EcoMind AI</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => scrollToSection('features')}
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-sm border border-white/15 backdrop-blur-md transition-all cursor-pointer"
            >
              Explore the Platform
            </button>
          </div>

          {/* Quick Role Selection Shortcut Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-8 text-left">







          </div>

        </div>
      </section>

      {/* ========================================================
          12. PROFESSIONAL MINIMAL FOOTER
          ======================================================== */}
      <footer className="w-full bg-[#080b0f] text-slate-400 text-xs py-14 px-4 sm:px-6 lg:px-8 border-t border-white/10">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-5 gap-10 mb-12">

          {/* Col 1 & 2: Branding & Mission Statement */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <img src={ecomindlogo} alt="EcoMind AI Logo" className="w-8 h-8 object-contain" />
              <span className="text-base font-black text-white tracking-tight">EcoMind AI</span>
            </div>
            <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
              AI-Powered Door-to-Door Recyclable Waste Management & Verification System for Kerala. Developed in coordination with Local Self Government Department and Haritha Karma Sena.
            </p>

            {/* Institutional Logos Row */}
            <div className="flex items-center gap-4 pt-2">
              <img
                src={keralaGovImg}
                alt="Government of Kerala"
                className="h-9 w-auto object-contain filter brightness-90 contrast-125"
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
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Platform</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button onClick={() => scrollToSection('features')} className="hover:text-emerald-400 cursor-pointer">
                  Features
                </button>
              </li>
              <li>
                <button onClick={() => scrollToSection('how-it-works')} className="hover:text-emerald-400 cursor-pointer">
                  How It Works
                </button>
              </li>
              <li>
                <button onClick={() => scrollToSection('impact')} className="hover:text-emerald-400 cursor-pointer">
                  Mission & Impact
                </button>
              </li>
            </ul>
          </div>


          {/* Col 5: Legal & Institutional Partners */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Governance</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Local Self Government Department (LSGD).
            </p>
            <div className="flex items-center gap-3 text-xs pt-1 text-emerald-400">
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
        <div className="max-w-7xl mx-auto pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <div>
            © 2026 EcoMind AI. Developed in Assistance with Haritha Karma Sena.
          </div>
          <div className="flex items-center gap-3">
            <span>Green Governance</span>
            <span>•</span>
            <span>Clean Kerala Circular Economy</span>
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
