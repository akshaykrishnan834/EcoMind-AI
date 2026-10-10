import axios from "axios";
import { API_BASE_URL } from "../config/apiConfig";

const API_URL = `${API_BASE_URL}/api/User`;

export const getAllUsers = async () => {
  const response = await axios.get(API_URL);
  return response.data || [];
};

export const deleteUser = async (id) => {
  const response = await axios.delete(`${API_URL}/${id}`);
  return response.data;
};

export const getUserByEmail = async (email) => {
  const response = await axios.get(`${API_URL}/by-email/${encodeURIComponent(email)}`);
  return response.data;
};

export const updateUserProfile = async (profileData) => {
  const response = await axios.put(`${API_URL}/profile`, profileData);
  return response.data;
};
