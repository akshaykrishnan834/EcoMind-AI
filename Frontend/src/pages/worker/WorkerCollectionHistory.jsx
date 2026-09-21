import React, { useState, useEffect, useMemo } from 'react';
import {
  History,
  Search,
  Calendar,
  CheckCircle2,
  Download,
  RefreshCw,
  User,
  Home,
  MapPin,
  Clock,
  ShieldCheck,
  Truck,
  Filter,
  FileSpreadsheet
} from 'lucide-react';
import { getWardPickupRequests } from '../../services/pickupRequestService';

const WorkerCollectionHistory = ({ wardId, workerId }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('All'); // 'All' | '1' ... '12'
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());

  const fetchHistory = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getWardPickupRequests(wardId || 'Ward 1', workerId);
      setRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching collection history:', err);
      setError('Could not load completed collection records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [wardId, workerId]);

  // Filter for completed/collected pickups
  const completedPickups = useMemo(() => {
    return requests.filter((req) => {
      const status = (req.status || '').toLowerCase();
      return status === 'completed' || status === 'collected';
    });
  }, [requests]);

  // Extract available years from records
  const availableYears = useMemo(() => {
    const years = new Set([new Date().getFullYear().toString()]);
    completedPickups.forEach((req) => {
      const d = new Date(req.collectedAt || req.collectionDate || req.requestedAt);
      if (!isNaN(d.getFullYear())) {
        years.add(d.getFullYear().toString());
      }
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [completedPickups]);

  // Filter by search, month, and year
  const filteredPickups = useMemo(() => {
    return completedPickups.filter((req) => {
      const d = new Date(req.collectedAt || req.collectionDate || req.requestedAt);
      const reqYear = d.getFullYear().toString();
      const reqMonth = (d.getMonth() + 1).toString();

      if (selectedYear !== 'All' && reqYear !== selectedYear) return false;
      if (selectedMonth !== 'All' && reqMonth !== selectedMonth) return false;

      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase();
      return (
        (req.requestId || '').toLowerCase().includes(q) ||
        (req.citizenName || '').toLowerCase().includes(q) ||
        (req.citizenId || '').toLowerCase().includes(q) ||
        (req.houseName || '').toLowerCase().includes(q) ||
        (req.houseNumber || '').toString().toLowerCase().includes(q) ||
        (req.address || '').toLowerCase().includes(q)
      );
    });
  }, [completedPickups, searchQuery, selectedMonth, selectedYear]);

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ['Request ID', 'Collection Date', 'Citizen Name', 'Citizen ID', 'House Name', 'House Number', 'Ward', 'Waste Category', 'Verification Code', 'Status'];
    const rows = filteredPickups.map((req) => {
      const d = new Date(req.collectedAt || req.collectionDate || req.requestedAt);
      const dateStr = !isNaN(d.getTime()) ? d.toLocaleDateString('en-GB') : '-';
      return [
        req.requestId || '',
        dateStr,
        req.citizenName || '',
        req.citizenId || '',
        req.houseName || '',
        req.houseNumber || '',
        req.wardId || wardId || '',
        req.overallCategory || 'Recyclable Plastic',
        req.verificationCode || 'Verified',
        'Completed'
      ];
    });

    let csvContent = '\uFEFF';
    csvContent += `"Haritha Karma Sena - Collection History"\n`;
    csvContent += `"Ward:","${wardId}","Worker:","${workerId}","Generated:","${new Date().toLocaleString()}"\n\n`;
    csvContent += headers.map((h) => `"${h}"`).join(',') + '\n';
    rows.forEach((r) => {
      csvContent += r.map((cell) => `"${(cell || '').toString().replace(/"/g, '""')}"`).join(',') + '\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Collection_History_${wardId}_${selectedYear}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const monthNames = [
    { num: '1', name: 'January' },
    { num: '2', name: 'February' },
    { num: '3', name: 'March' },
    { num: '4', name: 'April' },
    { num: '5', name: 'May' },
    { num: '6', name: 'June' },
    { num: '7', name: 'July' },
    { num: '8', name: 'August' },
    { num: '9', name: 'September' },
    { num: '10', name: 'October' },
    { num: '11', name: 'November' },
    { num: '12', name: 'December' }
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fadeIn pb-12">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#0a4d2c] via-[#0f5b37] to-emerald-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-emerald-200 text-xs font-semibold">
            <History className="w-3.5 h-3.5 text-emerald-300" />
            <span>Haritha Karma Sena Historical Records</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Collection History
          </h1>
          <p className="text-xs sm:text-sm text-emerald-100/90 font-medium max-w-xl">
            Detailed log of all previously completed and verified doorstep plastic waste collections for {wardId || 'Ward 1'}.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={fetchHistory}
            disabled={loading}
            className="px-3.5 py-2.5 bg-emerald-900/80 hover:bg-emerald-950 border border-emerald-400/40 text-emerald-200 font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleExportCSV}
            disabled={filteredPickups.length === 0}
            className="px-4 py-2.5 bg-white text-[#0a4d2c] hover:bg-emerald-50 font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Download className="w-4 h-4 text-[#0a4d2c]" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Summary Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-xs flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-emerald-50 text-[#0a4d2c] shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 block">Total Completed</span>
            <span className="text-2xl font-black text-gray-900">{completedPickups.length}</span>
            <span className="text-[11px] text-gray-500 font-medium block">All-time pickups</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-xs flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-blue-50 text-blue-700 shrink-0">
            <Home className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 block">Households Serviced</span>
            <span className="text-2xl font-black text-gray-900">
              {new Set(completedPickups.map((p) => p.citizenId || p.houseNumber)).size}
            </span>
            <span className="text-[11px] text-gray-500 font-medium block">Unique residences</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-xs flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-teal-50 text-teal-700 shrink-0">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 block">Selected Period</span>
            <span className="text-2xl font-black text-gray-900">{filteredPickups.length}</span>
            <span className="text-[11px] text-gray-500 font-medium block">Pickups in filter</span>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by Citizen, House, Request ID or Address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#0a4d2c] focus:bg-white transition-all"
          />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 focus:outline-none focus:border-[#0a4d2c]"
          >
            <option value="All">All Months</option>
            {monthNames.map((m) => (
              <option key={m.num} value={m.num}>
                {m.name}
              </option>
            ))}
          </select>

          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 focus:outline-none focus:border-[#0a4d2c]"
          >
            <option value="All">All Years</option>
            {availableYears.map((yr) => (
              <option key={yr} value={yr}>
                {yr}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* History Table */}
      <div className="bg-white rounded-3xl border border-emerald-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-8 h-8 border-3 border-[#0a4d2c] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-gray-500 font-medium">Loading collection records...</p>
          </div>
        ) : filteredPickups.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#0a4d2c] flex items-center justify-center mx-auto">
              <History className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-gray-800">No Completed Records Found</h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              No completed plastic pickup requests match your filter criteria.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-emerald-50/80 border-b border-emerald-100 text-[#0a4d2c] font-black uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Request ID</th>
                  <th className="py-3 px-4">Citizen / Household</th>
                  <th className="py-3 px-4">Address / Ward</th>
                  <th className="py-3 px-4">Waste Category</th>
                  <th className="py-3 px-4 text-center">Code Verification</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredPickups.map((req) => {
                  const d = new Date(req.collectedAt || req.collectionDate || req.requestedAt);
                  const formattedDate = !isNaN(d.getTime())
                    ? d.toLocaleDateString('en-US', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })
                    : 'N/A';

                  return (
                    <tr key={req.requestId || req.id} className="hover:bg-emerald-50/40 transition-colors">
                      {/* Date */}
                      <td className="py-3.5 px-4 font-bold text-gray-900 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-[#0a4d2c]" />
                          <span>{formattedDate}</span>
                        </div>
                      </td>

                      {/* Request ID */}
                      <td className="py-3.5 px-4 font-mono font-extrabold text-[#0a4d2c] whitespace-nowrap">
                        {req.requestId}
                      </td>

                      {/* Citizen & House */}
                      <td className="py-3.5 px-4">
                        <div className="font-extrabold text-gray-900">{req.citizenName || 'Citizen'}</div>
                        <div className="text-[11px] text-gray-500">
                          {req.houseName || 'House'} • No: {req.houseNumber || 'N/A'}
                        </div>
                      </td>

                      {/* Address / Ward */}
                      <td className="py-3.5 px-4 max-w-[200px] truncate text-gray-600">
                        <div>{req.address || 'Address N/A'}</div>
                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          {req.wardId || wardId}
                        </span>
                      </td>

                      {/* Waste Category */}
                      <td className="py-3.5 px-4 font-medium text-gray-800 whitespace-nowrap">
                        <span className="px-2.5 py-1 rounded-lg bg-gray-100 border border-gray-200 text-[11px] font-bold text-gray-700">
                          {req.overallCategory || 'Recyclable Plastic'}
                        </span>
                      </td>

                      {/* Code Verification */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-[#0a4d2c] border border-emerald-300 rounded-lg font-mono text-xs font-black">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{req.verificationCode || 'Verified'}</span>
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-emerald-100 text-[#0a4d2c] border border-emerald-300">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#0a4d2c]" />
                          <span>Completed</span>
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkerCollectionHistory;
