import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import WorkerSidebar from '../components/WorkerSidebar';
import Footer from '../components/Footer';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Phone, ShieldCheck, Building2, CheckCircle2, MapPin, BadgeCheck, Edit3, X, Save, AlertCircle } from 'lucide-react';
import { getUserByEmail, updateUserProfile } from '../services/userService';

const WorkerDashboard = () => {
    const [activeTab, setActiveTab] = useState('Dashboard');
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const navigate = useNavigate();

    const initialUser = JSON.parse(localStorage.getItem('user') || '{}');
    const [profile, setProfile] = useState({
        fullName: initialUser.fullName || localStorage.getItem('userName') || 'Worker',
        email: initialUser.email || '',
        phone: initialUser.phoneNumber || initialUser.phone || '',
        role: initialUser.role || 'Haritha Karma Sena Worker'
    });

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editFormData, setEditFormData] = useState({ fullName: '', phone: '' });
    const [editError, setEditError] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');

    // Fetch user profile directly from database by email
    const fetchProfileFromDb = async () => {
        if (!profile.email) return;
        try {
            const dbData = await getUserByEmail(profile.email);
            if (dbData) {
                const updated = {
                    fullName: dbData.fullName || profile.fullName,
                    email: dbData.email || profile.email,
                    phone: dbData.phoneNumber || profile.phone,
                    role: dbData.role || profile.role
                };
                setProfile(updated);

                // Update local storage so rest of app stays in sync
                const currentUserObj = JSON.parse(localStorage.getItem('user') || '{}');
                localStorage.setItem('user', JSON.stringify({
                    ...currentUserObj,
                    fullName: updated.fullName,
                    phoneNumber: updated.phone
                }));
                localStorage.setItem('userName', updated.fullName);
            }
        } catch (err) {
            console.log('Error fetching user profile from database:', err);
        }
    };

    useEffect(() => {
        fetchProfileFromDb();
    }, []);

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

    const handleOpenEditModal = () => {
        setEditFormData({
            fullName: profile.fullName,
            phone: profile.phone
        });
        setEditError('');
        setIsEditModalOpen(true);
    };

    const handleSaveProfile = async (e) => {
        e.preventDefault();
        setEditError('');

        const cleanPhone = editFormData.phone.replace(/\D/g, '').slice(0, 10);
        if (!cleanPhone) {
            setEditError('Mobile number is required.');
            return;
        }

        if (!/^[6-9]/.test(cleanPhone)) {
            setEditError('Mobile number must start with 6, 7, 8, or 9.');
            return;
        }

        if (cleanPhone.length !== 10) {
            setEditError('Mobile number must contain exactly 10 digits.');
            return;
        }

        if (!editFormData.fullName.trim() || editFormData.fullName.trim().length < 3) {
            setEditError('Full Name must contain at least 3 characters.');
            return;
        }

        try {
            setIsSaving(true);
            const res = await updateUserProfile({
                email: profile.email,
                fullName: editFormData.fullName.trim(),
                phoneNumber: cleanPhone
            });

            setProfile((prev) => ({
                ...prev,
                fullName: editFormData.fullName.trim(),
                phone: cleanPhone
            }));

            // Sync localStorage
            const currentUserObj = JSON.parse(localStorage.getItem('user') || '{}');
            localStorage.setItem('user', JSON.stringify({
                ...currentUserObj,
                fullName: editFormData.fullName.trim(),
                phoneNumber: cleanPhone
            }));
            localStorage.setItem('userName', editFormData.fullName.trim());

            setIsEditModalOpen(false);
            setSuccessMsg('Profile updated successfully!');
            setTimeout(() => setSuccessMsg(''), 4000);
        } catch (err) {
            console.log('Update Profile Error:', err);
            if (err.response && typeof err.response.data === 'string') {
                setEditError(err.response.data);
            } else if (err.response && err.response.data?.message) {
                setEditError(err.response.data.message);
            } else {
                setEditError('Failed to update profile. Please try again.');
            }
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#f4f9f5] flex flex-col font-sans">
            {/* Top Header */}
            <Header />

            {/* Main Content Layout with Sidebar */}
            <div className="flex-1 flex">
                <WorkerSidebar
                    activeItem={activeTab}
                    setActiveItem={setActiveTab}
                    onLogout={handleLogout}
                    isCollapsed={isSidebarCollapsed}
                    onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                    isOpen={isMobileSidebarOpen}
                    onClose={() => setIsMobileSidebarOpen(false)}
                />

                {/* Main Workspace */}
                <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-[#f3f7f5] overflow-y-auto">
                    {successMsg && (
                        <div className="max-w-4xl mx-auto mb-4 p-4 bg-emerald-50 border border-emerald-300 text-emerald-800 text-sm font-bold rounded-xl flex items-center gap-2 shadow-xs">
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                            <span>{successMsg}</span>
                        </div>
                    )}

                    {activeTab === 'Profile' ? (
                        <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
                            {/* Top Hero Banner */}
                            <div className="bg-gradient-to-r from-[#0f5b37] via-[#0a4d2c] to-emerald-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
                                <div className="absolute right-0 top-0 translate-x-1/4 -translate-y-1/4 w-72 h-72 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />

                                <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
                                    <div className="flex flex-col sm:flex-row items-center gap-6">
                                        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-white/10 border-4 border-white/20 flex items-center justify-center text-3xl font-extrabold shadow-lg shrink-0 backdrop-blur-xs text-emerald-200">
                                            {profile.fullName[0] ? profile.fullName[0].toUpperCase() : <User className="w-12 h-12" />}
                                        </div>

                                        <div className="space-y-2">
                                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 text-xs font-semibold">
                                                <BadgeCheck className="w-4 h-4 text-emerald-300" />
                                                <span>Haritha Karma Sena Worker</span>
                                            </div>

                                            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                                                {profile.fullName}
                                            </h1>

                                            <p className="text-xs sm:text-sm text-emerald-100/80 font-medium">
                                                Smart Recyclable Waste Collection & Management System
                                            </p>

                                            <div className="pt-1 flex flex-wrap items-center justify-center sm:justify-start gap-3">
                                                <span className="inline-flex items-center gap-1.5 text-xs bg-white/15 px-3 py-1 rounded-full text-emerald-100 font-medium">
                                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" /> Account Active
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleOpenEditModal}
                                        className="py-2.5 px-5 bg-white text-[#0f5b37] hover:bg-emerald-50 font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center gap-2 shrink-0 cursor-pointer"
                                    >
                                        <Edit3 className="w-4 h-4" />
                                        <span>Edit Profile</span>
                                    </button>
                                </div>
                            </div>

                            {/* Details Cards Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Personal Information */}
                                <div className="bg-white rounded-2xl p-6 border border-emerald-100 shadow-xs space-y-4">
                                    <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                                        <div className="flex items-center gap-2.5">
                                            <div className="p-2 rounded-xl bg-emerald-50 text-[#0f5b37]">
                                                <User className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h2 className="text-base font-bold text-gray-900">Personal Information</h2>
                                                <p className="text-xs text-gray-500">Contact & personal profile details</p>
                                            </div>
                                        </div>

                                        <button
                                            onClick={handleOpenEditModal}
                                            className="text-xs font-bold text-[#0f5b37] hover:underline flex items-center gap-1 cursor-pointer"
                                        >
                                            <Edit3 className="w-3.5 h-3.5" /> Edit
                                        </button>
                                    </div>

                                    <div className="space-y-3 pt-1">
                                        <div>
                                            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Full Name</label>
                                            <p className="text-sm font-semibold text-gray-800 mt-0.5">{profile.fullName}</p>
                                        </div>

                                        <div>
                                            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Email Address</label>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <Mail className="w-4 h-4 text-emerald-600 shrink-0" />
                                                <p className="text-sm font-semibold text-gray-800">{profile.email}</p>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Mobile Number</label>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <Phone className="w-4 h-4 text-emerald-600 shrink-0" />
                                                <p className="text-sm font-bold text-[#0f5b37]">{profile.phone || 'N/A'}</p>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Role / Account Type</label>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                                                <p className="text-sm font-semibold text-gray-800 capitalize">{profile.role}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Work & Organization Info */}
                                <div className="bg-white rounded-2xl p-6 border border-emerald-100 shadow-xs space-y-4">
                                    <div className="flex items-center gap-2.5 pb-3 border-b border-gray-100">
                                        <div className="p-2 rounded-xl bg-emerald-50 text-[#0f5b37]">
                                            <Building2 className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h2 className="text-base font-bold text-gray-900">Organization & Unit</h2>
                                            <p className="text-xs text-gray-500">Government service affiliation</p>
                                        </div>
                                    </div>

                                    <div className="space-y-3 pt-1">
                                        <div>
                                            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Organization</label>
                                            <p className="text-sm font-semibold text-gray-800 mt-0.5">Haritha Karma Sena</p>
                                        </div>

                                        <div>
                                            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Department</label>
                                            <p className="text-sm font-semibold text-gray-800 mt-0.5">Local Self Government Department (LSGD), Kerala</p>
                                        </div>

                                        <div>
                                            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Service Scope</label>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                                                <p className="text-sm font-semibold text-gray-800">Smart Waste Collection & Recycling</p>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Status</label>
                                            <div className="mt-0.5">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                                                    Active Worker
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white rounded-2xl p-6 border border-emerald-100/80 shadow-xs">
                            <h1 className="text-2xl font-bold text-gray-800 tracking-tight">
                                {activeTab === 'Dashboard' ? 'Welcome to Dashboard' : activeTab}
                            </h1>
                            <p className="text-sm text-gray-500 mt-2">
                                Welcome to the Haritha Karma Sena Worker Portal. View assigned collection schedules, ward details, and task management options here.
                            </p>
                        </div>
                    )}
                </main>
            </div>

            {/* Edit Profile Modal */}
            {isEditModalOpen && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
                    <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative border border-emerald-100 animate-fade-in">
                        <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-5">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-2xl bg-emerald-50 text-[#0f5b37]">
                                    <Edit3 className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">Edit Profile</h3>
                                    <p className="text-xs text-gray-500">Update your details in the database</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsEditModalOpen(false)}
                                className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {editError && (
                            <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-xs font-semibold rounded-lg flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                                <span>{editError}</span>
                            </div>
                        )}

                        <form onSubmit={handleSaveProfile} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                                    Full Name *
                                </label>
                                <div className="relative rounded-xl shadow-xs">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                                        <User className="w-4 h-4" />
                                    </div>
                                    <input
                                        type="text"
                                        value={editFormData.fullName}
                                        onChange={(e) => setEditFormData({ ...editFormData, fullName: e.target.value })}
                                        placeholder="Enter your full name"
                                        className="w-full pl-10 pr-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                                    Email Address (Read Only)
                                </label>
                                <div className="relative rounded-xl shadow-xs">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                                        <Mail className="w-4 h-4" />
                                    </div>
                                    <input
                                        type="email"
                                        value={profile.email}
                                        disabled
                                        className="w-full pl-10 pr-3 py-2.5 text-sm bg-gray-100 border border-gray-200 rounded-xl text-gray-500 cursor-not-allowed"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                                    Mobile Number * (10 Digits)
                                </label>
                                <div className="relative rounded-xl shadow-xs">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                                        <Phone className="w-4 h-4" />
                                    </div>
                                    <input
                                        type="tel"
                                        maxLength={10}
                                        value={editFormData.phone}
                                        onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                                        placeholder="10-digit mobile number (e.g. 9876543210)"
                                        className="w-full pl-10 pr-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all"
                                    />
                                </div>
                            </div>

                            <div className="pt-3 flex items-center justify-end gap-3 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => setIsEditModalOpen(false)}
                                    className="py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="py-2.5 px-5 bg-[#0f5b37] hover:bg-[#0a4d2c] text-white font-bold text-xs rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
                                >
                                    <Save className="w-4 h-4" />
                                    <span>{isSaving ? 'Saving...' : 'Save Profile'}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Footer */}
            <Footer />
        </div>
    );
};

export default WorkerDashboard;
