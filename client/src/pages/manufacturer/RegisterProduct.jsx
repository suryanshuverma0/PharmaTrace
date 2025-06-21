import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { PackagePlus, BadgeCheck, Download, Printer, CheckCircle, DollarSign, User } from 'lucide-react';
import { generateQRCode, downloadQRCode } from '../../utils/qrCodeUtils';
import Card from '../../components/UI/Card';
import Input from '../../components/UI/Input';
import Button from '../../components/UI/Button';
import Select from '../../components/UI/Select';
import Alert from '../../components/UI/Alert';
import apiClient from '../../services/api/api';
import { Link } from 'react-router-dom';

const RegisterProduct = () => {
  const [formData, setFormData] = useState({
    productName: '',
    serialNumber: '',
    batchNumber: '',
    drugCode: '',
    price: '',
    dosageForm: '',
    strength: '',
    storageConditions: '',
    approvalCertId: '',
    productionLocation: '',
    manufactureDate: '',
    expiryDate: '',
    manufacturerAddress: '',
  });
  const [batches, setBatches] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alert, setAlert] = useState(null);
  const [generatedQR, setGeneratedQR] = useState(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [txHash, setTxHash] = useState('');
  const [digitalFingerprint, setDigitalFingerprint] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch batches
        const batchesResponse = await apiClient.get('/batches');
        setBatches(batchesResponse.data.batches || []);
        if (batchesResponse.data.batches.length === 0) {
          setAlert({
            type: 'warning',
            title: 'No Batches Available',
            message: (
              <>
                You need to register a batch before adding a product.{' '}
                <Link to="/register-batch" className="text-blue-600 underline">
                  Register a batch now
                </Link>.
              </>
            ),
          });
        }
      } catch (err) {
        setAlert({
          type: 'error',
          title: 'Failed to Load Data',
          message: err.response?.data?.message || 'An error occurred while fetching data.',
        });
      }
    };
    fetchData();
  }, []);

  const handleChange = (e) => {
    if (typeof e === 'string') {
      // Handle batchNumber change from Select
      const selectedBatch = batches.find((batch) => batch.batchNumber === e);
      setFormData((prev) => ({
        ...prev,
        batchNumber: e,
        dosageForm: selectedBatch?.dosageForm || '',
        strength: selectedBatch?.strength || '',
        storageConditions: selectedBatch?.storageConditions || '',
        approvalCertId: selectedBatch?.approvalCertId || '',
        productionLocation: selectedBatch?.productionLocation || '',
        manufactureDate: selectedBatch?.manufactureDate ? new Date(selectedBatch.manufactureDate).toISOString().split('T')[0] : '',
        expiryDate: selectedBatch?.expiryDate ? new Date(selectedBatch.expiryDate).toISOString().split('T')[0] : '',
      }));
    } else {
      const { name, value } = e.target;
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const validateForm = () => {
    const errors = [];
    if (!formData.productName) errors.push('Product name is required.');
    if (!formData.serialNumber) errors.push('Serial number is required.');
    if (!formData.batchNumber) errors.push('Batch number is required.');
    if (!formData.price) errors.push('Price is required.');
    else if (isNaN(formData.price) || Number(formData.price) <= 0) {
      errors.push('Price must be a positive number.');
    }
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setAlert(null);

    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setAlert({
        type: 'error',
        title: 'Validation Error',
        message: validationErrors.join(' '),
      });
      setIsSubmitting(false);
      return;
    }

    try {
      const selectedBatch = batches.find((batch) => batch.batchNumber === formData.batchNumber);
      if (!selectedBatch) {
        throw new Error('Selected batch not found');
      }

      // Send only required fields
      const payload = {
        productName: formData.productName,
        serialNumber: formData.serialNumber,
        batchNumber: formData.batchNumber,
        drugCode: formData.drugCode,
        price: Number(formData.price),
      };

      const response = await apiClient.post('/products/register', payload);

      if (response.status === 201) {
        const data = response.data;
        setTxHash(data.txHash);
        setDigitalFingerprint(data.fingerprint);

        const qrData = {
          productName: formData.productName,
          serialNumber: formData.serialNumber,
          batchNumber: formData.batchNumber,
          drugCode: formData.drugCode,
          price: formData.price,
          dosageForm: selectedBatch.dosageForm,
          strength: selectedBatch.strength,
          storageConditions: selectedBatch.storageConditions,
          approvalCertId: selectedBatch.approvalCertId,
          productionLocation: selectedBatch.productionLocation,
          manufactureDate: selectedBatch.manufactureDate,
          expiryDate: selectedBatch.expiryDate,
          txHash: data.txHash,
          fingerprint: data.fingerprint,
          registrationTimestamp: data.registrationTimestamp,
          contractAddress: data.contractAddress,
          productId: data.productId,
        };

        const qrDataUrl = await generateQRCode(JSON.stringify(qrData));
        setGeneratedQR(qrDataUrl);
        setShowQRModal(true);
        setAlert({
          type: 'success',
          title: 'Product Registered',
          message: `Product ${formData.productName} (${formData.serialNumber}) registered successfully.`,
        });
      }
    } catch (err) {
      let errorMessage = 'An error occurred while registering the product.';
      if (err.response) {
        if (err.response.status === 401) {
          errorMessage = 'Authentication failed. Please log in again.';
        } else if (err.response.status === 403) {
          errorMessage = 'Unauthorized: Your blockchain address does not match.';
        } else if (err.response.status === 404) {
          errorMessage = 'Batch not found or not owned by you.';
        } else if (err.response.status === 500) {
          errorMessage = err.response.data.details || errorMessage;
        } else {
          errorMessage = err.response.data?.message || errorMessage;
        }
      } else {
        errorMessage = err.message || errorMessage;
      }
      setAlert({
        type: 'error',
        title: 'Registration Failed',
        message: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      productName: '',
      serialNumber: '',
      batchNumber: '',
      drugCode: '',
      price: '',
      dosageForm: '',
      strength: '',
      storageConditions: '',
      approvalCertId: '',
      productionLocation: '',
      manufactureDate: '',
      expiryDate: '',
    });
    setGeneratedQR(null);
    setTxHash('');
    setDigitalFingerprint('');
    setShowQRModal(false);
    setAlert(null);
  };

  const batchOptions = batches.map((batch) => ({
    value: batch.batchNumber,
    label: `${batch.batchNumber} (Qty: ${batch.quantityAvailable})`,
  }));

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 text-center"
      >
        <h1 className="text-3xl font-bold text-gray-900">Register New Product</h1>
        <p className="mt-3 text-lg text-gray-600">
          Add a new pharmaceutical product to the blockchain ledger
        </p>
      </motion.div>

      {alert && (
        <Alert
          type={alert.type}
          title={alert.title}
          onClose={() => setAlert(null)}
          className="max-w-4xl mx-auto mb-6"
        >
          {alert.message}
        </Alert>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="max-w-4xl mx-auto"
      >
        <Card className="overflow-hidden">
          <form onSubmit={handleSubmit} className="p-6 space-y-8" disabled={batches.length === 0}>
            {/* Basic Information */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                <PackagePlus className="w-5 h-5 text-primary-600" />
                <h3>Basic Information</h3>
              </div>
              <div className="grid gap-6 md:grid-cols-2">
                <Input
                  label="Product Name"
                  name="productName"
                  value={formData.productName}
                  onChange={handleChange}
                  required
                  disabled={batches.length === 0}
                  placeholder="e.g., Paracetamol"
                />
                <Input
                  label="Serial Number"
                  name="serialNumber"
                  value={formData.serialNumber}
                  onChange={handleChange}
                  required
                  disabled={batches.length === 0}
                  placeholder="e.g., SN123456789"
                />
                <Select
                  label="Batch Number"
                  value={formData.batchNumber}
                  onChange={handleChange}
                  options={batchOptions}
                  placeholder="Select a batch"
                  required
                  disabled={batches.length === 0}
                />
                <Input
                  label="Drug Code"
                  name="drugCode"
                  value={formData.drugCode}
                  onChange={handleChange}
                  disabled={batches.length === 0}
                  placeholder="e.g., NDC12345"
                />
                <Input
                  type="number"
                  label="Price (USD)"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  required
                  disabled={batches.length === 0}
                  placeholder="e.g., 29.99"
                  min="0.01"
                  step="0.01"
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
                  readOnly
                  disabled
                  placeholder="Select a batch to auto-fill"
                />
                <Input
                  label="Strength"
                  name="strength"
                  value={formData.strength}
                  readOnly
                  disabled
                  placeholder="Select a batch to auto-fill"
                />
                <Input
                  label="Storage Conditions"
                  name="storageConditions"
                  value={formData.storageConditions}
                  readOnly
                  disabled
                  placeholder="Select a batch to auto-fill"
                />
                <Input
                  label="Approval Certificate ID"
                  name="approvalCertId"
                  value={formData.approvalCertId}
                  readOnly
                  disabled
                  placeholder="Select a batch to auto-fill"
                />
                <Input
                  label="Production Location"
                  name="productionLocation"
                  value={formData.productionLocation}
                  readOnly
                  disabled
                  placeholder="Select a batch to auto-fill"
                />
                <Input
                  label="Manufacture Date"
                  name="manufactureDate"
                  value={formData.manufactureDate}
                  readOnly
                  disabled
                  placeholder="Select a batch to auto-fill"
                />
                <Input
                  label="Expiry Date"
                  name="expiryDate"
                  value={formData.expiryDate}
                  readOnly
                  disabled
                  placeholder="Select a batch to auto-fill"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end pt-6">
              <Button
                type="submit"
                variant="primary"
                className="w-full sm:w-auto"
                disabled={isSubmitting || !formData.batchNumber || batches.length === 0}
              >
                {isSubmitting ? 'Registering...' : 'Register Product'}
              </Button>
            </div>
          </form>
        </Card>
      </motion.div>

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

              <div className="w-full p-4 mb-4 rounded-lg bg-gray-50">
                <div className="mb-2">
                  <p className="text-sm text-gray-600">Transaction Hash</p>
                  <p className="font-mono text-sm break-all">{txHash}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Digital Fingerprint</p>
                  <p className="font-mono text-sm break-all">{digitalFingerprint}</p>
                </div>
              </div>

              <div className="p-4 mb-6 bg-white border rounded-lg">
                <img
                  src={generatedQR}
                  alt="Product QR Code"
                  className="w-48 h-48 mx-auto"
                />
              </div>

              <div className="flex flex-wrap justify-center gap-4">
                <Button
                  variant="secondary"
                  className="flex items-center gap-2"
                  onClick={() =>
                    downloadQRCode(generatedQR, `QR-${formData.serialNumber}.png`)
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
                onClick={resetForm}
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
