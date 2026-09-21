import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  BarChart3,
  IndianRupee,
  Truck,
  Users,
  Building2,
  Calendar,
  Download,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
  UserCheck,
  PackageCheck,
  Star,
  Printer,
  Sparkles,
  ChevronRight,
  Eye,
  X,
  Award,
  Phone,
  ShieldCheck
} from 'lucide-react';
import { getAllPickupRequests } from '../../services/pickupRequestService';
import { getAllCitizens } from '../../services/citizenService';
import { getAllWorkers } from '../../services/workerService';
import { getCitizenPayments } from '../../services/paymentService';

const AdminReports = () => {
  const [activeReport, setActiveReport] = useState('monthly-pickups'); // 'monthly-pickups' | 'payments' | 'ward-wise' | 'worker-performance' | 'citizen-participation'

  // Data states
  const [requests, setRequests] = useState([]);
  const [citizens, setCitizens] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [paymentsMap, setPaymentsMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Global Period & Ward Filter
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1); // 1-12
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedWard, setSelectedWard] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Worker Performance Specific Filters & Modal
  const [workerSearch, setWorkerSearch] = useState('');
  const [workerTierFilter, setWorkerTierFilter] = useState('All'); // 'All' | 'Top' | 'Good' | 'Attention' | 'None'
  const [selectedWorkerDetail, setSelectedWorkerDetail] = useState(null);

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

  const fetchAllReportData = async () => {
    setLoading(true);
    setError('');

    try {
      const [pickupData, citizenData, workerData] = await Promise.all([
        getAllPickupRequests().catch(() => []),
        getAllCitizens().catch(() => []),
        getAllWorkers().catch(() => [])
      ]);

      const validCitizens = Array.isArray(citizenData) ? citizenData : [];
      setCitizens(validCitizens);
      setRequests(Array.isArray(pickupData) ? pickupData : []);
      setWorkers(Array.isArray(workerData) ? workerData : []);

      // Fetch payments map
      const pMap = {};
      await Promise.all(
        validCitizens.map(async (c) => {
          const cId = c.citizenId || c.id;
          if (cId) {
            try {
              const res = await getCitizenPayments(cId);
              pMap[cId] = Array.isArray(res) ? res : [];
            } catch {
              pMap[cId] = [];
            }
          }
        })
      );
      setPaymentsMap(pMap);
    } catch (err) {
      console.error('Error fetching report data:', err);
      setError('Could not load administrative report datasets.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllReportData();
  }, []);

  // Quick lookup maps
  const citizensMap = useMemo(() => {
    const map = {};
    citizens.forEach(c => {
      if (c.citizenId) map[c.citizenId] = c;
      if (c.id) map[c.id] = c;
    });
    return map;
  }, [citizens]);

  const workersMap = useMemo(() => {
    const map = {};
    workers.forEach(w => {
      if (w.workerId) map[w.workerId] = w;
      if (w.id) map[w.id] = w;
    });
    return map;
  }, [workers]);

  // Unique wards list
  const uniqueWards = useMemo(() => {
    const fromCitizens = citizens.map(c => c.wardId).filter(Boolean);
    const fromRequests = requests.map(r => r.wardId).filter(Boolean);
    const combined = Array.from(new Set([...fromCitizens, ...fromRequests])).sort();
    return combined.length > 0 ? combined : ['W001', 'W002', 'W003', 'W004', 'W005'];
  }, [citizens, requests]);

  // Filter requests by period (selected month & year) and ward
  const periodRequests = useMemo(() => {
    return requests.filter(req => {
      // Filter by requestedAt or collectionDate
      const dateToCheck = req.collectionDate ? new Date(req.collectionDate) : (req.requestedAt ? new Date(req.requestedAt) : null);
      if (dateToCheck) {
        const matchYear = dateToCheck.getFullYear() === Number(selectedYear);
        const matchMonth = dateToCheck.getMonth() + 1 === Number(selectedMonth);
        if (!matchYear || !matchMonth) return false;
      }

      if (selectedWard !== 'All' && req.wardId !== selectedWard) {
        return false;
      }

      return true;
    });
  }, [requests, selectedMonth, selectedYear, selectedWard]);

  // Filter citizens by ward
  const wardCitizens = useMemo(() => {
    if (selectedWard === 'All') return citizens;
    return citizens.filter(c => c.wardId === selectedWard);
  }, [citizens, selectedWard]);

  // Monthly Payments for selected period
  const periodPayments = useMemo(() => {
    return wardCitizens.map(c => {
      const cId = c.citizenId || c.id;
      const history = paymentsMap[cId] || [];
      const payment = history.find(p => p.year === Number(selectedYear) && p.month === Number(selectedMonth));

      const isPaid = payment && payment.status === 'Paid';
      const isOnline = isPaid && payment.paymentMethod === 'Online';
      const isWorker = isPaid && payment.paymentMethod === 'Pay Through Worker';
      const isPending = payment && (payment.status === 'Pending' || payment.paymentMethod === 'Pay Through Worker');

      return {
        citizen: c,
        citizenId: cId,
        citizenName: c.fullName || 'Citizen',
        houseName: c.houseName || 'House',
        houseNumber: c.houseNumber || 'N/A',
        wardId: c.wardId || 'W001',
        phone: c.phoneNumber || 'N/A',
        amount: payment?.amount || 50.0,
        status: isPaid ? 'Paid' : (isPending ? 'Pending Cash' : 'Unpaid'),
        paymentMethod: isPaid ? (isOnline ? 'Online' : 'Worker Cash') : (isPending ? 'Pay Through Worker' : 'Unpaid'),
        transactionId: payment?.transactionId || payment?.razorpayPaymentId || '—',
        paidAt: payment?.paidAt
      };
    });
  }, [wardCitizens, paymentsMap, selectedMonth, selectedYear]);

  // ---------------------------------------------------------------------------------
  // 1. MONTHLY PICKUP REPORT METRICS
  // ---------------------------------------------------------------------------------
  const pickupMetrics = useMemo(() => {
    const total = periodRequests.length;
    const completed = periodRequests.filter(r => {
      const s = (r.status || '').toLowerCase();
      return s === 'completed' || s === 'collected';
    }).length;
    const scheduled = periodRequests.filter(r => {
      const s = (r.status || '').toLowerCase();
      return s === 'scheduled' || s === 'accepted';
    }).length;
    const pending = periodRequests.filter(r => (r.status || '').toLowerCase() === 'pending').length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    // Waste categories breakdown
    const categories = {};
    periodRequests.forEach(r => {
      const cat = r.overallCategory || 'Recyclable Plastic';
      categories[cat] = (categories[cat] || 0) + 1;
    });

    return { total, completed, scheduled, pending, completionRate, categories };
  }, [periodRequests]);

  // ---------------------------------------------------------------------------------
  // 2. PAYMENT REPORT METRICS
  // ---------------------------------------------------------------------------------
  const paymentMetrics = useMemo(() => {
    const totalHouses = periodPayments.length;
    const targetRevenue = totalHouses * 50;

    const paidRecords = periodPayments.filter(p => p.status === 'Paid');
    const paidCount = paidRecords.length;
    const collectedRevenue = paidCount * 50;
    const collectionEfficiency = totalHouses > 0 ? Math.round((paidCount / totalHouses) * 100) : 0;

    const onlineCollected = paidRecords.filter(p => p.paymentMethod === 'Online').length * 50;
    const workerCollected = paidRecords.filter(p => p.paymentMethod === 'Worker Cash').length * 50;
    const outstandingDues = (totalHouses - paidCount) * 50;

    return {
      totalHouses,
      targetRevenue,
      collectedRevenue,
      collectionEfficiency,
      onlineCollected,
      workerCollected,
      outstandingDues,
      paidCount
    };
  }, [periodPayments]);

  // ---------------------------------------------------------------------------------
  // 3. WARD-WISE COLLECTION REPORT METRICS
  // ---------------------------------------------------------------------------------
  const wardMetrics = useMemo(() => {
    return uniqueWards.map(wId => {
      const wardCits = citizens.filter(c => c.wardId === wId);
      const wardReqs = periodRequests.filter(r => r.wardId === wId);
      const wardWorkers = workers.filter(w => w.assignedWard === wId);

      const totalHouseholds = wardCits.length;
      const pickupsCount = wardReqs.length;
      const pickupsCompleted = wardReqs.filter(r => {
        const s = (r.status || '').toLowerCase();
        return s === 'completed' || s === 'collected';
      }).length;
      const pickupRate = pickupsCount > 0 ? Math.round((pickupsCompleted / pickupsCount) * 100) : 0;

      // Payments for this ward
      let paidHouses = 0;
      wardCits.forEach(c => {
        const cId = c.citizenId || c.id;
        const history = paymentsMap[cId] || [];
        const p = history.find(item => item.year === Number(selectedYear) && item.month === Number(selectedMonth));
        if (p && p.status === 'Paid') {
          paidHouses += 1;
        }
      });

      const collectedRev = paidHouses * 50;
      const pendingDues = (totalHouseholds - paidHouses) * 50;
      const paymentCompliance = totalHouseholds > 0 ? Math.round((paidHouses / totalHouseholds) * 100) : 0;

      return {
        wardId: wId,
        totalHouseholds,
        pickupsCount,
        pickupsCompleted,
        pickupRate,
        paidHouses,
        collectedRev,
        pendingDues,
        paymentCompliance,
        workersCount: wardWorkers.length
      };
    });
  }, [uniqueWards, citizens, periodRequests, workers, paymentsMap, selectedMonth, selectedYear]);

  // ---------------------------------------------------------------------------------
  // 4. WORKER PERFORMANCE REPORT METRICS
  // ---------------------------------------------------------------------------------
  const workerMetrics = useMemo(() => {
    return workers.map(w => {
      const workerId = w.workerId || w.id;
      const workerPickups = periodRequests.filter(
        r => r.acceptedByWorkerId === workerId || r.acceptedByWorkerId === w.fullName
      );

      const completed = workerPickups.filter(r => {
        const s = (r.status || '').toLowerCase();
        return s === 'completed' || s === 'collected';
      }).length;

      const scheduled = workerPickups.filter(r => {
        const s = (r.status || '').toLowerCase();
        return s === 'scheduled' || s === 'accepted';
      }).length;

      const pending = workerPickups.filter(r => (r.status || '').toLowerCase() === 'pending').length;

      const efficiency = workerPickups.length > 0 ? Math.round((completed / workerPickups.length) * 100) : 0;

      // Cash payments collected by this worker
      let cashCollected = 0;
      const assignedWardCitizens = citizens.filter(c => c.wardId === w.assignedWard);
      assignedWardCitizens.forEach(c => {
        const cId = c.citizenId || c.id;
        const history = paymentsMap[cId] || [];
        const p = history.find(item => item.year === Number(selectedYear) && item.month === Number(selectedMonth));
        if (p && p.status === 'Paid' && p.paymentMethod === 'Pay Through Worker') {
          cashCollected += 50;
        }
      });

      let badge = 'Needs Attention';
      if (workerPickups.length === 0) badge = 'No Pickups Assigned';
      else if (efficiency >= 80 && completed >= 1) badge = 'Top Performer ⭐';
      else if (efficiency >= 50) badge = 'Good Progress';

      return {
        worker: w,
        workerId,
        workerName: w.fullName || 'Worker',
        assignedWard: w.assignedWard || 'All',
        phone: w.phoneNumber || 'N/A',
        totalAssigned: workerPickups.length,
        completed,
        scheduled,
        pending,
        efficiency,
        cashCollected,
        badge,
        pickupsList: workerPickups
      };
    });
  }, [workers, periodRequests, citizens, paymentsMap, selectedMonth, selectedYear]);

  // Overall Worker Operations Performance Metrics
  const overallWorkerMetrics = useMemo(() => {
    const totalWorkers = workerMetrics.length;
    const totalAssigned = workerMetrics.reduce((sum, w) => sum + w.totalAssigned, 0);
    const totalCompleted = workerMetrics.reduce((sum, w) => sum + w.completed, 0);
    const totalScheduled = workerMetrics.reduce((sum, w) => sum + w.scheduled, 0);
    const totalPending = workerMetrics.reduce((sum, w) => sum + w.pending, 0);
    const totalCash = workerMetrics.reduce((sum, w) => sum + w.cashCollected, 0);
    const overallEfficiency = totalAssigned > 0 ? Math.round((totalCompleted / totalAssigned) * 100) : 0;
    const topPerformersCount = workerMetrics.filter(w => w.efficiency >= 80 && w.completed > 0).length;

    return {
      totalWorkers,
      totalAssigned,
      totalCompleted,
      totalScheduled,
      totalPending,
      totalCash,
      overallEfficiency,
      topPerformersCount
    };
  }, [workerMetrics]);

  // Filtered workers based on search and performance tier
  const filteredWorkers = useMemo(() => {
    return workerMetrics.filter(w => {
      const q = workerSearch.toLowerCase().trim();
      const matchSearch =
        !q ||
        (w.workerName || '').toLowerCase().includes(q) ||
        (w.workerId || '').toLowerCase().includes(q) ||
        (w.assignedWard || '').toLowerCase().includes(q) ||
        (w.phone || '').includes(q);

      const matchTier =
        workerTierFilter === 'All' ||
        (workerTierFilter === 'Top' && w.badge.includes('Top Performer')) ||
        (workerTierFilter === 'Good' && w.badge.includes('Good Progress')) ||
        (workerTierFilter === 'Attention' && w.badge.includes('Needs Attention')) ||
        (workerTierFilter === 'None' && w.badge.includes('No Pickups'));

      return matchSearch && matchTier;
    });
  }, [workerMetrics, workerSearch, workerTierFilter]);

  // ---------------------------------------------------------------------------------
  // 5. CITIZEN PARTICIPATION REPORT METRICS
  // ---------------------------------------------------------------------------------
  const participationMetrics = useMemo(() => {
    const totalRegistered = wardCitizens.length;

    // Households that submitted a pickup request in this period
    const activeCitizenIds = new Set(periodRequests.map(r => r.citizenId));
    const activeCount = wardCitizens.filter(c => activeCitizenIds.has(c.citizenId) || activeCitizenIds.has(c.id)).length;
    const participationRate = totalRegistered > 0 ? Math.round((activeCount / totalRegistered) * 100) : 0;

    // AI Analysis usage count
    const aiAnalyzedCount = periodRequests.filter(r => r.aiAnalyzed === true || r.segregationAdvice).length;
    const aiAdoptionRate = periodRequests.length > 0 ? Math.round((aiAnalyzedCount / periodRequests.length) * 100) : 0;

    return {
      totalRegistered,
      activeCount,
      inactiveCount: totalRegistered - activeCount,
      participationRate,
      aiAnalyzedCount,
      aiAdoptionRate
    };
  }, [wardCitizens, periodRequests]);

  // ---------------------------------------------------------------------------------
  // EXPORT TO CSV HANDLER
  // ---------------------------------------------------------------------------------
  const handleExportReport = () => {
    let filename = `EcoMind_${activeReport}_${selectedMonth}_${selectedYear}.csv`;
    let headers = [];
    let rows = [];

    if (activeReport === 'monthly-pickups') {
      headers = ['Request ID', 'Citizen Name', 'House Name', 'House Number', 'Ward', 'Category', 'Volume', 'Status', 'Collection Date', 'Worker'];
      rows = periodRequests.map(r => {
        const c = citizensMap[r.citizenId] || {};
        return [
          `"${r.requestId}"`,
          `"${c.fullName || r.citizenName || r.citizenId}"`,
          `"${c.houseName || r.houseName || 'House'}"`,
          `"${c.houseNumber || r.houseNumber || 'N/A'}"`,
          `"${r.wardId}"`,
          `"${r.overallCategory || 'Recyclable Plastic'}"`,
          `"${r.estimatedVolume || 'Medium'}"`,
          `"${r.status}"`,
          `"${r.collectionDate ? new Date(r.collectionDate).toLocaleDateString() : 'Unscheduled'}"`,
          `"${r.acceptedByWorkerId || 'Unassigned'}"`
        ];
      });
    } else if (activeReport === 'payments') {
      headers = ['Citizen Name', 'Citizen ID', 'House Name', 'House Number', 'Ward', 'Amount (INR)', 'Status', 'Payment Method', 'Transaction ID', 'Paid Date'];
      rows = periodPayments.map(p => [
        `"${p.citizenName}"`,
        `"${p.citizenId}"`,
        `"${p.houseName}"`,
        `"${p.houseNumber}"`,
        `"${p.wardId}"`,
        p.amount,
        `"${p.status}"`,
        `"${p.paymentMethod}"`,
        `"${p.transactionId}"`,
        p.paidAt ? `"${new Date(p.paidAt).toLocaleDateString()}"` : '""'
      ]);
    } else if (activeReport === 'ward-wise') {
      headers = ['Ward ID', 'Total Households', 'Pickups Requested', 'Pickups Completed', 'Pickup Rate %', 'Paid Households', 'Revenue Collected (INR)', 'Pending Dues (INR)', 'Payment Compliance %', 'Field Workers'];
      rows = wardMetrics.map(w => [
        `"${w.wardId}"`,
        w.totalHouseholds,
        w.pickupsCount,
        w.pickupsCompleted,
        w.pickupRate,
        w.paidHouses,
        w.collectedRev,
        w.pendingDues,
        w.paymentCompliance,
        w.workersCount
      ]);
    } else if (activeReport === 'worker-performance') {
      filename = `EcoMind_Worker_Performance_Pickup_Analysis_${selectedMonth}_${selectedYear}.csv`;
      headers = [
        'Worker Name',
        'Worker ID',
        'Assigned Ward',
        'Phone Number',
        'Total Assigned Pickups',
        'Completed Pickups',
        'Scheduled Pickups',
        'Pending Pickups',
        'Completion Rate %',
        'Cash Fees Collected (INR)',
        'Performance Tier',
        'Audit Period'
      ];
      rows = workerMetrics.map(w => [
        `"${w.workerName}"`,
        `"${w.workerId}"`,
        `"${w.assignedWard}"`,
        `"${w.phone}"`,
        w.totalAssigned,
        w.completed,
        w.scheduled,
        w.pending,
        `${w.efficiency}%`,
        w.cashCollected,
        `"${w.badge}"`,
        `"${months.find(m => m.value === selectedMonth)?.name} ${selectedYear}"`
      ]);
    } else if (activeReport === 'citizen-participation') {
      headers = ['Citizen Name', 'Citizen ID', 'House Name', 'House No', 'Ward', 'Phone', 'Participation Status', 'Total Requests Submitted'];
      const activeIds = new Set(periodRequests.map(r => r.citizenId));
      rows = wardCitizens.map(c => {
        const cId = c.citizenId || c.id;
        const hasParticipated = activeIds.has(cId);
        const reqCount = periodRequests.filter(r => r.citizenId === cId).length;
        return [
          `"${c.fullName || 'Citizen'}"`,
          `"${cId}"`,
          `"${c.houseName || 'House'}"`,
          `"${c.houseNumber || 'N/A'}"`,
          `"${c.wardId || 'W001'}"`,
          `"${c.phoneNumber || 'N/A'}"`,
          hasParticipated ? '"Active Participant"' : '"Not Participated"',
          reqCount
        ];
      });
    }

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportWorkerPickups = (worker) => {
    if (!worker) return;
    const filename = `EcoMind_Worker_${worker.workerId}_Pickups_${selectedMonth}_${selectedYear}.csv`;
    const headers = [
      'Request ID',
      'Citizen Name',
      'Citizen ID',
      'House Name',
      'House Number',
      'Ward',
      'Category',
      'Collection Date',
      'Verification Code',
      'Status'
    ];
    const rows = (worker.pickupsList || []).map(r => {
      const c = citizensMap[r.citizenId] || {};
      return [
        `"${r.requestId || 'REQ-N/A'}"`,
        `"${c.fullName || r.citizenName || 'Citizen'}"`,
        `"${r.citizenId || 'N/A'}"`,
        `"${c.houseName || r.houseName || 'House'}"`,
        `"${c.houseNumber || r.houseNumber || 'N/A'}"`,
        `"${r.wardId || worker.assignedWard}"`,
        `"${r.overallCategory || 'Recyclable Plastic'}"`,
        `"${r.collectionDate ? new Date(r.collectionDate).toLocaleDateString() : (r.requestedAt ? new Date(r.requestedAt).toLocaleDateString() : 'Unscheduled')}"`,
        `"${r.verificationCode || 'N/A'}"`,
        `"${r.status || 'Pending'}"`
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#0a4d2c] via-[#0f5b37] to-emerald-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-1/4 -translate-y-1/4 w-72 h-72 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-emerald-200 text-xs font-semibold mb-2">
              <FileText className="w-3.5 h-3.5 text-emerald-300" />
              <span>Grama Panchayat Executive Audit & Reporting Hub</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Reports & Operational Analytics
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100/90 font-medium mt-1">
              Multi-dimensional analytics, official monthly collection summaries, payment audits, ward compliance, worker efficiency, and citizen participation metrics.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0 self-start md:self-center">
            <button
              type="button"
              onClick={handleExportReport}
              className="px-4 py-2.5 bg-white text-[#0a4d2c] hover:bg-emerald-50 font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-2"
            >
              <Download className="w-4 h-4 text-[#0a4d2c]" />
              <span>Export CSV</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
              title="Print Official Report"
            >
              <Printer className="w-4 h-4 text-white" />
              <span>Print</span>
            </button>
            <button
              type="button"
              onClick={fetchAllReportData}
              className="px-3 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Global Filter Bar (Period & Ward Selection) */}
      <div className="bg-white p-5 rounded-3xl border border-emerald-100 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Month Selector */}
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-gray-400" />
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
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 text-xs font-extrabold text-[#0a4d2c] focus:outline-none cursor-pointer"
            >
              {[2024, 2025, 2026, 2027].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>

            {/* Ward Selector */}
            <div className="flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-gray-400" />
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

          <div className="text-xs text-gray-500 font-medium">
            Audit Period: <strong>{months.find(m => m.value === selectedMonth)?.name} {selectedYear}</strong> • Ward: <strong>{selectedWard}</strong>
          </div>
        </div>

        {/* 5 Report Category Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pt-3 border-t border-gray-100 custom-scrollbar">
          {[
            { id: 'monthly-pickups', label: 'Monthly Pickup Report', icon: Truck },
            { id: 'payments', label: 'Payment Report', icon: IndianRupee },
            { id: 'ward-wise', label: 'Ward-Wise Collection Report', icon: Building2 },
            { id: 'worker-performance', label: 'Worker Performance', icon: UserCheck },
            { id: 'citizen-participation', label: 'Citizen Participation', icon: Users }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeReport === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveReport(tab.id)}
                className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 border ${
                  isActive
                    ? 'bg-[#0a4d2c] text-white border-[#0a4d2c] shadow-sm'
                    : 'bg-white text-gray-700 border-gray-200 hover:bg-emerald-50 hover:text-[#0a4d2c]'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-300' : 'text-emerald-700'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {loading && (
        <div className="bg-white rounded-3xl p-12 text-center border border-emerald-100 shadow-sm space-y-3">
          <div className="w-8 h-8 border-3 border-[#0a4d2c] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-gray-500 font-medium">Compiling audit analytics & dataset records...</p>
        </div>
      )}

      {!loading && (
        <>
          {/* ========================================================================= */}
          {/* REPORT 1: MONTHLY PICKUP REPORT */}
          {/* ========================================================================= */}
          {activeReport === 'monthly-pickups' && (
            <div className="space-y-6">
              {/* Summary KPIs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-2xs space-y-2">
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Total Pickups Submitted</span>
                  <p className="text-2xl font-black text-gray-900">{pickupMetrics.total}</p>
                  <p className="text-xs text-gray-500">For {months.find(m => m.value === selectedMonth)?.name} {selectedYear}</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-2xs space-y-2">
                  <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">Successfully Collected</span>
                  <p className="text-2xl font-black text-blue-900">{pickupMetrics.completed}</p>
                  <p className="text-xs text-blue-600 font-bold">{pickupMetrics.completionRate}% Collection Efficiency</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-2xs space-y-2">
                  <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Scheduled (15th–25th)</span>
                  <p className="text-2xl font-black text-emerald-900">{pickupMetrics.scheduled}</p>
                  <p className="text-xs text-emerald-700">Date assigned by field workers</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-2xs space-y-2">
                  <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">Pending Assignment</span>
                  <p className="text-2xl font-black text-amber-900">{pickupMetrics.pending}</p>
                  <p className="text-xs text-amber-700">Awaiting schedule confirmation</p>
                </div>
              </div>

              {/* Waste Categories Breakdown */}
              <div className="bg-white p-6 rounded-3xl border border-emerald-100 shadow-2xs space-y-4">
                <h3 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider">
                  Waste Segregation & Category Distribution
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {Object.entries(pickupMetrics.categories).map(([cat, count]) => (
                    <div key={cat} className="p-3.5 bg-gray-50 rounded-2xl border border-gray-200 space-y-1">
                      <span className="text-xs font-extrabold text-[#0a4d2c] block">{cat}</span>
                      <span className="text-xl font-black text-gray-900">{count}</span>
                      <span className="text-[10px] text-gray-500 block">
                        {pickupMetrics.total > 0 ? Math.round((count / pickupMetrics.total) * 100) : 0}% of monthly volume
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Detailed Pickups Table */}
              <div className="bg-white rounded-3xl border border-emerald-100 shadow-2xs overflow-hidden">
                <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="text-base font-extrabold text-gray-900">
                    Monthly Pickup Audit Log ({periodRequests.length} Records)
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-emerald-50/70 border-b border-emerald-100 text-gray-600 font-extrabold text-[11px] uppercase tracking-wider">
                        <th className="py-3 px-4">Request ID</th>
                        <th className="py-3 px-3">House & Citizen</th>
                        <th className="py-3 px-3">Ward</th>
                        <th className="py-3 px-3">Category</th>
                        <th className="py-3 px-3">Status</th>
                        <th className="py-3 px-3">Collection Date</th>
                        <th className="py-3 px-3">Assigned Worker</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
                      {periodRequests.map(r => {
                        const c = citizensMap[r.citizenId] || {};
                        const isDone = (r.status || '').toLowerCase() === 'completed';
                        const isSched = (r.status || '').toLowerCase() === 'scheduled' || (r.status || '').toLowerCase() === 'accepted';

                        return (
                          <tr key={r.requestId || r.id} className="hover:bg-emerald-50/40 transition-colors">
                            <td className="py-3 px-4 font-mono font-bold text-[#0a4d2c]">{r.requestId}</td>
                            <td className="py-3 px-3">
                              <span className="font-extrabold text-gray-900 block">{c.houseName || r.houseName || 'House'} • No: {c.houseNumber || r.houseNumber || 'N/A'}</span>
                              <span className="text-gray-500 text-[11px]">{c.fullName || r.citizenName || r.citizenId}</span>
                            </td>
                            <td className="py-3 px-3">
                              <span className="px-2 py-0.5 bg-emerald-50 text-[#0a4d2c] font-black rounded-md text-[11px] border border-emerald-200">
                                {r.wardId}
                              </span>
                            </td>
                            <td className="py-3 px-3">{r.overallCategory || 'Plastic'}</td>
                            <td className="py-3 px-3">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                                isDone ? 'bg-blue-100 text-blue-900' : isSched ? 'bg-emerald-100 text-[#0a4d2c]' : 'bg-amber-100 text-amber-900'
                              }`}>
                                {isDone ? 'Completed' : isSched ? 'Scheduled' : 'Pending'}
                              </span>
                            </td>
                            <td className="py-3 px-3">
                              {r.collectionDate ? new Date(r.collectionDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Unscheduled'}
                            </td>
                            <td className="py-3 px-3 text-gray-700 font-bold">
                              {r.acceptedByWorkerId || 'Unassigned'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* REPORT 2: PAYMENT REPORT */}
          {/* ========================================================================= */}
          {activeReport === 'payments' && (
            <div className="space-y-6">
              {/* Payment Summary KPIs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-2xs space-y-2">
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Target Revenue</span>
                  <p className="text-2xl font-black text-gray-900">₹{paymentMetrics.targetRevenue.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">{paymentMetrics.totalHouses} Houses × ₹50</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-2xs space-y-2">
                  <span className="text-[11px] font-bold text-[#0a4d2c] uppercase tracking-wider">Collected Revenue</span>
                  <p className="text-2xl font-black text-[#0a4d2c]">₹{paymentMetrics.collectedRevenue.toLocaleString()}</p>
                  <p className="text-xs text-emerald-700 font-bold">{paymentMetrics.collectionEfficiency}% Compliance Rate</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-2xs space-y-2">
                  <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">Online vs Worker Cash</span>
                  <p className="text-base font-black text-gray-900">
                    Online: <strong className="text-blue-700">₹{paymentMetrics.onlineCollected}</strong>
                  </p>
                  <p className="text-xs text-emerald-800 font-bold">
                    Worker Cash: ₹{paymentMetrics.workerCollected}
                  </p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-2xs space-y-2">
                  <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wider">Outstanding Dues</span>
                  <p className="text-2xl font-black text-rose-900">₹{paymentMetrics.outstandingDues.toLocaleString()}</p>
                  <p className="text-xs text-rose-600 font-semibold">{paymentMetrics.totalHouses - paymentMetrics.paidCount} Unpaid Households</p>
                </div>
              </div>

              {/* Payments Detailed Table */}
              <div className="bg-white rounded-3xl border border-emerald-100 shadow-2xs overflow-hidden">
                <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="text-base font-extrabold text-gray-900">
                    Household Monthly User Fee Ledger ({periodPayments.length} Houses)
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-emerald-50/70 border-b border-emerald-100 text-gray-600 font-extrabold text-[11px] uppercase tracking-wider">
                        <th className="py-3 px-4">House & Resident</th>
                        <th className="py-3 px-3">Ward</th>
                        <th className="py-3 px-3">Fee</th>
                        <th className="py-3 px-3">Status</th>
                        <th className="py-3 px-3">Method</th>
                        <th className="py-3 px-3">Transaction ID</th>
                        <th className="py-3 px-3">Paid At</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
                      {periodPayments.map(p => {
                        const isPaid = p.status === 'Paid';
                        return (
                          <tr key={p.citizenId} className="hover:bg-emerald-50/40 transition-colors">
                            <td className="py-3 px-4">
                              <span className="font-extrabold text-gray-900 block">{p.houseName} • No: {p.houseNumber}</span>
                              <span className="text-gray-500 text-[11px]">{p.citizenName} ({p.citizenId})</span>
                            </td>
                            <td className="py-3 px-3 font-bold text-[#0a4d2c]">{p.wardId}</td>
                            <td className="py-3 px-3 font-black text-gray-900">₹50</td>
                            <td className="py-3 px-3">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                                isPaid ? 'bg-emerald-100 text-[#0a4d2c]' : 'bg-rose-100 text-rose-900'
                              }`}>
                                {p.status}
                              </span>
                            </td>
                            <td className="py-3 px-3 font-bold text-gray-700">{p.paymentMethod}</td>
                            <td className="py-3 px-3 font-mono text-[11px] text-gray-500">{p.transactionId}</td>
                            <td className="py-3 px-3 text-gray-500">
                              {p.paidAt ? new Date(p.paidAt).toLocaleDateString() : '—'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* REPORT 3: WARD-WISE COLLECTION REPORT */}
          {/* ========================================================================= */}
          {activeReport === 'ward-wise' && (
            <div className="space-y-6">
              <div className="bg-white rounded-3xl border border-emerald-100 shadow-2xs overflow-hidden">
                <div className="p-5 border-b border-gray-100">
                  <h3 className="text-base font-extrabold text-gray-900">
                    Comparative Ward Collection Performance (All 22 Wards)
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Doorstep waste collection and ₹50 user fee compliance breakdown by ward for {months.find(m => m.value === selectedMonth)?.name} {selectedYear}
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-emerald-50/70 border-b border-emerald-100 text-gray-600 font-extrabold text-[11px] uppercase tracking-wider">
                        <th className="py-3.5 px-4">Ward ID</th>
                        <th className="py-3.5 px-3 text-center">Households</th>
                        <th className="py-3.5 px-3 text-center">Pickups Done</th>
                        <th className="py-3.5 px-3 text-center">Pickup Rate</th>
                        <th className="py-3.5 px-3 text-center">Paid Houses</th>
                        <th className="py-3.5 px-3">Revenue Collected</th>
                        <th className="py-3.5 px-3">Pending Dues</th>
                        <th className="py-3.5 px-3">Compliance Rate</th>
                        <th className="py-3.5 px-3 text-center">Sena Workers</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
                      {wardMetrics.map(w => (
                        <tr key={w.wardId} className="hover:bg-emerald-50/40 transition-colors">
                          <td className="py-3 px-4 font-black text-[#0a4d2c]">{w.wardId}</td>
                          <td className="py-3 px-3 text-center font-bold">{w.totalHouseholds}</td>
                          <td className="py-3 px-3 text-center">{w.pickupsCompleted}/{w.pickupsCount}</td>
                          <td className="py-3 px-3 text-center font-bold text-blue-700">{w.pickupRate}%</td>
                          <td className="py-3 px-3 text-center font-bold">{w.paidHouses}</td>
                          <td className="py-3 px-3 font-extrabold text-[#0a4d2c]">₹{w.collectedRev}</td>
                          <td className="py-3 px-3 font-extrabold text-rose-600">₹{w.pendingDues}</td>
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs">{w.paymentCompliance}%</span>
                              <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                <div className="h-full bg-[#0a4d2c] rounded-full" style={{ width: `${w.paymentCompliance}%` }} />
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-3 text-center font-bold">{w.workersCount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* REPORT 4: WORKER PERFORMANCE & PICKUP REQUEST ANALYSIS */}
          {/* ========================================================================= */}
          {activeReport === 'worker-performance' && (
            <div className="space-y-6">
              {/* Executive Operational Section Header & Quick Download Bar */}
              <div className="bg-white p-5 sm:p-6 rounded-3xl border border-emerald-100 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="p-2 rounded-xl bg-emerald-100 text-[#0a4d2c]">
                      <UserCheck className="w-5 h-5" />
                    </span>
                    <div>
                      <h3 className="text-lg font-black text-gray-900">
                        Haritha Karma Sena Field Workforce Operational Analysis
                      </h3>
                      <p className="text-xs text-gray-500 font-medium">
                        Doorstep plastic waste pickup progress, verification audit, efficiency rates, and cash collections for {months.find(m => m.value === selectedMonth)?.name} {selectedYear}.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  <button
                    type="button"
                    onClick={handleExportReport}
                    className="px-4 py-2 bg-[#0a4d2c] hover:bg-emerald-800 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer"
                    title="Export complete worker operational analysis to CSV"
                  >
                    <Download className="w-4 h-4 text-emerald-300" />
                    <span>Download Analysis (CSV)</span>
                  </button>

                  <button
                    type="button"
                    onClick={handlePrint}
                    className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-[#0a4d2c] border border-emerald-200 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                    title="Print executive operational report"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Print</span>
                  </button>
                </div>
              </div>

              {/* Overall Performance Operational KPIs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* KPI 1: Active Field Force */}
                <div className="bg-white p-5 rounded-3xl border border-emerald-100 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Field Workforce</span>
                    <span className="p-1.5 rounded-lg bg-emerald-50 text-[#0a4d2c]">
                      <Users className="w-4 h-4" />
                    </span>
                  </div>
                  <p className="text-2xl font-black text-gray-900">{overallWorkerMetrics.totalWorkers} Workers</p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Active in {uniqueWards.length} Wards</span>
                    <span className="font-extrabold text-emerald-700">{overallWorkerMetrics.topPerformersCount} Top Stars ⭐</span>
                  </div>
                </div>

                {/* KPI 2: Total Pickups Handled */}
                <div className="bg-white p-5 rounded-3xl border border-emerald-100 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">Pickups Handled</span>
                    <span className="p-1.5 rounded-lg bg-blue-50 text-blue-700">
                      <Truck className="w-4 h-4" />
                    </span>
                  </div>
                  <p className="text-2xl font-black text-blue-950">{overallWorkerMetrics.totalAssigned}</p>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-emerald-700 font-extrabold">{overallWorkerMetrics.totalCompleted} Completed ✓</span>
                    <span className="text-gray-400 font-medium">Assigned this month</span>
                  </div>
                </div>

                {/* KPI 3: Scheduled vs Pending */}
                <div className="bg-white p-5 rounded-3xl border border-emerald-100 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">Active Pipeline</span>
                    <span className="p-1.5 rounded-lg bg-amber-50 text-amber-700">
                      <Clock className="w-4 h-4" />
                    </span>
                  </div>
                  <p className="text-2xl font-black text-amber-900">{overallWorkerMetrics.totalScheduled + overallWorkerMetrics.totalPending}</p>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-blue-700 font-bold">{overallWorkerMetrics.totalScheduled} Scheduled</span>
                    <span className="text-amber-700 font-bold">{overallWorkerMetrics.totalPending} Pending</span>
                  </div>
                </div>

                {/* KPI 4: Efficiency & User Fee Revenue */}
                <div className="bg-white p-5 rounded-3xl border border-emerald-100 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-[#0a4d2c] uppercase tracking-wider">Overall Efficiency</span>
                    <span className="p-1.5 rounded-lg bg-emerald-50 text-[#0a4d2c]">
                      <TrendingUp className="w-4 h-4" />
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <p className="text-2xl font-black text-[#0a4d2c]">{overallWorkerMetrics.overallEfficiency}%</p>
                    <span className="text-xs font-black text-emerald-800">₹{overallWorkerMetrics.totalCash.toLocaleString()} Cash</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-600 to-[#0a4d2c] rounded-full transition-all duration-500"
                      style={{ width: `${overallWorkerMetrics.overallEfficiency}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Worker Search & Tier Filter Bar */}
              <div className="bg-white p-4 sm:p-5 rounded-3xl border border-emerald-100 shadow-2xs space-y-3">
                <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                  {/* Search Bar */}
                  <div className="relative flex-1 max-w-md">
                    <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={workerSearch}
                      onChange={(e) => setWorkerSearch(e.target.value)}
                      placeholder="Search worker name, ID, ward, or phone number..."
                      className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:border-[#0a4d2c] focus:bg-white transition-all"
                    />
                    {workerSearch && (
                      <button
                        onClick={() => setWorkerSearch('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* Tier Filter Pills */}
                  <div className="flex flex-wrap items-center gap-1.5 text-xs">
                    {[
                      { id: 'All', label: `All (${workerMetrics.length})` },
                      { id: 'Top', label: 'Top Performers ⭐' },
                      { id: 'Good', label: 'Good Progress' },
                      { id: 'Attention', label: 'Needs Attention' },
                      { id: 'None', label: 'No Pickups' }
                    ].map(t => (
                      <button
                        key={t.id}
                        onClick={() => setWorkerTierFilter(t.id)}
                        className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                          workerTierFilter === t.id
                            ? 'bg-[#0a4d2c] text-white shadow-2xs'
                            : 'bg-gray-50 text-gray-600 hover:bg-emerald-50 hover:text-[#0a4d2c] border border-gray-200'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="text-[11px] text-gray-500 font-medium flex items-center justify-between border-t border-gray-100 pt-2.5">
                  <span>
                    Showing <strong>{filteredWorkers.length}</strong> of <strong>{workerMetrics.length}</strong> field workers
                  </span>
                  <span className="text-gray-400">Click &quot;View Pickups&quot; to inspect assigned household requests</span>
                </div>
              </div>

              {/* Detailed Operational Table of Workers & Pickup Analysis */}
              <div className="bg-white rounded-3xl border border-emerald-100 shadow-2xs overflow-hidden">
                <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="text-base font-extrabold text-gray-900">
                    Worker Pickup Request Operational Roster ({filteredWorkers.length} Workers)
                  </h3>
                  <span className="text-xs text-gray-500">
                    Period: <strong>{months.find(m => m.value === selectedMonth)?.name} {selectedYear}</strong>
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-emerald-50/70 border-b border-emerald-100 text-gray-600 font-extrabold text-[11px] uppercase tracking-wider">
                        <th className="py-3.5 px-4">Worker & Contact</th>
                        <th className="py-3.5 px-3">Ward</th>
                        <th className="py-3.5 px-3 text-center">Assigned</th>
                        <th className="py-3.5 px-3 text-center">Completed</th>
                        <th className="py-3.5 px-3 text-center">Scheduled</th>
                        <th className="py-3.5 px-3 text-center">Pending</th>
                        <th className="py-3.5 px-3">Efficiency Rate</th>
                        <th className="py-3.5 px-3">Fees Collected</th>
                        <th className="py-3.5 px-3 text-center">Performance Tier</th>
                        <th className="py-3.5 px-4 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
                      {filteredWorkers.length === 0 ? (
                        <tr>
                          <td colSpan={10} className="py-8 text-center text-gray-400">
                            No worker records matched your search or tier filter.
                          </td>
                        </tr>
                      ) : (
                        filteredWorkers.map(w => (
                          <tr key={w.workerId} className="hover:bg-emerald-50/40 transition-colors">
                            {/* Worker Profile */}
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-[#0a4d2c] text-emerald-200 flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                                  {w.workerName[0]?.toUpperCase() || 'W'}
                                </div>
                                <div>
                                  <span className="font-extrabold text-gray-900 block">{w.workerName}</span>
                                  <span className="text-gray-400 text-[11px] font-mono">ID: {w.workerId} • {w.phone}</span>
                                </div>
                              </div>
                            </td>

                            {/* Ward */}
                            <td className="py-3 px-3">
                              <span className="px-2 py-0.5 bg-emerald-50 text-[#0a4d2c] font-black rounded-md text-[11px] border border-emerald-200">
                                {w.assignedWard}
                              </span>
                            </td>

                            {/* Assigned */}
                            <td className="py-3 px-3 text-center font-bold text-gray-900 text-sm">
                              {w.totalAssigned}
                            </td>

                            {/* Completed */}
                            <td className="py-3 px-3 text-center">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-100 text-[#0a4d2c]">
                                <CheckCircle2 className="w-3 h-3 text-[#0a4d2c]" />
                                {w.completed}
                              </span>
                            </td>

                            {/* Scheduled */}
                            <td className="py-3 px-3 text-center">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-blue-50 text-blue-900">
                                <Clock className="w-3 h-3 text-blue-700" />
                                {w.scheduled}
                              </span>
                            </td>

                            {/* Pending */}
                            <td className="py-3 px-3 text-center">
                              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold text-gray-600 bg-gray-100">
                                {w.pending}
                              </span>
                            </td>

                            {/* Efficiency Progress Bar */}
                            <td className="py-3 px-3">
                              <div className="space-y-1">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="font-extrabold text-gray-900">{w.efficiency}%</span>
                                </div>
                                <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all ${
                                      w.efficiency >= 80 ? 'bg-[#0a4d2c]' : w.efficiency >= 50 ? 'bg-blue-600' : 'bg-amber-500'
                                    }`}
                                    style={{ width: `${w.efficiency}%` }}
                                  />
                                </div>
                              </div>
                            </td>

                            {/* Cash Collected */}
                            <td className="py-3 px-3 font-extrabold text-[#0a4d2c] text-xs">
                              ₹{w.cashCollected}
                            </td>

                            {/* Badge */}
                            <td className="py-3 px-3 text-center">
                              <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                                w.badge.includes('Top')
                                  ? 'bg-emerald-100 text-[#0a4d2c] border border-emerald-300'
                                  : w.badge.includes('Good')
                                    ? 'bg-blue-100 text-blue-900 border border-blue-200'
                                    : w.badge.includes('No Pickups')
                                      ? 'bg-gray-100 text-gray-600 border border-gray-200'
                                      : 'bg-rose-100 text-rose-800 border border-rose-200'
                              }`}>
                                {w.badge}
                              </span>
                            </td>

                            {/* Action: View Pickups Button */}
                            <td className="py-3 px-4 text-center">
                              <button
                                type="button"
                                onClick={() => setSelectedWorkerDetail(w)}
                                className="px-3 py-1.5 bg-emerald-50 hover:bg-[#0a4d2c] text-[#0a4d2c] hover:text-white border border-emerald-200 rounded-xl font-extrabold text-[11px] transition-all cursor-pointer shadow-2xs flex items-center gap-1.5 mx-auto"
                                title="Inspect pickup requests assigned to this worker"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Pickups ({w.totalAssigned})</span>
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Drill-down Modal: Detailed Pickup Requests for Selected Worker */}
              {selectedWorkerDetail && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
                  <div className="bg-white dark:bg-[#14231b] rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-emerald-200 dark:border-emerald-800 flex flex-col">
                    {/* Modal Header */}
                    <div className="bg-gradient-to-r from-[#0a4d2c] to-emerald-900 p-5 sm:p-6 text-white flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-emerald-200 font-black text-base shadow-xs">
                          {selectedWorkerDetail.workerName[0]?.toUpperCase() || 'W'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-extrabold tracking-tight">{selectedWorkerDetail.workerName}</h3>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/30 text-emerald-200 border border-emerald-400/40">
                              {selectedWorkerDetail.badge}
                            </span>
                          </div>
                          <p className="text-xs text-emerald-100/80">
                            Worker ID: <strong className="font-mono">{selectedWorkerDetail.workerId}</strong> • Ward: <strong>{selectedWorkerDetail.assignedWard}</strong> • Phone: {selectedWorkerDetail.phone}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => setSelectedWorkerDetail(null)}
                        className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                        title="Close modal"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Operational Summary Strip */}
                    <div className="bg-emerald-50/90 dark:bg-[#182c21] px-5 py-3 border-b border-emerald-200 dark:border-emerald-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                      <div className="flex flex-wrap items-center gap-4">
                        <span>Assigned: <strong className="text-gray-900 dark:text-white">{selectedWorkerDetail.totalAssigned}</strong></span>
                        <span>Completed: <strong className="text-emerald-700 font-black">{selectedWorkerDetail.completed}</strong></span>
                        <span>Scheduled: <strong className="text-blue-700 font-black">{selectedWorkerDetail.scheduled}</strong></span>
                        <span>Pending: <strong className="text-amber-700 font-black">{selectedWorkerDetail.pending}</strong></span>
                        <span>Efficiency: <strong className="text-[#0a4d2c] font-black">{selectedWorkerDetail.efficiency}%</strong></span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleExportWorkerPickups(selectedWorkerDetail)}
                        className="px-3 py-1 bg-[#0a4d2c] hover:bg-emerald-800 text-white font-extrabold text-[11px] rounded-lg transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <Download className="w-3 h-3 text-emerald-300" />
                        <span>Export This List (CSV)</span>
                      </button>
                    </div>

                    {/* Pickup Requests Table */}
                    <div className="p-5 overflow-y-auto flex-1 space-y-3 custom-scrollbar">
                      <h4 className="text-xs font-black uppercase tracking-wider text-gray-500">
                        Assigned Pickup Requests ({selectedWorkerDetail.pickupsList?.length || 0} Records)
                      </h4>

                      {(!selectedWorkerDetail.pickupsList || selectedWorkerDetail.pickupsList.length === 0) ? (
                        <div className="py-12 text-center text-gray-400 text-xs">
                          No pickup requests are assigned to this worker for {months.find(m => m.value === selectedMonth)?.name} {selectedYear}.
                        </div>
                      ) : (
                        <div className="border border-emerald-100 rounded-2xl overflow-hidden shadow-2xs">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="bg-emerald-50/70 border-b border-emerald-100 text-gray-600 font-extrabold text-[11px] uppercase tracking-wider">
                                <th className="py-2.5 px-3">Request ID</th>
                                <th className="py-2.5 px-3">Household & Resident</th>
                                <th className="py-2.5 px-3">Category</th>
                                <th className="py-2.5 px-3">Scheduled Date</th>
                                <th className="py-2.5 px-3 text-center">4-Digit Code</th>
                                <th className="py-2.5 px-3 text-center">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
                              {selectedWorkerDetail.pickupsList.map(r => {
                                const c = citizensMap[r.citizenId] || {};
                                const isCompleted = (r.status || '').toLowerCase() === 'completed' || (r.status || '').toLowerCase() === 'collected';
                                const isScheduled = (r.status || '').toLowerCase() === 'scheduled' || (r.status || '').toLowerCase() === 'accepted';

                                return (
                                  <tr key={r.requestId || r.id} className="hover:bg-emerald-50/30 transition-colors">
                                    <td className="py-2.5 px-3 font-mono font-bold text-[#0a4d2c]">
                                      {r.requestId || 'REQ-ACTIVE'}
                                    </td>
                                    <td className="py-2.5 px-3">
                                      <span className="font-extrabold text-gray-900 block">{c.houseName || r.houseName || 'House'} • No: {c.houseNumber || r.houseNumber || 'N/A'}</span>
                                      <span className="text-gray-500 text-[11px]">{c.fullName || r.citizenName || r.citizenId}</span>
                                    </td>
                                    <td className="py-2.5 px-3">{r.overallCategory || 'Recyclable Plastic'}</td>
                                    <td className="py-2.5 px-3 text-gray-600 font-medium">
                                      {r.collectionDate ? new Date(r.collectionDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : 'Unscheduled'}
                                    </td>
                                    <td className="py-2.5 px-3 text-center font-mono font-black text-gray-800">
                                      {r.verificationCode ? (
                                        <span className="px-2 py-0.5 bg-gray-100 rounded-md border border-gray-200 text-gray-700">
                                          {r.verificationCode}
                                        </span>
                                      ) : '—'}
                                    </td>
                                    <td className="py-2.5 px-3 text-center">
                                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                                        isCompleted
                                          ? 'bg-emerald-100 text-[#0a4d2c]'
                                          : isScheduled
                                            ? 'bg-blue-100 text-blue-900'
                                            : 'bg-amber-100 text-amber-900'
                                      }`}>
                                        {isCompleted ? 'Completed ✓' : isScheduled ? 'Scheduled' : 'Pending'}
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

                    {/* Modal Footer */}
                    <div className="bg-gray-50 dark:bg-[#111e17] px-6 py-3.5 border-t border-gray-100 dark:border-emerald-800 flex justify-end">
                      <button
                        type="button"
                        onClick={() => setSelectedWorkerDetail(null)}
                        className="px-4 py-2 bg-gray-200 dark:bg-emerald-900 hover:bg-gray-300 text-gray-800 dark:text-emerald-100 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* REPORT 5: CITIZEN PARTICIPATION REPORT */}
          {/* ========================================================================= */}
          {activeReport === 'citizen-participation' && (
            <div className="space-y-6">
              {/* Participation KPIs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-2xs space-y-2">
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Registered Households</span>
                  <p className="text-2xl font-black text-gray-900">{participationMetrics.totalRegistered}</p>
                  <p className="text-xs text-gray-500">Verified residences in system</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-2xs space-y-2">
                  <span className="text-[11px] font-bold text-[#0a4d2c] uppercase tracking-wider">Active Monthly Participants</span>
                  <p className="text-2xl font-black text-[#0a4d2c]">{participationMetrics.activeCount}</p>
                  <p className="text-xs text-emerald-700 font-bold">{participationMetrics.participationRate}% Civic Engagement Rate</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-2xs space-y-2">
                  <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">Inactive Households</span>
                  <p className="text-2xl font-black text-amber-900">{participationMetrics.inactiveCount}</p>
                  <p className="text-xs text-amber-700">No pickup request this month</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-2xs space-y-2">
                  <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">AI Waste Analysis Adoption</span>
                  <p className="text-2xl font-black text-blue-900">{participationMetrics.aiAnalyzedCount}</p>
                  <p className="text-xs text-blue-600 font-bold">{participationMetrics.aiAdoptionRate}% Used AI Classification</p>
                </div>
              </div>

              {/* Citizen Engagement Roster */}
              <div className="bg-white rounded-3xl border border-emerald-100 shadow-2xs overflow-hidden">
                <div className="p-5 border-b border-gray-100">
                  <h3 className="text-base font-extrabold text-gray-900">
                    Citizen Household Participation Roster ({wardCitizens.length} Households)
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-emerald-50/70 border-b border-emerald-100 text-gray-600 font-extrabold text-[11px] uppercase tracking-wider">
                        <th className="py-3 px-4">House & Resident</th>
                        <th className="py-3 px-3">Citizen ID</th>
                        <th className="py-3 px-3">Ward</th>
                        <th className="py-3 px-3">Phone</th>
                        <th className="py-3 px-3">Monthly Participation</th>
                        <th className="py-3 px-3">Pickup Requests</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
                      {wardCitizens.map(c => {
                        const cId = c.citizenId || c.id;
                        const userReqs = periodRequests.filter(r => r.citizenId === cId);
                        const isParticipating = userReqs.length > 0;

                        return (
                          <tr key={cId} className="hover:bg-emerald-50/40 transition-colors">
                            <td className="py-3 px-4">
                              <span className="font-extrabold text-gray-900 block">{c.houseName || 'House'} • No: {c.houseNumber || 'N/A'}</span>
                              <span className="text-gray-500 text-[11px]">{c.fullName || 'Citizen'}</span>
                            </td>
                            <td className="py-3 px-3 font-mono text-[11px] text-gray-600">{cId}</td>
                            <td className="py-3 px-3 font-bold text-[#0a4d2c]">{c.wardId || 'W001'}</td>
                            <td className="py-3 px-3 text-gray-600">{c.phoneNumber || 'N/A'}</td>
                            <td className="py-3 px-3">
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                                isParticipating ? 'bg-emerald-100 text-[#0a4d2c]' : 'bg-gray-100 text-gray-600'
                              }`}>
                                {isParticipating ? 'Active ✓' : 'Inactive'}
                              </span>
                            </td>
                            <td className="py-3 px-3 font-bold text-gray-800">
                              {userReqs.length} {userReqs.length === 1 ? 'request' : 'requests'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminReports;
