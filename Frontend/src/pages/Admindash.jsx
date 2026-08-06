import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import AdminSidebar from '../components/AdminSidebar';
import AllWards from './admin/Allwards';
import AddWard from './admin/Addwards';
import PanchayatInfo from './admin/panchaytinfo';
import AllWorkers from './admin/AllWorkers';
import AddWorker from './admin/AddWorker';
import { useNavigate } from 'react-router-dom';

import AllUsers from './admin/AllUsers';

const Admin = () => {
    const [activeTab, setActiveTab] = useState('Dashboard');
    const navigate = useNavigate();

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
        <div className="min-h-screen bg-[#f4f9f5] flex flex-col font-sans">
            {/* Main Top Header */}
            <Header />

            {/* Main Container below Header with Side Menu on Left */}
            <div className="flex-1 flex">
                {/* Admin Side Menu */}
                <AdminSidebar
                    activeItem={activeTab}
                    setActiveItem={setActiveTab}
                    onLogout={handleLogout}
                />

                {/* Workspace Content Area */}
                <main className="flex-1 p-8 bg-[#f3f7f5]">
                    {activeTab === 'Dashboard' && (
                        <div className="bg-white rounded-2xl p-6 border border-emerald-100/80 shadow-xs">
                            <h1 className="text-2xl font-bold text-gray-800 tracking-tight">
                                {activeTab}
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

                    {activeTab !== 'Dashboard' &&
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
                </main>
            </div>
            <Footer />
        </div>
    );
};

export default Admin;
