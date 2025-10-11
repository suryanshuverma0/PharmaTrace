import locationService from './locationService';

// Enhanced API service with location tracking
class VerificationAPI {
  constructor() {
    this.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
  }

  // Verify product with location tracking
  async verifyProduct(serialNumber, trackingMethod = 'manual_verification') {
    try {
      // Get tracking data (includes location if permitted)
      const trackingData = locationService.createTrackingData(trackingMethod);
      
      // Prepare request URL and body
      const url = `${this.baseURL}/verification/verify/${serialNumber}`;
      
      // For GET request, we'll add tracking data as query parameters and headers
      const queryParams = new URLSearchParams();
      
      // Add tracking type
      queryParams.set('trackingType', trackingData.trackingType);
      
      // Add device info as query params
      if (trackingData.deviceInfo) {
        queryParams.set('deviceType', trackingData.deviceInfo.isMobile ? 'mobile' : 'desktop');
        queryParams.set('browser', trackingData.deviceInfo.browser);
        queryParams.set('platform', trackingData.deviceInfo.platform);
        queryParams.set('screenWidth', trackingData.deviceInfo.screenWidth);
        queryParams.set('screenHeight', trackingData.deviceInfo.screenHeight);
      }
      
      // Add location data if available
      if (trackingData.locationData) {
        queryParams.set('latitude', trackingData.locationData.latitude);
        queryParams.set('longitude', trackingData.locationData.longitude);
        queryParams.set('accuracy', trackingData.locationData.accuracy);
        queryParams.set('locationTimestamp', trackingData.locationData.timestamp);
      }

      const finalUrl = `${url}?${queryParams.toString()}`;

      // Make the API call
      const response = await fetch(finalUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Tracking-Method': trackingData.trackingType,
          'X-User-Agent': trackingData.deviceInfo?.userAgent || navigator.userAgent
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      // Log successful tracking
      console.log('Product verification with tracking:', {
        serialNumber,
        method: trackingMethod,
        hasLocation: !!trackingData.locationData,
        success: result.success
      });

      return result;
    } catch (error) {
      console.error('Verification API error:', error);
      throw error;
    }
  }

  // Get product journey
  async getProductJourney(serialNumber) {
    try {
      const url = `${this.baseURL}/verification/journey/${serialNumber}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Journey API error:', error);
      throw error;
    }
  }
}

// Create singleton instance
const verificationAPI = new VerificationAPI();

export default verificationAPI;