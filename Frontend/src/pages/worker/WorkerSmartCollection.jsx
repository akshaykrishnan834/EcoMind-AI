import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Route,
  Navigation,
  Target,
  Compass,
  CheckCircle2,
  Clock,
  Home,
  User,
  Phone,
  Truck,
  Search,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Info,
  Calendar,
  AlertCircle,
  MapPin,
  Building2,
  Check,
  ChevronRight,
  Sparkles,
  SlidersHorizontal,
  ArrowRight,
  Maximize2,
  CheckCircle,
  SkipForward,
  Layers,
  Map as MapIcon,
  ListOrdered
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Tooltip, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getCitizensByWard } from '../../services/citizenService';
import { getWardPickupRequests } from '../../services/pickupRequestService';
import OTPVerificationModal from '../../components/OTPVerificationModal';

// Fix Leaflet marker icons in React Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Haversine distance calculator in meters
const getDistanceMeters = (p1, p2) => {
  if (!p1 || !p2 || !p1[0] || !p2[0]) return 0;
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

// 2-Opt local optimization to untangle crossing paths in snake route
const optimize2Opt = (routePoints) => {
  if (routePoints.length <= 3) return routePoints;
  let points = [...routePoints];
  let improved = true;
  let iterations = 0;
  const maxIterations = 40;

  const dist = (a, b) => getDistanceMeters([a.latitude, a.longitude], [b.latitude, b.longitude]);

  while (improved && iterations < maxIterations) {
    improved = false;
    iterations++;
    for (let i = 0; i < points.length - 2; i++) {
      for (let j = i + 2; j < points.length; j++) {
        const dCurrent = dist(points[i], points[i + 1]) + (j + 1 < points.length ? dist(points[j], points[j + 1]) : 0);
        const dReversed = dist(points[i], points[j]) + (j + 1 < points.length ? dist(points[i + 1], points[j + 1]) : 0);

        if (dReversed < dCurrent) {
          // Reverse sub-array between i+1 and j
          const sub = points.slice(i + 1, j + 1).reverse();
          points.splice(i + 1, j - i, ...sub);
          improved = true;
        }
      }
    }
  }
  return points;
};

// Numbered Map Pin Generator with High Contrast and Visual States
const createSmartPinIcon = (stopNumber, status, houseNumber, isNextTarget, isSelected) => {
  const isCompleted = status === 'Completed';
  const cleanHouse = houseNumber ? `#${houseNumber}` : '🏠';

  // Completed Visual State: Soft light green, clear checkmark, slightly dimmed
  if (isCompleted) {
    return L.divIcon({
      className: 'smart-pin-completed',
      html: `
        <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer; user-select: none;">
          ${stopNumber ? `
            <div style="
              position: absolute;
              top: -8px;
              right: -8px;
              background: #047857;
              color: #ecfdf5;
              border: 1.5px solid #ffffff;
              border-radius: 9999px;
              font-size: 10px;
              font-weight: 900;
              min-width: 18px;
              height: 18px;
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 0 4px;
              box-shadow: 0 1px 4px rgba(0,0,0,0.25);
              z-index: 10;
            ">#${stopNumber}</div>
          ` : ''}
          <div style="
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            border: 2px solid #ffffff;
            border-radius: 12px;
            padding: 3px 8px;
            display: flex;
            align-items: center;
            gap: 4px;
            color: #ffffff;
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
            white-space: nowrap;
            box-shadow: 0 2px 8px rgba(16, 185, 129, 0.4);
            opacity: 0.88;
          ">
            <span style="font-size: 11px; font-weight: 900; color: #d1fae5;">✓</span>
            <span style="font-weight: 800; font-size: 11px; letter-spacing: -0.2px;">${cleanHouse}</span>
          </div>
          <div style="
            width: 0;
            height: 0;
            border-left: 5px solid transparent;
            border-right: 5px solid transparent;
            border-top: 6px solid #059669;
            margin-top: -1px;
          "></div>
        </div>
      `,
      iconSize: [56, 40],
      iconAnchor: [28, 40],
      popupAnchor: [0, -40],
    });
  }

  // Next Recommended Target: High-contrast amber/emerald with glowing beacon ring
  if (isNextTarget) {
    return L.divIcon({
      className: 'smart-pin-next-target',
      html: `
        <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer; user-select: none;">
          <div style="
            position: absolute;
            top: -10px;
            right: -10px;
            background: #d97706;
            color: #ffffff;
            border: 2px solid #ffffff;
            border-radius: 9999px;
            font-size: 11px;
            font-weight: 900;
            min-width: 22px;
            height: 22px;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 0 4px;
            box-shadow: 0 3px 8px rgba(217, 119, 6, 0.6);
            z-index: 12;
            animation: bounce 1.8s infinite;
          ">#${stopNumber}</div>
          <div style="
            background: linear-gradient(135deg, #0a4d2c 0%, #065f46 100%);
            border: 3px solid #fbbf24;
            border-radius: 14px;
            padding: 4px 9px;
            display: flex;
            align-items: center;
            gap: 5px;
            color: #ffffff;
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
            white-space: nowrap;
            box-shadow: 0 0 0 4px rgba(251, 191, 36, 0.45), 0 8px 18px rgba(0,0,0,0.35);
            transform: scale(1.1);
          ">
            <span style="font-size: 11px;">📍</span>
            <span style="font-weight: 900; font-size: 12px; letter-spacing: -0.2px; color: #fef08a;">${cleanHouse}</span>
          </div>
          <div style="
            width: 0;
            height: 0;
            border-left: 6px solid transparent;
            border-right: 6px solid transparent;
            border-top: 7px solid #fbbf24;
            margin-top: -1px;
          "></div>
        </div>
      `,
      iconSize: [64, 46],
      iconAnchor: [32, 46],
      popupAnchor: [0, -46],
    });
  }

  // Standard Pending / Scheduled Pickups: Numbered 1, 2, 3...
  return L.divIcon({
    className: 'smart-pin-pending',
    html: `
      <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer; user-select: none;">
        ${stopNumber ? `
          <div style="
            position: absolute;
            top: -8px;
            right: -8px;
            background: #0f172a;
            color: #f8fafc;
            border: 2px solid #ffffff;
            border-radius: 9999px;
            font-size: 10px;
            font-weight: 900;
            min-width: 20px;
            height: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 0 4px;
            box-shadow: 0 2px 6px rgba(0,0,0,0.35);
            z-index: 10;
          ">#${stopNumber}</div>
        ` : ''}
        <div style="
          background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
          border: 2px solid ${isSelected ? '#10b981' : '#ffffff'};
          border-radius: 12px;
          padding: 3px 8px;
          display: flex;
          align-items: center;
          gap: 4px;
          color: white;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          white-space: nowrap;
          box-shadow: ${isSelected ? '0 0 0 4px rgba(16, 185, 129, 0.6), 0 4px 12px rgba(0,0,0,0.35)' : '0 3px 10px rgba(0,0,0,0.3)'};
        ">
          <span style="font-size: 10px;">📦</span>
          <span style="font-weight: 800; font-size: 11px; letter-spacing: -0.2px;">${cleanHouse}</span>
        </div>
        <div style="
          width: 0;
          height: 0;
          border-left: 5px solid transparent;
          border-right: 5px solid transparent;
          border-top: 6px solid #0f172a;
          margin-top: -1px;
        "></div>
      </div>
    `,
    iconSize: [56, 40],
    iconAnchor: [28, 40],
    popupAnchor: [0, -40],
  });
};

// Inactive / No-request Pin Generator (When toggle is off)
const createInactiveHousePinIcon = (houseNumber) => {
  const cleanHouse = houseNumber ? `#${houseNumber}` : '🏠';
  return L.divIcon({
    className: 'smart-pin-inactive',
    html: `
      <div style="display: flex; flex-direction: column; align-items: center; cursor: pointer; opacity: 0.65;">
        <div style="
          background: #64748b;
          border: 1.5px solid #ffffff;
          border-radius: 10px;
          padding: 2px 6px;
          display: flex;
          align-items: center;
          gap: 3px;
          color: white;
          font-family: ui-monospace, monospace;
          font-size: 10px;
          font-weight: 700;
          box-shadow: 0 1px 4px rgba(0,0,0,0.2);
        ">
          <span>🏠</span>
          <span>${cleanHouse}</span>
        </div>
        <div style="
          width: 0;
          height: 0;
          border-left: 4px solid transparent;
          border-right: 4px solid transparent;
          border-top: 5px solid #64748b;
        "></div>
      </div>
    `,
    iconSize: [46, 32],
    iconAnchor: [23, 32],
  });
};

// Pulsing Live Worker Location Pin
const createWorkerPinIcon = () => {
  return L.divIcon({
    className: 'custom-worker-pin',
    html: `
      <div style="position: relative; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center;">
        <div style="position: absolute; width: 40px; height: 40px; border-radius: 50%; background-color: rgba(16, 185, 129, 0.45); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
        <div style="width: 30px; height: 30px; border-radius: 50%; background: linear-gradient(135deg, #0a4d2c 0%, #059669 100%); border: 3px solid #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; color: white; font-size: 14px;">
          📍
        </div>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
};

// Component to dynamically animate map center updates
function MapRecenterView({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.setView(center, zoom, { animate: true, duration: 0.8 });
    }
  }, [center, zoom, map]);
  return null;
}

const getPolygonCenter = (polygon) => {
  if (!polygon || polygon.length === 0) return [9.5175, 76.7668];
  let latSum = 0;
  let lngSum = 0;
  for (const pt of polygon) {
    latSum += pt[0];
    lngSum += pt[1];
  }
  return [latSum / polygon.length, lngSum / polygon.length];
};

const WorkerSmartCollection = ({
  wardId = 'Ward 1',
  wardDetails = null,
  workerProfile = {},
  initialCitizens = []
}) => {
  const [citizens, setCitizens] = useState(initialCitizens || []);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [onlyPickupRequests, setOnlyPickupRequests] = useState(true); // Requirement 4: Toggle
  const [searchQuery, setSearchQuery] = useState('');
  const [workerLocation, setWorkerLocation] = useState(null);
  const [selectedStopId, setSelectedStopId] = useState(null);
  const [mapCenterOverride, setMapCenterOverride] = useState(null);
  const [mapZoom, setMapZoom] = useState(16);
  const [mobileTab, setMobileTab] = useState('map'); // 'map' | 'queue'
  const [skippedStopIds, setSkippedStopIds] = useState([]);

  // Modal for completing pickup with citizen's 4-digit code
  const [otpModalOpen, setOtpModalOpen] = useState(false);
  const [otpTargetRequest, setOtpTargetRequest] = useState(null);

  const watchIdRef = useRef(null);

  const wardCenter = useMemo(() => {
    if (wardDetails?.boundary && wardDetails.boundary.length >= 3) {
      return getPolygonCenter(wardDetails.boundary);
    }
    return [9.5175, 76.7668];
  }, [wardDetails]);

  // Load backend citizens and ward pickup requests
  const loadData = async () => {
    setLoading(true);
    try {
      const activeWorker = workerProfile.email || workerProfile.workerId || '';
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
      console.error('Error loading smart collection data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [wardId, workerProfile.email, workerProfile.workerId]);

  // Real-time GPS tracking
  useEffect(() => {
    if (!navigator.geolocation) {
      setWorkerLocation(wardCenter);
      return;
    }

    const success = (pos) => {
      setWorkerLocation([pos.coords.latitude, pos.coords.longitude]);
    };

    const err = () => {
      setWorkerLocation(wardCenter);
    };

    navigator.geolocation.getCurrentPosition(success, err, { enableHighAccuracy: true, timeout: 7000 });
    watchIdRef.current = navigator.geolocation.watchPosition(success, err, {
      enableHighAccuracy: true,
      maximumAge: 5000,
    });

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [wardCenter]);

  // Map each registered citizen with their latest pickup request
  const mappedHouseholds = useMemo(() => {
    return (citizens || []).map((citizen) => {
      const citizenIds = [
        citizen.citizenId,
        citizen.email,
        citizen.id,
        citizen._id
      ].filter(Boolean).map(s => String(s).trim().toLowerCase());

      const citizenHouse = String(citizen.houseNumber || '').trim().toLowerCase();

      // Find matching requests
      const citizenRequests = (requests || []).filter((r) => {
        const reqCitizenId = String(r.citizenId || '').trim().toLowerCase();
        const reqHouseNum = String(r.houseNumber || '').trim().toLowerCase();

        if (reqCitizenId && citizenIds.includes(reqCitizenId)) return true;
        if (citizenHouse && reqHouseNum && citizenHouse === reqHouseNum) return true;
        if (citizenHouse && reqCitizenId && citizenHouse === reqCitizenId) return true;
        return false;
      });

      citizenRequests.sort(
        (a, b) => new Date(b.requestedAt || b.collectionDate || b.createdAt || 0) -
                  new Date(a.requestedAt || a.collectionDate || a.createdAt || 0)
      );

      const latestReq = citizenRequests[0] || null;
      let pickupStatus = 'No Request';

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

  // Requirement 1: SEQUENTIAL SNAKE ROUTE (Nearest Neighbor + 2-Opt TSP)
  const orderedRouteStops = useMemo(() => {
    const origin = workerLocation || wardCenter;

    // Filter households that have an active request: Pending, Scheduled, or Completed
    const requestedStops = mappedHouseholds.filter(
      (h) => h.hasPin && (h.pickupStatus === 'Pending' || h.pickupStatus === 'Scheduled' || h.pickupStatus === 'Completed')
    );

    if (requestedStops.length === 0) return [];

    // Separate unvisited vs visited so pending stops come first in snake order, followed by completed stops
    const unvisited = requestedStops.filter(h => h.pickupStatus !== 'Completed');
    const visited = requestedStops.filter(h => h.pickupStatus === 'Completed');

    // Build Nearest-Neighbor chain for unvisited stops starting from worker location
    let currentPoint = origin;
    let pool = [...unvisited];
    const sequencedUnvisited = [];

    while (pool.length > 0) {
      let bestIdx = 0;
      let bestDist = Infinity;
      for (let i = 0; i < pool.length; i++) {
        const d = getDistanceMeters(currentPoint, [pool[i].latitude, pool[i].longitude]);
        if (d < bestDist) {
          bestDist = d;
          bestIdx = i;
        }
      }
      const chosen = pool.splice(bestIdx, 1)[0];
      sequencedUnvisited.push(chosen);
      currentPoint = [chosen.latitude, chosen.longitude];
    }

    // Apply 2-Opt optimization to eliminate zig-zag / crossing paths
    const optimizedUnvisited = optimize2Opt(sequencedUnvisited);

    // Combine: Unvisited snake route first, then already completed stops
    const fullSequence = [...optimizedUnvisited, ...visited];

    // Assign sequential numbers 1, 2, 3...
    return fullSequence.map((stop, idx) => ({
      ...stop,
      stopNumber: idx + 1,
      distanceFromWorker: getDistanceMeters(origin, [stop.latitude, stop.longitude]),
    }));
  }, [mappedHouseholds, workerLocation, wardCenter]);

  // Requirement 6: COLLECTION PROGRESS
  const stats = useMemo(() => {
    const totalStops = orderedRouteStops.length;
    const completedCount = orderedRouteStops.filter(s => s.pickupStatus === 'Completed').length;
    const pendingCount = totalStops - completedCount;
    const percent = totalStops > 0 ? Math.round((completedCount / totalStops) * 100) : 0;

    // Estimate total route distance in meters
    let totalMeters = 0;
    if (workerLocation && orderedRouteStops.length > 0) {
      totalMeters += orderedRouteStops[0].distanceFromWorker;
      for (let i = 0; i < orderedRouteStops.length - 1; i++) {
        totalMeters += getDistanceMeters(
          [orderedRouteStops[i].latitude, orderedRouteStops[i].longitude],
          [orderedRouteStops[i + 1].latitude, orderedRouteStops[i + 1].longitude]
        );
      }
    }

    return {
      totalStops,
      completedCount,
      pendingCount,
      percent,
      totalDistanceKm: (totalMeters / 1000).toFixed(1)
    };
  }, [orderedRouteStops, workerLocation]);

  // Requirement 5: NEXT RECOMMENDED HOUSE
  // Find first uncompleted stop in sequential order that wasn't skipped
  const nextRecommendedStop = useMemo(() => {
    const uncompleted = orderedRouteStops.filter(s => s.pickupStatus !== 'Completed');
    if (uncompleted.length === 0) return null;

    // Prioritize unskipped stops, else fall back to first uncompleted
    const candidate = uncompleted.find(s => !skippedStopIds.includes(s.citizenId || s.houseNumber)) || uncompleted[0];
    return candidate;
  }, [orderedRouteStops, skippedStopIds]);

  // Sequential Polyline (Worker -> Stop 1 -> Stop 2 -> ...)
  const snakePolyline = useMemo(() => {
    const coords = [];
    if (workerLocation) coords.push(workerLocation);
    // Only connect uncompleted stops in active collection sequence, or all stops if worker wants full day path
    orderedRouteStops.forEach(stop => {
      coords.push([stop.latitude, stop.longitude]);
    });
    return coords;
  }, [workerLocation, orderedRouteStops]);

  // Filter pins to display on map based on "Only Pickup Requests" toggle
  const displayedPins = useMemo(() => {
    let list = mappedHouseholds.filter(h => h.hasPin);

    if (onlyPickupRequests) {
      // Show only requested houses
      list = list.filter(
        h => h.pickupStatus === 'Pending' || h.pickupStatus === 'Scheduled' || h.pickupStatus === 'Completed'
      );
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(h => {
        const reqId = (h.pickupRequest?.requestId || '').toLowerCase();
        const matchesName = (h.fullName || '').toLowerCase().includes(q);
        const matchesHouse = (h.houseNumber || '').toLowerCase().includes(q);
        const matchesPhone = (h.phoneNumber || h.phone || '').includes(q);
        return matchesName || matchesHouse || matchesPhone || reqId.includes(q);
      });
    }

    return list;
  }, [mappedHouseholds, onlyPickupRequests, searchQuery]);

  // Map stop number lookup map
  const stopNumberMap = useMemo(() => {
    const map = {};
    orderedRouteStops.forEach(stop => {
      const key = String(stop.citizenId || stop.id || stop.houseNumber).toLowerCase();
      map[key] = stop.stopNumber;
      if (stop.houseNumber) {
        map[String(stop.houseNumber).toLowerCase()] = stop.stopNumber;
      }
    });
    return map;
  }, [orderedRouteStops]);

  // Focus on a stop on the map
  const handleFocusStop = (stop) => {
    setSelectedStopId(stop.citizenId || stop.id || stop.houseNumber);
    if (stop.latitude && stop.longitude) {
      setMapCenterOverride([stop.latitude, stop.longitude]);
      setMapZoom(18);
    }
  };

  // Open Google Maps navigation to coordinates
  const handleOpenGoogleMaps = (lat, lng) => {
    if (!lat || !lng) return;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    window.open(url, '_blank');
  };

  // Skip stop to next pending
  const handleSkipStop = (stopId) => {
    if (!stopId) return;
    setSkippedStopIds(prev => [...prev, stopId]);
  };

  // Complete pickup modal handler
  const handleTriggerComplete = (request) => {
    if (!request || !request.requestId) return;
    setOtpTargetRequest(request);
    setOtpModalOpen(true);
  };

  // On successful OTP verification
  const handleOtpSuccess = (completedRequestId) => {
    // Update local state immediately for instant feedback
    setRequests(prev => prev.map(req => {
      if (req.requestId === completedRequestId) {
        return { ...req, status: 'Completed' };
      }
      return req;
    }));
    // Remove from skipped list if it was there
    setSkippedStopIds(prev => prev.filter(id => id !== otpTargetRequest?.citizenId && id !== otpTargetRequest?.houseNumber));
    // Reload data in background to sync server
    loadData();
  };

  const currentDateFormatted = useMemo(() => {
    return new Intl.DateTimeFormat('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }).format(new Date());
  }, []);

  return (
    <div className="space-y-4 max-w-7xl mx-auto animate-fadeIn pb-12">
      {/* 1. TOP HEADER & COLLECTION PROGRESS BAR (Requirement 6) */}
      <div className="bg-white dark:bg-[#14231b] rounded-3xl p-5 sm:p-6 border border-emerald-100 dark:border-emerald-800/60 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-500 text-white flex items-center gap-1.5 shadow-2xs">
                <Sparkles className="w-3.5 h-3.5" />
                Smart Collection AI Route
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 text-[#0a4d2c] dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                {wardDetails?.wardName ? `${wardDetails.wardName} (${wardDetails.wardId})` : wardId}
                {wardDetails?.panchayatName ? ` • ${wardDetails.panchayatName}` : ''}
              </span>
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                {currentDateFormatted}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight">
              Sequential Route & Doorstep Navigation
            </h1>
          </div>

          {/* Quick Refresh & Controls */}
          <div className="flex items-center gap-2 self-start md:self-auto">
            <button
              onClick={loadData}
              disabled={loading}
              className="p-2.5 rounded-2xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:hover:bg-emerald-900 text-[#0a4d2c] dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 transition-all cursor-pointer"
              title="Refresh route and pickup status"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            {/* Requirement 4: ONLY PICKUP REQUESTS TOGGLE */}
            <label className="flex items-center gap-2 px-3.5 py-2 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 rounded-2xl text-xs font-bold text-gray-800 dark:text-emerald-200 cursor-pointer select-none hover:bg-emerald-100/70 transition-colors">
              <input
                type="checkbox"
                checked={onlyPickupRequests}
                onChange={(e) => setOnlyPickupRequests(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500 cursor-pointer"
              />
              <span>Only Pickup Requests</span>
            </label>
          </div>
        </div>

        {/* Live Progress Bar Section */}
        <div className="bg-gray-50 dark:bg-emerald-950/30 p-4 rounded-2xl border border-gray-100 dark:border-emerald-900/40 space-y-2.5">
          <div className="flex items-center justify-between text-xs font-extrabold">
            <span className="text-gray-700 dark:text-gray-200 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Collection Progress:</span>
              <span className="text-emerald-800 dark:text-emerald-300 font-black text-sm">
                {stats.completedCount} / {stats.totalStops} Houses Completed
              </span>
            </span>
            <span className="text-emerald-700 dark:text-emerald-400 font-black text-sm">
              {stats.percent}%
            </span>
          </div>

          <div className="w-full bg-gray-200 dark:bg-gray-700 h-3 rounded-full overflow-hidden p-0.5">
            <div
              className="bg-gradient-to-r from-emerald-500 to-[#0a4d2c] h-full rounded-full transition-all duration-700 ease-out shadow-xs"
              style={{ width: `${stats.percent}%` }}
            />
          </div>

          {/* Stat Chips */}
          <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] font-bold">
            <span className="px-2.5 py-1 bg-emerald-100/70 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-200 rounded-lg flex items-center gap-1">
              <Check className="w-3 h-3 text-emerald-600" />
              {stats.completedCount} Completed
            </span>
            <span className="px-2.5 py-1 bg-amber-100/70 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 rounded-lg flex items-center gap-1">
              <Clock className="w-3 h-3 text-amber-600" />
              {stats.pendingCount} Remaining
            </span>
            <span className="px-2.5 py-1 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 rounded-lg flex items-center gap-1">
              <ListOrdered className="w-3 h-3 text-blue-600" />
              {stats.totalStops} Total Stops
            </span>
            <span className="px-2.5 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-lg flex items-center gap-1 ml-auto">
              <Navigation className="w-3 h-3 text-emerald-600" />
              ~{stats.totalDistanceKm} km Snake Route
            </span>
          </div>
        </div>
      </div>

      {/* Mobile Tab Switcher (< lg screens) */}
      <div className="flex lg:hidden bg-white dark:bg-[#14231b] p-1.5 rounded-2xl border border-emerald-100 dark:border-emerald-800/60 shadow-2xs">
        <button
          onClick={() => setMobileTab('map')}
          className={`flex-1 py-2 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            mobileTab === 'map'
              ? 'bg-[#0a4d2c] text-white shadow-xs'
              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-emerald-950/40'
          }`}
        >
          <MapIcon className="w-4 h-4" />
          <span>Interactive Route Map</span>
        </button>
        <button
          onClick={() => setMobileTab('queue')}
          className={`flex-1 py-2 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            mobileTab === 'queue'
              ? 'bg-[#0a4d2c] text-white shadow-xs'
              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-emerald-950/40'
          }`}
        >
          <ListOrdered className="w-4 h-4" />
          <span>Stops Queue ({stats.pendingCount} left)</span>
        </button>
      </div>

      {/* 2. MAIN LAYOUT: MAP + SIDEBAR / QUEUE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* LEFT/MAIN: Leaflet Map (Col 8) */}
        <div className={`lg:col-span-8 space-y-4 ${mobileTab === 'queue' ? 'hidden lg:block' : 'block'}`}>
          <div className="bg-white dark:bg-[#14231b] rounded-3xl p-3 sm:p-4 border border-emerald-100 dark:border-emerald-800/60 shadow-md relative overflow-hidden">
            {/* Map Action Toolbar */}
            <div className="flex items-center justify-between gap-2 pb-3 px-2 border-b border-gray-100 dark:border-emerald-800/40">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                <span className="text-xs font-extrabold text-gray-800 dark:text-white">
                  Live Field GPS Active
                </span>
              </div>

              <div className="flex items-center gap-2">
                {workerLocation && (
                  <button
                    onClick={() => {
                      setMapCenterOverride([...workerLocation]);
                      setMapZoom(17);
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:hover:bg-emerald-900 text-[#0a4d2c] dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[11px] font-bold rounded-xl transition cursor-pointer"
                    title="Center on Worker Location"
                  >
                    <Target className="w-3.5 h-3.5 text-emerald-600" />
                    <span>My Location</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    setMapCenterOverride([...wardCenter]);
                    setMapZoom(15);
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 text-[11px] font-bold rounded-xl transition cursor-pointer"
                  title="View Entire Ward"
                >
                  <Compass className="w-3.5 h-3.5 text-gray-500" />
                  <span>Full Ward</span>
                </button>
              </div>
            </div>

            {/* Map Container */}
            <div className="h-[460px] sm:h-[540px] w-full rounded-2xl overflow-hidden relative border border-gray-200 dark:border-emerald-900 shadow-inner">
              <MapContainer
                center={mapCenterOverride || wardCenter}
                zoom={mapZoom}
                scrollWheelZoom={true}
                className="h-full w-full z-0"
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <MapRecenterView center={mapCenterOverride} zoom={mapZoom} />

                {/* Worker Live Location Pin */}
                {workerLocation && (
                  <>
                    <Marker position={workerLocation} icon={createWorkerPinIcon()}>
                      <Popup>
                        <div className="text-xs p-1 font-sans">
                          <p className="font-extrabold text-[#0a4d2c]">📍 Your Current Location</p>
                          <p className="text-[10px] text-gray-500">Live GPS tracking active</p>
                        </div>
                      </Popup>
                    </Marker>
                    <Circle
                      center={workerLocation}
                      radius={35}
                      pathOptions={{ color: '#10b981', fillColor: '#10b981', fillOpacity: 0.15 }}
                    />
                  </>
                )}

                {/* Sequential Snake Route Polyline */}
                {snakePolyline.length >= 2 && (
                  <>
                    <Polyline
                      positions={snakePolyline}
                      pathOptions={{
                        color: '#059669',
                        weight: 4,
                        opacity: 0.85,
                        dashArray: '8, 8',
                        lineCap: 'round',
                        lineJoin: 'round'
                      }}
                    />
                  </>
                )}

                {/* Numbered House Pins */}
                {displayedPins.map((h) => {
                  const key = String(h.citizenId || h.id || h.houseNumber).toLowerCase();
                  const houseKey = h.houseNumber ? String(h.houseNumber).toLowerCase() : '';
                  const stopNum = stopNumberMap[key] || stopNumberMap[houseKey] || null;
                  const isNext = nextRecommendedStop && (nextRecommendedStop.citizenId === h.citizenId || nextRecommendedStop.houseNumber === h.houseNumber);
                  const isSelected = selectedStopId === (h.citizenId || h.id || h.houseNumber);

                  const icon = stopNum
                    ? createSmartPinIcon(stopNum, h.pickupStatus, h.houseNumber, isNext, isSelected)
                    : createInactiveHousePinIcon(h.houseNumber);

                  return (
                    <Marker
                      key={h.citizenId || h.id || `${h.latitude}-${h.longitude}`}
                      position={[h.latitude, h.longitude]}
                      icon={icon}
                      eventHandlers={{
                        click: () => handleFocusStop(h),
                      }}
                    >
                      <Popup>
                        <div className="p-1 min-w-[200px] font-sans space-y-2">
                          <div className="flex items-center justify-between border-b pb-1">
                            <span className="font-black text-[#0a4d2c] text-xs">
                              {stopNum ? `Stop #${stopNum} • House #${h.houseNumber}` : `House #${h.houseNumber}`}
                            </span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              h.pickupStatus === 'Completed'
                                ? 'bg-emerald-100 text-emerald-800'
                                : h.pickupStatus === 'Scheduled'
                                ? 'bg-blue-100 text-blue-800'
                                : h.pickupStatus === 'Pending'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-gray-100 text-gray-700'
                            }`}>
                              {h.pickupStatus}
                            </span>
                          </div>

                          <div className="text-xs space-y-0.5">
                            <p className="font-bold text-gray-900">{h.fullName || 'Citizen'}</p>
                            <p className="text-[11px] text-gray-500">{h.address || 'Ward Resident'}</p>
                            {h.phoneNumber && (
                              <a
                                href={`tel:${h.phoneNumber}`}
                                className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:underline pt-1"
                              >
                                <Phone className="w-3 h-3" />
                                {h.phoneNumber}
                              </a>
                            )}
                          </div>

                          {h.pickupRequest && h.pickupStatus !== 'Completed' && (
                            <button
                              onClick={() => handleTriggerComplete(h.pickupRequest)}
                              className="w-full mt-2 py-1.5 bg-[#0a4d2c] hover:bg-[#063820] text-white font-extrabold text-xs rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <ShieldCheck className="w-3.5 h-3.5" />
                              <span>Verify & Complete</span>
                            </button>
                          )}
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}
              </MapContainer>

              {/* Map Legend Overlay */}
              <div className="absolute bottom-3 left-3 z-[400] bg-white/95 dark:bg-[#14231b]/95 backdrop-blur-md px-3 py-2 rounded-2xl border border-emerald-100 dark:border-emerald-800 shadow-md text-[10px] font-bold space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <span className="text-gray-700 dark:text-gray-200">Pending Request (Numbered)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="text-gray-700 dark:text-gray-200">Completed (Light Green ✓)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-0.5 border-t-2 border-dashed border-emerald-600" />
                  <span className="text-gray-700 dark:text-gray-200">Snake Route Sequence</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT/SIDE PANEL: NEXT RECOMMENDED HOUSE & STOPS QUEUE (Col 4) */}
        <div className={`lg:col-span-4 space-y-4 ${mobileTab === 'map' ? 'hidden lg:block' : 'block'}`}>
          {/* Requirement 5: NEXT RECOMMENDED HOUSE FLOATING CARD */}
          {nextRecommendedStop ? (
            <div className="bg-gradient-to-br from-[#0a4d2c] via-[#0d5532] to-[#04331d] rounded-3xl p-5 text-white shadow-xl border border-emerald-500/30 space-y-4 relative overflow-hidden">
              <div className="absolute -right-8 -top-8 w-28 h-28 bg-emerald-400/10 rounded-full blur-2xl pointer-events-none" />

              {/* Card Header */}
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-full bg-amber-400 text-gray-950 font-black text-[11px] flex items-center gap-1.5 shadow-xs uppercase tracking-wider">
                  <span className="w-2 h-2 rounded-full bg-red-600 animate-ping" />
                  Next Stop #{nextRecommendedStop.stopNumber}
                </span>

                <span className="text-emerald-200 text-xs font-bold">
                  {nextRecommendedStop.distanceFromWorker}m away
                </span>
              </div>

              {/* House & Citizen Details */}
              <div className="space-y-1.5">
                <div className="flex items-baseline gap-2">
                  <h3 className="text-2xl font-black text-white tracking-tight">
                    House #{nextRecommendedStop.houseNumber || '—'}
                  </h3>
                  <span className="text-xs font-extrabold text-amber-300">
                    ({nextRecommendedStop.pickupStatus})
                  </span>
                </div>

                <p className="text-sm font-bold text-emerald-100 flex items-center gap-1.5">
                  <User className="w-4 h-4 text-emerald-300 shrink-0" />
                  <span>{nextRecommendedStop.fullName || 'Registered Citizen'}</span>
                </p>

                <p className="text-xs text-emerald-200/80 line-clamp-1 flex items-center gap-1.5">
                  <Home className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
                  <span>{nextRecommendedStop.address || 'Ward Household'}</span>
                </p>

                {nextRecommendedStop.phoneNumber && (
                  <div className="pt-1">
                    <a
                      href={`tel:${nextRecommendedStop.phoneNumber}`}
                      className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-xs font-extrabold text-white transition-all cursor-pointer"
                    >
                      <Phone className="w-3.5 h-3.5 text-emerald-300" />
                      <span>Call {nextRecommendedStop.phoneNumber}</span>
                    </a>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center gap-2.5">
                {/* Complete Pickup Button */}
                <button
                  onClick={() => handleTriggerComplete(nextRecommendedStop.pickupRequest)}
                  disabled={!nextRecommendedStop.pickupRequest}
                  className="flex-1 py-3 px-4 bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Complete Pickup</span>
                </button>

                {/* Navigate Button */}
                <button
                  onClick={() => {
                    handleFocusStop(nextRecommendedStop);
                    handleOpenGoogleMaps(nextRecommendedStop.latitude, nextRecommendedStop.longitude);
                  }}
                  className="p-3 bg-white/15 hover:bg-white/25 border border-white/25 text-white rounded-2xl transition cursor-pointer"
                  title="Open GPS Navigation in Google Maps"
                >
                  <Navigation className="w-4 h-4 text-emerald-300" />
                </button>

                {/* Skip to Next Button */}
                <button
                  onClick={() => handleSkipStop(nextRecommendedStop.citizenId || nextRecommendedStop.houseNumber)}
                  className="p-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-2xl transition cursor-pointer"
                  title="Skip to next pending house"
                >
                  <SkipForward className="w-4 h-4 text-gray-300" />
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-gradient-to-br from-emerald-700 to-[#0a4d2c] rounded-3xl p-6 text-white shadow-xl text-center space-y-3">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mx-auto text-2xl">
                🎉
              </div>
              <h3 className="text-lg font-black">All Pickups Completed!</h3>
              <p className="text-xs text-emerald-100">
                You have completed all scheduled household pickups in this route for today. Great job!
              </p>
            </div>
          )}

          {/* SEQUENTIAL QUEUE LIST (Requirement layout: 1. House 102 - Pending, 2. House 104 - Completed...) */}
          <div className="bg-white dark:bg-[#14231b] rounded-3xl p-5 border border-emerald-100 dark:border-emerald-800/60 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-emerald-800/40 pb-3">
              <div className="flex items-center gap-2">
                <ListOrdered className="w-4 h-4 text-[#0a4d2c] dark:text-emerald-400" />
                <h3 className="text-sm font-extrabold text-gray-900 dark:text-white">
                  Today's Route Queue
                </h3>
              </div>
              <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400">
                {orderedRouteStops.length} stops
              </span>
            </div>

            {/* Quick Filter / Search within Queue */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search house # or name..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-gray-50 dark:bg-emerald-950/30 border border-gray-200 dark:border-emerald-800/60 rounded-xl text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            {/* Scrollable Queue List */}
            <div className="max-h-[380px] overflow-y-auto space-y-2 pr-1 divide-y divide-gray-50 dark:divide-emerald-900/30">
              {orderedRouteStops.length === 0 ? (
                <p className="text-xs text-gray-500 text-center py-6">
                  No active pickup requests found for this ward today.
                </p>
              ) : (
                orderedRouteStops.map((stop) => {
                  const isCompleted = stop.pickupStatus === 'Completed';
                  const isTarget = nextRecommendedStop && (nextRecommendedStop.citizenId === stop.citizenId || nextRecommendedStop.houseNumber === stop.houseNumber);

                  return (
                    <div
                      key={stop.citizenId || stop.id || stop.houseNumber}
                      onClick={() => handleFocusStop(stop)}
                      className={`pt-2.5 first:pt-0 p-2.5 rounded-2xl transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isTarget
                          ? 'bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-700/60 shadow-2xs'
                          : isCompleted
                          ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 opacity-80'
                          : 'hover:bg-gray-50 dark:hover:bg-emerald-950/30 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {/* Number Badge */}
                        <div
                          className={`w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                            isCompleted
                              ? 'bg-emerald-500 text-white'
                              : isTarget
                              ? 'bg-amber-500 text-white animate-pulse'
                              : 'bg-gray-900 dark:bg-emerald-900 text-white'
                          }`}
                        >
                          {isCompleted ? '✓' : stop.stopNumber}
                        </div>

                        {/* Details */}
                        <div className="min-w-0">
                          <p className="text-xs font-black text-gray-900 dark:text-white truncate">
                            House {stop.houseNumber || '—'}
                          </p>
                          <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                            {stop.fullName || 'Citizen'} • {stop.distanceFromWorker}m
                          </p>
                        </div>
                      </div>

                      {/* Status Tag */}
                      <div className="shrink-0 flex items-center gap-1.5">
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                            isCompleted
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300'
                              : stop.pickupStatus === 'Scheduled'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300'
                          }`}
                        >
                          {stop.pickupStatus}
                        </span>

                        <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* OTP Verification Modal for Completing Pickups */}
      {otpModalOpen && otpTargetRequest && (
        <OTPVerificationModal
          isOpen={otpModalOpen}
          onClose={() => {
            setOtpModalOpen(false);
            setOtpTargetRequest(null);
          }}
          requestId={otpTargetRequest.requestId}
          workerId={workerProfile.email || workerProfile.workerId || 'WORKER001'}
          onSuccess={(reqId) => handleOtpSuccess(reqId)}
        />
      )}
    </div>
  );
};

export default WorkerSmartCollection;
