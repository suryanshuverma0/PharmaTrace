import React from 'react';
import { motion } from 'framer-motion';
import {
  X,
  Calendar,
  QrCode,
  Box,
  Tag,
  Fingerprint,
  Download,
  Factory,
  Clock,
  AlertCircle,
  Thermometer,
  Building2,
  Truck,
  MapPin
} from 'lucide-react';
import { Button } from '../UI/Button';

const ProductModal = ({ product,batch, onClose, onDownloadQR }) => {
  // Debug log to see what data we're receiving
  console.log('Product data in modal:', product);
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-10 bg-black/50"
    >
      <div className="w-full max-w-3xl p-6 mx-4 bg-white rounded-2xl h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">Product Details</h2>
            <p className="mt-1 text-gray-600">Detailed information about the product</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 -mr-2 text-gray-400 transition-colors rounded-lg hover:text-gray-600 hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* QR Code Section */}
          <div className="p-4 border rounded-xl">
            <h3 className="flex items-center gap-2 mb-4 text-lg font-medium">
              <QrCode className="w-5 h-5" />
              QR Code
            </h3>
            <div className="flex flex-col items-center">
              <img
                src={product.qrCodeUrl}
                alt="Product QR Code"
                className="w-32 h-32 mb-4"
              />
              <Button
                variant="secondary"
                size="sm"
                className="w-full"
                onClick={() => onDownloadQR(product.qrCodeUrl, `QR-${product.serialNumber}.png`)}
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </div>
          </div>

          {/* Main Details Section */}
          <div className="col-span-2 p-4 border rounded-xl">
            <div className="grid gap-4">
              {/* Basic Info */}
              <div>
                <h3 className="flex items-center gap-2 mb-3 text-lg font-medium">
                  <Tag className="w-5 h-5" />
                  Basic Information
                </h3>
                <div className="grid gap-3">
                  <div>
                    <p className="text-sm text-gray-600">Product Name</p>
                    <p className="font-medium text-gray-900">{product.productName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Serial Number</p>
                    <p className="font-mono text-sm">{product.serialNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Digital Fingerprint</p>
                    <p className="font-mono text-sm break-all">{product.fingerprint}</p>
                  </div>
                </div>
              </div>

              {/* Manufacturing Details */}
              <div>
                <h3 className="flex items-center gap-2 mb-3 text-lg font-medium">
                  <Factory className="w-5 h-5" />
                  Manufacturing Details
                </h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-sm text-gray-600">Manufacture Date</p>
                    <p className="font-medium text-gray-900">
                      {product.manufactureDate ? new Date(product.manufactureDate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      }) : 'Not available'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Expiry Date</p>
                    <p className="font-medium text-gray-900">
                      {product.expiryDate ? new Date(product.expiryDate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      }) : 'Not available'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Batch Number</p>
                    <p className="font-medium text-gray-900">{product.batchNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Manufacturer</p>
                    <p className="font-medium text-gray-900">{product.manufacturer}</p>
                  </div>
                </div>
              </div>

              {/* Storage Conditions */}
              <div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-sm text-gray-600">Storage </p>
                    <p className="font-medium text-gray-900">{batch?.storageConditions}</p>
                  </div>
                </div>
              </div>

              {/* Current Status */}
              <div>
                <h3 className="flex items-center gap-2 mb-3 text-lg font-medium">
                  <AlertCircle className="w-5 h-5" />
                  Current Status
                </h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <p className="font-medium text-gray-900">
                      {product.status?.charAt(0).toUpperCase() + product.status?.slice(1)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Current Location</p>
                    <p className="font-medium text-gray-900">
                      {(() => {
                        // Determine location based on status
                        switch (product.status) {
                          case 'produced':
                            return `${product.manufacturer || 'Manufacturer'} Warehouse`;
                          case 'in-transit':
                            return 'In Transit to Distributor';
                          case 'at-distributor':
                            return product.distributorName ? `${product.distributorName} Warehouse` : 'Distributor Warehouse';
                          case 'at-pharmacy':
                            return product.pharmacyName ? `${product.pharmacyName}` : 'Pharmacy';
                          case 'delivered':
                            return 'Delivered to Patient';
                          default:
                            return product.currentLocation || `${product.manufacturer || 'Manufacturer'} Warehouse`;
                        }
                      })()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Production Facility</p>
                    <p className="font-medium text-gray-900">
                      {product.manufacturer && (
                        <>
                          {product.manufacturer}
                          {product.manufacturerAddress && (
                            <span className="block text-sm text-gray-500">
                              {product.manufacturerAddress}
                            </span>
                          )}
                          {product.manufacturerCountry && (
                            <span className="block text-sm text-gray-500">
                              {product.manufacturerCountry}
                            </span>
                          )}
                        </>
                      ) || "Not specified"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default ProductModal;
