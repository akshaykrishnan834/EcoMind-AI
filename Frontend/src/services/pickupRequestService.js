import axios from 'axios';

const API_URL = 'http://localhost:5214/api/PickupRequest';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

/**
 * Creates a new plastic waste pickup request
 * @param {Object} requestData - Pickup request payload matching CreatePickupRequestDto
 * @returns {Promise<Object>} Response containing requestId, status, and message
 */
export const createPickupRequest = async (requestData) => {
  const response = await axios.post(API_URL, requestData, {
    headers: getAuthHeaders()
  });
  return response.data;
};

/**
 * Checks if the citizen has submitted a pickup request for the current calendar month
 * @param {string} citizenId - The ID or email of the citizen
 * @returns {Promise<Object>} Object with { hasMonthlyRequest: boolean, request: Object }
 */
export const getMonthlyStatus = async (citizenId) => {
  if (!citizenId) return { hasMonthlyRequest: false, request: null };
  const response = await axios.get(`${API_URL}/citizen/${encodeURIComponent(citizenId)}/monthly-status`, {
    headers: getAuthHeaders()
  });
  return response.data;
};

/**
 * Fetches all pickup requests submitted by a citizen
 * @param {string} citizenId - The ID of the citizen
 * @returns {Promise<Array>} List of pickup requests
 */
export const getCitizenRequests = async (citizenId) => {
  if (!citizenId) return [];
  const response = await axios.get(`${API_URL}/citizen/${encodeURIComponent(citizenId)}`, {
    headers: getAuthHeaders()
  });
  const data = response.data;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  return [];
};

/**
 * Admin fetches all pickup requests across all wards
 * @returns {Promise<Array>} List of all pickup requests
 */
export const getAllPickupRequests = async () => {
  const response = await axios.get(`${API_URL}/all`, {
    headers: getAuthHeaders()
  });
  const data = response.data;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  return [];
};

/**
 * Fetches all plastic pickup requests in a specific ward for workers (optionally filtered by workerId)
 * @param {string} wardId - Ward ID
 * @param {string} [workerId] - Optional Worker ID / Email
 * @returns {Promise<Array>} List of ward pickup requests
 */
export const getWardPickupRequests = async (wardId, workerId) => {
  if (!wardId && !workerId) return [];

  let response;
  if (wardId) {
    const params = workerId ? { workerId: workerId.trim() } : {};
    response = await axios.get(`${API_URL}/ward/${encodeURIComponent(wardId.trim())}`, {
      params,
      headers: getAuthHeaders()
    });
  } else {
    response = await axios.get(`${API_URL}/worker/${encodeURIComponent(workerId.trim())}`, {
      headers: getAuthHeaders()
    });
  }

  const data = response.data;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.requests)) return data.requests;
  return [];
};

/**
 * Worker fetches their assigned pickup requests across their duty ward
 * @param {string} workerId - Worker ID or Email
 * @returns {Promise<Array>} List of worker pickup requests
 */
export const getWorkerPickupRequests = async (workerId) => {
  if (!workerId) return [];
  const response = await axios.get(`${API_URL}/worker/${encodeURIComponent(workerId.trim())}`, {
    headers: getAuthHeaders()
  });
  const data = response.data;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.requests)) return data.requests;
  return [];
};

/**
 * Worker schedules & accepts a pickup request (Status: Scheduled, CollectionDate must be 15th-25th)
 * @param {string} requestId - Public request ID
 * @param {string} workerId - Worker ID
 * @param {string} collectionDate - ISO date string (YYYY-MM-DD) between 15th and 25th
 * @returns {Promise<Object>} Updated status response
 */
export const schedulePickupRequest = async (requestId, workerId, collectionDate) => {
  const response = await axios.put(`${API_URL}/${encodeURIComponent(requestId)}/schedule`, {
    workerId,
    collectionDate
  }, {
    headers: getAuthHeaders()
  });
  return response.data;
};

/**
 * Worker marks a pickup request as collected/completed using citizen's 4-digit verification code
 * @param {string} requestId - Public request ID
 * @param {string} [workerId] - Optional Worker ID
 * @param {string} verificationCode - 4-digit verification code provided by citizen
 * @returns {Promise<Object>} Updated status response
 */
export const completePickupRequest = async (requestId, workerId, verificationCode) => {
  const response = await axios.put(`${API_URL}/${encodeURIComponent(requestId)}/complete`, {
    workerId,
    verificationCode
  }, {
    headers: getAuthHeaders()
  });
  return response.data;
};

export default {
  createPickupRequest,
  getMonthlyStatus,
  getCitizenRequests,
  getWardPickupRequests,
  schedulePickupRequest,
  completePickupRequest,
};
