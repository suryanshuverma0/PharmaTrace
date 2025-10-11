// Location Service for tracking user location with permission
class LocationService {
  constructor() {
    this.hasPermission = false;
    this.currentPosition = null;
    this.permissionStatus = 'prompt'; // 'granted', 'denied', 'prompt'
  }

  // Request location permission from user
  async requestLocationPermission() {
    try {
      // Check if geolocation is supported
      if (!navigator.geolocation) {
        console.warn('Geolocation is not supported by this browser.');
        return false;
      }

      // Check current permission status
      if (navigator.permissions) {
        const permission = await navigator.permissions.query({name: 'geolocation'});
        this.permissionStatus = permission.state;
        
        if (permission.state === 'granted') {
          this.hasPermission = true;
          await this.getCurrentPosition();
          return true;
        } else if (permission.state === 'denied') {
          this.hasPermission = false;
          return false;
        }
      }

      // Request permission by attempting to get position
      const position = await this.getCurrentPosition();
      this.hasPermission = true;
      return true;
    } catch (error) {
      console.warn('Location permission denied or error:', error.message);
      this.hasPermission = false;
      this.permissionStatus = 'denied';
      return false;
    }
  }

  // Get current position
  getCurrentPosition() {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.currentPosition = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: new Date().toISOString()
          };
          resolve(this.currentPosition);
        },
        (error) => {
          let errorMessage = 'Unable to get location';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location access denied by user';
              this.permissionStatus = 'denied';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information unavailable';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out';
              break;
          }
          reject(new Error(errorMessage));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      );
    });
  }

  // Get location data for API calls
  getLocationData() {
    if (!this.hasPermission || !this.currentPosition) {
      return null;
    }
    
    return {
      latitude: this.currentPosition.latitude,
      longitude: this.currentPosition.longitude,
      accuracy: this.currentPosition.accuracy,
      timestamp: this.currentPosition.timestamp
    };
  }

  // Get device and browser info
  getDeviceInfo() {
    const userAgent = navigator.userAgent;
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    
    // Parse browser info
    let browserName = 'Unknown';
    let browserVersion = 'Unknown';
    
    if (userAgent.indexOf('Chrome') > -1) {
      browserName = 'Chrome';
      browserVersion = userAgent.match(/Chrome\/([0-9.]+)/)?.[1] || 'Unknown';
    } else if (userAgent.indexOf('Firefox') > -1) {
      browserName = 'Firefox';
      browserVersion = userAgent.match(/Firefox\/([0-9.]+)/)?.[1] || 'Unknown';
    } else if (userAgent.indexOf('Safari') > -1) {
      browserName = 'Safari';
      browserVersion = userAgent.match(/Version\/([0-9.]+)/)?.[1] || 'Unknown';
    } else if (userAgent.indexOf('Edge') > -1) {
      browserName = 'Edge';
      browserVersion = userAgent.match(/Edge\/([0-9.]+)/)?.[1] || 'Unknown';
    }

    return {
      isMobile,
      browser: `${browserName} ${browserVersion}`,
      platform: navigator.platform,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      userAgent: userAgent.substring(0, 200) // Limit length
    };
  }

  // Create comprehensive tracking data for API calls
  createTrackingData(method = 'manual_verification') {
    const locationData = this.getLocationData();
    const deviceInfo = this.getDeviceInfo();
    
    const trackingData = {
      trackingType: method,
      deviceInfo,
      timestamp: new Date().toISOString()
    };

    // Add location data if available
    if (locationData) {
      trackingData.locationData = locationData;
    }

    return trackingData;
  }

  // Show location permission modal/prompt
  showLocationPermissionPrompt() {
    return new Promise((resolve) => {
      // Create a simple confirmation dialog
      const message = `${window.location.hostname} would like to access your location to provide better tracking analytics for pharmaceutical supply chain monitoring.\n\nThis helps manufacturers understand where their products are being verified globally.\n\nAllow location access?`;
      
      const result = confirm(message);
      resolve(result);
    });
  }

  // Initialize location service with user prompt
  async initialize() {
    try {
      // Show permission prompt to user
      const userConsent = await this.showLocationPermissionPrompt();
      
      if (userConsent) {
        const granted = await this.requestLocationPermission();
        if (granted) {
          console.log('Location tracking enabled');
        } else {
          console.log('Location tracking disabled - permission denied');
        }
        return granted;
      } else {
        console.log('Location tracking disabled - user declined');
        this.hasPermission = false;
        return false;
      }
    } catch (error) {
      console.warn('Location initialization error:', error);
      return false;
    }
  }

  // Reset permission status
  reset() {
    this.hasPermission = false;
    this.currentPosition = null;
    this.permissionStatus = 'prompt';
  }
}

// Create singleton instance
const locationService = new LocationService();

export default locationService;