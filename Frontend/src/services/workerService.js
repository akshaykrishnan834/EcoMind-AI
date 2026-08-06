import axios from "axios";

const API_URL = "http://localhost:5214/api/Worker";

export const getAllWorkers = async () => {
  const response = await axios.get(API_URL);
  return response.data || [];
};

export const createWorker = async (workerData) => {
  const response = await axios.post(API_URL, workerData);
  return response.data;
};
