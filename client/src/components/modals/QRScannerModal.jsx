import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, AlertTriangle, Camera, Scan, Image, Upload } from "lucide-react";

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
  description = "Position the QR code within the frame"
}) => {
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

  // Mock QR Scanner functionality (replace with actual QrScanner import)
  const initializeScanner = async () => {
    if (!videoRef.current) return;
    
    try {
      setScannerError(null);
      setIsScanning(false);
      
      // Request camera access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: isMobile ? 'environment' : 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsScanning(true);
      }
    } catch (error) {
      console.error('Failed to start camera:', error);
      let errorMessage = 'Failed to access camera. ';
      
      if (error.name === 'NotAllowedError') {
        errorMessage += 'Please allow camera permissions and try again.';
      } else if (error.name === 'NotFoundError') {
        errorMessage += 'No camera found on this device.';
      } else {
        errorMessage += 'Please check camera permissions and try again.';
      }
      
      setScannerError(errorMessage);
      setIsScanning(false);
    }
  };

  const stopScanner = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject;
      const tracks = stream.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
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

      // Simulate QR scanning (replace with actual QrScanner.scanImage)
      setTimeout(() => {
        // Mock result
        const mockSerial = 'DEMO-' + Math.random().toString(36).substr(2, 9).toUpperCase();
        onScanResult(mockSerial, JSON.stringify({ serialNumber: mockSerial }));
        onClose();
      }, 2000);
      
    } catch (error) {
      console.error('Error scanning uploaded image:', error);
      setScannerError(error.message || 'Failed to scan QR code from image.');
      setIsProcessingImage(false);
    }
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  useEffect(() => {
    if (isOpen) {
      if (isMobile) {
        document.body.style.overflow = 'hidden';
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

                        {/* Status Indicator */}
                        <div className="absolute inset-x-0 bottom-0 p-4 text-center bg-gradient-to-t from-black/60 to-transparent rounded-b-2xl">
                          <p className="text-sm font-medium text-white">
                            {isScanning ? 
                              (isMobile ? 'Hold steady and scan QR code' : 'Scanning for QR codes...') : 
                              'Initializing camera...'}
                          </p>
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
                  {scanMode === 'upload' && !isProcessingImage && (
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
                    disabled={isProcessingImage}
                  >
                    {isProcessingImage ? 'Processing...' : 'Cancel'}
                  </Button>
                </div>

                {/* Bottom spacing for scrollable area */}
                <div className="h-2"></div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default QRScannerModal;