import axios from 'axios';

const API_URL = 'http://localhost:5214/api/WasteAnalysis';

/**
 * Sends a waste image to backend AI endpoint POST /api/WasteAnalysis/analyze
 * @param {File} imageFile - The uploaded image file
 * @returns {Promise<Object>} Analysis result with detectedItems, overallCategory, confidence, segregationAdvice
 */
export const analyzeWasteImage = async (imageFile) => {
  const formData = new FormData();
  formData.append('image', imageFile);

  const response = await axios.post(`${API_URL}/analyze`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
};

export default {
  analyzeWasteImage,
};

