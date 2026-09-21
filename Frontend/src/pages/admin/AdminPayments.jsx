import React, { useState, useEffect } from 'react';
import {
  IndianRupee,
  CheckCircle2,
  Clock,
  AlertCircle,
  RefreshCw,
  Search,
  Filter,
  Calendar,
  Building2,
  CreditCard,
  Wallet,
  Download,
  Eye,
  X,
  Phone,
  Home,
  User,
  ArrowUpRight,
  TrendingUp,
  FileSpreadsheet,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { getAllCitizens } from '../../services/citizenService';
import { getCitizenPayments } from '../../services/paymentService';

const AdminPayments = () => {
  const [citizens, setCitizens] = useState([]);
  const [paymentsMap, setPaymentsMap] = useState({}); // citizenId -> Array of payments
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1); // 1-12
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedWard, setSelectedWard] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal for Citizen Payment History
  const [historyModalCitizen, setHistoryModalCitizen] = useState(null);

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

  const fetchPaymentsData = async () => {
    setLoading(true);
    setError('');

    try {
      const citizenData = await getAllCitizens().catch(() => []);
      const validCitizens = Array.isArray(citizenData) ? citizenData : [];
      setCitizens(validCitizens);

      // Fetch payments for each citizen in parallel
      const pMap = {};
      await Promise.all(
        validCitizens.map(async (c) => {
          const cId = c.citizenId || c.id;
          if (cId) {
            try {
              const payments = await getCitizenPayments(cId);
              pMap[cId] = Array.isArray(payments) ? payments : [];
            } catch {
              pMap[cId] = [];
            }
          }
        })
      );
      setPaymentsMap(pMap);
    } catch (err) {
      console.error('Error fetching admin payments:', err);
      setError('Could not load payments data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPaymentsData();
  }, []);

  // Compute records for current selected month & year
  const monthlyRecords = citizens.map((citizen) => {
    const cId = citizen.citizenId || citizen.id;
    const citizenHistory = paymentsMap[cId] || [];

    // Find payment record matching selected month and year
    const payment = citizenHistory.find(
      (p) => p.year === Number(selectedYear) && p.month === Number(selectedMonth)
    );

    let status = 'Unpaid';
    let paymentMethod = 'Not Paid';
    let transactionId = '—';
    let paidAt = null;
    let amount = 50.0;

    if (payment) {
      amount = payment.amount || 50.0;
      if (payment.status === 'Paid') {
        status = 'Paid';
        paymentMethod = payment.paymentMethod || 'Online';
        transactionId = payment.transactionId || payment.razorpayPaymentId || '—';
        paidAt = payment.paidAt;
      } else if (payment.status === 'Pending' || payment.paymentMethod === 'Pay Through Worker') {
        status = 'Pending Cash Verification';
        paymentMethod = 'Pay Through Worker';
        transactionId = payment.transactionId || '—';
      } else {
        status = 'Unpaid';
      }
    }

    return {
      citizen,
      payment,
      citizenId: cId,
      citizenName: citizen.fullName || 'Citizen',
      houseName: citizen.houseName || 'House',
      houseNumber: citizen.houseNumber || 'N/A',
      wardId: citizen.wardId || 'W001',
      phone: citizen.phoneNumber || 'N/A',
      address: citizen.address || 'Address not registered',
      amount,
      status,
      paymentMethod,
      transactionId,
      paidAt,
      allHistory: citizenHistory
    };
  });

  // Extract unique wards for dropdown
  const uniqueWards = Array.from(
    new Set(citizens.map((c) => c.wardId).filter(Boolean))
  ).sort();

  // Sort & Pagination state
  const [sortField, setSortField] = useState('citizenName');
  const [sortDirection, setSortDirection] = useState('asc'); // 'asc' | 'desc'
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Filtered records
  const filteredRecords = monthlyRecords.filter((rec) => {
    // Ward filter
    if (selectedWard !== 'All' && rec.wardId !== selectedWard) {
      return false;
    }

    // Status filter
    if (statusFilter !== 'All') {
      if (statusFilter === 'Paid' && rec.status !== 'Paid') return false;
      if (statusFilter === 'Paid Online' && (rec.status !== 'Paid' || rec.paymentMethod !== 'Online')) return false;
      if (statusFilter === 'Paid Through Worker' && (rec.status !== 'Paid' || rec.paymentMethod !== 'Pay Through Worker')) return false;
      if (statusFilter === 'Pending Cash Verification' && rec.status !== 'Pending Cash Verification') return false;
      if (statusFilter === 'Unpaid' && rec.status !== 'Unpaid') return false;
    }

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = rec.citizenName.toLowerCase().includes(q);
      const matchId = (rec.citizenId || '').toLowerCase().includes(q);
      const matchHouse = (rec.houseName || '').toLowerCase().includes(q) || (rec.houseNumber || '').toLowerCase().includes(q);
      const matchWard = (rec.wardId || '').toLowerCase().includes(q);
      const matchTxn = (rec.transactionId || '').toLowerCase().includes(q);
      return matchName || matchId || matchHouse || matchWard || matchTxn;
    }

    return true;
  });

  // Sorted records
  const sortedRecords = [...filteredRecords].sort((a, b) => {
    let aVal = a[sortField];
    let bVal = b[sortField];
    if (sortField === 'paidAt') {
      aVal = a.paidAt ? new Date(a.paidAt).getTime() : 0;
      bVal = b.paidAt ? new Date(b.paidAt).getTime() : 0;
    } else if (typeof aVal === 'string') {
      aVal = aVal.toLowerCase();
      bVal = (bVal || '').toLowerCase();
    }
    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const totalPages = Math.ceil(sortedRecords.length / pageSize) || 1;
  const paginatedRecords = sortedRecords.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Summary Analytics Metrics
  const totalHouseholds = monthlyRecords.length;
  const targetRevenue = totalHouseholds * 50;

  const paidRecords = monthlyRecords.filter((r) => r.status === 'Paid');
  const paidCount = paidRecords.length;
  const collectedRevenue = paidCount * 50;
  const collectionRate = totalHouseholds > 0 ? Math.round((paidCount / totalHouseholds) * 100) : 0;

  const onlinePaidCount = paidRecords.filter((r) => r.paymentMethod === 'Online').length;
  const onlineCollected = onlinePaidCount * 50;

  const workerPaidCount = paidRecords.filter((r) => r.paymentMethod === 'Pay Through Worker').length;
  const workerCollected = workerPaidCount * 50;

  const pendingCashCount = monthlyRecords.filter((r) => r.status === 'Pending Cash Verification').length;
  const unpaidCount = monthlyRecords.filter((r) => r.status === 'Unpaid').length;
  const outstandingDues = (totalHouseholds - paidCount) * 50;

  // Ward-wise collection breakdown table data
  const wardSummary = uniqueWards.map((wId) => {
    const wardHouses = monthlyRecords.filter((r) => r.wardId === wId);
    const wardTotal = wardHouses.length;
    const wardPaid = wardHouses.filter((r) => r.status === 'Paid').length;
    const wardRev = wardPaid * 50;
    const wardDues = (wardTotal - wardPaid) * 50;
    const wardPct = wardTotal > 0 ? Math.round((wardPaid / wardTotal) * 100) : 0;

    return {
      wardId: wId,
      total: wardTotal,
      paid: wardPaid,
      collected: wardRev,
      dues: wardDues,
      rate: wardPct
    };
  });

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ['Citizen Name', 'Citizen ID', 'House Name', 'House Number', 'Ward', 'Phone', 'Month', 'Year', 'Amount (INR)', 'Status', 'Payment Method', 'Transaction ID', 'Paid At'];
    const rows = sortedRecords.map((r) => [
      `"${r.citizenName}"`,
      `"${r.citizenId}"`,
      `"${r.houseName}"`,
      `"${r.houseNumber}"`,
      `"${r.wardId}"`,
      `"${r.phone}"`,
      selectedMonth,
      selectedYear,
      r.amount,
      `"${r.status}"`,
      `"${r.paymentMethod}"`,
      `"${r.transactionId}"`,
      r.paidAt ? `"${new Date(r.paidAt).toLocaleString()}"` : '""'
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `EcoMind_Payments_${selectedMonth}_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderSortIcon = (field) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3.5 h-3.5 text-gray-400 opacity-60" />;
    }
    return sortDirection === 'asc' ? (
      <ArrowUp className="w-3.5 h-3.5 text-[#0a4d2c] dark:text-emerald-400" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-[#0a4d2c] dark:text-emerald-400" />
    );
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Hero Header Banner */}
      <div className="bg-gradient-to-r from-[#0a4d2c] via-[#0f5b37] to-emerald-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-1/4 -translate-y-1/4 w-72 h-72 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-emerald-200 text-xs font-semibold mb-2">
              <IndianRupee className="w-3.5 h-3.5 text-emerald-300" />
              <span>Haritha Karma Sena User Fee Management</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Monthly Household Payment Records
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100/90 font-medium mt-1">
              Audit fixed ₹50 monthly user fee collection across all registered households, track online Razorpay receipts vs cash handed to field workers, and monitor ward dues.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0 self-start md:self-center">
            <button
              type="button"
              onClick={handleExportCSV}
              className="px-4 py-2.5 bg-white text-[#0a4d2c] hover:bg-emerald-50 font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-2"
            >
              <Download className="w-4 h-4 text-[#0a4d2c]" />
              <span>Export CSV</span>
            </button>
            <button
              type="button"
              onClick={fetchPaymentsData}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh Records</span>
            </button>
          </div>
        </div>
      </div>

      {/* Monthly Collection Summary Analytics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: Expected Target */}
        <div className="bg-white dark:bg-[#14231b] p-5 rounded-2xl border border-emerald-100 dark:border-emerald-800/60 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Expected Target</span>
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950 text-[#0a4d2c] dark:text-emerald-300 rounded-xl">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-gray-900 dark:text-white">₹{targetRevenue.toLocaleString()}</p>
          <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">
            {totalHouseholds} Houses × ₹50
          </p>
        </div>

        {/* Card 2: Total Revenue Collected */}
        <div className="bg-white dark:bg-[#14231b] p-5 rounded-2xl border border-emerald-100 dark:border-emerald-800/60 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#0a4d2c] dark:text-emerald-400 uppercase tracking-wider">Collected Revenue</span>
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/60 text-[#0a4d2c] dark:text-emerald-300 rounded-xl">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-[#0a4d2c] dark:text-emerald-400">₹{collectedRevenue.toLocaleString()}</p>
          <p className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
            {paidCount} Paid ({collectionRate}%)
          </p>
        </div>

        {/* Card 3: Online Collections */}
        <div className="bg-white dark:bg-[#14231b] p-5 rounded-2xl border border-emerald-100 dark:border-emerald-800/60 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider">Online (Razorpay)</span>
            <div className="p-2 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 rounded-xl">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-blue-900 dark:text-blue-200">₹{onlineCollected.toLocaleString()}</p>
          <p className="text-[11px] font-semibold text-blue-600 dark:text-blue-400">
            {onlinePaidCount} Digital Receipts
          </p>
        </div>

        {/* Card 4: Field Worker Cash */}
        <div className="bg-white dark:bg-[#14231b] p-5 rounded-2xl border border-emerald-100 dark:border-emerald-800/60 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Worker Cash</span>
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 rounded-xl">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-900 dark:text-emerald-200">₹{workerCollected.toLocaleString()}</p>
          <p className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
            {workerPaidCount} Cash Receipts
          </p>
        </div>

        {/* Card 5: Outstanding Dues */}
        <div className="bg-white dark:bg-[#14231b] p-5 rounded-2xl border border-emerald-100 dark:border-emerald-800/60 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider">Outstanding Dues</span>
            <div className="p-2 bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-400 rounded-xl">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-rose-900 dark:text-rose-300">₹{outstandingDues.toLocaleString()}</p>
          <p className="text-[11px] font-semibold text-rose-700 dark:text-rose-400">
            {unpaidCount + pendingCashCount} Unpaid Houses
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/50 border-l-4 border-rose-500 text-rose-900 dark:text-rose-200 text-xs font-bold rounded-2xl flex items-center gap-3 shadow-xs">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter & Period Controls Bar */}
      <div className="bg-white dark:bg-[#14231b] p-5 rounded-3xl border border-emerald-100 dark:border-emerald-800/60 shadow-2xs space-y-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Citizen Name, House Name, No, Ward, Transaction ID..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-emerald-950/30 border border-gray-200 dark:border-emerald-800/60 rounded-2xl text-xs font-semibold text-gray-800 dark:text-white focus:outline-none focus:border-[#0a4d2c] focus:bg-white transition-all"
            />
          </div>

          {/* Period & Filter Controls */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Month */}
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-gray-400" />
              <select
                value={selectedMonth}
                onChange={(e) => {
                  setSelectedMonth(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-xl px-3 py-2 text-xs font-extrabold text-[#0a4d2c] dark:text-emerald-300 focus:outline-none cursor-pointer"
              >
                {months.map((m) => (
                  <option key={m.value} value={m.value}>{m.name}</option>
                ))}
              </select>
            </div>

            {/* Year */}
            <select
              value={selectedYear}
              onChange={(e) => {
                setSelectedYear(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-xl px-3 py-2 text-xs font-extrabold text-[#0a4d2c] dark:text-emerald-300 focus:outline-none cursor-pointer"
            >
              {[2024, 2025, 2026, 2027].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>

            {/* Status Filter */}
            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-gray-50 dark:bg-emerald-950/30 border border-gray-200 dark:border-emerald-800/60 rounded-xl px-3 py-2 text-xs font-bold text-gray-700 dark:text-gray-200 focus:outline-none focus:border-[#0a4d2c] cursor-pointer"
              >
                <option value="All">All Statuses</option>
                <option value="Paid">Paid (All)</option>
                <option value="Paid Online">Paid Online (Razorpay)</option>
                <option value="Paid Through Worker">Paid Through Worker (Cash)</option>
                <option value="Pending Cash Verification">Pending Cash Verification</option>
                <option value="Unpaid">Unpaid</option>
              </select>
            </div>

            {/* Ward Filter */}
            <div className="flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-gray-400" />
              <select
                value={selectedWard}
                onChange={(e) => {
                  setSelectedWard(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-gray-50 dark:bg-emerald-950/30 border border-gray-200 dark:border-emerald-800/60 rounded-xl px-3 py-2 text-xs font-bold text-gray-700 dark:text-gray-200 focus:outline-none focus:border-[#0a4d2c] cursor-pointer"
              >
                <option value="All">All Wards ({uniqueWards.length})</option>
                {uniqueWards.map((w) => (
                  <option key={w} value={w}>{w}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-100 dark:border-emerald-800/40">
          <span>
            Showing <strong>{filteredRecords.length}</strong> of <strong>{monthlyRecords.length}</strong> household records for <strong>{months.find((m) => m.value === selectedMonth)?.name} {selectedYear}</strong>
          </span>
          {(searchQuery || statusFilter !== 'All' || selectedWard !== 'All') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('All');
                setSelectedWard('All');
                setCurrentPage(1);
              }}
              className="text-xs font-bold text-[#0a4d2c] dark:text-emerald-400 hover:underline cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Household Records Table */}
      {loading ? (
        <div className="bg-white dark:bg-[#14231b] rounded-3xl p-12 text-center border border-emerald-100 dark:border-emerald-800/60 shadow-sm space-y-3">
          <div className="w-8 h-8 border-3 border-[#0a4d2c] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Loading monthly household payment records...</p>
        </div>
      ) : filteredRecords.length === 0 ? (
        <div className="bg-white dark:bg-[#14231b] rounded-3xl p-12 text-center border border-emerald-100 dark:border-emerald-800/60 shadow-sm space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950 text-[#0a4d2c] dark:text-emerald-300 flex items-center justify-center mx-auto">
            <IndianRupee className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-gray-800 dark:text-white">No Matching Household Records</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
            No household fee records matched your current query or filters for {months.find((m) => m.value === selectedMonth)?.name} {selectedYear}.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-[#14231b] rounded-3xl border border-emerald-100 dark:border-emerald-800/60 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-emerald-50/70 dark:bg-emerald-950/40 border-b border-emerald-100 dark:border-emerald-800/60 text-gray-600 dark:text-gray-300 font-extrabold text-[11px] uppercase tracking-wider select-none">
                  <th
                    className="py-4 px-4 cursor-pointer hover:text-[#0a4d2c] dark:hover:text-emerald-300 transition-colors"
                    onClick={() => handleSort('citizenName')}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>House & Resident</span>
                      {renderSortIcon('citizenName')}
                    </div>
                  </th>
                  <th
                    className="py-4 px-3 cursor-pointer hover:text-[#0a4d2c] dark:hover:text-emerald-300 transition-colors"
                    onClick={() => handleSort('wardId')}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Ward</span>
                      {renderSortIcon('wardId')}
                    </div>
                  </th>
                  <th
                    className="py-4 px-3 cursor-pointer hover:text-[#0a4d2c] dark:hover:text-emerald-300 transition-colors"
                    onClick={() => handleSort('amount')}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Monthly Fee</span>
                      {renderSortIcon('amount')}
                    </div>
                  </th>
                  <th
                    className="py-4 px-3 cursor-pointer hover:text-[#0a4d2c] dark:hover:text-emerald-300 transition-colors"
                    onClick={() => handleSort('status')}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Payment Status</span>
                      {renderSortIcon('status')}
                    </div>
                  </th>
                  <th
                    className="py-4 px-3 cursor-pointer hover:text-[#0a4d2c] dark:hover:text-emerald-300 transition-colors"
                    onClick={() => handleSort('paymentMethod')}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Mode</span>
                      {renderSortIcon('paymentMethod')}
                    </div>
                  </th>
                  <th className="py-4 px-3">Transaction ID</th>
                  <th
                    className="py-4 px-3 cursor-pointer hover:text-[#0a4d2c] dark:hover:text-emerald-300 transition-colors"
                    onClick={() => handleSort('paidAt')}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Paid Date</span>
                      {renderSortIcon('paidAt')}
                    </div>
                  </th>
                  <th className="py-4 px-4 text-center">Payment History</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-emerald-900/30 font-medium text-gray-700 dark:text-gray-200">
                {paginatedRecords.map((rec) => {
                  const isPaid = rec.status === 'Paid';
                  const isOnline = rec.paymentMethod === 'Online';
                  const isWorker = rec.paymentMethod === 'Pay Through Worker';
                  const isPending = rec.status === 'Pending Cash Verification';

                  return (
                    <tr key={rec.citizenId} className="hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20 transition-colors">
                      {/* House & Resident */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <span className="font-extrabold text-gray-900 dark:text-white block text-xs">
                            {rec.houseName} • No: {rec.houseNumber}
                          </span>
                          <span className="text-gray-500 dark:text-gray-400 text-[11px] block">
                            {rec.citizenName} ({rec.citizenId})
                          </span>
                          <span className="text-gray-400 dark:text-gray-500 text-[10px] block truncate max-w-[200px]">
                            {rec.address}
                          </span>
                        </div>
                      </td>

                      {/* Ward */}
                      <td className="py-3.5 px-3">
                        <span className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/60 text-[#0a4d2c] dark:text-emerald-300 font-black rounded-lg text-[11px] border border-emerald-200 dark:border-emerald-800">
                          {rec.wardId}
                        </span>
                      </td>

                      {/* Amount */}
                      <td className="py-3.5 px-3">
                        <span className="font-black text-gray-900 dark:text-white text-sm">
                          ₹{rec.amount}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-3">
                        {isPaid ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-100 dark:bg-emerald-950 text-[#0a4d2c] dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                            <CheckCircle2 className="w-3 h-3 text-emerald-700 dark:text-emerald-400" />
                            <span>Paid</span>
                          </span>
                        ) : isPending ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700">
                            <Clock className="w-3 h-3 text-amber-700 dark:text-amber-400" />
                            <span>Pending Cash</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-rose-100 dark:bg-rose-950 text-rose-900 dark:text-rose-200 border border-rose-300 dark:border-rose-700">
                            <AlertCircle className="w-3 h-3 text-rose-700 dark:text-rose-400" />
                            <span>Unpaid</span>
                          </span>
                        )}
                      </td>

                      {/* Mode */}
                      <td className="py-3.5 px-3">
                        {isPaid ? (
                          isOnline ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 dark:text-blue-300">
                              <CreditCard className="w-3.5 h-3.5" />
                              <span>Online</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#0a4d2c] dark:text-emerald-400">
                              <Wallet className="w-3.5 h-3.5" />
                              <span>Worker Cash</span>
                            </span>
                          )
                        ) : isPending ? (
                          <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-300">
                            To Worker
                          </span>
                        ) : (
                          <span className="text-gray-400 text-[11px]">—</span>
                        )}
                      </td>

                      {/* Transaction ID */}
                      <td className="py-3.5 px-3 font-mono text-[11px] text-gray-600 dark:text-gray-300">
                        {rec.transactionId}
                      </td>

                      {/* Paid Date */}
                      <td className="py-3.5 px-3 text-gray-500 dark:text-gray-400 text-[11px]">
                        {rec.paidAt ? new Date(rec.paidAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                      </td>

                      {/* History Button */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => setHistoryModalCitizen(rec)}
                          className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 hover:bg-[#0a4d2c] dark:hover:bg-emerald-600 text-[#0a4d2c] dark:text-emerald-300 hover:text-white font-bold text-[11px] transition-all cursor-pointer border border-emerald-200 dark:border-emerald-800 inline-flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View History</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls Footer */}
          <div className="px-6 py-4 bg-gray-50 dark:bg-emerald-950/30 border-t border-gray-100 dark:border-emerald-800/60 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 font-medium">
              <span>Rows per page:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-white dark:bg-[#14231b] border border-gray-200 dark:border-emerald-800 rounded-lg px-2.5 py-1 text-xs font-bold text-gray-700 dark:text-gray-200 focus:outline-none"
              >
                {[10, 25, 50, 100].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <span>
                Showing {Math.min((currentPage - 1) * pageSize + 1, sortedRecords.length)} - {Math.min(currentPage * pageSize, sortedRecords.length)} of {sortedRecords.length}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-2 rounded-xl bg-white dark:bg-[#14231b] border border-gray-200 dark:border-emerald-800 text-gray-700 dark:text-gray-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-emerald-950 transition-colors cursor-pointer"
                title="Previous page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum = i + 1;
                  if (totalPages > 5 && currentPage > 3) {
                    pageNum = currentPage - 3 + i + 1;
                    if (pageNum > totalPages) pageNum = totalPages - 4 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      type="button"
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-8 h-8 rounded-xl text-xs font-black transition-all cursor-pointer ${
                        currentPage === pageNum
                          ? 'bg-[#0a4d2c] text-white shadow-xs'
                          : 'bg-white dark:bg-[#14231b] border border-gray-200 dark:border-emerald-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-emerald-950'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="p-2 rounded-xl bg-white dark:bg-[#14231b] border border-gray-200 dark:border-emerald-800 text-gray-700 dark:text-gray-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-emerald-950 transition-colors cursor-pointer"
                title="Next page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ward-Wise Collection Summary Table */}
      <div className="bg-white dark:bg-[#14231b] rounded-3xl p-6 border border-emerald-100 dark:border-emerald-800/60 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-emerald-800/40 pb-3">
          <div>
            <h3 className="text-base font-extrabold text-gray-900 dark:text-white">
              Ward-Wise Collection Summary
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Breakdown of ₹50 user fee collection across all registered wards for {months.find((m) => m.value === selectedMonth)?.name} {selectedYear}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {wardSummary.map((w) => (
            <div
              key={w.wardId}
              className="p-4 rounded-2xl border border-gray-100 dark:border-emerald-800/40 bg-gray-50/60 dark:bg-emerald-950/20 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/40 transition-all space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-sm text-[#0a4d2c] dark:text-emerald-300">{w.wardId}</span>
                <span className="text-xs font-black px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-900/60 text-[#0a4d2c] dark:text-emerald-300">
                  {w.rate}%
                </span>
              </div>

              <div className="w-full h-1.5 bg-gray-200 dark:bg-emerald-900/40 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#0a4d2c] dark:bg-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${w.rate}%` }}
                />
              </div>

              <div className="flex justify-between text-xs pt-1">
                <span className="text-gray-500 dark:text-gray-400">Collected: <strong className="text-gray-800 dark:text-gray-200">₹{w.collected}</strong> ({w.paid}/{w.total})</span>
                <span className="text-rose-600 dark:text-rose-400 font-bold">Dues: ₹{w.dues}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Citizen Payment History Modal */}
      {historyModalCitizen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-[#14231b] rounded-3xl max-w-2xl w-full border border-emerald-100 dark:border-emerald-800 shadow-2xl p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-gray-100 dark:border-emerald-800/40 pb-4">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-[#0a4d2c] dark:text-emerald-300 text-xs font-bold">
                  <IndianRupee className="w-3.5 h-3.5" />
                  <span>Household Payment Ledger</span>
                </div>
                <h3 className="text-lg font-extrabold text-gray-900 dark:text-white">
                  {historyModalCitizen.houseName} (No: {historyModalCitizen.houseNumber})
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Resident: <strong className="text-gray-800 dark:text-gray-200">{historyModalCitizen.citizenName}</strong> • Ward: <strong>{historyModalCitizen.wardId}</strong>
                </p>
              </div>

              <button
                type="button"
                onClick={() => setHistoryModalCitizen(null)}
                className="p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-emerald-900/60 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Past Payment Records */}
            <div className="space-y-3">
              <h4 className="text-xs font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Monthly Payment History (Fixed ₹50 / Month)
              </h4>

              {historyModalCitizen.allHistory.length === 0 ? (
                <div className="p-6 bg-gray-50 dark:bg-emerald-950/20 rounded-2xl text-center text-xs text-gray-500 dark:text-gray-400">
                  No previous payment records found for this citizen.
                </div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-emerald-800/40 border border-gray-200 dark:border-emerald-800/60 rounded-2xl overflow-hidden text-xs">
                  {historyModalCitizen.allHistory.map((h, idx) => {
                    const isPaid = h.status === 'Paid';
                    const isOnline = h.paymentMethod === 'Online';

                    return (
                      <div
                        key={idx}
                        className="p-3.5 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-emerald-950/30 transition-colors"
                      >
                        <div className="space-y-0.5">
                          <span className="font-extrabold text-gray-900 dark:text-white block text-xs">
                            {months.find((m) => m.value === h.month)?.name || `Month ${h.month}`} {h.year}
                          </span>
                          <span className="font-mono text-[10px] text-gray-500 dark:text-gray-400 block">
                            Txn: {h.transactionId || h.razorpayPaymentId || '—'}
                          </span>
                        </div>

                        <div className="text-right space-y-0.5">
                          <div className="flex items-center gap-2 justify-end">
                            <span className="font-black text-gray-900 dark:text-white text-xs">₹{h.amount || 50}</span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                              isPaid ? 'bg-emerald-100 dark:bg-emerald-950 text-[#0a4d2c] dark:text-emerald-300' : 'bg-rose-100 dark:bg-rose-950 text-rose-900 dark:text-rose-200'
                            }`}>
                              {h.status}
                            </span>
                          </div>
                          <span className="text-[10px] text-gray-500 dark:text-gray-400 block">
                            {isPaid ? (isOnline ? 'Online Razorpay' : 'Worker Cash') : 'Pending'}
                            {h.paidAt && ` • ${new Date(h.paidAt).toLocaleDateString()}`}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end pt-2 border-t border-gray-100 dark:border-emerald-800/40">
              <button
                type="button"
                onClick={() => setHistoryModalCitizen(null)}
                className="px-5 py-2.5 bg-gray-100 dark:bg-emerald-950/60 hover:bg-gray-200 dark:hover:bg-emerald-900 text-gray-800 dark:text-gray-200 font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                Close Ledger
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPayments;
