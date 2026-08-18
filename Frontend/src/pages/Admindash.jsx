import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import AdminSidebar from '../components/AdminSidebar';
import PanchayatInfo from './admin/panchaytinfo';
import AllWards from './admin/Allwards';
import AddWard from './admin/Addwards';
import AllWorkers from './admin/AllWorkers';
import AddWorker from './admin/AddWorker';
import AllUsers from './admin/AllUsers';
import AdminPickups from './admin/AdminPickups';
import Footer from '../components/Footer';
import {
    Building2,
    Users,
    UserCheck,
    Truck,
    ShieldCheck,
    Plus,
    ArrowRight,
    MapPin,
    RefreshCw,
    FileText,
    CheckCircle2,
    Sparkles,
    Calendar,
    ChevronRight
} from 'lucide-react';
import { getAllWorkers } from '../services/workerService';
import { getAllCitizens } from '../services/citizenService';
import { getAllPickupRequests } from '../services/pickupRequestService';

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

    // Summary statistics state
    const [stats, setStats] = useState({
        workersCount: 0,
        citizensCount: 0,
        pickupsCount: 0,
        completedPickupsCount: 0,
        loading: true
    });

    const loadAdminStats = async () => {
        try {
            setStats(prev => ({ ...prev, loading: true }));
            const [workers, citizens, pickups] = await Promise.all([
                getAllWorkers().catch(() => []),
                getAllCitizens().catch(() => []),
                getAllPickupRequests().catch(() => [])
            ]);

            const completed = (Array.isArray(pickups) ? pickups : []).filter(
                p => (p.status || '').toLowerCase() === 'completed' || (p.status || '').toLowerCase() === 'collected'
            ).length;

            setStats({
                workersCount: Array.isArray(workers) ? workers.length : 0,
                citizensCount: Array.isArray(citizens) ? citizens.length : 0,
                pickupsCount: Array.isArray(pickups) ? pickups.length : 0,
                completedPickupsCount: completed,
                loading: false
            });
        } catch (err) {
            console.warn("Could not fetch admin summary stats:", err);
            setStats(prev => ({ ...prev, loading: false }));
        }
    };

    useEffect(() => {
        loadAdminStats();
    }, []);

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
                            <div className="max-w-6xl mx-auto space-y-6 animate-fadeIn pb-8">
                                
                                {/* Hero Command Center Banner */}
                                <div className="bg-gradient-to-r from-[#0a4d2c] via-[#0f5b37] to-emerald-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
                                    <div className="absolute right-0 top-0 translate-x-1/4 -translate-y-1/4 w-72 h-72 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />

                                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                                        <div className="space-y-2">
                                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-emerald-200 text-xs font-semibold">
                                                <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
                                                <span>Ponkunnam Grama Panchayat Admin</span>
                                            </div>

                                            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                                                EcoMind AI Executive Dashboard
                                            </h1>

                                            <p className="text-xs sm:text-sm text-emerald-100/90 font-medium max-w-xl">
                                                Monitor panchayat waste management operations, track Haritha Karma Sena workers, manage ward allocations, and oversee household pickup drives.
                                            </p>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-3 shrink-0">
                                            <button
                                                type="button"
                                                onClick={() => setActiveTab('Worker Desk > Create Worker Login')}
                                                className="px-4 py-2.5 bg-white hover:bg-emerald-50 text-[#0a4d2c] font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
                                            >
                                                <Plus className="w-4 h-4 text-[#0a4d2c]" />
                                                <span>Add Worker</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setActiveTab('Panchayat Desk > Add Ward')}
                                                className="px-4 py-2.5 bg-emerald-900/80 hover:bg-emerald-950 border border-emerald-400/40 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
                                            >
                                                <Building2 className="w-4 h-4 text-emerald-300" />
                                                <span>Add Ward</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* ADMIN METRICS GRID */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                    {/* Card 1: Registered Citizens */}
                                    <div className="bg-white p-5 rounded-2xl border-2 border-emerald-800/20 shadow-sm space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Registered Citizens</span>
                                            <div className="p-2 bg-emerald-50 text-[#0a4d2c] rounded-xl">
                                                <Users className="w-4 h-4" />
                                            </div>
                                        </div>
                                        <div>
                                            <span className="text-2xl font-black text-gray-900">{stats.citizensCount}</span>
                                            <p className="text-xs text-gray-500 font-medium mt-0.5">Verified Households in Panchayat</p>
                                        </div>
                                    </div>

                                    {/* Card 2: Sena Workers */}
                                    <div className="bg-white p-5 rounded-2xl border-2 border-emerald-800/20 shadow-sm space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Karma Sena Workers</span>
                                            <div className="p-2 bg-emerald-50 text-[#0a4d2c] rounded-xl">
                                                <UserCheck className="w-4 h-4" />
                                            </div>
                                        </div>
                                        <div>
                                            <span className="text-2xl font-black text-[#0a4d2c]">{stats.workersCount}</span>
                                            <p className="text-xs text-gray-500 font-medium mt-0.5">Active Ward Field Collectors</p>
                                        </div>
                                    </div>

                                    {/* Card 3: Total Pickup Requests */}
                                    <div className="bg-white p-5 rounded-2xl border-2 border-emerald-800/20 shadow-sm space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Pickup Requests</span>
                                            <div className="p-2 bg-emerald-50 text-[#0a4d2c] rounded-xl">
                                                <Truck className="w-4 h-4" />
                                            </div>
                                        </div>
                                        <div>
                                            <span className="text-2xl font-black text-gray-900">{stats.pickupsCount}</span>
                                            <p className="text-xs text-gray-500 font-medium mt-0.5">Monthly Waste Collection Drives</p>
                                        </div>
                                    </div>

                                    {/* Card 4: Completed Recycling */}
                                    <div className="bg-white p-5 rounded-2xl border-2 border-emerald-800/20 shadow-sm space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Completed Pickups</span>
                                            <div className="p-2 bg-emerald-50 text-[#0a4d2c] rounded-xl">
                                                <ShieldCheck className="w-4 h-4" />
                                            </div>
                                        </div>
                                        <div>
                                            <span className="text-2xl font-black text-[#0a4d2c]">{stats.completedPickupsCount}</span>
                                            <p className="text-xs text-gray-500 font-medium mt-0.5">Drives Processed & Logged</p>
                                        </div>
                                    </div>
                                </div>

                                {/* QUICK CONTROL SHORTCUTS */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div 
                                        onClick={() => setActiveTab('Panchayat Desk > All Wards')}
                                        className="bg-white p-6 rounded-3xl border-2 border-emerald-800/20 shadow-sm hover:shadow-md transition-all cursor-pointer space-y-3 group"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="p-3 bg-emerald-50 text-[#0a4d2c] rounded-2xl group-hover:bg-[#0a4d2c] group-hover:text-white transition-all">
                                                <Building2 className="w-6 h-6" />
                                            </div>
                                            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition-all" />
                                        </div>
                                        <div>
                                            <h3 className="font-extrabold text-gray-900 text-base">Panchayat Wards Management</h3>
                                            <p className="text-xs text-gray-500 mt-1">View, configure, and manage all wards under Ponkunnam Panchayat.</p>
                                        </div>
                                    </div>

                                    <div 
                                        onClick={() => setActiveTab('Worker Desk > Worker Details')}
                                        className="bg-white p-6 rounded-3xl border-2 border-emerald-800/20 shadow-sm hover:shadow-md transition-all cursor-pointer space-y-3 group"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="p-3 bg-emerald-50 text-[#0a4d2c] rounded-2xl group-hover:bg-[#0a4d2c] group-hover:text-white transition-all">
                                                <UserCheck className="w-6 h-6" />
                                            </div>
                                            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition-all" />
                                        </div>
                                        <div>
                                            <h3 className="font-extrabold text-gray-900 text-base">Haritha Karma Sena Desk</h3>
                                            <p className="text-xs text-gray-500 mt-1">Manage field collectors, assign ward responsibilities & logins.</p>
                                        </div>
                                    </div>

                                    <div 
                                        onClick={() => setActiveTab('Pickup Requests')}
                                        className="bg-white p-6 rounded-3xl border-2 border-emerald-800/20 shadow-sm hover:shadow-md transition-all cursor-pointer space-y-3 group"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="p-3 bg-emerald-50 text-[#0a4d2c] rounded-2xl group-hover:bg-[#0a4d2c] group-hover:text-white transition-all">
                                                <Truck className="w-6 h-6" />
                                            </div>
                                            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition-all" />
                                        </div>
                                        <div>
                                            <h3 className="font-extrabold text-gray-900 text-base">All Ward Waste Pickups</h3>
                                            <p className="text-xs text-gray-500 mt-1">Review live household requests, scheduled dates, and completed card logs.</p>
                                        </div>
                                    </div>
                                </div>

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
