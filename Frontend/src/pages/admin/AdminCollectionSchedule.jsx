import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Truck,
  User,
  MapPin,
  CheckCircle2,
  Clock,
  Home,
  Phone,
  ExternalLink,
  RefreshCw,
  Building2,
  Search,
  Filter,
  Users,
  ChevronRight,
  ShieldCheck,
  PackageCheck,
  CalendarDays
} from 'lucide-react';
import { getAllPickupRequests } from '../../services/pickupRequestService';
import { getAllCitizens } from '../../services/citizenService';
import { getAllWorkers } from '../../services/workerService';

const AdminCollectionSchedule = () => {
  const [requests, setRequests] = useState([]);
  const [citizensMap, setCitizensMap] = useState({});
  const [workersList, setWorkersList] = useState([]);
  const [workersMap, setWorkersMap] = useState({});
  const [loading, setLoading] = useState(true);

  // Filters state
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1); // 1-12
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedWard, setSelectedWard] = useState('All');
  const [selectedDay, setSelectedDay] = useState('All'); // 'All' or number 15-25
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSubTab, setActiveSubTab] = useState('date-wise'); // 'date-wise' | 'worker-wise'

  const months = [
    { value: 1, name: 'January' },
    { value: 2, name: 'February' },
    { value: 3, name: 'March' },
    { value: 4, name: 'April' },
    { value: 5, name: 'May' },
    { value: 6, name: 'June' },
    { value: 7, name: 'July' },
    { value: 8, name: 'August' },
    { value: 9, name: 'September' },
    { value: 10, name: 'October' },
    { value: 11, name: 'November' },
    { value: 12, name: 'December' }
  ];

  const collectionDays = Array.from({ length: 11 }, (_, i) => 15 + i); // [15, 16, ..., 25]

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pickups, citizens, workers] = await Promise.all([
        getAllPickupRequests().catch(() => []),
        getAllCitizens().catch(() => []),
        getAllWorkers().catch(() => [])
      ]);

      const cMap = {};
      if (Array.isArray(citizens)) {
        citizens.forEach(c => {
          if (c.citizenId) cMap[c.citizenId] = c;
          if (c.id) cMap[c.id] = c;
          if (c.email) cMap[c.email] = c;
        });
      }
      setCitizensMap(cMap);

      const wMap = {};
      const validWorkers = Array.isArray(workers) ? workers : [];
      validWorkers.forEach(w => {
        if (w.workerId) wMap[w.workerId] = w;
        if (w.id) wMap[w.id] = w;
        if (w.email) wMap[w.email] = w;
      });
      setWorkersMap(wMap);
      setWorkersList(validWorkers);

      setRequests(Array.isArray(pickups) ? pickups : []);
    } catch (err) {
      console.error('Error fetching collection schedule data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter requests for the selected month and year
  const monthlyScheduledRequests = requests.filter(req => {
    if (!req.collectionDate) return false;
    const d = new Date(req.collectionDate);
    return (
      d.getFullYear() === Number(selectedYear) &&
      d.getMonth() + 1 === Number(selectedMonth)
    );
  });

  // Calculate day-wise distribution in the 15th–25th window
  const dayCounts = {};
  collectionDays.forEach(day => {
    dayCounts[day] = 0;
  });

  monthlyScheduledRequests.forEach(req => {
    const d = new Date(req.collectionDate);
    const day = d.getDate();
    if (day >= 15 && day <= 25) {
      dayCounts[day] = (dayCounts[day] || 0) + 1;
    }
  });

  // Unique wards for dropdown
  const uniqueWards = Array.from(
    new Set(requests.map(r => r.wardId).filter(Boolean))
  ).sort();

  // Filtered requests based on Ward, Selected Day, and Search Query
  const filteredSchedule = monthlyScheduledRequests.filter(req => {
    // Ward filter
    if (selectedWard !== 'All' && req.wardId !== selectedWard) {
      return false;
    }

    // Day filter (15-25 or All)
    const d = new Date(req.collectionDate);
    const day = d.getDate();
    if (selectedDay !== 'All') {
      if (day !== Number(selectedDay)) return false;
    } else {
      // If 'All', only show window 15th-25th
      if (day < 15 || day > 25) return false;
    }

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const citizen = citizensMap[req.citizenId] || {};
      const worker = workersMap[req.acceptedByWorkerId] || {};

      const matchId = (req.requestId || '').toLowerCase().includes(q);
      const matchCitizen = (citizen.fullName || req.citizenName || req.citizenId || '').toLowerCase().includes(q);
      const matchHouse = (citizen.houseName || req.houseName || citizen.houseNumber || req.houseNumber || '').toLowerCase().includes(q);
      const matchAddress = (citizen.address || req.address || '').toLowerCase().includes(q);
      const matchWorker = (worker.fullName || req.acceptedByWorkerId || '').toLowerCase().includes(q);

      return matchId || matchCitizen || matchHouse || matchAddress || matchWorker;
    }

    return true;
  });

  // Worker-wise group breakdown
  const workerScheduleGroups = workersList.map(worker => {
    const workerPickups = monthlyScheduledRequests.filter(req => {
      const isAssigned = (req.acceptedByWorkerId === worker.workerId || req.acceptedByWorkerId === worker.fullName);
      if (!isAssigned) return false;

      // Filter by ward if selected
      if (selectedWard !== 'All' && req.wardId !== selectedWard) return false;

      // Filter by window 15th-25th
      const d = new Date(req.collectionDate);
      const day = d.getDate();
      if (selectedDay !== 'All') {
        return day === Number(selectedDay);
      }
      return day >= 15 && day <= 25;
    });

    const completed = workerPickups.filter(p => {
      const s = (p.status || '').toLowerCase();
      return s === 'completed' || s === 'collected';
    }).length;

    return {
      worker,
      pickups: workerPickups,
      totalScheduled: workerPickups.length,
      completed,
      pending: workerPickups.length - completed
    };
  });

  // KPI Metrics
  const totalWindowPickups = monthlyScheduledRequests.filter(r => {
    const d = new Date(r.collectionDate);
    const day = d.getDate();
    return day >= 15 && day <= 25;
  }).length;

  const completedInWindow = monthlyScheduledRequests.filter(r => {
    const d = new Date(r.collectionDate);
    const day = d.getDate();
    const s = (r.status || '').toLowerCase();
    return day >= 15 && day <= 25 && (s === 'completed' || s === 'collected');
  }).length;

  const completionRate = totalWindowPickups > 0 ? Math.round((completedInWindow / totalWindowPickups) * 100) : 0;

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Hero Header Banner */}
      <div className="bg-gradient-to-r from-[#0a4d2c] via-[#0f5b37] to-emerald-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-1/4 -translate-y-1/4 w-72 h-72 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-emerald-200 text-xs font-semibold mb-2">
              <CalendarDays className="w-3.5 h-3.5 text-emerald-300" />
              <span>Haritha Karma Sena Collection Calendar</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Monthly Collection Schedule (15th–25th)
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100/90 font-medium mt-1">
              Oversee the scheduled doorstep plastic waste collection window across all wards, track houses scheduled for each date, and audit worker allocations.
            </p>
          </div>

          <button
            type="button"
            onClick={fetchData}
            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2 shrink-0 self-start md:self-center"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Schedule</span>
          </button>
        </div>
      </div>

      {/* Month, Year & Ward Controls Bar */}
      <div className="bg-white p-5 rounded-3xl border border-emerald-100 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Month Selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Month:</span>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 text-xs font-extrabold text-[#0a4d2c] focus:outline-none cursor-pointer"
              >
                {months.map(m => (
                  <option key={m.value} value={m.value}>{m.name}</option>
                ))}
              </select>
            </div>

            {/* Year Selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Year:</span>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 text-xs font-extrabold text-[#0a4d2c] focus:outline-none cursor-pointer"
              >
                {[2024, 2025, 2026, 2027].map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            {/* Ward Selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Ward:</span>
              <select
                value={selectedWard}
                onChange={(e) => setSelectedWard(e.target.value)}
                className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-700 focus:outline-none focus:border-[#0a4d2c] cursor-pointer"
              >
                <option value="All">All Wards ({uniqueWards.length})</option>
                {uniqueWards.map(w => (
                  <option key={w} value={w}>{w}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Sub-Tabs: Date-wise vs Worker-wise */}
          <div className="inline-flex p-1 bg-gray-100 rounded-2xl shrink-0 self-start md:self-center">
            <button
              onClick={() => setActiveSubTab('date-wise')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeSubTab === 'date-wise'
                  ? 'bg-[#0a4d2c] text-white shadow-sm'
                  : 'text-gray-600 hover:text-[#0a4d2c]'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Date-Wise Schedule</span>
            </button>
            <button
              onClick={() => setActiveSubTab('worker-wise')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeSubTab === 'worker-wise'
                  ? 'bg-[#0a4d2c] text-white shadow-sm'
                  : 'text-gray-600 hover:text-[#0a4d2c]'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Worker-Wise Allocation</span>
            </button>
          </div>
        </div>

        {/* 15th–25th Interactive Day Selector Strip */}
        <div className="pt-3 border-t border-gray-100 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-600 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#0a4d2c]" /> Official Collection Window (15th–25th)
            </span>
            <span className="text-xs text-gray-500">
              Click a date to isolate scheduled households
            </span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar">
            {/* All Days Option */}
            <button
              onClick={() => setSelectedDay('All')}
              className={`px-4 py-2 rounded-2xl text-xs font-bold shrink-0 transition-all cursor-pointer border ${
                selectedDay === 'All'
                  ? 'bg-[#0a4d2c] text-white border-[#0a4d2c] shadow-md'
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-emerald-50'
              }`}
            >
              All Window ({totalWindowPickups})
            </button>

            {/* Days 15 to 25 */}
            {collectionDays.map(day => {
              const count = dayCounts[day] || 0;
              const isSelected = selectedDay === day;

              return (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  className={`flex flex-col items-center justify-center min-w-[70px] py-2 px-3 rounded-2xl text-xs font-bold shrink-0 transition-all cursor-pointer border ${
                    isSelected
                      ? 'bg-emerald-800 text-white border-emerald-900 shadow-md ring-2 ring-emerald-400'
                      : count > 0
                      ? 'bg-emerald-50 text-[#0a4d2c] border-emerald-200 hover:bg-emerald-100'
                      : 'bg-gray-50 text-gray-400 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <span className="text-[10px] uppercase font-bold opacity-80">Day</span>
                  <span className="text-base font-extrabold leading-none my-0.5">{day}</span>
                  <span className={`text-[10px] px-2 py-0.2 rounded-full font-extrabold ${
                    isSelected ? 'bg-white/20 text-white' : count > 0 ? 'bg-emerald-200 text-emerald-900' : 'bg-gray-200 text-gray-500'
                  }`}>
                    {count} {count === 1 ? 'house' : 'houses'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* KPI Metrics Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Window Collections</span>
            <div className="p-2 bg-emerald-50 text-[#0a4d2c] rounded-xl">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-gray-900">{totalWindowPickups}</p>
          <p className="text-xs text-gray-500">Scheduled for 15th–25th {months.find(m => m.value === selectedMonth)?.name}</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">Collected / Completed</span>
            <div className="p-2 bg-blue-50 text-blue-700 rounded-xl">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-blue-900">{completedInWindow}</p>
          <p className="text-xs text-blue-600 font-semibold">{completionRate}% Completion Rate</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">Pending Pickup</span>
            <div className="p-2 bg-amber-50 text-amber-700 rounded-xl">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-amber-900">{totalWindowPickups - completedInWindow}</p>
          <p className="text-xs text-amber-700 font-semibold">Awaiting field collection</p>
        </div>
      </div>

      {/* Main Content Area: Date-Wise or Worker-Wise */}
      {activeSubTab === 'date-wise' ? (
        /* DATE-WISE SCHEDULE LIST */
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-3xl border border-emerald-100 shadow-2xs">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search scheduled houses by citizen name, house name, number, address, worker..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-semibold text-gray-800 focus:outline-none focus:border-[#0a4d2c] focus:bg-white transition-all"
              />
            </div>
            <div className="text-xs text-gray-500 font-semibold shrink-0">
              Showing <strong>{filteredSchedule.length}</strong> scheduled households
              {selectedDay !== 'All' && <span> on the <strong>{selectedDay}th</strong></span>}
            </div>
          </div>

          {loading ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-emerald-100 shadow-sm space-y-3">
              <div className="w-8 h-8 border-3 border-[#0a4d2c] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-gray-500 font-medium">Loading collection schedule...</p>
            </div>
          ) : filteredSchedule.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-emerald-100 shadow-sm space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#0a4d2c] flex items-center justify-center mx-auto">
                <Calendar className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-gray-800">No Pickups Scheduled</h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                No household pickups are scheduled for {selectedDay !== 'All' ? `the ${selectedDay}th of` : ''} {months.find(m => m.value === selectedMonth)?.name} with current filters.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredSchedule.map(req => {
                const citizen = citizensMap[req.citizenId] || {};
                const worker = workersMap[req.acceptedByWorkerId] || {};
                const statusLower = (req.status || '').toLowerCase();
                const isCompleted = statusLower === 'completed' || statusLower === 'collected';

                const citizenName = citizen.fullName || req.citizenName || req.citizenId || 'Citizen';
                const houseName = citizen.houseName || req.houseName || 'House';
                const houseNumber = citizen.houseNumber || req.houseNumber || 'N/A';
                const address = citizen.address || req.address || 'Address not registered';
                const phone = citizen.phoneNumber || req.phoneNumber || 'N/A';
                const lat = citizen.latitude ?? req.latitude;
                const lng = citizen.longitude ?? req.longitude;
                const hasLocation = lat != null && lng != null && lat !== 0 && lng !== 0;

                const cDate = req.collectionDate ? new Date(req.collectionDate) : null;

                return (
                  <div
                    key={req.requestId || req.id}
                    className="bg-white rounded-3xl p-5 border border-emerald-100 shadow-2xs hover:shadow-md transition-all space-y-3.5"
                  >
                    {/* Top Row: Date Pill & Status */}
                    <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                      <div className="flex items-center gap-2">
                        <div className="px-3 py-1 bg-emerald-100 text-[#0a4d2c] rounded-xl text-xs font-black flex items-center gap-1.5 border border-emerald-300">
                          <Calendar className="w-3.5 h-3.5 text-emerald-800" />
                          <span>{cDate ? cDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'short' }) : 'N/A'}</span>
                        </div>
                        <span className="font-mono text-xs font-bold text-gray-500">
                          {req.requestId}
                        </span>
                      </div>

                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border ${
                        isCompleted
                          ? 'bg-blue-100 text-blue-900 border-blue-300'
                          : 'bg-emerald-100 text-[#0a4d2c] border-emerald-300'
                      }`}>
                        {isCompleted ? 'Completed' : 'Scheduled'}
                      </span>
                    </div>

                    {/* House Details */}
                    <div className="space-y-1.5 text-xs">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-extrabold text-sm text-gray-900 flex items-center gap-1.5">
                            <Home className="w-4 h-4 text-[#0a4d2c] shrink-0" />
                            <span>{houseName} • No: {houseNumber}</span>
                          </h4>
                          <p className="text-gray-600 font-medium mt-0.5">
                            Resident: <strong className="text-gray-800">{citizenName}</strong>
                          </p>
                        </div>

                        <span className="px-2.5 py-1 bg-emerald-50 text-[#0a4d2c] font-black rounded-xl text-[11px] shrink-0 border border-emerald-200">
                          Ward: {req.wardId}
                        </span>
                      </div>

                      <p className="text-gray-500 text-[11px] line-clamp-2">
                        {address}
                      </p>

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-gray-100 text-[11px]">
                        <span className="text-gray-600 flex items-center gap-1 font-medium">
                          <Phone className="w-3 h-3 text-gray-400" /> {phone}
                        </span>

                        {hasLocation && (
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 font-bold text-[#0a4d2c] hover:underline"
                          >
                            <MapPin className="w-3 h-3 text-emerald-600" />
                            <span>Google Maps</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Assigned Worker & Category */}
                    <div className="p-3 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-500" />
                        <div>
                          <span className="text-[10px] text-gray-400 font-bold block uppercase tracking-wider">Assigned Worker</span>
                          <span className="font-bold text-gray-800">
                            {worker.fullName || req.acceptedByWorkerId || 'Unassigned'}
                          </span>
                        </div>
                      </div>

                      <span className="px-2 py-0.5 bg-white text-[#0a4d2c] font-bold text-[11px] rounded-lg border border-emerald-200 shadow-2xs">
                        {req.overallCategory || 'Plastic'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* WORKER-WISE SCHEDULE BREAKDOWN */
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-3xl border border-emerald-100 shadow-2xs text-xs text-gray-600">
            <span>Haritha Karma Sena Field Allocation Overview for <strong>{months.find(m => m.value === selectedMonth)?.name} {selectedYear}</strong></span>
          </div>

          <div className="space-y-4">
            {workerScheduleGroups.map(({ worker, pickups, totalScheduled, completed, pending }) => {
              const workerPct = totalScheduled > 0 ? Math.round((completed / totalScheduled) * 100) : 0;

              return (
                <div
                  key={worker.workerId || worker.id || worker.fullName}
                  className="bg-white rounded-3xl p-6 border border-emerald-100 shadow-2xs space-y-4"
                >
                  {/* Worker Header Card */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-4">
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-[#0a4d2c] flex items-center justify-center font-extrabold text-base shrink-0">
                        <User className="w-6 h-6 text-[#0a4d2c]" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-extrabold text-gray-900">
                            {worker.fullName}
                          </h3>
                          <span className="px-2 py-0.5 bg-emerald-50 text-[#0a4d2c] text-[11px] font-black rounded-md border border-emerald-200">
                            Ward: {worker.assignedWard || 'All'}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500 font-medium block">
                          Worker ID: <strong className="font-mono text-gray-700">{worker.workerId || 'N/A'}</strong> • Phone: {worker.phoneNumber || 'N/A'}
                        </span>
                      </div>
                    </div>

                    {/* Worker Progress Metrics */}
                    <div className="flex items-center gap-4 text-xs">
                      <div className="text-right">
                        <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-wider">Assigned Houses</span>
                        <span className="text-lg font-black text-gray-900">{totalScheduled}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] uppercase font-bold text-blue-600 block tracking-wider">Completed</span>
                        <span className="text-lg font-black text-blue-900">{completed}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] uppercase font-bold text-amber-600 block tracking-wider">Pending</span>
                        <span className="text-lg font-black text-amber-900">{pending}</span>
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-gray-500">Collection Completion</span>
                      <span className="text-[#0a4d2c]">{workerPct}%</span>
                    </div>
                    <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#0a4d2c] to-emerald-500 transition-all duration-500 rounded-full"
                        style={{ width: `${workerPct}%` }}
                      />
                    </div>
                  </div>

                  {/* Assigned Houses for this Worker */}
                  {pickups.length === 0 ? (
                    <div className="p-4 bg-gray-50 rounded-2xl text-center text-xs text-gray-500 font-medium">
                      No household pickup drives assigned for this worker in the selected window.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
                      {pickups.map(req => {
                        const citizen = citizensMap[req.citizenId] || {};
                        const sLower = (req.status || '').toLowerCase();
                        const isDone = sLower === 'completed' || sLower === 'collected';
                        const cDate = req.collectionDate ? new Date(req.collectionDate) : null;

                        return (
                          <div
                            key={req.requestId || req.id}
                            className={`p-3 rounded-2xl border text-xs space-y-1.5 transition-all ${
                              isDone
                                ? 'bg-blue-50/60 border-blue-200'
                                : 'bg-gray-50 border-gray-200'
                            }`}
                          >
                            <div className="flex justify-between items-center">
                              <span className="font-extrabold text-[#0a4d2c] text-[11px]">
                                {cDate ? cDate.toLocaleDateString('en-US', { day: 'numeric', month: 'short' }) : 'N/A'}
                              </span>
                              <span className={`px-2 py-0.2 rounded-full text-[10px] font-bold ${
                                isDone ? 'bg-blue-200 text-blue-900' : 'bg-emerald-200 text-emerald-900'
                              }`}>
                                {isDone ? 'Done' : 'Scheduled'}
                              </span>
                            </div>
                            <h5 className="font-bold text-gray-900 truncate">
                              {citizen.houseName || req.houseName || 'House'} • No: {citizen.houseNumber || req.houseNumber || 'N/A'}
                            </h5>
                            <p className="text-[11px] text-gray-600 truncate">
                              Resident: {citizen.fullName || req.citizenName || req.citizenId}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCollectionSchedule;
