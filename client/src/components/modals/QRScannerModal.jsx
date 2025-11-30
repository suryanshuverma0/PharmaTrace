import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, AlertTriangle, Camera, Scan, Image, Upload } from "lucide-react";
import LocationPermissionModal from "./LocationPermissionModal";
import { useLocationTracking } from "../../hooks/useLocationTracking";
import QrScanner from 'qr-scanner';

// Mock Button component
const Button = ({ children, variant = "primary", className = "", onClick, disabled }) => {
  const baseStyles = "px-4 py-2 rounded-lg font-medium transition-all flex items-center justify-center";
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed",
    secondary: "bg-gray-200 text-gray-800 hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed"
  };
  
  return (
    <button 
      onClick={onClick} 
      disabled={disabled}
      className={`${baseStyles} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

const QRScannerModal = ({ 
  isOpen = true, 
  onClose = () => {}, 
  onScanResult = (serial, raw) => console.log('Scanned:', serial, raw), 
  title = "Scan QR Code",
  description = "Position the QR code within the frame",
  skipLocationCheck = false
}) => {
  // Helper function to extract serial number from QR code data
  const extractSerialFromQR = (qrData) => {
    if (!qrData || typeof qrData !== 'string') return null;
    
    const cleanData = qrData.trim();
    console.log('Extracting serial from QR data:', cleanData);
    
    try {
      // Try to parse as JSON first
      const parsed = JSON.parse(cleanData);
      console.log('Parsed JSON data:', parsed);
      
      // Check various possible JSON keys
      const possibleKeys = ['serialNumber', 'serial', 'sn', 'productSerial', 'productId', 'id'];
      for (const key of possibleKeys) {
        if (parsed[key] && typeof parsed[key] === 'string' && parsed[key].trim()) {
          return parsed[key].trim();
        }
      }
      
      // Check nested objects
      if (parsed.product && typeof parsed.product === 'object') {
        for (const key of possibleKeys) {
          if (parsed.product[key] && typeof parsed.product[key] === 'string' && parsed.product[key].trim()) {
            return parsed.product[key].trim();
          }
        }
      }
    } catch (e) {
      // If not JSON, treat as plain text
      console.log('Not JSON, parsing as text:', cleanData);
      
      // Handle various formats:
      // - Direct serial: "ROM1231"
      // - URL format: "https://verify.pharmatrace.com/ROM1231" or "https://example.com/product/ROM1231"
      // - Key-value: "SN:ROM1231" or "SERIAL:ROM1231"
      // - Query parameters: "?serial=ROM1231" or "?sn=ROM1231"
      
      // Extract from URL
      if (cleanData.includes('://')) {
        console.log('Extracting from URL format');
        
        // Check for query parameters first
        if (cleanData.includes('?')) {
          const urlObj = new URL(cleanData);
          const possibleParams = ['serial', 'serialNumber', 'sn', 'productSerial', 'productId', 'id'];
          for (const param of possibleParams) {
            const value = urlObj.searchParams.get(param);
            if (value && value.trim()) {
              return value.trim();
            }
          }
        }
        
        // Extract from URL path
        const urlParts = cleanData.split('/');
        const lastPart = urlParts[urlParts.length - 1];
        
        // Remove query parameters if present
        const cleanLastPart = lastPart.split('?')[0].split('#')[0];
        
        if (cleanLastPart && /^[A-Za-z0-9]{3,50}$/.test(cleanLastPart)) {
          return cleanLastPart;
        }
      }
      
      // Handle key-value format (SN:ROM1231, SERIAL:ROM1231, etc.)
      if (cleanData.includes(':')) {
        console.log('Extracting from key-value format');
        const parts = cleanData.split(':');
        if (parts.length >= 2) {
          const key = parts[0].toLowerCase().trim();
          const value = parts.slice(1).join(':').trim(); // Handle values with colons
          
          const possibleKeys = ['sn', 'serial', 'serialnumber', 'productserial', 'productid', 'id'];
          if (possibleKeys.includes(key) && value && /^[A-Za-z0-9]{3,50}$/.test(value)) {
            return value;
          }
        }
      }
      
      // Handle equals format (SN=ROM1231, SERIAL=ROM1231, etc.)
      if (cleanData.includes('=')) {
        console.log('Extracting from equals format');
        const parts = cleanData.split('=');
        if (parts.length >= 2) {
          const key = parts[0].toLowerCase().trim();
          const value = parts.slice(1).join('=').trim(); // Handle values with equals
          
          const possibleKeys = ['sn', 'serial', 'serialnumber', 'productserial', 'productid', 'id'];
          if (possibleKeys.includes(key) && value && /^[A-Za-z0-9]{3,50}$/.test(value)) {
            return value;
          }
        }
      }
      
      // If it looks like a direct serial number (alphanumeric, 3-50 chars)
      if (/^[A-Za-z0-9]{3,50}$/.test(cleanData)) {
        console.log('Direct serial number detected:', cleanData);
        return cleanData;
      }
      
      // Handle multi-line or complex text - look for patterns
      const lines = cleanData.split(/[\n\r]+/);
      for (const line of lines) {
        const trimmedLine = line.trim();
        if (/^[A-Za-z0-9]{3,50}$/.test(trimmedLine)) {
          return trimmedLine;
        }
      }
    }
    
    console.log('No valid serial number pattern found in QR data');
    return null;
  };
  // Location tracking hook
  const { 
    showPermissionModal, 
    handlePermissionRequest,
    checkLocationPermission 
  } = useLocationTracking();
  const videoRef = useRef(null);
  const qrScannerRef = useRef(null);
  const fileInputRef = useRef(null);
  const [scannerError, setScannerError] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [availableCameras, setAvailableCameras] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [scanMode, setScanMode] = useState('camera');
  const [isCapturing, setIsCapturing] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const canvasRef = useRef(null);

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

  // Real QR Scanner functionality using qr-scanner library
  const initializeScanner = async () => {
    if (!videoRef.current) return;
    
    try {
      setScannerError(null);
      setIsScanning(false);
      
      // Stop any existing scanner first
      if (qrScannerRef.current) {
        qrScannerRef.current.stop();
        qrScannerRef.current.destroy();
        qrScannerRef.current = null;
      }
      
      console.log('Initializing QR Scanner...');
      
      // Initialize QR Scanner with the video element
      const qrScanner = new QrScanner(
        videoRef.current,
        async result => {
          console.log('QR Code detected:', result.data);
          // Extract serial number from QR code data
          const serialNumber = extractSerialFromQR(result.data);
          if (serialNumber) {
            console.log('✅ Valid serial number extracted:', serialNumber);
            
            // Stop scanning and show verification loading
            qrScanner.stop();
            setIsScanning(false);
            setIsVerifying(true);
            setScannerError(null);
            
            try {
              await onScanResult(serialNumber, result.data);
              onClose();
            } catch (error) {
              console.error('Verification failed:', error);
              setScannerError('Failed to verify product. Please try again.');
              setIsVerifying(false);
              // Restart scanner
              await qrScanner.start();
              setIsScanning(true);
            }
          } else {
            console.warn('⚠️ No valid serial number found in QR code:', result.data);
            setScannerError('QR code does not contain a valid serial number. Please scan a valid product QR code.');
          }
        },
        {
          onDecodeError: err => {
            // Handle decode errors silently - keep scanning
            // Only log if it's not a common "no QR code found" error
            if (!err.message.includes('No QR code found') && !err.message.includes('Could not decode QR Code')) {
              console.debug('QR decode error:', err.message);
            }
          },
          preferredCamera: isMobile ? 'environment' : 'user',
          highlightScanRegion: true,
          highlightCodeOutline: true,
          returnDetailedScanResult: true,
          maxScansPerSecond: 10, // Increase scan frequency for better detection
          calculateScanRegion: (video) => {
            // Create a more focused scan region for better detection
            const scanRegionSize = Math.min(video.videoWidth, video.videoHeight) * 0.8;
            return {
              x: (video.videoWidth - scanRegionSize) / 2,
              y: (video.videoHeight - scanRegionSize) / 2,
              width: scanRegionSize,
              height: scanRegionSize,
            };
          },
        }
      );
      
      qrScannerRef.current = qrScanner;
      
      // Start the scanner with retry logic
      let retryCount = 0;
      const maxRetries = 3;
      
      while (retryCount < maxRetries) {
        try {
          await qrScanner.start();
          setIsScanning(true);
          console.log('🔍 QR Scanner initialized and started successfully');
          break;
        } catch (startError) {
          console.warn(`Scanner start attempt ${retryCount + 1} failed:`, startError);
          retryCount++;
          
          if (retryCount < maxRetries) {
            // Wait before retrying
            await new Promise(resolve => setTimeout(resolve, 1000));
          } else {
            throw startError;
          }
        }
      }
      
    } catch (error) {
      console.error('Failed to start QR scanner:', error);
      let errorMessage = 'Failed to access camera. ';
      
      if (error.name === 'NotAllowedError') {
        errorMessage += 'Please allow camera permissions and try again.';
      } else if (error.name === 'NotFoundError') {
        errorMessage += 'No camera found on this device.';
      } else if (error.name === 'NotSupportedError') {
        errorMessage += 'QR scanning is not supported on this device.';
      } else {
        errorMessage += 'Please check camera permissions and try again.';
      }
      
      setScannerError(errorMessage);
      setIsScanning(false);
    }
  };

  const stopScanner = () => {
    // Stop QR Scanner if running
    if (qrScannerRef.current) {
      qrScannerRef.current.stop();
      qrScannerRef.current.destroy();
      qrScannerRef.current = null;
    }
    
    setIsScanning(false);
    setScannerError(null);
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setScannerError(null);
    setIsProcessingImage(true);

    try {
      if (!file.type.startsWith('image/')) {
        throw new Error('Please select a valid image file (JPG, PNG, etc.)');
      }

      if (file.size > 10 * 1024 * 1024) {
        throw new Error('Image file is too large. Please select an image smaller than 10MB.');
      }

      // Use QR Scanner to process the uploaded image
      const result = await QrScanner.scanImage(file);
      console.log('QR Code found in image:', result);
      
      // Extract serial number from QR code data
      const serialNumber = extractSerialFromQR(result);
      if (serialNumber) {
        console.log('✅ Valid serial number extracted from image:', serialNumber);
        
        // Show verification loading
        setIsProcessingImage(false);
        setIsVerifying(true);
        setScannerError(null);
        
        try {
          await onScanResult(serialNumber, result);
          onClose();
        } catch (error) {
          console.error('Verification failed:', error);
          setScannerError('Failed to verify product. Please try again.');
          setIsVerifying(false);
        }
      } else {
        throw new Error('QR code does not contain a valid serial number. Please select an image with a valid product QR code.');
      }
      
    } catch (error) {
      console.error('Error scanning uploaded image:', error);
      let errorMessage = error.message;
      
      if (error.message.includes('No QR code found')) {
        errorMessage = 'No QR code found in the selected image. Please choose an image that contains a clear QR code.';
      } else if (error.message.includes('decode')) {
        errorMessage = 'Could not read the QR code in this image. Please try with a clearer image.';
      }
      
      setScannerError(errorMessage);
      setIsProcessingImage(false);
    }
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const captureImage = async () => {
    if (!videoRef.current || !isScanning) return;
    
    setIsCapturing(true);
    setScannerError(null);
    
    try {
      // Create a canvas to capture the video frame
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      
      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw the current video frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Convert canvas to blob
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.9));
      
      console.log('Captured image from camera, processing...');
      
      // Use QR Scanner to process the captured image
      const result = await QrScanner.scanImage(blob);
      console.log('QR Code found in captured image:', result);
      
      // Extract serial number from QR code data
      const serialNumber = extractSerialFromQR(result);
      if (serialNumber) {
        console.log('✅ Valid serial number extracted from capture:', serialNumber);
        
        // Show verification loading
        setIsCapturing(false);
        setIsVerifying(true);
        setScannerError(null);
        
        try {
          await onScanResult(serialNumber, result);
          onClose();
        } catch (error) {
          console.error('Verification failed:', error);
          setScannerError('Failed to verify product. Please try again.');
          setIsVerifying(false);
        }
      } else {
        throw new Error('QR code does not contain a valid serial number. Please try capturing again or ensure the QR code is clear.');
      }
      
    } catch (error) {
      console.error('Error processing captured image:', error);
      let errorMessage = error.message;
      
      if (error.message.includes('No QR code found')) {
        errorMessage = 'No QR code found in the captured image. Please position the QR code clearly in the frame and try again.';
      } else if (error.message.includes('decode')) {
        errorMessage = 'Could not read the QR code in the captured image. Please ensure the QR code is clear and well-lit.';
      }
      
      setScannerError(errorMessage);
    } finally {
      setIsCapturing(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      if (isMobile) {
        document.body.style.overflow = 'hidden';
      }
      
      // Check location permission when modal opens (unless skipped)
      if (!skipLocationCheck) {
        checkLocationPermission();
      }

      if (scanMode === 'camera') {
        setTimeout(() => {
          initializeScanner();
        }, 100);
      }
    } else {
      stopScanner();
      if (isMobile) {
        document.body.style.overflow = 'auto';
      }
    }

    return () => {
      stopScanner();
      if (isMobile) {
        document.body.style.overflow = 'auto';
      }
    };
  }, [isOpen, scanMode, isMobile]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-2 sm:p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="w-full max-w-lg bg-white shadow-2xl rounded-2xl max-h-[85vh] sm:max-h-[90vh] flex flex-col m-4 sm:m-6 lg:m-8"
        >
          {/* Header - Fixed */}
          <div className="flex-shrink-0 p-4 pb-2 border-b border-gray-100 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full">
                  <Scan className="w-5 h-5 text-blue-600" />
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
            
            {/* Mode Selector */}
            <div className="flex p-1 bg-gray-100 rounded-lg">
              <button
                onClick={() => {setScanMode('camera'); setScannerError(null);}}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                  scanMode === 'camera' 
                    ? 'bg-blue-500 text-white shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Camera className="w-4 h-4" />
                <span className="hidden sm:inline">Camera</span>
                <span className="sm:hidden">Cam</span>
              </button>
              <button
                onClick={() => {setScanMode('upload'); setScannerError(null); stopScanner();}}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                  scanMode === 'upload' 
                    ? 'bg-blue-500 text-white shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Image className="w-4 h-4" />
                <span className="hidden sm:inline">Gallery</span>
                <span className="sm:hidden">Upload</span>
              </button>
            </div>
          </div>

          {/* Verification Loading Overlay */}
          {isVerifying && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/95 backdrop-blur-sm rounded-2xl">
              <div className="flex flex-col items-center space-y-4">
                <div className="w-16 h-16 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
                <div className="text-center">
                  <p className="text-lg font-semibold text-gray-900">Verifying Product</p>
                  <p className="text-sm text-gray-600">Please wait while we verify the product...</p>
                </div>
              </div>
            </div>
          )}

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto overscroll-contain">
            <div className="p-4 pt-2 sm:p-6 sm:pt-4">
              <div className="flex flex-col items-center min-h-0 space-y-4 sm:space-y-6">
                
                {/* Hidden file input for gallery upload */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                {scanMode === 'camera' ? (
                  <div className="flex flex-col items-center w-full space-y-4">
                    <p className="px-4 text-sm text-center text-gray-600 sm:text-base">
                      {isScanning ? description : 'Preparing camera...'}
                    </p>

                    <div className="relative w-full max-w-[280px] sm:max-w-[320px] mx-auto aspect-square">
                      {/* Video Element for QR Scanner */}
                      <video
                        ref={videoRef}
                        className="absolute inset-0 object-cover w-full h-full bg-black rounded-2xl"
                        autoPlay
                        muted
                        playsInline
                        style={{ 
                          transform: isMobile ? 'scaleX(-1)' : 'none'
                        }}
                      />

                      {/* Overlay and Corner Markers */}
                      <div className="absolute inset-0 pointer-events-none rounded-2xl">
                        {/* Corner Markers */}
                        <div className="absolute w-6 h-6 border-t-4 border-l-4 border-white shadow-lg top-4 left-4"></div>
                        <div className="absolute w-6 h-6 border-t-4 border-r-4 border-white shadow-lg top-4 right-4"></div>
                        <div className="absolute w-6 h-6 border-b-4 border-l-4 border-white shadow-lg bottom-4 left-4"></div>
                        <div className="absolute w-6 h-6 border-b-4 border-r-4 border-white shadow-lg bottom-4 right-4"></div>

                        {/* Status Indicator with Capture Button */}
                        <div className="absolute inset-x-0 bottom-0 p-4 text-center bg-gradient-to-t from-black/60 to-transparent rounded-b-2xl">
                          <p className="text-sm font-medium text-white">
                            {isScanning ? 
                              'Position QR code within the frame' : 
                              'Initializing camera...'}
                          </p>
                          {isScanning && (
                            <div className="mt-2 space-y-2">
                              <p className="text-xs text-white/80">
                                Auto-detect enabled • Or capture manually
                              </p>
                              <button
                                onClick={captureImage}
                                disabled={isCapturing || !isScanning}
                                className="flex items-center gap-2 px-4 py-2 mx-auto text-sm font-medium text-black transition-all bg-white rounded-full hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {isCapturing ? (
                                  <>
                                    <div className="w-4 h-4 border-2 border-gray-600 rounded-full border-t-transparent animate-spin"></div>
                                    Processing...
                                  </>
                                ) : (
                                  <>
                                    <Camera className="w-4 h-4" />
                                    Capture
                                  </>
                                )}
                              </button>
                            </div>
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
                  </div>
                ) : (
                  /* Gallery Upload Mode */
                  <div className="w-full max-w-[320px] mx-auto">
                    <div className="mb-6 text-center">
                      <p className="px-2 text-sm text-gray-600 sm:text-base">
                        Select an image from your device that contains a QR code
                      </p>
                    </div>
                    
                    <div className="relative">
                      <button
                        onClick={triggerFileUpload}
                        disabled={isProcessingImage}
                        className={`w-full p-8 border-2 border-dashed rounded-2xl transition-all ${
                          isProcessingImage 
                            ? 'border-gray-300 bg-gray-50 cursor-not-allowed' 
                            : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50 cursor-pointer'
                        }`}
                      >
                        <div className="flex flex-col items-center space-y-4">
                          {isProcessingImage ? (
                            <>
                              <div className="w-12 h-12 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
                              <p className="text-sm font-medium text-gray-600">Processing image...</p>
                              <p className="text-xs text-gray-500">Scanning for QR code</p>
                            </>
                          ) : (
                            <>
                              <div className="flex items-center justify-center w-16 h-16 mx-auto bg-blue-100 rounded-full">
                                <Upload className="w-8 h-8 text-blue-600" />
                              </div>
                              <div className="space-y-2">
                                <p className="text-sm font-medium text-gray-900">Choose Image</p>
                                <p className="text-xs text-gray-500">JPG, PNG, WebP up to 10MB</p>
                              </div>
                            </>
                          )}
                        </div>
                      </button>
                    </div>
                  </div>
                )}

                {/* Error message */}
                {scannerError && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-[320px] p-4 mx-2 text-red-700 bg-red-50 border border-red-200 rounded-xl shadow-sm"
                  >
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="flex-shrink-0 w-5 h-5 mt-0.5 text-red-500" />
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-red-800">{scannerError}</p>
                        <div className="space-y-1 text-xs text-red-600">
                          {scanMode === 'camera' ? (
                            <>
                              <p>• Try adjusting lighting or camera angle</p>
                              <p>• Ensure the QR code is clear and within the frame</p>
                              {isMobile && <p>• Switch to Gallery mode to upload an image</p>}
                            </>
                          ) : (
                            <>
                              <p>• Make sure the image contains a visible QR code</p>
                              <p>• Try using a clearer image with better lighting</p>
                              <p>• Switch to Camera mode for real-time scanning</p>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col justify-center w-full gap-3 pt-2 sm:flex-row">
                  {scanMode === 'camera' && isScanning && (
                    <Button
                      onClick={captureImage}
                      disabled={isCapturing || isVerifying}
                      className="w-full px-6 sm:w-auto min-h-[44px]"
                    >
                      {isCapturing ? (
                        <>
                          <div className="w-4 h-4 mr-2 border-2 border-white rounded-full border-t-transparent animate-spin"></div>
                          Processing...
                        </>
                      ) : (
                        <>
                          <Camera className="w-4 h-4 mr-2" />
                          Capture Image
                        </>
                      )}
                    </Button>
                  )}
                  {scanMode === 'upload' && !isProcessingImage && !isVerifying && (
                    <Button
                      onClick={triggerFileUpload}
                      className="w-full px-6 sm:w-auto min-h-[44px]"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Select Image
                    </Button>
                  )}
                  <Button
                    variant="secondary"
                    onClick={onClose}
                    className="w-full px-6 sm:w-auto min-h-[44px]"
                    disabled={isProcessingImage || isCapturing || isVerifying}
                  >
                    {(isProcessingImage || isCapturing || isVerifying) ? 'Processing...' : 'Cancel'}
                  </Button>
                </div>

                {/* Bottom spacing for scrollable area */}
                <div className="h-2"></div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Location Permission Modal - only show if not skipping location check */}
      {!skipLocationCheck && showPermissionModal && (
        <LocationPermissionModal
          isOpen={showPermissionModal}
          onAccept={handlePermissionRequest}
          onDecline={handlePermissionRequest}
          title="Enable Location Tracking"
          description="Help improve pharmaceutical supply chain monitoring by allowing us to track where medications are being verified"
        />
      )}
    </AnimatePresence>
  );
};

export default QRScannerModal;