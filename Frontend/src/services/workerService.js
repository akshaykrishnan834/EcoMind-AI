import axios from "axios";
import { API_BASE_URL } from "../config/apiConfig";

const API_URL = `${API_BASE_URL}/api/Worker`;

export const getAllWorkers = async () => {
  const response = await axios.get(API_URL);
  return response.data || [];
};

export const createWorker = async (workerData) => {
  const response = await axios.post(API_URL, workerData);
  return response.data;
};

export const updateWorker = async (workerData) => {
  const response = await axios.put(API_URL, workerData);
  return response.data;
};

/**
 * Updates worker's live duty status and current GPS coordinates.
 * Broadcasts via API and localStorage/custom event for instant reactive updates.
 */
export const updateDutyStatus = async ({ email, workerId, wardId, isOnDuty, latitude, longitude }) => {
  const payload = {
    email: email || '',
    workerId: workerId || '',
    isOnDuty: Boolean(isOnDuty),
    latitude: latitude !== undefined ? parseFloat(latitude) : null,
    longitude: longitude !== undefined ? parseFloat(longitude) : null,
  };

  // Broadcast to localStorage and window event for instant multi-tab reactivity
  try {
    const liveData = {
      ...payload,
      wardId: wardId || 'Ward 1',
      lastUpdatedAt: new Date().toISOString()
    };
    if (wardId) {
      localStorage.setItem(`ecomind_live_worker_${wardId.toLowerCase().replace(/\s+/g, '_')}`, JSON.stringify(liveData));
    }
    localStorage.setItem(`ecomind_worker_duty_${email || workerId}`, JSON.stringify(liveData));
    window.dispatchEvent(new CustomEvent('ecomind_worker_location_update', { detail: liveData }));
  } catch (e) {
    console.warn('Local storage broadcast error:', e);
  }

  try {
    const response = await axios.put(`${API_URL}/duty-status`, payload);
    return response.data;
  } catch (err) {
    console.warn('Backend updateDutyStatus failed, using local broadcast state:', err);
    return { success: true, localOnly: true };
  }
};

/**
 * Fetches the active/assigned live worker for a given ward.
 */
export const getLiveWorkerByWard = async (wardId) => {
  if (!wardId) return null;

  const cleanWardKey = `ecomind_live_worker_${wardId.toLowerCase().replace(/\s+/g, '_')}`;

  // Try API first
  try {
    const response = await axios.get(`${API_URL}/ward/${encodeURIComponent(wardId)}/live`);
    if (response.data) {
      if (!response.data.isOnDuty) {
        return {
          ...response.data,
          isOnDuty: false,
          latitude: null,
          longitude: null,
          currentLatitude: null,
          currentLongitude: null
        };
      }
      return response.data;
    }
  } catch (err) {
    console.warn(`API getLiveWorkerByWard for ${wardId} failed, checking local state:`, err?.message);
  }

  // Fallback to locally broadcast state
  try {
    const cached = localStorage.getItem(cleanWardKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (!parsed.isOnDuty) {
        return {
          ...parsed,
          isOnDuty: false,
          latitude: null,
          longitude: null,
          currentLatitude: null,
          currentLongitude: null
        };
      }
      return parsed;
    }
  } catch (e) {
    console.warn('Error reading cached worker live location:', e);
  }

  return null;
};

/**
 * Computes Haversine distance between two coordinates in meters and kilometers.
 */
export const calculateHaversineDistance = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;

  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const meters = Math.round(R * c);
  const km = (meters / 1000).toFixed(2);
  const walkingMinutes = Math.max(1, Math.round(meters / 75)); // approx 4.5 km/h walking speed

  return { meters, km, walkingMinutes };
};

