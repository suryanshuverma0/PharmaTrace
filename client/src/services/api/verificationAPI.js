// API service for product verification with location tracking
import apiClient from './api';

// Helper function to get device information
const getDeviceInfo = () => {
  const userAgent = navigator.userAgent;
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  
  return {
    deviceType: isMobile ? 'mobile' : 'desktop',
    browser: (() => {
      if (userAgent.includes('Chrome')) return 'Chrome';
      if (userAgent.includes('Firefox')) return 'Firefox';
      if (userAgent.includes('Safari')) return 'Safari';
      if (userAgent.includes('Edge')) return 'Edge';
      return 'Unknown';
    })(),
    platform: (() => {
      if (userAgent.includes('Windows')) return 'Windows';
      if (userAgent.includes('Mac')) return 'macOS';
      if (userAgent.includes('Linux')) return 'Linux';
      if (userAgent.includes('Android')) return 'Android';
      if (userAgent.includes('iOS')) return 'iOS';
      return 'Unknown';
    })(),
    screenWidth: window.screen?.width || null,
    screenHeight: window.screen?.height || null,
    userAgent: userAgent
  };
};

// Helper function to get location (if permission granted)
const getCurrentLocation = () => {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: new Date(position.timestamp).toISOString()
        });
      },
      (error) => {
        console.log('Location not available:', error.message);
        resolve(null);
      },
      {
        timeout: 5000,
        maximumAge: 60000, // 1 minute
        enableHighAccuracy: false
      }
    );
  });
};

// Helper function to build query params for tracking
const buildTrackingParams = async (trackingMethod = 'manual_verification') => {
  const deviceInfo = getDeviceInfo();
  const locationData = await getCurrentLocation();
  
  const params = new URLSearchParams();
  
  // Add tracking type
  params.set('trackingType', trackingMethod);
  
  // Add device info
  params.set('deviceType', deviceInfo.deviceType);
  params.set('browser', encodeURIComponent(deviceInfo.browser));
  params.set('platform', deviceInfo.platform);
  if (deviceInfo.screenWidth) params.set('screenWidth', deviceInfo.screenWidth);
  if (deviceInfo.screenHeight) params.set('screenHeight', deviceInfo.screenHeight);
  
  // Add location data if available
  if (locationData) {
    params.set('latitude', locationData.latitude);
    params.set('longitude', locationData.longitude);
    params.set('accuracy', locationData.accuracy);
    params.set('locationTimestamp', locationData.timestamp);
  }
  
  return params;
};

export const verificationAPI = {
  // Verify product by serial number using blockchain with location tracking
  verifyProduct: async (serialNumber, trackingMethod = 'manual_verification') => {
    try {
      const trackingParams = await buildTrackingParams(trackingMethod);
      const url = `/blockchain/verify/${serialNumber}?${trackingParams.toString()}`;
      
      const response = await apiClient.get(url);
      return response.data;
    } catch (error) {
      console.error('Error verifying product:', error);
      throw error;
    }
  },

  // Get product journey details using blockchain with location tracking
  getProductJourney: async (serialNumber, trackingMethod = 'manual_verification') => {
    try {
      const trackingParams = await buildTrackingParams(trackingMethod);
      const url = `/blockchain/journey/${serialNumber}?${trackingParams.toString()}`;
      
      const response = await apiClient.get(url);
      return response.data;
    } catch (error) {
      console.error('Error getting product journey:', error);
      throw error;
    }
  }
};

export default verificationAPI;
