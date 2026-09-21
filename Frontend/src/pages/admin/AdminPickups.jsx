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
  Sparkles
} from 'lucide-react';
import { getAllPickupRequests } from '../../services/pickupRequestService';
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
  const [wardFilter, setWardFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('All');
  const [volumeFilter, setVolumeFilter] = useState('All');

  // Sorting & Pagination State
  const [sortField, setSortField] = useState('date');
  const [sortDirection, setSortDirection] = useState('desc'); // 'asc' | 'desc'
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'cards'

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

  // Compute stats
  const totalCount = requests.length;
  const pendingCount = requests.filter(r => (r.status || '').toLowerCase() === 'pending').length;
  const scheduledCount = requests.filter(r => {
    const s = (r.status || '').toLowerCase();
    return s === 'scheduled' || s === 'accepted';
  }).length;
  const completedCount = requests.filter(r => {
    const s = (r.status || '').toLowerCase();
    return s === 'completed' || s === 'collected';
  }).length;
  const failedCount = requests.filter(r => {
    const s = (r.status || '').toLowerCase();
    return s === 'failed' || s === 'missed';
  }).length;

  // Extract unique wards for dropdown
  const uniqueWards = Array.from(
    new Set(requests.map(r => r.wardId).filter(Boolean))
  ).sort();

  // Extract unique collection dates for dropdown
  const uniqueDates = Array.from(
    new Set(
      requests
        .map(r => r.collectionDate ? r.collectionDate.substring(0, 10) : null)
        .filter(Boolean)
    )
  ).sort();

  // Filter requests
  const filteredRequests = useMemo(() => {
    return requests.filter(req => {
      // Status filter
      if (statusFilter !== 'All') {
        const s = (req.status || '').toLowerCase();
        if (statusFilter === 'Scheduled' && !(s === 'scheduled' || s === 'accepted')) return false;
        if (statusFilter === 'Pending' && s !== 'pending') return false;
        if (statusFilter === 'Completed' && !(s === 'completed' || s === 'collected')) return false;
        if (statusFilter === 'Failed' && !(s === 'failed' || s === 'missed')) return false;
      }

      // Ward filter
      if (wardFilter !== 'All' && req.wardId !== wardFilter) {
        return false;
      }

      // Date filter
      if (dateFilter !== 'All') {
        const cDate = req.collectionDate ? req.collectionDate.substring(0, 10) : null;
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

        return matchId || matchCitizenName || matchCitizenId || matchHouse || matchWard || matchAddress || matchWorker;
      }

      return true;
    });
  }, [requests, statusFilter, wardFilter, dateFilter, volumeFilter, searchQuery, citizensMap, workersMap]);

  // Sort requests
  const sortedRequests = useMemo(() => {
    const list = [...filteredRequests];
    list.sort((a, b) => {
      let valA = '';
      let valB = '';

      if (sortField === 'date') {
        valA = new Date(a.collectionDate || a.requestedAt || 0).getTime();
        valB = new Date(b.collectionDate || b.requestedAt || 0).getTime();
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
        valA = a.status || '';
        valB = b.status || '';
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
  }, [searchQuery, statusFilter, wardFilter, dateFilter, volumeFilter, sortField, sortDirection]);

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

  const getStatusBadge = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'completed' || s === 'collected') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400" />
          Completed
        </span>
      );
    }
    if (s === 'scheduled' || s === 'accepted') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-100 text-blue-900 border border-blue-300 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400" />
          Scheduled
        </span>
      );
    }
    if (s === 'failed' || s === 'missed') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-900 border border-rose-300 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-600 dark:bg-rose-400" />
          Missed
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 dark:bg-amber-400" />
        Pending
      </span>
    );
  };

  const isCollectionWindow = (dateStr) => {
    if (!dateStr) return false;
    try {
      const d = new Date(dateStr);
      const day = d.getDate();
      return day >= 15 && day <= 25;
    } catch {
      return false;
    }
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
              Pickup Request & House Management
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100/90 font-medium mt-1 max-w-2xl">
              Real-time directory of all doorstep plastic waste pickup requests, household locations, scheduled dates (15th–25th window), and assigned field collectors.
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

      {/* Overview KPI Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Metric 1: Total Requests */}
        <div
          onClick={() => setStatusFilter('All')}
          className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer space-y-1.5 group ${
            statusFilter === 'All'
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
            <CheckCircle2 className="w-3 h-3" /> All Wards
          </p>
        </div>

        {/* Metric 2: Pending Requests */}
        <div 
          onClick={() => setStatusFilter(statusFilter === 'Pending' ? 'All' : 'Pending')}
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
            Awaiting Schedule
          </p>
        </div>

        {/* Metric 3: Scheduled Pickups */}
        <div 
          onClick={() => setStatusFilter(statusFilter === 'Scheduled' ? 'All' : 'Scheduled')}
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
            15th–25th Window
          </p>
        </div>

        {/* Metric 4: Completed Collections */}
        <div 
          onClick={() => setStatusFilter(statusFilter === 'Completed' ? 'All' : 'Completed')}
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
            Drives Collected
          </p>
        </div>

        {/* Metric 5: Missed / Failed */}
        <div 
          onClick={() => setStatusFilter(statusFilter === 'Failed' ? 'All' : 'Failed')}
          className={`col-span-2 sm:col-span-1 p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer space-y-1.5 group ${
            statusFilter === 'Failed' 
              ? 'bg-rose-50/90 dark:bg-rose-950/40 border-rose-500 shadow-md ring-2 ring-rose-400/30' 
              : 'bg-white dark:bg-[#14231b] border-emerald-800/15 dark:border-emerald-700/30 shadow-2xs hover:shadow-md'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider">Missed</span>
            <div className="p-2 bg-rose-50 dark:bg-rose-950/60 rounded-xl text-rose-700 dark:text-rose-300">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-rose-900 dark:text-rose-200">{failedCount}</p>
          <p className="text-[10.5px] font-semibold text-rose-700 dark:text-rose-400">
            Action Required
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border-l-4 border-rose-500 text-rose-900 text-xs font-bold rounded-2xl flex items-center gap-3 shadow-xs">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="bg-white dark:bg-[#14231b] p-5 rounded-3xl border-2 border-emerald-800/15 dark:border-emerald-700/30 shadow-2xs space-y-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Request ID, Citizen Name, House Name, Number, Address, Worker..."
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
                <option value="Pending">Pending</option>
                <option value="Scheduled">Scheduled</option>
                <option value="Completed">Completed</option>
                <option value="Failed">Missed / Failed</option>
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
                <option value="All">All Dates</option>
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
          {(searchQuery || statusFilter !== 'All' || wardFilter !== 'All' || dateFilter !== 'All' || volumeFilter !== 'All') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('All');
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
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Loading system pickup request records & household locations...</p>
        </div>
      ) : sortedRequests.length === 0 ? (
        <div className="bg-white dark:bg-[#14231b] rounded-3xl p-12 text-center border-2 border-emerald-800/15 dark:border-emerald-700/30 shadow-sm space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-[#0a4d2c] dark:text-emerald-300 flex items-center justify-center mx-auto">
            <Truck className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-gray-800 dark:text-white">No Matching Pickup Records</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
            No pickup requests matched your current filters or search criteria.
          </p>
        </div>
      ) : viewMode === 'table' ? (
        /* TABLE VIEW WITH SORTABLE HEADERS */
        <div className="bg-white dark:bg-[#14231b] rounded-3xl border-2 border-emerald-800/15 dark:border-emerald-700/30 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-emerald-50/60 dark:bg-emerald-950/50 border-b border-gray-100 dark:border-emerald-900/60 text-gray-600 dark:text-gray-300 uppercase text-[10px] font-black tracking-wider">
                  <th onClick={() => handleSort('requestId')} className="py-3 px-4 cursor-pointer hover:text-[#0a4d2c]">
                    <div className="flex items-center gap-1.5">
                      <span>Request ID</span>
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
                      <span>Schedule Date</span>
                      {sortField === 'date' ? (sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-[#0a4d2c]" /> : <ArrowDown className="w-3 h-3 text-[#0a4d2c]" />) : <ArrowUpDown className="w-3 h-3 text-gray-400" />}
                    </div>
                  </th>
                  <th className="py-3 px-3">Assigned Worker</th>
                  <th onClick={() => handleSort('status')} className="py-3 px-3 cursor-pointer hover:text-[#0a4d2c]">
                    <div className="flex items-center gap-1.5">
                      <span>Status</span>
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
                  const inWindow = isCollectionWindow(req.collectionDate);

                  return (
                    <tr key={req.requestId || req.id} className="hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-[#0a4d2c] dark:text-emerald-400 whitespace-nowrap">
                        {req.requestId}
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
                        {req.collectionDate ? (
                          <div>
                            <div className="font-bold text-gray-900 dark:text-white">
                              {new Date(req.collectionDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </div>
                            {inWindow && (
                              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">15th–25th Window</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-amber-600 dark:text-amber-400 font-semibold text-[11px]">Unscheduled</span>
                        )}
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
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        {getStatusBadge(req.status)}
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
        /* CARD VIEW */
        <div className="space-y-4">
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
            const inWindow = isCollectionWindow(req.collectionDate);

            return (
              <div
                key={req.requestId || req.id}
                className="bg-white dark:bg-[#14231b] rounded-3xl p-6 border-2 border-emerald-800/15 dark:border-emerald-700/30 shadow-2xs hover:shadow-md transition-all space-y-4"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-gray-100 dark:border-emerald-900/60 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950 text-[#0a4d2c] dark:text-emerald-300 flex items-center justify-center font-extrabold text-sm shrink-0 border border-emerald-100 dark:border-emerald-800">
                      <Truck className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-base font-extrabold text-[#0a4d2c] dark:text-emerald-400 font-mono">
                          {req.requestId}
                        </span>
                        {getStatusBadge(req.status)}
                        {inWindow && (
                          <span className="hidden sm:inline-block px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold border border-emerald-200 dark:border-emerald-800">
                            15th–25th Window
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400 font-medium block">
                        Ward: <strong className="text-gray-800 dark:text-white">{req.wardId}</strong> • Requested {req.requestedAt ? new Date(req.requestedAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5 text-xs">
                    {req.collectionDate ? (
                      <div className="bg-emerald-50 dark:bg-emerald-950 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800 text-[#0a4d2c] dark:text-emerald-300 font-bold flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Date: {new Date(req.collectionDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
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
                      Waste & Volume Details
                    </span>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500">Waste Category:</span>
                        <span className="font-bold text-[#0a4d2c] dark:text-emerald-400 bg-white dark:bg-[#14231b] px-2.5 py-0.5 rounded-lg border border-emerald-200 dark:border-emerald-800 shadow-2xs">
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
                          {req.requestedAt ? new Date(req.requestedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                        </span>
                      </div>

                      {req.acceptedAt && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Scheduled:</span>
                          <span className="font-medium text-gray-700 dark:text-gray-300">
                            {new Date(req.acceptedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </div>
                      )}

                      {req.collectedAt && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Collected:</span>
                          <span className="font-bold text-emerald-700 dark:text-emerald-400">
                            {new Date(req.collectedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
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

