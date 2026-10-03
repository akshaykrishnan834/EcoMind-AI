import React, { useState, useEffect, useMemo } from 'react';
import {
  Truck,
  CheckCircle2,
  Clock,
  AlertCircle,
  RefreshCw,
  MapPin,
  User,
  Search,
  Filter,
  Calendar,
  FileText,
  Building2,
  PackageCheck,
  ExternalLink,
  Phone,
  Home,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  List,
  AlertTriangle,
  Layers,
  Sparkles,
  Check,
  X,
  XCircle,
  CalendarDays,
  Timer
} from 'lucide-react';
import {
  getAllPickupRequests,
  approveDueReason,
  getPickupScheduleStatus,
  formatPickupDate,
  getAssignedCollectionPeriod
} from '../../services/pickupRequestService';
import { getAllCitizens } from '../../services/citizenService';
import { getAllWorkers } from '../../services/workerService';

const AdminPickups = () => {
  const [requests, setRequests] = useState([]);
  const [citizensMap, setCitizensMap] = useState({});
  const [workersMap, setWorkersMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filtering State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [periodFilter, setPeriodFilter] = useState('All');
  const [timelineFilter, setTimelineFilter] = useState('All');
  const [wardFilter, setWardFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('All');
  const [volumeFilter, setVolumeFilter] = useState('All');

  // Sorting & Pagination State
  const [sortField, setSortField] = useState('date');
  const [sortDirection, setSortDirection] = useState('desc'); // 'asc' | 'desc'
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'cards'
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const handleAdminApproval = async (requestId, action = 'Approve') => {
    setActionLoadingId(requestId);
    try {
      await approveDueReason(requestId, 'Admin', action);
      await fetchAllData();
    } catch (err) {
      console.error('Failed to submit admin approval:', err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const fetchAllData = async () => {
    setLoading(true);
    setError('');

    try {
      const [pickupData, citizenData, workerData] = await Promise.all([
        getAllPickupRequests().catch(() => []),
        getAllCitizens().catch(() => []),
        getAllWorkers().catch(() => [])
      ]);

      // Create lookup maps
      const cMap = {};
      if (Array.isArray(citizenData)) {
        citizenData.forEach(c => {
          if (c.citizenId) cMap[c.citizenId] = c;
          if (c.id) cMap[c.id] = c;
          if (c.email) cMap[c.email] = c;
        });
      }
      setCitizensMap(cMap);

      const wMap = {};
      if (Array.isArray(workerData)) {
        workerData.forEach(w => {
          if (w.workerId) wMap[w.workerId] = w;
          if (w.id) wMap[w.id] = w;
          if (w.email) wMap[w.email] = w;
        });
      }
      setWorkersMap(wMap);

      setRequests(Array.isArray(pickupData) ? pickupData : []);
    } catch (err) {
      console.error('Error fetching admin pickup records:', err);
      setError('Could not load system pickup request records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Enrich requests with timeline schedule status and assigned monthly collection period
  const enrichedRequests = useMemo(() => {
    return requests.map(req => {
      const scheduleStatus = getPickupScheduleStatus(req);
      const assignedPeriodInfo = getAssignedCollectionPeriod(req.requestedAt);
      const assignedPeriod = req.collectionPeriodName || assignedPeriodInfo.periodName;
      return {
        ...req,
        scheduleStatus,
        assignedPeriodInfo,
        assignedPeriod
      };
    });
  }, [requests]);

  // Compute timeline-accurate stats
  const totalCount = enrichedRequests.length;
  const pendingCount = enrichedRequests.filter(r => r.scheduleStatus.isPending).length;
  const scheduledCount = enrichedRequests.filter(r => r.scheduleStatus.isScheduled || r.scheduleStatus.isToday).length;
  const completedCount = enrichedRequests.filter(r => r.scheduleStatus.isCompleted).length;
  const dueCount = enrichedRequests.filter(r => r.scheduleStatus.isDue).length;

  // Extract unique wards for dropdown
  const uniqueWards = Array.from(
    new Set(requests.map(r => r.wardId).filter(Boolean))
  ).sort();

  // Extract unique collection periods for dropdown (chronologically ordered)
  const uniquePeriods = useMemo(() => {
    const periodMap = new Map();
    enrichedRequests.forEach(r => {
      if (r.assignedPeriod) {
        if (!periodMap.has(r.assignedPeriod)) {
          const reqTime = r.requestedAt ? new Date(r.requestedAt).getTime() : 0;
          periodMap.set(r.assignedPeriod, { name: r.assignedPeriod, time: reqTime });
        }
      }
    });
    return Array.from(periodMap.values())
      .sort((a, b) => b.time - a.time)
      .map(p => p.name);
  }, [enrichedRequests]);

  // Extract unique collection dates for dropdown
  const uniqueDates = Array.from(
    new Set(
      requests
        .map(r => (r.collectionDate || r.scheduledDate ? (r.collectionDate || r.scheduledDate).substring(0, 10) : null))
        .filter(Boolean)
    )
  ).sort().reverse();

  // Filter requests based on status, period, timeline state, ward, date, volume, search query
  const filteredRequests = useMemo(() => {
    return enrichedRequests.filter(req => {
      // Status filter
      if (statusFilter !== 'All') {
        if (statusFilter === 'Scheduled' && !(req.scheduleStatus.isScheduled || req.scheduleStatus.isToday)) return false;
        if (statusFilter === 'Pending' && !req.scheduleStatus.isPending) return false;
        if (statusFilter === 'Completed' && !req.scheduleStatus.isCompleted) return false;
        if (statusFilter === 'Due' && !req.scheduleStatus.isDue) return false;
        if (statusFilter === 'Failed' && !req.scheduleStatus.isDue) return false;
      }

      // Period filter
      if (periodFilter !== 'All' && req.assignedPeriod !== periodFilter) {
        return false;
      }

      // Timeline state filter
      if (timelineFilter !== 'All') {
        if (timelineFilter === 'Overdue' && !req.scheduleStatus.isDue) return false;
        if (timelineFilter === 'Today' && !req.scheduleStatus.isToday) return false;
        if (timelineFilter === 'Upcoming' && !(req.scheduleStatus.isScheduled && !req.scheduleStatus.isToday)) return false;
        if (timelineFilter === 'Pending' && !req.scheduleStatus.isPending) return false;
        if (timelineFilter === 'Completed' && !req.scheduleStatus.isCompleted) return false;
      }

      // Ward filter
      if (wardFilter !== 'All' && req.wardId !== wardFilter) {
        return false;
      }

      // Date filter
      if (dateFilter !== 'All') {
        const cDate = req.collectionDate || req.scheduledDate ? (req.collectionDate || req.scheduledDate).substring(0, 10) : null;
        if (cDate !== dateFilter) return false;
      }

      // Volume filter
      if (volumeFilter !== 'All') {
        const v = (req.estimatedVolume || '').toLowerCase();
        if (volumeFilter === 'Low' && !v.includes('low')) return false;
        if (volumeFilter === 'Medium' && !v.includes('med')) return false;
        if (volumeFilter === 'High' && !v.includes('high') && !v.includes('heavy')) return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const citizen = citizensMap[req.citizenId] || {};
        const worker = workersMap[req.acceptedByWorkerId] || {};

        const matchId = (req.requestId || '').toLowerCase().includes(q);
        const matchCitizenName = (citizen.fullName || req.citizenName || '').toLowerCase().includes(q);
        const matchCitizenId = (req.citizenId || '').toLowerCase().includes(q);
        const matchHouse = (citizen.houseName || req.houseName || citizen.houseNumber || req.houseNumber || '').toLowerCase().includes(q);
        const matchWard = (req.wardId || '').toLowerCase().includes(q);
        const matchAddress = (citizen.address || req.address || '').toLowerCase().includes(q);
        const matchWorker = (worker.fullName || req.acceptedByWorkerId || '').toLowerCase().includes(q);
        const matchPeriod = (req.assignedPeriod || '').toLowerCase().includes(q);

        return matchId || matchCitizenName || matchCitizenId || matchHouse || matchWard || matchAddress || matchWorker || matchPeriod;
      }

      return true;
    });
  }, [enrichedRequests, statusFilter, periodFilter, timelineFilter, wardFilter, dateFilter, volumeFilter, searchQuery, citizensMap, workersMap]);

  // Sort requests chronologically or by field
  const sortedRequests = useMemo(() => {
    const list = [...filteredRequests];
    list.sort((a, b) => {
      let valA = '';
      let valB = '';

      if (sortField === 'date') {
        valA = new Date(a.collectionDate || a.scheduledDate || a.requestedAt || 0).getTime();
        valB = new Date(b.collectionDate || b.scheduledDate || b.requestedAt || 0).getTime();
      } else if (sortField === 'requestedAt') {
        valA = new Date(a.requestedAt || 0).getTime();
        valB = new Date(b.requestedAt || 0).getTime();
      } else if (sortField === 'requestId') {
        valA = a.requestId || '';
        valB = b.requestId || '';
      } else if (sortField === 'citizen') {
        const cA = citizensMap[a.citizenId] || {};
        const cB = citizensMap[b.citizenId] || {};
        valA = (cA.fullName || a.citizenName || '').toLowerCase();
        valB = (cB.fullName || b.citizenName || '').toLowerCase();
      } else if (sortField === 'ward') {
        valA = a.wardId || '';
        valB = b.wardId || '';
      } else if (sortField === 'status') {
        valA = a.scheduleStatus?.label || a.status || '';
        valB = b.scheduleStatus?.label || b.status || '';
      } else if (sortField === 'volume') {
        valA = a.estimatedVolume || '';
        valB = b.estimatedVolume || '';
      }

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    return list;
  }, [filteredRequests, sortField, sortDirection, citizensMap]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, periodFilter, timelineFilter, wardFilter, dateFilter, volumeFilter, sortField, sortDirection]);

  // Pagination slice
  const totalPages = Math.max(1, Math.ceil(sortedRequests.length / pageSize));
  const paginatedRequests = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedRequests.slice(start, start + pageSize);
  }, [sortedRequests, currentPage, pageSize]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getStatusBadge = (req) => {
    const st = req.scheduleStatus || getPickupScheduleStatus(req);
    if (req?.dueStatus === 'Approved for Reschedule' || req?.adminApprovalStatus === 'Approved') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-teal-100 text-teal-900 border border-teal-300 dark:bg-teal-950 dark:text-teal-300 dark:border-teal-800">
          <span className="w-1.5 h-1.5 rounded-full bg-teal-600 dark:bg-teal-400" />
          Approved for Reschedule
        </span>
      );
    }
    if (req?.dueStatus === 'Rejected' || req?.adminApprovalStatus === 'Rejected') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-900 border border-rose-300 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-600 dark:bg-rose-400" />
          Reason Rejected
        </span>
      );
    }
    if (st.isCompleted) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400" />
          Completed
        </span>
      );
    }
    if (st.isDue) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 dark:bg-amber-400" />
          Due / Review Required
        </span>
      );
    }
    if (st.isToday) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500 text-white border border-amber-600 shadow-2xs animate-pulse">
          <span className="w-1.5 h-1.5 rounded-full bg-white" />
          Pickup Today
        </span>
      );
    }
    if (st.isScheduled) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-100 text-blue-900 border border-blue-300 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400" />
          Scheduled
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 dark:bg-amber-400" />
        Pending Schedule
      </span>
    );
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#0a4d2c] via-[#0f5b37] to-emerald-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-emerald-700/40">
        <div className="absolute right-0 top-0 translate-x-1/4 -translate-y-1/4 w-72 h-72 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-emerald-200 text-xs font-semibold mb-2 backdrop-blur-xs">
              <Truck className="w-3.5 h-3.5 text-emerald-300" />
              <span>Haritha Karma Sena Admin Operations</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Pickup Request & Timeline Management
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100/90 font-medium mt-1 max-w-2xl">
              Real-time oversight of doorstep plastic waste pickup requests, assigned monthly collection periods (20th–25th window), scheduled dates, and missed collection reviews.
            </p>
          </div>

          <button
            type="button"
            onClick={fetchAllData}
            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2 shrink-0 self-start md:self-center"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Records</span>
          </button>
        </div>
      </div>

      {/* Overview KPI Metrics Grid based on Timelines */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Metric 1: Total Requests */}
        <div
          onClick={() => {
            setStatusFilter('All');
            setTimelineFilter('All');
          }}
          className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer space-y-1.5 group ${
            statusFilter === 'All' && timelineFilter === 'All'
              ? 'bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-600 shadow-md ring-2 ring-emerald-500/30'
              : 'bg-white dark:bg-[#14231b] border-emerald-800/15 dark:border-emerald-700/30 shadow-2xs hover:shadow-md'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Pickups</span>
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/60 rounded-xl text-[#0a4d2c] dark:text-emerald-300">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-gray-900 dark:text-white">{totalCount}</p>
          <p className="text-[10.5px] font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> All Timeline Records
          </p>
        </div>

        {/* Metric 2: Pending Requests */}
        <div 
          onClick={() => {
            setStatusFilter(statusFilter === 'Pending' ? 'All' : 'Pending');
            setTimelineFilter('All');
          }}
          className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer space-y-1.5 group ${
            statusFilter === 'Pending' 
              ? 'bg-amber-50/90 dark:bg-amber-950/40 border-amber-500 shadow-md ring-2 ring-amber-400/30' 
              : 'bg-white dark:bg-[#14231b] border-emerald-800/15 dark:border-emerald-700/30 shadow-2xs hover:shadow-md'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">Pending</span>
            <div className="p-2 bg-amber-50 dark:bg-amber-950/60 rounded-xl text-amber-700 dark:text-amber-300">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-amber-900 dark:text-amber-200">{pendingCount}</p>
          <p className="text-[10.5px] font-semibold text-amber-700 dark:text-amber-400">
            Awaiting Worker Schedule
          </p>
        </div>

        {/* Metric 3: Scheduled Pickups (Upcoming / Today) */}
        <div 
          onClick={() => {
            setStatusFilter(statusFilter === 'Scheduled' ? 'All' : 'Scheduled');
            setTimelineFilter('All');
          }}
          className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer space-y-1.5 group ${
            statusFilter === 'Scheduled' 
              ? 'bg-blue-50/90 dark:bg-blue-950/40 border-blue-500 shadow-md ring-2 ring-blue-400/30' 
              : 'bg-white dark:bg-[#14231b] border-emerald-800/15 dark:border-emerald-700/30 shadow-2xs hover:shadow-md'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider">Scheduled</span>
            <div className="p-2 bg-blue-50 dark:bg-blue-950/60 rounded-xl text-blue-700 dark:text-blue-300">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-blue-900 dark:text-blue-200">{scheduledCount}</p>
          <p className="text-[10.5px] font-semibold text-blue-700 dark:text-blue-400">
            Active / Upcoming (20–25th)
          </p>
        </div>

        {/* Metric 4: Completed Collections */}
        <div 
          onClick={() => {
            setStatusFilter(statusFilter === 'Completed' ? 'All' : 'Completed');
            setTimelineFilter('All');
          }}
          className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer space-y-1.5 group ${
            statusFilter === 'Completed' 
              ? 'bg-emerald-50/90 dark:bg-emerald-950/40 border-[#0a4d2c] shadow-md ring-2 ring-emerald-600/30' 
              : 'bg-white dark:bg-[#14231b] border-emerald-800/15 dark:border-emerald-700/30 shadow-2xs hover:shadow-md'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] font-bold text-[#0a4d2c] dark:text-emerald-400 uppercase tracking-wider">Completed</span>
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/60 rounded-xl text-[#0a4d2c] dark:text-emerald-300">
              <PackageCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-[#0a4d2c] dark:text-emerald-400">{completedCount}</p>
          <p className="text-[10.5px] font-semibold text-emerald-700 dark:text-emerald-400">
            Successfully Collected
          </p>
        </div>

        {/* Metric 5: Due / Missed Collections */}
        <div 
          onClick={() => {
            setStatusFilter(statusFilter === 'Due' ? 'All' : 'Due');
            setTimelineFilter('All');
          }}
          className={`col-span-2 sm:col-span-1 p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer space-y-1.5 group ${
            statusFilter === 'Due' 
              ? 'bg-rose-50/90 dark:bg-rose-950/40 border-rose-500 shadow-md ring-2 ring-rose-400/30' 
              : 'bg-white dark:bg-[#14231b] border-emerald-800/15 dark:border-emerald-700/30 shadow-2xs hover:shadow-md'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider">Due / Missed</span>
            <div className="p-2 bg-rose-50 dark:bg-rose-950/60 rounded-xl text-rose-700 dark:text-rose-300">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-rose-900 dark:text-rose-200">{dueCount}</p>
          <p className="text-[10.5px] font-semibold text-rose-700 dark:text-rose-400">
            Date Passed / Review Due
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border-l-4 border-rose-500 text-rose-900 text-xs font-bold rounded-2xl flex items-center gap-3 shadow-xs">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter & Search Bar with Timeline & Period Selectors */}
      <div className="bg-white dark:bg-[#14231b] p-5 rounded-3xl border-2 border-emerald-800/15 dark:border-emerald-700/30 shadow-2xs space-y-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Request ID, Citizen Name, House Name, Ward, Worker, Period..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-[#0c1510] border border-gray-200 dark:border-emerald-800 rounded-2xl text-xs font-semibold text-gray-800 dark:text-white focus:outline-none focus:border-[#0a4d2c] transition-all"
            />
          </div>

          {/* Multi-Filters & View Switcher */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Status Filter */}
            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-gray-50 dark:bg-[#0c1510] border border-gray-200 dark:border-emerald-800 rounded-xl px-3 py-2 text-xs font-bold text-gray-700 dark:text-white focus:outline-none focus:border-[#0a4d2c] cursor-pointer"
              >
                <option value="All">All Statuses</option>
                <option value="Due">Due / Review Required ({dueCount})</option>
                <option value="Scheduled">Scheduled (Upcoming / Today) ({scheduledCount})</option>
                <option value="Pending">Pending Schedule ({pendingCount})</option>
                <option value="Completed">Completed ({completedCount})</option>
              </select>
            </div>

            {/* Collection Period Filter */}
            <div className="flex items-center gap-1.5">
              <CalendarDays className="w-3.5 h-3.5 text-gray-400" />
              <select
                value={periodFilter}
                onChange={(e) => setPeriodFilter(e.target.value)}
                className="bg-gray-50 dark:bg-[#0c1510] border border-gray-200 dark:border-emerald-800 rounded-xl px-3 py-2 text-xs font-bold text-gray-700 dark:text-white focus:outline-none focus:border-[#0a4d2c] cursor-pointer"
              >
                <option value="All">All Collection Periods</option>
                {uniquePeriods.map(p => (
                  <option key={p} value={p}>{p} (20th–25th)</option>
                ))}
              </select>
            </div>

            {/* Timeline Stage Filter */}
            <div className="flex items-center gap-1.5">
              <Timer className="w-3.5 h-3.5 text-gray-400" />
              <select
                value={timelineFilter}
                onChange={(e) => setTimelineFilter(e.target.value)}
                className="bg-gray-50 dark:bg-[#0c1510] border border-gray-200 dark:border-emerald-800 rounded-xl px-3 py-2 text-xs font-bold text-gray-700 dark:text-white focus:outline-none focus:border-[#0a4d2c] cursor-pointer"
              >
                <option value="All">All Timelines</option>
                <option value="Overdue">Overdue / Passed Date (Due)</option>
                <option value="Today">Scheduled for Today</option>
                <option value="Upcoming">Upcoming (20th–25th)</option>
                <option value="Pending">Pending Scheduling</option>
                <option value="Completed">Completed Collections</option>
              </select>
            </div>

            {/* Ward Filter */}
            <div className="flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-gray-400" />
              <select
                value={wardFilter}
                onChange={(e) => setWardFilter(e.target.value)}
                className="bg-gray-50 dark:bg-[#0c1510] border border-gray-200 dark:border-emerald-800 rounded-xl px-3 py-2 text-xs font-bold text-gray-700 dark:text-white focus:outline-none focus:border-[#0a4d2c] cursor-pointer"
              >
                <option value="All">All Wards ({uniqueWards.length})</option>
                {uniqueWards.map(w => (
                  <option key={w} value={w}>{w}</option>
                ))}
              </select>
            </div>

            {/* Date Filter */}
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-gray-400" />
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="bg-gray-50 dark:bg-[#0c1510] border border-gray-200 dark:border-emerald-800 rounded-xl px-3 py-2 text-xs font-bold text-gray-700 dark:text-white focus:outline-none focus:border-[#0a4d2c] cursor-pointer"
              >
                <option value="All">All Scheduled Dates</option>
                {uniqueDates.map(d => (
                  <option key={d} value={d}>
                    {new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </option>
                ))}
              </select>
            </div>

            {/* Volume Filter */}
            <div className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-gray-400" />
              <select
                value={volumeFilter}
                onChange={(e) => setVolumeFilter(e.target.value)}
                className="bg-gray-50 dark:bg-[#0c1510] border border-gray-200 dark:border-emerald-800 rounded-xl px-3 py-2 text-xs font-bold text-gray-700 dark:text-white focus:outline-none focus:border-[#0a4d2c] cursor-pointer"
              >
                <option value="All">All Volumes</option>
                <option value="Low">Low (1-5 kg)</option>
                <option value="Medium">Medium (5-15 kg)</option>
                <option value="High">High (&gt;15 kg)</option>
              </select>
            </div>

            {/* Layout Toggle Button */}
            <div className="flex items-center bg-gray-100 dark:bg-gray-800 p-1 rounded-xl border border-gray-200 dark:border-emerald-800 shrink-0">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-white dark:bg-[#14231b] text-[#0a4d2c] dark:text-emerald-400 shadow-2xs'
                    : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                }`}
                title="Table View"
              >
                <List className="w-4 h-4" />
                <span className="hidden sm:inline">Table</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                  viewMode === 'cards'
                    ? 'bg-white dark:bg-[#14231b] text-[#0a4d2c] dark:text-emerald-400 shadow-2xs'
                    : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                }`}
                title="Cards View"
              >
                <LayoutGrid className="w-4 h-4" />
                <span className="hidden sm:inline">Cards</span>
              </button>
            </div>
          </div>
        </div>

        {/* Filter Summary & Reset */}
        <div className="flex flex-wrap items-center justify-between text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-100 dark:border-emerald-900/60">
          <span>
            Showing <strong>{Math.min(sortedRequests.length, (currentPage - 1) * pageSize + 1)}–{Math.min(sortedRequests.length, currentPage * pageSize)}</strong> of <strong>{sortedRequests.length}</strong> matching records (Total {requests.length})
          </span>
          {(searchQuery || statusFilter !== 'All' || periodFilter !== 'All' || timelineFilter !== 'All' || wardFilter !== 'All' || dateFilter !== 'All' || volumeFilter !== 'All') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('All');
                setPeriodFilter('All');
                setTimelineFilter('All');
                setWardFilter('All');
                setDateFilter('All');
                setVolumeFilter('All');
              }}
              className="text-xs font-bold text-[#0a4d2c] dark:text-emerald-400 hover:underline cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area: Loading / Empty / Data */}
      {loading ? (
        <div className="bg-white dark:bg-[#14231b] rounded-3xl p-12 text-center border-2 border-emerald-800/15 dark:border-emerald-700/30 shadow-sm space-y-3">
          <div className="w-8 h-8 border-3 border-[#0a4d2c] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Loading system pickup request records & timeline data...</p>
        </div>
      ) : sortedRequests.length === 0 ? (
        <div className="bg-white dark:bg-[#14231b] rounded-3xl p-12 text-center border-2 border-emerald-800/15 dark:border-emerald-700/30 shadow-sm space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-[#0a4d2c] dark:text-emerald-300 flex items-center justify-center mx-auto">
            <Truck className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-gray-800 dark:text-white">No Matching Pickup Records</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
            No pickup requests matched your current filters, collection periods, or search criteria.
          </p>
        </div>
      ) : viewMode === 'table' ? (
        /* TABLE VIEW WITH TIMELINE COLUMNS */
        <div className="bg-white dark:bg-[#14231b] rounded-3xl border-2 border-emerald-800/15 dark:border-emerald-700/30 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-emerald-50/60 dark:bg-emerald-950/50 border-b border-gray-100 dark:border-emerald-900/60 text-gray-600 dark:text-gray-300 uppercase text-[10px] font-black tracking-wider">
                  <th onClick={() => handleSort('requestId')} className="py-3 px-4 cursor-pointer hover:text-[#0a4d2c]">
                    <div className="flex items-center gap-1.5">
                      <span>Request ID & Created</span>
                      {sortField === 'requestId' ? (sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-[#0a4d2c]" /> : <ArrowDown className="w-3 h-3 text-[#0a4d2c]" />) : <ArrowUpDown className="w-3 h-3 text-gray-400" />}
                    </div>
                  </th>
                  <th onClick={() => handleSort('citizen')} className="py-3 px-4 cursor-pointer hover:text-[#0a4d2c]">
                    <div className="flex items-center gap-1.5">
                      <span>Citizen & House</span>
                      {sortField === 'citizen' ? (sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-[#0a4d2c]" /> : <ArrowDown className="w-3 h-3 text-[#0a4d2c]" />) : <ArrowUpDown className="w-3 h-3 text-gray-400" />}
                    </div>
                  </th>
                  <th onClick={() => handleSort('ward')} className="py-3 px-3 cursor-pointer hover:text-[#0a4d2c]">
                    <div className="flex items-center gap-1.5">
                      <span>Ward</span>
                      {sortField === 'ward' ? (sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-[#0a4d2c]" /> : <ArrowDown className="w-3 h-3 text-[#0a4d2c]" />) : <ArrowUpDown className="w-3 h-3 text-gray-400" />}
                    </div>
                  </th>
                  <th onClick={() => handleSort('volume')} className="py-3 px-3 cursor-pointer hover:text-[#0a4d2c]">
                    <div className="flex items-center gap-1.5">
                      <span>Category & Vol</span>
                      {sortField === 'volume' ? (sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-[#0a4d2c]" /> : <ArrowDown className="w-3 h-3 text-[#0a4d2c]" />) : <ArrowUpDown className="w-3 h-3 text-gray-400" />}
                    </div>
                  </th>
                  <th onClick={() => handleSort('date')} className="py-3 px-3 cursor-pointer hover:text-[#0a4d2c]">
                    <div className="flex items-center gap-1.5">
                      <span>Collection Timeline & Date</span>
                      {sortField === 'date' ? (sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-[#0a4d2c]" /> : <ArrowDown className="w-3 h-3 text-[#0a4d2c]" />) : <ArrowUpDown className="w-3 h-3 text-gray-400" />}
                    </div>
                  </th>
                  <th className="py-3 px-3">Assigned Worker</th>
                  <th onClick={() => handleSort('status')} className="py-3 px-3 cursor-pointer hover:text-[#0a4d2c]">
                    <div className="flex items-center gap-1.5">
                      <span>Timeline Status & Reason</span>
                      {sortField === 'status' ? (sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-[#0a4d2c]" /> : <ArrowDown className="w-3 h-3 text-[#0a4d2c]" />) : <ArrowUpDown className="w-3 h-3 text-gray-400" />}
                    </div>
                  </th>
                  <th className="py-3 px-4 text-right">Location</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-emerald-950 font-medium">
                {paginatedRequests.map((req) => {
                  const citizen = citizensMap[req.citizenId] || {};
                  const worker = workersMap[req.acceptedByWorkerId] || {};

                  const citizenName = citizen.fullName || req.citizenName || req.citizenId || 'Citizen';
                  const houseName = citizen.houseName || req.houseName || 'House';
                  const houseNumber = citizen.houseNumber || req.houseNumber || 'N/A';
                  const lat = citizen.latitude ?? req.latitude;
                  const lng = citizen.longitude ?? req.longitude;
                  const hasLocation = lat != null && lng != null && lat !== 0 && lng !== 0;
                  const isCompleted = req.scheduleStatus.isCompleted;

                  return (
                    <tr key={req.requestId || req.id} className="hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20 transition-colors">
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-mono font-bold text-[#0a4d2c] dark:text-emerald-400 block">
                          {req.requestId}
                        </span>
                        <span className="text-[10px] text-gray-500 dark:text-gray-400 block mt-0.5 font-semibold">
                          Req: {formatPickupDate(req.requestedAt, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-gray-900 dark:text-white">{citizenName}</div>
                        <div className="text-[11px] text-gray-500 dark:text-gray-400">
                          {houseName} • #{houseNumber}
                        </div>
                      </td>
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span className="font-extrabold text-gray-800 dark:text-gray-200">{req.wardId}</span>
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="font-semibold text-gray-800 dark:text-gray-200">{req.overallCategory || 'Recyclable Plastic'}</div>
                        <div className="text-[10.5px] text-gray-500 dark:text-gray-400">{req.estimatedVolume || 'Medium'}</div>
                      </td>
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <div className="space-y-1">
                          <div className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-emerald-700 dark:text-emerald-400" />
                            <span>{req.assignedPeriod} (20th–25th)</span>
                          </div>

                          {req.scheduleStatus.isCompleted ? (
                            <div>
                              <div className="font-bold text-emerald-800 dark:text-emerald-300 text-xs">
                                Collected: {formatPickupDate(req.collectedAt || req.collectionDate)}
                              </div>
                              <span className="inline-flex items-center gap-1 text-[9.5px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                                <CheckCircle2 className="w-2.5 h-2.5" /> Collection Completed
                              </span>
                            </div>
                          ) : req.scheduleStatus.isDue ? (
                            <div>
                              <div className="font-bold text-rose-800 dark:text-rose-300 text-xs">
                                Scheduled: {formatPickupDate(req.collectionDate || req.scheduledDate)}
                              </div>
                              <span className="inline-flex items-center gap-1 text-[9.5px] font-bold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950 px-1.5 py-0.5 rounded border border-rose-200 dark:border-rose-800">
                                <AlertTriangle className="w-2.5 h-2.5" /> Date Passed (Due)
                              </span>
                            </div>
                          ) : req.scheduleStatus.isToday ? (
                            <div>
                              <div className="font-bold text-amber-900 dark:text-amber-200 text-xs">
                                Today: {formatPickupDate(req.collectionDate || req.scheduledDate)}
                              </div>
                              <span className="inline-flex items-center gap-1 text-[9.5px] font-bold text-amber-800 dark:text-amber-200 bg-amber-100 dark:bg-amber-950 px-1.5 py-0.5 rounded border border-amber-300 dark:border-amber-700 animate-pulse">
                                <Clock className="w-2.5 h-2.5" /> Pickup Today
                              </span>
                            </div>
                          ) : req.scheduleStatus.isScheduled ? (
                            <div>
                              <div className="font-bold text-blue-900 dark:text-blue-200 text-xs">
                                {formatPickupDate(req.collectionDate || req.scheduledDate)}
                              </div>
                              <span className="inline-flex items-center gap-1 text-[9.5px] font-bold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 px-1.5 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                                Upcoming (20th–25th Window)
                              </span>
                            </div>
                          ) : (
                            <div>
                              <span className="text-amber-700 dark:text-amber-400 font-bold text-xs block">Unscheduled</span>
                              <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">Awaiting Worker Schedule</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        {worker.fullName || req.acceptedByWorkerId ? (
                          <span className="inline-flex items-center gap-1 font-bold text-gray-800 dark:text-gray-200">
                            <User className="w-3 h-3 text-gray-400" />
                            {worker.fullName || req.acceptedByWorkerId}
                          </span>
                        ) : (
                          <span className="text-rose-600 dark:text-rose-400 font-semibold text-[11px]">Unassigned</span>
                        )}
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="space-y-1.5">
                          <div>{getStatusBadge(req)}</div>
                          {req.dueReason && (
                            <div className="p-2 bg-amber-50 dark:bg-amber-950/40 rounded-lg border border-amber-200 dark:border-amber-800/60 max-w-[220px]">
                              <span className="text-[10px] font-extrabold text-amber-800 dark:text-amber-300 uppercase block">
                                Worker Reason:
                              </span>
                              <p className="text-xs font-bold text-gray-900 dark:text-white break-words">
                                "{req.dueReason}"
                              </p>
                              {req.dueReasonSubmittedAt && (
                                <span className="text-[9.5px] text-gray-500 dark:text-gray-400 block mt-0.5">
                                  {new Date(req.dueReasonSubmittedAt).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          )}
                          {!isCompleted && Boolean(req.dueReason) && req.adminApprovalStatus !== 'Approved' && req.adminApprovalStatus !== 'Rejected' && (
                            <div className="flex items-center gap-1.5 mt-1">
                              <button
                                onClick={() => handleAdminApproval(req.requestId, 'Approve')}
                                disabled={actionLoadingId === req.requestId}
                                className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10.5px] font-black flex items-center gap-1 cursor-pointer disabled:opacity-50 shadow-2xs"
                                title="Approve Missed Pickup (Unlocks Reschedule)"
                              >
                                <Check className="w-3 h-3" /> Approve
                              </button>
                              <button
                                onClick={() => handleAdminApproval(req.requestId, 'Reject')}
                                disabled={actionLoadingId === req.requestId}
                                className="px-2 py-1 bg-rose-100 hover:bg-rose-200 text-rose-800 rounded-lg text-[10.5px] font-black flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                title="Reject Missed Pickup (Keeps Locked)"
                              >
                                <X className="w-3 h-3" /> Reject
                              </button>
                            </div>
                          )}
                          {req.adminApprovalStatus === 'Approved' && !isCompleted && (
                            <span className="text-[10px] font-extrabold text-teal-700 dark:text-teal-400 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-teal-600" /> Reschedule Unlocked
                            </span>
                          )}
                          {req.adminApprovalStatus === 'Rejected' && !isCompleted && (
                            <span className="text-[10px] font-extrabold text-rose-700 dark:text-rose-400 flex items-center gap-1">
                              <XCircle className="w-3 h-3 text-rose-600" /> Pickup Locked
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        {hasLocation ? (
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-[#0a4d2c] dark:text-emerald-300 font-bold hover:bg-emerald-100 transition-colors"
                            title="Open in Google Maps"
                          >
                            <MapPin className="w-3 h-3 text-emerald-600" />
                            <span>GPS</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        ) : (
                          <span className="text-gray-400 text-[11px]">No GPS</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* CARD VIEW WITH FULL TIMELINE STEPPER */
        <div className="space-y-5">
          {paginatedRequests.map((req) => {
            const citizen = citizensMap[req.citizenId] || {};
            const worker = workersMap[req.acceptedByWorkerId] || {};

            const citizenName = citizen.fullName || req.citizenName || req.citizenId || 'Citizen';
            const houseName = citizen.houseName || req.houseName || 'House';
            const houseNumber = citizen.houseNumber || req.houseNumber || 'N/A';
            const address = citizen.address || req.address || 'Address not registered';
            const phone = citizen.phoneNumber || req.phoneNumber || 'N/A';
            const lat = citizen.latitude ?? req.latitude;
            const lng = citizen.longitude ?? req.longitude;
            const hasLocation = lat != null && lng != null && lat !== 0 && lng !== 0;
            const workerName = worker.fullName || req.acceptedByWorkerId || 'Unassigned';
            const isCompleted = req.scheduleStatus.isCompleted;

            return (
              <div
                key={req.requestId || req.id}
                className="bg-white dark:bg-[#14231b] rounded-3xl p-6 border-2 border-emerald-800/15 dark:border-emerald-700/30 shadow-2xs hover:shadow-md transition-all space-y-5"
              >
                {/* Header Card */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-gray-100 dark:border-emerald-900/60 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950 text-[#0a4d2c] dark:text-emerald-300 flex items-center justify-center font-extrabold text-sm shrink-0 border border-emerald-100 dark:border-emerald-800">
                      <Truck className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-base font-extrabold text-[#0a4d2c] dark:text-emerald-400 font-mono">
                          {req.requestId}
                        </span>
                        {getStatusBadge(req)}
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10.5px] font-bold border border-emerald-200 dark:border-emerald-800">
                          {req.assignedPeriod} (20th–25th)
                        </span>
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400 font-medium block mt-0.5">
                        Ward: <strong className="text-gray-800 dark:text-white">{req.wardId}</strong> • Created: {formatPickupDate(req.requestedAt, { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5 text-xs">
                    {req.collectionDate || req.scheduledDate ? (
                      <div className={`px-3 py-1.5 rounded-xl border font-bold flex items-center gap-1.5 ${
                        req.scheduleStatus.isDue
                          ? 'bg-rose-50 dark:bg-rose-950 border-rose-200 text-rose-800 dark:text-rose-300'
                          : req.scheduleStatus.isToday
                          ? 'bg-amber-100 dark:bg-amber-950 border-amber-300 text-amber-900 dark:text-amber-200'
                          : 'bg-emerald-50 dark:bg-emerald-950 border-emerald-200 dark:border-emerald-800 text-[#0a4d2c] dark:text-emerald-300'
                      }`}>
                        <Calendar className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Date: {formatPickupDate(req.collectionDate || req.scheduledDate)}</span>
                      </div>
                    ) : (
                      <div className="bg-amber-50 dark:bg-amber-950 px-3 py-1.5 rounded-xl border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 font-bold flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-amber-700" />
                        <span>Date: Awaiting Schedule</span>
                      </div>
                    )}

                    <div className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 border ${
                      req.acceptedByWorkerId ? 'bg-gray-50 dark:bg-[#0c1510] border-gray-200 dark:border-emerald-800 text-gray-800 dark:text-white' : 'bg-rose-50 dark:bg-rose-950 border-rose-200 text-rose-700'
                    }`}>
                      <User className="w-3.5 h-3.5 text-gray-600" />
                      <span>Worker: {workerName}</span>
                    </div>
                  </div>
                </div>

                {/* Visual Timeline Progress Stepper */}
                <div className="p-4 rounded-2xl bg-gray-50/70 dark:bg-[#0f1d16] border border-gray-200 dark:border-emerald-900/60">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-gray-600 dark:text-gray-300 flex items-center gap-1.5">
                      <Timer className="w-3.5 h-3.5 text-emerald-600" />
                      Collection Lifecycle Timeline
                    </span>
                    <span className="text-[10.5px] font-bold text-emerald-700 dark:text-emerald-400">
                      Target Window: {req.assignedPeriod} (20th–25th)
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 text-xs">
                    {/* Stage 1: Request Created */}
                    <div className="p-2.5 rounded-xl bg-white dark:bg-[#14231b] border border-emerald-200 dark:border-emerald-800/60 space-y-1">
                      <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-extrabold text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>1. Request Submitted</span>
                      </div>
                      <p className="text-[10.5px] font-semibold text-gray-800 dark:text-gray-200">
                        {formatPickupDate(req.requestedAt)}
                      </p>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400">
                        Assigned to {req.assignedPeriod}
                      </p>
                    </div>

                    {/* Stage 2: Worker Scheduling */}
                    <div className={`p-2.5 rounded-xl border space-y-1 ${
                      req.collectionDate || req.scheduledDate
                        ? 'bg-white dark:bg-[#14231b] border-blue-200 dark:border-blue-900/60'
                        : 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40'
                    }`}>
                      <div className={`flex items-center gap-1.5 font-extrabold text-[11px] ${
                        req.collectionDate || req.scheduledDate ? 'text-blue-700 dark:text-blue-400' : 'text-amber-700 dark:text-amber-400'
                      }`}>
                        {req.collectionDate || req.scheduledDate ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                        <span>2. Worker Schedule</span>
                      </div>
                      <p className="text-[10.5px] font-semibold text-gray-800 dark:text-gray-200">
                        {req.collectionDate || req.scheduledDate ? formatPickupDate(req.collectionDate || req.scheduledDate) : 'Pending Schedule'}
                      </p>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400">
                        {req.acceptedByWorkerId ? `Collector: ${workerName}` : 'Awaiting Collector'}
                      </p>
                    </div>

                    {/* Stage 3: Collection Window */}
                    <div className={`p-2.5 rounded-xl border space-y-1 ${
                      isCompleted
                        ? 'bg-white dark:bg-[#14231b] border-emerald-200 dark:border-emerald-800/60'
                        : req.scheduleStatus.isDue
                        ? 'bg-rose-50/60 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40'
                        : req.scheduleStatus.isToday
                        ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-700'
                        : 'bg-gray-50 dark:bg-[#0c1510] border-gray-200 dark:border-gray-800'
                    }`}>
                      <div className={`flex items-center gap-1.5 font-extrabold text-[11px] ${
                        isCompleted
                          ? 'text-emerald-700 dark:text-emerald-400'
                          : req.scheduleStatus.isDue
                          ? 'text-rose-700 dark:text-rose-400'
                          : req.scheduleStatus.isToday
                          ? 'text-amber-700 dark:text-amber-300'
                          : 'text-gray-500'
                      }`}>
                        {isCompleted ? <CheckCircle2 className="w-3.5 h-3.5" /> : req.scheduleStatus.isDue ? <AlertTriangle className="w-3.5 h-3.5" /> : <Calendar className="w-3.5 h-3.5" />}
                        <span>3. Doorstep Collection</span>
                      </div>
                      <p className="text-[10.5px] font-semibold text-gray-800 dark:text-gray-200">
                        {isCompleted
                          ? `Collected: ${formatPickupDate(req.collectedAt || req.collectionDate)}`
                          : req.scheduleStatus.isDue
                          ? 'Date Passed (Missed)'
                          : req.scheduleStatus.isToday
                          ? 'Collection Due Today!'
                          : 'Window: 20th–25th'}
                      </p>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400">
                        {isCompleted ? 'Waste received' : req.scheduleStatus.isDue ? 'Action required below' : 'Doorstep handover'}
                      </p>
                    </div>

                    {/* Stage 4: Verification / Due Review */}
                    <div className={`p-2.5 rounded-xl border space-y-1 ${
                      isCompleted
                        ? 'bg-white dark:bg-[#14231b] border-emerald-200 dark:border-emerald-800/60'
                        : req.scheduleStatus.isDue
                        ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800'
                        : 'bg-gray-50 dark:bg-[#0c1510] border-gray-200 dark:border-gray-800'
                    }`}>
                      <div className={`flex items-center gap-1.5 font-extrabold text-[11px] ${
                        isCompleted
                          ? 'text-emerald-700 dark:text-emerald-400'
                          : req.scheduleStatus.isDue
                          ? 'text-amber-700 dark:text-amber-300'
                          : 'text-gray-500'
                      }`}>
                        {isCompleted ? <CheckCircle2 className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                        <span>4. Verification & Review</span>
                      </div>
                      <p className="text-[10.5px] font-semibold text-gray-800 dark:text-gray-200">
                        {isCompleted
                          ? 'Verified with OTP'
                          : req.scheduleStatus.isDue
                          ? (req.adminApprovalStatus === 'Approved' ? 'Reschedule Unlocked' : req.dueReason ? 'Reason Under Review' : 'Reason Awaited')
                          : `Code: ${req.verificationCode || 'Generated'}`}
                      </p>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400">
                        {isCompleted ? 'Finalized in records' : req.scheduleStatus.isDue ? 'Admin oversight' : 'Citizen security code'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Details 3-Column Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div className="bg-gray-50/80 dark:bg-[#0c1510] p-4 rounded-2xl border border-gray-200 dark:border-emerald-900/60 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 flex items-center gap-1">
                        <Home className="w-3 h-3 text-[#0a4d2c]" /> House & Resident Info
                      </span>
                      {hasLocation && (
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-[#0a4d2c] dark:text-emerald-400 hover:underline"
                        >
                          <MapPin className="w-3 h-3 text-emerald-600" />
                          <span>Google Maps</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Citizen:</span>
                        <span className="font-extrabold text-gray-900 dark:text-white">{citizenName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">House Name:</span>
                        <span className="font-bold text-gray-800 dark:text-gray-200">{houseName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">House No:</span>
                        <span className="font-bold text-gray-800 dark:text-gray-200">{houseNumber}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Phone:</span>
                        <span className="font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                          <Phone className="w-3 h-3 text-gray-400" /> {phone}
                        </span>
                      </div>
                      <div className="pt-1 border-t border-gray-200 dark:border-emerald-900 text-gray-600 dark:text-gray-400">
                        <span className="text-gray-400 text-[10px] block">Address:</span>
                        <span className="font-medium line-clamp-2">{address}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-emerald-50/50 dark:bg-emerald-950/30 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-900/60 space-y-2.5">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#0a4d2c] dark:text-emerald-300 block">
                      Waste & Collection Window
                    </span>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500">Target Window:</span>
                        <span className="font-bold text-[#0a4d2c] dark:text-emerald-400 bg-white dark:bg-[#14231b] px-2.5 py-0.5 rounded-lg border border-emerald-200 dark:border-emerald-800 shadow-2xs">
                          {req.assignedPeriod} (20th–25th)
                        </span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-gray-500">Waste Category:</span>
                        <span className="font-semibold text-gray-800 dark:text-gray-200">
                          {req.overallCategory || 'Recyclable Plastic'}
                        </span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-gray-500">Volume Estimate:</span>
                        <span className="font-bold text-gray-800 dark:text-white bg-white dark:bg-[#14231b] px-2.5 py-0.5 rounded-lg border border-gray-200 dark:border-emerald-800">
                          {req.estimatedVolume || 'Medium'}
                        </span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-gray-500">Assigned Ward:</span>
                        <span className="font-extrabold text-[#0a4d2c] dark:text-emerald-400">
                          {req.wardId}
                        </span>
                      </div>

                      {req.verificationCode && (
                        <div className="p-2 rounded-xl bg-white dark:bg-[#14231b] border border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
                          <span className="text-gray-500 font-medium text-[11px]">Security Code:</span>
                          <span className="font-mono font-black text-xs text-[#0a4d2c] dark:text-emerald-400 tracking-wider">
                            {req.verificationCode}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-gray-50/80 dark:bg-[#0c1510] p-4 rounded-2xl border border-gray-200 dark:border-emerald-900/60 space-y-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 block">
                      Audit Timestamps & Worker
                    </span>

                    <div className="space-y-1.5">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Requested:</span>
                        <span className="font-medium text-gray-700 dark:text-gray-300">
                          {formatPickupDate(req.requestedAt, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>

                      {(req.collectionDate || req.scheduledDate) && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Scheduled Date:</span>
                          <span className="font-medium text-gray-700 dark:text-gray-300">
                            {formatPickupDate(req.collectionDate || req.scheduledDate, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </div>
                      )}

                      {req.collectedAt && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Collected:</span>
                          <span className="font-bold text-emerald-700 dark:text-emerald-400">
                            {formatPickupDate(req.collectedAt, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </div>
                      )}

                      <div className="pt-2 border-t border-gray-200 dark:border-emerald-900">
                        <span className="text-gray-400 text-[10px] block">Assigned Collector:</span>
                        <span className="font-bold text-gray-800 dark:text-white">
                          {worker.fullName ? `${worker.fullName} (${worker.workerId || req.acceptedByWorkerId})` : req.acceptedByWorkerId || 'Unassigned'}
                        </span>
                        {worker.phoneNumber && (
                          <span className="text-gray-500 text-[11px] block mt-0.5">
                            Phone: {worker.phoneNumber}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Missed Collection Review Section */}
                {(req.dueReason || req.dueStatus === 'Review Required' || req.dueStatus === 'Reason Submitted' || req.dueStatus === 'Approved for Reschedule' || req.dueStatus === 'Rejected' || req.scheduleStatus.isDue) && (
                  <div className="p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5 text-xs uppercase tracking-wider">
                        <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                        Missed Date Reason & Approvals
                      </span>
                      <span className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-md ${
                        req.dueStatus === 'Approved for Reschedule' || req.adminApprovalStatus === 'Approved'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                          : req.dueStatus === 'Rejected' || req.adminApprovalStatus === 'Rejected'
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-700'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-700'
                      }`}>
                        {req.dueStatus || (req.adminApprovalStatus ? `Admin: ${req.adminApprovalStatus}` : 'Review Required')}
                      </span>
                    </div>

                    {req.dueReason && (
                      <div className="bg-white dark:bg-[#14231b] p-3 rounded-xl border border-amber-100 dark:border-amber-900/60 text-gray-700 dark:text-gray-200">
                        <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 block uppercase">Worker Reason:</span>
                        <p className="font-semibold text-gray-900 dark:text-white text-xs mt-0.5">{req.dueReason}</p>
                      </div>
                    )}

                    {/* Admin Review Status */}
                    <div className="bg-white/90 dark:bg-[#14231b] p-3 rounded-xl border border-gray-200 dark:border-emerald-900/60 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase block">Admin Review Decision:</span>
                        <span className={`font-black mt-0.5 flex items-center gap-1.5 ${
                          req.adminApprovalStatus === 'Approved'
                            ? 'text-emerald-700 dark:text-emerald-400'
                            : req.adminApprovalStatus === 'Rejected'
                            ? 'text-rose-700 dark:text-rose-400'
                            : 'text-amber-700 dark:text-amber-400'
                        }`}>
                          {req.adminApprovalStatus === 'Approved' && <Check className="w-4 h-4 text-emerald-600" />}
                          {req.adminApprovalStatus === 'Rejected' && <X className="w-4 h-4 text-rose-600" />}
                          <span>
                            {req.adminApprovalStatus === 'Approved'
                              ? 'Approved (Worker Reschedule Unlocked)'
                              : req.adminApprovalStatus === 'Rejected'
                              ? 'Rejected (Pickup Remains Locked)'
                              : 'Pending Admin Review'}
                          </span>
                        </span>
                      </div>
                      <span className="text-[11px] text-gray-500 font-medium">
                        {req.adminApprovalStatus ? 'Decision recorded' : 'Action required by Admin'}
                      </span>
                    </div>

                    {/* Admin Action Buttons */}
                    {!isCompleted && (
                      <div className="pt-2 border-t border-amber-200/60 dark:border-amber-800/60 flex items-center gap-2">
                        {req.adminApprovalStatus !== 'Approved' && (
                          <button
                            onClick={() => handleAdminApproval(req.requestId, 'Approve')}
                            disabled={actionLoadingId === req.requestId}
                            className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-2xs transition-all disabled:opacity-50 cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>{actionLoadingId === req.requestId ? 'Saving...' : 'Approve Missed Pickup (Unlock Reschedule)'}</span>
                          </button>
                        )}
                        {req.adminApprovalStatus !== 'Rejected' && (
                          <button
                            onClick={() => handleAdminApproval(req.requestId, 'Reject')}
                            disabled={actionLoadingId === req.requestId}
                            className={`py-2 px-3 bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 font-bold rounded-xl text-xs flex items-center justify-center gap-1 transition-all disabled:opacity-50 cursor-pointer ${
                              req.adminApprovalStatus === 'Approved' ? 'w-auto' : 'flex-initial'
                            }`}
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Reject (Lock Pickup)</span>
                          </button>
                        )}
                      </div>
                    )}

                    {req.dueStatus === 'Approved for Reschedule' && (
                      <p className="text-xs text-emerald-800 dark:text-emerald-300 font-semibold text-center bg-emerald-50 dark:bg-emerald-950/50 py-2 px-3 rounded-xl border border-emerald-200 dark:border-emerald-800">
                        Approved by both Citizen and Admin. Worker can now reschedule within the 20th–25th collection window.
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      {sortedRequests.length > 0 && (
        <div className="bg-white dark:bg-[#14231b] p-4 rounded-3xl border-2 border-emerald-800/15 dark:border-emerald-700/30 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400">
            <span>Rows per page:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-gray-50 dark:bg-[#0c1510] border border-gray-200 dark:border-emerald-800 rounded-lg px-2.5 py-1 text-xs font-bold text-gray-800 dark:text-white focus:outline-none cursor-pointer"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span>Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong></span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded-xl border border-gray-200 dark:border-emerald-800 text-xs font-bold text-gray-700 dark:text-gray-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-emerald-50 dark:hover:bg-emerald-950 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) pageNum = i + 1;
              else if (currentPage <= 3) pageNum = i + 1;
              else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
              else pageNum = currentPage - 2 + i;

              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`w-8 h-8 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                    currentPage === pageNum
                      ? 'bg-[#0a4d2c] text-white shadow-xs'
                      : 'border border-gray-200 dark:border-emerald-800 text-gray-700 dark:text-gray-300 hover:bg-emerald-50 dark:hover:bg-emerald-950'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 rounded-xl border border-gray-200 dark:border-emerald-800 text-xs font-bold text-gray-700 dark:text-gray-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-emerald-50 dark:hover:bg-emerald-950 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPickups;
