import axios from 'axios';

const API_URL = 'http://localhost:5214/api/Message';

const getAuthHeaders = (userId = '', userType = '') => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const effectiveUserId = userId || user.email || user.citizenId || user.workerId || localStorage.getItem('userName') || 'user';
  const effectiveUserType = userType || user.role || 'User';

  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  headers['X-User-Id'] = effectiveUserId;
  headers['X-User-Type'] = effectiveUserType;
  return headers;
};

/**
 * Fetch all messages for a specific pickup request conversation
 * @param {string} requestId - Public Pickup Request ID
 * @param {string} userId - ID/Email of the current user
 * @param {string} [userType] - "Citizen" or "Worker"
 * @returns {Promise<Array>} List of messages
 */
export const getMessages = async (requestId, userId, userType = '') => {
  if (!requestId) return [];
  try {
    const response = await axios.get(`${API_URL}/${encodeURIComponent(requestId)}`, {
      params: userId ? { userId } : {},
      headers: getAuthHeaders(userId, userType)
    });
    const data = response.data;
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data?.messages)) return data.messages;
    return [];
  } catch (err) {
    console.warn(`[getMessages] Failed to fetch messages for request ${requestId}:`, err);
    throw err;
  }
};

/**
 * Send a new message in a pickup request thread
 * @param {Object} payload - { requestId, senderId, senderRole, message }
 * @returns {Promise<Object>} Created message
 */
export const sendMessage = async ({ requestId, senderId, senderRole, message }) => {
  if (!requestId || !message?.trim()) {
    throw new Error('Request ID and message text are required.');
  }

  const cleanText = message.trim();
  const body = {
    requestId: requestId.trim(),
    senderId: senderId?.trim(),
    senderRole: senderRole?.trim(),
    message: cleanText,
    // Aliases for compatibility
    pickupRequestId: requestId.trim(),
    text: cleanText
  };

  const response = await axios.post(API_URL, body, {
    headers: getAuthHeaders(senderId, senderRole)
  });
  return response.data;
};

/**
 * Mark messages as read for a given pickup request
 * @param {Object} payload - { requestId, userId }
 * @returns {Promise<Object>} Status response
 */
export const markAsRead = async ({ requestId, userId }) => {
  if (!requestId || !userId) return;
  try {
    const response = await axios.put(`${API_URL}/read`, {
      requestId: requestId.trim(),
      userId: userId.trim()
    }, {
      headers: getAuthHeaders(userId)
    });
    return response.data;
  } catch (err) {
    console.warn(`[markAsRead] Error marking messages as read for request ${requestId}:`, err);
  }
};

/**
 * Fetch total unread messages count for the current user
 * @param {string} userId - User ID or Email
 * @param {string} userType - "Citizen" or "Worker"
 * @returns {Promise<number>} Unread message count
 */
export const getUnreadCount = async (userId, userType) => {
  if (!userId || !userType) return 0;
  try {
    const response = await axios.get(`${API_URL}/unread-count`, {
      headers: getAuthHeaders(userId, userType)
    });
    return response.data?.unreadCount || 0;
  } catch (err) {
    console.warn('[getUnreadCount] Failed to load unread count:', err);
    return 0;
  }
};

export default {
  getMessages,
  sendMessage,
  markAsRead,
  getUnreadCount
};
