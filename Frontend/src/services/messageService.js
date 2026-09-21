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
 * Fetch the single persistent conversation between a Citizen and Worker
 * @param {string} citizenId
 * @param {string} workerId
 * @returns {Promise<Object>} Conversation document with Messages[]
 */
export const getConversation = async (citizenId, workerId) => {
  if (!citizenId || !workerId) return null;
  try {
    const response = await axios.get(`${API_URL}/conversation`, {
      params: { citizenId: citizenId.trim(), workerId: workerId.trim() },
      headers: getAuthHeaders(citizenId || workerId)
    });
    return response.data;
  } catch (err) {
    console.warn(`[getConversation] Error loading conversation for citizen=${citizenId} worker=${workerId}:`, err);
    throw err;
  }
};

/**
 * Fetch all conversations for a Worker (includes citizen summary, latest message, unread count)
 * @param {string} workerId
 * @returns {Promise<Array>} List of ConversationSummaryDto
 */
export const getWorkerConversations = async (workerId) => {
  if (!workerId) return [];
  try {
    const response = await axios.get(`${API_URL}/worker/${encodeURIComponent(workerId.trim())}`, {
      headers: getAuthHeaders(workerId, 'Worker')
    });
    const data = response.data;
    if (Array.isArray(data)) return data;
    return [];
  } catch (err) {
    console.warn(`[getWorkerConversations] Failed to load worker conversations:`, err);
    return [];
  }
};

/**
 * Fetch the Citizen's conversation with their assigned worker
 * @param {string} citizenId
 * @param {string} [workerId]
 * @returns {Promise<Object>} Conversation document
 */
export const getCitizenConversation = async (citizenId, workerId = '') => {
  if (!citizenId) return null;
  try {
    const params = workerId ? { workerId: workerId.trim() } : {};
    const response = await axios.get(`${API_URL}/citizen/${encodeURIComponent(citizenId.trim())}`, {
      params,
      headers: getAuthHeaders(citizenId, 'Citizen')
    });
    return response.data;
  } catch (err) {
    console.warn(`[getCitizenConversation] Failed to load citizen conversation:`, err);
    return null;
  }
};

/**
 * Send a new message in the Citizen <-> Worker conversation
 * @param {Object} payload - { citizenId, workerId, senderId, senderRole, text, pickupRequestId }
 * @returns {Promise<Object>} Created MessageItem
 */
export const sendMessage = async ({
  citizenId,
  workerId,
  senderId,
  senderRole,
  text,
  message,
  pickupRequestId,
  requestId,
  conversationId
}) => {
  const cleanText = (text || message || '').trim();
  if (!cleanText) {
    throw new Error('Message text is required.');
  }

  const body = {
    citizenId: (citizenId || '').trim(),
    workerId: (workerId || '').trim(),
    conversationId: (conversationId || '').trim() || undefined,
    senderId: (senderId || '').trim(),
    senderRole: (senderRole || '').trim(),
    text: cleanText,
    pickupRequestId: (pickupRequestId || requestId || '').trim() || undefined
  };

  const response = await axios.post(API_URL, body, {
    headers: getAuthHeaders(senderId, senderRole)
  });
  return response.data;
};

/**
 * Mark a conversation as read
 * @param {Object} payload - { conversationId, citizenId, workerId, requestId, userId, userRole }
 * @returns {Promise<Object>}
 */
export const markAsRead = async ({
  conversationId,
  citizenId,
  workerId,
  requestId,
  userId,
  userRole
}) => {
  try {
    const body = {
      conversationId: conversationId || undefined,
      citizenId: citizenId || undefined,
      workerId: workerId || undefined,
      requestId: requestId || undefined,
      userId: userId || undefined,
      userRole: userRole || undefined
    };

    const endpoint = conversationId ? `${API_URL}/conversation/${encodeURIComponent(conversationId)}/read` : `${API_URL}/read`;
    const response = await axios.put(endpoint, body, {
      headers: getAuthHeaders(userId, userRole)
    });
    return response.data;
  } catch (err) {
    console.warn('[markAsRead] Error marking conversation as read:', err);
  }
};

/**
 * Fetch total unread messages count for current user
 * @param {string} userId
 * @param {string} userType - "Citizen" or "Worker"
 * @returns {Promise<number>}
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

/**
 * Legacy / Backward compatibility: Get messages by pickup request ID
 */
export const getMessages = async (requestId, userId, userType = '') => {
  if (!requestId) return [];
  try {
    const response = await axios.get(`${API_URL}/${encodeURIComponent(requestId)}`, {
      headers: getAuthHeaders(userId, userType)
    });
    const data = response.data;
    if (data?.messages && Array.isArray(data.messages)) return data.messages;
    if (Array.isArray(data)) return data;
    return [];
  } catch (err) {
    console.warn(`[getMessages] Failed for request ${requestId}:`, err);
    return [];
  }
};

export default {
  getConversation,
  getWorkerConversations,
  getCitizenConversation,
  sendMessage,
  markAsRead,
  getUnreadCount,
  getMessages
};
