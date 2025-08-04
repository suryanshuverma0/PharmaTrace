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

  // Confirm receipt of a batch
  confirmReceipt: async (distributionId) => {
    try {
      const response = await apiClient.post(`/pharmacy/confirm-receipt/${distributionId}`);
      return response.data;
    } catch (error) {
      console.error('Error confirming receipt:', error);
      throw error;
    }
  },

  // Get expiry alerts
  getExpiryAlerts: async (days = 30) => {
    try {
      const response = await apiClient.get(`/pharmacy/expiry-alerts?days=${days}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching expiry alerts:', error);
      throw error;
    }
  },

  // Get pharmacy inventory
  getInventory: async () => {
    try {
      const response = await apiClient.get('/pharmacy/inventory');
      return response.data;
    } catch (error) {
      console.error('Error fetching inventory:', error);
      throw error;
    }
  }
};
