import apiClient from './api.js';

export const pharmacyAPI = {
  // Get pharmacy dashboard data
  getDashboardData: async () => {
    try {
      const response = await apiClient.get('/pharmacy/dashboard');
      return response.data;
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      throw error;
    }
  },

  // Confirm receipt of a batch with verification details
  confirmReceipt: async (distributionId, verificationData = {}) => {
    try {
      const response = await apiClient.post(`/pharmacy/confirm-receipt/${distributionId}`, verificationData);
      return {
        success: true,
        message: response.data.message || 'Receipt confirmed successfully',
        data: response.data.data
      };
    } catch (error) {
      console.error('Error confirming receipt:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message,
        error: error.response?.data?.error
      };
    }
  },

  // Get pharmacy inventory
  getInventory: async () => {
    try {
      const response = await apiClient.get('/pharmacy/inventory');
      return {
        success: true,
        data: response.data.data || response.data, // Handle both response formats
        totalItems: response.data.totalItems || (response.data.data ? response.data.data.length : 0),
        totalQuantity: response.data.totalQuantity || 0
      };
    } catch (error) {
      console.error('Error fetching inventory:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message,
        data: []
      };
    }
  },

  // Get expiry alerts
  getExpiryAlerts: async (days = 30) => {
    try {
      const response = await apiClient.get(`/pharmacy/expiry-alerts?days=${days}`);
      return {
        success: true,
        data: response.data.data || response.data,
        totalAlerts: response.data.data?.alerts?.length || response.data.totalAlerts || 0
      };
    } catch (error) {
      console.error('Error fetching expiry alerts:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message,
        data: { alerts: [] }
      };
    }
  }
};
