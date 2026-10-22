import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Home,
  Truck,
  Phone,
  Navigation,
  Compass,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Radio,
  Layers,
  Sparkles,
  Zap,
  Lock,
  AlertCircle,
  Calendar,
  ShieldCheck,
  XCircle,
  CalendarCheck,
  CalendarClock,
  ArrowRight,
  MessageSquare,
  KeyRound,
  RotateCcw,
  Check
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Polygon, Tooltip, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getLiveWorkerByWard, calculateHaversineDistance } from '../services/workerService';
import { getAllWards } from '../services/citizenService';
import { formatPickupDate } from '../services/pickupRequestService';

// Fix Leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom Leaflet Icons using SVG DivIcons
const createHouseIcon = () =>
  L.divIcon({
    className: 'custom-house-icon',
    html: `
      <div style="
        background: #059669;
        color: white;
        width: 38px;
        height: 38px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 12px rgba(5,150,105,0.5);
        border: 3px solid white;
      ">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
      </div>
    `,
    iconSize: [38, 38],
    iconAnchor: [19, 19],
  });

const createWorkerIcon = (isOnDuty) =>
  L.divIcon({
    className: 'custom-worker-icon',
    html: `
      <div style="position: relative;">
        ${isOnDuty ? `
          <div style="
            position: absolute;
            inset: -8px;
            border-radius: 50%;
            background: rgba(16, 185, 129, 0.35);
            animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
          "></div>
        ` : ''}
        <div style="
          background: ${isOnDuty ? '#047857' : '#6b7280'};
          color: white;
          width: 44px;
          height: 44px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 6px 16px rgba(4,120,87,0.5);
          border: 3px solid white;
          position: relative;
          z-index: 10;
        ">
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/>
            <path d="M15 18H9"/>
            <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/>
            <circle cx="17" cy="18" r="2"/>
            <circle cx="7" cy="18" r="2"/>
          </svg>
        </div>
      </div>
    `,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
  });

function MapPanController({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.setView(center, zoom, { animate: true });
    }
  }, [center, zoom, map]);
  return null;
}

const DEFAULT_COORDS = [9.5583, 76.7842]; // Ponkunnam, Kerala

const toLocalDateOnlyStr = (dateInput) => {
  if (!dateInput) return '';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const parseDateOnly = (dateInput) => {
  if (!dateInput) return null;
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return null;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
};

const CitizenLiveWorkerTracker = ({
  citizenData = {},
  assignedWorker = null,
  activePickupRequest = null,
  setActiveTab
}) => {
  const userObj = JSON.parse(localStorage.getItem('user') || '{}');
  const wardId = citizenData?.wardId || userObj.wardId || 'Ward 1';
  const citizenName = citizenData?.fullName || userObj.fullName || 'Citizen';
  const houseNo = citizenData?.houseNumber || userObj.houseNumber || 'Not Set';
  const citizenId = citizenData?.citizenId || citizenData?.id || userObj.citizenId;
  const requestId = activePickupRequest?.requestId || activePickupRequest?.id;

  const rawLat = parseFloat(citizenData?.latitude || userObj.latitude);
  const rawLng = parseFloat(citizenData?.longitude || userObj.longitude);
  const hasCitizenCoords = !isNaN(rawLat) && !isNaN(rawLng) && rawLat !== 0;

  const citizenLat = hasCitizenCoords ? rawLat : DEFAULT_COORDS[0];
  const citizenLng = hasCitizenCoords ? rawLng : DEFAULT_COORDS[1];
  const citizenPos = [citizenLat, citizenLng];

  const [liveWorker, setLiveWorker] = useState(null);
  const [wardPolygon, setWardPolygon] = useState(null);
  const [mapCenter, setMapCenter] = useState(citizenPos);
  const [mapZoom, setMapZoom] = useState(16);
  const [lastRefreshedAt, setLastRefreshedAt] = useState(null);

  // Status & Date Analysis
  const rawStatus = (activePickupRequest?.status || activePickupRequest?.rawStatus || '').toLowerCase();
  const isCancelled = rawStatus === 'cancelled' || activePickupRequest?.isCancelled === true || liveWorker?.isCancelled === true;
  const isCompleted = rawStatus === 'completed' || rawStatus === 'collected' || Boolean(activePickupRequest?.isCompleted) || liveWorker?.isCompleted === true;

  // Resolving scheduled date (following rescheduling if updated)
  const scheduledDateRaw = activePickupRequest?.scheduledDate || activePickupRequest?.collectionDate || liveWorker?.scheduledDate;
  const isRescheduled = Boolean(
    activePickupRequest?.isApprovedForReschedule ||
    activePickupRequest?.dueStatus === 'Approved for Reschedule' ||
    (activePickupRequest?.dueReason && activePickupRequest?.dueReason.trim().length > 0) ||
    liveWorker?.isRescheduled
  );

  const today = new Date();
  const todayStr = toLocalDateOnlyStr(today);
  const todayDateOnly = parseDateOnly(today);

  const scheduledDateStr = toLocalDateOnlyStr(scheduledDateRaw);
  const scheduledDateOnly = parseDateOnly(scheduledDateRaw);
  const hasScheduledDate = Boolean(scheduledDateRaw && scheduledDateStr);

  const isToday = Boolean(hasScheduledDate && todayStr === scheduledDateStr);
  const isBeforeScheduledDate = Boolean(hasScheduledDate && scheduledDateOnly && todayDateOnly && scheduledDateOnly > todayDateOnly);
  const isAfterScheduledDate = Boolean(hasScheduledDate && scheduledDateOnly && todayDateOnly && scheduledDateOnly < todayDateOnly);

  // Citizen can view worker live location strictly only on the scheduled pickup date
  const canViewLiveLocation = Boolean(
    hasScheduledDate &&
    isToday &&
    !isCancelled &&
    !isCompleted &&
    liveWorker?.isTrackingAllowed !== false
  );

  // Formatted date string for display
  const formattedScheduledDate = scheduledDateRaw
    ? formatPickupDate(scheduledDateRaw, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    : '';

  // Load ward polygon boundary
  useEffect(() => {
    const fetchWard = async () => {
      try {
        const wards = await getAllWards();
        if (Array.isArray(wards)) {
          const matched = wards.find(
            (w) =>
              (w.wardId && w.wardId.toLowerCase() === wardId.toLowerCase()) ||
              (w.wardName && w.wardName.toLowerCase() === wardId.toLowerCase())
          );
          if (matched && matched.boundary && matched.boundary.length >= 3) {
            setWardPolygon(matched.boundary);
          } else {
            // Default boundary box around citizen
            setWardPolygon([
              [citizenLat + 0.007, citizenLng - 0.007],
              [citizenLat + 0.007, citizenLng + 0.007],
              [citizenLat - 0.007, citizenLng + 0.007],
              [citizenLat - 0.007, citizenLng - 0.007],
            ]);
          }
        }
      } catch (e) {
        console.warn('Could not load ward boundary:', e);
      }
    };
    fetchWard();
  }, [wardId, citizenLat, citizenLng]);

  // Fetch live worker state from API
  const loadWorkerState = async () => {
    try {
      const data = await getLiveWorkerByWard(wardId, citizenId, requestId);
      if (data && data.isTrackingAllowed !== false && data.isOnDuty) {
        setLiveWorker(data);
      } else if (data) {
        // Tracking not allowed or off duty - suppress coordinates
        setLiveWorker({
          ...data,
          isOnDuty: false,
          latitude: null,
          longitude: null,
          currentLatitude: null,
          currentLongitude: null
        });
      } else if (assignedWorker && isToday && !isCancelled && !isCompleted) {
        // Fallback assigned worker for today
        const isAssignedActive = Boolean(assignedWorker.isOnDuty);
        setLiveWorker({
          fullName: assignedWorker.fullName || assignedWorker.name || 'Haritha Karma Sena Worker',
          phoneNumber: assignedWorker.phoneNumber || assignedWorker.phone || '9847123456',
          wardId: wardId,
          isOnDuty: isAssignedActive,
          latitude: isAssignedActive ? (assignedWorker.latitude || assignedWorker.currentLatitude || null) : null,
          longitude: isAssignedActive ? (assignedWorker.longitude || assignedWorker.currentLongitude || null) : null,
        });
      } else {
        setLiveWorker(null);
      }
      setLastRefreshedAt(new Date().toLocaleTimeString());
    } catch (err) {
      console.warn('Live worker load error:', err);
    }
  };

  useEffect(() => {
    loadWorkerState();

    // Listen for real-time broadcasts
    const handleBroadcast = (e) => {
      if (e.detail) {
        // Strictly enforce gating: live GPS is only applied if today is the scheduled pickup date and not cancelled/completed
        if (!isToday || isCancelled || isCompleted) {
          return;
        }

        const isDuty = Boolean(e.detail.isOnDuty);
        setLiveWorker((prev) => ({
          ...(prev || {}),
          ...e.detail,
          isOnDuty: isDuty,
          latitude: isDuty ? (e.detail.latitude ?? e.detail.currentLatitude) : null,
          longitude: isDuty ? (e.detail.longitude ?? e.detail.currentLongitude) : null,
        }));
        setLastRefreshedAt(new Date().toLocaleTimeString());
      }
    };

    window.addEventListener('ecomind_worker_location_update', handleBroadcast);
    const interval = setInterval(loadWorkerState, 15000); // Poll every 15s

    return () => {
      window.removeEventListener('ecomind_worker_location_update', handleBroadcast);
      clearInterval(interval);
    };
  }, [wardId, citizenId, requestId, isToday, isCancelled, isCompleted]);

  // Worker coordinates - strictly only when active, on duty, and canViewLiveLocation is true
  const isOnDuty = Boolean(canViewLiveLocation && liveWorker?.isOnDuty);
  const parsedWorkerLat = parseFloat(liveWorker?.latitude ?? liveWorker?.currentLatitude);
  const parsedWorkerLng = parseFloat(liveWorker?.longitude ?? liveWorker?.currentLongitude);
  const hasValidWorkerCoords =
    isOnDuty &&
    canViewLiveLocation &&
    !isNaN(parsedWorkerLat) &&
    !isNaN(parsedWorkerLng) &&
    parsedWorkerLat !== 0 &&
    parsedWorkerLng !== 0;

  const workerPos = hasValidWorkerCoords ? [parsedWorkerLat, parsedWorkerLng] : null;

  // Proximity calculation - only calculate if worker is active with valid coordinates
  const distanceInfo = hasValidWorkerCoords
    ? calculateHaversineDistance(citizenLat, citizenLng, parsedWorkerLat, parsedWorkerLng)
    : null;
  const isApproaching = Boolean(isOnDuty && distanceInfo && distanceInfo.meters <= 150);

  // 1. GATED STATE: No pickup request at all
  if (!activePickupRequest) {
    return (
      <div className="space-y-6 animate-fadeIn pb-12">
        <div className="bg-gradient-to-r from-[#0a4d2c] via-[#0f5b37] to-emerald-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-emerald-200 text-xs font-semibold">
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              <span>Doorstep Collection Tracking</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Live Doorstep Collection Tracker
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100/90 font-medium max-w-xl">
              Live GPS tracking is strictly active for households with confirmed collection drives in {wardId}.
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-[#121e17] rounded-3xl p-8 sm:p-12 shadow-xs border border-emerald-100/80 dark:border-emerald-950/40 text-center space-y-6 max-w-2xl mx-auto">
          <div className="w-20 h-20 rounded-3xl bg-emerald-50 dark:bg-[#193325] text-[#0a4d2c] dark:text-emerald-400 flex items-center justify-center mx-auto shadow-xs border border-emerald-100 dark:border-emerald-800/40">
            <Truck className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 dark:bg-[#20180e] text-amber-800 dark:text-amber-300 text-xs font-bold">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>No Active Pickup Request</span>
            </span>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">
              Live Tracking Is Inactive
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
              Vehicle GPS navigation and doorstep alerts are enabled only on the confirmed pickup date of an active request.
            </p>
          </div>

          <div className="p-4.5 rounded-2xl bg-emerald-50/60 dark:bg-[#15271d] border border-emerald-100 dark:border-emerald-800/40 text-left space-y-2.5 text-xs">
            <div className="font-extrabold text-[#0a4d2c] dark:text-emerald-300 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>How Worker Tracking Works:</span>
            </div>
            <ul className="text-slate-600 dark:text-slate-300 space-y-1.5 list-disc list-inside">
              <li>Submit your household recyclable waste pickup request.</li>
              <li>Your assigned worker confirms the scheduled pickup date (20th–25th collection window).</li>
              <li>On your scheduled date, live vehicle tracking turns on with proximity alerts.</li>
            </ul>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            {setActiveTab && (
              <>
                <button
                  type="button"
                  onClick={() => setActiveTab('Pickup Request')}
                  className="w-full sm:w-auto px-6 py-3.5 bg-[#0a4d2c] hover:bg-emerald-900 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Truck className="w-4 h-4 text-emerald-300" />
                  <span>Submit Pickup Request</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('Collection Schedule')}
                  className="w-full sm:w-auto px-5 py-3.5 bg-emerald-50 dark:bg-[#1a3325] text-[#0a4d2c] dark:text-emerald-300 font-extrabold text-xs rounded-xl hover:bg-emerald-100 transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Calendar className="w-4 h-4" />
                  <span>View Ward Schedule</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 2. GATED STATE: Pickup Request Cancelled (Disable tracking)
  if (isCancelled) {
    return (
      <div className="space-y-6 animate-fadeIn pb-12">
        <div className="bg-gradient-to-r from-rose-900 via-rose-950 to-slate-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-400/30 text-rose-200 text-xs font-semibold">
              <XCircle className="w-3.5 h-3.5 text-rose-400" />
              <span>Tracking Disabled • Pickup Cancelled</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Live Tracking Disabled
            </h1>
            <p className="text-xs sm:text-sm text-rose-200 font-medium max-w-xl">
              Pickup request #{activePickupRequest.requestId || activePickupRequest.id} was cancelled. Live worker GPS location tracking is disabled.
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-[#181112] rounded-3xl p-8 sm:p-12 shadow-xs border border-rose-100 dark:border-rose-950/40 text-center space-y-6 max-w-2xl mx-auto">
          <div className="w-20 h-20 rounded-3xl bg-rose-50 dark:bg-[#2b1719] text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto shadow-xs border border-rose-200 dark:border-rose-800/40">
            <XCircle className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 dark:bg-[#341b1d] text-rose-800 dark:text-rose-300 text-xs font-bold">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Request Cancelled</span>
            </span>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">
              Worker Tracking Closed
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
              Because this pickup was cancelled, live vehicle GPS mapping is permanently turned off. Submit a new collection request when you are ready to dispose of dry plastic waste.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            {setActiveTab && (
              <>
                <button
                  type="button"
                  onClick={() => setActiveTab('Pickup Request')}
                  className="w-full sm:w-auto px-6 py-3.5 bg-[#0a4d2c] hover:bg-emerald-900 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4 text-emerald-300" />
                  <span>Request New Pickup</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('Dashboard')}
                  className="w-full sm:w-auto px-5 py-3.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-extrabold text-xs rounded-xl hover:bg-gray-200 transition cursor-pointer"
                >
                  <span>Return to Dashboard</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 3. GATED STATE: Pickup Request Completed (Disable tracking)
  if (isCompleted) {
    return (
      <div className="space-y-6 animate-fadeIn pb-12">
        <div className="bg-gradient-to-r from-[#0a4d2c] via-[#0f5b37] to-emerald-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 text-xs font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Collection Completed • Tracking Closed</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Waste Collection Completed
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100/90 font-medium max-w-xl">
              Plastic waste collection for Request #{activePickupRequest.requestId || activePickupRequest.id} has been verified and completed.
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-[#121e17] rounded-3xl p-8 sm:p-12 shadow-xs border border-emerald-100/80 dark:border-emerald-950/40 text-center space-y-6 max-w-2xl mx-auto">
          <div className="w-20 h-20 rounded-3xl bg-emerald-50 dark:bg-[#193325] text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-xs border border-emerald-100 dark:border-emerald-800/40">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 dark:bg-[#172e21] text-emerald-800 dark:text-emerald-300 text-xs font-bold">
              <Check className="w-3.5 h-3.5" />
              <span>Doorstep Pickup Finished</span>
            </span>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">
              Live Tracking Has Concluded
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
              Your non-biodegradable waste has been collected and recorded by the Haritha Karma Sena team. Live vehicle GPS tracking is closed for completed pickups.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-[#15271d] border border-emerald-100 dark:border-emerald-800/40 flex flex-col sm:flex-row items-center justify-around gap-4 text-xs font-semibold">
            <div className="text-left">
              <span className="text-gray-500 dark:text-gray-400 block text-[11px]">Waste Category</span>
              <span className="font-extrabold text-gray-900 dark:text-white">
                {activePickupRequest.overallCategory || activePickupRequest.category || 'Recyclable Plastic'}
              </span>
            </div>
            <div className="text-left">
              <span className="text-gray-500 dark:text-gray-400 block text-[11px]">Handover Verification</span>
              <span className="font-extrabold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Verified by Worker
              </span>
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            {setActiveTab && (
              <>
                <button
                  type="button"
                  onClick={() => setActiveTab('Collection Records')}
                  className="w-full sm:w-auto px-6 py-3.5 bg-[#0a4d2c] hover:bg-emerald-900 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>View Collection Records</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('Monthly Payments')}
                  className="w-full sm:w-auto px-5 py-3.5 bg-emerald-50 dark:bg-[#1a3325] text-[#0a4d2c] dark:text-emerald-300 font-extrabold text-xs rounded-xl hover:bg-emerald-100 transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <span>Monthly Payments</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 4. GATED STATE: Scheduled date is in the FUTURE (Before the scheduled date)
  // Requirement: "Before that date, hide the live tracking map and show the scheduled date. If the pickup is rescheduled, follow the updated date."
  if (hasScheduledDate && isBeforeScheduledDate) {
    return (
      <div className="space-y-6 animate-fadeIn pb-12">
        {/* Hero Header with Scheduled Date Badge */}
        <div className="bg-gradient-to-r from-[#0a4d2c] via-[#0f5b37] to-emerald-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-1/4 -translate-y-1/4 w-72 h-72 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-emerald-200 text-xs font-semibold">
                <CalendarClock className="w-3.5 h-3.5 text-emerald-400" />
                <span>
                  {isRescheduled ? 'Rescheduled Collection' : 'Upcoming Scheduled Collection'} • {wardId}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Live Tracking Opens on Pickup Date
              </h1>

              <p className="text-xs sm:text-sm text-emerald-100/90 font-medium max-w-xl">
                Worker vehicle live GPS tracking and doorstep arrival notifications will activate on your confirmed collection date.
              </p>
            </div>

            {/* Top Quick Scheduled Date Pill */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
              <div className="p-3.5 rounded-2xl bg-white/10 border border-white/20 text-white flex items-center gap-3 shadow-md">
                <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <CalendarCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] font-black uppercase tracking-wider text-emerald-300">
                    {isRescheduled ? 'Updated Pickup Date' : 'Confirmed Date'}
                  </div>
                  <p className="text-xs font-extrabold mt-0.5">
                    {formattedScheduledDate}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* PROMINENT SCHEDULED DATE CARD (Map is HIDDEN) */}
        <div className="bg-white dark:bg-[#121e17] rounded-3xl p-6 sm:p-10 shadow-sm border border-emerald-100/80 dark:border-white/5 space-y-8 max-w-3xl mx-auto">
          {/* Spotlight Date Display */}
          <div className="text-center space-y-3">
            <div className="w-20 h-20 rounded-3xl bg-emerald-50 dark:bg-[#1a3325] text-[#0a4d2c] dark:text-emerald-400 flex items-center justify-center mx-auto shadow-xs border border-emerald-200 dark:border-emerald-800/40">
              <Calendar className="w-10 h-10" />
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-[#0a4d2c] dark:text-emerald-300 text-xs font-black uppercase tracking-wider">
              {isRescheduled ? (
                <>
                  <RotateCcw className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span>Rescheduled to Updated Date</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Pickup Date Scheduled</span>
                </>
              )}
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">
              Scheduled Pickup Date:
            </h2>

            <div className="text-xl sm:text-2xl font-black text-[#0a4d2c] dark:text-emerald-400 bg-emerald-50/80 dark:bg-[#152a1e] py-3 px-6 rounded-2xl inline-block border border-emerald-200 dark:border-emerald-800/40 shadow-xs">
              {formattedScheduledDate}
            </div>

            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 max-w-lg mx-auto leading-relaxed pt-1">
              On <strong className="text-gray-900 dark:text-white">{formattedScheduledDate}</strong>, the live vehicle tracking map will automatically appear here with real-time distance and 150m doorstep arrival alerts.
            </p>
          </div>

          {/* Reschedule Notification Notice if updated */}
          {isRescheduled && (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 flex items-start gap-3 text-xs">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-extrabold text-amber-900 dark:text-amber-300">
                  Rescheduled Collection Drive
                </span>
                <p className="text-amber-800 dark:text-amber-400">
                  This pickup was rescheduled. The live tracking system has been synchronized to follow the updated date ({formattedScheduledDate}).
                </p>
              </div>
            </div>
          )}

          {/* Information Grid: Hours, Household, Worker */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {/* Card 1: Collection Hours */}
            <div className="p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 space-y-2">
              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider text-[11px]">
                <Clock className="w-4 h-4 text-emerald-600" />
                <span>Collection Hours</span>
              </div>
              <p className="text-sm font-extrabold text-gray-900 dark:text-white">
                8:30 AM – 1:30 PM
              </p>
              <p className="text-gray-500 dark:text-gray-400 text-[11px]">
                Please keep clean, dry plastic waste bags ready at your gate during collection hours.
              </p>
            </div>

            {/* Card 2: Assigned Worker */}
            <div className="p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 space-y-2">
              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider text-[11px]">
                <Truck className="w-4 h-4 text-emerald-600" />
                <span>Assigned Field Worker</span>
              </div>
              <p className="text-sm font-extrabold text-gray-900 dark:text-white truncate">
                {assignedWorker?.fullName || liveWorker?.fullName || 'Haritha Karma Sena Unit'}
              </p>
              {(assignedWorker?.phoneNumber || liveWorker?.phoneNumber) && (
                <a
                  href={`tel:${assignedWorker?.phoneNumber || liveWorker?.phoneNumber}`}
                  className="inline-flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-bold hover:underline text-[11px]"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Call Worker ({assignedWorker?.phoneNumber || liveWorker?.phoneNumber})</span>
                </a>
              )}
            </div>

            {/* Card 3: Residence Details */}
            <div className="p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 space-y-2">
              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider text-[11px]">
                <Home className="w-4 h-4 text-emerald-600" />
                <span>Collection Address</span>
              </div>
              <p className="text-sm font-extrabold text-gray-900 dark:text-white">
                House #{houseNo} • {wardId}
              </p>
              <p className="text-gray-500 dark:text-gray-400 text-[11px]">
                {citizenName}
              </p>
            </div>

            {/* Card 4: Verification Code */}
            {activePickupRequest.verificationCode && (
              <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-[#152a1e] border border-emerald-100 dark:border-emerald-800/40 space-y-2">
                <div className="flex items-center gap-2 text-[#0a4d2c] dark:text-emerald-300 font-bold uppercase tracking-wider text-[11px]">
                  <KeyRound className="w-4 h-4" />
                  <span>Pickup Verification Code</span>
                </div>
                <div className="text-xl font-black font-mono tracking-widest text-[#0a4d2c] dark:text-emerald-300">
                  {activePickupRequest.verificationCode}
                </div>
                <p className="text-emerald-800 dark:text-emerald-400 text-[11px]">
                  Provide this 4-digit code to the collection worker upon plastic handover.
                </p>
              </div>
            )}
          </div>

          {/* Privacy & Gating Explanation */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#14231a] border border-slate-200/80 dark:border-emerald-950/40 text-xs text-slate-600 dark:text-slate-300 flex items-start gap-3">
            <Lock className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold text-slate-800 dark:text-slate-200">
                Scheduled-Date Only Tracking Policy
              </span>
              <p className="leading-relaxed">
                Live vehicle GPS tracking is automatically enabled on the confirmed collection date. Before that date, vehicle navigation is kept private to conserve device power and protect field worker privacy.
              </p>
            </div>
          </div>

          {/* Action Navigation Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            {setActiveTab && (
              <>
                <button
                  type="button"
                  onClick={() => setActiveTab('Collection Schedule')}
                  className="w-full sm:w-auto px-6 py-3.5 bg-[#0a4d2c] hover:bg-emerald-900 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Calendar className="w-4 h-4 text-emerald-300" />
                  <span>View Collection Schedule</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('Messages')}
                  className="w-full sm:w-auto px-5 py-3.5 bg-emerald-50 dark:bg-[#1a3325] text-[#0a4d2c] dark:text-emerald-300 font-extrabold text-xs rounded-xl hover:bg-emerald-100 transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Message Assigned Worker</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('Dashboard')}
                  className="w-full sm:w-auto px-5 py-3.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-extrabold text-xs rounded-xl hover:bg-gray-200 transition cursor-pointer"
                >
                  <span>Dashboard</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 5. GATED STATE: Scheduled date has passed without collection (Missed / Review)
  if (hasScheduledDate && isAfterScheduledDate) {
    return (
      <div className="space-y-6 animate-fadeIn pb-12">
        <div className="bg-gradient-to-r from-amber-700 via-amber-800 to-amber-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-200 text-xs font-semibold">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span>Scheduled Date Passed • Missed Pickup Review</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Scheduled Collection Date Passed
            </h1>
            <p className="text-xs sm:text-sm text-amber-100 font-medium max-w-xl">
              The scheduled pickup date was {formattedScheduledDate}. Live vehicle tracking is closed until the request is rescheduled.
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-[#1f1911] rounded-3xl p-8 sm:p-12 shadow-xs border border-amber-200 dark:border-amber-950/40 text-center space-y-6 max-w-2xl mx-auto">
          <div className="w-20 h-20 rounded-3xl bg-amber-50 dark:bg-[#2c2214] text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto shadow-xs border border-amber-200 dark:border-amber-800/40">
            <CalendarClock className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 dark:bg-[#382b17] text-amber-800 dark:text-amber-300 text-xs font-bold">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Past Scheduled Date</span>
            </span>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">
              Live Tracking Inactive
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
              Your scheduled pickup date ({formattedScheduledDate}) has passed. Once this pickup is reviewed and rescheduled by your worker and panchayat admin, live tracking will follow the new updated date.
            </p>
          </div>

          {activePickupRequest.dueReason && (
            <div className="p-4 rounded-2xl bg-amber-50/80 dark:bg-[#281e13] border border-amber-200 text-left text-xs space-y-1">
              <span className="font-extrabold text-amber-900 dark:text-amber-300">
                Worker Submitted Reason:
              </span>
              <p className="text-amber-800 dark:text-amber-400 italic">
                "{activePickupRequest.dueReason}"
              </p>
            </div>
          )}

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            {setActiveTab && (
              <>
                <button
                  type="button"
                  onClick={() => setActiveTab('Collection Schedule')}
                  className="w-full sm:w-auto px-6 py-3.5 bg-[#0a4d2c] hover:bg-emerald-900 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Calendar className="w-4 h-4 text-emerald-300" />
                  <span>View Schedule Details</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('Messages')}
                  className="w-full sm:w-auto px-5 py-3.5 bg-amber-50 dark:bg-[#2a1e12] text-amber-900 dark:text-amber-300 font-extrabold text-xs rounded-xl hover:bg-amber-100 transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Message Worker</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 6. GATED STATE: Pickup request has no scheduled date yet (Pending assignment)
  if (!hasScheduledDate) {
    return (
      <div className="space-y-6 animate-fadeIn pb-12">
        <div className="bg-gradient-to-r from-[#0a4d2c] via-[#0f5b37] to-emerald-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-emerald-200 text-xs font-semibold">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              <span>Awaiting Date Scheduling</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Pickup Date Pending
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100/90 font-medium max-w-xl">
              Your pickup request has been received. Your assigned Haritha Karma Sena worker is confirming the collection date.
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-[#121e17] rounded-3xl p-8 sm:p-12 shadow-xs border border-emerald-100/80 dark:border-emerald-950/40 text-center space-y-6 max-w-2xl mx-auto">
          <div className="w-20 h-20 rounded-3xl bg-emerald-50 dark:bg-[#193325] text-[#0a4d2c] dark:text-emerald-400 flex items-center justify-center mx-auto shadow-xs border border-emerald-100 dark:border-emerald-800/40">
            <Clock className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 dark:bg-[#15271d] text-[#0a4d2c] dark:text-emerald-300 text-xs font-bold">
              <span>Request Received</span>
            </span>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">
              Awaiting Worker Schedule Confirmation
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
              Ward collection dates are assigned within the 20th–25th monthly window. As soon as your worker confirms your pickup date, live vehicle tracking will be scheduled to unlock on that day.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            {setActiveTab && (
              <>
                <button
                  type="button"
                  onClick={() => setActiveTab('Collection Schedule')}
                  className="w-full sm:w-auto px-6 py-3.5 bg-[#0a4d2c] hover:bg-emerald-900 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Calendar className="w-4 h-4 text-emerald-300" />
                  <span>View Ward Schedule</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('Dashboard')}
                  className="w-full sm:w-auto px-5 py-3.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-extrabold text-xs rounded-xl hover:bg-gray-200 transition cursor-pointer"
                >
                  <span>Dashboard</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 7. ACTIVE TRACKING STATE: Today IS the scheduled pickup date!
  // Requirement: "citizens can view the worker's live location only on the scheduled pickup date."
  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-[#0a4d2c] via-[#0f5b37] to-emerald-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-1/4 -translate-y-1/4 w-72 h-72 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-emerald-200 text-xs font-semibold">
              <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span>Haritha Karma Sena Field GPS Tracker • Active Today</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Live Doorstep Collection Tracker
            </h1>

            <p className="text-xs sm:text-sm text-emerald-100/90 font-medium max-w-xl">
              Track your assigned Haritha Karma Sena waste collection vehicle live as it moves through {wardId}.
            </p>

            {activePickupRequest && (
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/25 border border-emerald-400/40 text-emerald-200 text-xs font-bold mt-1">
                <span>Active Pickup: #{activePickupRequest.id || activePickupRequest.requestId}</span>
                <span>•</span>
                <span>Today's Collection: {formattedScheduledDate || 'Today'}</span>
                {isRescheduled && (
                  <span className="ml-1 px-2 py-0.5 rounded-full bg-amber-400 text-slate-900 text-[10px] font-black">
                    Rescheduled
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Top Quick Status Pill */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <div className={`p-3.5 rounded-2xl border flex items-center gap-3 shadow-md ${
              isOnDuty
                ? 'bg-emerald-500/20 border-emerald-400/40 text-white'
                : 'bg-white/10 border-white/20 text-emerald-200'
            }`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                isOnDuty ? 'bg-emerald-500 text-white shadow-sm' : 'bg-white/15 text-white'
              }`}>
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${isOnDuty ? 'bg-emerald-400 animate-ping' : 'bg-gray-400'}`} />
                  <span className="text-[11px] font-black uppercase tracking-wider">
                    {isOnDuty ? 'Worker On Duty' : 'Worker Off Duty'}
                  </span>
                </div>
                <p className="text-xs font-bold mt-0.5">
                  {isOnDuty && distanceInfo
                    ? `${distanceInfo.meters}m Away (~${distanceInfo.walkingMinutes} mins)`
                    : 'Location Hidden (Inactive)'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Approaching Doorstep Notification Alert Banner */}
      {isApproaching && (
        <div className="p-4 sm:p-5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 rounded-2xl text-white shadow-lg flex items-center justify-between gap-4 animate-bounce">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0 backdrop-blur-xs">
              <Zap className="w-6 h-6 text-yellow-200 animate-pulse" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/25">
                Doorstep Alert
              </span>
              <h3 className="text-sm sm:text-base font-extrabold mt-0.5">
                Haritha Karma Sena is approaching your street ({distanceInfo?.meters}m away)!
              </h3>
              <p className="text-xs text-amber-100 font-medium">
                Please have your clean, dry segregated plastic bag ready at your gate.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Info & Proximity HUD Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Worker Details */}
        <div className="bg-white dark:bg-[#121e17] p-5 rounded-2xl shadow-xs border border-emerald-100/80 dark:border-white/5 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-gray-500">
            <span className="uppercase tracking-wider">Assigned Worker</span>
            <span className={`px-2 py-0.5 rounded-full font-extrabold text-[10px] ${
              isOnDuty
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
            }`}>
              {isOnDuty ? 'Active' : 'Off Duty'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-full text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0 ${
              isOnDuty ? 'bg-[#0a4d2c]' : 'bg-gray-500'
            }`}>
              {liveWorker?.fullName ? liveWorker.fullName[0].toUpperCase() : 'H'}
            </div>
            <div className="min-w-0">
              <h4 className="text-sm font-extrabold text-gray-900 dark:text-white truncate">
                {liveWorker?.fullName || assignedWorker?.fullName || 'Haritha Sena Team'}
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {isOnDuty ? 'Doorstep Plastic Collector • Active Shift' : 'Doorstep Plastic Collector • Off Duty'}
              </p>
            </div>
          </div>

          {(liveWorker?.phoneNumber || assignedWorker?.phoneNumber) && (
            <a
              href={`tel:${liveWorker?.phoneNumber || assignedWorker?.phoneNumber}`}
              className="w-full py-2 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 text-[#0a4d2c] dark:text-emerald-300 font-bold text-xs flex items-center justify-center gap-2 transition-all"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Call Worker ({liveWorker?.phoneNumber || assignedWorker?.phoneNumber})</span>
            </a>
          )}
        </div>

        {/* Card 2: Proximity Distance */}
        <div className="bg-white dark:bg-[#121e17] p-5 rounded-2xl shadow-xs border border-emerald-100/80 dark:border-white/5 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-gray-500">
            <span className="uppercase tracking-wider">Estimated Distance</span>
            <span className={`px-2 py-0.5 rounded-full font-extrabold text-[10px] ${
              isOnDuty && distanceInfo
                ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
            }`}>
              {isOnDuty && distanceInfo ? 'Haversine GIS' : 'Inactive'}
            </span>
          </div>

          <div>
            <div className="text-2xl font-black text-gray-900 dark:text-white">
              {isOnDuty && distanceInfo ? `${distanceInfo.meters} Meters` : 'Location Offline'}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {isOnDuty && distanceInfo
                ? `Approx. ${distanceInfo.walkingMinutes} mins walking pace`
                : 'Worker is currently off duty. Location is hidden until active shift begins.'}
            </p>
          </div>

          <div className="pt-1 flex items-center gap-1.5 text-[11px] text-gray-500 dark:text-gray-400">
            <Home className="w-3.5 h-3.5 text-emerald-600" />
            <span className="truncate">House: {houseNo} ({citizenName})</span>
          </div>
        </div>

        {/* Card 3: Collection Hours & Schedule */}
        <div className="bg-white dark:bg-[#121e17] p-5 rounded-2xl shadow-xs border border-emerald-100/80 dark:border-white/5 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-gray-500">
            <span className="uppercase tracking-wider">Ward Schedule</span>
            <span className="px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 font-extrabold text-[10px]">
              20th–25th Window
            </span>
          </div>

          <div>
            <div className="text-sm font-extrabold text-gray-900 dark:text-white flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-emerald-600" />
              <span>8:30 AM – 1:30 PM (Collection Hours)</span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Monthly clean recyclable plastic handover cycle.
            </p>
          </div>

          {lastRefreshedAt && (
            <div className="text-[11px] text-gray-400 flex items-center justify-between pt-1">
              <span>Auto-refreshing live GPS</span>
              <span>Updated: {lastRefreshedAt}</span>
            </div>
          )}
        </div>
      </div>

      {/* Interactive Leaflet Map Canvas */}
      <div className="bg-white dark:bg-[#121e17] p-5 rounded-3xl shadow-sm border border-emerald-100/80 dark:border-white/5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
              <Navigation className="w-5 h-5 text-emerald-600" />
              <span>Ward GIS Live Map</span>
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Visualizes Haritha Karma Sena vehicle, your household gate, and official ward polygon.
            </p>
          </div>

          {/* Quick Center Buttons */}
          <div className="flex items-center gap-2">
            {isOnDuty && workerPos ? (
              <button
                type="button"
                onClick={() => {
                  setMapCenter(workerPos);
                  setMapZoom(17);
                }}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-[#0a4d2c] border border-emerald-200 flex items-center gap-1.5 cursor-pointer transition-all"
              >
                <Truck className="w-3.5 h-3.5" />
                <span>Focus Worker</span>
              </button>
            ) : (
              <div className="px-3 py-1.5 rounded-xl text-xs font-bold bg-gray-100 dark:bg-white/5 text-gray-400 dark:text-gray-500 border border-gray-200 dark:border-white/10 flex items-center gap-1.5 select-none">
                <span className="w-2 h-2 rounded-full bg-gray-400" />
                <span>Worker Offline</span>
              </div>
            )}
            <button
              type="button"
              onClick={() => {
                setMapCenter(citizenPos);
                setMapZoom(17);
              }}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 flex items-center gap-1.5 cursor-pointer transition-all"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Focus My House</span>
            </button>
          </div>
        </div>

        {/* Map Canvas */}
        <div className="w-full h-[450px] sm:h-[500px] rounded-2xl overflow-hidden border border-emerald-100/80 shadow-inner relative">
          <MapContainer
            center={mapCenter}
            zoom={mapZoom}
            scrollWheelZoom={true}
            className="w-full h-full z-10"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <MapPanController center={mapCenter} zoom={mapZoom} />

            {/* Ward Polygon Boundary */}
            {wardPolygon && (
              <Polygon
                positions={wardPolygon}
                pathOptions={{
                  color: '#059669',
                  fillColor: '#10b981',
                  fillOpacity: 0.12,
                  weight: 2,
                  dashArray: '6, 6'
                }}
              >
                <Tooltip sticky>
                  <span className="font-bold text-xs">{wardId} Collection Boundary</span>
                </Tooltip>
              </Polygon>
            )}

            {/* Connecting Polyline between worker and citizen (only when active) */}
            {isOnDuty && workerPos && (
              <Polyline
                positions={[citizenPos, workerPos]}
                pathOptions={{
                  color: '#047857',
                  weight: 3,
                  dashArray: '4, 8',
                  opacity: 0.75
                }}
              />
            )}

            {/* Citizen House Marker */}
            <Marker position={citizenPos} icon={createHouseIcon()}>
              <Popup>
                <div className="p-1 space-y-1 text-xs">
                  <div className="font-extrabold text-[#0a4d2c] flex items-center gap-1">
                    <Home className="w-3.5 h-3.5" />
                    <span>Your Residence</span>
                  </div>
                  <p className="font-semibold text-gray-900">{citizenName}</p>
                  <p className="text-gray-500">House No: {houseNo}</p>
                  <span className="inline-block mt-1 px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold text-[10px]">
                    {wardId}
                  </span>
                </div>
              </Popup>
            </Marker>

            {/* Live Worker Vehicle Marker - STRICTLY only when active / on duty */}
            {isOnDuty && workerPos && (
              <Marker position={workerPos} icon={createWorkerIcon(true)}>
                <Popup>
                  <div className="p-1 space-y-1.5 text-xs">
                    <div className="font-extrabold text-emerald-800 flex items-center gap-1">
                      <Truck className="w-4 h-4" />
                      <span>Haritha Karma Sena</span>
                    </div>
                    <p className="font-bold text-gray-900">
                      {liveWorker?.fullName || 'Assigned Collection Worker'}
                    </p>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                      <span className="font-bold text-emerald-700">
                        Actively Collecting
                      </span>
                    </div>
                    {distanceInfo && (
                      <p className="text-[11px] font-extrabold text-[#0a4d2c] bg-emerald-50 p-1 rounded">
                        📏 Distance: {distanceInfo.meters}m (~{distanceInfo.walkingMinutes} mins)
                      </p>
                    )}
                  </div>
                </Popup>
              </Marker>
            )}
          </MapContainer>

          {/* In-map overlay notice when worker is not active */}
          {(!isOnDuty || !workerPos) && (
            <div className="absolute bottom-4 left-4 right-4 z-[500] pointer-events-none flex justify-center">
              <div className="bg-slate-900/90 backdrop-blur-md text-white px-4 py-2.5 rounded-2xl shadow-xl border border-white/10 flex items-center gap-2.5 max-w-md text-center pointer-events-auto">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0 animate-pulse" />
                <span className="text-xs font-semibold text-gray-200">
                  Worker location is hidden because they are currently off duty. Live GPS coordinates will appear here once duty starts.
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CitizenLiveWorkerTracker;
