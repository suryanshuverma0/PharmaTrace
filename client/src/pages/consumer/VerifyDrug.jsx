import React, { useState } from "react";
import { motion } from "framer-motion";
import { Search, Scan, Package, ArrowRight, X, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card } from "../../components/UI/Card";
import { Input } from "../../components/UI/Input";
import { Button } from "../../components/UI/Button";
import { Modal } from "../../components/UI/Modal";
import { Badge } from "../../components/UI/Badge";
import { verificationAPI } from "../../services/api/verificationAPI";

const VerifyDrug = () => {
  const navigate = useNavigate();
  const [verificationMethod, setVerificationMethod] = useState(null);
  const [showScanner, setShowScanner] = useState(false);
  const [serialNumber, setSerialNumber] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [error, setError] = useState(null);

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut",
      },
    },
  };

  const handleVerify = async () => {
    if (!serialNumber.trim()) {
      setError('Please enter a serial number');
      return;
    }

    setIsVerifying(true);
    setError(null);

    try {
      const result = await verificationAPI.verifyProduct(serialNumber.trim());
      setVerificationResult(result);
    } catch (error) {
      console.error('Verification error:', error);
      setError(error.message || 'Failed to verify product. Please check the serial number and try again.');
      
      // Set a fake result for products not found to show the structure
      if (error.message?.includes('not found')) {
        setVerificationResult({
          success: false,
          isAuthentic: false,
          message: 'Product not found in our database',
          product: {
            serialNumber: serialNumber.trim()
          }
        });
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const resetVerification = () => {
    setVerificationMethod(null);
    setSerialNumber("");
    setVerificationResult(null);
    setError(null);
  };

  return (
    <motion.div
      className="max-w-5xl min-h-screen mx-auto space-y-8"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Header */}
      <div className="text-center">
        <motion.h1
          className="text-3xl font-bold text-gray-900"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          Verify Your Medication
        </motion.h1>
        <motion.p
          className="mt-3 text-lg text-gray-600"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          Ensure the authenticity of your medication by scanning the QR code or
          entering the serial number
        </motion.p>
      </div>

      {!verificationResult ? (
        <div className="grid grid-cols-1 gap-8 mt-8 md:grid-cols-2">
          {/* QR Code Scanner Option */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="transition-all duration-300 hover:shadow-xl hover:-translate-y-1 bg-gradient-to-br from-gray-50 to-white">
              <button
                onClick={() => {
                  setVerificationMethod("qr");
                  setShowScanner(true);
                }}
                className="w-full p-8 text-left"
              >
                <div className="flex flex-col items-center space-y-4 text-center">
                  <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary-100">
                    <Scan className="w-8 h-8 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      Scan QR Code
                    </h3>
                    <p className="mt-2 text-gray-600">
                      Quick and easy verification using your device's camera
                    </p>
                  </div>
                </div>
              </button>
            </Card>
          </motion.div>

          {/* Manual Entry Option */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="transition-all duration-300 hover:shadow-xl hover:-translate-y-1 bg-gradient-to-br from-gray-50 to-white">
              <button
                onClick={() => setVerificationMethod("manual")}
                className="w-full p-8 text-left"
              >
                <div className="flex flex-col items-center space-y-4 text-center">
                  <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary-100">
                    <Package className="w-8 h-8 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      Manual Entry
                    </h3>
                    <p className="mt-2 text-gray-600">
                      Enter the serial number printed on your medication package
                    </p>
                  </div>
                </div>
              </button>
            </Card>
          </motion.div>

          {/* Manual Input Form */}
          {verificationMethod === "manual" && (
            <motion.div
              className="md:col-span-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="overflow-hidden">
                <div className="p-8 bg-gradient-to-br from-primary-50 to-white">
                  <h3 className="mb-6 text-xl font-semibold text-gray-900">
                    Enter Serial Number
                  </h3>
                  {error && (
                    <div className="flex items-center p-4 mb-4 text-red-700 bg-red-100 border border-red-200 rounded-lg">
                      <AlertTriangle className="w-5 h-5 mr-2" />
                      <span className="text-sm">{error}</span>
                    </div>
                  )}
                  <div className="flex flex-col w-full gap-4 sm:flex-row">
                    <div className="flex-grow">
                      <Input
                        placeholder="Enter product serial number"
                        value={serialNumber}
                        onChange={(e) => setSerialNumber(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleVerify()}
                        icon={<Search className="w-5 h-5" />}
                        className="w-full text-lg"
                      />
                    </div>
                    <Button
                      variant="primary"
                      onClick={handleVerify}
                      loading={isVerifying}
                      disabled={!serialNumber.trim()}
                      className="w-full h-full px-8 py-3 sm:w-auto"
                    >
                      Verify
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}
        </div>
      ) : (
        /* Verification Result */
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="overflow-hidden">
            <div className="p-8">
              <div className="flex items-start justify-between mb-8">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    {verificationResult.isAuthentic ? (
                      <>
                        <div className="absolute inset-0 bg-green-500 rounded-full opacity-25"></div>
                        <Badge variant="success" size="lg" className="relative flex items-center">
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Authentic Product
                        </Badge>
                      </>
                    ) : (
                      <>
                        <div className="absolute inset-0 bg-red-500 rounded-full opacity-25"></div>
                        <Badge variant="danger" size="lg" className="relative flex items-center">
                          <XCircle className="w-4 h-4 mr-2" />
                          {verificationResult.success === false ? 'Product Not Found' : 'Unverified Product'}
                        </Badge>
                      </>
                    )}
                  </div>
                  <p className="text-gray-600">
                    Verified on {new Date().toLocaleDateString()}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  onClick={resetVerification}
                  className="rounded-full hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                <div className="space-y-6">
                  <div className="pb-6 border-b border-gray-100">
                    <h3 className="text-2xl font-semibold text-gray-900">
                      {verificationResult.product?.productName || 'Unknown Product'}
                    </h3>
                    <p className="mt-2 text-gray-600">
                      Manufactured by {verificationResult.manufacturer?.name || 'Unknown Manufacturer'}
                    </p>
                  </div>

                  {verificationResult.success !== false && (
                    <>
                      {/* Expiry Warning */}
                      {verificationResult.isExpired && (
                        <div className="flex items-center p-4 text-red-700 bg-red-100 border border-red-200 rounded-lg">
                          <AlertTriangle className="w-5 h-5 mr-2" />
                          <span className="text-sm font-medium">This product has expired</span>
                        </div>
                      )}
                      
                      {!verificationResult.isExpired && verificationResult.daysUntilExpiry <= 30 && (
                        <div className="flex items-center p-4 text-orange-700 bg-orange-100 border border-orange-200 rounded-lg">
                          <AlertTriangle className="w-5 h-5 mr-2" />
                          <span className="text-sm font-medium">
                            Expires in {verificationResult.daysUntilExpiry} days
                          </span>
                        </div>
                      )}

                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-4 rounded-lg bg-gray-50">
                            <p className="text-sm text-gray-500">Serial Number</p>
                            <p className="mt-1 font-medium text-gray-900">
                              {verificationResult.product?.serialNumber}
                            </p>
                          </div>
                          <div className="p-4 rounded-lg bg-gray-50">
                            <p className="text-sm text-gray-500">Batch Number</p>
                            <p className="mt-1 font-medium text-gray-900">
                              {verificationResult.product?.batchNumber}
                            </p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-4 rounded-lg bg-gray-50">
                            <p className="text-sm text-gray-500">Manufacture Date</p>
                            <p className="mt-1 font-medium text-gray-900">
                              {verificationResult.product?.manufactureDate ? 
                                new Date(verificationResult.product.manufactureDate).toLocaleDateString() : 
                                'N/A'}
                            </p>
                          </div>
                          <div className="p-4 rounded-lg bg-gray-50">
                            <p className="text-sm text-gray-500">Expiry Date</p>
                            <p className="mt-1 font-medium text-gray-900">
                              {verificationResult.product?.expiryDate ? 
                                new Date(verificationResult.product.expiryDate).toLocaleDateString() : 
                                'N/A'}
                            </p>
                          </div>
                        </div>
                        
                        {/* Additional Product Details */}
                        {(verificationResult.product?.dosageForm || verificationResult.product?.strength) && (
                          <div className="grid grid-cols-2 gap-4">
                            {verificationResult.product.dosageForm && (
                              <div className="p-4 rounded-lg bg-gray-50">
                                <p className="text-sm text-gray-500">Dosage Form</p>
                                <p className="mt-1 font-medium text-gray-900">
                                  {verificationResult.product.dosageForm}
                                </p>
                              </div>
                            )}
                            {verificationResult.product.strength && (
                              <div className="p-4 rounded-lg bg-gray-50">
                                <p className="text-sm text-gray-500">Strength</p>
                                <p className="mt-1 font-medium text-gray-900">
                                  {verificationResult.product.strength}
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  {/* Error message for not found products */}
                  {verificationResult.success === false && (
                    <div className="p-6 border border-red-200 rounded-lg bg-red-50">
                      <h4 className="text-lg font-semibold text-red-800">Product Not Found</h4>
                      <p className="mt-2 text-red-600">
                        The serial number "{verificationResult.product?.serialNumber}" was not found in our database. 
                        Please check the serial number and try again.
                      </p>
                    </div>
                  )}
                </div>

                <div className="space-y-6">
                  {verificationResult.success !== false && verificationResult.currentLocation && (
                    <div className="p-6 rounded-lg bg-primary-50">
                      <h4 className="text-lg font-semibold text-gray-900">
                        Current Location
                      </h4>
                      <p className="mt-2 text-gray-600">
                        {verificationResult.currentLocation.location}
                      </p>
                      <p className="mt-1 text-sm text-gray-500">
                        Updated: {new Date(verificationResult.currentLocation.lastUpdated).toLocaleString()}
                      </p>
                    </div>
                  )}

                  {/* Blockchain Verification */}
                  {verificationResult.blockchain?.verified && (
                    <div className="p-6 rounded-lg bg-blue-50">
                      <h4 className="text-lg font-semibold text-gray-900">
                        Blockchain Verified
                      </h4>
                      <p className="mt-2 text-gray-600">
                        This product is verified on the blockchain
                      </p>
                      {verificationResult.blockchain.txHash && (
                        <p className="mt-1 text-xs text-blue-600 break-all">
                          TX: {verificationResult.blockchain.txHash}
                        </p>
                      )}
                    </div>
                  )}

                  {verificationResult.success !== false && (
                    <Button
                      variant="primary"
                      className="justify-center w-full py-3 text-center transition-all duration-300 shadow-lg hover:shadow-xl"
                      onClick={() =>
                        navigate(
                          `/consumer/journey/${verificationResult.product?.serialNumber}`
                        )
                      }
                    >
                      View Complete Journey
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      )}      {/* QR Scanner Modal */}
      <Modal
        isOpen={showScanner}
        onClose={() => setShowScanner(false)}
        title="Scan QR Code"
      >
        <div className="p-4 sm:p-6">
          <div className="flex flex-col items-center space-y-6">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary-100">
              <Scan className="w-6 h-6 text-primary-600" />
            </div>
            
            <p className="text-sm text-center text-gray-600 sm:text-base">
              Center the QR code within the frame to verify your medication
            </p>

            <div className="relative w-full max-w-[280px] sm:max-w-[300px] mx-auto aspect-square">
              {/* Scanner Container */}
              <div className="absolute inset-0 overflow-hidden rounded-2xl bg-black/5 backdrop-blur-sm">
                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="text-sm text-gray-500">Camera feed would appear here</p>
                </div>

                {/* Scanning Animation */}
                <div className="absolute inset-0 scanning-line"></div>

                {/* Corner Markers */}
                <div className="absolute top-0 left-0 w-16 h-16 border-t-4 border-l-4 border-primary-500"></div>
                <div className="absolute top-0 right-0 w-16 h-16 border-t-4 border-r-4 border-primary-500"></div>
                <div className="absolute bottom-0 left-0 w-16 h-16 border-b-4 border-l-4 border-primary-500"></div>
                <div className="absolute bottom-0 right-0 w-16 h-16 border-b-4 border-r-4 border-primary-500"></div>

                {/* Status Indicator */}
                <div className="absolute inset-x-0 bottom-0 p-4 text-center bg-gradient-to-t from-black/30 to-transparent">
                  <p className="text-sm font-medium text-white">Scanning...</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col justify-center w-full gap-3 sm:flex-row">
              <Button
                variant="secondary"
                onClick={() => setShowScanner(false)}
                className="w-full px-6 sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  setShowScanner(false);
                  setSerialNumber("SCANNED123");
                  handleVerify();
                }}
                className="w-full px-6 sm:w-auto"
              >
                Manual Entry
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* <style jsx>{`
        .scanning-line {
          position: absolute;
          width: 100%;
          height: 2px;
          background: linear-gradient(90deg, transparent, #4f46e5, transparent);
          animation: scan 2s linear infinite;
        }

        @keyframes scan {
          0% {
            top: 0;
          }
          50% {
            top: 100%;
          }
          100% {
            top: 0;
          }
        }
      `}</style> */}
    </motion.div>
  );
};

export default VerifyDrug;
