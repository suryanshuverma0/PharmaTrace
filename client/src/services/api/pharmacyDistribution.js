import apiClient from './api';

/**
 * API service for pharmacy distribution operations
 */
export const pharmacyDistributionApi = {
  /**
   * Get list of approved pharmacies that can receive distributions
   * @returns {Promise<{ pharmacies: Array<{ id: string, name: string, location: string, license: string }> }>}
   */
  getApprovedPharmacies: async () => {
    try {
      const response = await apiClient.get('/pharmacy');
      return {
        pharmacies: response.data.data.map(pharmacy => ({
          id: pharmacy.pharmacyId,
          userId: pharmacy.userId,
          name: pharmacy.pharmacyName,
          location: pharmacy.pharmacyLocation || pharmacy.address || 'N/A'
        }))
      };
    } catch (error) {
      console.error('Error fetching approved pharmacies:', error);
      throw error;
    }
  },

  /**
   * Get batches available for distribution by distributor
   * @param {string} distributorId - ID of the distributor
   * @returns {Promise<{ batches: Array<{ 
   *   batchId: string,
   *   product: string,
   *   batchNumber: string,
   *   quantity: number,
   *   manufacturingDate: string,
   *   expiryDate: string,
   *   storageConditions: string
   * }> }>}
   */
  getAvailableBatches: async () => {
    try {
      const response = await apiClient.get('/distribution/available-batches');
      return {
        data: {
          batches: Array.isArray(response.data) ? response.data : 
                  response.data?.batches || 
                  response.data?.data || []
        }
      };
    } catch (error) {
      console.error('Error fetching available batches:', error);
      throw error;
    }
  },

  /**
   * Assign a batch to a pharmacy for distribution
   * @param {{ 
   *   batchAssignmentId: string,
   *   pharmacistId: string,
   *   quantity: number,
   *   remarks?: string,
   *   expectedDeliveryDate?: string,
   *   transportationMethod?: string,
   *   storageRequirements?: string
   * }} data - Distribution assignment data
   * @returns {Promise<{ assignmentId: string, status: string }>}
   */
  assignToPharmacy: async (data) => {
    // Validate required fields
    if (!data.batchAssignmentId || !data.pharmacistId || !data.quantity) {
      throw new Error('Missing required fields: batchAssignmentId, pharmacistId, and quantity are required');
    }

    // Validate quantity
    if (data.quantity <= 0) {
      throw new Error('Quantity must be greater than 0');
    }

    try {
      const response = await apiClient.post('/distribution/assign', {
        ...data,
        assignedAt: new Date().toISOString()
      });
      return response.data;
    } catch (error) {
      console.error('Error assigning batch to pharmacy:', error);
      throw error;
    }
  },

  /**
   * Get distribution history for a distributor
   * @param {string} distributorId - ID of the distributor
   * @param {Object} [options] - Optional parameters
   * @param {number} [options.page] - Page number for pagination
   * @param {number} [options.limit] - Number of items per page
   * @param {string} [options.status] - Filter by status
   * @param {string} [options.startDate] - Filter by start date
   * @param {string} [options.endDate] - Filter by end date
   * @returns {Promise<{
   *   history: Array<{
   *     id: string,
   *     batchNumber: string,
   *     pharmacy: { id: string, name: string, location: string },
   *     quantity: number,
   *     assignedAt: string,
   *     status: string,
   *     lastUpdated: string
   *   }>,
   *   total: number,
   *   page: number,
   *   totalPages: number
   * }>}
   */
  getDistributionHistory: async (options = {}) => {
    try {
      const queryParams = new URLSearchParams({
        ...(options.page && { page: options.page }),
        ...(options.limit && { limit: options.limit }),
        ...(options.status && { status: options.status }),
        ...(options.startDate && { startDate: options.startDate }),
        ...(options.endDate && { endDate: options.endDate })
      });

      const response = await apiClient.get(`/distribution/history?${queryParams}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching distribution history:', error);
      throw error;
    }
  },

  /**
   * Update the status of a distribution shipment
   * @param {{
   *   assignmentId: string,
   *   status: 'pending' | 'in_transit' | 'delivered' | 'cancelled',
   *   locationUpdate?: string,
   *   temperatureLog?: Array<{ timestamp: string, temperature: number }>,
   *   notes?: string
   * }} data - Status update data
   * @returns {Promise<{ success: boolean, lastUpdated: string }>}
   */
  updateShipmentStatus: async (data) => {
    if (!data.assignmentId || !data.status) {
      throw new Error('Assignment ID and status are required');
    }

    const validStatuses = ['pending', 'in_transit', 'delivered', 'cancelled'];
    if (!validStatuses.includes(data.status)) {
      throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }

    try {
      const response = await apiClient.post('/distribution/update-status', {
        ...data,
        lastUpdated: new Date().toISOString()
      });
      return response.data;
    } catch (error) {
      console.error('Error updating shipment status:', error);
      throw error;
    }
  }
};
