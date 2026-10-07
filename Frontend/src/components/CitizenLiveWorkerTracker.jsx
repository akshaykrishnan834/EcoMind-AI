import React, { useState, useEffect, useRef } from 'react';
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
  LocateFixed,
  Sparkles,
  Zap,
  Lock,
  AlertCircle,
  Calendar,
  ShieldCheck
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Polygon, Tooltip, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getLiveWorkerByWard, calculateHaversineDistance } from '../services/workerService';
import { getAllWards } from '../services/citizenService';

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

  // Load ward polygon
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

  // Fetch live worker state
  const loadWorkerState = async () => {
    try {
      const data = await getLiveWorkerByWard(wardId);
      if (data) {
        setLiveWorker(data);
      } else if (assignedWorker) {
        // Fallback to assigned worker profile with simulated nearby position
        const defaultWorkerLat = citizenLat + 0.0028;
        const defaultWorkerLng = citizenLng + 0.0024;
        setLiveWorker({
          fullName: assignedWorker.fullName || assignedWorker.name || 'Haritha Karma Sena Worker',
          phoneNumber: assignedWorker.phoneNumber || assignedWorker.phone || '9847123456',
          wardId: wardId,
          isOnDuty: true,
          latitude: defaultWorkerLat,
          longitude: defaultWorkerLng,
        });
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
        setLiveWorker((prev) => ({
          ...(prev || {}),
          ...e.detail
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
  }, [wardId]);

  // Worker coordinates
  const workerLat = parseFloat(liveWorker?.latitude || liveWorker?.currentLatitude) || (citizenLat + 0.0028);
  const workerLng = parseFloat(liveWorker?.longitude || liveWorker?.currentLongitude) || (citizenLng + 0.0024);
  const workerPos = [workerLat, workerLng];
  const isOnDuty = Boolean(liveWorker?.isOnDuty);

  // Proximity calculation
  const distanceInfo = calculateHaversineDistance(citizenLat, citizenLng, workerLat, workerLng);
  const isApproaching = isOnDuty && distanceInfo && distanceInfo.meters <= 150;

  // GATED STATE: If citizen has no active pickup request, display locked guidance screen
  if (!activePickupRequest) {
    return (
      <div className="space-y-6 animate-fadeIn pb-12">
        {/* Hero Header */}
        <div className="bg-gradient-to-r from-[#0a4d2c] via-[#0f5b37] to-emerald-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-emerald-200 text-xs font-semibold">
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              <span>On-Demand Live Tracking • Gated Feature</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Live Doorstep Collection Tracker
            </h1>

            <p className="text-xs sm:text-sm text-emerald-100/90 font-medium max-w-xl">
              Live GPS tracking is strictly active for households with scheduled or in-progress collection drives in {wardId}.
            </p>
          </div>
        </div>

        {/* Gated Empty State Card */}
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
              Live vehicle GPS navigation and doorstep proximity alerts are only enabled when your household has an active, scheduled, or in-progress pickup request.
            </p>
          </div>

          <div className="p-4.5 rounded-2xl bg-emerald-50/60 dark:bg-[#15271d] border border-emerald-100 dark:border-emerald-800/40 text-left space-y-2.5 text-xs">
            <div className="font-extrabold text-[#0a4d2c] dark:text-emerald-300 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>How On-Demand Collection Tracking Works:</span>
            </div>
            <ul className="text-slate-600 dark:text-slate-300 space-y-1.5 list-disc list-inside">
              <li>Submit your household recyclable waste pickup request.</li>
              <li>When your ward worker marks the request as scheduled or on route, real-time GPS broadcast turns on.</li>
              <li>You can view vehicle movement on the map and receive 150m arrival proximity alerts.</li>
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

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-[#0a4d2c] via-[#0f5b37] to-emerald-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-1/4 -translate-y-1/4 w-72 h-72 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-emerald-200 text-xs font-semibold">
              <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span>Haritha Karma Sena Field GPS Tracker</span>
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
                <span>{activePickupRequest.status || 'On Route'}</span>
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
                    : `Sector: ${wardId}`}
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
            <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-extrabold text-[10px]">
              {wardId}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-[#0a4d2c] text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
              {liveWorker?.fullName ? liveWorker.fullName[0].toUpperCase() : 'H'}
            </div>
            <div className="min-w-0">
              <h4 className="text-sm font-extrabold text-gray-900 dark:text-white truncate">
                {liveWorker?.fullName || assignedWorker?.fullName || 'Haritha Sena Team'}
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Doorstep Plastic Collector
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
            <span className="px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-extrabold text-[10px]">
              Haversine GIS
            </span>
          </div>

          <div>
            <div className="text-2xl font-black text-gray-900 dark:text-white">
              {isOnDuty && distanceInfo ? `${distanceInfo.meters} Meters` : 'Not In Route'}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {isOnDuty && distanceInfo
                ? `Approx. ${distanceInfo.walkingMinutes} mins walking pace`
                : 'Worker will broadcast live location once duty begins'}
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

      {/* Interactive Leaflet Map */}
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

            {/* Connecting Polyline between worker and citizen */}
            {isOnDuty && (
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

            {/* Live Worker Vehicle Marker */}
            <Marker position={workerPos} icon={createWorkerIcon(isOnDuty)}>
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
                    <span className={`w-2 h-2 rounded-full ${isOnDuty ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                    <span className="font-bold text-gray-600">
                      {isOnDuty ? 'Actively Collecting' : 'Off Duty'}
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
          </MapContainer>
        </div>
      </div>
    </div>
  );
};

export default CitizenLiveWorkerTracker;
