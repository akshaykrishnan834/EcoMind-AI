import React, { useState, useEffect } from 'react';
import { Calendar, CheckCircle2, XCircle, Clock, Truck, ShieldCheck, RefreshCw, FileText, AlertCircle, MapPin, Home, Info, Award, UserCheck, Check, DollarSign, Download, Printer, FileSpreadsheet } from 'lucide-react';
import { getCitizenRequests } from '../services/pickupRequestService';
import { getCitizenPayments } from '../services/paymentService';

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
  const [payments, setPayments] = useState([]);
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
      const [reqData, payData] = await Promise.all([
        getCitizenRequests(citizenId).catch(() => []),
        getCitizenPayments(citizenId).catch(() => [])
      ]);
      setRequests(reqData || []);
      setPayments(payData || []);
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

  // Map payments by key "YEAR-MONTH" (e.g. "2026-9")
  const paymentMap = {};
  payments.forEach((pay) => {
    const key = `${pay.year}-${pay.month}`;
    paymentMap[key] = pay;
  });

  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = () => {
    const sanitize = (text) => (text || '').toString().replace(/</g, '&lt;').replace(/>/g, '&gt;');

    const now = new Date();
    const currentYearNow = now.getFullYear();
    const currentMonthNow = now.getMonth() + 1;

    let tableRows = '';
    availableYears.forEach((year) => {
      const visibleMonths = MONTH_NAMES.filter((m) => {
        if (year === joinYear) return m.monthNum >= joinMonth;
        return true;
      });

      visibleMonths.forEach((m) => {
        const reqKey = `${year}-${m.monthNum}`;
        const req = requestMap[reqKey];
        const payRecord = paymentMap[reqKey];

        const isCompleted = req && ((req.status || '').toLowerCase() === 'completed' || (req.status || '').toLowerCase() === 'collected');
        const isScheduled = req && ((req.status || '').toLowerCase() === 'scheduled' || (req.status || '').toLowerCase() === 'accepted');
        const isPaidFee = payRecord && (payRecord.status || '').toLowerCase() === 'paid';
        const isPastMonth = year < currentYearNow || (year === currentYearNow && m.monthNum < currentMonthNow);
        const isCurrentMonth = year === currentYearNow && m.monthNum === currentMonthNow;

        let dateDisplay = '-';
        if (req?.collectedAt) {
          dateDisplay = new Date(req.collectedAt).toLocaleDateString('en-GB');
        } else if (req?.collectionDate) {
          dateDisplay = new Date(req.collectionDate).toLocaleDateString('en-GB');
        } else if (req?.requestedAt) {
          dateDisplay = new Date(req.requestedAt).toLocaleDateString('en-GB');
        }

        const rtNo = req?.requestId ? req.requestId.replace(/^REQ-?/, '') : '-';
        const fee = '₹50';
        const payment = isPaidFee ? 'Paid ₹50' : isPastMonth ? 'Pending Due ₹50' : 'Unpaid ₹50';
        const paymentBg = isPaidFee ? '#d1fae5; color: #065f46;' : isPastMonth ? '#fee2e2; color: #991b1b;' : '#fef3c7; color: #92400e;';

        const verified = isCompleted ? 'Verified by Worker' : isScheduled ? 'Scheduled' : req ? 'Pending' : '-';
        const result = isCompleted ? 'Success' : isPastMonth ? 'Failed' : isCurrentMonth ? (req ? 'In Progress' : 'Pending') : '-';
        const resultBg = isCompleted ? '#d1fae5; color: #065f46; font-weight: bold;' : isPastMonth ? '#fee2e2; color: #991b1b; font-weight: bold;' : '';

        tableRows += `
          <tr>
            <td style="text-align: center; border: 1px solid #d1d5db; padding: 6px;">${year}</td>
            <td style="text-align: center; border: 1px solid #d1d5db; padding: 6px; font-weight: bold; background: #ecfdf5; color: #065f46;">${m.full} (${m.short})</td>
            <td style="text-align: center; border: 1px solid #d1d5db; padding: 6px; font-family: monospace;">${dateDisplay}</td>
            <td style="text-align: center; border: 1px solid #d1d5db; padding: 6px; font-family: monospace;">${rtNo}</td>
            <td style="text-align: center; border: 1px solid #d1d5db; padding: 6px; font-weight: bold; color: #065f46;">${fee}</td>
            <td style="text-align: center; border: 1px solid #d1d5db; padding: 6px; font-weight: bold; background: ${paymentBg}">${payment}</td>
            <td style="text-align: center; border: 1px solid #d1d5db; padding: 6px;">${verified}</td>
            <td style="text-align: center; border: 1px solid #d1d5db; padding: 6px; background: ${resultBg}">${result}</td>
          </tr>
        `;
      });
    });

    const excelTemplate = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8">
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>Collection Card</x:Name>
                <x:WorksheetOptions>
                  <x:DisplayGridlines/>
                </x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheet>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <style>
          body { font-family: 'Segoe UI', Calibri, Arial, sans-serif; }
          .title { background-color: #0a4d2c; color: #ffffff; font-weight: bold; font-size: 14pt; text-align: center; }
          .subtitle { background-color: #ecfdf5; color: #065f46; font-weight: bold; text-align: center; }
          .meta-label { font-weight: bold; color: #4b5563; background: #f9fafb; border: 1px solid #e5e7eb; }
          .meta-val { font-weight: bold; color: #111827; border: 1px solid #e5e7eb; }
          th { background-color: #0a4d2c; color: #ffffff; font-weight: bold; border: 1px solid #064e3b; padding: 8px; text-align: center; }
        </style>
      </head>
      <body>
        <table>
          <tr>
            <td colspan="8" class="title" height="38">
              യൂസർ ഫീ കളക്ഷൻ കാർഡ് • HARITHA KARMA SENA DOORSTEP COLLECTION CARD
            </td>
          </tr>
          <tr>
            <td colspan="8" class="subtitle" height="24">
              Local Self Government Department (LSGD) • ${sanitize(panchayatName)} Grama Panchayat • ${sanitize(wardId)}
            </td>
          </tr>
          <tr><td></td></tr>
          <tr>
            <td class="meta-label">Citizen Name:</td>
            <td class="meta-val">${sanitize(citizenName)}</td>
            <td class="meta-label">Citizen ID:</td>
            <td class="meta-val">${sanitize(citizenId)}</td>
            <td class="meta-label">House:</td>
            <td class="meta-val" colspan="3">${sanitize(houseName)} (No: ${sanitize(houseNumber)})</td>
          </tr>
          <tr>
            <td class="meta-label">Ward ID:</td>
            <td class="meta-val">${sanitize(wardId)}</td>
            <td class="meta-label">Joining Date:</td>
            <td class="meta-val">${sanitize(joinMonthName)} ${sanitize(joinYear)}</td>
            <td class="meta-label">User Fee:</td>
            <td class="meta-val" colspan="3">₹ 50 / Month</td>
          </tr>
          <tr>
            <td class="meta-label">Export Date:</td>
            <td class="meta-val" colspan="7">${new Date().toLocaleString()}</td>
          </tr>
          <tr><td></td></tr>
          <thead>
            <tr>
              <th>Year</th>
              <th>Month</th>
              <th>Pickup Date</th>
              <th>Receipt / Rt.No</th>
              <th>Fee</th>
              <th>Payment Status</th>
              <th>Verified by Worker</th>
              <th>Collection Result</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([excelTemplate], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Collection_Card_${citizenName.replace(/\s+/g, '_')}_${new Date().getFullYear()}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const joinMonthName = MONTH_NAMES.find(m => m.monthNum === joinMonth)?.full || '';

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fadeIn pb-12 print:p-0 print:m-0 print:space-y-4">
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

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={fetchRecords}
            disabled={loading}
            className="px-3.5 py-2.5 bg-emerald-900/80 hover:bg-emerald-950 border border-emerald-400/40 text-emerald-200 font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="px-4 py-2.5 bg-emerald-800 hover:bg-emerald-700 border border-emerald-400/50 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
            title="Download formatted Excel spreadsheet of collection records"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-300" />
            <span>Export Excel</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-4 py-2.5 bg-white text-[#0a4d2c] hover:bg-emerald-50 font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
            title="Print or Save Card as PDF"
          >
            <Printer className="w-4 h-4 text-[#0a4d2c]" />
            <span>Print / PDF Card</span>
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

        {/* AUTHENTIC MULTI-YEAR PHYSICAL CARD VERTICAL FORMAT */}
        <div className="space-y-6">
          {availableYears.slice(-3).map((year) => {
            // For joining year (e.g. 2024), filter months starting strictly from joinMonth onwards (e.g. June to Dec)
            const visibleMonths = MONTH_NAMES.filter((m) => {
              if (year === joinYear) {
                return m.monthNum >= joinMonth;
              }
              return true; // Subsequent years show all 12 months
            });

            return (
              <div key={year} className="bg-white rounded-2xl border-2 border-emerald-800 shadow-sm p-4 sm:p-6 space-y-4">
                {/* Year Header */}
                <div className="bg-[#0a4d2c] text-white text-center py-2.5 rounded-xl font-black text-lg sm:text-xl tracking-wider border-2 border-[#0a4d2c] shadow-xs">
                  {year} {year === joinYear && <span className="text-xs font-normal opacity-90">(Joined {joinMonthName})</span>}
                </div>

                {/* Monthly Table */}
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-xs min-w-[680px]">
                    <thead>
                      <tr className="bg-emerald-100/90 text-emerald-950 border-b-2 border-emerald-800">
                        <th className="py-2.5 px-2 text-center font-extrabold border-r border-emerald-300 w-[9%] uppercase tracking-wider text-[11px]">Month</th>
                        <th className="py-2.5 px-2 text-center font-extrabold border-r border-emerald-300 w-[15%] uppercase tracking-wider text-[11px]">Pickup Date</th>
                        <th className="py-2.5 px-2 text-center font-extrabold border-r border-emerald-300 w-[12%] uppercase tracking-wider text-[11px]">Rt.No</th>
                        <th className="py-2.5 px-2 text-center font-extrabold border-r border-emerald-300 w-[8%] uppercase tracking-wider text-[11px]">Fee</th>
                        <th className="py-2.5 px-2 text-center font-extrabold border-r border-emerald-300 w-[20%] uppercase tracking-wider text-[11px]">Payment</th>
                        <th className="py-2.5 px-2 text-center font-extrabold border-r border-emerald-300 w-[21%] uppercase tracking-wider text-[11px]">Verified by Worker</th>
                        <th className="py-2.5 px-2 text-center font-extrabold w-[15%] uppercase tracking-wider text-[11px]">Result</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-emerald-200">
                      {visibleMonths.map((m) => {
                        const reqKey = `${year}-${m.monthNum}`;
                        const req = requestMap[reqKey];

                        const isCompleted = req && ((req.status || '').toLowerCase() === 'completed' || (req.status || '').toLowerCase() === 'collected');
                        const isScheduled = req && ((req.status || '').toLowerCase() === 'scheduled' || (req.status || '').toLowerCase() === 'accepted');
                        const isPending = req && ((req.status || '').toLowerCase() === 'pending');

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

                        const payRecord = paymentMap[reqKey];
                        const isPaidFee = payRecord && (payRecord.status || '').toLowerCase() === 'paid';
                        const now = new Date();
                        const currentYearNow = now.getFullYear();
                        const currentMonthNow = now.getMonth() + 1;
                        const isPastMonth = year < currentYearNow || (year === currentYearNow && m.monthNum < currentMonthNow);
                        const isCurrentMonth = year === currentYearNow && m.monthNum === currentMonthNow;

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
                            <td className="py-2 px-2 font-extrabold text-[#0a4d2c] text-center border-r border-emerald-200 bg-emerald-50/80">
                              {m.short}
                            </td>

                            {/* Pickup Date */}
                            <td className="py-2 px-2 text-center border-r border-emerald-200 font-mono text-[11px] text-gray-800">
                              {dateDisplay}
                            </td>

                            {/* Rt.No (Receipt / Request ID) */}
                            <td className="py-2 px-2 text-center border-r border-emerald-200 font-mono text-[11px] font-bold text-gray-700">
                              {req?.requestId ? req.requestId.replace(/^REQ-?/, '') : '-'}
                            </td>

                            {/* Amount */}
                            <td className="py-2 px-2 text-center border-r border-emerald-200 font-extrabold text-[#0a4d2c] text-[11px]">
                              ₹50
                            </td>

                            {/* Payment Column (Separate) */}
                            <td className="py-2 px-2 text-center border-r border-emerald-200">
                              {isPaidFee ? (
                                <span
                                  title={`User Fee Paid (₹50) via ${payRecord?.paymentMethod || 'Online'}`}
                                  className="inline-flex items-center justify-center gap-1 px-2.5 py-1 bg-emerald-700 text-white font-extrabold text-[10px] rounded-md shadow-2xs whitespace-nowrap"
                                >
                                  <Check className="w-3 h-3 text-white stroke-[3]" />
                                  <span>Paid ₹50</span>
                                </span>
                              ) : isPastMonth ? (
                                <span
                                  title="Previous Month Unpaid - Pending Due"
                                  className="inline-flex items-center justify-center gap-1 px-2 py-1 bg-rose-100 text-rose-800 font-extrabold text-[10px] rounded-md border border-rose-300 whitespace-nowrap"
                                >
                                  <span>Pending Due ₹50</span>
                                </span>
                              ) : (
                                <span
                                  title="Current Month Fee Unpaid"
                                  className="inline-flex items-center justify-center gap-1 px-2 py-1 bg-amber-100 text-amber-900 font-bold text-[10px] rounded-md border border-amber-300 whitespace-nowrap"
                                >
                                  <span>Unpaid ₹50</span>
                                </span>
                              )}
                            </td>

                            {/* Verified by Worker Column (Separate) */}
                            <td className="py-2 px-2 text-center border-r border-emerald-200">
                              {isCompleted ? (
                                <span
                                  title={`Verified & Collected by HKS Worker ${req?.acceptedByWorkerId || ''}`}
                                  className="inline-flex items-center justify-center gap-1 px-2.5 py-1 bg-emerald-100 text-[#0a4d2c] font-extrabold text-[10px] rounded-md border border-emerald-300 whitespace-nowrap shadow-2xs"
                                >
                                  <Check className="w-3 h-3 text-[#0a4d2c] stroke-[3]" />
                                  <span>Verified</span>
                                </span>
                              ) : isScheduled ? (
                                <span
                                  title="Scheduled - Awaiting worker collection & verification"
                                  className="inline-flex items-center justify-center gap-1 px-2 py-1 bg-blue-100 text-blue-900 font-bold text-[10px] rounded-md border border-blue-200 whitespace-nowrap"
                                >
                                  <Clock className="w-3 h-3 text-blue-700" />
                                  <span>Scheduled</span>
                                </span>
                              ) : req ? (
                                <span
                                  title="Pickup Request Pending Worker Allocation"
                                  className="inline-flex items-center justify-center gap-1 px-2 py-1 bg-amber-50 text-amber-800 font-medium text-[10px] rounded-md border border-amber-200 whitespace-nowrap"
                                >
                                  <span>Pending</span>
                                </span>
                              ) : (
                                <span className="text-gray-400 font-mono text-xs">-</span>
                              )}
                            </td>

                            {/* Result Column (Success or Failed) */}
                            <td className="py-2 px-2 text-center">
                              {isCompleted ? (
                                <span
                                  title="Pickup successfully completed and verified"
                                  className="inline-flex items-center justify-center gap-1 px-2.5 py-1 bg-emerald-100 text-[#0a4d2c] font-black text-[10px] rounded-md border border-emerald-300 shadow-2xs whitespace-nowrap"
                                >
                                  <CheckCircle2 className="w-3 h-3 text-[#0a4d2c] stroke-[2.5]" />
                                  <span>Success</span>
                                </span>
                              ) : isPastMonth ? (
                                <span
                                  title="Month passed and scheduled pickup was not completed - Request Failed"
                                  className="inline-flex items-center justify-center gap-1 px-2.5 py-1 bg-rose-100 text-rose-800 font-black text-[10px] rounded-md border border-rose-300 shadow-2xs whitespace-nowrap"
                                >
                                  <XCircle className="w-3 h-3 text-rose-700 stroke-[2.5]" />
                                  <span>Failed</span>
                                </span>
                              ) : isCurrentMonth ? (
                                req ? (
                                  <span
                                    title="Pickup currently active / scheduled in current month"
                                    className="inline-flex items-center justify-center gap-1 px-2 py-1 bg-blue-50 text-blue-900 font-bold text-[10px] rounded-md border border-blue-200 whitespace-nowrap"
                                  >
                                    <Clock className="w-3 h-3 text-blue-700" />
                                    <span>In Progress</span>
                                  </span>
                                ) : (
                                  <span
                                    title="No pickup requested yet for current month"
                                    className="inline-flex items-center justify-center gap-1 px-2 py-1 bg-amber-50 text-amber-900 font-bold text-[10px] rounded-md border border-amber-200 whitespace-nowrap"
                                  >
                                    <span>Pending</span>
                                  </span>
                                )
                              ) : (
                                <span className="text-gray-400 font-mono text-xs">-</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
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
              • <strong>Verified by Worker:</strong> Confirms dry waste handover authenticated by assigned Haritha Karma Sena worker.
            </div>
            <div>
              • <strong>Result (Success / Failed):</strong> Marked as <strong>Success</strong> upon verified collection. If a calendar month has passed and the scheduled pickup was not completed, it is marked as <strong>Failed</strong>.
            </div>
            <div>
              • <strong>Payment Status:</strong> Reflects monthly user fee receipts recorded via online portal or direct collection receipt.
            </div>
            <div>
              • <strong>Pickup Date:</strong> Scheduled or completed doorstep collection cycle (15th–25th window).
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default CollectionRecords;
