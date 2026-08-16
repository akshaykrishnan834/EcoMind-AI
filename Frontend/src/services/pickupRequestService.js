import axios from 'axios';

const API_URL = 'http://localhost:5214/api/PickupRequest';

/**
 * Creates a new plastic waste pickup request
 * @param {Object} requestData - Pickup request payload matching CreatePickupRequestDto
 * @returns {Promise<Object>} Response containing requestId, status, and message
 */
export const createPickupRequest = async (requestData) => {
  const response = await axios.post(API_URL, requestData);
  return response.data;
};

/**
 * Checks if the citizen has submitted a pickup request for the current calendar month
 * @param {string} citizenId - The ID or email of the citizen
 * @returns {Promise<Object>} Object with { hasMonthlyRequest: boolean, request: Object }
 */
export const getMonthlyStatus = async (citizenId) => {
  if (!citizenId) return { hasMonthlyRequest: false, request: null };
  const response = await axios.get(`${API_URL}/citizen/${encodeURIComponent(citizenId)}/monthly-status`);
  return response.data;
};

/**
 * Fetches all pickup requests submitted by a citizen
 * @param {string} citizenId - The ID of the citizen
 * @returns {Promise<Array>} List of pickup requests
 */
export const getCitizenRequests = async (citizenId) => {
  if (!citizenId) return [];
  const response = await axios.get(`${API_URL}/citizen/${encodeURIComponent(citizenId)}`);
  return response.data || [];
};

/**
 * Admin fetches all pickup requests across all wards
 * @returns {Promise<Array>} List of all pickup requests
 */
export const getAllPickupRequests = async () => {
  const response = await axios.get(`${API_URL}/all`);
  return response.data || [];
};

/**
 * Fetches all plastic pickup requests in a specific ward for workers
 * @param {string} wardId - Ward ID
 * @returns {Promise<Array>} List of ward pickup requests
 */
export const getWardPickupRequests = async (wardId) => {
  if (!wardId) return [];
  const response = await axios.get(`${API_URL}/ward/${encodeURIComponent(wardId)}`);
  return response.data || [];
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
  });
  return response.data;
};

/**
 * Worker marks a pickup request as collected/completed
 * @param {string} requestId - Public request ID
 * @param {string} [workerId] - Optional Worker ID
 * @returns {Promise<Object>} Updated status response
 */
export const completePickupRequest = async (requestId, workerId) => {
  const response = await axios.put(`${API_URL}/${encodeURIComponent(requestId)}/complete`, {
    workerId
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
