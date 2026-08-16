import React, { useState, useEffect } from 'react';
import { Truck, CheckCircle2, Clock, AlertCircle, RefreshCw, MapPin, User, Calendar, Check } from 'lucide-react';
import { getWardPickupRequests, schedulePickupRequest, completePickupRequest } from '../../services/pickupRequestService';

const WorkerPickups = ({ wardId, workerId }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [statusFilter, setStatusFilter] = useState('All'); // 'All' | 'Pending' | 'Scheduled' | 'Completed'
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Selected date map for pending items: { [requestId]: YYYY-MM-DD }
  const [selectedDates, setSelectedDates] = useState({});

  const fetchPickups = async () => {
    if (!wardId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');

    try {
      const data = await getWardPickupRequests(wardId);
      const items = Array.isArray(data) ? data : [];
      setRequests(items);

      // Pre-fill default collection date (18th of current month) for pending requests
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const defaultDate = `${year}-${month}-18`;

      const initialDates = {};
      items.forEach(req => {
        if ((req.status || '').toLowerCase() === 'pending') {
          initialDates[req.requestId] = defaultDate;
        }
      });
      setSelectedDates(prev => ({ ...initialDates, ...prev }));
    } catch (err) {
      console.error('Error fetching ward pickup requests:', err);
      setError('Could not load pickup requests for your ward.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPickups();
  }, [wardId]);

  const handleDateChange = (requestId, dateStr) => {
    setSelectedDates(prev => ({
      ...prev,
      [requestId]: dateStr
    }));
  };

  // Worker Schedules & Accepts Request (Requirement 3: Date between 15th and 25th -> Status: Scheduled)
  const handleSchedule = async (requestId) => {
    const chosenDateStr = selectedDates[requestId];
    if (!chosenDateStr) {
      setError('Please select a collection date between 15th and 25th of the month.');
      return;
    }

    const dayNum = parseInt(chosenDateStr.split('-')[2], 10);
    if (isNaN(dayNum) || dayNum < 15 || dayNum > 25) {
      setError('Collection date must be strictly between the 15th and 25th of the month.');
      return;
    }

    setActionLoadingId(requestId);
    setError('');
    setSuccessMsg('');

    try {
      await schedulePickupRequest(requestId, workerId || 'WORKER001', chosenDateStr);
      setSuccessMsg(`Pickup Request ${requestId} scheduled for ${chosenDateStr} (Status: Scheduled)!`);
      setTimeout(() => setSuccessMsg(''), 5000);
      await fetchPickups();
    } catch (err) {
      console.error('Error scheduling pickup request:', err);
      setError(err.response?.data?.message || err.message || 'Failed to schedule pickup request.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Worker Marks Request as Collected / Completed (Requirement 4: Status: Completed)
  const handleComplete = async (requestId) => {
    setActionLoadingId(requestId);
    setError('');
    setSuccessMsg('');

    try {
      await completePickupRequest(requestId, workerId || 'WORKER001');
      setSuccessMsg(`Pickup Request ${requestId} marked as collected & completed!`);
      setTimeout(() => setSuccessMsg(''), 5000);
      await fetchPickups();
    } catch (err) {
      console.error('Error completing pickup request:', err);
      setError(err.response?.data?.message || err.message || 'Failed to mark pickup request as collected.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredRequests = requests.filter(req => {
    if (statusFilter === 'All') return true;
    return (req.status || '').toLowerCase() === statusFilter.toLowerCase();
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

  // Helper date limits for date picker (15th to 25th of current month)
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const minCollectionDate = `${year}-${month}-15`;
  const maxCollectionDate = `${year}-${month}-25`;

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fadeIn">
      {/* Top Hero Card */}
      <div className="bg-gradient-to-r from-[#0a4d2c] via-[#0f5b37] to-emerald-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-1/4 -translate-y-1/4 w-72 h-72 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-emerald-200 text-xs font-semibold mb-2">
              <Truck className="w-3.5 h-3.5 text-emerald-300" />
              <span>Ward Plastic Pickup Duty</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Plastic Waste Pickup Requests
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100/90 font-medium mt-1">
              Schedule & collect monthly doorstep plastic waste for <span className="font-extrabold text-white underline">{wardId || 'Ward 1'}</span> (Collection Window: 15th–25th).
            </p>
          </div>

          <button
            type="button"
            onClick={fetchPickups}
            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2 shrink-0"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh List</span>
          </button>
        </div>
      </div>

      {/* Success / Error Alerts */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border-l-4 border-emerald-500 text-emerald-900 text-xs font-bold rounded-2xl flex items-center gap-3 shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border-l-4 border-rose-500 text-rose-900 text-xs font-bold rounded-2xl flex items-center gap-3 shadow-xs">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-emerald-100 shadow-2xs">
        <div className="flex items-center gap-2">
          {['All', 'Pending', 'Scheduled', 'Completed'].map((tab) => {
            const isActive = statusFilter === tab;
            const count = tab === 'All'
              ? requests.length
              : requests.filter(r => {
                  const s = (r.status || '').toLowerCase();
                  if (tab === 'Scheduled') return s === 'scheduled' || s === 'accepted';
                  return s === tab.toLowerCase();
                }).length;

            return (
              <button
                key={tab}
                type="button"
                onClick={() => setStatusFilter(tab)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#0a4d2c] text-white shadow-sm'
                    : 'bg-gray-100 hover:bg-emerald-50 text-gray-700'
                }`}
              >
                {tab} ({count})
              </button>
            );
          })}
        </div>

        <span className="text-xs font-semibold text-gray-500">
          Showing {filteredRequests.length} of {requests.length} requests
        </span>
      </div>

      {/* Request Cards Grid */}
      {loading ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-emerald-100 shadow-sm space-y-3">
          <div className="w-8 h-8 border-3 border-[#0a4d2c] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-gray-500 font-medium">Loading ward plastic pickup requests...</p>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-emerald-100 shadow-sm space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-[#0a4d2c] flex items-center justify-center mx-auto">
            <Truck className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-gray-800">No Pickup Requests Found</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            There are currently no {statusFilter !== 'All' ? statusFilter.toLowerCase() : ''} plastic pickup requests for {wardId || 'your ward'}.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredRequests.map((req) => {
            const statusLower = (req.status || '').toLowerCase();
            const isPending = statusLower === 'pending';
            const isScheduled = statusLower === 'scheduled' || statusLower === 'accepted';
            const isCompleted = statusLower === 'completed' || statusLower === 'collected';
            const isActionLoading = actionLoadingId === req.requestId;
            const currentDateVal = selectedDates[req.requestId] || minCollectionDate;

            return (
              <div
                key={req.requestId || req.id}
                className="bg-white rounded-3xl p-6 border border-emerald-100 shadow-sm hover:shadow-md transition-all space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Card Header */}
                  <div className="flex items-center justify-between gap-2 border-b border-gray-100 pb-3">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
                        Request ID
                      </span>
                      <span className="text-base font-extrabold text-[#0a4d2c]">
                        {req.requestId}
                      </span>
                    </div>

                    <span className={`px-3 py-1 rounded-full text-xs font-extrabold border ${getStatusBadgeClass(req.status)}`}>
                      {isScheduled ? 'Scheduled' : req.status}
                    </span>
                  </div>

                  {/* Citizen Residence Details (Fetched dynamically from Citizen collection) */}
                  <div className="space-y-1.5 text-xs bg-gray-50/80 p-3 rounded-2xl border border-gray-200">
                    <div className="flex items-center justify-between py-0.5">
                      <span className="text-gray-500 font-medium flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-emerald-700" /> Citizen:
                      </span>
                      <span className="font-extrabold text-gray-900">{req.citizenName || req.citizenId}</span>
                    </div>

                    <div className="flex items-center justify-between py-0.5">
                      <span className="text-gray-500 font-medium">House Name / No:</span>
                      <span className="font-bold text-gray-800">
                        {req.houseName || 'House'} • No: {req.houseNumber || 'N/A'}
                      </span>
                    </div>

                    {req.address && (
                      <div className="flex items-center justify-between py-0.5">
                        <span className="text-gray-500 font-medium">Address:</span>
                        <span className="font-bold text-gray-800 truncate max-w-[200px] text-right">
                          {req.address}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center justify-between py-0.5">
                      <span className="text-gray-500 font-medium flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-emerald-700" /> Ward:
                      </span>
                      <span className="font-bold text-[#0a4d2c]">{req.wardId}</span>
                    </div>
                  </div>

                  {/* Timestamps & Scheduled Date */}
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center justify-between py-0.5">
                      <span className="text-gray-500 font-medium flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-emerald-700" /> Requested At:
                      </span>
                      <span className="font-semibold text-gray-700">
                        {req.requestedAt
                          ? new Date(req.requestedAt).toLocaleDateString('en-US', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })
                          : 'N/A'}
                      </span>
                    </div>

                    {req.collectionDate && (
                      <div className="flex items-center justify-between py-1 bg-emerald-50 px-2.5 rounded-xl border border-emerald-200">
                        <span className="text-[#0a4d2c] font-bold flex items-center gap-1 text-[11px]">
                          <Calendar className="w-3.5 h-3.5 text-[#0a4d2c]" /> Scheduled Collection:
                        </span>
                        <span className="font-extrabold text-[#0a4d2c]">
                          {new Date(req.collectionDate).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Waste Items Breakdown */}
                  <div className="bg-emerald-50/50 p-3 rounded-2xl border border-emerald-100 space-y-1.5">
                    <span className="text-[11px] font-bold text-[#0a4d2c] uppercase tracking-wider block">
                      Recyclable Plastic Items ({req.wasteItems?.length || 0})
                    </span>
                    <div className="space-y-1">
                      {req.wasteItems?.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center text-xs font-bold text-gray-800 bg-white px-3 py-1.5 rounded-xl border border-emerald-100">
                          <span>{item.type}</span>
                          <span className="px-2 py-0.5 bg-emerald-100 text-[#0a4d2c] rounded-md text-[11px]">
                            Qty: {item.quantity}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Worker Actions */}
                <div className="pt-3 border-t border-gray-100 space-y-3">
                  {isPending && (
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-gray-700 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-[#0a4d2c]" />
                        Select Collection Date (15th–25th Window):
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="date"
                          min={minCollectionDate}
                          max={maxCollectionDate}
                          value={currentDateVal}
                          onChange={(e) => handleDateChange(req.requestId, e.target.value)}
                          className="flex-1 bg-white border border-gray-300 rounded-xl p-2 text-xs font-extrabold text-[#0a4d2c] focus:outline-none focus:border-[#0a4d2c]"
                        />

                        <button
                          type="button"
                          onClick={() => handleSchedule(req.requestId)}
                          disabled={isActionLoading}
                          className="px-4 py-2.5 bg-[#0a4d2c] hover:bg-emerald-800 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
                        >
                          {isActionLoading ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <>
                              <Check className="w-4 h-4 text-emerald-300" />
                              <span>Schedule & Accept</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {isScheduled && (
                    <button
                      type="button"
                      onClick={() => handleComplete(req.requestId)}
                      disabled={isActionLoading}
                      className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {isActionLoading ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-blue-200" />
                          <span>Mark as Collected</span>
                        </>
                      )}
                    </button>
                  )}

                  {isCompleted && (
                    <div className="w-full py-2 text-center text-xs font-bold text-blue-800 bg-blue-50 rounded-xl border border-blue-200 flex items-center justify-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-blue-600" />
                      <span>Collected & Completed</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default WorkerPickups;
