import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Navigation,
  MapPin,
  Compass,
  Target,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Award,
  Building2,
  Users,
  Info,
  Layers,
  Radio
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Polygon, Tooltip, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom pulsed worker icon
const createWorkerMarkerIcon = () => {
  return L.divIcon({
    className: 'custom-worker-pin',
    html: `
      <div style="position: relative; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;">
        <div style="position: absolute; width: 36px; height: 36px; border-radius: 50%; background-color: rgba(16, 185, 129, 0.4); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
        <div style="width: 28px; height: 28px; border-radius: 50%; background: linear-gradient(135deg, #0a4d2c 0%, #059669 100%); border: 3px solid #ffffff; box-shadow: 0 4px 10px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white; font-size: 14px;">
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

// Ray-casting point-in-polygon algorithm
const isPointInPolygon = (point, polygon) => {
  if (!point || !polygon || polygon.length < 3) return false;
  const [lat, lng] = point;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [latI, lngI] = polygon[i];
    const [latJ, lngJ] = polygon[j];

    const intersect =
      latI > lat !== latJ > lat &&
      lng < ((lngJ - lngI) * (lat - latI)) / (latJ - latI) + lngI;
    if (intersect) inside = !inside;
  }
  return inside;
};

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

const WorkerLocationZone = ({ wardDetails, wardCitizens = [], profile = {} }) => {
  const [workerLocation, setWorkerLocation] = useState(null);
  const [locationAccuracy, setLocationAccuracy] = useState(null);
  const [gpsStatus, setGpsStatus] = useState('locating'); // 'locating' | 'active' | 'error' | 'fallback'
  const [errorMessage, setErrorMessage] = useState('');
  const [mapCenterOverride, setMapCenterOverride] = useState(null);
  const [mapZoom, setMapZoom] = useState(15);
  const watchIdRef = useRef(null);

  // Determine ward center
  const wardCenter = useMemo(() => {
    if (wardDetails?.boundary && wardDetails.boundary.length >= 3) {
      return getPolygonCenter(wardDetails.boundary);
    }
    return [9.5583, 76.7842]; // Default Chirakkadavu area
  }, [wardDetails]);

  // Request & watch live GPS position
  useEffect(() => {
    if (!navigator.geolocation) {
      setGpsStatus('fallback');
      setErrorMessage('Geolocation is not supported by your browser.');
      setWorkerLocation(wardCenter);
      return;
    }

    const successHandler = (pos) => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      setWorkerLocation([lat, lng]);
      setLocationAccuracy(Math.round(pos.coords.accuracy));
      setGpsStatus('active');
    };

    const errorHandler = (err) => {
      console.warn('Geolocation error:', err.message);
      setGpsStatus('fallback');
      setErrorMessage(err.code === 1 ? 'Location permission denied. Using ward center fallback.' : 'Unable to retrieve location. Using ward center fallback.');
      // Use ward polygon center as fallback so map functions properly
      setWorkerLocation(wardCenter);
    };

    // Initial position
    navigator.geolocation.getCurrentPosition(successHandler, errorHandler, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 10000,
    });

    // Continuous watch
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

  // Compute inside/outside boundary status
  const isInsideBoundary = useMemo(() => {
    if (!workerLocation || !wardDetails?.boundary || wardDetails.boundary.length < 3) {
      return null;
    }
    return isPointInPolygon(workerLocation, wardDetails.boundary);
  }, [workerLocation, wardDetails]);

  // Effective map center
  const activeCenter = useMemo(() => {
    if (mapCenterOverride) return mapCenterOverride;
    if (workerLocation) return workerLocation;
    return wardCenter;
  }, [mapCenterOverride, workerLocation, wardCenter]);

  const handleCenterWorker = () => {
    if (workerLocation) {
      setMapCenterOverride([...workerLocation]);
      setMapZoom(16);
    }
  };

  const handleCenterWard = () => {
    setMapCenterOverride([...wardCenter]);
    setMapZoom(15);
  };

  const retryGPS = () => {
    setGpsStatus('locating');
    setErrorMessage('');
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setWorkerLocation([pos.coords.latitude, pos.coords.longitude]);
          setLocationAccuracy(Math.round(pos.coords.accuracy));
          setGpsStatus('active');
        },
        (err) => {
          setGpsStatus('fallback');
          setErrorMessage(err.message);
          setWorkerLocation(wardCenter);
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#0a4d2c] via-[#0f5b37] to-emerald-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-1/4 -translate-y-1/4 w-80 h-80 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 text-xs font-semibold">
              <Compass className="w-4 h-4 text-emerald-300" />
              <span>Real-Time Ward Zone Positioning</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              My Location & Boundary Zone
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100/90 max-w-xl">
              Monitor your real-time GPS coordinates against the official delimitation boundary for{' '}
              <span className="font-bold text-white">
                {wardDetails?.wardName ? `${wardDetails.wardName} (${wardDetails.wardId})` : profile.wardId || 'Assigned Ward'}
              </span>
              .
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleCenterWorker}
              className="flex items-center gap-2 px-4 py-2.5 bg-white text-[#0a4d2c] hover:bg-emerald-50 rounded-xl text-xs font-bold transition shadow-md cursor-pointer"
            >
              <Navigation className="w-4 h-4 text-[#0a4d2c]" />
              <span>Center on Me</span>
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

      {/* Boundary Status Banner */}
      <div className={`p-4 sm:p-5 rounded-2xl border shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
        isInsideBoundary === true
          ? 'bg-emerald-50/90 border-emerald-300 text-emerald-900'
          : isInsideBoundary === false
          ? 'bg-amber-50/90 border-amber-300 text-amber-900'
          : 'bg-blue-50/90 border-blue-200 text-blue-900'
      }`}>
        <div className="flex items-center gap-3.5">
          <div className={`p-3 rounded-2xl shrink-0 ${
            isInsideBoundary === true
              ? 'bg-emerald-600 text-white shadow-emerald-200 shadow-md'
              : isInsideBoundary === false
              ? 'bg-amber-600 text-white shadow-amber-200 shadow-md'
              : 'bg-blue-600 text-white'
          }`}>
            {isInsideBoundary === true ? (
              <CheckCircle2 className="w-6 h-6" />
            ) : isInsideBoundary === false ? (
              <AlertTriangle className="w-6 h-6" />
            ) : (
              <Radio className="w-6 h-6 animate-spin" />
            )}
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-extrabold">
                {isInsideBoundary === true
                  ? 'Inside Assigned Ward Boundary'
                  : isInsideBoundary === false
                  ? 'Outside Assigned Ward Boundary'
                  : 'Assessing Boundary Coordinates...'}
              </h2>
              <span className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                isInsideBoundary === true
                  ? 'bg-emerald-200 text-emerald-900'
                  : isInsideBoundary === false
                  ? 'bg-amber-200 text-amber-900'
                  : 'bg-blue-200 text-blue-900'
              }`}>
                {isInsideBoundary === true ? 'Authorized Zone' : isInsideBoundary === false ? 'Out of Bounds' : 'Verifying'}
              </span>
            </div>
            <p className="text-xs text-gray-600 mt-1">
              {isInsideBoundary === true
                ? `You are currently within ${wardDetails?.wardName || profile.wardId || 'your assigned ward'}. You are authorized to conduct door-to-door plastic pickup and fee collection.`
                : isInsideBoundary === false
                ? `Your current GPS position is located outside ${wardDetails?.wardName || profile.wardId || 'your assigned ward boundary'}. Ensure you are in the designated collection sector.`
                : 'Reading boundary polygon delimitation coordinates and GPS location...'}
            </p>
          </div>
        </div>

        {/* GPS Sensor Status Pill */}
        <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-gray-200 shrink-0 text-xs shadow-2xs">
          <span className={`w-2.5 h-2.5 rounded-full ${
            gpsStatus === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
          }`} />
          <span className="font-semibold text-gray-700">
            {gpsStatus === 'active' ? `GPS ±${locationAccuracy || 5}m` : 'Simulated / Fallback'}
          </span>
          {gpsStatus !== 'active' && (
            <button
              onClick={retryGPS}
              title="Retry live GPS"
              className="text-emerald-700 hover:text-emerald-900 ml-1 p-1 hover:bg-emerald-50 rounded cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-emerald-100 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Current Ward</span>
            <Building2 className="w-4 h-4 text-emerald-700" />
          </div>
          <p className="text-xl font-extrabold text-gray-900 truncate">
            {wardDetails?.wardName || profile.wardId || 'Ward 1'}
          </p>
          <p className="text-[11px] text-gray-500 font-medium truncate">
            {wardDetails?.panchayatName || 'Chirakkadavu'} Panchayat
          </p>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-emerald-100 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Worker ID</span>
            <Award className="w-4 h-4 text-emerald-700" />
          </div>
          <p className="text-xl font-extrabold text-emerald-800 truncate">
            {profile.email ? profile.email.split('@')[0].toUpperCase() : 'HKS-W01'}
          </p>
          <p className="text-[11px] text-gray-500 font-medium">
            Haritha Karma Sena Unit
          </p>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-emerald-100 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Delimitation</span>
            <Layers className="w-4 h-4 text-emerald-700" />
          </div>
          <p className="text-xl font-extrabold text-gray-900">
            {wardDetails?.boundary?.length ? `${wardDetails.boundary.length} Vertices` : 'Active'}
          </p>
          <p className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-600" /> Official K-SMART Map
          </p>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-emerald-100 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Ward Households</span>
            <Users className="w-4 h-4 text-emerald-700" />
          </div>
          <p className="text-xl font-extrabold text-gray-900">
            {wardCitizens.length} Registered
          </p>
          <p className="text-[11px] text-gray-500 font-medium">
            {wardCitizens.filter(c => c.latitude && c.longitude).length} mapped on GPS
          </p>
        </div>
      </div>

      {/* Interactive Leaflet Map */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-emerald-100 shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-50 text-[#0a4d2c]">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-gray-900">
                Live Zone Map & Assigned Boundary
              </h2>
              <p className="text-xs text-gray-500">
                Green polygon defines your authorized collection jurisdiction
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Live Position Tracking
            </span>
          </div>
        </div>

        {/* Map Container */}
        <div className="h-[460px] w-full rounded-2xl overflow-hidden border border-emerald-200 shadow-inner relative z-0">
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
                  color: isInsideBoundary === false ? '#d97706' : '#059669',
                  fillColor: isInsideBoundary === false ? '#fbbf24' : '#10b981',
                  fillOpacity: 0.2,
                  weight: 3,
                }}
              >
                <Tooltip sticky>
                  <div className="p-1 text-xs">
                    <p className="font-extrabold text-emerald-950 text-sm">
                      {wardDetails.wardName || wardDetails.wardId} Boundary Zone
                    </p>
                    <p className="text-gray-600 font-medium">
                      {wardDetails.panchayatName || 'Chirakkadavu'} Panchayat
                    </p>
                    <p className="text-emerald-700 text-[10px] font-bold mt-0.5">
                      Authorized Door-to-Door Pickup Area
                    </p>
                  </div>
                </Tooltip>
              </Polygon>
            )}

            {/* Worker Marker */}
            {workerLocation && (
              <>
                <Circle
                  center={workerLocation}
                  radius={locationAccuracy || 30}
                  pathOptions={{
                    color: '#059669',
                    fillColor: '#10b981',
                    fillOpacity: 0.15,
                    weight: 1,
                  }}
                />
                <Marker position={workerLocation} icon={createWorkerMarkerIcon()}>
                  <Popup>
                    <div className="p-2 text-xs min-w-[180px] space-y-1">
                      <p className="font-extrabold text-[#0a4d2c] text-sm flex items-center gap-1">
                        <span>📍</span> {profile.fullName || 'You (Worker)'}
                      </p>
                      <p className="text-gray-600 font-medium">
                        Role: Haritha Karma Sena Worker
                      </p>
                      <p className="text-gray-600 font-medium">
                        Assigned: {wardDetails?.wardName || profile.wardId || 'Ward 1'}
                      </p>
                      <div className="pt-1">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isInsideBoundary
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {isInsideBoundary ? '✓ Inside Ward Zone' : '⚠ Outside Ward Zone'}
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-400 pt-1">
                        {workerLocation[0].toFixed(5)}, {workerLocation[1].toFixed(5)}
                      </p>
                    </div>
                  </Popup>
                </Marker>
              </>
            )}

            {/* Citizen House Pins */}
            {wardCitizens.map((citizen, idx) => {
              if (!citizen.latitude || !citizen.longitude) return null;
              return (
                <Marker
                  key={citizen.id || citizen.email || idx}
                  position={[citizen.latitude, citizen.longitude]}
                >
                  <Popup>
                    <div className="p-2 text-xs space-y-1 min-w-[170px]">
                      <p className="font-bold text-gray-900 text-sm">
                        {citizen.fullName || 'Citizen Household'}
                      </p>
                      <p className="text-gray-600">
                        <span className="font-semibold">House No:</span> {citizen.houseNumber || 'N/A'}
                      </p>
                      <p className="text-gray-600">
                        <span className="font-semibold">Address:</span> {citizen.address || 'N/A'}
                      </p>
                      <p className="text-gray-600">
                        <span className="font-semibold">Phone:</span> {citizen.phone || 'N/A'}
                      </p>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-between text-xs text-gray-600 gap-3 pt-2">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-full bg-[#0a4d2c] border-2 border-white shadow-xs" />
              <span className="font-bold text-gray-800">Your Real-time Location</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded bg-emerald-500/30 border-2 border-emerald-600" />
              <span className="font-bold text-gray-800">Assigned Ward Delimitation Boundary</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-600 border border-white" />
              <span className="text-gray-600">Registered Citizen Households ({wardCitizens.filter(c => c.latitude).length})</span>
            </div>
          </div>

          <div className="text-[11px] text-gray-500 flex items-center gap-1 font-medium">
            <Info className="w-3.5 h-3.5 text-emerald-600" />
            <span>Updated with official LSGD delimitation data</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkerLocationZone;
