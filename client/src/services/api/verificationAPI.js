// API service for product verification
import apiClient from './api';

export const verificationAPI = {
  // Verify product by serial number
  verifyProduct: async (serialNumber) => {
    try {
      const response = await apiClient.get(`/verification/verify/${serialNumber}`);
      return response.data;
    } catch (error) {
      console.error('Error verifying product:', error);
      throw error;
    }
  },

  // Get product journey details
  getProductJourney: async (serialNumber) => {
    try {
      const response = await apiClient.get(`/verification/journey/${serialNumber}`);
      return response.data;
    } catch (error) {
      console.error('Error getting product journey:', error);
      throw error;
    }
  }
};

export default verificationAPI;
