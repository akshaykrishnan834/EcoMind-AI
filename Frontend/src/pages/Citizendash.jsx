import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import CitizenSidebar from '../components/CitizenSidebar';
import Footer from '../components/Footer';
import { useNavigate } from 'react-router-dom';

const CitizenDashboard = () => {
    const [activeTab, setActiveTab] = useState('Dashboard');
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const navigate = useNavigate();

    const handleToggleSidebar = () => {
        if (window.innerWidth < 1024) {
            setIsMobileSidebarOpen((prev) => !prev);
        } else {
            setIsSidebarCollapsed((prev) => !prev);
        }
    };

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

    return (
        <div className="min-h-screen bg-[#f4f9f5] flex flex-col font-sans">
            {/* Top Header */}
            <Header />

            {/* Main Content Layout with Sidebar */}
            <div className="flex-1 flex">
                <CitizenSidebar
                    activeItem={activeTab}
                    setActiveItem={setActiveTab}
                    onLogout={handleLogout}
                    isCollapsed={isSidebarCollapsed}
                    onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                    isOpen={isMobileSidebarOpen}
                    onClose={() => setIsMobileSidebarOpen(false)}
                />

                {/* Main Workspace */}
                <main className="flex-1 p-8 bg-[#f3f7f5]">
                    <div className="bg-white rounded-2xl p-6 border border-emerald-100/80 shadow-xs">
                        <h1 className="text-2xl font-bold text-gray-800 tracking-tight">
                            {activeTab === 'Dashboard' ? 'Welcome to Dashboard' : activeTab}
                        </h1>
                        <p className="text-sm text-gray-500 mt-2">
                            Welcome to your EcoMind AI Citizen Portal. Manage your waste management requests, services, and profile settings here.
                        </p>
                    </div>
                </main>
            </div>

            {/* Footer */}
            <Footer />
        </div>
    );
};

export default CitizenDashboard;