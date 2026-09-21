import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Map as MapIcon,
  Navigation,
  Target,
  Compass,
  CheckCircle2,
  Clock,
  Home,
  User,
  Phone,
  Truck,
  Layers,
  Search,
  ExternalLink,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Info,
  Check,
  ListOrdered,
  Calendar,
  AlertCircle,
  MapPin,
  Building2,
  X
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Polygon, Polyline, Tooltip, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getCitizensByWard } from '../../services/citizenService';
import { getWardPickupRequests } from '../../services/pickupRequestService';

// Fix Leaflet marker icons in React Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom House Number & Status Pin Generator
const createHousePinIcon = (status, houseNumber, stopNumber, isRouteStop, isSelected) => {
  let bgGradient = 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)';
  let badgeIcon = '🏠';
  let statusColor = '#2563eb';

  if (status === 'Completed') {
    bgGradient = 'linear-gradient(135deg, #059669 0%, #047857 100%)';
    badgeIcon = '✓';
    statusColor = '#059669';
  } else if (status === 'Scheduled') {
    bgGradient = 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)';
    badgeIcon = '📅';
    statusColor = '#0284c7';
  } else if (status === 'Pending') {
    bgGradient = 'linear-gradient(135deg, #d97706 0%, #b45309 100%)';
    badgeIcon = '⏳';
    statusColor = '#d97706';
  } else if (status === 'Failed') {
    bgGradient = 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)';
    badgeIcon = '✕';
    statusColor = '#dc2626';
  } else {
    // No Request
    bgGradient = 'linear-gradient(135deg, #475569 0%, #334155 100%)';
    badgeIcon = '🏠';
    statusColor = '#475569';
  }

  const cleanHouse = houseNumber ? `#${houseNumber}` : '🏠';
  const stopBadgeHtml = isRouteStop && stopNumber
    ? `<div style="
        position: absolute;
        top: -8px;
        right: -8px;
        background: #0f172a;
        color: #f8fafc;
        border: 2px solid #ffffff;
        border-radius: 9999px;
        font-size: 10px;
        font-weight: 900;
        min-width: 18px;
        height: 18px;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0 4px;
        box-shadow: 0 2px 5px rgba(0,0,0,0.35);
        z-index: 10;
      ">#${stopNumber}</div>`
    : '';

  const selectedRing = isSelected
    ? `box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.6), 0 4px 14px rgba(0,0,0,0.4);`
    : `box-shadow: 0 3px 10px rgba(0,0,0,0.3);`;

  return L.divIcon({
    className: 'custom-house-pin',
    html: `
      <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer; user-select: none;">
        ${stopBadgeHtml}
        <div style="
          background: ${bgGradient};
          border: 2px solid #ffffff;
          ${selectedRing}
          border-radius: 12px;
          padding: 3px 7px;
          display: flex;
          align-items: center;
          gap: 4px;
          color: white;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          white-space: nowrap;
          transition: transform 0.15s ease;
        ">
          <span style="font-size: 10px; line-height: 1;">${badgeIcon}</span>
          <span style="font-weight: 800; font-size: 11px; letter-spacing: -0.2px;">${cleanHouse}</span>
        </div>
        <div style="
          width: 0;
          height: 0;
          border-left: 5px solid transparent;
          border-right: 5px solid transparent;
          border-top: 6px solid ${statusColor};
          margin-top: -1px;
        "></div>
      </div>
    `,
    iconSize: [52, 38],
    iconAnchor: [26, 38],
    popupAnchor: [0, -38],
  });
};

// Pulsed Worker Location Pin
const createWorkerPinIcon = () => {
  return L.divIcon({
    className: 'custom-worker-pin',
    html: `
      <div style="position: relative; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;">
        <div style="position: absolute; width: 36px; height: 36px; border-radius: 50%; background-color: rgba(16, 185, 129, 0.4); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
        <div style="width: 28px; height: 28px; border-radius: 50%; background: linear-gradient(135deg, #0a4d2c 0%, #059669 100%); border: 3px solid #ffffff; box-shadow: 0 4px 10px rgba(0,0,0,0.35); display: flex; align-items: center; justify-content: center; color: white; font-size: 13px;">
          📍
        </div>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18],
  });
};

function ChangeMapView({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.setView(center, zoom, { animate: true });
    }
  }, [center, zoom, map]);
  return null;
}

const getPolygonCenter = (polygon) => {
  if (!polygon || polygon.length === 0) return [9.5583, 76.7842];
  let latSum = 0;
  let lngSum = 0;
  for (const pt of polygon) {
    latSum += pt[0];
    lngSum += pt[1];
  }
  return [latSum / polygon.length, lngSum / polygon.length];
};

// Calculate Haversine distance in meters
const getDistanceMeters = (p1, p2) => {
  if (!p1 || !p2) return 0;
  const R = 6371e3; // metres
  const φ1 = (p1[0] * Math.PI) / 180;
  const φ2 = (p2[0] * Math.PI) / 180;
  const Δφ = ((p2[0] - p1[0]) * Math.PI) / 180;
  const Δλ = ((p2[1] - p1[1]) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
};

const WorkerCollectionMap = ({
  wardId = 'Ward 1',
  wardDetails = null,
  workerProfile = {},
  initialCitizens = []
}) => {
  const [citizens, setCitizens] = useState(initialCitizens || []);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterMode, setFilterMode] = useState('all'); // 'all' | 'route' | 'pending' | 'scheduled' | 'completed' | 'norequest'
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarTab, setSidebarTab] = useState('route'); // 'route' | 'allHouses'
  const [workerLocation, setWorkerLocation] = useState(null);
  const [locationAccuracy, setLocationAccuracy] = useState(null);
  const [selectedStopId, setSelectedStopId] = useState(null);

  const [mapCenterOverride, setMapCenterOverride] = useState(null);
  const [mapZoom, setMapZoom] = useState(15);
  const watchIdRef = useRef(null);

  // Default ward polygon center
  const wardCenter = useMemo(() => {
    if (wardDetails?.boundary && wardDetails.boundary.length >= 3) {
      return getPolygonCenter(wardDetails.boundary);
    }
    return [9.5175, 76.7668]; // Chirakkadavu area
  }, [wardDetails]);

  // Load only registered citizens under this worker & their ward pickups
  const loadMapData = async () => {
    setLoading(true);
    try {
      const workerEmail = workerProfile.email || '';
      const workerIdCode = workerProfile.workerId || '';
      const activeWorker = workerEmail || workerIdCode;

      const [citData, reqData] = await Promise.all([
        getCitizensByWard(wardId).catch(() => []),
        getWardPickupRequests(wardId, activeWorker).catch(() => [])
      ]);

      if (Array.isArray(citData) && citData.length > 0) {
        setCitizens(citData);
      } else if (initialCitizens && initialCitizens.length > 0) {
        setCitizens(initialCitizens);
      }
      setRequests(Array.isArray(reqData) ? reqData : []);
    } catch (err) {
      console.error('Error loading collection map data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMapData();
  }, [wardId, workerProfile.email, workerProfile.workerId]);

  // Live GPS tracking
  useEffect(() => {
    if (!navigator.geolocation) {
      setWorkerLocation(wardCenter);
      return;
    }

    const successHandler = (pos) => {
      setWorkerLocation([pos.coords.latitude, pos.coords.longitude]);
      setLocationAccuracy(Math.round(pos.coords.accuracy));
    };

    const errorHandler = () => {
      setWorkerLocation(wardCenter);
    };

    navigator.geolocation.getCurrentPosition(successHandler, errorHandler, {
      enableHighAccuracy: true,
      timeout: 8000,
    });

    watchIdRef.current = navigator.geolocation.watchPosition(successHandler, errorHandler, {
      enableHighAccuracy: true,
      maximumAge: 5000,
    });

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [wardCenter]);

  // Map each registered citizen with their latest pickup request based on CitizenId, Email, OR House Number
  const mappedHouseholds = useMemo(() => {
    return (citizens || []).map((citizen) => {
      const citizenIds = [
        citizen.citizenId,
        citizen.email,
        citizen.id,
        citizen._id
      ].filter(Boolean).map(s => String(s).trim().toLowerCase());

      const citizenHouse = String(citizen.houseNumber || '').trim().toLowerCase();

      // Match requests for this citizen by:
      // 1. CitizenId / Email match
      // 2. OR House Number match ("and also mapp the pickup request based on house number")
      const citizenRequests = (requests || []).filter((r) => {
        const reqCitizenId = String(r.citizenId || '').trim().toLowerCase();
        const reqHouseNum = String(r.houseNumber || '').trim().toLowerCase();

        // Direct ID / Email match
        if (reqCitizenId && citizenIds.includes(reqCitizenId)) return true;

        // House number match
        if (citizenHouse && reqHouseNum && citizenHouse === reqHouseNum) return true;

        // Request citizenId was set as house number (e.g. "629" or "715")
        if (citizenHouse && reqCitizenId && citizenHouse === reqCitizenId) return true;

        return false;
      });

      // Sort newest requests first
      citizenRequests.sort(
        (a, b) => new Date(b.requestedAt || b.collectionDate || b.createdAt || 0) -
                  new Date(a.requestedAt || a.collectionDate || a.createdAt || 0)
      );

      const latestReq = citizenRequests[0] || null;
      let pickupStatus = 'No Request'; // 'No Request' | 'Pending' | 'Scheduled' | 'Completed' | 'Failed'

      if (latestReq) {
        const s = (latestReq.status || '').toLowerCase();
        if (s === 'completed' || s === 'collected') {
          pickupStatus = 'Completed';
        } else if (s === 'scheduled' || s === 'accepted') {
          pickupStatus = 'Scheduled';
        } else if (s === 'pending') {
          pickupStatus = 'Pending';
        } else if (s === 'failed') {
          pickupStatus = 'Failed';
        } else if (s === 'nopickup' || s === 'cancelled') {
          pickupStatus = 'No Request';
        } else {
          pickupStatus = 'Pending';
        }
      }

      const lat = Number(citizen.latitude) || Number(latestReq?.latitude) || 0;
      const lng = Number(citizen.longitude) || Number(latestReq?.longitude) || 0;
      const hasPin = Boolean(lat && lng && (lat !== 0 || lng !== 0));

      return {
        ...citizen,
        latitude: lat,
        longitude: lng,
        pickupRequest: latestReq,
        pickupStatus,
        hasPin,
      };
    });
  }, [citizens, requests]);

  // Today's route stops: Pending, Scheduled, and Completed pickups ordered for collection
  const routeStops = useMemo(() => {
    const stopsWithCoords = mappedHouseholds.filter(
      (h) => h.hasPin && (h.pickupStatus === 'Pending' || h.pickupStatus === 'Scheduled' || h.pickupStatus === 'Completed')
    );

    const origin = workerLocation || wardCenter;

    // Prioritize Scheduled (1) -> Pending (2) -> Completed (3) -> Proximity
    stopsWithCoords.sort((a, b) => {
      const getPriority = (status) => {
        if (status === 'Scheduled') return 1;
        if (status === 'Pending') return 2;
        if (status === 'Completed') return 3;
        return 4;
      };

      const pA = getPriority(a.pickupStatus);
      const pB = getPriority(b.pickupStatus);
      if (pA !== pB) return pA - pB;

      const distA = getDistanceMeters(origin, [a.latitude, a.longitude]);
      const distB = getDistanceMeters(origin, [b.latitude, b.longitude]);
      return distA - distB;
    });

    return stopsWithCoords.map((stop, idx) => ({
      ...stop,
      stopNumber: idx + 1,
      distanceMeters: getDistanceMeters(origin, [stop.latitude, stop.longitude]),
    }));
  }, [mappedHouseholds, workerLocation, wardCenter]);

  // Route Polyline Coordinates (Worker Location -> Stop 1 -> Stop 2 -> ...)
  const routePolyline = useMemo(() => {
    const coords = [];
    if (workerLocation) coords.push(workerLocation);
    routeStops.forEach((stop) => {
      coords.push([stop.latitude, stop.longitude]);
    });
    return coords;
  }, [workerLocation, routeStops]);

  // Filtered pins for map display
  const displayedPins = useMemo(() => {
    return mappedHouseholds.filter((h) => {
      if (!h.hasPin) return false;

      // Filter by subtab/view mode
      if (filterMode === 'route') {
        if (h.pickupStatus !== 'Pending' && h.pickupStatus !== 'Scheduled' && h.pickupStatus !== 'Completed') {
          return false;
        }
      } else if (filterMode === 'pending') {
        if (h.pickupStatus !== 'Pending') return false;
      } else if (filterMode === 'scheduled') {
        if (h.pickupStatus !== 'Scheduled') return false;
      } else if (filterMode === 'completed') {
        if (h.pickupStatus !== 'Completed') return false;
      } else if (filterMode === 'norequest') {
        if (h.pickupStatus !== 'No Request') return false;
      }

      // Search query matches house number, full name, phone, or request ID
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const reqId = (h.pickupRequest?.requestId || '').toLowerCase();
        const matchesName = (h.fullName || '').toLowerCase().includes(q);
        const matchesHouse = (h.houseNumber || '').toLowerCase().includes(q);
        const matchesPhone = (h.phoneNumber || h.phone || '').includes(q);
        const matchesReq = reqId.includes(q);
        if (!matchesName && !matchesHouse && !matchesPhone && !matchesReq) {
          return false;
        }
      }
      return true;
    });
  }, [mappedHouseholds, filterMode, searchQuery]);

  // Quick house numbers sorted numerically for quick jump navigation
  const sortedRegisteredHouses = useMemo(() => {
    const list = [...mappedHouseholds];
    list.sort((a, b) => {
      const numA = parseInt(String(a.houseNumber || '').replace(/\D/g, ''), 10) || 0;
      const numB = parseInt(String(b.houseNumber || '').replace(/\D/g, ''), 10) || 0;
      return numA - numB;
    });
    return list;
  }, [mappedHouseholds]);

  // Center on stop
  const handleSelectStop = (stop) => {
    setSelectedStopId(stop.id || stop.citizenId || stop.houseNumber);
    if (stop.latitude && stop.longitude) {
      setMapCenterOverride([stop.latitude, stop.longitude]);
      setMapZoom(17);
    }
  };

  const handleCenterWard = () => {
    setMapCenterOverride([...wardCenter]);
    setMapZoom(15);
  };

  const handleCenterWorker = () => {
    if (workerLocation) {
      setMapCenterOverride([...workerLocation]);
      setMapZoom(16);
    }
  };

  // Metrics
  const totalMappedHouses = mappedHouseholds.filter((h) => h.hasPin).length;
  const pendingCount = mappedHouseholds.filter((h) => h.pickupStatus === 'Pending').length;
  const scheduledCount = mappedHouseholds.filter((h) => h.pickupStatus === 'Scheduled').length;
  const completedCount = mappedHouseholds.filter((h) => h.pickupStatus === 'Completed').length;
  const noRequestCount = mappedHouseholds.filter((h) => h.pickupStatus === 'No Request').length;

  const activeCenter = mapCenterOverride || workerLocation || wardCenter;

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fadeIn pb-10">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#0a4d2c] via-[#0f5b37] to-emerald-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-1/4 -translate-y-1/4 w-80 h-80 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 text-xs font-semibold">
              <MapIcon className="w-4 h-4 text-emerald-300" />
              <span>Smart Ward Navigation & House Route Planning</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Collection Map & Today's Route
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100/90 max-w-2xl">
              Live GIS map of <span className="font-bold text-white">{wardId}</span> with registered citizen household pins, pickup locations, completed vs pending status indicators, and optimal collection routes.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={loadMapData}
              disabled={loading}
              className="flex items-center gap-2 px-3.5 py-2.5 bg-emerald-900/80 hover:bg-emerald-950 border border-emerald-400/40 text-emerald-200 rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
              title="Refresh registered citizens and pickup requests"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            <button
              onClick={handleCenterWorker}
              className="flex items-center gap-2 px-4 py-2.5 bg-white text-[#0a4d2c] hover:bg-emerald-50 rounded-xl text-xs font-bold transition shadow-md cursor-pointer"
            >
              <Navigation className="w-4 h-4 text-[#0a4d2c]" />
              <span>My Location</span>
            </button>
            <button
              onClick={handleCenterWard}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-800/80 hover:bg-emerald-800 text-white border border-emerald-400/30 rounded-xl text-xs font-bold transition shadow-md cursor-pointer"
            >
              <Target className="w-4 h-4 text-emerald-300" />
              <span>Center Ward</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metric Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Total Mapped Households */}
        <div className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">Household Pins</span>
            <Home className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-xl sm:text-2xl font-extrabold text-gray-900">{totalMappedHouses}</p>
          <p className="text-[10px] sm:text-[11px] text-gray-500 font-medium">
            Out of {citizens.length} in {wardId}
          </p>
        </div>

        {/* Pending Pickups */}
        <div className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">Pending Stops</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-xl sm:text-2xl font-extrabold text-amber-600">{pendingCount} Pickups</p>
          <p className="text-[10px] sm:text-[11px] text-gray-500 font-medium">
            Awaiting collection
          </p>
        </div>

        {/* Scheduled Pickups */}
        <div className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">Scheduled Stops</span>
            <Calendar className="w-4 h-4 text-sky-600" />
          </div>
          <p className="text-xl sm:text-2xl font-extrabold text-sky-700">{scheduledCount} Scheduled</p>
          <p className="text-[10px] sm:text-[11px] text-gray-500 font-medium">
            Ready for pickup
          </p>
        </div>

        {/* Completed Pickups */}
        <div className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">Completed Stops</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-xl sm:text-2xl font-extrabold text-emerald-800">{completedCount} Collected</p>
          <p className="text-[10px] sm:text-[11px] text-gray-500 font-medium">
            Verified with OTP
          </p>
        </div>

        {/* Route Stops Total */}
        <div className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-2xs space-y-1 col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">Today's Route</span>
            <Truck className="w-4 h-4 text-[#0a4d2c]" />
          </div>
          <p className="text-xl sm:text-2xl font-extrabold text-[#0a4d2c]">{routeStops.length} Stops</p>
          <p className="text-[10px] sm:text-[11px] text-emerald-700 font-medium">
            Sequenced route path
          </p>
        </div>
      </div>

      {/* QUICK HOUSE NUMBER JUMP BAR - Utilizing map feature based on House Number */}
      <div className="bg-white rounded-2xl p-3.5 border border-emerald-100 shadow-xs space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-extrabold text-[#0a4d2c]">
            <Building2 className="w-4 h-4 text-emerald-600" />
            <span>Registered House Directory • Quick Map Jump ({sortedRegisteredHouses.length} Households):</span>
          </div>
          <span className="text-[11px] text-gray-500">
            Tap any house number to zoom directly to its pin on the map
          </span>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
          {sortedRegisteredHouses.map((h) => {
            const isSelected = selectedStopId === (h.id || h.citizenId || h.houseNumber);
            const status = h.pickupStatus;

            let pillStyle = 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100';
            let dotColor = 'bg-slate-400';

            if (status === 'Completed') {
              pillStyle = 'bg-emerald-50 text-emerald-900 border-emerald-300 hover:bg-emerald-100';
              dotColor = 'bg-emerald-500';
            } else if (status === 'Scheduled') {
              pillStyle = 'bg-sky-50 text-sky-900 border-sky-300 hover:bg-sky-100';
              dotColor = 'bg-sky-500';
            } else if (status === 'Pending') {
              pillStyle = 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100';
              dotColor = 'bg-amber-500';
            } else if (status === 'Failed') {
              pillStyle = 'bg-rose-50 text-rose-900 border-rose-300 hover:bg-rose-100';
              dotColor = 'bg-rose-500';
            }

            return (
              <button
                key={h.id || h.citizenId || h.houseNumber}
                onClick={() => handleSelectStop(h)}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold border transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${pillStyle} ${
                  isSelected ? 'ring-2 ring-[#0a4d2c] shadow-xs' : ''
                }`}
                title={`House #${h.houseNumber}: ${h.fullName} (${status})`}
              >
                <span className={`w-2 h-2 rounded-full ${dotColor}`} />
                <span className="font-mono">#{h.houseNumber || 'N/A'}</span>
                <span className="text-[10px] opacity-80 truncate max-w-[80px]">
                  {h.fullName?.split(' ')[0] || ''}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Grid: Left Map + Right Route Order Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* MAP CONTAINER (2 COLS) */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-5 sm:p-6 border border-emerald-100 shadow-md space-y-4">
          {/* Controls & Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
            {/* Filter Buttons */}
            <div className="flex flex-wrap items-center gap-1 bg-gray-100 p-1 rounded-2xl">
              <button
                onClick={() => setFilterMode('all')}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                  filterMode === 'all'
                    ? 'bg-[#0a4d2c] text-white shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                All Houses ({totalMappedHouses})
              </button>
              <button
                onClick={() => setFilterMode('route')}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                  filterMode === 'route'
                    ? 'bg-[#0a4d2c] text-white shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Today's Route ({routeStops.length})
              </button>
              <button
                onClick={() => setFilterMode('pending')}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                  filterMode === 'pending'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Pending ({pendingCount})
              </button>
              <button
                onClick={() => setFilterMode('scheduled')}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                  filterMode === 'scheduled'
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Scheduled ({scheduledCount})
              </button>
              <button
                onClick={() => setFilterMode('completed')}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                  filterMode === 'completed'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Completed ({completedCount})
              </button>
              <button
                onClick={() => setFilterMode('norequest')}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                  filterMode === 'norequest'
                    ? 'bg-slate-700 text-white shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                No Request ({noRequestCount})
              </button>
            </div>

            {/* Quick search by house number or resident name */}
            <div className="relative min-w-[200px]">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search house number, name..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Leaflet Map */}
          <div className="h-[520px] w-full rounded-2xl overflow-hidden border border-emerald-200 shadow-inner relative z-0">
            <MapContainer
              center={activeCenter}
              zoom={mapZoom}
              scrollWheelZoom={true}
              className="h-full w-full"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <ChangeMapView center={activeCenter} zoom={mapZoom} />

              {/* Ward Boundary Polygon */}
              {wardDetails?.boundary && wardDetails.boundary.length >= 3 && (
                <Polygon
                  positions={wardDetails.boundary}
                  pathOptions={{
                    color: '#059669',
                    fillColor: '#10b981',
                    fillOpacity: 0.15,
                    weight: 3,
                  }}
                >
                  <Tooltip sticky>
                    <div className="p-1 text-xs">
                      <p className="font-extrabold text-emerald-950 text-sm">
                        {wardDetails.wardName || wardDetails.wardId} Official Boundary
                      </p>
                      <p className="text-gray-600 font-medium">
                        {wardDetails.panchayatName || 'Chirakkadavu'} Grama Panchayat
                      </p>
                    </div>
                  </Tooltip>
                </Polygon>
              )}

              {/* Route Order Polyline */}
              {(filterMode === 'route' || filterMode === 'all') && routePolyline.length >= 2 && (
                <Polyline
                  positions={routePolyline}
                  pathOptions={{
                    color: '#059669',
                    weight: 4,
                    opacity: 0.85,
                    dashArray: '8, 8',
                  }}
                />
              )}

              {/* Worker Live Pin */}
              {workerLocation && (
                <>
                  <Circle
                    center={workerLocation}
                    radius={locationAccuracy || 25}
                    pathOptions={{
                      color: '#059669',
                      fillColor: '#10b981',
                      fillOpacity: 0.15,
                      weight: 1,
                    }}
                  />
                  <Marker position={workerLocation} icon={createWorkerPinIcon()}>
                    <Popup>
                      <div className="p-2 text-xs space-y-1">
                        <p className="font-extrabold text-[#0a4d2c] text-sm">📍 Your Location (Worker)</p>
                        <p className="text-gray-600">{workerProfile.fullName || 'Authorized Worker'}</p>
                        <p className="text-gray-500 font-mono text-[10px]">Starting point of collection route</p>
                      </div>
                    </Popup>
                  </Marker>
                </>
              )}

              {/* Registered Household / Pickup Markers with House Numbers & Status */}
              {displayedPins.map((household) => {
                const stopMatch = routeStops.find(
                  (s) => (s.id && s.id === household.id) ||
                         (s.citizenId && s.citizenId === household.citizenId) ||
                         (s.houseNumber && s.houseNumber === household.houseNumber)
                );
                const isRouteStop = Boolean(stopMatch);
                const stopNumber = stopMatch?.stopNumber;
                const isSelected = selectedStopId === (household.id || household.citizenId || household.houseNumber);

                const customIcon = createHousePinIcon(
                  household.pickupStatus,
                  household.houseNumber,
                  stopNumber,
                  isRouteStop,
                  isSelected
                );

                const req = household.pickupRequest;

                return (
                  <Marker
                    key={household.id || household.citizenId || household.email || household.houseNumber}
                    position={[household.latitude, household.longitude]}
                    icon={customIcon}
                    eventHandlers={{
                      click: () => {
                        setSelectedStopId(household.id || household.citizenId || household.houseNumber);
                      }
                    }}
                  >
                    {/* Hover tooltip with House Number and Pickup Status */}
                    <Tooltip sticky direction="top" offset={[0, -38]}>
                      <div className="p-1.5 text-xs space-y-0.5">
                        <div className="flex items-center gap-1.5 font-extrabold text-gray-900">
                          <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-950 rounded font-mono text-[10px]">
                            House #{household.houseNumber || 'N/A'}
                          </span>
                          <span>{household.fullName}</span>
                        </div>
                        <div className="text-[11px] text-gray-600 font-medium">
                          Status: <strong className="text-gray-900">{household.pickupStatus}</strong>
                          {req?.requestId && <span className="font-mono text-[10px] text-gray-500 ml-1">({req.requestId})</span>}
                        </div>
                        {req?.overallCategory && (
                          <div className="text-[10px] text-emerald-700 font-semibold">
                            {req.overallCategory} • {req.estimatedVolume || 'Medium'}
                          </div>
                        )}
                      </div>
                    </Tooltip>

                    {/* Rich Popup Details */}
                    <Popup>
                      <div className="p-2.5 text-xs min-w-[220px] space-y-2">
                        <div className="flex items-center justify-between gap-2 border-b border-gray-100 pb-1.5">
                          <div>
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-black bg-emerald-100 text-[#0a4d2c]">
                              House #{household.houseNumber || 'N/A'}
                            </span>
                            <h3 className="font-extrabold text-gray-900 text-sm mt-0.5">{household.fullName || 'Registered Resident'}</h3>
                          </div>
                          {isRouteStop && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-600 text-white shadow-2xs">
                              Stop #{stopNumber}
                            </span>
                          )}
                        </div>

                        <div className="space-y-1 text-gray-600 text-[11px]">
                          <p>
                            <strong className="text-gray-900 font-semibold">Citizen ID:</strong> {household.citizenId || 'N/A'}
                          </p>
                          <p>
                            <strong className="text-gray-900 font-semibold">Phone:</strong>{' '}
                            {household.phoneNumber || household.phone ? (
                              <a href={`tel:${household.phoneNumber || household.phone}`} className="text-emerald-700 font-bold hover:underline">
                                {household.phoneNumber || household.phone}
                              </a>
                            ) : 'N/A'}
                          </p>
                          <p className="truncate">
                            <strong className="text-gray-900 font-semibold">Address:</strong> {household.address || household.houseName || 'Ward Area'}
                          </p>
                        </div>

                        {/* Pickup Status & Details Box */}
                        <div className="p-2 rounded-xl bg-gray-50 border border-gray-200 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-gray-500 uppercase">Pickup Request</span>
                            {household.pickupStatus === 'Completed' ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                                <Check className="w-3 h-3 text-emerald-600 stroke-[3]" /> Collected ✓
                              </span>
                            ) : household.pickupStatus === 'Scheduled' ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-black text-sky-800 bg-sky-100 px-2 py-0.5 rounded-full">
                                <Calendar className="w-3 h-3 text-sky-600" /> Scheduled
                              </span>
                            ) : household.pickupStatus === 'Pending' ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-black text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                                <Clock className="w-3 h-3 text-amber-600" /> Pending
                              </span>
                            ) : household.pickupStatus === 'Failed' ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-black text-rose-800 bg-rose-100 px-2 py-0.5 rounded-full">
                                <AlertCircle className="w-3 h-3 text-rose-600" /> Failed
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-700 bg-slate-200 px-2 py-0.5 rounded-full">
                                No Request
                              </span>
                            )}
                          </div>

                          {req ? (
                            <div className="text-[10px] text-gray-700 space-y-0.5 pt-0.5">
                              <p><span className="font-semibold text-gray-500">Request:</span> <span className="font-mono">{req.requestId || 'REQ-ACTIVE'}</span></p>
                              <p><span className="font-semibold text-gray-500">Category:</span> {req.overallCategory || 'Dry Recyclable Plastic'}</p>
                              {req.collectionDate && (
                                <p><span className="font-semibold text-gray-500">Date:</span> {new Date(req.collectionDate).toLocaleDateString('en-GB')}</p>
                              )}
                            </div>
                          ) : (
                            <p className="text-[10px] text-gray-500 italic">No dry waste collection submitted for this cycle.</p>
                          )}
                        </div>

                        {/* Navigation button */}
                        <div className="pt-1 flex items-center justify-between gap-2">
                          <a
                            href={`https://www.google.com/maps/dir/?api=1&destination=${household.latitude},${household.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 py-1.5 px-3 bg-[#0a4d2c] hover:bg-emerald-800 text-white rounded-xl font-bold text-[11px] flex items-center justify-center gap-1.5 transition shadow-xs"
                            title="Open Google Maps Turn-by-Turn GPS Navigation"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>Navigate to House #{household.houseNumber}</span>
                          </a>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>
          </div>

          {/* Map Legend */}
          <div className="flex flex-wrap items-center justify-between text-xs text-gray-600 gap-3 pt-2">
            <div className="flex flex-wrap items-center gap-3.5">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-[#d97706] border border-white" />
                <span className="font-bold text-gray-800">Pending ({pendingCount})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-[#0284c7] border border-white" />
                <span className="font-bold text-gray-800">Scheduled ({scheduledCount})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-[#059669] border border-white" />
                <span className="font-bold text-gray-800">Completed ({completedCount})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-[#475569] border border-white" />
                <span className="text-gray-600">No Request ({noRequestCount})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-[#0a4d2c] border-2 border-white shadow-2xs" />
                <span className="font-bold text-gray-800">Your Location</span>
              </div>
            </div>

            <div className="text-[11px] text-gray-500 flex items-center gap-1 font-medium">
              <Info className="w-3.5 h-3.5 text-emerald-600" />
              <span>Dashed green line shows collection route order</span>
            </div>
          </div>
        </div>

        {/* RIGHT SIDEBAR: TODAY'S ROUTE & REGISTERED HOUSEHOLDS (1 COL) */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-emerald-100 shadow-md space-y-4 flex flex-col">
          {/* Sidebar Tabs */}
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-2xl w-full">
              <button
                onClick={() => setSidebarTab('route')}
                className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  sidebarTab === 'route'
                    ? 'bg-[#0a4d2c] text-white shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Truck className="w-3.5 h-3.5" />
                <span>Today's Route ({routeStops.length})</span>
              </button>
              <button
                onClick={() => setSidebarTab('allHouses')}
                className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  sidebarTab === 'allHouses'
                    ? 'bg-[#0a4d2c] text-white shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Home className="w-3.5 h-3.5" />
                <span>All Houses ({sortedRegisteredHouses.length})</span>
              </button>
            </div>
          </div>

          {/* List Content */}
          {sidebarTab === 'route' ? (
            /* TODAY'S ROUTE LIST */
            routeStops.length === 0 ? (
              <div className="py-12 text-center text-gray-500 space-y-2 flex-1 flex flex-col justify-center">
                <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500" />
                <p className="text-sm font-extrabold text-gray-800">No Active Stops on Route</p>
                <p className="text-xs text-gray-500 max-w-xs mx-auto">
                  All assigned pickups for this cycle are either completed or no new requests have been submitted.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5 overflow-y-auto max-h-[460px] pr-1 flex-1 custom-scrollbar">
                {routeStops.map((stop) => {
                  const isSelected = selectedStopId === (stop.id || stop.citizenId || stop.houseNumber);
                  const isCompleted = stop.pickupStatus === 'Completed';
                  const isScheduled = stop.pickupStatus === 'Scheduled';

                  return (
                    <div
                      key={stop.id || stop.citizenId || stop.houseNumber}
                      onClick={() => handleSelectStop(stop)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-50/90 border-emerald-500 shadow-xs ring-1 ring-emerald-500'
                          : isCompleted
                          ? 'bg-gray-50/70 border-gray-200 hover:border-emerald-300'
                          : isScheduled
                          ? 'bg-sky-50/50 border-sky-200 hover:border-sky-400'
                          : 'bg-white border-emerald-100 hover:border-emerald-400 hover:shadow-2xs'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        {/* Stop Number Badge */}
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-extrabold text-xs shrink-0 shadow-2xs ${
                          isCompleted
                            ? 'bg-emerald-600 text-white'
                            : isScheduled
                            ? 'bg-sky-600 text-white'
                            : 'bg-amber-500 text-white'
                        }`}>
                          {isCompleted ? '✓' : `#${stop.stopNumber}`}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-extrabold text-gray-900 truncate">
                              {stop.fullName || 'Citizen'}
                            </p>
                            <span className="text-[10px] font-bold text-gray-400">
                              ~{stop.distanceMeters ? `${(stop.distanceMeters / 1000).toFixed(1)} km` : '<1 km'}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-[#0a4d2c] font-mono font-black text-[10px]">
                              House #{stop.houseNumber || 'N/A'}
                            </span>
                            <span className="text-[11px] text-gray-500 truncate">
                              {stop.address || stop.houseName || `${wardId} Resident`}
                            </span>
                          </div>

                          <div className="pt-2 flex items-center justify-between">
                            {isCompleted ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                                <Check className="w-3 h-3 text-emerald-600" /> Done
                              </span>
                            ) : isScheduled ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-sky-800 bg-sky-100 px-2 py-0.5 rounded-full">
                                <Calendar className="w-3 h-3 text-sky-600" /> Scheduled
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                                <Clock className="w-3 h-3 text-amber-600" /> Pending Pickup
                              </span>
                            )}

                            <a
                              href={`https://www.google.com/maps/dir/?api=1&destination=${stop.latitude},${stop.longitude}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-[#0a4d2c] hover:underline"
                            >
                              <span>Google Maps</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            /* ALL REGISTERED HOUSES LIST */
            <div className="space-y-2.5 overflow-y-auto max-h-[460px] pr-1 flex-1 custom-scrollbar">
              {sortedRegisteredHouses.map((h) => {
                const isSelected = selectedStopId === (h.id || h.citizenId || h.houseNumber);
                const status = h.pickupStatus;

                return (
                  <div
                    key={h.id || h.citizenId || h.houseNumber}
                    onClick={() => handleSelectStop(h)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-50/90 border-emerald-500 shadow-xs ring-1 ring-emerald-500'
                        : 'bg-white border-gray-200 hover:border-emerald-400 hover:shadow-2xs'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center font-mono font-black text-xs text-[#0a4d2c] shrink-0">
                          #{h.houseNumber || '?'}
                        </span>
                        <div className="min-w-0">
                          <p className="text-xs font-extrabold text-gray-900 truncate">{h.fullName}</p>
                          <p className="text-[11px] text-gray-500 truncate">{h.address || h.houseName || 'Ward Household'}</p>
                        </div>
                      </div>

                      {/* Status badge */}
                      {status === 'Completed' ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 shrink-0">
                          ✓ Done
                        </span>
                      ) : status === 'Scheduled' ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-sky-100 text-sky-800 shrink-0">
                          Scheduled
                        </span>
                      ) : status === 'Pending' ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 shrink-0">
                          Pending
                        </span>
                      ) : status === 'Failed' ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 shrink-0">
                          Failed
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-600 shrink-0">
                          No Request
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Quick Info Box */}
          <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-100 text-xs text-emerald-950 space-y-1 mt-auto">
            <p className="font-extrabold flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span>House-to-House Pickup Protocol</span>
            </p>
            <p className="text-gray-600 text-[11px]">
              Tap any house number on map or sidebar to view resident details. Verify 4-digit citizen OTP code upon waste handover.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkerCollectionMap;
