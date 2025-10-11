import { useState, useEffect } from 'react';
import locationService from '../services/locationService';

// Hook for managing location permissions and tracking
export const useLocationTracking = () => {
  const [hasLocationPermission, setHasLocationPermission] = useState(false);
  const [isLocationLoading, setIsLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const [showPermissionModal, setShowPermissionModal] = useState(false);

  // Initialize location tracking - check permission status on mount
  useEffect(() => {
    // Check if permission was previously granted
    const permissionStatus = localStorage.getItem('locationPermissionStatus');
    if (permissionStatus === 'granted') {
      setHasLocationPermission(true);
    }
  }, []);

  // Request location permission
  const requestLocationPermission = async () => {
    setIsLocationLoading(true);
    setLocationError(null);
    
    try {
      const granted = await locationService.requestLocationPermission();
      setHasLocationPermission(granted);
      
      // Store permission status
      localStorage.setItem('locationPermissionAsked', 'true');
      localStorage.setItem('locationPermissionStatus', granted ? 'granted' : 'denied');
      
      return granted;
    } catch (error) {
      setLocationError(error.message);
      setHasLocationPermission(false);
      localStorage.setItem('locationPermissionStatus', 'denied');
      return false;
    } finally {
      setIsLocationLoading(false);
    }
  };

  // Show permission modal with custom UI
  const handlePermissionRequest = async (userConsent) => {
    setShowPermissionModal(false);
    
    if (userConsent) {
      await requestLocationPermission();
    } else {
      setHasLocationPermission(false);
      localStorage.setItem('locationPermissionAsked', 'true');
      localStorage.setItem('locationPermissionStatus', 'denied');
    }
  };

  // Check and request permission if needed
  const checkLocationPermission = () => {
    const permissionStatus = localStorage.getItem('locationPermissionStatus');
    const hasAskedBefore = localStorage.getItem('locationPermissionAsked');
    
    // If never asked before or explicitly denied, show modal
    if (!hasAskedBefore || permissionStatus === 'denied') {
      setShowPermissionModal(true);
      return false;
    }
    
    return permissionStatus === 'granted';
  };

  // Reset location permission
  const resetLocationPermission = () => {
    localStorage.removeItem('locationPermissionAsked');
    localStorage.removeItem('locationPermissionStatus');
    locationService.reset();
    setHasLocationPermission(false);
    setLocationError(null);
    setShowPermissionModal(true);
  };

  return {
    hasLocationPermission,
    isLocationLoading,
    locationError,
    showPermissionModal,
    requestLocationPermission,
    handlePermissionRequest,
    resetLocationPermission,
    checkLocationPermission
  };
};