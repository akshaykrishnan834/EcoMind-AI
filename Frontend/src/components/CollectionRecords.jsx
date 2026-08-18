import React, { useState, useEffect } from 'react';
import { Calendar, CheckCircle2, Clock, Truck, ShieldCheck, RefreshCw, FileText, AlertCircle, MapPin, Home, Info, Award, UserCheck, Check, DollarSign, Download, Printer } from 'lucide-react';
import { getCitizenRequests } from '../services/pickupRequestService';

const MONTH_NAMES = [
  { short: 'JAN', full: 'January', monthNum: 1 },
  { short: 'FEB', full: 'February', monthNum: 2 },
  { short: 'MAR', full: 'March', monthNum: 3 },
  { short: 'APR', full: 'April', monthNum: 4 },
  { short: 'MAY', full: 'May', monthNum: 5 },
  { short: 'JUN', full: 'June', monthNum: 6 },
  { short: 'JUL', full: 'July', monthNum: 7 },
  { short: 'AUG', full: 'August', monthNum: 8 },
  { short: 'SEP', full: 'September', monthNum: 9 },
  { short: 'OCT', full: 'October', monthNum: 10 },
  { short: 'NOV', full: 'November', monthNum: 11 },
  { short: 'DEC', full: 'December', monthNum: 12 },
];

const CollectionRecords = ({ citizenData }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const userObj = JSON.parse(localStorage.getItem('user') || '{}');
  const citizenName = citizenData?.fullName || userObj.fullName || 'Citizen';
  const citizenId = citizenData?.citizenId || citizenData?.id || citizenData?._id || userObj.citizenId || 'CIT001';
  const houseName = citizenData?.houseName || userObj.houseName || '';
  const houseNumber = citizenData?.houseNumber || userObj.houseNumber || 'N/A';
  const address = citizenData?.address || userObj.address || 'Address Not Set';
  const wardId = citizenData?.wardId || userObj.wardId || 'Ward 1';
  const panchayatName = citizenData?.panchayatName || userObj.panchayatName || 'Ponkunnam';

  // Extract Citizen Join Date (createdAt / verifiedAt / registration timestamp)
  const rawJoinDate = citizenData?.createdAt || citizenData?.verifiedAt || userObj.createdAt;
  let joinDateObj = rawJoinDate ? new Date(rawJoinDate) : null;
  if (!joinDateObj || isNaN(joinDateObj.getTime())) {
    joinDateObj = new Date();
  }

  const joinYear = joinDateObj.getFullYear();
  const joinMonth = joinDateObj.getMonth() + 1; // 1 (Jan) to 12 (Dec)

  const fetchRecords = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getCitizenRequests(citizenId);
      setRequests(data || []);
    } catch (err) {
      console.error('Error fetching collection card records:', err);
      setError('Could not load user fee collection records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [citizenId]);

  // Determine available years starting strictly from joinYear onwards
  const currentYear = new Date().getFullYear();
  let maxYear = currentYear;
  requests.forEach((req) => {
    const d = new Date(req.requestedAt || req.collectionDate || req.collectedAt);
    if (!isNaN(d.getFullYear()) && d.getFullYear() > maxYear) {
      maxYear = d.getFullYear();
    }
  });

  const availableYears = [];
  for (let y = joinYear; y <= maxYear; y++) {
    availableYears.push(y);
  }

  // Map requests by key "YEAR-MONTH" (e.g. "2026-8")
  const requestMap = {};
  requests.forEach((req) => {
    const d = new Date(req.requestedAt || req.collectionDate || req.collectedAt);
    if (!isNaN(d.getTime())) {
      const y = d.getFullYear();
      const m = d.getMonth() + 1;
      const key = `${y}-${m}`;
      // Do not store requests prior to citizen join date
      if (y > joinYear || (y === joinYear && m >= joinMonth)) {
        if (!requestMap[key] || new Date(req.requestedAt) > new Date(requestMap[key].requestedAt)) {
          requestMap[key] = req;
        }
      }
    }
  });

  const handlePrint = () => {
    window.print();
  };

  const joinMonthName = MONTH_NAMES.find(m => m.monthNum === joinMonth)?.full || '';

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fadeIn pb-12">
      {/* Top Banner & Print Action */}
      <div className="bg-gradient-to-r from-[#0a4d2c] via-[#0f5b37] to-emerald-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6 print:hidden">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-emerald-200 text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
            <span>Government of Kerala • Haritha Karma Sena Official Card</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            User Fee Collection Card
          </h1>
          <p className="text-xs sm:text-sm text-emerald-100/90 font-medium max-w-xl">
            Official Haritha Karma Sena Monthly User Fee & Waste Collection Card for {wardId} ({panchayatName}).
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={fetchRecords}
            disabled={loading}
            className="px-4 py-2.5 bg-emerald-900/80 hover:bg-emerald-950 border border-emerald-400/40 text-emerald-200 font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-2 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-5 py-2.5 bg-white text-[#0a4d2c] hover:bg-emerald-50 font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
          >
            <Printer className="w-4 h-4 text-[#0a4d2c]" />
            <span>Print Card</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={fetchRecords} className="underline font-bold">Retry</button>
        </div>
      )}

      {/* PHYSICAL CARD CONTAINER WRAPPER */}
      <div className="bg-[#f2faf5] p-4 sm:p-8 rounded-3xl border-2 border-emerald-800/30 shadow-lg space-y-6 print:bg-white print:p-0 print:border-none print:shadow-none">

        {/* PHYSICAL CARD HEADER BANNER */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border-2 border-emerald-800 space-y-4 shadow-xs">
          <div className="text-center space-y-1 border-b-2 border-emerald-800 pb-4">
            <div className="flex items-center justify-center gap-2">
              <span className="text-[#0a4d2c] font-black text-xl sm:text-2xl tracking-wide font-serif">
                യൂസർ ഫീ കളക്ഷൻ കാർഡ്
              </span>
            </div>
            <h2 className="text-xs sm:text-sm font-extrabold uppercase tracking-widest text-emerald-900">
              Haritha Karma Sena Doorstep Collection Record Card
            </h2>
            <p className="text-[11px] font-bold text-emerald-800">
              Local Self Government Department (LSGD) • {panchayatName} Grama Panchayat • {wardId}
            </p>
          </div>

          {/* Resident Details & Joining Date Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
            <div className="bg-emerald-50/70 p-2.5 rounded-xl border border-emerald-200">
              <span className="text-[10px] text-gray-500 uppercase font-bold block">Citizen Name</span>
              <span className="font-extrabold text-gray-900 truncate block">{citizenName}</span>
            </div>

            <div className="bg-emerald-50/70 p-2.5 rounded-xl border border-emerald-200">
              <span className="text-[10px] text-gray-500 uppercase font-bold block">House Name & No</span>
              <span className="font-extrabold text-gray-900 truncate block">{houseName || 'House'} • No: {houseNumber}</span>
            </div>

            <div className="bg-emerald-50/70 p-2.5 rounded-xl border border-emerald-200">
              <span className="text-[10px] text-gray-500 uppercase font-bold block">Joining Date</span>
              <span className="font-extrabold text-[#0a4d2c] truncate block">
                {joinMonthName} {joinYear}
              </span>
            </div>

            <div className="bg-emerald-50/70 p-2.5 rounded-xl border border-emerald-200">
              <span className="text-[10px] text-gray-500 uppercase font-bold block">Monthly User Fee</span>
              <span className="font-extrabold text-[#0a4d2c] truncate block">₹ 50 / Month</span>
            </div>
          </div>
        </div>

        {/* AUTHENTIC MULTI-YEAR PHYSICAL CARD GRID TABLE */}
        <div className="overflow-x-auto bg-white rounded-2xl border-2 border-emerald-800 shadow-sm p-4 sm:p-6">
          <div className={`min-w-[760px] grid gap-6 divide-x-2 divide-emerald-800/40 ${availableYears.length === 1 ? 'grid-cols-1' : availableYears.length === 2 ? 'grid-cols-2' : 'grid-cols-3'
            }`}>

            {availableYears.slice(-3).map((year) => {
              // For joining year (e.g. 2024), filter months starting strictly from joinMonth onwards (e.g. June to Dec)
              const visibleMonths = MONTH_NAMES.filter((m) => {
                if (year === joinYear) {
                  return m.monthNum >= joinMonth;
                }
                return true; // Subsequent years show all 12 months
              });

              return (
                <div key={year} className="space-y-3 px-2 first:pl-0 last:pr-0">
                  {/* Year Header */}
                  <div className="bg-[#0a4d2c] text-white text-center py-2 rounded-xl font-black text-lg tracking-wider border-2 border-[#0a4d2c] shadow-xs">
                    {year} {year === joinYear && <span className="text-xs font-normal opacity-90">(Joined {joinMonthName})</span>}
                  </div>

                  {/* Monthly Table */}
                  <table className="w-full border-collapse text-xs">
                    <thead>
                      <tr className="bg-emerald-100/80 text-emerald-950 border-b-2 border-emerald-800">
                        <th className="py-2 px-1 text-center font-extrabold border-r border-emerald-300 w-[12%]">Month</th>
                        <th className="py-2 px-1 text-center font-extrabold border-r border-emerald-300 w-[20%]">Date</th>
                        <th className="py-2 px-1 text-center font-extrabold border-r border-emerald-300 w-[18%]">Rt.No</th>
                        <th className="py-2 px-1 text-center font-extrabold border-r border-emerald-300 w-[15%]">Fee</th>
                        <th className="py-2 px-1 text-center font-extrabold w-[35%]">Status & Verification</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-emerald-200">
                      {visibleMonths.map((m) => {
                        const reqKey = `${year}-${m.monthNum}`;
                        const req = requestMap[reqKey];

                        const isCompleted = req && ((req.status || '').toLowerCase() === 'completed' || (req.status || '').toLowerCase() === 'collected');
                        const isScheduled = req && ((req.status || '').toLowerCase() === 'scheduled' || (req.status || '').toLowerCase() === 'accepted');

                        // Format date string
                        let dateDisplay = '-';
                        if (req) {
                          if (req.collectedAt) {
                            dateDisplay = new Date(req.collectedAt).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' });
                          } else if (req.collectionDate) {
                            dateDisplay = new Date(req.collectionDate).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' });
                          } else if (req.requestedAt) {
                            dateDisplay = new Date(req.requestedAt).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' });
                          }
                        }

                        return (
                          <tr
                            key={m.short}
                            className={`h-11 transition-colors ${isCompleted
                              ? 'bg-emerald-50/70 font-semibold'
                              : isScheduled
                                ? 'bg-blue-50/40'
                                : req
                                  ? 'bg-amber-50/30'
                                  : 'hover:bg-gray-50/50'
                              }`}
                          >
                            {/* Month Abbreviation */}
                            <td className="py-1 px-1 font-extrabold text-[#0a4d2c] text-center border-r border-emerald-200 bg-emerald-50/80">
                              {m.short}
                            </td>

                            {/* Collection Date */}
                            <td className="py-1 px-1 text-center border-r border-emerald-200 font-mono text-[11px] text-gray-800">
                              {dateDisplay}
                            </td>

                            {/* Rt.No (Receipt / Request ID) */}
                            <td className="py-1 px-1 text-center border-r border-emerald-200 font-mono text-[10px] font-bold text-gray-700 truncate max-w-[55px]">
                              {req?.requestId ? req.requestId.replace(/^REQ-?/, '') : '-'}
                            </td>

                            {/* Amount */}
                            <td className="py-1 px-1 text-center border-r border-emerald-200 font-extrabold text-[#0a4d2c] text-[11px]">
                              {req ? '₹50' : '-'}
                            </td>

                            {/* Status & Verification (Delivery Complete + Payment Paid) */}
                            <td className="py-1 px-1 text-center">
                              {isCompleted ? (
                                <div className="flex items-center justify-center gap-1 flex-wrap">
                                  <span
                                    title={`Verified & Collected by HKS Worker ${req.acceptedByWorkerId || ''}`}
                                    className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-emerald-100 text-[#0a4d2c] font-extrabold text-[9px] rounded border border-emerald-300"
                                  >
                                    <Check className="w-2.5 h-2.5 text-[#0a4d2c] stroke-[3]" />
                                    <span>Collected</span>
                                  </span>

                                  <span
                                    title="User Fee Paid (₹50)"
                                    className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-emerald-700 text-white font-extrabold text-[9px] rounded shadow-2xs"
                                  >
                                    <Check className="w-2.5 h-2.5 text-white stroke-[3]" />
                                    <span>Paid ₹50</span>
                                  </span>
                                </div>
                              ) : isScheduled ? (
                                <div className="flex items-center justify-center gap-1 flex-wrap">
                                  <span className="text-[9px] font-extrabold text-blue-800 px-1 py-0.5 bg-blue-50 rounded border border-blue-200">
                                    Scheduled
                                  </span>
                                  <span className="text-[9px] font-semibold text-gray-500">
                                    Fee Pending
                                  </span>
                                </div>
                              ) : req ? (
                                <div className="flex items-center justify-center gap-1 flex-wrap">
                                  <span className="text-[9px] font-bold text-amber-800 px-1 py-0.5 bg-amber-50 rounded border border-amber-200">
                                    Requested
                                  </span>
                                  <span className="text-[9px] font-semibold text-gray-400">
                                    Unpaid
                                  </span>
                                </div>
                              ) : (
                                <span className="text-gray-300 text-[10px]">-</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              );
            })}

          </div>
        </div>

        {/* Card Footer Guidelines & Instructions */}
        <div className="bg-white rounded-2xl p-4 border-2 border-emerald-800 text-xs text-emerald-950 space-y-2">
          <div className="flex items-center justify-between border-b border-emerald-200 pb-2">
            <span className="font-extrabold text-[#0a4d2c] flex items-center gap-1.5">
              <Info className="w-4 h-4 text-[#0a4d2c]" />
              Haritha Karma Sena Guidelines & Instructions
            </span>
            <span className="text-[11px] font-extrabold text-emerald-800">
              User Fee: ₹50 / Month
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-gray-700 leading-relaxed">
            <div>
              • Haritha Karma Sena volunteers collect plastic waste every month between the 15th and 25th.
            </div>
            <div>
              • Please ensure plastic waste is cleaned, dried, and properly bundled prior to collection.
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default CollectionRecords;
