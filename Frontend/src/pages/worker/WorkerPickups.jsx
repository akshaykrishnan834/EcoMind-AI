import React, { useState, useEffect, useMemo } from 'react';
import { API_BASE_URL } from '../../config/apiConfig';
import {
  Truck,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  AlertTriangle,
  RefreshCw,
  MapPin,
  User,
  Calendar,
  Check,
  ShieldCheck,
  Loader2,
  Search,
  ArrowUpDown,
  LayoutGrid,
  Phone,
  Home,
  Copy,
  X,
  Bell,
  MessageSquare,
  Lock
} from 'lucide-react';
import {
  getWardPickupRequests,
  schedulePickupRequest,
  getPickupScheduleStatus,
  formatPickupDate,
  getValidCollectionDateRange,
  validateScheduledDate,
  getAssignedCollectionPeriod,
  getLocalTodayMidnight
} from '../../services/pickupRequestService';
import OTPVerificationModal from '../../components/OTPVerificationModal';
import DueReasonModal from '../../components/DueReasonModal';
import DueAlertDetailsModal from '../../components/DueAlertDetailsModal';

const WorkerPickups = ({ wardId, workerId }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [statusFilter, setStatusFilter] = useState('All'); // 'All' | 'Pending' | 'Scheduled' | 'Today' | 'Due' | 'Completed'
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('priority'); // 'priority' | 'scheduled' | 'date_desc' | 'house_asc' | 'citizen_name'
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  // Verification Modal States
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [selectedOtpRequestId, setSelectedOtpRequestId] = useState(null);

  // Due Reason Modal States
  const [showDueModal, setShowDueModal] = useState(false);
  const [selectedDueRequest, setSelectedDueRequest] = useState(null);

  // Due Alert Details Modal States (Pop-up window for Due updates)
  const [showDueAlertModal, setShowDueAlertModal] = useState(false);
  const [selectedDueAlertRequest, setSelectedDueAlertRequest] = useState(null);

  const handleOpenDueAlert = (req) => {
    setSelectedDueAlertRequest(req);
    setShowDueAlertModal(true);
  };

  // Location Tracking States
  const [currentWardId, setCurrentWardId] = useState(null);
  const [locationWarning, setLocationWarning] = useState('');

  // Selected date map for pending items: { [requestId]: YYYY-MM-DD }
  const [selectedDates, setSelectedDates] = useState({});

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          try {
            const response = await fetch(`${API_BASE_URL}/api/Ward/identify?lat=${lat}&lng=${lng}`);
            if (response.ok) {
              const data = await response.json();
              if (data.wardId) {
                setCurrentWardId(data.wardId);
                if (wardId && data.wardId !== wardId) {
                  setLocationWarning(`Worker is currently outside the assigned ward. Current: ${data.wardId}, Assigned: ${wardId}`);
                } else {
                  setLocationWarning(null);
                }
              } else {
                setLocationWarning(`Worker is currently outside the assigned ward.`);
              }
            } else {
              setLocationWarning(`Worker is currently outside the assigned ward.`);
            }
          } catch (e) {
            console.error("Failed to identify current ward", e);
          }
        },
        (err) => console.error(err),
        { enableHighAccuracy: true }
      );
    }
  }, [wardId]);

  const fetchPickups = async () => {
    if (!wardId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');

    try {
      const data = await getWardPickupRequests(wardId, workerId);
      const items = Array.isArray(data)
        ? data
        : Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data?.requests)
            ? data.requests
            : [];
      setRequests(items);

      // Pre-fill default collection date from valid future range for pending requests
      const initialDates = {};
      items.forEach(req => {
        if ((req.status || '').toLowerCase() === 'pending' || req.dueStatus === 'Approved for Reschedule') {
          const reqRange = getValidCollectionDateRange(req);
          initialDates[req.requestId] = reqRange.defaultDate;
        }
      });
      setSelectedDates(prev => ({ ...initialDates, ...prev }));
    } catch (err) {
      console.error('Error fetching ward pickup requests:', err);
      setError('Could not load pickup requests for your ward.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPickups();
  }, [wardId, workerId]);

  const handleDateChange = (requestId, dateStr) => {
    setSelectedDates(prev => ({
      ...prev,
      [requestId]: dateStr
    }));
  };

  const handleCopy = (id) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Worker Schedules & Accepts Request
  const handleSchedule = async (requestId) => {
    const chosenDateStr = selectedDates[requestId];
    const targetReq = requests.find(r => r.requestId === requestId);
    const validation = validateScheduledDate(chosenDateStr, targetReq);
    if (!validation.valid) {
      setError(validation.error);
      return;
    }

    setActionLoadingId(requestId);
    setError('');
    setSuccessMsg('');

    try {
      await schedulePickupRequest(requestId, workerId || 'WORKER001', chosenDateStr);
      setSuccessMsg(`Pickup Request ${requestId} scheduled for ${chosenDateStr} (Status: Scheduled)!`);
      setTimeout(() => setSuccessMsg(''), 5000);
      await fetchPickups();
    } catch (err) {
      console.error('Error scheduling pickup request:', err);
      setError(err.response?.data?.message || err.message || 'Failed to schedule pickup request.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Worker Marks Request as Collected / Completed
  const handleCompleteClick = (requestId) => {
    const targetReq = pickups.find(r => r.requestId === requestId || r.id === requestId);
    if (targetReq) {
      const sched = getPickupScheduleStatus(targetReq);
      if (sched.isDue || sched.isReasonSubmitted || sched.isApprovedForReschedule || sched.isRejected) {
        setError('Cannot complete a Due pickup. Once Admin approves and a new collection date is scheduled, OTP completion will become available.');
        return;
      }
    }
    setError('');
    setSuccessMsg('');
    setSelectedOtpRequestId(requestId);
    setShowOtpModal(true);
  };

  const handleOtpSuccess = async () => {
    setSuccessMsg('Pickup successfully verified and completed.');
    setTimeout(() => setSuccessMsg(''), 5000);
    await fetchPickups();
  };

  const handleOpenDueModal = (req) => {
    setSelectedDueRequest(req);
    setShowDueModal(true);
  };

  // Processed requests: filtered and sorted in neat priority order
  const processedRequests = useMemo(() => {
    // 1. Status Filter
    const filtered = requests.filter(req => {
      const sched = getPickupScheduleStatus(req);
      if (statusFilter === 'Pending') return sched.isPending;
      if (statusFilter === 'Scheduled') return sched.isScheduled && !sched.isToday;
      if (statusFilter === 'Today') return sched.isToday;
      if (statusFilter === 'Due') return sched.isDue || sched.isReasonSubmitted;
      if (statusFilter === 'Completed') return sched.isCompleted;
      return true;
    });

    // 2. Search Filter (House number, Citizen Name, Request ID, Phone, Category)
    const searched = filtered.filter(req => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      const matchesHouse = String(req.houseNumber || '').toLowerCase().includes(q);
      const matchesName = (req.citizenName || '').toLowerCase().includes(q);
      const matchesId = (req.requestId || '').toLowerCase().includes(q);
      const matchesPhone = (req.phoneNumber || '').includes(q);
      const matchesCategory = (req.overallCategory || '').toLowerCase().includes(q);
      return matchesHouse || matchesName || matchesId || matchesPhone || matchesCategory;
    });

    // 3. Sort in a well and neat order
    const sorted = [...searched];
    sorted.sort((a, b) => {
      const schedA = getPickupScheduleStatus(a);
      const schedB = getPickupScheduleStatus(b);

      if (sortBy === 'priority') {
        // Priority order: Pickup Today (1) -> Due / Reason (2) -> Scheduled (3) -> Pending (4) -> Completed (5)
        const getPriority = (sched) => {
          if (sched.isToday) return 1;
          if (sched.isDue || sched.isReasonSubmitted) return 2;
          if (sched.isScheduled) return 3;
          if (sched.isPending) return 4;
          if (sched.isCompleted) return 5;
          return 6;
        };
        const pA = getPriority(schedA);
        const pB = getPriority(schedB);
        if (pA !== pB) return pA - pB;

        // If both are Scheduled or Today, order by scheduled date ascending
        const dateA = a.scheduledDate || a.collectionDate;
        const dateB = b.scheduledDate || b.collectionDate;
        if (dateA && dateB) {
          return new Date(dateA) - new Date(dateB);
        }

        // Otherwise order by requested date descending
        const reqDateA = new Date(a.requestedAt || 0);
        const reqDateB = new Date(b.requestedAt || 0);
        return reqDateB - reqDateA;
      }

      if (sortBy === 'scheduled') {
        const dateA = (a.scheduledDate || a.collectionDate) ? new Date(a.scheduledDate || a.collectionDate).getTime() : 9999999999999;
        const dateB = (b.scheduledDate || b.collectionDate) ? new Date(b.scheduledDate || b.collectionDate).getTime() : 9999999999999;
        return dateA - dateB;
      }

      if (sortBy === 'date_desc') {
        const dateA = new Date(a.requestedAt || 0).getTime();
        const dateB = new Date(b.requestedAt || 0).getTime();
        return dateB - dateA;
      }

      if (sortBy === 'house_asc') {
        const numA = parseInt(String(a.houseNumber || '').replace(/\D/g, ''), 10) || 0;
        const numB = parseInt(String(b.houseNumber || '').replace(/\D/g, ''), 10) || 0;
        return numA - numB;
      }

      if (sortBy === 'citizen_name') {
        return (a.citizenName || '').localeCompare(b.citizenName || '');
      }

      return 0;
    });

    return sorted;
  }, [requests, statusFilter, searchQuery, sortBy]);

  // Status badge helper
  const renderStatusBadge = (req) => {
    const sched = getPickupScheduleStatus(req);

    if (sched.isCompleted) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-300">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>Completed ✓</span>
        </span>
      );
    }

    if (sched.isApprovedForReschedule) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-teal-50 text-teal-800 border border-teal-300">
          <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
          <span>Approved for Reschedule</span>
        </span>
      );
    }

    if (sched.isRejected) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-red-50 text-red-800 border border-red-300">
          <XCircle className="w-3.5 h-3.5 text-red-600" />
          <span>Reason Rejected</span>
        </span>
      );
    }

    if (sched.isReasonSubmitted) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-purple-50 text-purple-900 border border-purple-300">
          <MessageSquare className="w-3.5 h-3.5 text-purple-700" />
          <span>Reason Submitted</span>
        </span>
      );
    }

    if (sched.isDue) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-rose-50 text-rose-900 border border-rose-300">
          <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
          <span>Due</span>
        </span>
      );
    }

    if (sched.isToday) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-gradient-to-r from-amber-500 to-amber-600 text-white border border-amber-400 shadow-xs animate-pulse">
          <Bell className="w-3.5 h-3.5 text-white" />
          <span>Pickup Today</span>
        </span>
      );
    }

    if (sched.isScheduled) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-sky-50 text-sky-800 border border-sky-300">
          <Calendar className="w-3.5 h-3.5 text-sky-600" />
          <span>Scheduled</span>
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-amber-50 text-amber-800 border border-amber-200">
        <Clock className="w-3.5 h-3.5 text-amber-600" />
        <span>Pending</span>
      </span>
    );
  };

  // Helper date limits for date picker (20th to 25th collection window, past dates barred)
  const validRange = getValidCollectionDateRange();
  const minCollectionDate = validRange.minDate;
  const maxCollectionDate = validRange.maxDate;

  // Counts for tabs
  const counts = useMemo(() => {
    return {
      all: requests.length,
      pending: requests.filter(r => getPickupScheduleStatus(r).isPending).length,
      scheduled: requests.filter(r => {
        const s = getPickupScheduleStatus(r);
        return s.isScheduled && !s.isToday;
      }).length,
      today: requests.filter(r => getPickupScheduleStatus(r).isToday).length,
      due: requests.filter(r => {
        const s = getPickupScheduleStatus(r);
        return s.isDue || s.isReasonSubmitted;
      }).length,
      completed: requests.filter(r => getPickupScheduleStatus(r).isCompleted).length,
    };
  }, [requests]);

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fadeIn pb-12">
      {/* Top Hero Card */}
      <div className="bg-gradient-to-r from-[#0a4d2c] via-[#0f5b37] to-emerald-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-1/4 -translate-y-1/4 w-72 h-72 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-emerald-200 text-xs font-semibold mb-2">
              <Truck className="w-3.5 h-3.5 text-emerald-300" />
              <span>Ward Plastic Pickup Management</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Plastic Waste Pickup Requests
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100/90 font-medium mt-1">
              Organized duty queue for <span className="font-extrabold text-white underline">{wardId || 'Ward 1'}</span>. Collection window runs strictly 20th–25th.
            </p>
          </div>

          <button
            type="button"
            onClick={fetchPickups}
            disabled={loading}
            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2 shrink-0"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Location Warning Banner */}
      {locationWarning && (
        <div className="p-4 bg-amber-50 border-l-4 border-amber-500 text-amber-900 text-sm font-bold rounded-2xl flex items-center gap-3 shadow-xs animate-fadeIn">
          <AlertCircle className="w-6 h-6 text-amber-600 shrink-0" />
          <span>{locationWarning}</span>
        </div>
      )}

      {/* Success / Error Alerts */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border-l-4 border-emerald-500 text-emerald-900 text-xs font-bold rounded-2xl flex items-center gap-3 shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border-l-4 border-rose-500 text-rose-900 text-xs font-bold rounded-2xl flex items-center gap-3 shadow-xs">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Top Filter & Search Controls Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-emerald-100 shadow-sm space-y-4">
        {/* Row 1: Status Filter Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-3">
          <div className="flex flex-wrap items-center gap-1.5 bg-gray-100 p-1 rounded-2xl">
            <button
              type="button"
              onClick={() => setStatusFilter('All')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                statusFilter === 'All'
                  ? 'bg-[#0a4d2c] text-white shadow-xs'
                  : 'text-gray-700 hover:text-gray-900'
              }`}
            >
              All ({counts.all})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('Pending')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                statusFilter === 'Pending'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-gray-700 hover:text-gray-900'
              }`}
            >
              Pending ({counts.pending})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('Scheduled')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                statusFilter === 'Scheduled'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-gray-700 hover:text-gray-900'
              }`}
            >
              Scheduled ({counts.scheduled})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('Today')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                statusFilter === 'Today'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-gray-700 hover:text-gray-900'
              }`}
            >
              Pickup Today ({counts.today})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('Due')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                statusFilter === 'Due'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-gray-700 hover:text-gray-900'
              }`}
            >
              Due ({counts.due})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('Completed')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                statusFilter === 'Completed'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-gray-700 hover:text-gray-900'
              }`}
            >
              Completed ({counts.completed})
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  viewMode === 'grid' ? 'bg-white text-[#0a4d2c] shadow-2xs' : 'text-gray-500 hover:text-gray-900'
                }`}
                title="Card Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  viewMode === 'table' ? 'bg-white text-[#0a4d2c] shadow-2xs' : 'text-gray-500 hover:text-gray-900'
                }`}
                title="Table List View"
              >
                <Clock className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Row 2: Search + Sorting */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by house #, citizen name, phone, or request ID..."
              className="w-full pl-10 pr-9 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#0a4d2c] focus:bg-white transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Sort By Dropdown */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-bold text-gray-500 flex items-center gap-1">
              <ArrowUpDown className="w-3.5 h-3.5 text-[#0a4d2c]" />
              <span>Sort By:</span>
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#0a4d2c] cursor-pointer"
            >
              <option value="priority">Priority (Today, Due & Scheduled First)</option>
              <option value="scheduled">Scheduled Date (Soonest First)</option>
              <option value="date_desc">Newest Request Date</option>
              <option value="house_asc">House Number (Ascending)</option>
              <option value="citizen_name">Citizen Name (A – Z)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Content Rendering: Loading, Empty, or List */}
      {loading ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-emerald-100 shadow-sm space-y-3">
          <div className="w-8 h-8 border-3 border-[#0a4d2c] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-gray-500 font-medium">Loading ward plastic pickup requests...</p>
        </div>
      ) : processedRequests.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-emerald-100 shadow-sm space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-[#0a4d2c] flex items-center justify-center mx-auto">
            <Truck className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-gray-800">No Matching Pickup Requests</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            {searchQuery
              ? `No requests match "${searchQuery}". Try clearing your search.`
              : `There are currently no ${statusFilter !== 'All' ? statusFilter.toLowerCase() : ''} pickup requests in ${wardId || 'your ward'}.`}
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID CARDS VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {processedRequests.map((req) => {
            const sched = getPickupScheduleStatus(req);
            const isActionLoading = actionLoadingId === req.requestId;
            const validRange = getValidCollectionDateRange(req);
            const currentDateVal = selectedDates[req.requestId] || validRange.defaultDate;
            const formattedSchedDate = formatPickupDate(req.scheduledDate || req.collectionDate);

            return (
              <div
                key={req.requestId || req.id}
                className={`bg-white rounded-3xl p-5 sm:p-6 border transition-all duration-200 shadow-xs hover:shadow-md flex flex-col justify-between space-y-4 ${
                  sched.isDue
                    ? 'border-rose-300 ring-1 ring-rose-200/60'
                    : sched.isReasonSubmitted
                    ? 'border-amber-300 ring-1 ring-amber-200/60'
                    : sched.isToday
                    ? 'border-amber-400 ring-2 ring-amber-300'
                    : sched.isPending
                    ? 'border-amber-200/80 hover:border-amber-400'
                    : sched.isScheduled
                    ? 'border-sky-200/80 hover:border-sky-400'
                    : 'border-emerald-100 hover:border-emerald-300'
                }`}
              >
                <div className="space-y-3.5">
                  {/* Card Header: Request ID + Status Badge */}
                  <div className="flex items-center justify-between gap-2 border-b border-gray-100 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center font-mono font-extrabold text-xs text-[#0a4d2c]">
                        #{req.houseNumber || '?'}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs font-black text-gray-900 tracking-tight">
                            {req.requestId}
                          </span>
                          <button
                            onClick={() => handleCopy(req.requestId)}
                            className="text-gray-400 hover:text-gray-600 transition"
                            title="Copy Request ID"
                          >
                            {copiedId === req.requestId ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">
                          House #{req.houseNumber || 'N/A'} • {req.wardId}
                        </span>
                      </div>
                    </div>

                    {renderStatusBadge(req)}
                  </div>

                  {/* Citizen Residence Details Box */}
                  <div className="bg-gray-50/70 p-3.5 rounded-2xl border border-gray-100 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500 font-medium flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Citizen:</span>
                      </span>
                      <span className="font-extrabold text-gray-900">{req.citizenName || req.citizenId}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-gray-500 font-medium flex items-center gap-1.5">
                        <Home className="w-3.5 h-3.5 text-emerald-700" />
                        <span>House:</span>
                      </span>
                      <span className="font-bold text-gray-800">
                        {req.houseName || 'House'} • <strong className="text-[#0a4d2c]">No: {req.houseNumber || 'N/A'}</strong>
                      </span>
                    </div>

                    {req.address && (
                      <div className="flex items-start justify-between gap-2 pt-0.5">
                        <span className="text-gray-500 font-medium flex items-center gap-1.5 shrink-0">
                          <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                          <span>Address:</span>
                        </span>
                        <span className="font-semibold text-gray-700 text-right line-clamp-1">
                          {req.address}
                        </span>
                      </div>
                    )}

                    {req.phoneNumber && (
                      <div className="flex items-center justify-between pt-0.5">
                        <span className="text-gray-500 font-medium flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-emerald-700" />
                          <span>Phone:</span>
                        </span>
                        <a
                          href={`tel:${req.phoneNumber}`}
                          className="font-bold text-[#0a4d2c] hover:underline"
                        >
                          {req.phoneNumber}
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Waste Category & Volume Banner */}
                  <div className="flex items-center justify-between bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-100 text-xs">
                    <div className="flex items-center gap-1.5">
                      <Truck className="w-3.5 h-3.5 text-[#0a4d2c]" />
                      <span className="text-gray-600 font-medium">Category:</span>
                      <span className="font-extrabold text-[#0a4d2c]">{req.overallCategory || 'Recyclable Plastic'}</span>
                    </div>
                    <span className="px-2 py-0.5 bg-white text-emerald-900 border border-emerald-200 rounded-lg text-[10px] font-black uppercase shadow-2xs">
                      {req.estimatedVolume || 'Medium'} Volume
                    </span>
                  </div>

                  {/* Top Status Notification Banner */}
                  {sched.isToday ? (
                    <div className="p-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl flex items-center gap-2.5 shadow-xs animate-pulse">
                      <Bell className="w-4 h-4 text-white shrink-0" />
                      <div className="text-xs">
                        <strong className="block font-black">Pickup Scheduled for Today!</strong>
                        <span className="text-[11px] text-amber-100 font-medium">Collect waste and verify citizen 4-digit code.</span>
                      </div>
                    </div>
                  ) : (sched.isDue || sched.isReasonSubmitted) ? (
                    <div
                      onClick={() => handleOpenDueAlert(req)}
                      className="p-3 bg-gradient-to-r from-rose-50 via-amber-50/50 to-rose-50 hover:from-rose-100 hover:to-amber-100 border border-rose-300 rounded-xl flex items-center justify-between gap-3 text-xs transition-all shadow-xs cursor-pointer group"
                      role="button"
                      tabIndex={0}
                      title="Click to view full Due alert & updates in pop-up window"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="p-1.5 bg-rose-600 text-white rounded-lg shadow-2xs group-hover:scale-105 transition-transform shrink-0">
                          <AlertTriangle className="w-4 h-4 text-white" />
                        </div>
                        <div className="truncate">
                          <div className="flex items-center gap-1.5">
                            <span className="font-black text-rose-950">Pickup Due Alert</span>
                            <span className="text-[10px] px-1.5 py-0.2 bg-rose-200 text-rose-900 rounded font-extrabold uppercase">
                              Passed
                            </span>
                          </div>
                          <span className="text-[11px] text-rose-800 font-semibold block truncate">
                            Scheduled: {formattedSchedDate}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] font-extrabold text-rose-800 bg-white/90 group-hover:bg-white px-2.5 py-1.5 rounded-lg border border-rose-200 shrink-0 shadow-2xs">
                        <Bell className="w-3 h-3 text-rose-600" />
                        <span>View Updates</span>
                      </div>
                    </div>
                  ) : (req.scheduledDate || req.collectionDate) ? (
                    <div className="p-2.5 rounded-xl border border-sky-200 bg-sky-50 flex items-center justify-between text-xs">
                      <span className="font-bold flex items-center gap-1.5 text-sky-800">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Scheduled Collection Date:</span>
                      </span>
                      <span className="font-extrabold text-sky-950">
                        {formattedSchedDate}
                      </span>
                    </div>
                  ) : null}
                </div>

                {/* Card Action Footer */}
                <div className="pt-3 border-t border-gray-100">
                  {sched.isCompleted ? (
                    <div className="w-full py-2.5 text-center text-xs font-extrabold text-emerald-800 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-center gap-1.5 shadow-2xs">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Collected & Verified with Citizen Code</span>
                    </div>
                  ) : sched.isApprovedForReschedule ? (
                    <div className="space-y-2 bg-teal-50/70 p-3.5 rounded-2xl border border-teal-200 animate-fadeIn">
                      <div className="flex items-center justify-between text-[11px] font-extrabold text-teal-900">
                        <span className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                          <span>Approved by Admin • "Schedule New Date" Unlocked!</span>
                        </span>
                        <span className="text-[10px] bg-teal-200/60 px-2 py-0.5 rounded-full font-bold text-teal-800">Unlocked</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] font-bold text-teal-800">
                        <span>Select New Collection Date (20th–25th of {validRange.periodName}):</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="date"
                          min={validRange.minDate}
                          max={validRange.maxDate}
                          value={currentDateVal}
                          onChange={(e) => handleDateChange(req.requestId, e.target.value)}
                          className="flex-1 bg-white border border-teal-300 rounded-xl p-2 text-xs font-extrabold text-[#0a4d2c] focus:outline-none focus:ring-2 focus:ring-teal-600"
                        />
                        <button
                          type="button"
                          onClick={() => handleSchedule(req.requestId)}
                          disabled={isActionLoading}
                          className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
                        >
                          {isActionLoading ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <>
                              <Calendar className="w-3.5 h-3.5 text-white" />
                              <span>Schedule New Date</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ) : sched.isRejected ? (
                    <div className="p-3 bg-red-50 rounded-2xl border border-red-300 text-xs space-y-1">
                      <div className="flex items-center gap-1.5 text-red-900 font-extrabold">
                        <XCircle className="w-4 h-4 text-red-600 shrink-0" />
                        <span>Admin Rejected • Pickup Locked</span>
                      </div>
                      <p className="text-[11px] text-red-700 font-medium">
                        Admin has reviewed and rejected the reason for this missed pickup. The pickup remains locked and cannot be rescheduled.
                      </p>
                    </div>
                  ) : (sched.isDue || sched.isReasonSubmitted) ? (
                    <div className="space-y-2.5">
                      {req.dueReason && (
                        <div className="p-3 bg-amber-50/90 border border-amber-300 rounded-xl space-y-1">
                          <div className="flex items-center justify-between text-[11px] font-extrabold text-amber-900">
                            <span className="flex items-center gap-1.5">
                              <MessageSquare className="w-3.5 h-3.5 text-amber-600" />
                              <span>Worker Missed Reason:</span>
                            </span>
                            {req.dueReasonSubmittedAt && (
                              <span className="text-[10px] text-amber-700 font-semibold">{formatPickupDate(req.dueReasonSubmittedAt)}</span>
                            )}
                          </div>
                          <p className="text-xs font-black text-amber-950 italic">
                            "{req.dueReason}"
                          </p>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenDueModal(req)}
                          className="flex-1 py-2.5 px-3 bg-white hover:bg-amber-50 border border-amber-300 text-amber-900 font-extrabold text-xs rounded-xl shadow-2xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-amber-600" />
                          <span>{req.dueReason ? 'Update Missed Reason' : 'Enter Missed Reason'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenDueAlert(req)}
                          className="px-3 py-2.5 bg-amber-50/70 hover:bg-amber-100 border border-amber-300 text-amber-950 font-bold text-xs rounded-xl flex items-center gap-1.5 shrink-0 cursor-pointer shadow-2xs transition"
                          title="Click to view alert details and Admin approval status in pop-up window"
                        >
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                          <span>Waiting for Admin Approval</span>
                        </button>
                      </div>
                    </div>
                  ) : (sched.isToday || sched.isScheduled) ? (
                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={() => handleCompleteClick(req.requestId)}
                        className={`w-full py-2.5 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
                          sched.isToday
                            ? 'bg-amber-600 hover:bg-amber-700 animate-pulse'
                            : 'bg-blue-600 hover:bg-blue-700'
                        }`}
                      >
                        <ShieldCheck className="w-4 h-4 text-white" />
                        <span>Complete Pickup (Enter 4-Digit Code)</span>
                      </button>
                    </div>
                  ) : sched.isPending ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[11px] font-bold text-gray-700">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-[#0a4d2c]" />
                          Schedule Collection (20th–25th of {validRange.periodName}):
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="date"
                          min={validRange.minDate}
                          max={validRange.maxDate}
                          value={currentDateVal}
                          onChange={(e) => handleDateChange(req.requestId, e.target.value)}
                          className="flex-1 bg-white border border-gray-300 rounded-xl p-2 text-xs font-extrabold text-[#0a4d2c] focus:outline-none focus:ring-2 focus:ring-[#0a4d2c]"
                        />
                        <button
                          type="button"
                          onClick={() => handleSchedule(req.requestId)}
                          disabled={isActionLoading}
                          className="px-4 py-2 bg-[#0a4d2c] hover:bg-emerald-800 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
                        >
                          {isActionLoading ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-300" />
                              <span>Schedule & Accept</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* COMPACT TABLE VIEW */
        <div className="bg-white rounded-3xl border border-emerald-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="bg-emerald-50/80 text-[#0a4d2c] border-b border-emerald-200 font-extrabold">
                  <th className="py-3 px-4">House No</th>
                  <th className="py-3 px-4">Request ID</th>
                  <th className="py-3 px-4">Citizen & Residence</th>
                  <th className="py-3 px-4">Waste Category</th>
                  <th className="py-3 px-4">Scheduled Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
                {processedRequests.map((req) => {
                  const sched = getPickupScheduleStatus(req);
                  const validRange = getValidCollectionDateRange(req);
                  const currentDateVal = selectedDates[req.requestId] || validRange.defaultDate;
                  const isActionLoading = actionLoadingId === req.requestId;
                  const formattedSchedDate = formatPickupDate(req.scheduledDate || req.collectionDate);

                  return (
                    <tr key={req.requestId || req.id} className="hover:bg-emerald-50/30 transition-colors">
                      {/* House No */}
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 rounded-lg bg-emerald-100 text-[#0a4d2c] font-mono font-extrabold text-xs">
                          #{req.houseNumber || 'N/A'}
                        </span>
                      </td>

                      {/* Request ID */}
                      <td className="py-3 px-4 font-mono font-bold text-gray-900">
                        {req.requestId}
                      </td>

                      {/* Citizen & Residence */}
                      <td className="py-3 px-4">
                        <p className="font-extrabold text-gray-900">{req.citizenName || req.citizenId}</p>
                        <p className="text-[11px] text-gray-500 truncate max-w-[180px]">{req.address || req.houseName || 'Ward Resident'}</p>
                      </td>

                      {/* Waste Category */}
                      <td className="py-3 px-4">
                        <span className="font-bold text-[#0a4d2c]">{req.overallCategory || 'Plastic'}</span>
                        <span className="text-gray-400 block text-[10px]">({req.estimatedVolume || 'Medium'})</span>
                      </td>

                      {/* Scheduled Date */}
                      <td className="py-3 px-4 font-mono text-[11px]">
                        {formattedSchedDate !== '-' ? formattedSchedDate : '-'}
                      </td>

                      {/* Status Badge */}
                      <td className="py-3 px-4">
                        {renderStatusBadge(req)}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        {sched.isCompleted ? (
                          <span className="text-[11px] font-bold text-emerald-700">✓ Done</span>
                        ) : sched.isApprovedForReschedule ? (
                          <div className="inline-flex items-center gap-1.5">
                            <input
                              type="date"
                              min={validRange.minDate}
                              max={validRange.maxDate}
                              value={currentDateVal}
                              onChange={(e) => handleDateChange(req.requestId, e.target.value)}
                              className="bg-white border border-teal-400 rounded-lg p-1 text-[11px] font-bold text-teal-900 w-32 focus:ring-1 focus:ring-teal-500"
                            />
                            <button
                              onClick={() => handleSchedule(req.requestId)}
                              disabled={isActionLoading}
                              className="px-2.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-bold text-[11px] shadow-2xs cursor-pointer flex items-center gap-1"
                            >
                              <Calendar className="w-3 h-3 text-white" />
                              <span>Schedule New Date</span>
                            </button>
                          </div>
                        ) : sched.isRejected ? (
                          <span className="px-2 py-1 bg-rose-50 text-rose-800 border border-rose-200 rounded-lg font-bold text-[10px]">
                            Locked (Admin Rejected)
                          </span>
                        ) : (sched.isDue || sched.isReasonSubmitted) ? (
                          <div className="flex flex-col gap-1.5 items-start">
                            {req.dueReason && (
                              <div className="text-[11px] font-bold text-amber-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 max-w-[220px] truncate" title={req.dueReason}>
                                Reason: "{req.dueReason}"
                              </div>
                            )}
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                onClick={() => handleOpenDueAlert(req)}
                                className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-300 rounded-lg font-bold text-[11px] cursor-pointer flex items-center gap-1"
                                title="Click to view Due alert & updates in pop-up window"
                              >
                                <AlertTriangle className="w-3 h-3 text-rose-600" />
                                <span>View Due Alert</span>
                              </button>
                              <button
                                onClick={() => handleOpenDueModal(req)}
                                className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg font-bold text-[11px] cursor-pointer flex items-center gap-1"
                              >
                                <MessageSquare className="w-3 h-3 text-amber-600" />
                                <span>{req.dueReason ? 'Update Reason' : 'Enter Reason'}</span>
                              </button>
                              <button
                                onClick={() => handleOpenDueAlert(req)}
                                className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200 rounded-lg font-bold text-[10px] flex items-center gap-1 cursor-pointer"
                                title="Click to view alert details in pop-up window"
                              >
                                <Clock className="w-3 h-3 text-amber-600" /> Waiting for Admin Approval
                              </button>
                            </div>
                          </div>
                        ) : (sched.isToday || sched.isScheduled) ? (
                          <button
                            onClick={() => handleCompleteClick(req.requestId)}
                            className="px-3 py-1.5 bg-[#0a4d2c] hover:bg-emerald-800 text-white rounded-lg font-bold text-[11px] shadow-2xs cursor-pointer flex items-center gap-1"
                          >
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
                            <span>Complete (OTP)</span>
                          </button>
                        ) : sched.isPending ? (
                          <div className="inline-flex items-center gap-1.5">
                            <input
                              type="date"
                              min={validRange.minDate}
                              max={validRange.maxDate}
                              value={currentDateVal}
                              onChange={(e) => handleDateChange(req.requestId, e.target.value)}
                              className="bg-white border border-gray-300 rounded-lg p-1 text-[11px] font-bold text-[#0a4d2c] w-32"
                            />
                            <button
                              onClick={() => handleSchedule(req.requestId)}
                              disabled={isActionLoading}
                              className="px-3 py-1.5 bg-[#0a4d2c] hover:bg-emerald-800 text-white rounded-lg font-bold text-[11px] shadow-2xs cursor-pointer"
                            >
                              Schedule
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-gray-400">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Verification Code Modal */}
      <OTPVerificationModal
        isOpen={showOtpModal}
        onClose={() => {
          setShowOtpModal(false);
          setSelectedOtpRequestId(null);
        }}
        requestId={selectedOtpRequestId}
        workerId={workerId || 'WORKER001'}
        onSuccess={handleOtpSuccess}
      />

      {/* Due Reason Modal */}
      <DueReasonModal
        isOpen={showDueModal}
        onClose={() => {
          setShowDueModal(false);
          setSelectedDueRequest(null);
        }}
        request={selectedDueRequest}
        userRole="worker"
        userName={(() => {
          try {
            const u = JSON.parse(localStorage.getItem('user') || '{}');
            return u.fullName || u.name || localStorage.getItem('userName') || workerId || 'Haritha Karma Sena Worker';
          } catch {
            return workerId || 'Haritha Karma Sena Worker';
          }
        })()}
        onSuccess={() => {
          fetchPickups();
        }}
      />

      {/* Due Alert Details Modal (Pop-up window showing Due alert updates) */}
      <DueAlertDetailsModal
        isOpen={showDueAlertModal}
        onClose={() => {
          setShowDueAlertModal(false);
          setSelectedDueAlertRequest(null);
        }}
        request={selectedDueAlertRequest}
        userRole="worker"
        onOpenUpdateReason={() => {
          const req = selectedDueAlertRequest;
          setShowDueAlertModal(false);
          handleOpenDueModal(req);
        }}
      />
    </div>
  );
};

export default WorkerPickups;
