import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, AlertTriangle, Camera, Scan } from "lucide-react";
import QrScanner from 'qr-scanner';
import { Button } from "../UI/Button";

const QRScannerModal = ({ 
  isOpen, 
  onClose, 
  onScanResult, 
  title = "Scan QR Code",
  description = "Position the QR code within the frame"
}) => {
  const videoRef = useRef(null);
  const qrScannerRef = useRef(null);
  const [scannerError, setScannerError] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [availableCameras, setAvailableCameras] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState(null);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent) ||
                           ('ontouchstart' in window) ||
                           (navigator.maxTouchPoints && navigator.maxTouchPoints > 2);
      setIsMobile(isMobileDevice);
    };
    
    checkMobile();
  }, []);

  // Get available cameras
  const getAvailableCameras = async () => {
    try {
      const cameras = await QrScanner.listCameras(true);
      console.log('Available cameras:', cameras);
      setAvailableCameras(cameras);
      
      // For mobile devices, prefer back camera
      if (isMobile && cameras.length > 0) {
        // Look for back/environment camera
        const backCamera = cameras.find(camera => 
          camera.label.toLowerCase().includes('back') ||
          camera.label.toLowerCase().includes('rear') ||
          camera.label.toLowerCase().includes('environment') ||
          camera.id.includes('environment')
        );
        
        if (backCamera) {
          setSelectedCamera(backCamera.id);
          console.log('Selected back camera:', backCamera.label);
        } else {
          // Fallback to first available camera
          setSelectedCamera(cameras[0].id);
          console.log('Selected default camera:', cameras[0].label);
        }
      } else if (cameras.length > 0) {
        // For desktop, use first available camera
        setSelectedCamera(cameras[0].id);
      }
    } catch (error) {
      console.error('Failed to get cameras:', error);
      setScannerError('Failed to access camera devices');
    }
  };

  // Initialize QR Scanner with mobile optimization
  const initializeScanner = async () => {
    if (!videoRef.current) return;

    try {
      setScannerError(null);
      setIsScanning(true);

      // Stop existing scanner if any
      if (qrScannerRef.current) {
        qrScannerRef.current.stop();
        qrScannerRef.current.destroy();
      }

      // Get available cameras first
      await getAvailableCameras();

      // Create new QR scanner with mobile-optimized settings
      qrScannerRef.current = new QrScanner(
        videoRef.current,
        (result) => {
          console.log('QR Code detected:', result.data);
          handleQRResult(result.data);
        },
        {
          returnDetailedScanResult: true,
          highlightScanRegion: true,
          highlightCodeOutline: true,
          // Mobile optimizations
          preferredCamera: selectedCamera || (isMobile ? 'environment' : 'user'),
          maxScansPerSecond: isMobile ? 5 : 10, // Lower scan rate for mobile to save battery
          calculateScanRegion: (video) => {
            // Custom scan region for mobile - center square
            if (isMobile) {
              const smallerDimension = Math.min(video.videoWidth, video.videoHeight);
              const scanSize = smallerDimension * 0.8;
              return {
                x: (video.videoWidth - scanSize) / 2,
                y: (video.videoHeight - scanSize) / 2,
                width: scanSize,
                height: scanSize,
              };
            }
            return null; // Use default for desktop
          }
        }
      );

      // Set camera if available
      if (selectedCamera && availableCameras.length > 0) {
        await qrScannerRef.current.setCamera(selectedCamera);
      }

      await qrScannerRef.current.start();
    } catch (error) {
      console.error('Failed to start QR scanner:', error);
      let errorMessage = 'Failed to access camera. ';
      
      if (error.name === 'NotAllowedError') {
        errorMessage += 'Please allow camera permissions and try again.';
      } else if (error.name === 'NotFoundError') {
        errorMessage += 'No camera found on this device.';
      } else if (error.name === 'NotSupportedError') {
        errorMessage += 'Camera not supported in this browser.';
      } else {
        errorMessage += 'Please check camera permissions and try again.';
      }
      
      setScannerError(errorMessage);
      setIsScanning(false);
    }
  };

  // Stop QR Scanner
  const stopScanner = () => {
    if (qrScannerRef.current) {
      qrScannerRef.current.stop();
      qrScannerRef.current.destroy();
      qrScannerRef.current = null;
    }
    setIsScanning(false);
    setScannerError(null);
  };

  // Switch camera (for devices with multiple cameras)
  const switchCamera = async () => {
    if (!qrScannerRef.current || availableCameras.length <= 1) return;

    try {
      const currentIndex = availableCameras.findIndex(camera => camera.id === selectedCamera);
      const nextIndex = (currentIndex + 1) % availableCameras.length;
      const nextCamera = availableCameras[nextIndex];
      
      setSelectedCamera(nextCamera.id);
      await qrScannerRef.current.setCamera(nextCamera.id);
      
      console.log('Switched to camera:', nextCamera.label);
    } catch (error) {
      console.error('Failed to switch camera:', error);
      setScannerError('Failed to switch camera');
    }
  };

  // Handle QR scan result with comprehensive error handling
  const handleQRResult = async (qrData) => {
    try {
      console.log('Raw QR data:', qrData);
      
      // Validate QR data is not empty or just whitespace
      if (!qrData || typeof qrData !== 'string' || qrData.trim().length === 0) {
        setScannerError('Invalid QR code: No data found');
        return;
      }

      // Provide haptic feedback on mobile
      if (isMobile && 'vibrate' in navigator) {
        navigator.vibrate(200);
      }
      
      // Stop scanner immediately when QR is detected
      stopScanner();
      
      let serialNum = '';
      let qrType = 'unknown';
      
      // Try to parse as JSON first
      try {
        const parsedData = JSON.parse(qrData);
        console.log('Parsed QR data:', parsedData);
        qrType = 'json';
        
        // Validate JSON structure
        if (typeof parsedData !== 'object' || parsedData === null) {
          throw new Error('Invalid JSON structure in QR code');
        }
        
        // Extract serial number from various possible fields
        serialNum = parsedData.serialNumber || parsedData.productId || parsedData.id;
        
        // If still no serial number, check if there's a verification URL
        if (!serialNum && parsedData.verificationUrl) {
          const urlMatch = parsedData.verificationUrl.match(/\/verify\/([^/?]+)/);
          if (urlMatch && urlMatch[1] !== 'undefined') {
            serialNum = urlMatch[1];
          }
        }
        
        // Additional validation for expected QR format
        if (!serialNum && !parsedData.verificationUrl) {
          throw new Error('QR code does not contain required product information');
        }
        
      } catch (jsonError) {
        console.log('Not JSON format, trying other formats...');
        
        // If not JSON, check if it's a URL or plain text
        if (qrData.includes('verify/') || qrData.includes('verification/')) {
          qrType = 'url';
          const urlMatch = qrData.match(/\/verify(?:ication)?\/([^/?]+)/);
          if (urlMatch && urlMatch[1] !== 'undefined') {
            serialNum = urlMatch[1];
          }
        } else if (qrData.length >= 3 && qrData.length <= 100) {
          // Accept as plain serial number if reasonable length
          qrType = 'plain';
          serialNum = qrData.trim();
        } else {
          // Invalid format
          setScannerError(`Invalid QR code format. Expected product QR code, but found: ${qrData.length > 50 ? qrData.substring(0, 50) + '...' : qrData}`);
          return;
        }
      }

      console.log('Extracted serial number:', serialNum, 'Type:', qrType);

      // Validate serial number
      if (!serialNum || serialNum === 'undefined' || serialNum === 'null') {
        setScannerError('Invalid QR code: No valid serial number found. Please ensure you\'re scanning a product verification QR code.');
        return;
      }

      // Additional validation for serial number format
      if (serialNum.length < 3) {
        setScannerError('Invalid serial number: Too short. Please check the QR code.');
        return;
      }

      if (serialNum.length > 100) {
        setScannerError('Invalid serial number: Too long. Please check the QR code.');
        return;
      }

      // Check for suspicious characters that might indicate corrupted QR
      const suspiciousPattern = /[<>{}[\]\\]/;
      if (suspiciousPattern.test(serialNum)) {
        setScannerError('Invalid serial number format. Please try scanning again.');
        return;
      }

      // Call the success callback and close modal
      onScanResult(serialNum, qrData);
      onClose();

    } catch (error) {
      console.error('Error processing QR result:', error);
      setScannerError(`Failed to process QR code: ${error.message || 'Unknown error occurred'}`);
    }
  };

  // Start scanner when modal opens
  useEffect(() => {
    if (isOpen) {
      // Prevent body scroll on mobile when modal is open
      if (isMobile) {
        document.body.style.overflow = 'hidden';
      }
      
      // Small delay to ensure modal is rendered
      setTimeout(() => {
        initializeScanner();
      }, 100);
    } else {
      stopScanner();
      // Restore body scroll
      if (isMobile) {
        document.body.style.overflow = 'auto';
      }
    }

    // Cleanup on unmount
    return () => {
      stopScanner();
      if (isMobile) {
        document.body.style.overflow = 'auto';
      }
    };
  }, [isOpen, isMobile]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="w-full max-w-lg mx-4 bg-white shadow-xl rounded-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary-100">
                <Scan className="w-5 h-5 text-primary-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 md:text-xl">{title}</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 transition-colors rounded-lg hover:text-gray-600 hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4">
            <div className="flex flex-col items-center space-y-6">
              <p className="text-xs text-center text-gray-600 sm:text-base">
                {isScanning ? description : 'Preparing camera...'}
              </p>

              <div className="relative w-full max-w-[280px] sm:max-w-[300px] mx-auto aspect-square">
                {/* Video Element for QR Scanner */}
                <video
                  ref={videoRef}
                  className="absolute inset-0 object-cover w-full h-full bg-black rounded-2xl"
                  muted
                  playsInline
                  style={{ 
                    transform: isMobile ? 'scaleX(-1)' : 'none' // Mirror for mobile front camera
                  }}
                />

                {/* Camera Switch Button (for mobile with multiple cameras) */}
                {isMobile && availableCameras.length > 1 && isScanning && (
                  <button
                    onClick={switchCamera}
                    className="absolute z-10 p-2 text-white transition-colors rounded-full bg-black/50 top-4 right-4 hover:bg-black/70"
                    title="Switch Camera"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                )}

                {/* Scan Region Indicator for Mobile */}
                {isMobile && isScanning && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-48 h-48 border-2 border-white border-dashed rounded-lg opacity-50"></div>
                  </div>
                )}

                {/* Overlay and Corner Markers */}
                <div className="absolute inset-0 rounded-2xl">
                  {/* Corner Markers */}
                  <div className="absolute w-6 h-6 border-t-4 border-l-4 border-white shadow-lg top-4 left-4"></div>
                  <div className="absolute w-6 h-6 border-t-4 border-r-4 border-white shadow-lg top-4 right-4"></div>
                  <div className="absolute w-6 h-6 border-b-4 border-l-4 border-white shadow-lg bottom-4 left-4"></div>
                  <div className="absolute w-6 h-6 border-b-4 border-r-4 border-white shadow-lg bottom-4 right-4"></div>

                  {/* Status Indicator */}
                  <div className="absolute inset-x-0 bottom-0 p-4 text-center bg-gradient-to-t from-black/60 to-transparent rounded-b-2xl">
                    <p className="text-sm font-medium text-white">
                      {isScanning ? 
                        (isMobile ? 'Hold steady and scan QR code' : 'Scanning for QR codes...') : 
                        'Initializing camera...'}
                    </p>
                    {/* Camera info for debugging */}
                    {isScanning && selectedCamera && availableCameras.length > 0 && (
                      <p className="mt-1 text-xs text-white/75">
                        {availableCameras.find(c => c.id === selectedCamera)?.label || 'Camera active'}
                        {isMobile && availableCameras.length > 1 && ' • Tap to switch'}
                      </p>
                    )}
                  </div>

                  {/* Loading indicator when not scanning */}
                  {!isScanning && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-2xl">
                      <div className="flex flex-col items-center space-y-3">
                        <Camera className="w-8 h-8 text-white animate-pulse" />
                        <p className="text-sm text-white">
                          {isMobile ? 'Starting camera...' : 'Accessing camera...'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Error message */}
              {scannerError && (
                <div className="flex items-start p-3 text-red-700 bg-red-100 border border-red-200 rounded-lg">
                  <AlertTriangle className="flex-shrink-0 w-5 h-5 mt-0.5 mr-2" />
                  <div className="text-sm">
                    <p className="font-medium">{scannerError}</p>
                    {isMobile && (
                      <p className="mt-1 text-red-600">
                        Try refreshing the page or using manual entry if camera issues persist.
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="flex flex-col justify-center w-full gap-3 sm:flex-row">
                <Button
                  variant="secondary"
                  onClick={onClose}
                  className="w-full px-6 sm:w-auto"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default QRScannerModal;