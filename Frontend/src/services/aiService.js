import axios from "axios";
import { API_BASE_URL } from "../config/apiConfig";

const API_URL = `${API_BASE_URL}/api/ai`;

export const sendChatMessage = async (message, citizenContext = null) => {
  const fullMessage = citizenContext
    ? `${citizenContext}\n\n[CITIZEN INQUIRY]:\n${message}`
    : message;
  const response = await axios.post(`${API_URL}/chat`, { message: fullMessage });
  return response.data;
};

export default {
  sendChatMessage,
};
