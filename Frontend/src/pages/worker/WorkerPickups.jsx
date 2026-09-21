import React, { useState, useEffect, useMemo } from 'react';
import {
  Truck,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
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
  List,
  Phone,
  Home,
  Copy,
  ExternalLink,
  X,
  SlidersHorizontal,
  FileCheck2
} from 'lucide-react';
import { getWardPickupRequests, schedulePickupRequest } from '../../services/pickupRequestService';
import OTPVerificationModal from '../../components/OTPVerificationModal';

const WorkerPickups = ({ wardId, workerId }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [statusFilter, setStatusFilter] = useState('All'); // 'All' | 'Pending' | 'Scheduled' | 'Completed' | 'Failed'
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('priority'); // 'priority' | 'scheduled' | 'date_desc' | 'house_asc' | 'citizen_name'
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  // Verification Modal States
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [selectedOtpRequestId, setSelectedOtpRequestId] = useState(null);

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
            const response = await fetch(`http://localhost:5214/api/Ward/identify?lat=${lat}&lng=${lng}`);
            if (response.ok) {
              const data = await response.json();
              setCurrentWardId(data.wardId);
              if (wardId && data.wardId !== wardId) {
                setLocationWarning(`Worker is currently outside the assigned ward. Current: ${data.wardId}, Assigned: ${wardId}`);
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

      // Pre-fill default collection date (18th of current month) for pending requests
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const defaultDate = `${year}-${month}-18`;

      const initialDates = {};
      items.forEach(req => {
        if ((req.status || '').toLowerCase() === 'pending') {
          initialDates[req.requestId] = defaultDate;
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
    if (!chosenDateStr) {
      setError('Please select a collection date between 15th and 25th of the month.');
      return;
    }

    const dayNum = parseInt(chosenDateStr.split('-')[2], 10);
    if (isNaN(dayNum) || dayNum < 15 || dayNum > 25) {
      setError('Collection date must be strictly between the 15th and 25th of the month.');
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

  const isRequestFailed = (req) => {
    const s = (req.status || '').toLowerCase();
    const isCompleted = s === 'completed' || s === 'collected';
    if (isCompleted) return false;
    const dateStr = req.collectionDate || req.requestedAt;
    if (!dateStr) return false;
    const reqDate = new Date(dateStr);
    if (isNaN(reqDate.getTime())) return false;
    const now = new Date();
    return (
      reqDate.getFullYear() < now.getFullYear() ||
      (reqDate.getFullYear() === now.getFullYear() && reqDate.getMonth() < now.getMonth())
    );
  };

  // Processed requests: filtered and sorted in neat priority order
  const processedRequests = useMemo(() => {
    // 1. Status Filter
    const filtered = requests.filter(req => {
      const isFailed = isRequestFailed(req);
      const s = (req.status || '').toLowerCase();
      const isCompleted = s === 'completed' || s === 'collected';
      const isScheduled = (s === 'scheduled' || s === 'accepted') && !isFailed;
      const isPending = s === 'pending' && !isFailed;

      if (statusFilter === 'Failed') return isFailed;
      if (statusFilter === 'Scheduled') return isScheduled;
      if (statusFilter === 'Pending') return isPending;
      if (statusFilter === 'Completed') return isCompleted;
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
      if (sortBy === 'priority') {
        // Priority order: Pending (1) -> Scheduled (2) -> Completed (3) -> Failed (4)
        const getPriority = (item) => {
          const isFailed = isRequestFailed(item);
          if (isFailed) return 4;
          const s = (item.status || '').toLowerCase();
          if (s === 'pending') return 1;
          if (s === 'scheduled' || s === 'accepted') return 2;
          if (s === 'completed' || s === 'collected') return 3;
          return 5;
        };
        const pA = getPriority(a);
        const pB = getPriority(b);
        if (pA !== pB) return pA - pB;

        // If both are Scheduled, order by scheduled collection date ascending (soonest first)
        if (pA === 2 && a.collectionDate && b.collectionDate) {
          return new Date(a.collectionDate) - new Date(b.collectionDate);
        }

        // If both are Pending or Completed, order by date descending (newest first)
        const dateA = new Date(a.collectedAt || a.collectionDate || a.requestedAt || 0);
        const dateB = new Date(b.collectedAt || b.collectionDate || b.requestedAt || 0);
        return dateB - dateA;
      }

      if (sortBy === 'scheduled') {
        const dateA = a.collectionDate ? new Date(a.collectionDate).getTime() : 9999999999999;
        const dateB = b.collectionDate ? new Date(b.collectionDate).getTime() : 9999999999999;
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
  const renderStatusBadge = (req, isFailed) => {
    if (isFailed) {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-extrabold bg-rose-50 text-rose-800 border border-rose-200">
          <XCircle className="w-3.5 h-3.5 text-rose-600" />
          <span>Failed / Missed</span>
        </span>
      );
    }
    const s = (req.status || '').toLowerCase();
    if (s === 'completed' || s === 'collected') {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-200">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>Completed ✓</span>
        </span>
      );
    }
    if (s === 'scheduled' || s === 'accepted') {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-extrabold bg-sky-50 text-sky-800 border border-sky-200">
          <Calendar className="w-3.5 h-3.5 text-sky-600" />
          <span>Scheduled</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-extrabold bg-amber-50 text-amber-800 border border-amber-200">
        <Clock className="w-3.5 h-3.5 text-amber-600" />
        <span>Pending Action</span>
      </span>
    );
  };

  // Helper date limits for date picker (15th to 25th of current month)
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const minCollectionDate = `${year}-${month}-15`;
  const maxCollectionDate = `${year}-${month}-25`;

  // Counts for tabs
  const counts = useMemo(() => {
    return {
      all: requests.length,
      pending: requests.filter(r => (r.status || '').toLowerCase() === 'pending' && !isRequestFailed(r)).length,
      scheduled: requests.filter(r => ((r.status || '').toLowerCase() === 'scheduled' || (r.status || '').toLowerCase() === 'accepted') && !isRequestFailed(r)).length,
      completed: requests.filter(r => (r.status || '').toLowerCase() === 'completed' || (r.status || '').toLowerCase() === 'collected').length,
      failed: requests.filter(isRequestFailed).length,
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
              Organized duty queue for <span className="font-extrabold text-white underline">{wardId || 'Ward 1'}</span>. Collection window runs strictly 15th–25th.
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
              onClick={() => setStatusFilter('Completed')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                statusFilter === 'Completed'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-gray-700 hover:text-gray-900'
              }`}
            >
              Completed ({counts.completed})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('Failed')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                statusFilter === 'Failed'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-gray-700 hover:text-gray-900'
              }`}
            >
              Failed ({counts.failed})
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
                title="Compact Table View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            <span className="text-xs font-semibold text-gray-500 hidden sm:inline">
              Showing {processedRequests.length} of {requests.length} requests
            </span>
          </div>
        </div>

        {/* Row 2: Search Input & Sort Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search house number (e.g. 629), citizen name, request ID..."
              className="w-full pl-10 pr-9 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0a4d2c] focus:bg-white transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
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
              <option value="priority">Priority (Pending & Scheduled First)</option>
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
        /* GRID CARDS VIEW - CLEAN, BALANCED, AND WELL-ORDERED */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {processedRequests.map((req) => {
            const statusLower = (req.status || '').toLowerCase();
            const isCompleted = statusLower === 'completed' || statusLower === 'collected';
            const isScheduled = statusLower === 'scheduled' || statusLower === 'accepted';
            const isPending = statusLower === 'pending';
            const isFailed = isRequestFailed(req);
            const isActionLoading = actionLoadingId === req.requestId;
            const currentDateVal = selectedDates[req.requestId] || minCollectionDate;

            return (
              <div
                key={req.requestId || req.id}
                className={`bg-white rounded-3xl p-5 sm:p-6 border transition-all duration-200 shadow-xs hover:shadow-md flex flex-col justify-between space-y-4 ${
                  isFailed
                    ? 'border-rose-200 hover:border-rose-300'
                    : isPending
                    ? 'border-amber-200/80 hover:border-amber-400'
                    : isScheduled
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

                    {renderStatusBadge(req, isFailed)}
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

                  {/* Scheduled Date Banner (if scheduled) */}
                  {req.collectionDate && (
                    <div className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${
                      isFailed ? 'bg-rose-50 border-rose-200' : 'bg-sky-50 border-sky-200'
                    }`}>
                      <span className={`font-bold flex items-center gap-1.5 ${
                        isFailed ? 'text-rose-800' : 'text-sky-800'
                      }`}>
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Scheduled Collection Date:</span>
                      </span>
                      <span className={`font-extrabold ${isFailed ? 'text-rose-950' : 'text-sky-950'}`}>
                        {new Date(req.collectionDate).toLocaleDateString('en-GB', {
                          weekday: 'short',
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                  )}
                </div>

                {/* Card Action Footer */}
                <div className="pt-3 border-t border-gray-100">
                  {isFailed ? (
                    <div className="p-2.5 text-center text-xs font-bold text-rose-800 bg-rose-50 rounded-xl border border-rose-200 flex items-center justify-center gap-1.5">
                      <XCircle className="w-4 h-4 text-rose-600" />
                      <span>Collection cycle expired as month has passed</span>
                    </div>
                  ) : isPending ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[11px] font-bold text-gray-700">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-[#0a4d2c]" />
                          Schedule Collection (15th–25th):
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="date"
                          min={minCollectionDate}
                          max={maxCollectionDate}
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
                  ) : isScheduled ? (
                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={() => handleCompleteClick(req.requestId)}
                        className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <ShieldCheck className="w-4 h-4 text-blue-200" />
                        <span>Complete Pickup (Enter 4-Digit Code)</span>
                      </button>
                    </div>
                  ) : isCompleted ? (
                    <div className="w-full py-2 text-center text-xs font-extrabold text-emerald-800 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Collected & Verified with Citizen Code</span>
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* COMPACT TABLE VIEW - FOR HIGH-DENSITY SCANNING */
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
                  const statusLower = (req.status || '').toLowerCase();
                  const isCompleted = statusLower === 'completed' || statusLower === 'collected';
                  const isScheduled = statusLower === 'scheduled' || statusLower === 'accepted';
                  const isPending = statusLower === 'pending';
                  const isFailed = isRequestFailed(req);
                  const currentDateVal = selectedDates[req.requestId] || minCollectionDate;
                  const isActionLoading = actionLoadingId === req.requestId;

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
                        {req.collectionDate
                          ? new Date(req.collectionDate).toLocaleDateString('en-GB')
                          : '-'}
                      </td>

                      {/* Status Badge */}
                      <td className="py-3 px-4">
                        {renderStatusBadge(req, isFailed)}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        {isPending ? (
                          <div className="inline-flex items-center gap-1.5">
                            <input
                              type="date"
                              min={minCollectionDate}
                              max={maxCollectionDate}
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
                        ) : isScheduled ? (
                          <button
                            onClick={() => handleCompleteClick(req.requestId)}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-[11px] shadow-2xs cursor-pointer"
                          >
                            Complete Pickup
                          </button>
                        ) : isCompleted ? (
                          <span className="text-[11px] font-bold text-emerald-700">✓ Done</span>
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
    </div>
  );
};

export default WorkerPickups;
