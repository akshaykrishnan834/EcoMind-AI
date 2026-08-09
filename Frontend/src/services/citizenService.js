import axios from "axios";

const API_URL = "http://localhost:5214/api/Citizen";

export const getCitizenByEmail = async (email) => {
  const response = await axios.get(`${API_URL}/${encodeURIComponent(email)}`);
  return response.data;
};

export const updateCitizenProfile = async (profileData) => {
  const response = await axios.put(`${API_URL}/profile`, profileData);
  return response.data;
};

export const getAllPanchayats = async () => {
  const response = await axios.get("http://localhost:5214/api/Panchayat");
  return response.data || [];
};

export const getAllWards = async () => {
  const response = await axios.get("http://localhost:5214/api/Ward");
  return response.data || [];
};
