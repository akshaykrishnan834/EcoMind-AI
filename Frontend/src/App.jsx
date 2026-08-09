
import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import LoginForm from './components/LoginForm';
import SignUpForm from './components/SignUpForm';
import CitizenDashboard from './pages/Citizendash';
import WorkerDashboard from './pages/Workerdash';
import AdminDashboard from './pages/Admindash';
import { FeaturesBar, QuoteBar, Footer } from './components/Footer';
import { TermsModal, PrivacyModal, ForgotPasswordModal, ToastNotification } from './components/Modals';

export function App() {
  const [currentView, setCurrentView] = useState('login'); // 'login' | 'signup'
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
    showToast('Account Created!', `Welcome ${data.fullName}! Your EcoMind AI account is now active please Go to login and login to your account !.`);
  };

  const handleForgotPasswordSubmit = (email) => {
    showToast('Reset Link Sent', `Password reset instructions sent to ${email}.`);
  };

  return (
    <Routes>
      <Route path="/citizen" element={<CitizenDashboard />} />
      <Route path="/worker" element={<WorkerDashboard />} />
      <Route path="/admin" element={<AdminDashboard />} />
      <Route
        path="/*"
        element={
          <div className="min-h-screen bg-[#f4f9f5] flex flex-col font-sans selection:bg-emerald-200 selection:text-emerald-900 text-gray-800">

            {/* Top Header */}
            <Header />



            {/* Main Content Body */}
            <main className="flex-1 flex flex-col justify-center">
              {currentView === 'login' ? (
                <>
                  <LoginForm
                    onSwitchToSignUp={() => setCurrentView('signup')}
                    onOpenForgotPassword={() => setModalState((prev) => ({ ...prev, forgotPassword: true }))}
                    onSubmitLogin={handleLoginSubmit}
                  />
                  <FeaturesBar />
                </>
              ) : (
                <>
                  <SignUpForm
                    onSwitchToLogin={() => setCurrentView('login')}
                    onOpenTerms={() => setModalState((prev) => ({ ...prev, terms: true }))}
                    onOpenPrivacy={() => setModalState((prev) => ({ ...prev, privacy: true }))}
                    onSubmitSignUp={handleSignUpSubmit}
                  />
                  <QuoteBar />
                </>
              )}
            </main>

            {/* Footer */}
            <Footer
              onOpenPrivacy={() => setModalState((prev) => ({ ...prev, privacy: true }))}
              onOpenTerms={() => setModalState((prev) => ({ ...prev, terms: true }))}
            />

            {/* Modals & Toasts */}
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
        }
      />
    </Routes>
  );
}

export default App;


