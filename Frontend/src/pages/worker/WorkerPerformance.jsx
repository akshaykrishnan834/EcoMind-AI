import React, { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp,
  Award,
  CheckCircle2,
  Clock,
  AlertCircle,
  Calendar,
  Users,
  Truck,
  IndianRupee,
  ShieldCheck,
  Zap,
  BarChart3,
  Check,
  XCircle,
  RefreshCw,
  Star,
  Target
} from 'lucide-react';
import { getWardPickupRequests } from '../../services/pickupRequestService';
import { getCitizensByWard } from '../../services/citizenService';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const WorkerPerformance = ({ wardId = 'Ward 1', workerId = '', profile = {} }) => {
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());

  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [citizens, setCitizens] = useState([]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [reqData, citData] = await Promise.all([
        getWardPickupRequests(wardId),
        getCitizensByWard(wardId),
      ]);
      setRequests(reqData || []);
      setCitizens(citData || []);
    } catch (err) {
      console.error('Error loading worker performance data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [wardId]);

  // Performance calculations for selected month/year
  const monthRequests = useMemo(() => {
    return requests.filter((r) => {
      const d = new Date(r.createdAt || r.scheduledDate || r.collectionDate);
      return d.getMonth() + 1 === selectedMonth && d.getFullYear() === selectedYear;
    });
  }, [requests, selectedMonth, selectedYear]);

  // Overall performance calculations
  const totalAllTimeRequests = requests.length;
  const completedAllTime = requests.filter((r) => r.status === 'Completed').length;
  const allTimeCompletionRate = totalAllTimeRequests > 0 ? Math.round((completedAllTime / totalAllTimeRequests) * 100) : 0;

  // Selected Month Breakdown
  const monthCompleted = monthRequests.filter((r) => r.status === 'Completed').length;
  const monthPending = monthRequests.filter((r) => r.status === 'Pending' || r.status === 'Scheduled').length;
  const monthFailed = monthRequests.filter((r) => {
    if (r.status === 'Failed') return true;
    const reqDate = new Date(r.createdAt || r.scheduledDate);
    const now = new Date();
    const isPastMonth = reqDate.getFullYear() < now.getFullYear() || (reqDate.getFullYear() === now.getFullYear() && reqDate.getMonth() < now.getMonth());
    return isPastMonth && r.status !== 'Completed';
  }).length;

  const monthTotal = monthRequests.length;
  const monthCompletionRate = monthTotal > 0 ? Math.round((monthCompleted / monthTotal) * 100) : 0;

  // Unique households served (all-time & this month)
  const uniqueHouseholdsServedMonth = useMemo(() => {
    const citizenIds = new Set();
    monthRequests
      .filter((r) => r.status === 'Completed')
      .forEach((r) => {
        if (r.citizenId) citizenIds.add(r.citizenId);
      });
    return citizenIds.size;
  }, [monthRequests]);

  const uniqueHouseholdsServedAllTime = useMemo(() => {
    const citizenIds = new Set();
    requests
      .filter((r) => r.status === 'Completed')
      .forEach((r) => {
        if (r.citizenId) citizenIds.add(r.citizenId);
      });
    return citizenIds.size;
  }, [requests]);

  // Monthly stats trend for the past 6 months
  const monthlyTrends = useMemo(() => {
    const trends = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const m = d.getMonth() + 1;
      const y = d.getFullYear();

      const itemsInMonth = requests.filter((r) => {
        const itemDate = new Date(r.createdAt || r.scheduledDate);
        return itemDate.getMonth() + 1 === m && itemDate.getFullYear() === y;
      });

      const comp = itemsInMonth.filter((r) => r.status === 'Completed').length;
      const pend = itemsInMonth.filter((r) => r.status === 'Pending' || r.status === 'Scheduled').length;
      const fail = itemsInMonth.filter((r) => {
        if (r.status === 'Failed') return true;
        const reqDate = new Date(r.createdAt);
        const now = new Date();
        const isPastMonth = reqDate.getFullYear() < now.getFullYear() || (reqDate.getFullYear() === now.getFullYear() && reqDate.getMonth() < now.getMonth());
        return isPastMonth && r.status !== 'Completed';
      }).length;

      trends.push({
        label: `${MONTH_NAMES[m - 1].slice(0, 3)} '${String(y).slice(2)}`,
        month: m,
        year: y,
        total: itemsInMonth.length,
        completed: comp,
        pending: pend,
        failed: fail,
        rate: itemsInMonth.length > 0 ? Math.round((comp / itemsInMonth.length) * 100) : 0,
      });
    }
    return trends;
  }, [requests, currentDate]);

  // Achievement Badges
  const badges = [
    {
      title: 'Top Ward Performer',
      desc: 'Achieved high pickup completion rate in assigned ward.',
      icon: Award,
      unlocked: allTimeCompletionRate >= 75,
      color: 'text-amber-500 bg-amber-50 border-amber-200',
    },
    {
      title: 'Prompt Verification',
      desc: 'Successfully verified and completed plastic pickups.',
      icon: ShieldCheck,
      unlocked: completedAllTime >= 5,
      color: 'text-emerald-500 bg-emerald-50 border-emerald-200',
    },
    {
      title: 'Ward Coverage Star',
      desc: `Served registered households in ${wardId}.`,
      icon: Star,
      unlocked: uniqueHouseholdsServedAllTime >= 3,
      color: 'text-blue-500 bg-blue-50 border-blue-200',
    },
    {
      title: 'Zero Backlog Champion',
      desc: 'No overdue pending requests in current month.',
      icon: Zap,
      unlocked: monthPending === 0 && monthTotal > 0,
      color: 'text-purple-500 bg-purple-50 border-purple-200',
    },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fadeIn">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-[#0a4d2c] via-[#0f5b37] to-emerald-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-1/4 -translate-y-1/4 w-80 h-80 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 text-xs font-semibold">
              <TrendingUp className="w-4 h-4 text-emerald-300" />
              <span>Haritha Karma Sena Field Metrics</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              My Performance & Collection Analytics
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100/90 max-w-xl">
              Track monthly collection metrics, completion percentages, and service milestones in{' '}
              <span className="font-bold text-white">{wardId}</span>.
            </p>
          </div>

          {/* Month / Year Selector */}
          <div className="flex items-center gap-2 bg-white/10 p-2 rounded-2xl backdrop-blur-md border border-white/20">
            <Calendar className="w-4 h-4 text-emerald-200 ml-2" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="bg-transparent text-white text-xs font-bold focus:outline-none cursor-pointer py-1 px-2 rounded-lg"
            >
              {MONTH_NAMES.map((m, idx) => (
                <option key={idx} value={idx + 1} className="text-gray-900 font-semibold">
                  {m}
                </option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="bg-transparent text-white text-xs font-bold focus:outline-none cursor-pointer py-1 px-2 rounded-lg"
            >
              {[2024, 2025, 2026, 2027].map((y) => (
                <option key={y} value={y} className="text-gray-900 font-semibold">
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Primary KPI Row for Selected Month */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Monthly Pickups Completed */}
        <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-2xs space-y-2 group hover:shadow-md transition">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Completed Pickups</span>
            <div className="p-2 bg-emerald-50 rounded-xl text-emerald-700 group-hover:scale-110 transition-transform">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-gray-900">{monthCompleted}</p>
          <p className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
            <span>{MONTH_NAMES[selectedMonth - 1]} {selectedYear}</span>
            <span className="text-gray-400">• All-time: {completedAllTime}</span>
          </p>
        </div>

        {/* Pending Pickups */}
        <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-2xs space-y-2 group hover:shadow-md transition">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Pending Pickups</span>
            <div className="p-2 bg-amber-50 rounded-xl text-amber-600 group-hover:scale-110 transition-transform">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-amber-600">{monthPending}</p>
          <p className="text-[11px] text-gray-500 font-medium">
            Active in collection cycle (15th - 25th)
          </p>
        </div>

        {/* Completion Percentage */}
        <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-2xs space-y-2 group hover:shadow-md transition">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Completion Rate</span>
            <div className="p-2 bg-blue-50 rounded-xl text-blue-700 group-hover:scale-110 transition-transform">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-blue-900">{monthCompletionRate}%</p>
          <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-emerald-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${monthCompletionRate}%` }}
            />
          </div>
        </div>

        {/* Households Served */}
        <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-2xs space-y-2 group hover:shadow-md transition">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Households Served</span>
            <div className="p-2 bg-emerald-50 rounded-xl text-[#0a4d2c] group-hover:scale-110 transition-transform">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-[#0a4d2c]">{uniqueHouseholdsServedMonth}</p>
          <p className="text-[11px] text-gray-500 font-medium">
            Out of {citizens.length} registered in {wardId}
          </p>
        </div>
      </div>

      {/* Monthly Collection Trends & Detailed Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Collection Statistics Chart */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-emerald-100 shadow-md space-y-5">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-emerald-50 text-[#0a4d2c]">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-extrabold text-gray-900">
                  Monthly Collection Statistics
                </h2>
                <p className="text-xs text-gray-500">6-Month pickup completion & volume trend</p>
              </div>
            </div>

            <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              Ward Delimitation: {wardId}
            </span>
          </div>

          {/* Trend Bars */}
          <div className="space-y-4 pt-2">
            {monthlyTrends.map((t, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-extrabold text-gray-800 w-16">{t.label}</span>
                  <div className="flex items-center gap-3 text-gray-600 font-medium">
                    <span className="text-emerald-700 font-bold">✓ {t.completed} Completed</span>
                    <span className="text-amber-600">⏳ {t.pending} Pending</span>
                    {t.failed > 0 && <span className="text-red-500">✗ {t.failed} Expired</span>}
                    <span className="font-extrabold text-gray-900 w-12 text-right">{t.rate}%</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden flex">
                  <div
                    className="bg-emerald-600 transition-all duration-500"
                    style={{ width: `${t.total > 0 ? (t.completed / t.total) * 100 : 0}%` }}
                    title={`Completed: ${t.completed}`}
                  />
                  <div
                    className="bg-amber-400 transition-all duration-500"
                    style={{ width: `${t.total > 0 ? (t.pending / t.total) * 100 : 0}%` }}
                    title={`Pending: ${t.pending}`}
                  />
                  <div
                    className="bg-red-400 transition-all duration-500"
                    style={{ width: `${t.total > 0 ? (t.failed / t.total) * 100 : 0}%` }}
                    title={`Failed / Expired: ${t.failed}`}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-4 text-xs text-gray-600 pt-3 border-t border-gray-100">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-emerald-600" />
              <span>Completed Pickups</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-amber-400" />
              <span>Scheduled / In Progress</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-red-400" />
              <span>Failed / Month Expired</span>
            </div>
          </div>
        </div>

        {/* Worker Recognition & Badges */}
        <div className="bg-white rounded-3xl p-6 border border-emerald-100 shadow-md space-y-5">
          <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
            <div className="p-2.5 rounded-2xl bg-emerald-50 text-[#0a4d2c]">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-gray-900">Worker Recognition</h2>
              <p className="text-xs text-gray-500">Service milestones & achievements</p>
            </div>
          </div>

          <div className="space-y-3">
            {badges.map((b, idx) => {
              const Icon = b.icon;
              return (
                <div
                  key={idx}
                  className={`p-3.5 rounded-2xl border transition-all ${
                    b.unlocked
                      ? `${b.color} shadow-2xs`
                      : 'bg-gray-50 border-gray-200 text-gray-400 opacity-60'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-white/80 shrink-0 shadow-2xs">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-extrabold text-gray-900">{b.title}</p>
                        {b.unlocked ? (
                          <span className="text-[10px] font-extrabold uppercase text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                            Unlocked
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-gray-400">Locked</span>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-600 mt-0.5">{b.desc}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 text-xs text-emerald-950 space-y-1">
            <p className="font-extrabold flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span>Haritha Karma Sena Excellence</span>
            </p>
            <p className="text-gray-600 text-[11px]">
              Door-to-door waste segregation and timely collection keeps Kerala clean and green.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkerPerformance;
