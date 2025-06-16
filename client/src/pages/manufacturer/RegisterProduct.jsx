import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  PackagePlus,
  CalendarDays,
  Building,
  BadgeCheck,
  Download,
  Printer,
  CheckCircle,
  Copy,
} from "lucide-react";
import { generateQRCode, downloadQRCode } from "../../utils/qrCodeUtils";
import Card from "../../components/UI/Card";
import Input from "../../components/UI/Input";
import Button from "../../components/UI/Button";
import Select from "../../components/UI/Select";
import Alert from "../../components/UI/Alert";
import apiClient from "../../services/api/api";

const RegisterProduct = () => {
  const [formData, setFormData] = useState({
    name: "",
    serialNumber: "",
    batchNumber: "",
    manufactureDate: "",
    expiryDate: "",
    manufacturerName: "",
    manufacturerLicense: "",
    productionLocation: "",
    drugCode: "",
    dosageForm: "",
    strength: "",
    storageCondition: "",
    approvalCertificateId: "",
    manufacturerCountry: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [generatedQR, setGeneratedQR] = useState(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [txHash, setTxHash] = useState("");
  const [digitalFingerprint, setDigitalFingerprint] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      // Format dates to ISO string
      const formattedData = {
        name: formData.name, 
        serialNumber: formData.serialNumber,
        batchNumber: formData.batchNumber,
        manufactureDate: new Date(formData.manufactureDate).toISOString(),
        expiryDate: new Date(formData.expiryDate).toISOString(),
        manufacturerName: formData.manufacturerName,
        manufacturerLicense: formData.manufacturerLicense,
        productionLocation: formData.productionLocation,
        drugCode: formData.drugCode,
        dosageForm: formData.dosageForm,
        strength: formData.strength,
        storageCondition: formData.storageCondition,
        approvalCertificateId: formData.approvalCertificateId,
        manufacturerCountry: formData.manufacturerCountry,
      };

      // API call to register product
      const response = await apiClient.post(
        "/products/register/",
        formattedData
      );

      if (response.status === 201) {
        const data = response.data;

        // Set blockchain transaction data
        setTxHash(data?.txHash);
        setDigitalFingerprint(data.digitalFingerprint);

        // Generate QR code with all the product data
        const qrData = {
          ...formData,
          txHash: data?.txHash,
          digitalFingerprint: data.digitalFingerprint,
          registrationTimestamp: data.registrationTimestamp,
          manufacturerAddress: data.manufacturerAddress,
          contractAddress: data.contractAddress,
          productId: data.productId,
        };

        const qrDataUrl = await generateQRCode(JSON.stringify(qrData));
        setGeneratedQR(qrDataUrl);
        setSuccess(true);
        setShowQRModal(true);
      } else {
        throw new Error(response.data.message || "Failed to register product");
      }
    } catch (err) {
      console.error("Registration error:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "An error occurred while registering the product"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className="min-h-screen p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 text-center"
      >
        <h1 className="text-3xl font-bold text-gray-900">
          Register New Product
        </h1>
        <p className="mt-3 text-lg text-gray-600">
          Add a new pharmaceutical product to the blockchain ledger
        </p>
      </motion.div>

      {error && (
        <Alert
          type="error"
          message={error}
          onClose={() => setError("")}
          className="mb-6"
        />
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="max-w-4xl mx-auto"
      >
        <Card className="overflow-hidden">
          <form onSubmit={handleSubmit} className="p-6 space-y-8">
            {/* Basic Information */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                <PackagePlus className="w-5 h-5 text-primary-600" />
                <h3>Basic Information</h3>
              </div>
              <div className="grid gap-6 md:grid-cols-2">
                <Input
                  label="Product Name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
                <Input
                  label="Serial Number"
                  name="serialNumber"
                  value={formData.serialNumber}
                  onChange={handleChange}
                  required
                />
                <Input
                  label="Batch Number"
                  name="batchNumber"
                  value={formData.batchNumber}
                  onChange={handleChange}
                  required
                />
                <Input
                  label="Drug Code"
                  name="drugCode"
                  value={formData.drugCode}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Manufacturing Details */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                <Building className="w-5 h-5 text-primary-600" />
                <h3>Manufacturing Details</h3>
              </div>
              <div className="grid gap-6 md:grid-cols-2">
                <Input
                  type="date"
                  label="Manufacture Date"
                  name="manufactureDate"
                  value={formData.manufactureDate}
                  onChange={handleChange}
                  required
                />
                <Input
                  type="date"
                  label="Expiry Date"
                  name="expiryDate"
                  value={formData.expiryDate}
                  onChange={handleChange}
                  required
                />
                <Input
                  label="Manufacturer Name"
                  name="manufacturerName"
                  value={formData.manufacturerName}
                  onChange={handleChange}
                  required
                />
                <Input
                  label="Manufacturer License"
                  name="manufacturerLicense"
                  value={formData.manufacturerLicense}
                  onChange={handleChange}
                  required
                />
                <Input
                  label="Production Location"
                  name="productionLocation"
                  value={formData.productionLocation}
                  onChange={handleChange}
                  required
                />
                <Input
                  label="Manufacturer Country"
                  name="manufacturerCountry"
                  value={formData.manufacturerCountry}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Product Specifications */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                <BadgeCheck className="w-5 h-5 text-primary-600" />
                <h3>Product Specifications</h3>
              </div>
              <div className="grid gap-6 md:grid-cols-2">
                <Input
                  label="Dosage Form"
                  name="dosageForm"
                  value={formData.dosageForm}
                  onChange={handleChange}
                  required
                />
                <Input
                  label="Strength"
                  name="strength"
                  value={formData.strength}
                  onChange={handleChange}
                  required
                />
                <Input
                  label="Storage Condition"
                  name="storageCondition"
                  value={formData.storageCondition}
                  onChange={handleChange}
                  required
                />
                <Input
                  label="Approval Certificate ID"
                  name="approvalCertificateId"
                  value={formData.approvalCertificateId}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end pt-6">
              <Button
                type="submit"
                variant="primary"
                className="w-full sm:w-auto"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Registering..." : "Register Product"}
              </Button>
            </div>
          </form>
        </Card>
      </motion.div>

      {/* QR Code Success Modal */}
      {showQRModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md p-6 bg-white rounded-2xl">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 mb-4 text-green-500">
                <CheckCircle className="w-full h-full" />
              </div>
              <h3 className="mb-2 text-xl font-semibold text-gray-900">
                Product Registered Successfully
              </h3>

              {/* Blockchain Details */}
              <div className="w-full p-4 mb-4 rounded-lg bg-gray-50">
                <div className="mb-2">
                  <p className="text-sm text-gray-600">Transaction Hash</p>
                  <p className="font-mono text-sm break-all">{txHash}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Digital Fingerprint</p>
                  <p className="font-mono text-sm break-all">
                    {digitalFingerprint}
                  </p>
                </div>
              </div>

              {/* QR Code Display */}
              <div className="p-4 mb-6 bg-white border rounded-lg">
                <img
                  src={generatedQR}
                  alt="Product QR Code"
                  className="w-48 h-48 mx-auto"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap justify-center gap-4">
                <Button
                  variant="secondary"
                  className="flex items-center gap-2"
                  onClick={() =>
                    downloadQRCode(
                      generatedQR,
                      `QR-${formData.serialNumber}.png`
                    )
                  }
                >
                  <Download className="w-5 h-5" />
                  Download QR
                </Button>
                <Button
                  variant="secondary"
                  className="flex items-center gap-2"
                  onClick={() => window.print()}
                >
                  <Printer className="w-5 h-5" />
                  Print QR
                </Button>
              </div>

              <Button
                variant="primary"
                className="w-full mt-6"
                onClick={() => {
                  setShowQRModal(false);
                  // Reset form after closing modal
                  setFormData({
                    name: "",
                    serialNumber: "",
                    batchNumber: "",
                    manufactureDate: "",
                    expiryDate: "",
                    manufacturerName: "",
                    manufacturerLicense: "",
                    productionLocation: "",
                    drugCode: "",
                    dosageForm: "",
                    strength: "",
                    storageCondition: "",
                    approvalCertificateId: "",
                    manufacturerCountry: "",
                  });
                }}
              >
                Register Another Product
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegisterProduct;
