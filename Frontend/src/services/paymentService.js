import axios from 'axios';

const API_URL = 'http://localhost:5214/api/Payment';

/**
 * Get all monthly payments (current + past months history) for a given citizen
 * @param {string} citizenId
 * @returns {Promise<Array>} List of payment records
 */
export const getCitizenPayments = async (citizenId) => {
  if (!citizenId) return [];
  try {
    const response = await axios.get(`${API_URL}/citizen/${encodeURIComponent(citizenId)}`);
    return response.data || [];
  } catch (error) {
    console.error('Error fetching citizen payments:', error);
    return [];
  }
};

/**
 * Get current month payment option for citizen
 * @param {string} citizenId
 * @returns {Promise<Object|null>}
 */
export const getCurrentMonthPayment = async (citizenId) => {
  if (!citizenId) return null;
  try {
    const response = await axios.get(`${API_URL}/current/${encodeURIComponent(citizenId)}`);
    return response.data || null;
  } catch (error) {
    console.error('Error fetching current month payment:', error);
    return null;
  }
};

/**
 * Create a Razorpay Order from backend
 * @param {Object} payload - { citizenId, month, year }
 * @returns {Promise<Object>} Order details: { razorpayOrderId, keyId, amount, currency, month, year }
 */
export const createRazorpayOrder = async (payload) => {
  const response = await axios.post(`${API_URL}/create-order`, payload);
  return response.data;
};

/**
 * Verify Razorpay payment signature on backend
 * @param {Object} payload - { citizenId, month, year, razorpayOrderId, razorpayPaymentId, razorpaySignature }
 * @returns {Promise<Object>} Verification response
 */
export const verifyRazorpayPayment = async (payload) => {
  const response = await axios.post(`${API_URL}/verify-signature`, payload);
  return response.data;
};

/**
 * Process cash payment through Haritha Karma Sena field worker
 * @param {Object} payload - { citizenId, month, year }
 * @returns {Promise<Object>} Updated payment object
 */
export const processWorkerPayment = async (payload) => {
  const response = await axios.post(`${API_URL}/pay-worker`, payload);
  return response.data;
};

/**
 * Process monthly fee payment (Generic fallback)
 * @param {Object} payload - { citizenId, month, year, paymentMethod, transactionId }
 * @returns {Promise<Object>} Updated payment object
 */
export const processPayment = async (payload) => {
  const response = await axios.post(`${API_URL}/pay`, payload);
  return response.data;
};
