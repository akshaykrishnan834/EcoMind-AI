import axios from "axios";

const API_URL = "http://localhost:5214/api/ai";

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
