import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import AdminSidebar from '../components/AdminSidebar';
import AllWards from './admin/Allwards';
import AddWard from './admin/Addwards';
import PanchayatInfo from './admin/panchaytinfo';
import AllWorkers from './admin/AllWorkers';
import AddWorker from './admin/AddWorker';
import { useNavigate } from 'react-router-dom';
import Footer from '../components/Footer';
import AllUsers from './admin/AllUsers';
import AdminPickups from './admin/AdminPickups';

const Admin = () => {
    const [activeTab, setActiveTabState] = useState(() => {
        return sessionStorage.getItem('adminActiveTab') || 'Dashboard';
    });

    const setActiveTab = (tab) => {
        setActiveTabState(tab);
        sessionStorage.setItem('adminActiveTab', tab);
    };

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

        // Intercept window back button clicks when logged out
        const handlePopState = () => {
            const stillLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
            if (!stillLoggedIn) {
                window.history.pushState(null, '', window.location.href);
                navigate('/', { replace: true });
            }
        };

        // Push current entry into window history stack
        window.history.pushState(null, '', window.location.href);
        window.addEventListener('popstate', handlePopState);

        return () => {
            window.removeEventListener('popstate', handlePopState);
        };
    }, [navigate]);

    const handleLogout = () => {
        // Clear all auth storage tokens/flags
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        sessionStorage.clear();

        // Replace current history entry with home page so back button won't return to admin dashboard
        navigate('/', { replace: true });
    };

    return (
        <div className="h-screen w-screen flex flex-col overflow-hidden bg-[#f4f9f5] font-sans">
            {/* Main Top Header (Fixed at top) */}
            <div className="shrink-0 z-40 border-b border-emerald-100/80 shadow-2xs">
                <Header />
            </div>

            {/* Body Container (Flex below Header) */}
            <div className="flex-1 flex overflow-hidden min-h-0">
                {/* Admin Side Menu (Fixed on Left) */}
                <AdminSidebar
                    activeItem={activeTab}
                    setActiveItem={setActiveTab}
                    onLogout={handleLogout}
                    isCollapsed={isSidebarCollapsed}
                    onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                    isOpen={isMobileSidebarOpen}
                    onClose={() => setIsMobileSidebarOpen(false)}
                />

                {/* Workspace Content Area (Scrolls Vertically) */}
                <main className="flex-1 h-full overflow-y-auto flex flex-col justify-between bg-[#f3f7f5] min-w-0">
                    <div className="p-4 sm:p-6 lg:p-8 space-y-6 flex-1">
                        {activeTab === 'Dashboard' && (
                            <div className="bg-white rounded-2xl p-6 border border-emerald-100/80 shadow-xs">
                                <h1 className="text-2xl font-bold text-gray-800 tracking-tight">
                                    Welcome to Dashboard
                                </h1>
                                <p className="text-sm text-gray-500 mt-2">
                                    Select any menu item from the sidebar to manage EcoMind AI system settings and operations.
                                </p>
                            </div>
                        )}

                        {(activeTab === 'Panchayat Desk > Panchayt Info' || activeTab === 'Panchayt Info') && (
                            <PanchayatInfo initialEdit={false} />
                        )}

                        {(activeTab === 'Panchayat Desk > Add Panchayat' || activeTab === 'Add Panchayat') && (
                            <PanchayatInfo initialEdit={true} />
                        )}

                        {(activeTab === 'Panchayat Desk' || activeTab === 'Panchayat Desk > All Wards' || activeTab === 'All Wards') && (
                            <AllWards onAddWard={() => setActiveTab('Panchayat Desk > Add Ward')} />
                        )}

                        {activeTab === 'Panchayat Desk > Add Ward' && (
                            <AddWard
                                onBack={() => setActiveTab('Panchayat Desk > All Wards')}
                                onWardAdded={() => setActiveTab('Panchayat Desk > All Wards')}
                            />
                        )}

                        {(activeTab === 'Worker Desk' || activeTab === 'Worker Desk > Worker Details' || activeTab === 'Worker Details') && (
                            <AllWorkers onCreateWorkerClick={() => setActiveTab('Worker Desk > Create Worker Login')} />
                        )}

                        {(activeTab === 'Worker Desk > Create Worker Login' || activeTab === 'Create Worker Login') && (
                            <AddWorker
                                onBack={() => setActiveTab('Worker Desk > Worker Details')}
                                onWorkerAdded={() => setActiveTab('Worker Desk > Worker Details')}
                            />
                        )}

                        {(activeTab === 'Users' || activeTab === 'Registered Users') && (
                            <AllUsers />
                        )}

                        {(activeTab === 'Pickup Requests' || activeTab === 'Waste Pickups') && (
                            <AdminPickups />
                        )}

                        {activeTab !== 'Dashboard' &&
                            activeTab !== 'Pickup Requests' &&
                            activeTab !== 'Waste Pickups' &&
                            activeTab !== 'Panchayat Desk' &&
                            activeTab !== 'Panchayat Desk > Panchayt Info' &&
                            activeTab !== 'Panchayt Info' &&
                            activeTab !== 'Panchayat Desk > Add Panchayat' &&
                            activeTab !== 'Add Panchayat' &&
                            activeTab !== 'Panchayat Desk > All Wards' &&
                            activeTab !== 'All Wards' &&
                            activeTab !== 'Panchayat Desk > Add Ward' &&
                            activeTab !== 'Worker Desk' &&
                            activeTab !== 'Worker Desk > Worker Details' &&
                            activeTab !== 'Worker Details' &&
                            activeTab !== 'Worker Desk > Create Worker Login' &&
                            activeTab !== 'Create Worker Login' &&
                            activeTab !== 'Users' &&
                            activeTab !== 'Registered Users' && (
                                <div className="bg-white rounded-2xl p-6 border border-emerald-100/80 shadow-xs">
                                    <h1 className="text-2xl font-bold text-gray-800 tracking-tight">
                                        {activeTab}
                                    </h1>
                                    <p className="text-sm text-gray-500 mt-2">
                                        System operations for {activeTab}.
                                    </p>
                                </div>
                            )}
                    </div>

                    <Footer />
                </main>
            </div>
        </div>
    );
};

export default Admin;
