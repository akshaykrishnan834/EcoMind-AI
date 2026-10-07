import React, { useState, useEffect, useRef } from 'react';
import {
  Navigation,
  Radio,
  CheckCircle2,
  AlertTriangle,
  LocateFixed,
  Clock,
  ShieldCheck,
  Zap,
  Power,
  RotateCcw
} from 'lucide-react';
import { updateDutyStatus } from '../services/workerService';

// Ray-casting point-in-polygon test
const checkInsidePolygon = (lat, lng, polygon) => {
  if (!polygon || !Array.isArray(polygon) || polygon.length < 3) return true; // Default to inside if no boundary defined
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

const WorkerDutyToggle = ({ profile = {}, wardDetails = null, onStatusChange }) => {
  const workerEmail = profile.email || '';
  const workerId = profile.workerId || profile.id || 'WORKER001';
  const wardId = profile.wardId || 'Ward 1';

  // Check saved duty state
  const [isOnDuty, setIsOnDuty] = useState(() => {
    try {
      const cached = localStorage.getItem(`ecomind_worker_duty_${workerEmail || workerId}`);
      if (cached) {
        return Boolean(JSON.parse(cached).isOnDuty);
      }
    } catch {
      // ignore
    }
    return false;
  });

  const [coords, setCoords] = useState(() => {
    // Default coords based on Ponkunnam, Kerala
    return { lat: 9.5583, lng: 76.7842 };
  });
  const [isUpdating, setIsUpdating] = useState(false);
  const [lastUpdatedTime, setLastUpdatedTime] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [gpsAccuracy, setGpsAccuracy] = useState(null);
  const watchIdRef = useRef(null);

  const wardBoundary = wardDetails?.boundary || null;
  const isInsideWard = checkInsidePolygon(coords.lat, coords.lng, wardBoundary);

  // Sync duty status to server & storage
  const syncDuty = async (newDutyState, newLat, newLng) => {
    setIsUpdating(true);
    setErrorMsg('');
    const latitude = newLat !== undefined ? newLat : coords.lat;
    const longitude = newLng !== undefined ? newLng : coords.lng;

    try {
      await updateDutyStatus({
        email: workerEmail,
        workerId: workerId,
        wardId: wardId,
        isOnDuty: newDutyState,
        latitude: latitude,
        longitude: longitude
      });
      setLastUpdatedTime(new Date().toLocaleTimeString());
      if (onStatusChange) {
        onStatusChange({ isOnDuty: newDutyState, lat: latitude, lng: longitude });
      }
    } catch (err) {
      console.warn('Duty sync warning:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  // Toggle on/off duty
  const handleToggleDuty = () => {
    const nextState = !isOnDuty;
    setIsOnDuty(nextState);

    if (nextState) {
      // Attempt real device GPS
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const newLat = pos.coords.latitude;
            const newLng = pos.coords.longitude;
            setCoords({ lat: newLat, lng: newLng });
            setGpsAccuracy(Math.round(pos.coords.accuracy));
            syncDuty(true, newLat, newLng);
          },
          (err) => {
            console.warn('Geolocation warning (using ward center coordinates):', err.message);
            // Fallback to ward center
            const fallbackLat = wardBoundary && wardBoundary[0] ? wardBoundary[0][0] : 9.5583;
            const fallbackLng = wardBoundary && wardBoundary[0] ? wardBoundary[0][1] : 76.7842;
            setCoords({ lat: fallbackLat, lng: fallbackLng });
            syncDuty(true, fallbackLat, fallbackLng);
          },
          { enableHighAccuracy: true, timeout: 8000 }
        );
      } else {
        syncDuty(true);
      }
    } else {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      syncDuty(false);
    }
  };

  // Simulation button for demonstrations & viva: moves worker along ward street
  const handleSimulateMovement = () => {
    const jitterLat = coords.lat + (Math.random() - 0.48) * 0.0012;
    const jitterLng = coords.lng + (Math.random() - 0.48) * 0.0012;
    setCoords({ lat: jitterLat, lng: jitterLng });
    setGpsAccuracy(5);
    syncDuty(true, jitterLat, jitterLng);
  };

  useEffect(() => {
    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  return (
    <div className={`p-4 sm:p-5 rounded-3xl border transition-all duration-300 shadow-md ${
      isOnDuty
        ? 'bg-gradient-to-r from-emerald-950 via-[#0b3d22] to-emerald-900 border-emerald-500/50 text-white'
        : 'bg-white dark:bg-[#14181d] border-gray-200/80 dark:border-white/10 text-gray-800 dark:text-gray-100'
    }`}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left Side: Status & Badges */}
        <div className="flex items-start sm:items-center gap-3.5">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-all ${
            isOnDuty
              ? 'bg-emerald-500/20 text-emerald-300 ring-2 ring-emerald-400/40 shadow-inner'
              : 'bg-gray-100 dark:bg-white/5 text-gray-400'
          }`}>
            {isOnDuty ? (
              <Radio className="w-6 h-6 animate-pulse text-emerald-400" />
            ) : (
              <Power className="w-6 h-6 text-gray-400" />
            )}
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`text-[11px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                isOnDuty
                  ? 'bg-emerald-400/20 text-emerald-300 border border-emerald-400/40'
                  : 'bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400'
              }`}>
                {isOnDuty ? '🟢 On Duty • Live Broadcast Active' : '⚪ Off Duty • Inactive'}
              </span>

              {isOnDuty && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                  isInsideWard
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-400/30'
                }`}>
                  {isInsideWard ? (
                    <>
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      <span>Inside {wardId} Boundary</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-3 h-3 text-amber-400" />
                      <span>Outside Ward Boundary</span>
                    </>
                  )}
                </span>
              )}
            </div>

            <h3 className={`text-base sm:text-lg font-black mt-1 ${
              isOnDuty ? 'text-white' : 'text-gray-900 dark:text-white'
            }`}>
              {isOnDuty
                ? `Active in ${wardDetails?.wardName ? `${wardDetails.wardName} (${wardId})` : wardId}`
                : 'Haritha Karma Sena Field Collection'}
            </h3>

            <p className={`text-xs font-medium ${
              isOnDuty ? 'text-emerald-200/90' : 'text-gray-500 dark:text-gray-400'
            }`}>
              {isOnDuty
                ? 'Citizens in your ward can view your live vehicle proximity on their dashboard map.'
                : 'Turn ON Duty when starting collection rounds so ward households receive doorstep approach alerts.'}
            </p>
          </div>
        </div>

        {/* Right Side: Actions & Controls */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 shrink-0 self-end sm:self-center">
          {isOnDuty && (
            <button
              type="button"
              onClick={handleSimulateMovement}
              disabled={isUpdating}
              title="Simulates moving 50m forward on ward route (useful for testing)"
              className="px-3 py-2 rounded-xl text-xs font-bold bg-white/15 hover:bg-white/25 text-emerald-200 hover:text-white border border-white/20 flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
            >
              <Zap className="w-3.5 h-3.5 text-amber-300" />
              <span>Simulate Move</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleToggleDuty}
            disabled={isUpdating}
            className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer shadow-md ${
              isOnDuty
                ? 'bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white shadow-rose-900/30'
                : 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-emerald-900/20'
            }`}
          >
            <Power className="w-4 h-4" />
            <span>{isOnDuty ? 'End Shift (Go Off Duty)' : 'Go On Duty (Start Route)'}</span>
          </button>
        </div>
      </div>

      {/* Footer Info Strip */}
      {isOnDuty && (
        <div className="mt-3.5 pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-[11px] text-emerald-200/80">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 font-mono">
              <LocateFixed className="w-3.5 h-3.5 text-emerald-400" />
              GPS: {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
            </span>
            {gpsAccuracy && (
              <span className="text-[10px] bg-emerald-500/20 px-2 py-0.5 rounded-md">
                Accuracy: ±{gpsAccuracy}m
              </span>
            )}
          </div>
          {lastUpdatedTime && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Last Broadcast: {lastUpdatedTime}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default WorkerDutyToggle;
