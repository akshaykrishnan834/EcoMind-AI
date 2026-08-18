import axios from "axios";

const API_URL = "http://localhost:5214/api/Auth";

export const registerUser = async (userData) => {
    const response = await axios.post(`${API_URL}/register`, userData);
    return response.data;
};

export const loginUser = async (credentials) => {
    const response = await axios.post(`${API_URL}/login`, credentials);
    return response.data;
};

export const forgotPassword = async (email) => {
  const response = await axios.post(`${API_URL}/forgot-password`, { email });
  return response.data;
};

export const verifyOtp = async (email, otp) => {
  const response = await axios.post(`${API_URL}/verify-otp`, { email, otp });
  return response.data;
};

export const resetPassword = async (email, otp, newPassword) => {
  const response = await axios.post(`${API_URL}/reset-password`, {
    email,
    otp,
    newPassword
  });
  return response.data;
};

export const changePassword = async (data) => {
  const response = await axios.post(`${API_URL}/change-password`, data);
  return response.data;
};

export const checkEmailExists = async (email, signal) => {
  const response = await axios.get(`${API_URL}/check-email`, {
    params: { email },
    signal
  });
  return response.data;
};

export const checkPhoneExists = async (phone, signal) => {
  const response = await axios.get(`${API_URL}/check-phone`, {
    params: { phone },
    signal
  });
  return response.data;
};