import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  PackagePlus, 
  CalendarDays, 
  MapPin, 
  BadgeCheck, 
  Download,
  Printer,
  CheckCircle,
  Copy
} from 'lucide-react';
import { generateQRCode, downloadQRCode } from '../../utils/qrCodeUtils';
import { Card } from '../../components/UI/Card';
import { Input } from '../../components/UI/Input';
import { Button } from '../../components/UI/Button';
import { Select } from '../../components/UI/Select';

const RegisterProduct = () => {  const [formData, setFormData] = useState({
    productName: '',
    serialNumber: '',
    batchNumber: '',
    manufactureDate: '',
    expiryDate: '',
    ingredients: '',
    productionLocation: '',
    storageRequirements: '',
    regulatoryApprovalId: '',
    dosageForm: '',
    strength: '',
    packagingType: '',
    manufacturerName: 'PharmaCorp Inc.',
    manufacturerLicense: '',
    shelfLife: '',
    storageInstructions: '',
    composition: '',
    categoryType: '',
    description: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generatedQR, setGeneratedQR] = useState(null);
  const [showQRModal, setShowQRModal] = useState(false);

  const dosageForms = [
    'Tablet', 'Capsule', 'Injection', 'Syrup', 'Cream', 'Ointment',
    'Gel', 'Drops', 'Inhaler', 'Powder', 'Suspension'
  ];

  const categories = [
    'Antibiotics', 'Analgesics', 'Antidiabetics', 'Cardiovascular',
    'Respiratory', 'Antiviral', 'Vaccines', 'Hormones', 'Supplements'
  ];

  const packagingTypes = [
    'Blister Pack', 'Bottle', 'Vial', 'Ampoule', 'Tube',
    'Sachet', 'Strip', 'Container', 'Prefilled Syringe'
  ];
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Generate QR code
      const qrDataUrl = await generateQRCode({
        ...formData,
        registrationDate: new Date().toISOString(),
        manufacturer: formData.manufacturerName
      });

      // Simulate blockchain registration
      await new Promise(resolve => setTimeout(resolve, 2000));

      setGeneratedQR(qrDataUrl);
      setShowQRModal(true);

      // Reset form after successful submission
      setFormData({
        productName: '',
        serialNumber: '',
        batchNumber: '',
        manufactureDate: '',
        expiryDate: '',
        ingredients: '',
        productionLocation: '',
        storageRequirements: '',
        regulatoryApprovalId: '',
        dosageForm: '',
        strength: '',
        packagingType: '',
        manufacturerName: 'PharmaCorp Inc.',
        manufacturerLicense: '',
        shelfLife: '',
        storageInstructions: '',
        composition: '',
        categoryType: '',
        description: ''
      });
    } catch (error) {
      console.error('Error registering product:', error);
      // You would typically show an error message to the user here
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="min-h-screen">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-3xl font-bold text-gray-900">Register New Product</h1>
        <p className="mt-3 text-lg text-gray-600">
          Add a new pharmaceutical product to the blockchain ledger
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="max-w-4xl mx-auto mt-8"
      >
        <Card className="overflow-hidden">
          <form onSubmit={handleSubmit} className="p-6 space-y-8">
            {/* Basic Information */}
            <div className="space-y-6">
              <div className="flex items-center space-x-2 text-lg font-semibold text-gray-900">
                <PackagePlus className="w-5 h-5 text-blue-600" />
                <h3>Basic Information</h3>
              </div>
              <div className="grid gap-6 md:grid-cols-2">
                <Input
                  label="Product Name"
                  name="productName"
                  value={formData.productName}
                  onChange={handleChange}
                  placeholder="Enter product name"
                  required
                />
                <Input
                  label="Serial Number"
                  name="serialNumber"
                  value={formData.serialNumber}
                  onChange={handleChange}
                  placeholder="Auto-generated or manual entry"
                  required
                />
                <Input
                  label="Batch Number"
                  name="batchNumber"
                  value={formData.batchNumber}
                  onChange={handleChange}
                  placeholder="Enter batch number"
                  required
                />
                <Select
                  label="Category"
                  name="categoryType"
                  value={formData.categoryType}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select category</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </Select>
              </div>
            </div>

            {/* Product Details */}
            <div className="space-y-6">
              <div className="flex items-center space-x-2 text-lg font-semibold text-gray-900">
                <BadgeCheck className="w-5 h-5 text-blue-600" />
                <h3>Product Details</h3>
              </div>
              <div className="grid gap-6 md:grid-cols-2">
                <Select
                  label="Dosage Form"
                  name="dosageForm"
                  value={formData.dosageForm}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select dosage form</option>
                  {dosageForms.map(form => (
                    <option key={form} value={form}>{form}</option>
                  ))}
                </Select>
                <Input
                  label="Strength"
                  name="strength"
                  value={formData.strength}
                  onChange={handleChange}
                  placeholder="e.g., 500mg, 10ml"
                  required
                />
                <Select
                  label="Packaging Type"
                  name="packagingType"
                  value={formData.packagingType}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select packaging type</option>
                  {packagingTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </Select>
                <Input
                  label="Shelf Life"
                  name="shelfLife"
                  value={formData.shelfLife}
                  onChange={handleChange}
                  placeholder="e.g., 24 months"
                  required
                />
              </div>
            </div>

            {/* Dates and Storage */}
            <div className="space-y-6">
              <div className="flex items-center space-x-2 text-lg font-semibold text-gray-900">
                <CalendarDays className="w-5 h-5 text-blue-600" />
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
                  placeholder="Enter license number"
                  required
                />
                <Input
                  label="Production Location"
                  name="productionLocation"
                  value={formData.productionLocation}
                  onChange={handleChange}
                  placeholder="Enter production facility location"
                  icon={<MapPin className="w-5 h-5" />}
                  required
                />
                <Input
                  label="Regulatory Approval ID"
                  name="regulatoryApprovalId"
                  value={formData.regulatoryApprovalId}
                  onChange={handleChange}
                  placeholder="Enter FDA/regulatory approval number"
                  required
                />
              </div>
            </div>

            {/* Additional Details */}
            <div className="space-y-6">
              <div className="flex items-center space-x-2 text-lg font-semibold text-gray-900">
                <BadgeCheck className="w-5 h-5 text-blue-600" />
                <h3>Additional Information</h3>
              </div>
              <div className="grid gap-6">
                <Input
                  label="Composition"
                  name="composition"
                  value={formData.composition}
                  onChange={handleChange}
                  placeholder="Enter detailed composition"
                  required
                />
                <Input
                  label="Storage Instructions"
                  name="storageInstructions"
                  value={formData.storageInstructions}
                  onChange={handleChange}
                  placeholder="Enter storage requirements and instructions"
                  required
                />
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows="4"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Enter additional product description or notes"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end pt-6 mt-6 border-t border-gray-100">
              <Button
                type="submit"
                variant="primary"
                className="w-full px-8 py-3 sm:w-auto"
                loading={isSubmitting}
              >
                Register Product
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
              <p className="mb-6 text-center text-gray-600">
                The product has been registered on the blockchain and a QR code has been generated.
              </p>
              
              {/* QR Code Display */}
              <div className="p-4 mb-6 bg-white border rounded-lg">
                <img src={generatedQR} alt="Product QR Code" className="w-48 h-48 mx-auto" />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap justify-center gap-4">
                <Button
                  variant="secondary"
                  className="flex items-center gap-2"
                  onClick={() => downloadQRCode(generatedQR, `QR-${formData.serialNumber}.png`)}
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
                <Button
                  variant="secondary"
                  className="flex items-center gap-2"
                  onClick={() => {
                    navigator.clipboard.writeText(generatedQR);
                    // You might want to show a toast notification here
                  }}
                >
                  <Copy className="w-5 h-5" />
                  Copy URL
                </Button>
              </div>

              <Button
                variant="primary"
                className="w-full mt-6"
                onClick={() => setShowQRModal(false)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegisterProduct;
