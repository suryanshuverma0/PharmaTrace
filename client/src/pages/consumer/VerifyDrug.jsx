import React, { useState } from "react";
import { motion } from "framer-motion";
import { Search, Scan, Package, ArrowRight, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card } from "../../components/UI/Card";
import { Input } from "../../components/UI/Input";
import { Button } from "../../components/UI/Button";
import { Modal } from "../../components/UI/Modal";
import { Badge } from "../../components/UI/Badge";

const VerifyDrug = () => {
  const navigate = useNavigate();
  const [verificationMethod, setVerificationMethod] = useState(null);
  const [showScanner, setShowScanner] = useState(false);
  const [serialNumber, setSerialNumber] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);

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
    setIsVerifying(true);
    // Simulate API call
    setTimeout(() => {
      setIsVerifying(false);
      setVerificationResult({
        isAuthentic: true,
        productName: "Amoxicillin 500mg",
        manufacturer: "PharmaCorp Inc.",
        serialNumber: serialNumber || "AMX123456789",
        manufactureDate: "2025-01-15",
        expiryDate: "2027-01-15",
        batchNumber: "BATCH123",
        currentLocation: "Pharmacy XYZ, New York",
      });
    }, 2000);
  };

  const resetVerification = () => {
    setVerificationMethod(null);
    setSerialNumber("");
    setVerificationResult(null);
  };

  return (
    <motion.div
      className="max-w-5xl mx-auto space-y-8"
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
                  <div className="flex flex-col w-full gap-4 sm:flex-row">
                    <div className="flex-grow">
                      <Input
                        placeholder="Enter product serial number"
                        value={serialNumber}
                        onChange={(e) => setSerialNumber(e.target.value)}
                        icon={<Search className="w-5 h-5" />}
                        className="w-full text-lg"
                      />
                    </div>
                    <Button
                      variant="primary"
                      onClick={handleVerify}
                      loading={isVerifying}
                      disabled={!serialNumber}
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
                    <div className="absolute inset-0 bg-green-500 rounded-full opacity-25 "></div>
                    <Badge variant="success" size="lg" className="relative">
                      Authentic Product
                    </Badge>
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
                      {verificationResult.productName}
                    </h3>
                    <p className="mt-2 text-gray-600">
                      Manufactured by {verificationResult.manufacturer}
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-lg bg-gray-50">
                        <p className="text-sm text-gray-500">Serial Number</p>
                        <p className="mt-1 font-medium text-gray-900">
                          {verificationResult.serialNumber}
                        </p>
                      </div>
                      <div className="p-4 rounded-lg bg-gray-50">
                        <p className="text-sm text-gray-500">Batch Number</p>
                        <p className="mt-1 font-medium text-gray-900">
                          {verificationResult.batchNumber}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-lg bg-gray-50">
                        <p className="text-sm text-gray-500">Manufacture Date</p>
                        <p className="mt-1 font-medium text-gray-900">
                          {verificationResult.manufactureDate}
                        </p>
                      </div>
                      <div className="p-4 rounded-lg bg-gray-50">
                        <p className="text-sm text-gray-500">Expiry Date</p>
                        <p className="mt-1 font-medium text-gray-900">
                          {verificationResult.expiryDate}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="p-6 rounded-lg bg-primary-50">
                    <h4 className="text-lg font-semibold text-gray-900">
                      Current Location
                    </h4>
                    <p className="mt-2 text-gray-600">
                      {verificationResult.currentLocation}
                    </p>
                  </div>
                  <Button
                    variant="primary"
                    className="justify-center w-full py-3 text-center transition-all duration-300 shadow-lg hover:shadow-xl"
                    onClick={() =>
                      navigate(
                        `/consumer/journey/${verificationResult.serialNumber}`
                      )
                    }
                  >
                    View Complete Journey
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {/* QR Scanner Modal */}
      <Modal
        isOpen={showScanner}
        onClose={() => setShowScanner(false)}
        title="Scan QR Code"
      >
        <div className="p-6">
          <p className="mb-6 text-center text-gray-600">
            Position the QR code within the frame to scan
          </p>
          <div className="relative max-w-sm mx-auto mb-6 overflow-hidden border-2 border-dashed aspect-square rounded-2xl border-primary-300 bg-gray-50">
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-gray-500">Camera feed would appear here</p>
            </div>
            <div className="absolute inset-0 border-2 opacity-50 border-primary-500 "></div>
          </div>
          <div className="flex justify-end space-x-4">
            <Button
              variant="secondary"
              onClick={() => setShowScanner(false)}
              className="px-6"
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
              className="px-6"
            >
              Verify
            </Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
};

export default VerifyDrug;
