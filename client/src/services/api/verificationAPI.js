// API service for product verification
const API_BASE_URL = 'http://localhost:3000/api';

export const verificationAPI = {
  // Verify product by serial number
  verifyProduct: async (serialNumber) => {
    try {
      const response = await fetch(`${API_BASE_URL}/verification/verify/${serialNumber}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to verify product');
      }
      
      return data;
    } catch (error) {
      console.error('Error verifying product:', error);
      throw error;
    }
  },

  // Get product journey details
  getProductJourney: async (serialNumber) => {
    try {
      const response = await fetch(`${API_BASE_URL}/verification/journey/${serialNumber}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to get product journey');
      }
      
      return data;
    } catch (error) {
      console.error('Error getting product journey:', error);
      throw error;
    }
  }
};

export default verificationAPI;
