import React from 'react';
import { motion } from 'framer-motion';
import {
  QrCode,
  Download,
  Printer,
  Box,
  Calendar,
  Clock,
  Tag,
  Pill,
  Thermometer,
  Building2,
  Shield,
  MapPin,
  Route,
  X
} from 'lucide-react';
import { Button } from '../UI/Button';

const ProductDetailsModal = ({ product, onClose, onDownloadQR }) => {
  if (!product) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
    >
      <div className="relative w-full max-w-2xl p-6 bg-white rounded-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute p-2 text-gray-400 transition-colors rounded-lg top-4 right-4 hover:text-gray-600 hover:bg-gray-100"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-start gap-4 mb-6">
          <div className="flex items-center justify-center flex-shrink-0 w-16 h-16 bg-blue-100 rounded-xl">
            <Box className="w-8 h-8 text-blue-600" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900">
              {product.productName}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Serial Number: {product.serialNumber}
            </p>
          </div>
        </div>

        {/* Product Details Grid */}
        <div className="grid gap-6 mb-6 sm:grid-cols-2">
          {/* Basic Information */}
          <div className="p-4 bg-gray-50 rounded-xl">
            <h4 className="mb-3 text-sm font-medium text-gray-900">Basic Information</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">Batch Number:</span>
                <span className="text-sm font-medium">{product.batchNumber}</span>
              </div>
              <div className="flex items-center gap-2">
                <Pill className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">Dosage Form:</span>
                <span className="text-sm font-medium">{product.dosageForm}</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">Strength:</span>
                <span className="text-sm font-medium">{product.strength}</span>
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className="p-4 bg-gray-50 rounded-xl">
            <h4 className="mb-3 text-sm font-medium text-gray-900">Important Dates</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">Manufacture Date:</span>
                <span className="text-sm font-medium">
                  {new Date(product.manufactureDate).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">Expiry Date:</span>
                <span className="text-sm font-medium">
                  {new Date(product.expiryDate).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          {/* Manufacturing Details */}
          <div className="p-4 bg-gray-50 rounded-xl">
            <h4 className="mb-3 text-sm font-medium text-gray-900">Manufacturing Details</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">Manufacturer:</span>
                <span className="text-sm font-medium">{product.manufacturerName}</span>
              </div>
              {product.manufacturerLicense && (
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">License:</span>
                  <span className="text-sm font-medium">{product.manufacturerLicense}</span>
                </div>
              )}
              {product.productionLocation && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">Location:</span>
                  <span className="text-sm font-medium">{product.productionLocation}</span>
                </div>
              )}
            </div>
          </div>

          {/* Storage & Other Details */}
          <div className="p-4 bg-gray-50 rounded-xl">
            <h4 className="mb-3 text-sm font-medium text-gray-900">Storage & Other Details</h4>
            <div className="space-y-3">
              {product.storageCondition && (
                <div className="flex items-center gap-2">
                  <Thermometer className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">Storage Condition:</span>
                  <span className="text-sm font-medium">{product.storageCondition}</span>
                </div>
              )}
              {product.drugCode && (
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">Drug Code:</span>
                  <span className="text-sm font-medium">{product.drugCode}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">Price:</span>
                <span className="text-sm font-medium">NPR {product.price}</span>
              </div>
            </div>
          </div>
        </div>

        {/* QR Code Section */}
        {product.qrCodeUrl && (
          <div className="p-4 mb-6 text-center bg-gray-50 rounded-xl">
            <div className="inline-block p-4 mb-4 bg-white border rounded-lg">
              <img
                src={product.qrCodeUrl}
                alt="Product QR Code"
                className="w-40 h-40 mx-auto"
              />
            </div>
            <div className="flex flex-wrap justify-center gap-3">
              <Button
                variant="secondary"
                className="flex items-center gap-2"
                onClick={() => onDownloadQR(product.qrCodeUrl, `QR-${product.serialNumber}.png`)}
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
          </div>
        )}

        {/* Fingerprint */}
        {product.fingerprint && (
          <div className="p-4 mb-6 bg-gray-50 rounded-xl">
            <p className="text-sm text-gray-600">Digital Fingerprint</p>
            <p className="mt-1 font-mono text-sm break-all text-gray-900">{product.fingerprint}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap justify-end gap-3">
          <Button
            variant="secondary"
            className="flex items-center gap-2"
            onClick={() => window.open(`/manufacturer/track/${product.serialNumber}`, '_blank')}
          >
            <Route className="w-5 h-5" />
            Track Product
          </Button>
          <Button
            variant="primary"
            onClick={onClose}
          >
            Close
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default ProductDetailsModal;
