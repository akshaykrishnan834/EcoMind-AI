import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Scan,
  MapPin,
  Leaf,
  Home
} from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';
import LoginForm from '../components/LoginForm';
import SignUpForm from '../components/SignUpForm';
import { TermsModal, PrivacyModal, ForgotPasswordModal, ToastNotification } from '../components/Modals';
import ecomindlogo from "../assets/images/logo-ecomind.png";
import harithaKarmaSenaImg from "../assets/images/harithaKarma-sena.jpg";
import keralaGovImg from "../assets/images/Government-of-kerala.png";
import wokersimg from "../assets/images/harithakarmasena-workers.jpg";
import signupimg from "../assets/images/signupimage.jpg";

export const AuthPage = ({ defaultView = 'login' }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Detect view from URL or defaultView prop
  const initialView = location.pathname === '/signup' ? 'signup' : (location.pathname === '/login' ? 'login' : defaultView);
  const [currentView, setCurrentView] = useState(initialView);

  useEffect(() => {
    if (location.pathname === '/signup') {
      setCurrentView('signup');
    } else if (location.pathname === '/login') {
      setCurrentView('login');
    }
  }, [location.pathname]);

  const [modalState, setModalState] = useState({
    terms: false,
    privacy: false,
    forgotPassword: false
  });
  const [toast, setToast] = useState(null);

  const showToast = (title, message) => {
    setToast({ title, message });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const handleLoginSubmit = (data) => {
    showToast('Login Successful!', `Welcome back to EcoMind AI (${data.email}).`);
  };

  const handleSignUpSubmit = (data) => {
    showToast('Account Created!', `Welcome ${data.fullName}! Your EcoMind AI account is now active. Please sign in to continue.`);
  };

  const handleForgotPasswordSubmit = (email) => {
    showToast('Reset Link Sent', `Password reset instructions sent to ${email}.`);
  };

  const switchToSignUp = () => {
    setCurrentView('signup');
    navigate('/signup', { replace: true });
  };

  const switchToLogin = () => {
    setCurrentView('login');
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen w-full bg-[#f8fafc] dark:bg-[#0c0e12] text-slate-900 dark:text-slate-100 font-sans selection:bg-emerald-500/20 selection:text-emerald-700 dark:selection:text-emerald-300 transition-colors duration-200 antialiased flex flex-col lg:flex-row">
      
      {/* ========================================================
          LEFT PANEL: CINEMATIC ENVIRONMENTAL BRANDING WITH OLD IMAGES (DESKTOP)
          ======================================================== */}
      <div className="relative hidden lg:flex lg:w-1/2 bg-slate-950 text-white p-12 xl:p-16 flex-col justify-between overflow-hidden border-r border-slate-200/80 dark:border-white/10 shadow-2xl">
        
        {/* Full-bleed authentic photographic background */}
        <div className="absolute inset-0 z-0">
          <img
            key={currentView}
            src={currentView === 'login' ? wokersimg : signupimg}
            alt={currentView === 'login' ? 'Haritha Karma Sena Waste Collection' : 'EcoMind Household Recycling'}
            className="w-full h-full object-cover object-center filter brightness-[0.52] contrast-[1.12] transition-all duration-700 animate-fade-in scale-102"
          />
          {/* Multi-stop gradient for clear text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/65 to-slate-950/75 pointer-events-none" />
          <div className="absolute inset-0 bg-emerald-950/20 mix-blend-multiply pointer-events-none" />
        </div>

        {/* Ambient environmental aura */}
        <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[350px] bg-emerald-500/15 blur-[120px] rounded-full pointer-events-none z-0" />

        {/* Top Header: EcoMind AI Logo */}
        <div className="relative z-10">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-3.5 group focus:outline-none text-left cursor-pointer"
          >
            <div className="relative">
              <div className="absolute -inset-1 rounded-xl bg-emerald-500/25 blur-xs group-hover:bg-emerald-500/50 transition-colors" />
              <img
                src={ecomindlogo}
                alt="EcoMind AI Logo"
                className="relative w-11 h-11 object-contain drop-shadow-xs group-hover:scale-105 transition-transform"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black tracking-tight text-white">
                EcoMind AI
              </span>
              <span className="text-[11px] font-medium text-slate-300 tracking-tight">
                Smart Recyclable Waste System
              </span>
            </div>
          </button>
        </div>

        {/* Middle Visual & Cinematic Storytelling */}
        <div className="relative z-10 my-auto py-8 space-y-6">
          
          {/* Headline & Mission Text */}
          <div className="space-y-3 max-w-lg">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-950/70 border border-white/15 text-[11px] font-semibold text-emerald-300 backdrop-blur-md shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>Haritha Karma Sena Integrated</span>
            </div>

            <h1 className="text-3xl xl:text-5xl font-extrabold tracking-tight text-white leading-[1.12]">
              {currentView === 'login' ? (
                <>
                  Building a<br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-400">
                    Cleaner, Greener
                  </span><br />
                  Kerala Together
                </>
              ) : (
                <>
                  Smarter Waste<br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-400">
                    Collection Starts Here.
                  </span>
                </>
              )}
            </h1>

            <p className="text-xs xl:text-sm text-slate-300 leading-relaxed font-normal">
              {currentView === 'login'
                ? 'EcoMind AI supports Haritha Karma Sena in making door-to-door waste collection smarter, transparent, and eco-friendly.'
                : 'Join Kerala’s verified circular economy network connecting households, collection workers, and material recovery facilities.'}
            </p>
          </div>

          {/* Prominent Old Image Showcase Frame */}
          <div className="relative rounded-2xl overflow-hidden border border-white/20 shadow-2xl max-w-md group">
            <img
              key={currentView}
              src={currentView === 'login' ? wokersimg : signupimg}
              alt={currentView === 'login' ? 'Haritha Karma Sena Field Collection Team' : 'EcoMind Household Waste Segregation'}
              className="w-full h-52 xl:h-60 object-cover object-top group-hover:scale-105 transition-transform duration-700"
            />
            {/* Bottom Caption Pill */}
            <div className="absolute bottom-3 left-3 right-3 p-2.5 rounded-xl bg-slate-950/85 backdrop-blur-md border border-white/10 text-white flex items-center justify-between shadow-lg">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[11px] font-bold">
                  {currentView === 'login' ? 'Clean & Green Kerala Mission' : 'EcoMind Smart Recycling Network'}
                </span>
              </div>
              <span className="text-[10px] text-emerald-300 font-mono">Verified HKS</span>
            </div>
          </div>

          {/* Environmental Glass Badges */}
          <div className="grid grid-cols-2 gap-3 max-w-md">
            
            {/* Card 1 */}
            <div className="p-3 rounded-xl bg-slate-950/70 border border-white/10 backdrop-blur-md shadow-md flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                <Scan className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[11px] font-bold text-white leading-tight">AI Classification</div>
                <div className="text-[10px] text-slate-400">Doorstep polymer guidance</div>
              </div>
            </div>

            {/* Card 2 */}
            <div className="p-3 rounded-xl bg-slate-950/70 border border-white/10 backdrop-blur-md shadow-md flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[11px] font-bold text-white leading-tight">Verified Handover</div>
                <div className="text-[10px] text-slate-400">4-digit token handshake</div>
              </div>
            </div>

          </div>

        </div>

        {/* Bottom Institutional Branding Accreditation */}
        <div className="relative z-10 pt-6 border-t border-white/10 flex items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-3">
            <img
              src={harithaKarmaSenaImg}
              alt="Haritha Karma Sena"
              className="h-7 w-auto rounded object-contain filter brightness-95"
            />
            <img
              src={keralaGovImg}
              alt="Government of Kerala"
              className="h-7 w-auto object-contain filter brightness-90 contrast-125"
            />
            <span className="text-[11px] text-slate-300 font-medium">LSGD Integrated • Zero Waste Kerala</span>
          </div>
          <span className="text-[10px] text-slate-500">© 2026 EcoMind AI</span>
        </div>

      </div>

      {/* ========================================================
          RIGHT PANEL: AUTHENTICATION CARD & CONTROLS
          ======================================================== */}
      <div className="flex-1 flex flex-col justify-between p-4 sm:p-6 lg:p-12 xl:p-16 min-h-screen">
        
        {/* Top Utility Bar (Home Icon & Theme Toggle) */}
        <div className="w-full max-w-md mx-auto flex items-center justify-between mb-6 sm:mb-8">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="p-2 rounded-xl text-slate-700 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 bg-gray-100/90 dark:bg-[#181b20] hover:bg-emerald-50 dark:hover:bg-[#242930] border border-gray-200/80 dark:border-white/10 hover:border-emerald-500/40 dark:hover:border-emerald-500/40 shadow-2xs hover:shadow-xs transition-all duration-200 cursor-pointer flex items-center justify-center group"
            title="Go to Home"
            aria-label="Home"
          >
            <Home className="w-4 h-4 text-slate-600 dark:text-slate-300 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 group-hover:scale-110 transition-all duration-200" />
          </button>

          {/* Minimal Symbol-Only Theme Toggle */}
          <ThemeToggle />
        </div>

        {/* Center: Authentication Card Container */}
        <div className="w-full max-w-md mx-auto my-auto">
          
          {/* Card Frame */}
          <div className="bg-white dark:bg-[#181b22] rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/50 dark:shadow-2xl dark:shadow-black/60 border border-slate-200/80 dark:border-white/10 relative transition-all">
            
            {/* Mobile Brand Header (< lg only) */}
            <div className="flex lg:hidden items-center justify-center gap-2.5 mb-6 text-center">
              <img src={ecomindlogo} alt="EcoMind Logo" className="w-8 h-8 object-contain" />
              <span className="text-lg font-black tracking-tight text-slate-900 dark:text-white">
                EcoMind AI
              </span>
            </div>

            {/* Card Header Titles */}
            <div className="text-center mb-6">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-950 dark:text-white tracking-tight">
                {currentView === 'login' ? 'Welcome Back' : 'Create Account'}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                {currentView === 'login'
                  ? 'Sign in to access your citizen or staff portal'
                  : 'Join Kerala’s smart recyclable waste management platform'}
              </p>
            </div>

            {/* Active Form Component */}
            {currentView === 'login' ? (
              <LoginForm
                onSwitchToSignUp={switchToSignUp}
                onOpenForgotPassword={() => setModalState((prev) => ({ ...prev, forgotPassword: true }))}
                onSubmitLogin={handleLoginSubmit}
              />
            ) : (
              <SignUpForm
                onSwitchToLogin={switchToLogin}
                onOpenTerms={() => setModalState((prev) => ({ ...prev, terms: true }))}
                onOpenPrivacy={() => setModalState((prev) => ({ ...prev, privacy: true }))}
                onSubmitSignUp={handleSignUpSubmit}
              />
            )}

          </div>

          {/* Bottom Security / Privacy Guarantee */}
          <div className="mt-6 text-center text-[11px] text-slate-400 dark:text-slate-500 flex items-center justify-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>End-to-End Encrypted Authentication • EcoMind AI</span>
          </div>

        </div>

        {/* Empty bottom spacer for balance */}
        <div className="w-full max-w-md mx-auto py-2" />

      </div>

      {/* Institutional Legal Modals & Toast */}
      <TermsModal
        isOpen={modalState.terms}
        onClose={() => setModalState((prev) => ({ ...prev, terms: false }))}
      />
      <PrivacyModal
        isOpen={modalState.privacy}
        onClose={() => setModalState((prev) => ({ ...prev, privacy: false }))}
      />
      <ForgotPasswordModal
        isOpen={modalState.forgotPassword}
        onClose={() => setModalState((prev) => ({ ...prev, forgotPassword: false }))}
        onSubmit={handleForgotPasswordSubmit}
      />
      <ToastNotification toast={toast} onClose={() => setToast(null)} />

    </div>
  );
};

export default AuthPage;
