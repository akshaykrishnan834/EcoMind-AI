import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Search,
  Bell,
  X,
  LayoutGrid,
  Truck,
  MessageSquare,
  Calendar,
  MapPin,
  CreditCard,
  FileText,
  Bot,
  Sliders,
  HelpCircle,
  User,
  Users,
  HardHat,
  Route,
  History,
  IndianRupee,
  BarChart3,
  Building2,
  Plus,
  ChevronRight,
  ChevronDown,
  CornerDownLeft,
  Map as MapIcon,
  LogOut,
  Leaf
} from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import ecomindlogo from '../assets/images/logo-ecomind.png';

// All sidebar menu registry for intelligent search
const SIDEBAR_REGISTRY = {
  citizen: [
    { id: 'Dashboard', label: 'Dashboard', icon: LayoutGrid, desc: 'Overview, eco-points & recent activity', keywords: ['home', 'overview', 'stats', 'points'] },
    { id: 'Pickup Request', label: 'Pickup Request', icon: Truck, desc: 'Schedule a doorstep recyclable pickup', keywords: ['pickup', 'request', 'book', 'schedule pickup', 'waste'] },
    { id: 'Messages', label: 'Worker Chat', icon: MessageSquare, desc: 'Direct chat with assigned HKS worker', keywords: ['chat', 'message', 'worker chat', 'talk', 'contact'] },
    { id: 'Collection Schedule', label: 'My Collection Schedule', icon: Calendar, desc: 'Ward pickup calendar & monthly schedule', keywords: ['schedule', 'calendar', 'dates', 'when', 'routine'] },
    { id: 'My Location', label: 'My Location', icon: MapPin, desc: 'House GPS coordinates & ward details', keywords: ['location', 'map', 'gps', 'address', 'house', 'ward'] },
    { id: 'Monthly Payments', label: 'Monthly Payments', icon: CreditCard, desc: '₹50 user fee payment & digital receipts', keywords: ['payment', 'pay', 'fee', 'receipt', 'bill', 'money', 'dues'] },
    { id: 'Collection Records', label: 'Collection Records', icon: FileText, desc: 'Pickup history, weights & OTP tokens', keywords: ['records', 'history', 'past pickups', 'verification', 'token'] },
    { id: 'AI Assistant', label: 'Mittu AI Chat', icon: Bot, desc: 'Computer vision waste segregation guide', keywords: ['ai', 'mittu', 'assistant', 'bot', 'plastic', 'scan', 'polymer'] },
    { id: 'Settings', label: 'Theme & Settings', icon: Sliders, desc: 'Preferences, notifications & theme', keywords: ['settings', 'preferences', 'dark mode', 'theme', 'config'] },
    { id: 'Help & Guidelines', label: 'Help & Guidelines', icon: HelpCircle, desc: 'Segregation rules & HKS support', keywords: ['help', 'guide', 'guidelines', 'rules', 'faq', 'support'] },
    { id: 'Profile', label: 'My Profile', icon: User, desc: 'Citizen profile & personal details', keywords: ['profile', 'account', 'user', 'my details'] },
  ],
  worker: [
    { id: 'Dashboard', label: 'Dashboard', icon: LayoutGrid, desc: 'Daily overview, targets & progress', keywords: ['home', 'overview', 'stats', 'summary'] },
    { id: 'Smart Collection', label: 'Smart Collection', icon: Route, desc: 'Optimized sequential door-to-door route', keywords: ['smart', 'collection', 'route', 'sequential', 'houses', 'pickup'] },
    { id: 'Collection Map', label: 'Collection Map', icon: MapIcon, desc: 'Live GPS navigation & route tracking', keywords: ['map', 'gps', 'navigation', 'live map', 'route map'] },
    { id: 'Pickup Requests', label: 'Plastic Pickups', icon: Truck, desc: 'Pending citizen pickup requests in ward', keywords: ['pickups', 'requests', 'plastic', 'tasks'] },
    { id: 'Messages', label: 'Citizen Chat', icon: MessageSquare, desc: 'Direct chat with ward households', keywords: ['chat', 'messages', 'citizen chat', 'contact'] },
    { id: 'Collection History', label: 'Collection History', icon: History, desc: 'Past collections, weights & CSV export', keywords: ['history', 'records', 'past', 'completed', 'export'] },
    { id: 'Notifications', label: 'Notifications', icon: Bell, desc: 'Operational alerts & ward updates', keywords: ['notifications', 'alerts', 'updates'] },
    { id: 'Payment Collection', label: 'Payment Collection', icon: IndianRupee, desc: 'Log ₹50 cash or UPI user fee collections', keywords: ['payment', 'fee', 'money', 'rupees', 'collect fee', 'cash', 'upi'] },
    { id: 'My Location', label: 'My Location / Zone', icon: MapPin, desc: 'Ward coverage boundary & GPS check-in', keywords: ['location', 'zone', 'boundary', 'ward area', 'gps'] },
    { id: 'Assigned Citizens', label: 'Ward Citizens', icon: Users, desc: 'Directory of registered ward households', keywords: ['citizens', 'residents', 'houses', 'users', 'directory'] },
    { id: 'Profile', label: 'My Profile', icon: User, desc: 'Worker ID & credentials', keywords: ['profile', 'account', 'worker info'] },
  ],
  admin: [
    { id: 'Dashboard', label: 'Dashboard', icon: LayoutGrid, desc: 'Executive command center & analytics', keywords: ['home', 'overview', 'command center', 'stats'] },
    { id: 'All Wards', label: 'All Wards', icon: MapPin, desc: 'Ward boundaries, delimitation & lists', keywords: ['wards', 'all wards', 'boundary', 'delimitation', 'zones'] },
    { id: 'Add Ward', label: 'Add Ward', icon: Plus, desc: 'Register a new ward & coordinates', keywords: ['add ward', 'new ward', 'create ward'] },
    { id: 'All Workers', label: 'All Workers', icon: HardHat, desc: 'Haritha Karma Sena workforce directory', keywords: ['workers', 'all workers', 'hks', 'staff', 'employees'] },
    { id: 'Add Worker', label: 'Add Worker', icon: Plus, desc: 'Onboard a new collection worker', keywords: ['add worker', 'new worker', 'hire worker', 'register worker'] },
    { id: 'All Users', label: 'All Users', icon: Users, desc: 'Registered citizens & verification status', keywords: ['users', 'all users', 'citizens', 'residents', 'accounts'] },
    { id: 'Pickup Management', label: 'Pickup Management', icon: Truck, desc: 'Monitor ward-level pickup requests', keywords: ['pickups', 'pickup management', 'requests', 'waste collection'] },
    { id: 'Collection Schedule', label: 'Collection Schedule', icon: Calendar, desc: 'Panchayat collection timetable', keywords: ['schedule', 'calendar', 'timetable', 'collection schedule'] },
    { id: 'Payments', label: 'Payments', icon: IndianRupee, desc: 'Fee collections & financial audits', keywords: ['payments', 'revenue', 'fees', 'audit', 'financials'] },
    { id: 'Reports', label: 'Reports', icon: BarChart3, desc: 'Generate system audits & statistics', keywords: ['reports', 'analytics', 'statistics', 'export', 'audit'] },
    { id: 'Panchayat Desk', label: 'Panchayat Desk', icon: Building2, desc: 'LSGD official notices & ward desk', keywords: ['panchayat', 'desk', 'lsgd', 'government', 'notices'] },
  ]
};

export const Header = ({ onSelectTab, activeTab, role: propRole, onLogout: propOnLogout, user: propUser }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const searchContainerRef = useRef(null);
  const searchInputRef = useRef(null);
  const notifRef = useRef(null);
  const userMenuRef = useRef(null);

  // Stored user object and user name
  const [userObj, setUserObj] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('user') || '{}');
    } catch {
      return {};
    }
  });

  const [storedUserName, setStoredUserName] = useState(() => {
    return localStorage.getItem('userName') || '';
  });

  useEffect(() => {
    const syncUser = () => {
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

  // Determine current role based on prop, pathname, or stored user
  const effectiveRole = useMemo(() => {
    if (propRole) return propRole.toLowerCase();
    const path = location.pathname.toLowerCase();
    if (path.includes('worker')) return 'worker';
    if (path.includes('admin')) return 'admin';
    if (path.includes('citizen')) return 'citizen';

    try {
      const stored = JSON.parse(localStorage.getItem('user') || '{}');
      const roleStr = (stored.role || stored.userType || '').toLowerCase();
      if (roleStr.includes('worker')) return 'worker';
      if (roleStr.includes('admin')) return 'admin';
      if (roleStr.includes('citizen')) return 'citizen';
    } catch {
      // ignore
    }
    return 'citizen';
  }, [propRole, location.pathname]);

  const effectiveUserName = useMemo(() => {
    if (propUser?.fullName) return propUser.fullName;
    if (propUser?.name) return propUser.name;
    const name = storedUserName || userObj.fullName || userObj.name;
    if (name) return name;
    if (effectiveRole === 'admin') return 'Administrator';
    if (effectiveRole === 'worker') return 'HKS Worker';
    return 'Akshay Krishnan';
  }, [propUser, storedUserName, userObj, effectiveRole]);

  const userInitial = useMemo(() => {
    const trimmed = (effectiveUserName || '').trim();
    return trimmed ? trimmed[0].toUpperCase() : 'U';
  }, [effectiveUserName]);

  const roleLabel = useMemo(() => {
    if (effectiveRole === 'worker') return 'Worker Panel';
    if (effectiveRole === 'admin') return 'Admin Panel';
    return 'Citizen Panel';
  }, [effectiveRole]);

  const handleLogout = () => {
    if (propOnLogout) {
      propOnLogout();
      return;
    }
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userName');
    sessionStorage.clear();
    navigate('/', { replace: true });
  };

  const handleProfileClick = () => {
    setUserDropdownOpen(false);
    if (onSelectTab) {
      onSelectTab('Profile');
    }
    window.dispatchEvent(
      new CustomEvent('ecomind:navigate-tab', {
        detail: 'Profile'
      })
    );
    if (location.pathname === '/' || location.pathname.includes('/login')) {
      if (effectiveRole === 'worker') navigate('/worker');
      else if (effectiveRole === 'admin') navigate('/admin');
      else navigate('/citizen');
    }
  };

  // Available items for the current role
  const availableItems = useMemo(() => {
    return SIDEBAR_REGISTRY[effectiveRole] || SIDEBAR_REGISTRY.citizen;
  }, [effectiveRole]);

  // Filter items matching the search query
  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return availableItems.filter((item) => {
      const matchLabel = item.label.toLowerCase().includes(q);
      const matchId = item.id.toLowerCase().includes(q);
      const matchDesc = item.desc.toLowerCase().includes(q);
      const matchKeywords = item.keywords?.some((k) => k.toLowerCase().includes(q));
      return matchLabel || matchId || matchDesc || matchKeywords;
    });
  }, [searchQuery, availableItems]);

  // Open item on the sidebar and in the dashboard
  const handleOpenItem = (item) => {
    if (!item) return;

    // 1. Trigger parent onSelectTab callback if provided
    if (onSelectTab) {
      onSelectTab(item.id);
    }

    // 2. Dispatch global event for any listening dashboard / sidebar
    window.dispatchEvent(
      new CustomEvent('ecomind:navigate-tab', {
        detail: item.id
      })
    );

    // 3. Close search dropdown and clear query
    setIsSearchOpen(false);
    setSearchQuery('');
    setSelectedIndex(0);
  };

  // Keyboard navigation inside search dropdown
  const handleKeyDown = (e) => {
    if (!isSearchOpen || filteredItems.length === 0) {
      if (e.key === 'Enter' && searchQuery.trim() && filteredItems.length > 0) {
        handleOpenItem(filteredItems[0]);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % filteredItems.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % filteredItems.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        handleOpenItem(filteredItems[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsSearchOpen(false);
    }
  };

  // Global Ctrl+K / Cmd+K listener to focus search bar
  useEffect(() => {
    const handleGlobalKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleGlobalKey);
    return () => window.removeEventListener('keydown', handleGlobalKey);
  }, []);

  // Close search, notification, and user dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setIsSearchOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset selected index when filtered items change
  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredItems]);

  return (
    <header className="sticky top-0 z-40 w-full bg-white/85 dark:bg-[#0c0e12]/85 backdrop-blur-xl border-b border-slate-200/80 dark:border-white/10 shadow-xs transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3 sm:gap-6">
        
        {/* 1. Left: EcoMind AI Logo & Title */}
        <Link
          to="/"
          className="flex items-center gap-3 group focus:outline-none shrink-0"
          title="EcoMind AI Home"
        >
          <div className="relative">
            <div className="absolute -inset-1 rounded-xl bg-emerald-500/20 blur-xs group-hover:bg-emerald-500/40 transition-colors" />
            <img
              src={ecomindlogo}
              alt="EcoMind AI Logo"
              className="relative w-9 h-9 object-contain drop-shadow-xs group-hover:scale-105 transition-transform duration-200"
            />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5 leading-none">
              EcoMind AI
            </span>
            <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 tracking-tight hidden sm:block mt-0.5">
              Smart Recyclable Waste System
            </span>
          </div>
        </Link>

        {/* 2. Center: Interactive Search Bar with Sidebar Open Navigation */}
        <div className="flex-1 max-w-md mx-2 sm:mx-6 relative" ref={searchContainerRef}>
          <div className="relative w-full">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
              <Search className="w-4 h-4" />
            </div>
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearchOpen(true);
              }}
              onFocus={() => {
                if (searchQuery.trim()) setIsSearchOpen(true);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Search sidebar items (e.g. Pickup, Chat, Schedule, Payments)..."
              className="w-full pl-9.5 pr-8 py-2 text-xs sm:text-sm rounded-xl bg-slate-100/90 dark:bg-[#15181e] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 border border-slate-200/80 dark:border-white/10 focus:border-emerald-500/50 dark:focus:border-emerald-400/50 focus:bg-white dark:focus:bg-[#1b1f27] focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all duration-200 shadow-2xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setIsSearchOpen(false);
                }}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Search Dropdown Results for Sidebar Items */}
          {isSearchOpen && searchQuery.trim() && (
            <div className="absolute top-full left-0 right-0 mt-2 rounded-2xl bg-white dark:bg-[#181b22] border border-slate-200/90 dark:border-white/10 shadow-2xl shadow-slate-300/40 dark:shadow-black/70 overflow-hidden z-50 animate-fadeIn">
              
              <div className="px-3.5 py-2 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-slate-50/70 dark:bg-[#14161c]">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Sidebar Items ({filteredItems.length})
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 flex items-center gap-1">
                  Press <kbd className="px-1.5 py-0.5 rounded bg-slate-200/80 dark:bg-white/10 text-[9px] font-mono">↵ Enter</kbd> to open
                </span>
              </div>

              <div className="max-h-80 overflow-y-auto p-1.5 space-y-1">
                {filteredItems.length > 0 ? (
                  filteredItems.map((item, idx) => {
                    const IconComponent = item.icon;
                    const isSelected = idx === selectedIndex;
                    const isCurrentTab = activeTab === item.id;

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleOpenItem(item)}
                        onMouseEnter={() => setSelectedIndex(idx)}
                        className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/30 text-emerald-950 dark:text-emerald-200'
                            : 'hover:bg-slate-100/70 dark:hover:bg-white/5 text-slate-800 dark:text-slate-200 border border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                            isSelected
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                          }`}>
                            <IconComponent className="w-4 h-4" />
                          </div>
                          <div className="truncate">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold truncate">{item.label}</span>
                              {isCurrentTab && (
                                <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-emerald-500/20 text-emerald-600 dark:text-emerald-300">
                                  Current
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                              {item.desc}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 pl-3 shrink-0 text-slate-400 dark:text-slate-500">
                          <span className="text-[10px] font-semibold hidden sm:inline">Open on Sidebar</span>
                          <CornerDownLeft className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <div className="p-6 text-center text-slate-400 dark:text-slate-500">
                    <p className="text-xs font-medium">No matching sidebar items found for "{searchQuery}"</p>
                    <p className="text-[11px] text-slate-400 mt-1">Try searching "pickup", "chat", "schedule", "payments", or "records"</p>
                  </div>
                )}
              </div>

            </div>
          )}
        </div>

        {/* 3. Right: Notification Symbol & Dark/White Mode Symbol */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          
          {/* Notification Button & Dropdown */}
          <div className="relative" ref={notifRef}>
            <button
              type="button"
              onClick={() => setNotifOpen(!notifOpen)}
              className="p-2 sm:p-2.5 rounded-xl text-slate-700 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 bg-slate-100/90 dark:bg-[#181b20] hover:bg-emerald-50/50 dark:hover:bg-[#242930] border border-slate-200/80 dark:border-white/10 hover:border-emerald-500/40 dark:hover:border-emerald-500/40 shadow-2xs hover:shadow-xs transition-all duration-200 cursor-pointer flex items-center justify-center relative group"
              title="Notifications"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4 text-slate-600 dark:text-slate-300 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 group-hover:rotate-12 transition-transform duration-200" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#181b20] animate-pulse" />
            </button>

            {/* Notification Dropdown Panel */}
            {notifOpen && (
              <div className="absolute right-0 mt-2.5 w-80 sm:w-88 rounded-2xl bg-white dark:bg-[#181b22] border border-slate-200/90 dark:border-white/10 shadow-xl shadow-slate-200/40 dark:shadow-black/60 p-4 z-50">
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-white/5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">Notifications</span>
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      3 new
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setNotifOpen(false)}
                    className="text-[11px] font-medium text-slate-400 hover:text-emerald-600 transition-colors cursor-pointer"
                  >
                    Close
                  </button>
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#121418] border border-slate-100 dark:border-white/5 hover:border-emerald-500/30 transition-all cursor-pointer">
                    <div className="text-xs font-bold text-slate-900 dark:text-white">Collection Scheduled</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Dry waste collection in Ward 12 is scheduled for Friday.</div>
                    <div className="text-[9px] text-emerald-600 dark:text-emerald-400 font-medium mt-1">10 mins ago</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#121418] border border-slate-100 dark:border-white/5 hover:border-emerald-500/30 transition-all cursor-pointer">
                    <div className="text-xs font-bold text-slate-900 dark:text-white">AI Segregation Tip</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Clean & dry PET bottles before pickup handover.</div>
                    <div className="text-[9px] text-slate-400 font-medium mt-1">2 hours ago</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#121418] border border-slate-100 dark:border-white/5 hover:border-emerald-500/30 transition-all cursor-pointer">
                    <div className="text-xs font-bold text-slate-900 dark:text-white">Receipt Verified</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Your monthly collection record has been updated.</div>
                    <div className="text-[9px] text-slate-400 font-medium mt-1">Yesterday</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Dark / Light Mode Toggle */}
          <ThemeToggle variant="button" />

          {/* Vertical Divider */}
          <div className="h-6 w-px bg-slate-200 dark:bg-white/10 hidden sm:block" />

          {/* User Profile Dropdown Button */}
          <div className="relative" ref={userMenuRef}>
            <button
              type="button"
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className="flex items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-xl bg-slate-100/90 dark:bg-[#181b20] hover:bg-emerald-50/60 dark:hover:bg-[#22272e] border border-slate-200/80 dark:border-white/10 hover:border-emerald-500/40 dark:hover:border-emerald-500/40 shadow-2xs hover:shadow-xs transition-all duration-200 cursor-pointer group"
              title="User menu"
              aria-expanded={userDropdownOpen}
            >
              {/* Avatar with initial & leaf badge */}
              <div className="relative shrink-0">
                <div className="w-8 h-8 rounded-full bg-[#0a4d2c] text-white flex items-center justify-center font-bold text-xs shadow-xs group-hover:scale-105 transition-transform">
                  {userInitial}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-[#65a30d] text-white flex items-center justify-center border-2 border-white dark:border-[#181b20] shadow-xs">
                  <Leaf className="w-2 h-2 fill-current text-white" />
                </div>
              </div>

              {/* User Name */}
              <div className="hidden sm:flex items-center text-left min-w-0 max-w-[130px] md:max-w-[170px]">
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
                
                {/* User Info Header */}
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
                  onClick={() => {
                    setUserDropdownOpen(false);
                    handleLogout();
                  }}
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

        </div>

      </div>
    </header>
  );
};

export default Header;
