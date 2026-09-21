import React, { useState, useEffect, useMemo } from 'react';
import {
  IndianRupee,
  Search,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  Receipt,
  User,
  Phone,
  Home,
  FileCheck,
  RefreshCw,
  Printer,
  Download,
  Filter,
  ShieldCheck,
  Check,
  Smartphone,
  CreditCard,
  Building2
} from 'lucide-react';
import { getCitizensByWard } from '../../services/citizenService';
import { getCitizenPayments, processWorkerPayment } from '../../services/paymentService';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const WorkerPaymentCollection = ({ wardId = 'Ward 1', workerProfile = {} }) => {
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [activeSubTab, setActiveSubTab] = useState('all'); // 'all' | 'pending' | 'online' | 'history'

  const [citizens, setCitizens] = useState([]);
  const [paymentsMap, setPaymentsMap] = useState({}); // citizenKey -> payment object for selectedMonth & selectedYear
  const [allCashHistory, setAllCashHistory] = useState([]); // list of all cash payments
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [successToast, setSuccessToast] = useState('');
  const [receiptModalData, setReceiptModalData] = useState(null);

  // Load ward citizens and payment statuses
  const loadPaymentData = async () => {
    setLoading(true);
    try {
      const citizenList = await getCitizensByWard(wardId);
      setCitizens(citizenList || []);

      const pMap = {};
      const historyList = [];

      await Promise.all(
        (citizenList || []).map(async (c) => {
          const citizenKey = c.id || c.citizenId || c.email;
          if (!citizenKey) return;

          // Check both citizenId and email in database
          const idsToCheck = Array.from(new Set([c.citizenId, c.email, c.id].filter(Boolean)));
          let citizenPayments = [];

          for (const id of idsToCheck) {
            try {
              const res = await getCitizenPayments(id);
              if (res && res.length > 0) {
                citizenPayments = [...citizenPayments, ...res];
              }
            } catch (err) {
              console.error(`Error loading payments for ${id}:`, err);
            }
          }

          // Prioritize 'Paid' payment for this billing cycle if exists
          const currentPeriodPayment =
            citizenPayments.find(
              (p) => p.month === selectedMonth && p.year === selectedYear && p.status === 'Paid'
            ) ||
            citizenPayments.find(
              (p) => p.month === selectedMonth && p.year === selectedYear
            ) ||
            null;

          pMap[citizenKey] = currentPeriodPayment;

          // Collect cash payments processed by worker into history
          citizenPayments.forEach((p) => {
            if (
              p.status === 'Paid' &&
              (p.paymentMethod === 'Pay Through Worker' || p.transactionId?.startsWith('WORKER-'))
            ) {
              // Avoid duplicate in history
              if (!historyList.some((h) => (h.paymentId || h.id) === (p.paymentId || p.id))) {
                historyList.push({
                  ...p,
                  citizenName: c.fullName || 'Citizen',
                  houseNumber: c.houseNumber || 'N/A',
                  citizenPhone: c.phoneNumber || c.phone || 'N/A',
                  citizenEmail: c.email || citizenKey,
                });
              }
            }
          });
        })
      );

      setPaymentsMap(pMap);
      historyList.sort(
        (a, b) => new Date(b.paidAt || b.createdAt) - new Date(a.paidAt || a.createdAt)
      );
      setAllCashHistory(historyList);
    } catch (err) {
      console.error('Error loading ward payment collection:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPaymentData();
  }, [wardId, selectedMonth, selectedYear]);

  // Handle Mark Payment as Received (Cash)
  const handleCollectCash = async (citizen) => {
    const targetCitizenId = citizen.citizenId || citizen.email || citizen.id;
    const citizenKey = citizen.id || citizen.citizenId || citizen.email;
    if (!targetCitizenId) return;

    setProcessingId(citizenKey);
    try {
      const payload = {
        citizenId: targetCitizenId,
        month: selectedMonth,
        year: selectedYear,
      };

      const result = await processWorkerPayment(payload);

      // Update local state
      setPaymentsMap((prev) => ({
        ...prev,
        [citizenKey]: result,
      }));

      // Add to cash history
      const newHistoryItem = {
        ...result,
        citizenName: citizen.fullName || 'Citizen',
        houseNumber: citizen.houseNumber || 'N/A',
        citizenPhone: citizen.phoneNumber || citizen.phone || 'N/A',
        citizenEmail: citizen.email || targetCitizenId,
      };
      setAllCashHistory((prev) => [newHistoryItem, ...prev]);

      setSuccessToast(`₹50 cash payment successfully recorded for ${citizen.fullName || 'Citizen'}!`);
      setTimeout(() => setSuccessToast(''), 5000);

      // Open digital receipt
      setReceiptModalData(newHistoryItem);
    } catch (err) {
      console.error('Failed to record cash payment:', err);
      alert('Failed to record payment. Please try again.');
    } finally {
      setProcessingId(null);
    }
  };

  const getCitizenPayment = (c) => {
    const key = c.id || c.citizenId || c.email;
    return paymentsMap[key];
  };

  // Filtered lists based on payment status & search
  const pendingCitizens = useMemo(() => {
    return citizens.filter((c) => {
      const payment = getCitizenPayment(c);
      const isPaid = payment && payment.status === 'Paid';
      if (isPaid) return false;

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        return (
          (c.fullName || '').toLowerCase().includes(query) ||
          (c.houseNumber || '').toLowerCase().includes(query) ||
          (c.phoneNumber || c.phone || '').includes(query)
        );
      }
      return true;
    });
  }, [citizens, paymentsMap, searchQuery]);

  const onlinePaidCitizens = useMemo(() => {
    return citizens.filter((c) => {
      const payment = getCitizenPayment(c);
      const isOnlinePaid = payment && payment.status === 'Paid' && payment.paymentMethod === 'Online';
      if (!isOnlinePaid) return false;

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        return (
          (c.fullName || '').toLowerCase().includes(query) ||
          (c.houseNumber || '').toLowerCase().includes(query) ||
          (c.phoneNumber || c.phone || '').includes(query)
        );
      }
      return true;
    });
  }, [citizens, paymentsMap, searchQuery]);

  const allFilteredCitizens = useMemo(() => {
    return citizens.filter((c) => {
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        return (
          (c.fullName || '').toLowerCase().includes(query) ||
          (c.houseNumber || '').toLowerCase().includes(query) ||
          (c.phoneNumber || c.phone || '').includes(query)
        );
      }
      return true;
    });
  }, [citizens, searchQuery]);

  // Filtered history list
  const filteredHistory = useMemo(() => {
    return allCashHistory.filter((item) => {
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        return (
          (item.citizenName || '').toLowerCase().includes(query) ||
          (item.houseNumber || '').toLowerCase().includes(query) ||
          (item.transactionId || '').toLowerCase().includes(query) ||
          (item.paymentId || '').toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [allCashHistory, searchQuery]);

  // Summary Metrics
  const totalCashCollected = allCashHistory.reduce((sum, item) => sum + (item.amount || 50), 0);
  const monthCashCollected = allCashHistory
    .filter((item) => item.month === selectedMonth && item.year === selectedYear)
    .reduce((sum, item) => sum + (item.amount || 50), 0);

  const monthOnlineCount = Object.values(paymentsMap).filter(
    (p) => p && p.status === 'Paid' && p.paymentMethod === 'Online'
  ).length;
  const monthOnlineTotal = monthOnlineCount * 50;

  const totalPaidCountThisMonth = Object.values(paymentsMap).filter(
    (p) => p && p.status === 'Paid'
  ).length;
  const pendingCountThisMonth = Math.max(0, citizens.length - totalPaidCountThisMonth);

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fadeIn">
      {/* Toast Notification */}
      {successToast && (
        <div className="p-4 bg-emerald-600 text-white rounded-2xl shadow-lg flex items-center justify-between gap-3 animate-slide-down">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" />
            <span className="text-xs sm:text-sm font-bold">{successToast}</span>
          </div>
          <button
            onClick={() => setSuccessToast('')}
            className="text-white hover:text-emerald-200 text-xs font-bold px-2 py-1 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Hero Header */}
      <div className="bg-gradient-to-r from-[#0a4d2c] via-[#0f5b37] to-emerald-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-1/4 -translate-y-1/4 w-80 h-80 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 text-xs font-semibold">
              <IndianRupee className="w-4 h-4 text-emerald-300" />
              <span>Doorstep Cash & Online Payment Verification</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Ward Payment Collection
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100/90 max-w-xl">
              Inspect payment records for households in{' '}
              <span className="font-bold text-white">{wardId}</span>. Live synchronized with the backend payments table: Online payments appear as{' '}
              <span className="text-emerald-300 font-bold">Paid (Online)</span>, and pending cash dues can be verified at doorstep.
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

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Collected This Month */}
        <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">This Month Total</span>
            <div className="p-2 bg-emerald-50 rounded-xl text-emerald-700">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-gray-900">
            ₹{monthOnlineTotal + monthCashCollected}
          </p>
          <div className="flex items-center gap-2 text-[11px] font-semibold text-gray-500">
            <span className="text-blue-700 font-bold">₹{monthOnlineTotal} Online</span>
            <span>•</span>
            <span className="text-emerald-700 font-bold">₹{monthCashCollected} Cash</span>
          </div>
        </div>

        {/* Pending Cash Dues */}
        <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Pending Cash Dues</span>
            <div className="p-2 bg-amber-50 rounded-xl text-amber-700">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-amber-600">{pendingCountThisMonth} Houses</p>
          <p className="text-[11px] text-gray-500 font-medium">
            Outstanding: ₹{pendingCountThisMonth * 50}
          </p>
        </div>

        {/* Fee Collection Rate */}
        <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Fee Collection Rate</span>
            <div className="p-2 bg-blue-50 rounded-xl text-blue-700">
              <FileCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-blue-900">
            {citizens.length > 0 ? Math.round((totalPaidCountThisMonth / citizens.length) * 100) : 0}%
          </p>
          <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-emerald-600 h-full rounded-full transition-all duration-500"
              style={{
                width: `${citizens.length > 0 ? Math.round((totalPaidCountThisMonth / citizens.length) * 100) : 0}%`
              }}
            />
          </div>
        </div>

        {/* Total Cash Handled by Worker */}
        <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Cash Handled</span>
            <div className="p-2 bg-emerald-50 rounded-xl text-emerald-800">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-[#0a4d2c]">₹{totalCashCollected}</p>
          <p className="text-[11px] text-emerald-700 font-medium">
            {allCashHistory.length} Receipts Issued
          </p>
        </div>
      </div>

      {/* Main Section */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 border border-emerald-100 shadow-md space-y-5">
        {/* Tab & Search Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
          {/* Subtabs */}
          <div className="flex flex-wrap items-center gap-2 bg-gray-100 p-1 rounded-2xl">
            <button
              onClick={() => setActiveSubTab('all')}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                activeSubTab === 'all'
                  ? 'bg-[#0a4d2c] text-white shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              All Ward Households ({citizens.length})
            </button>
            <button
              onClick={() => setActiveSubTab('pending')}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                activeSubTab === 'pending'
                  ? 'bg-[#0a4d2c] text-white shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Pending Cash Verification ({pendingCitizens.length})
            </button>
            <button
              onClick={() => setActiveSubTab('online')}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                activeSubTab === 'online'
                  ? 'bg-[#0a4d2c] text-white shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Paid Online ({onlinePaidCitizens.length})
            </button>
            <button
              onClick={() => setActiveSubTab('history')}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                activeSubTab === 'history'
                  ? 'bg-[#0a4d2c] text-white shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Cash Payment History ({allCashHistory.length})
            </button>
          </div>

          {/* Search Input */}
          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search citizen, house no, phone..."
              className="w-full pl-10 pr-4 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition"
            />
          </div>
        </div>

        {/* Content View */}
        {loading ? (
          <div className="py-16 text-center text-gray-500 space-y-3">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-emerald-600" />
            <p className="text-sm font-semibold">Analyzing payments table from backend...</p>
          </div>
        ) : activeSubTab === 'history' ? (
          /* CASH PAYMENT HISTORY TAB */
          filteredHistory.length === 0 ? (
            <div className="py-16 text-center text-gray-500 space-y-3">
              <Receipt className="w-12 h-12 mx-auto text-gray-300" />
              <p className="text-base font-extrabold text-gray-800">No Cash Payments Recorded Yet</p>
              <p className="text-xs text-gray-500">
                Cash collections verified through field workers will be permanently listed here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-emerald-50/60 text-emerald-950 font-bold uppercase tracking-wider text-[11px] border-b border-emerald-100">
                    <th className="py-3 px-4 rounded-l-xl">Receipt / Txn ID</th>
                    <th className="py-3 px-4">Citizen / Household</th>
                    <th className="py-3 px-4">House No</th>
                    <th className="py-3 px-4">Cycle</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Date Collected</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right rounded-r-xl">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
                  {filteredHistory.map((item, idx) => (
                    <tr key={item.paymentId || idx} className="hover:bg-emerald-50/30 transition">
                      <td className="py-3.5 px-4 font-mono font-bold text-[#0a4d2c]">
                        {item.paymentId || item.transactionId || `RCP-${idx + 1}`}
                      </td>

                      <td className="py-3.5 px-4 font-bold text-gray-900">
                        {item.citizenName}
                      </td>

                      <td className="py-3.5 px-4 font-semibold text-gray-800">
                        {item.houseNumber}
                      </td>

                      <td className="py-3.5 px-4 font-semibold text-gray-800">
                        {MONTH_NAMES[(item.month || 1) - 1]} {item.year}
                      </td>

                      <td className="py-3.5 px-4 font-extrabold text-emerald-900">
                        ₹{item.amount || 50}.00
                      </td>

                      <td className="py-3.5 px-4 text-gray-600">
                        {item.paidAt ? new Date(item.paidAt).toLocaleDateString('en-GB') : 'Today'}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <Check className="w-3 h-3 text-emerald-600" /> Cash Verified
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => setReceiptModalData(item)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-bold text-xs rounded-xl border border-emerald-200 transition cursor-pointer"
                        >
                          <Receipt className="w-3.5 h-3.5 text-emerald-700" />
                          <span>View Receipt</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : (
          /* HOUSEHOLDS DIRECTORY TABLE (ALL / PENDING / ONLINE) */
          (() => {
            const displayList =
              activeSubTab === 'pending'
                ? pendingCitizens
                : activeSubTab === 'online'
                ? onlinePaidCitizens
                : allFilteredCitizens;

            if (displayList.length === 0) {
              return (
                <div className="py-16 text-center text-gray-500 space-y-3">
                  <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-500" />
                  <p className="text-base font-extrabold text-gray-800">
                    {activeSubTab === 'pending'
                      ? `All Ward Dues Collected for ${MONTH_NAMES[selectedMonth - 1]} ${selectedYear}!`
                      : activeSubTab === 'online'
                      ? `No Online Payments Found for ${MONTH_NAMES[selectedMonth - 1]} ${selectedYear}`
                      : 'No Matching Households Found'}
                  </p>
                  <p className="text-xs text-gray-500 max-w-md mx-auto">
                    {activeSubTab === 'pending'
                      ? `Every registered household in ${wardId} has settled their monthly user fee or verified payment.`
                      : 'Try selecting another month or adjusting your search query.'}
                  </p>
                </div>
              );
            }

            return (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-emerald-50/60 text-emerald-950 font-bold uppercase tracking-wider text-[11px] border-b border-emerald-100">
                      <th className="py-3 px-4 rounded-l-xl">Citizen / Household</th>
                      <th className="py-3 px-4">House No</th>
                      <th className="py-3 px-4">Phone</th>
                      <th className="py-3 px-4">Billing Period</th>
                      <th className="py-3 px-4">Amount</th>
                      <th className="py-3 px-4">Payment Status</th>
                      <th className="py-3 px-4">Citizen Mode</th>
                      <th className="py-3 px-4 text-right rounded-r-xl">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
                    {displayList.map((citizen) => {
                      const citizenKey = citizen.id || citizen.citizenId || citizen.email;
                      const payment = getCitizenPayment(citizen);
                      const isPaid = payment && payment.status === 'Paid';
                      const isOnline = payment && payment.paymentMethod === 'Online';
                      const isProcessing = processingId === citizenKey;

                      return (
                        <tr key={citizenKey} className="hover:bg-emerald-50/30 transition">
                          {/* Citizen / Household */}
                          <td className="py-3.5 px-4 font-bold text-gray-900">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0">
                                {(citizen.fullName || 'C')[0].toUpperCase()}
                              </div>
                              <div>
                                <p className="font-extrabold text-gray-900">{citizen.fullName || 'Citizen'}</p>
                                <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
                                  {citizen.citizenId && (
                                    <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-1 rounded">
                                      {citizen.citizenId}
                                    </span>
                                  )}
                                  <span className="truncate max-w-[140px]">{citizen.email}</span>
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* House No */}
                          <td className="py-3.5 px-4 font-semibold text-gray-800">
                            {citizen.houseNumber || 'N/A'}
                          </td>

                          {/* Phone */}
                          <td className="py-3.5 px-4 text-gray-600 font-semibold">
                            {citizen.phoneNumber || citizen.phone || 'N/A'}
                          </td>

                          {/* Billing Period */}
                          <td className="py-3.5 px-4">
                            <span className="font-semibold text-gray-800">
                              {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
                            </span>
                          </td>

                          {/* Amount */}
                          <td className="py-3.5 px-4 font-extrabold">
                            {isPaid ? (
                              <span className="text-emerald-700">
                                ₹50.00 <span className="text-[10px] text-emerald-600 font-semibold">(Paid)</span>
                              </span>
                            ) : (
                              <span className="text-gray-900 font-extrabold">₹50.00</span>
                            )}
                          </td>

                          {/* Payment Status (Analysed from Backend) */}
                          <td className="py-3.5 px-4">
                            {isPaid ? (
                              <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                Paid
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                                <Clock className="w-3.5 h-3.5 text-amber-600" />
                                Unpaid / Due
                              </span>
                            )}
                          </td>

                          {/* Citizen Mode (Online vs Pay Through Worker vs Cash Doorstep) */}
                          <td className="py-3.5 px-4">
                            {isOnline ? (
                              <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200 shadow-2xs">
                                <Smartphone className="w-3.5 h-3.5 text-blue-600" />
                                Online
                              </span>
                            ) : payment?.paymentMethod === 'Pay Through Worker' ? (
                              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                                <IndianRupee className="w-3.5 h-3.5 text-emerald-600" />
                                Pay Through Worker
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                                <Clock className="w-3.5 h-3.5 text-amber-600" />
                                Cash at Doorstep
                              </span>
                            )}
                          </td>

                          {/* Action */}
                          <td className="py-3.5 px-4 text-right">
                            {isPaid && isOnline ? (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-900 font-extrabold text-xs rounded-xl border border-blue-200 shadow-2xs">
                                <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                                Paid Online
                              </span>
                            ) : isPaid ? (
                              <button
                                type="button"
                                onClick={() =>
                                  setReceiptModalData({
                                    ...payment,
                                    citizenName: citizen.fullName,
                                    houseNumber: citizen.houseNumber,
                                    citizenPhone: citizen.phoneNumber || citizen.phone,
                                    citizenEmail: citizen.email,
                                  })
                                }
                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-[#0a4d2c] font-bold text-xs rounded-xl border border-emerald-200 transition cursor-pointer"
                              >
                                <Receipt className="w-3.5 h-3.5 text-emerald-700" />
                                <span>View Receipt</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                disabled={isProcessing}
                                onClick={() => handleCollectCash(citizen)}
                                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#0a4d2c] hover:bg-[#063820] text-white font-extrabold text-xs rounded-xl shadow-xs transition cursor-pointer disabled:opacity-50"
                              >
                                {isProcessing ? (
                                  <>
                                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                    <span>Verifying...</span>
                                  </>
                                ) : (
                                  <>
                                    <IndianRupee className="w-3.5 h-3.5 text-emerald-300" />
                                    <span>Collect ₹50 Cash</span>
                                  </>
                                )}
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            );
          })()
        )}
      </div>

      {/* Digital Receipt Modal */}
      {receiptModalData && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative border border-emerald-100 space-y-5">
            <div className="text-center space-y-1 pb-4 border-b border-gray-100">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto mb-2">
                <ShieldCheck className="w-7 h-7 text-[#0a4d2c]" />
              </div>
              <h3 className="text-lg font-extrabold text-gray-900">Official Payment Receipt</h3>
              <p className="text-xs text-gray-500">Haritha Karma Sena Doorstep User Fee</p>
            </div>

            <div className="bg-gray-50 p-4 rounded-2xl space-y-2.5 text-xs text-gray-700 border border-gray-100">
              <div className="flex justify-between">
                <span className="text-gray-400 font-semibold uppercase">Receipt ID:</span>
                <span className="font-mono font-bold text-gray-900">
                  {receiptModalData.paymentId || receiptModalData.transactionId}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400 font-semibold uppercase">Citizen / House:</span>
                <span className="font-bold text-gray-900">
                  {receiptModalData.citizenName} (H.No {receiptModalData.houseNumber})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400 font-semibold uppercase">Service Ward:</span>
                <span className="font-bold text-gray-900">{wardId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400 font-semibold uppercase">Billing Cycle:</span>
                <span className="font-bold text-gray-900">
                  {MONTH_NAMES[(receiptModalData.month || 1) - 1]} {receiptModalData.year}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400 font-semibold uppercase">Payment Mode:</span>
                <span className="font-bold text-emerald-800">
                  {receiptModalData.paymentMethod === 'Online'
                    ? 'Paid Online (Razorpay)'
                    : 'Cash Paid to Field Worker'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400 font-semibold uppercase">Verified By:</span>
                <span className="font-bold text-gray-900">
                  {workerProfile.fullName || 'Authorized Worker'}
                </span>
              </div>
              <div className="pt-2 border-t border-gray-200 flex justify-between items-center text-sm font-extrabold text-gray-900">
                <span>Amount Paid:</span>
                <span className="text-lg font-extrabold text-[#0a4d2c]">
                  ₹{receiptModalData.amount || 50}.00
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setReceiptModalData(null)}
                className="py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="py-2.5 px-5 bg-[#0a4d2c] hover:bg-[#063820] text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4 text-emerald-300" />
                <span>Print Receipt</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkerPaymentCollection;
