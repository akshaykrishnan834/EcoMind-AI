import React, { useState, useEffect } from 'react';
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
  TrendingUp,
  PackageCheck
} from 'lucide-react';
import { getAllPickupRequests } from '../../services/pickupRequestService';

const AdminPickups = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [wardFilter, setWardFilter] = useState('All');

  const fetchAllPickups = async () => {
    setLoading(true);
    setError('');

    try {
      const data = await getAllPickupRequests();
      setRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching admin pickup records:', err);
      setError('Could not load system pickup request records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllPickups();
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

  // Extract unique wards for dropdown
  const uniqueWards = Array.from(
    new Set(requests.map(r => r.wardId).filter(Boolean))
  ).sort();

  // Filter requests
  const filteredRequests = requests.filter(req => {
    // Status filter
    if (statusFilter !== 'All') {
      const s = (req.status || '').toLowerCase();
      if (statusFilter === 'Scheduled' && !(s === 'scheduled' || s === 'accepted')) return false;
      if (statusFilter === 'Pending' && s !== 'pending') return false;
      if (statusFilter === 'Completed' && !(s === 'completed' || s === 'collected')) return false;
    }

    // Ward filter
    if (wardFilter !== 'All' && req.wardId !== wardFilter) {
      return false;
    }

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchId = (req.requestId || '').toLowerCase().includes(q);
      const matchCitizen = (req.citizenName || '').toLowerCase().includes(q) || (req.citizenId || '').toLowerCase().includes(q);
      const matchWard = (req.wardId || '').toLowerCase().includes(q);
      const matchAddress = (req.address || '').toLowerCase().includes(q) || (req.houseName || '').toLowerCase().includes(q);
      return matchId || matchCitizen || matchWard || matchAddress;
    }

    return true;
  });

  const getStatusBadgeClass = (status) => {
    switch ((status || '').toLowerCase()) {
      case 'scheduled':
      case 'accepted':
        return 'bg-[#0a4d2c] text-white border-emerald-800';
      case 'completed':
      case 'collected':
        return 'bg-blue-100 text-blue-900 border-blue-300';
      default:
        return 'bg-amber-100 text-amber-900 border-amber-300';
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#0a4d2c] via-[#0f5b37] to-emerald-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-1/4 -translate-y-1/4 w-72 h-72 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-emerald-200 text-xs font-semibold mb-2">
              <Truck className="w-3.5 h-3.5 text-emerald-300" />
              <span>Haritha Karma Sena Admin Audit</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Pickup Request Records & Monitoring
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100/90 font-medium mt-1">
              Centralized record of all monthly doorstep waste pickup requests submitted across all wards.
            </p>
          </div>

          <button
            type="button"
            onClick={fetchAllPickups}
            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2 shrink-0 self-start md:self-center"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Records</span>
          </button>
        </div>
      </div>

      {/* Overview KPI Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Requests */}
        <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-2xs hover:shadow-md transition-all space-y-2 group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Total System Requests</span>
            <div className="p-2.5 bg-emerald-50 rounded-xl text-[#0a4d2c] group-hover:scale-110 transition-transform">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-gray-900">{totalCount}</p>
          <p className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> All Wards Recorded
          </p>
        </div>

        {/* Metric 2: Pending Requests */}
        <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-2xs hover:shadow-md transition-all space-y-2 group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">Pending Action</span>
            <div className="p-2.5 bg-amber-50 rounded-xl text-amber-700 group-hover:scale-110 transition-transform">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-amber-900">{pendingCount}</p>
          <p className="text-[11px] font-semibold text-amber-700">
            Awaiting worker schedule assignment
          </p>
        </div>

        {/* Metric 3: Scheduled Pickups */}
        <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-2xs hover:shadow-md transition-all space-y-2 group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#0a4d2c] uppercase tracking-wider">Scheduled (15th–25th)</span>
            <div className="p-2.5 bg-emerald-50 rounded-xl text-[#0a4d2c] group-hover:scale-110 transition-transform">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-[#0a4d2c]">{scheduledCount}</p>
          <p className="text-[11px] font-semibold text-[#0a4d2c]">
            Confirmed dates assigned by workers
          </p>
        </div>

        {/* Metric 4: Completed Collections */}
        <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-2xs hover:shadow-md transition-all space-y-2 group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-blue-800 uppercase tracking-wider">Collected & Completed</span>
            <div className="p-2.5 bg-blue-50 rounded-xl text-blue-700 group-hover:scale-110 transition-transform">
              <PackageCheck className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-blue-900">{completedCount}</p>
          <p className="text-[11px] font-semibold text-blue-700">
            Doorstep waste collected
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
      <div className="bg-white p-4 rounded-3xl border border-emerald-100 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Request ID, Citizen Name, ID, Address, Ward..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-semibold text-gray-800 focus:outline-none focus:border-[#0a4d2c] focus:bg-white transition-all"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Status Filter */}
            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-700 focus:outline-none focus:border-[#0a4d2c]"
              >
                <option value="All">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="Scheduled">Scheduled</option>
                <option value="Completed">Completed</option>
              </select>
            </div>

            {/* Ward Filter */}
            <div className="flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-gray-400" />
              <select
                value={wardFilter}
                onChange={(e) => setWardFilter(e.target.value)}
                className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-700 focus:outline-none focus:border-[#0a4d2c]"
              >
                <option value="All">All Wards ({uniqueWards.length})</option>
                {uniqueWards.map(w => (
                  <option key={w} value={w}>{w}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
          <span>Showing {filteredRequests.length} of {requests.length} recorded pickup requests</span>
          {(searchQuery || statusFilter !== 'All' || wardFilter !== 'All') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('All');
                setWardFilter('All');
              }}
              className="text-xs font-bold text-[#0a4d2c] hover:underline cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Data Table / Cards Grid */}
      {loading ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-emerald-100 shadow-sm space-y-3">
          <div className="w-8 h-8 border-3 border-[#0a4d2c] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-gray-500 font-medium">Loading system pickup request records...</p>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-emerald-100 shadow-sm space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-[#0a4d2c] flex items-center justify-center mx-auto">
            <Truck className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-gray-800">No Matching Pickup Records</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            No pickup requests matched your current filters or query.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map((req) => {
            const statusLower = (req.status || '').toLowerCase();
            const isScheduled = statusLower === 'scheduled' || statusLower === 'accepted';

            return (
              <div
                key={req.requestId || req.id}
                className="bg-white rounded-3xl p-6 border border-emerald-100 shadow-2xs hover:shadow-md transition-all space-y-4"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-gray-100 pb-4">
                  {/* Left: Request ID & Status */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-[#0a4d2c] flex items-center justify-center font-extrabold text-sm shrink-0">
                      <Truck className="w-5 h-5 text-[#0a4d2c]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-base font-extrabold text-[#0a4d2c]">
                          {req.requestId}
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border ${getStatusBadgeClass(req.status)}`}>
                          {isScheduled ? 'Scheduled' : req.status}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500 font-medium block">
                        Requested: {req.requestedAt ? new Date(req.requestedAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                      </span>
                    </div>
                  </div>

                  {/* Right: Worker / Scheduled Info */}
                  <div className="flex flex-wrap items-center gap-3 text-xs">
                    {req.collectionDate && (
                      <div className="bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 text-[#0a4d2c] font-bold flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Scheduled: {new Date(req.collectionDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      </div>
                    )}

                    {req.acceptedByWorkerId && (
                      <div className="bg-gray-100 px-3 py-1.5 rounded-xl text-gray-700 font-bold flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-gray-600" />
                        <span>Assigned Worker: {req.acceptedByWorkerId}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Details Body */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  {/* Column 1: Citizen & Residence Details */}
                  <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-200 space-y-1">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 block mb-1">
                      Citizen Residence Record
                    </span>
                    <div className="flex justify-between py-0.5">
                      <span className="text-gray-500">Citizen Name:</span>
                      <span className="font-extrabold text-gray-900">{req.citizenName || req.citizenId}</span>
                    </div>
                    <div className="flex justify-between py-0.5">
                      <span className="text-gray-500">Citizen ID:</span>
                      <span className="font-bold text-gray-800">{req.citizenId}</span>
                    </div>
                    <div className="flex justify-between py-0.5">
                      <span className="text-gray-500">House Details:</span>
                      <span className="font-bold text-gray-800">{req.houseName || 'House'} • No: {req.houseNumber || 'N/A'}</span>
                    </div>
                    {req.address && (
                      <div className="flex justify-between py-0.5">
                        <span className="text-gray-500">Address:</span>
                        <span className="font-bold text-gray-800 truncate max-w-[150px]">{req.address}</span>
                      </div>
                    )}
                    <div className="flex justify-between py-0.5">
                      <span className="text-gray-500">Ward:</span>
                      <span className="font-extrabold text-[#0a4d2c]">{req.wardId}</span>
                    </div>
                  </div>

                  {/* Column 2: Waste Details */}
                  <div className="bg-emerald-50/60 p-3.5 rounded-2xl border border-emerald-100 space-y-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#0a4d2c] block mb-1">
                      Waste Details
                    </span>
                    <div className="flex justify-between items-center py-0.5">
                      <span className="text-gray-500">Waste Category:</span>
                      <span className="font-bold text-[#0a4d2c] bg-white px-2.5 py-1 rounded-md border border-emerald-200">
                        {req.overallCategory || 'Recyclable Plastic'}
                      </span>
                    </div>
                  </div>

                  {/* Column 3: AI & Status Details */}
                  <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-200 space-y-1.5">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 block mb-1">
                      Classification & Timestamps
                    </span>
                    <div className="flex justify-between py-0.5">
                      <span className="text-gray-500">Classification:</span>
                      <span className="font-bold text-[#0a4d2c]">{req.overallCategory || 'Recyclable Plastic'}</span>
                    </div>
                    {req.acceptedAt && (
                      <div className="flex justify-between py-0.5">
                        <span className="text-gray-500">Scheduled At:</span>
                        <span className="font-semibold text-gray-700">
                          {new Date(req.acceptedAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                    )}
                    {req.collectedAt && (
                      <div className="flex justify-between py-0.5">
                        <span className="text-gray-500">Collected At:</span>
                        <span className="font-extrabold text-blue-900">
                          {new Date(req.collectedAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminPickups;
