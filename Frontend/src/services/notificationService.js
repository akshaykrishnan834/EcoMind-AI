import axios from 'axios';
import { API_BASE_URL } from '../config/apiConfig';

const API_URL = `${API_BASE_URL}/api/Notification`;

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

/**
 * Fetch notifications for a user (Citizen or Worker)
 * @param {string} userId - Citizen ID, Worker ID, or Email
 * @returns {Promise<Array>}
 */
export const getUserNotifications = async (userId) => {
  if (!userId) return [];
  try {
    const response = await axios.get(`${API_URL}/user/${encodeURIComponent(userId)}`, {
      headers: getAuthHeaders()
    });
    return Array.isArray(response.data) ? response.data : [];
  } catch (err) {
    console.warn('Could not load notifications:', err);
    return [];
  }
};

/**
 * Mark a single notification as read
 * @param {string} notificationId
 * @returns {Promise<boolean>}
 */
export const markNotificationAsRead = async (notificationId) => {
  if (!notificationId) return false;
  try {
    const response = await axios.put(`${API_URL}/${encodeURIComponent(notificationId)}/read`, {}, {
      headers: getAuthHeaders()
    });
    return response.data?.success ?? true;
  } catch (err) {
    console.warn('Could not mark notification as read:', err);
    return false;
  }
};

/**
 * Mark all notifications for a user as read
 * @param {string} userId
 * @returns {Promise<boolean>}
 */
export const markAllNotificationsAsRead = async (userId) => {
  if (!userId) return false;
  try {
    const response = await axios.put(`${API_URL}/user/${encodeURIComponent(userId)}/read-all`, {}, {
      headers: getAuthHeaders()
    });
    return response.data?.success ?? true;
  } catch (err) {
    console.warn('Could not mark all notifications as read:', err);
    return false;
  }
};

export default {
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead
};
