import axios from "axios";

const API_URL = "http://localhost:5214/api/Citizen";

export const getAllCitizens = async () => {
  const response = await axios.get(API_URL);
  return response.data || [];
};

export const getCitizensByWard = async (wardId) => {
  if (!wardId) return [];
  const response = await axios.get(`${API_URL}/ward/${encodeURIComponent(wardId)}`);
  return response.data || [];
};

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

export const updateCitizenLocation = async ({ email, address, latitude, longitude }) => {
  let citizen = null;
  try {
    citizen = await getCitizenByEmail(email);
  } catch (e) {
    console.warn("Could not fetch existing citizen before updating location:", e);
  }

  const payload = {
    email: email,
    fullName: citizen?.fullName || "",
    phoneNumber: citizen?.phoneNumber || "",
    address: address,
    latitude: latitude,
    longitude: longitude,
    wardId: citizen?.wardId || "",
    panchayatName: citizen?.panchayatName || ""
  };

  const response = await axios.put(`${API_URL}/profile`, payload);
  return response.data;
};

export const getPendingVerificationCitizens = async () => {
  const response = await axios.get(`${API_URL}/pending-verification`);
  return response.data || [];
};

export const verifyCitizen = async (citizenId, isVerified, status = "Verified", verifiedBy = "Admin") => {
  const response = await axios.put(`${API_URL}/${encodeURIComponent(citizenId)}/verify`, {
    isVerified,
    status: isVerified ? "Verified" : status,
    verifiedBy
  });
  return response.data;
};



