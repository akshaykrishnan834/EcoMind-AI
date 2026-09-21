import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from '../components/Header';
import AdminSidebar from '../components/AdminSidebar';
import PanchayatInfo from './admin/panchaytinfo';
import AllWards from './admin/Allwards';
import AddWard from './admin/Addwards';
import AllWorkers from './admin/AllWorkers';
import AddWorker from './admin/AddWorker';
import AllUsers from './admin/AllUsers';
import AdminPickups from './admin/AdminPickups';
import AdminCollectionSchedule from './admin/AdminCollectionSchedule';
import AdminPayments from './admin/AdminPayments';
import AdminReports from './admin/AdminReports';
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
    ChevronRight,
    IndianRupee,
    CreditCard,
    BarChart3,
    AlertTriangle,
    AlertCircle,
    Clock,
    TrendingUp,
    PieChart,
    Layers,
    ArrowUpRight,
    Activity,
    Check,
    Home,
    ShoppingBag,
    HelpCircle,
    Shield
} from 'lucide-react';
import { getAllWorkers } from '../services/workerService';
import { getAllCitizens } from '../services/citizenService';
import { getAllPickupRequests } from '../services/pickupRequestService';
import { getCitizenPayments } from '../services/paymentService';

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

    // Raw datasets
    const [workers, setWorkers] = useState([]);
    const [citizens, setCitizens] = useState([]);
    const [pickups, setPickups] = useState([]);
    const [wards, setWards] = useState([]);
    const [paymentsMap, setPaymentsMap] = useState({});
    const [loading, setLoading] = useState(true);
    const [chartHoverMonth, setChartHoverMonth] = useState(null);

    // Selected Month & Year for Payments & Analytics
    const currentDate = new Date();
    const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1); // 1-12
    const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());

    const months = [
        { value: 1, name: 'Jan' },
        { value: 2, name: 'Feb' },
        { value: 3, name: 'Mar' },
        { value: 4, name: 'Apr' },
        { value: 5, name: 'May' },
        { value: 6, name: 'Jun' },
        { value: 7, name: 'Jul' },
        { value: 8, name: 'Aug' },
        { value: 9, name: 'Sep' },
        { value: 10, name: 'Oct' },
        { value: 11, name: 'Nov' },
        { value: 12, name: 'Dec' }
    ];

    const loadAllDashboardData = async () => {
        try {
            setLoading(true);
            const [workersData, citizensData, pickupsData, wardsRes] = await Promise.all([
                getAllWorkers().catch(() => []),
                getAllCitizens().catch(() => []),
                getAllPickupRequests().catch(() => []),
                axios.get('http://localhost:5214/api/Ward').catch(() => ({ data: [] }))
            ]);

            const validWorkers = Array.isArray(workersData) ? workersData : [];
            const validCitizens = Array.isArray(citizensData) ? citizensData : [];
            const validPickups = Array.isArray(pickupsData) ? pickupsData : [];
            const validWards = Array.isArray(wardsRes.data) ? wardsRes.data : [];

            setWorkers(validWorkers);
            setCitizens(validCitizens);
            setPickups(validPickups);
            setWards(validWards);

            // Fetch payment records for each citizen in parallel
            const pMap = {};
            await Promise.all(
                validCitizens.map(async (c) => {
                    const cId = c.citizenId || c.id;
                    if (cId) {
                        try {
                            const res = await getCitizenPayments(cId);
                            pMap[cId] = Array.isArray(res) ? res : [];
                        } catch {
                            pMap[cId] = [];
                        }
                    }
                })
            );
            setPaymentsMap(pMap);
        } catch (err) {
            console.warn("Could not fetch admin dashboard data:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAllDashboardData();
    }, []);

    // -------------------------------------------------------------
    // AGGREGATED METRICS CALCULATIONS
    // -------------------------------------------------------------

    // Citizens Breakdown
    const totalCitizens = citizens.length;
    const verifiedCitizens = citizens.filter(c => c.isVerified === true || (c.status || '').toLowerCase() === 'verified').length;
    const pendingVerificationCount = totalCitizens - verifiedCitizens;

    // Workers Breakdown
    const totalWorkers = workers.length;
    const activeWorkers = workers.filter(w => (w.status || '').toLowerCase() !== 'inactive').length;

    // Wards
    const totalWards = wards.length > 0 ? wards.length : 22;

    // Pickups Breakdown
    const totalPickups = pickups.length;
    const pendingPickups = pickups.filter(p => (p.status || '').toLowerCase() === 'pending').length;
    const scheduledPickups = pickups.filter(p => {
        const s = (p.status || '').toLowerCase();
        return s === 'scheduled' || s === 'accepted';
    }).length;
    const completedPickups = pickups.filter(p => {
        const s = (p.status || '').toLowerCase();
        return s === 'completed' || s === 'collected';
    }).length;
    const missedPickups = pickups.filter(p => {
        const s = (p.status || '').toLowerCase();
        return s === 'failed' || s === 'missed';
    }).length;
    const completionRate = totalPickups > 0 ? Math.round((completedPickups / totalPickups) * 100) : 0;

    // Monthly Payments Breakdown for selectedMonth & selectedYear
    const paymentRecordsForMonth = useMemo(() => {
        return citizens.map(c => {
            const cId = c.citizenId || c.id;
            const history = paymentsMap[cId] || [];
            const payment = history.find(p => p.year === Number(selectedYear) && p.month === Number(selectedMonth));

            let status = 'Unpaid';
            let method = 'Not Paid';
            let amount = 50.0;
            let paidAt = null;

            if (payment) {
                amount = payment.amount || 50.0;
                if (payment.status === 'Paid') {
                    status = 'Paid';
                    method = payment.paymentMethod || 'Online';
                    paidAt = payment.paidAt;
                } else if (payment.status === 'Pending' || payment.paymentMethod === 'Pay Through Worker') {
                    status = 'Pending Cash';
                    method = 'Pay Through Worker';
                }
            }

            return {
                citizenId: cId,
                citizenName: c.fullName || 'Citizen',
                wardId: c.wardId || 'W001',
                houseNumber: c.houseNumber || 'N/A',
                houseName: c.houseName || 'House',
                amount,
                status,
                method,
                paidAt
            };
        });
    }, [citizens, paymentsMap, selectedMonth, selectedYear]);

    const paidHouseholds = paymentRecordsForMonth.filter(r => r.status === 'Paid');
    const pendingCashHouseholds = paymentRecordsForMonth.filter(r => r.status === 'Pending Cash');
    const unpaidHouseholds = paymentRecordsForMonth.filter(r => r.status === 'Unpaid');

    const monthlyRevenueCollected = paidHouseholds.length * 50;
    const monthlyRevenuePending = pendingCashHouseholds.length * 50;
    const monthlyRevenueUnpaid = unpaidHouseholds.length * 50;
    const monthlyTargetRevenue = totalCitizens * 50;
    const monthlyRealizationRate = totalCitizens > 0 ? Math.round((paidHouseholds.length / totalCitizens) * 100) : 0;

    // Household vs Commercial Establishments
    const commercialKeywords = /(store|shop|mart|commercial|enterprise|hotel|bakery|restaurant|agency|trader|traders|hall|bhavan|office|complex|press|mill|hospital|clinic|school|college)/i;
    const commercialCitizens = citizens.filter(c => {
        const text = `${c.houseName || ''} ${c.address || ''} ${c.fullName || ''}`;
        return commercialKeywords.test(text);
    });
    const commercialCount = commercialCitizens.length;
    const householdCount = Math.max(0, totalCitizens - commercialCount);
    const householdPct = totalCitizens > 0 ? Math.round((householdCount / totalCitizens) * 100) : 100;
    const commercialPct = totalCitizens > 0 ? 100 - householdPct : 0;

    // Ward-Wise Collection Aggregation
    const wardWiseStats = useMemo(() => {
        // Collect list of all unique ward IDs
        const wardIdList = Array.from(new Set([
            ...wards.map(w => w.wardId || `W0${w.wardNumber || ''}`),
            ...citizens.map(c => c.wardId),
            ...pickups.map(p => p.wardId)
        ])).filter(Boolean).sort();

        return wardIdList.map(wId => {
            const wardObj = wards.find(w => w.wardId === wId || `W0${w.wardNumber}` === wId);
            const wardName = wardObj?.wardName || (wId.startsWith('W') ? `Ward ${wId.substring(1)}` : wId);
            const wardCitizens = citizens.filter(c => c.wardId === wId);
            const wardPickups = pickups.filter(p => p.wardId === wId);
            const wardCompleted = wardPickups.filter(p => {
                const s = (p.status || '').toLowerCase();
                return s === 'completed' || s === 'collected';
            }).length;
            const assignedWorker = workers.find(w => w.wardId === wId || w.assignedWard === wId);
            const rate = wardPickups.length > 0 ? Math.round((wardCompleted / wardPickups.length) * 100) : 0;

            return {
                wardId: wId,
                wardName,
                citizensCount: wardCitizens.length,
                totalRequests: wardPickups.length,
                completed: wardCompleted,
                rate,
                workerName: assignedWorker?.fullName || 'Unassigned'
            };
        });
    }, [wards, citizens, pickups, workers]);

    // Waste Category Distribution
    const wasteCategories = useMemo(() => {
        const counts = {
            'Clean Dry Plastic': 0,
            'Rigid Containers & Bottles': 0,
            'Flexible Film & Bags': 0,
            'Mixed Recyclable Plastic': 0,
            'Others': 0
        };

        pickups.forEach(p => {
            const cat = (p.overallCategory || p.category || '').toLowerCase();
            if (cat.includes('dry') || cat.includes('clean')) {
                counts['Clean Dry Plastic']++;
            } else if (cat.includes('rigid') || cat.includes('bottle') || cat.includes('container') || cat.includes('hard')) {
                counts['Rigid Containers & Bottles']++;
            } else if (cat.includes('film') || cat.includes('bag') || cat.includes('flex')) {
                counts['Flexible Film & Bags']++;
            } else if (cat.includes('plastic') || cat.includes('mix')) {
                counts['Mixed Recyclable Plastic']++;
            } else {
                counts['Others']++;
            }
        });

        const totalCategorized = Math.max(1, pickups.length);
        return Object.entries(counts).map(([name, count]) => ({
            name,
            count,
            percentage: Math.round((count / totalCategorized) * 100)
        }));
    }, [pickups]);

    // Waste Volume Breakdown
    const volumeBreakdown = useMemo(() => {
        let low = 0, med = 0, high = 0;
        pickups.forEach(p => {
            const v = (p.estimatedVolume || '').toLowerCase();
            if (v.includes('low') || v.includes('1') || v.includes('2') || v.includes('3')) low++;
            else if (v.includes('high') || v.includes('large') || v.includes('heavy')) high++;
            else med++;
        });
        const total = Math.max(1, pickups.length);
        return {
            low: { count: low, pct: Math.round((low / total) * 100) },
            med: { count: med, pct: Math.round((med / total) * 100) },
            high: { count: high, pct: Math.round((high / total) * 100) }
        };
    }, [pickups]);

    // Monthly Collection Trend (Last 11 Months: Nov 2025 – Sep 2026)
    const trendData = useMemo(() => {
        const monthsSeries = [
            { label: 'Nov 25', year: 2025, month: 11 },
            { label: 'Dec 25', year: 2025, month: 12 },
            { label: 'Jan 26', year: 2026, month: 1 },
            { label: 'Feb 26', year: 2026, month: 2 },
            { label: 'Mar 26', year: 2026, month: 3 },
            { label: 'Apr 26', year: 2026, month: 4 },
            { label: 'May 26', year: 2026, month: 5 },
            { label: 'Jun 26', year: 2026, month: 6 },
            { label: 'Jul 26', year: 2026, month: 7 },
            { label: 'Aug 26', year: 2026, month: 8 },
            { label: 'Sep 26', year: 2026, month: 9 }
        ];

        return monthsSeries.map(m => {
            const monthRequests = pickups.filter(p => {
                const dStr = p.collectionDate || p.requestedAt;
                if (!dStr) return false;
                const d = new Date(dStr);
                return d.getFullYear() === m.year && d.getMonth() + 1 === m.month;
            });

            const completed = monthRequests.filter(p => {
                const s = (p.status || '').toLowerCase();
                return s === 'completed' || s === 'collected';
            }).length;

            return {
                ...m,
                totalRequests: monthRequests.length,
                completed
            };
        });
    }, [pickups]);

    const maxTrendVal = Math.max(
        ...trendData.map(t => Math.max(t.totalRequests, t.completed)),
        4
    );

    // Recent Pickups Live Feed (5 latest)
    const recentPickupsList = useMemo(() => {
        const sorted = [...pickups].sort((a, b) => {
            const da = new Date(a.collectionDate || a.requestedAt || 0);
            const db = new Date(b.collectionDate || b.requestedAt || 0);
            return db - da;
        });
        return sorted.slice(0, 5);
    }, [pickups]);

    // Recent Payments Live Feed (5 latest)
    const recentPaymentsList = useMemo(() => {
        const allPayments = [];
        citizens.forEach(c => {
            const cId = c.citizenId || c.id;
            const history = paymentsMap[cId] || [];
            history.forEach(p => {
                if (p.status === 'Paid' || p.paidAt) {
                    allPayments.push({
                        ...p,
                        citizenName: c.fullName || 'Citizen',
                        wardId: c.wardId || 'W001',
                        houseNumber: c.houseNumber || 'N/A'
                    });
                }
            });
        });

        allPayments.sort((a, b) => {
            const da = new Date(a.paidAt || a.createdAt || 0);
            const db = new Date(b.paidAt || b.createdAt || 0);
            return db - da;
        });

        return allPayments.slice(0, 5);
    }, [citizens, paymentsMap]);

    // Operational Alerts Count
    const unassignedWardsCount = wardWiseStats.filter(w => w.workerName === 'Unassigned').length;

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
        sessionStorage.clear();
        navigate('/', { replace: true });
    };

    return (
        <div className="h-screen w-screen flex flex-col overflow-hidden bg-[#f4f9f5] dark:bg-[#0c1510] font-sans transition-colors duration-200">
            {/* Main Top Header (Fixed at top) */}
            <div className="shrink-0 z-40 border-b border-emerald-100/80 dark:border-emerald-800/60 shadow-2xs">
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
                <main className="flex-1 h-full overflow-y-auto flex flex-col justify-between bg-[#f3f7f5] dark:bg-[#0a120e] min-w-0">
                    <div className="p-4 sm:p-6 lg:p-8 space-y-6 flex-1">
                        {activeTab === 'Dashboard' && (
                            <div className="max-w-7xl mx-auto space-y-6 animate-fadeIn pb-12">

                                {/* 1. EXECUTIVE COMMAND CENTER BANNER */}
                                <div className="bg-gradient-to-r from-[#0a4d2c] via-[#0b5c35] to-emerald-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-emerald-700/40">
                                    <div className="absolute right-0 top-0 translate-x-1/4 -translate-y-1/4 w-96 h-96 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />

                                    <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                                        <div className="space-y-2.5">
                                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 text-xs font-semibold backdrop-blur-xs">
                                                <Shield className="w-3.5 h-3.5 text-emerald-300" />
                                                <span>Local Self Government Department • Kerala State</span>
                                            </div>

                                            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
                                                <span>EcoMind AI Executive Command Center</span>
                                                <span className="hidden sm:inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 uppercase tracking-widest">
                                                    Live System
                                                </span>
                                            </h1>

                                            <p className="text-xs sm:text-sm text-emerald-100/90 font-medium max-w-2xl leading-relaxed">
                                                Centralized operational oversight for Haritha Karma Sena door-to-door plastic collection, citizen waste audit segregation, ₹50 user fee receipts, and ward allocations.
                                            </p>

                                            <div className="flex flex-wrap items-center gap-4 text-xs text-emerald-200 font-medium pt-1">
                                                <span className="flex items-center gap-1.5">
                                                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                                                    Panchayat Drive Active: 15th–25th Monthly Window
                                                </span>
                                                <span className="text-emerald-400/50">•</span>
                                                <span>Current Cycle: {months.find(m => m.value === selectedMonth)?.name} {selectedYear}</span>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-3 shrink-0">
                                            <button
                                                type="button"
                                                onClick={loadAllDashboardData}
                                                disabled={loading}
                                                className="px-3.5 py-2.5 bg-emerald-800/60 hover:bg-emerald-800 text-emerald-100 font-bold text-xs uppercase tracking-wider rounded-xl border border-emerald-600/40 shadow-sm transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                                                title="Sync and refresh all dashboard metrics"
                                            >
                                                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-300' : ''}`} />
                                                <span>{loading ? 'Refreshing...' : 'Refresh'}</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setActiveTab('Worker Desk > Create Worker Login')}
                                                className="px-4 py-2.5 bg-white hover:bg-emerald-50 text-[#0a4d2c] font-black text-xs uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer hover:shadow-lg"
                                            >
                                                <Plus className="w-4 h-4 text-[#0a4d2c]" />
                                                <span>Add Worker</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setActiveTab('Panchayat Desk > Add Ward')}
                                                className="px-4 py-2.5 bg-emerald-900 hover:bg-emerald-950 border border-emerald-400/40 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
                                            >
                                                <Building2 className="w-4 h-4 text-emerald-300" />
                                                <span>Add Ward</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* 2. OPERATIONAL ALERTS & NOTICES */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                    {/* Alert 1: Missed Pickups */}
                                    <div
                                        onClick={() => setActiveTab('Pickup Management')}
                                        className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-xs flex items-start gap-3.5 group ${
                                            missedPickups > 0
                                                ? 'bg-rose-50/80 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/50 hover:border-rose-400'
                                                : 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/40'
                                        }`}
                                    >
                                        <div className={`p-2.5 rounded-xl shrink-0 ${
                                            missedPickups > 0
                                                ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/60 dark:text-rose-300'
                                                : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300'
                                        }`}>
                                            <AlertTriangle className="w-4 h-4" />
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300">Missed Pickups</span>
                                                {missedPickups > 0 && (
                                                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-200 dark:bg-rose-900 text-rose-800 dark:text-rose-200">
                                                        {missedPickups}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs font-semibold text-gray-900 dark:text-white mt-0.5">
                                                {missedPickups > 0 ? `${missedPickups} uncollected drives` : 'Zero missed drives'}
                                            </p>
                                            <p className="text-[11px] text-gray-500 dark:text-gray-400 group-hover:text-emerald-700 dark:group-hover:text-emerald-300 flex items-center gap-1 mt-1">
                                                Review in Pickup Management <ArrowRight className="w-3 h-3" />
                                            </p>
                                        </div>
                                    </div>

                                    {/* Alert 2: Pending User Fees */}
                                    <div
                                        onClick={() => setActiveTab('Payments')}
                                        className="p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 hover:border-amber-400 transition-all cursor-pointer shadow-xs flex items-start gap-3.5 group"
                                    >
                                        <div className="p-2.5 rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300 shrink-0">
                                            <IndianRupee className="w-4 h-4" />
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300">Fee Realization</span>
                                                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-200 dark:bg-amber-900 text-amber-800 dark:text-amber-200">
                                                    ₹{monthlyRevenueUnpaid} Due
                                                </span>
                                            </div>
                                            <p className="text-xs font-semibold text-gray-900 dark:text-white mt-0.5">
                                                {unpaidHouseholds.length} Households Pending
                                            </p>
                                            <p className="text-[11px] text-gray-500 dark:text-gray-400 group-hover:text-amber-800 dark:group-hover:text-amber-300 flex items-center gap-1 mt-1">
                                                Open Payment Ledger <ArrowRight className="w-3 h-3" />
                                            </p>
                                        </div>
                                    </div>

                                    {/* Alert 3: Unassigned Ward Coverage */}
                                    <div
                                        onClick={() => setActiveTab('Panchayat Desk > All Wards')}
                                        className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-xs flex items-start gap-3.5 group ${
                                            unassignedWardsCount > 0
                                                ? 'bg-blue-50/80 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900/50 hover:border-blue-400'
                                                : 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/40'
                                        }`}
                                    >
                                        <div className={`p-2.5 rounded-xl shrink-0 ${
                                            unassignedWardsCount > 0
                                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300'
                                                : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300'
                                        }`}>
                                            <MapPin className="w-4 h-4" />
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300">Ward Allocations</span>
                                            </div>
                                            <p className="text-xs font-semibold text-gray-900 dark:text-white mt-0.5">
                                                {unassignedWardsCount > 0 ? `${unassignedWardsCount} Wards Need Workers` : 'All Wards Covered'}
                                            </p>
                                            <p className="text-[11px] text-gray-500 dark:text-gray-400 group-hover:text-blue-700 dark:group-hover:text-blue-300 flex items-center gap-1 mt-1">
                                                Assign Karma Sena <ArrowRight className="w-3 h-3" />
                                            </p>
                                        </div>
                                    </div>

                                    {/* Alert 4: Citizen KYC Status */}
                                    <div
                                        onClick={() => setActiveTab('Users')}
                                        className="p-4 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/50 hover:border-indigo-400 transition-all cursor-pointer shadow-xs flex items-start gap-3.5 group"
                                    >
                                        <div className="p-2.5 rounded-xl bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300 shrink-0">
                                            <UserCheck className="w-4 h-4" />
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300">Citizen Verification</span>
                                                {pendingVerificationCount > 0 && (
                                                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-indigo-200 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200">
                                                        {pendingVerificationCount}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs font-semibold text-gray-900 dark:text-white mt-0.5">
                                                {verifiedCitizens} Verified of {totalCitizens}
                                            </p>
                                            <p className="text-[11px] text-gray-500 dark:text-gray-400 group-hover:text-indigo-800 dark:group-hover:text-indigo-300 flex items-center gap-1 mt-1">
                                                Audit Registered Citizens <ArrowRight className="w-3 h-3" />
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* 3. 6 CRITICAL EXECUTIVE KPI CARDS */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                                    {/* KPI 1: Total Citizens */}
                                    <div
                                        onClick={() => setActiveTab('Users')}
                                        className="bg-white dark:bg-[#14231b] p-5 rounded-2xl border-2 border-emerald-800/20 dark:border-emerald-700/30 shadow-sm hover:shadow-md hover:border-emerald-600 transition-all cursor-pointer space-y-3"
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10.5px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Total Citizens</span>
                                            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/60 text-[#0a4d2c] dark:text-emerald-300 rounded-xl">
                                                <Users className="w-4 h-4" />
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-2xl font-black text-gray-900 dark:text-white">{totalCitizens}</div>
                                            <div className="flex items-center justify-between mt-1 text-[11px] text-gray-500 dark:text-gray-400 font-medium">
                                                <span>Verified: {verifiedCitizens}</span>
                                                <span className="text-emerald-600 font-bold">{totalCitizens > 0 ? Math.round((verifiedCitizens / totalCitizens) * 100) : 0}%</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* KPI 2: Karma Sena Workers */}
                                    <div
                                        onClick={() => setActiveTab('Worker Desk > Worker Details')}
                                        className="bg-white dark:bg-[#14231b] p-5 rounded-2xl border-2 border-emerald-800/20 dark:border-emerald-700/30 shadow-sm hover:shadow-md hover:border-emerald-600 transition-all cursor-pointer space-y-3"
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10.5px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Karma Sena</span>
                                            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/60 text-[#0a4d2c] dark:text-emerald-300 rounded-xl">
                                                <UserCheck className="w-4 h-4" />
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-2xl font-black text-[#0a4d2c] dark:text-emerald-400">{totalWorkers}</div>
                                            <div className="flex items-center justify-between mt-1 text-[11px] text-gray-500 dark:text-gray-400 font-medium">
                                                <span>Active Deployed</span>
                                                <span className="text-emerald-600 font-bold">{activeWorkers}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* KPI 3: Panchayat Wards */}
                                    <div
                                        onClick={() => setActiveTab('Panchayat Desk > All Wards')}
                                        className="bg-white dark:bg-[#14231b] p-5 rounded-2xl border-2 border-emerald-800/20 dark:border-emerald-700/30 shadow-sm hover:shadow-md hover:border-emerald-600 transition-all cursor-pointer space-y-3"
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10.5px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Total Wards</span>
                                            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/60 text-[#0a4d2c] dark:text-emerald-300 rounded-xl">
                                                <Building2 className="w-4 h-4" />
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-2xl font-black text-gray-900 dark:text-white">{totalWards}</div>
                                            <div className="flex items-center justify-between mt-1 text-[11px] text-gray-500 dark:text-gray-400 font-medium">
                                                <span>Allocated</span>
                                                <span className="text-emerald-600 font-bold">{totalWards - unassignedWardsCount}/{totalWards}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* KPI 4: Total Pickup Requests */}
                                    <div
                                        onClick={() => setActiveTab('Pickup Management')}
                                        className="bg-white dark:bg-[#14231b] p-5 rounded-2xl border-2 border-emerald-800/20 dark:border-emerald-700/30 shadow-sm hover:shadow-md hover:border-emerald-600 transition-all cursor-pointer space-y-3"
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10.5px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Pickup Requests</span>
                                            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/60 text-[#0a4d2c] dark:text-emerald-300 rounded-xl">
                                                <Truck className="w-4 h-4" />
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-2xl font-black text-gray-900 dark:text-white">{totalPickups}</div>
                                            <div className="flex items-center justify-between mt-1 text-[11px] text-gray-500 dark:text-gray-400 font-medium">
                                                <span>Active / Pending</span>
                                                <span className="text-amber-600 font-bold">{pendingPickups + scheduledPickups}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* KPI 5: Completed Pickups */}
                                    <div
                                        onClick={() => setActiveTab('Pickup Management')}
                                        className="bg-white dark:bg-[#14231b] p-5 rounded-2xl border-2 border-emerald-800/20 dark:border-emerald-700/30 shadow-sm hover:shadow-md hover:border-emerald-600 transition-all cursor-pointer space-y-3"
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10.5px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Completed Pickups</span>
                                            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/60 text-[#0a4d2c] dark:text-emerald-300 rounded-xl">
                                                <ShieldCheck className="w-4 h-4" />
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-2xl font-black text-[#0a4d2c] dark:text-emerald-400">{completedPickups}</div>
                                            <div className="flex items-center justify-between mt-1 text-[11px] text-gray-500 dark:text-gray-400 font-medium">
                                                <span>Success Rate</span>
                                                <span className="text-emerald-600 font-bold">{completionRate}%</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* KPI 6: Monthly Revenue */}
                                    <div
                                        onClick={() => setActiveTab('Payments')}
                                        className="bg-white dark:bg-[#14231b] p-5 rounded-2xl border-2 border-emerald-800/20 dark:border-emerald-700/30 shadow-sm hover:shadow-md hover:border-emerald-600 transition-all cursor-pointer space-y-3"
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10.5px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Monthly Revenue</span>
                                            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/60 text-[#0a4d2c] dark:text-emerald-300 rounded-xl">
                                                <IndianRupee className="w-4 h-4" />
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-2xl font-black text-emerald-700 dark:text-emerald-400">₹{monthlyRevenueCollected}</div>
                                            <div className="flex items-center justify-between mt-1 text-[11px] text-gray-500 dark:text-gray-400 font-medium">
                                                <span>Target: ₹{monthlyTargetRevenue}</span>
                                                <span className="text-emerald-600 font-bold">{monthlyRealizationRate}%</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* 4. PICKUP STATUS BREAKDOWN & MONTHLY REVENUE MATRIX */}
                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                                    {/* Left: Pickup Status Breakdown Widget (7 Cols) */}
                                    <div className="lg:col-span-7 bg-white dark:bg-[#14231b] p-6 rounded-3xl border-2 border-emerald-800/20 dark:border-emerald-700/30 shadow-sm space-y-5">
                                        <div className="flex flex-wrap items-center justify-between gap-3">
                                            <div>
                                                <h2 className="text-base font-black text-gray-900 dark:text-white flex items-center gap-2">
                                                    <Truck className="w-4 h-4 text-[#0a4d2c] dark:text-emerald-400" />
                                                    <span>Pickup Drives Lifecycle Overview</span>
                                                </h2>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                                    Status distribution across {totalPickups} panchayat waste collection drives
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => setActiveTab('Pickup Management')}
                                                className="text-xs font-bold text-[#0a4d2c] dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                                            >
                                                <span>View Full Log</span>
                                                <ChevronRight className="w-3.5 h-3.5" />
                                            </button>
                                        </div>

                                        {/* Proportional Multi-Segment Progress Bar */}
                                        <div className="space-y-2">
                                            <div className="h-3.5 w-full rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden flex shadow-inner">
                                                <div
                                                    style={{ width: `${totalPickups > 0 ? (completedPickups / totalPickups) * 100 : 0}%` }}
                                                    className="bg-[#0a4d2c] transition-all duration-500"
                                                    title={`Completed: ${completedPickups}`}
                                                />
                                                <div
                                                    style={{ width: `${totalPickups > 0 ? (scheduledPickups / totalPickups) * 100 : 0}%` }}
                                                    className="bg-blue-500 transition-all duration-500"
                                                    title={`Scheduled: ${scheduledPickups}`}
                                                />
                                                <div
                                                    style={{ width: `${totalPickups > 0 ? (pendingPickups / totalPickups) * 100 : 0}%` }}
                                                    className="bg-amber-400 transition-all duration-500"
                                                    title={`Pending: ${pendingPickups}`}
                                                />
                                                <div
                                                    style={{ width: `${totalPickups > 0 ? (missedPickups / totalPickups) * 100 : 0}%` }}
                                                    className="bg-rose-500 transition-all duration-500"
                                                    title={`Missed: ${missedPickups}`}
                                                />
                                            </div>

                                            <div className="flex flex-wrap items-center justify-between text-[11px] text-gray-500 dark:text-gray-400 font-medium px-1">
                                                <span>Lifecycle Realization: <strong>{completionRate}%</strong> Completed</span>
                                                <span>{pendingPickups + scheduledPickups} Pending Field Action</span>
                                            </div>
                                        </div>

                                        {/* 4 Status Metric Mini Cards */}
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                                            {/* Completed */}
                                            <div className="p-3.5 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 space-y-1">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">Completed</span>
                                                    <span className="w-2 h-2 rounded-full bg-[#0a4d2c]" />
                                                </div>
                                                <div className="text-xl font-black text-gray-900 dark:text-white">{completedPickups}</div>
                                                <p className="text-[10.5px] text-emerald-700 dark:text-emerald-400 font-semibold">
                                                    {totalPickups > 0 ? Math.round((completedPickups / totalPickups) * 100) : 0}% of drives
                                                </p>
                                            </div>

                                            {/* Scheduled */}
                                            <div className="p-3.5 rounded-2xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/50 space-y-1">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-800 dark:text-blue-300">Scheduled</span>
                                                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                                                </div>
                                                <div className="text-xl font-black text-gray-900 dark:text-white">{scheduledPickups}</div>
                                                <p className="text-[10.5px] text-blue-700 dark:text-blue-400 font-semibold">
                                                    Assigned to Worker
                                                </p>
                                            </div>

                                            {/* Pending */}
                                            <div className="p-3.5 rounded-2xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 space-y-1">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">Pending</span>
                                                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                                                </div>
                                                <div className="text-xl font-black text-gray-900 dark:text-white">{pendingPickups}</div>
                                                <p className="text-[10.5px] text-amber-700 dark:text-amber-400 font-semibold">
                                                    Awaiting Schedule
                                                </p>
                                            </div>

                                            {/* Missed / Failed */}
                                            <div className="p-3.5 rounded-2xl bg-rose-50/80 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/50 space-y-1">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[10px] font-bold uppercase tracking-wider text-rose-800 dark:text-rose-300">Missed</span>
                                                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                                                </div>
                                                <div className="text-xl font-black text-gray-900 dark:text-white">{missedPickups}</div>
                                                <p className="text-[10.5px] text-rose-700 dark:text-rose-400 font-semibold">
                                                    Action Required
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right: Monthly Payment Overview (5 Cols) */}
                                    <div className="lg:col-span-5 bg-white dark:bg-[#14231b] p-6 rounded-3xl border-2 border-emerald-800/20 dark:border-emerald-700/30 shadow-sm space-y-5">
                                        <div className="flex items-center justify-between gap-2">
                                            <div>
                                                <h2 className="text-base font-black text-gray-900 dark:text-white flex items-center gap-2">
                                                    <IndianRupee className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                                                    <span>₹50 Monthly Fee Ledger</span>
                                                </h2>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                                    Household user fee status
                                                </p>
                                            </div>

                                            {/* Month & Year Selectors */}
                                            <div className="flex items-center gap-1.5 shrink-0">
                                                <select
                                                    value={selectedMonth}
                                                    onChange={(e) => setSelectedMonth(Number(e.target.value))}
                                                    className="px-2.5 py-1 text-xs font-bold rounded-lg border border-emerald-200 dark:border-emerald-800 bg-[#f4f9f5] dark:bg-[#0c1510] text-gray-800 dark:text-white cursor-pointer"
                                                >
                                                    {months.map(m => (
                                                        <option key={m.value} value={m.value}>{m.name}</option>
                                                    ))}
                                                </select>
                                                <select
                                                    value={selectedYear}
                                                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                                                    className="px-2 py-1 text-xs font-bold rounded-lg border border-emerald-200 dark:border-emerald-800 bg-[#f4f9f5] dark:bg-[#0c1510] text-gray-800 dark:text-white cursor-pointer"
                                                >
                                                    <option value={2025}>2025</option>
                                                    <option value={2026}>2026</option>
                                                </select>
                                            </div>
                                        </div>

                                        {/* Revenue Realization Big Stat */}
                                        <div className="bg-gradient-to-br from-emerald-50 via-emerald-100/60 to-emerald-50 dark:from-emerald-950/40 dark:via-emerald-900/30 dark:to-emerald-950/40 p-4 rounded-2xl border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between">
                                            <div>
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                                                    Realized Collection
                                                </span>
                                                <div className="text-2xl font-black text-gray-900 dark:text-white mt-0.5">
                                                    ₹{monthlyRevenueCollected}
                                                    <span className="text-xs font-bold text-gray-500 dark:text-gray-400 font-normal ml-2">
                                                        / ₹{monthlyTargetRevenue} Target
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-emerald-600 text-white shadow-xs">
                                                    {monthlyRealizationRate}% Realized
                                                </span>
                                            </div>
                                        </div>

                                        {/* Status Counts: Paid, Pending Due, Unpaid */}
                                        <div className="grid grid-cols-3 gap-2.5 text-center">
                                            <div className="p-3 rounded-xl bg-[#f4f9f5] dark:bg-[#0c1510] border border-emerald-100 dark:border-emerald-800/50">
                                                <span className="text-[10px] font-bold uppercase text-emerald-700 dark:text-emerald-400">Paid</span>
                                                <div className="text-lg font-black text-gray-900 dark:text-white mt-0.5">{paidHouseholds.length}</div>
                                                <span className="text-[10px] text-gray-500 font-medium">₹{monthlyRevenueCollected}</span>
                                            </div>
                                            <div className="p-3 rounded-xl bg-[#f4f9f5] dark:bg-[#0c1510] border border-amber-100 dark:border-amber-900/40">
                                                <span className="text-[10px] font-bold uppercase text-amber-700 dark:text-amber-400">Pending</span>
                                                <div className="text-lg font-black text-gray-900 dark:text-white mt-0.5">{pendingCashHouseholds.length}</div>
                                                <span className="text-[10px] text-gray-500 font-medium">₹{monthlyRevenuePending}</span>
                                            </div>
                                            <div className="p-3 rounded-xl bg-[#f4f9f5] dark:bg-[#0c1510] border border-rose-100 dark:border-rose-900/40">
                                                <span className="text-[10px] font-bold uppercase text-rose-700 dark:text-rose-400">Unpaid</span>
                                                <div className="text-lg font-black text-gray-900 dark:text-white mt-0.5">{unpaidHouseholds.length}</div>
                                                <span className="text-[10px] text-gray-500 font-medium">₹{monthlyRevenueUnpaid}</span>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => setActiveTab('Payments')}
                                            className="w-full py-2 px-3 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100/80 text-[#0a4d2c] dark:text-emerald-300 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                                        >
                                            <span>Open Fee Collection Ledger</span>
                                            <ArrowRight className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>

                                {/* 5. COLLECTION TREND CHARTS FOR RECENT MONTHS */}
                                <div className="bg-white dark:bg-[#14231b] p-6 rounded-3xl border-2 border-emerald-800/20 dark:border-emerald-700/30 shadow-sm space-y-5">
                                    <div className="flex flex-wrap items-center justify-between gap-4">
                                        <div>
                                            <h2 className="text-base font-black text-gray-900 dark:text-white flex items-center gap-2">
                                                <TrendingUp className="w-4 h-4 text-[#0a4d2c] dark:text-emerald-400" />
                                                <span>Plastic Collection Historical Trends (Nov 2025 – Sep 2026)</span>
                                            </h2>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                                Month-over-month comparison of total pickup requests vs verified completed drives
                                            </p>
                                        </div>

                                        {/* Chart Legend */}
                                        <div className="flex items-center gap-4 text-xs font-bold">
                                            <div className="flex items-center gap-1.5">
                                                <span className="w-3 h-3 rounded-md bg-[#0a4d2c]" />
                                                <span className="text-gray-700 dark:text-gray-300">Completed Collections</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <span className="w-3 h-3 rounded-md bg-emerald-200 dark:bg-emerald-800" />
                                                <span className="text-gray-700 dark:text-gray-300">Total Drives Requested</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Responsive Interactive SVG Bar Chart */}
                                    <div className="pt-2">
                                        <div className="h-56 w-full relative flex items-end justify-between gap-1 sm:gap-2 px-2 pb-6 border-b border-gray-100 dark:border-emerald-900/60">
                                            {trendData.map((item, idx) => {
                                                const totalH = maxTrendVal > 0 ? (item.totalRequests / maxTrendVal) * 160 : 0;
                                                const completedH = maxTrendVal > 0 ? (item.completed / maxTrendVal) * 160 : 0;
                                                const isHovered = chartHoverMonth === item.label;

                                                return (
                                                    <div
                                                        key={idx}
                                                        className="flex-1 flex flex-col items-center h-full justify-end group relative cursor-pointer"
                                                        onMouseEnter={() => setChartHoverMonth(item.label)}
                                                        onMouseLeave={() => setChartHoverMonth(null)}
                                                    >
                                                        {/* Tooltip on Hover */}
                                                        {isHovered && (
                                                            <div className="absolute -top-16 z-30 bg-gray-900 text-white text-[11px] rounded-xl px-3 py-1.5 shadow-xl whitespace-nowrap pointer-events-none transition-all">
                                                                <div className="font-bold">{item.label}</div>
                                                                <div className="text-emerald-300">Completed: {item.completed}</div>
                                                                <div className="text-gray-300">Requested: {item.totalRequests}</div>
                                                            </div>
                                                        )}

                                                        {/* Dual Bars Container */}
                                                        <div className="w-full max-w-[32px] flex items-end justify-center gap-1">
                                                            {/* Total Requests Bar (Light Emerald) */}
                                                            <div
                                                                style={{ height: `${Math.max(6, totalH)}px` }}
                                                                className={`w-1/2 rounded-t-md transition-all duration-300 ${
                                                                    isHovered ? 'bg-emerald-300 dark:bg-emerald-700' : 'bg-emerald-200 dark:bg-emerald-900/60'
                                                                }`}
                                                            />
                                                            {/* Completed Bar (Forest Green) */}
                                                            <div
                                                                style={{ height: `${Math.max(6, completedH)}px` }}
                                                                className={`w-1/2 rounded-t-md transition-all duration-300 ${
                                                                    isHovered ? 'bg-[#0f6b3f]' : 'bg-[#0a4d2c]'
                                                                }`}
                                                            />
                                                        </div>

                                                        {/* Month Label */}
                                                        <span className={`absolute -bottom-5 text-[10px] sm:text-[11px] font-semibold whitespace-nowrap ${
                                                            isHovered ? 'text-[#0a4d2c] dark:text-emerald-400 font-bold' : 'text-gray-500 dark:text-gray-400'
                                                        }`}>
                                                            {item.label}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        <div className="flex items-center justify-between text-[11px] text-gray-400 dark:text-gray-500 pt-2 px-1">
                                            <span>Baseline (0 drives)</span>
                                            <span>Peak Capacity ({maxTrendVal} drives)</span>
                                        </div>
                                    </div>
                                </div>

                                {/* 6. WARD-WISE MATRIX & USER DEMOGRAPHICS */}
                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                                    {/* Left: Ward-Wise Collection Statistics (7 Cols) */}
                                    <div className="lg:col-span-7 bg-white dark:bg-[#14231b] p-6 rounded-3xl border-2 border-emerald-800/20 dark:border-emerald-700/30 shadow-sm space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h2 className="text-base font-black text-gray-900 dark:text-white flex items-center gap-2">
                                                    <Building2 className="w-4 h-4 text-[#0a4d2c] dark:text-emerald-400" />
                                                    <span>Ward-Wise Collection Statistics</span>
                                                </h2>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                                    Performance and efficiency across panchayat territorial wards
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => setActiveTab('Panchayat Desk > All Wards')}
                                                className="text-xs font-bold text-[#0a4d2c] dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                                            >
                                                <span>Manage All {totalWards} Wards</span>
                                                <ChevronRight className="w-3.5 h-3.5" />
                                            </button>
                                        </div>

                                        {/* Ward Performance Table */}
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left text-xs">
                                                <thead>
                                                    <tr className="border-b border-gray-100 dark:border-emerald-900/60 text-gray-500 dark:text-gray-400 uppercase text-[10px] font-bold">
                                                        <th className="py-2.5 px-3">Ward</th>
                                                        <th className="py-2.5 px-2">Citizens</th>
                                                        <th className="py-2.5 px-2">Drives</th>
                                                        <th className="py-2.5 px-2">Completed</th>
                                                        <th className="py-2.5 px-3">Efficiency</th>
                                                        <th className="py-2.5 px-3">Assigned Worker</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-50 dark:divide-emerald-950 font-medium">
                                                    {wardWiseStats.slice(0, 6).map((ward, idx) => (
                                                        <tr key={idx} className="hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30 transition-colors">
                                                            <td className="py-2.5 px-3 font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                                                                <span className="w-2 h-2 rounded-full bg-emerald-600" />
                                                                <span>{ward.wardId}</span>
                                                                <span className="text-gray-400 font-normal">({ward.wardName})</span>
                                                            </td>
                                                            <td className="py-2.5 px-2 text-gray-700 dark:text-gray-300">{ward.citizensCount}</td>
                                                            <td className="py-2.5 px-2 text-gray-700 dark:text-gray-300">{ward.totalRequests}</td>
                                                            <td className="py-2.5 px-2 font-bold text-[#0a4d2c] dark:text-emerald-400">{ward.completed}</td>
                                                            <td className="py-2.5 px-3">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-16 h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                                                                        <div
                                                                            style={{ width: `${ward.rate}%` }}
                                                                            className="h-full bg-[#0a4d2c] rounded-full"
                                                                        />
                                                                    </div>
                                                                    <span className="font-bold text-[11px] text-gray-700 dark:text-gray-300">{ward.rate}%</span>
                                                                </div>
                                                            </td>
                                                            <td className="py-2.5 px-3">
                                                                {ward.workerName !== 'Unassigned' ? (
                                                                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 dark:text-emerald-300">
                                                                        <UserCheck className="w-3 h-3 text-emerald-600" />
                                                                        {ward.workerName}
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400">Unassigned</span>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {/* Right: User Demographics & Waste Categories (5 Cols) */}
                                    <div className="lg:col-span-5 space-y-6">

                                        {/* Household vs Commercial Breakdown Card */}
                                        <div className="bg-white dark:bg-[#14231b] p-6 rounded-3xl border-2 border-emerald-800/20 dark:border-emerald-700/30 shadow-sm space-y-4">
                                            <div className="flex items-center justify-between">
                                                <h2 className="text-base font-black text-gray-900 dark:text-white flex items-center gap-2">
                                                    <Users className="w-4 h-4 text-[#0a4d2c] dark:text-emerald-400" />
                                                    <span>Household vs Commercial</span>
                                                </h2>
                                                <span className="text-xs font-bold text-gray-500 dark:text-gray-400">
                                                    {totalCitizens} Registered
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 space-y-1">
                                                    <div className="flex items-center gap-2 text-[#0a4d2c] dark:text-emerald-300">
                                                        <Home className="w-4 h-4" />
                                                        <span className="text-xs font-bold uppercase">Household</span>
                                                    </div>
                                                    <div className="text-2xl font-black text-gray-900 dark:text-white">{householdCount}</div>
                                                    <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold">{householdPct}% of userbase</p>
                                                </div>

                                                <div className="p-4 rounded-2xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/40 space-y-1">
                                                    <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
                                                        <ShoppingBag className="w-4 h-4" />
                                                        <span className="text-xs font-bold uppercase">Commercial</span>
                                                    </div>
                                                    <div className="text-2xl font-black text-gray-900 dark:text-white">{commercialCount}</div>
                                                    <p className="text-[11px] text-purple-700 dark:text-purple-400 font-semibold">{commercialPct}% shops / units</p>
                                                </div>
                                            </div>

                                            <div className="h-2.5 w-full rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden flex">
                                                <div style={{ width: `${householdPct}%` }} className="bg-[#0a4d2c]" title="Household" />
                                                <div style={{ width: `${commercialPct}%` }} className="bg-purple-600" title="Commercial" />
                                            </div>
                                        </div>

                                        {/* Waste Category Statistics Card */}
                                        <div className="bg-white dark:bg-[#14231b] p-6 rounded-3xl border-2 border-emerald-800/20 dark:border-emerald-700/30 shadow-sm space-y-4">
                                            <div className="flex items-center justify-between">
                                                <h2 className="text-base font-black text-gray-900 dark:text-white flex items-center gap-2">
                                                    <Layers className="w-4 h-4 text-[#0a4d2c] dark:text-emerald-400" />
                                                    <span>Plastic Categories Segregation</span>
                                                </h2>
                                                <span className="text-xs font-bold text-gray-500 dark:text-gray-400">
                                                    {totalPickups} audited
                                                </span>
                                            </div>

                                            <div className="space-y-2.5">
                                                {wasteCategories.map((cat, idx) => (
                                                    <div key={idx} className="space-y-1">
                                                        <div className="flex items-center justify-between text-xs">
                                                            <span className="font-bold text-gray-800 dark:text-gray-200">{cat.name}</span>
                                                            <span className="text-gray-500 dark:text-gray-400 font-semibold">{cat.count} drives ({cat.percentage}%)</span>
                                                        </div>
                                                        <div className="h-2 w-full rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                                                            <div
                                                                style={{ width: `${cat.percentage}%` }}
                                                                className="h-full bg-[#0a4d2c] rounded-full"
                                                            />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                    </div>
                                </div>

                                {/* 7. LIVE DUAL FEEDS: RECENT PICKUPS & RECENT PAYMENTS */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                                    {/* Left: Recent Pickup Activity Live Feed */}
                                    <div className="bg-white dark:bg-[#14231b] p-6 rounded-3xl border-2 border-emerald-800/20 dark:border-emerald-700/30 shadow-sm space-y-4">
                                        <div className="flex items-center justify-between">
                                            <h2 className="text-base font-black text-gray-900 dark:text-white flex items-center gap-2">
                                                <Activity className="w-4 h-4 text-[#0a4d2c] dark:text-emerald-400" />
                                                <span>Recent Pickup Drives Activity</span>
                                            </h2>
                                            <button
                                                onClick={() => setActiveTab('Pickup Management')}
                                                className="text-xs font-bold text-[#0a4d2c] dark:text-emerald-400 hover:underline cursor-pointer"
                                            >
                                                View All
                                            </button>
                                        </div>

                                        <div className="divide-y divide-gray-100 dark:divide-emerald-900/50 space-y-3">
                                            {recentPickupsList.length > 0 ? (
                                                recentPickupsList.map((p, idx) => {
                                                    const s = (p.status || '').toLowerCase();
                                                    const isComp = s === 'completed' || s === 'collected';
                                                    const isSched = s === 'scheduled' || s === 'accepted';
                                                    const isFail = s === 'failed' || s === 'missed';

                                                    return (
                                                        <div key={idx} className="pt-3 first:pt-0 flex items-center justify-between gap-3">
                                                            <div className="flex items-center gap-3 min-w-0">
                                                                <div className={`p-2.5 rounded-xl shrink-0 ${
                                                                    isComp ? 'bg-emerald-100 text-[#0a4d2c]' :
                                                                    isSched ? 'bg-blue-100 text-blue-800' :
                                                                    isFail ? 'bg-rose-100 text-rose-800' :
                                                                    'bg-amber-100 text-amber-800'
                                                                }`}>
                                                                    <Truck className="w-4 h-4" />
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <p className="text-xs font-bold text-gray-900 dark:text-white truncate">
                                                                        {p.citizenName || p.citizenId || 'Citizen'}
                                                                    </p>
                                                                    <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                                                                        {p.wardId} • {p.overallCategory || 'Recyclable Plastic'} • {p.estimatedVolume || 'Medium'}
                                                                    </p>
                                                                </div>
                                                            </div>

                                                            <div className="text-right shrink-0">
                                                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                                                                    isComp ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                                                                    isSched ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' :
                                                                    isFail ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' :
                                                                    'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                                                }`}>
                                                                    {p.status || 'Pending'}
                                                                </span>
                                                                <p className="text-[10px] text-gray-400 mt-1">
                                                                    {p.collectionDate ? new Date(p.collectionDate).toLocaleDateString() : 'Pending Date'}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    );
                                                })
                                            ) : (
                                                <p className="text-xs text-gray-500 text-center py-6">No recent pickups logged.</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Right: Recent Fee Payments Live Feed */}
                                    <div className="bg-white dark:bg-[#14231b] p-6 rounded-3xl border-2 border-emerald-800/20 dark:border-emerald-700/30 shadow-sm space-y-4">
                                        <div className="flex items-center justify-between">
                                            <h2 className="text-base font-black text-gray-900 dark:text-white flex items-center gap-2">
                                                <IndianRupee className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                                                <span>Recent User Fee Transactions</span>
                                            </h2>
                                            <button
                                                onClick={() => setActiveTab('Payments')}
                                                className="text-xs font-bold text-[#0a4d2c] dark:text-emerald-400 hover:underline cursor-pointer"
                                            >
                                                View All
                                            </button>
                                        </div>

                                        <div className="divide-y divide-gray-100 dark:divide-emerald-900/50 space-y-3">
                                            {recentPaymentsList.length > 0 ? (
                                                recentPaymentsList.map((pay, idx) => (
                                                    <div key={idx} className="pt-3 first:pt-0 flex items-center justify-between gap-3">
                                                        <div className="flex items-center gap-3 min-w-0">
                                                            <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-[#0a4d2c] dark:text-emerald-300 shrink-0">
                                                                <CheckCircle2 className="w-4 h-4" />
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="text-xs font-bold text-gray-900 dark:text-white truncate">
                                                                    {pay.citizenName}
                                                                </p>
                                                                <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                                                                    {pay.wardId} • House #{pay.houseNumber} • {pay.paymentMethod || 'Online'}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        <div className="text-right shrink-0">
                                                            <div className="text-sm font-black text-[#0a4d2c] dark:text-emerald-400">
                                                                +₹{pay.amount || 50}
                                                            </div>
                                                            <p className="text-[10px] text-gray-400 mt-0.5">
                                                                {pay.paidAt ? new Date(pay.paidAt).toLocaleDateString() : 'Paid'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <p className="text-xs text-gray-500 text-center py-6">No recent fee payments logged.</p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* 8. QUICK MANAGEMENT COMMAND SHORTCUTS */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                            Administrative Quick Operations
                                        </h3>
                                        <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold">
                                            Direct Desk Navigation
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                                        <div
                                            onClick={() => setActiveTab('Pickup Management')}
                                            className="bg-white dark:bg-[#14231b] p-4 rounded-2xl border-2 border-emerald-800/15 dark:border-emerald-700/30 hover:border-emerald-600 transition-all cursor-pointer space-y-2 group shadow-xs"
                                        >
                                            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-[#0a4d2c] dark:text-emerald-300 w-fit group-hover:bg-[#0a4d2c] group-hover:text-white transition-colors">
                                                <Truck className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <h4 className="text-xs font-bold text-gray-900 dark:text-white">Pickups</h4>
                                                <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">Drives & Logs</p>
                                            </div>
                                        </div>

                                        <div
                                            onClick={() => setActiveTab('Collection Schedule')}
                                            className="bg-white dark:bg-[#14231b] p-4 rounded-2xl border-2 border-emerald-800/15 dark:border-emerald-700/30 hover:border-emerald-600 transition-all cursor-pointer space-y-2 group shadow-xs"
                                        >
                                            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-[#0a4d2c] dark:text-emerald-300 w-fit group-hover:bg-[#0a4d2c] group-hover:text-white transition-colors">
                                                <Calendar className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <h4 className="text-xs font-bold text-gray-900 dark:text-white">Schedule</h4>
                                                <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">15th–25th Dates</p>
                                            </div>
                                        </div>

                                        <div
                                            onClick={() => setActiveTab('Payments')}
                                            className="bg-white dark:bg-[#14231b] p-4 rounded-2xl border-2 border-emerald-800/15 dark:border-emerald-700/30 hover:border-emerald-600 transition-all cursor-pointer space-y-2 group shadow-xs"
                                        >
                                            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-[#0a4d2c] dark:text-emerald-300 w-fit group-hover:bg-[#0a4d2c] group-hover:text-white transition-colors">
                                                <IndianRupee className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <h4 className="text-xs font-bold text-gray-900 dark:text-white">Payments</h4>
                                                <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">₹50 Ledger</p>
                                            </div>
                                        </div>

                                        <div
                                            onClick={() => setActiveTab('Panchayat Desk > All Wards')}
                                            className="bg-white dark:bg-[#14231b] p-4 rounded-2xl border-2 border-emerald-800/15 dark:border-emerald-700/30 hover:border-emerald-600 transition-all cursor-pointer space-y-2 group shadow-xs"
                                        >
                                            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-[#0a4d2c] dark:text-emerald-300 w-fit group-hover:bg-[#0a4d2c] group-hover:text-white transition-colors">
                                                <Building2 className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <h4 className="text-xs font-bold text-gray-900 dark:text-white">Wards</h4>
                                                <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">22 Segments</p>
                                            </div>
                                        </div>

                                        <div
                                            onClick={() => setActiveTab('Worker Desk > Worker Details')}
                                            className="bg-white dark:bg-[#14231b] p-4 rounded-2xl border-2 border-emerald-800/15 dark:border-emerald-700/30 hover:border-emerald-600 transition-all cursor-pointer space-y-2 group shadow-xs"
                                        >
                                            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-[#0a4d2c] dark:text-emerald-300 w-fit group-hover:bg-[#0a4d2c] group-hover:text-white transition-colors">
                                                <UserCheck className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <h4 className="text-xs font-bold text-gray-900 dark:text-white">Workers</h4>
                                                <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">Karma Sena</p>
                                            </div>
                                        </div>

                                        <div
                                            onClick={() => setActiveTab('Reports')}
                                            className="bg-white dark:bg-[#14231b] p-4 rounded-2xl border-2 border-emerald-800/15 dark:border-emerald-700/30 hover:border-emerald-600 transition-all cursor-pointer space-y-2 group shadow-xs"
                                        >
                                            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-[#0a4d2c] dark:text-emerald-300 w-fit group-hover:bg-[#0a4d2c] group-hover:text-white transition-colors">
                                                <BarChart3 className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <h4 className="text-xs font-bold text-gray-900 dark:text-white">Reports</h4>
                                                <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">Audit Export</p>
                                            </div>
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

                        {(activeTab === 'Pickup Requests' || activeTab === 'Pickup Management' || activeTab === 'Waste Pickups') && (
                            <AdminPickups />
                        )}

                        {(activeTab === 'Collection Schedule' || activeTab === 'Monthly Schedule') && (
                            <AdminCollectionSchedule />
                        )}

                        {(activeTab === 'Payments' || activeTab === 'Payment Records') && (
                            <AdminPayments />
                        )}

                        {(activeTab === 'Reports' || activeTab === 'Operational Reports') && (
                            <AdminReports />
                        )}

                        {activeTab !== 'Dashboard' &&
                            activeTab !== 'Pickup Requests' &&
                            activeTab !== 'Pickup Management' &&
                            activeTab !== 'Waste Pickups' &&
                            activeTab !== 'Collection Schedule' &&
                            activeTab !== 'Monthly Schedule' &&
                            activeTab !== 'Payments' &&
                            activeTab !== 'Payment Records' &&
                            activeTab !== 'Reports' &&
                            activeTab !== 'Operational Reports' &&
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
