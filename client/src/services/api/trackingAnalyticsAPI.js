import apiClient from './api';

/**
 * Tracking Analytics API Service
 */

export const trackingAnalyticsAPI = {
  /**
   * Get manufacturer analytics data
   */
  getAnalytics: async (params = {}) => {
    try {
      const { timeRange = '7d', startDate, endDate } = params;
      
      const queryParams = new URLSearchParams({
        timeRange,
        ...(startDate && { startDate }),
        ...(endDate && { endDate })
      });

      const response = await apiClient.get(`/tracking/analytics?${queryParams}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching analytics:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch analytics data');
    }
  },

  /**
   * Get real-time verification events
   */
  getRealtimeVerifications: async (limit = 10) => {
    try {
      const response = await apiClient.get(`/tracking/realtime?limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching realtime data:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch realtime data');
    }
  },

  /**
   * Get location details and statistics
   */
  getLocationDetails: async () => {
    try {
      const response = await apiClient.get('/tracking/locations');
      return response.data;
    } catch (error) {
      console.error('Error fetching location details:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch location details');
    }
  }
};

export default trackingAnalyticsAPI;