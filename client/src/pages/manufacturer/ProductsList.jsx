import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  Search,
  Filter,
  Download,
  Box,
  Route,
  QrCode,
  MoreVertical,
  Calendar,
  MapPin,
  AlertCircle,
  Boxes,
  Printer
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Input } from '../../components/UI/Input';
import { Button } from '../../components/UI/Button';
import { Select } from '../../components/UI/Select';
import apiClient from '../../services/api/api';

const ProductsList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Options for the Select component
  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'manufactured', label: 'Manufactured' },
    { value: 'in-transit', label: 'In Transit' },
    { value: 'delivered', label: 'Delivered' }
  ];

  // State for QR modal
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showQRModal, setShowQRModal] = useState(false);

  // Fetch registered batches with products from the backend
  const getRegisteredProducts = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('products/registered-batches');
      // Response should be grouped by batch with products inside
      const normalizedBatches = response.data.map(batch => ({
        ...batch,
        status: batch.shipmentStatus.toLowerCase().replace(/\s+/g, '-'),
        products: batch.products.map(product => ({
          ...product,
          status: product.status?.replace(/\s+/g, '-').toLowerCase() || 'produced'
        }))
      }));
      setProducts(normalizedBatches);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  // Fetch products on component mount
  useEffect(() => {
    getRegisteredProducts();
  }, []);

  // Filter batches based on search term and status
  const filteredBatches = products.filter(batch => {
    const hasMatchingProducts = batch.products.some(product => 
      product.productName.toLowerCase().includes(searchTerm.toLowerCase().trim())
    );
    const matchesBatchNumber = batch.batchNumber.toLowerCase().includes(searchTerm.toLowerCase().trim());
    const matchesFilter = filterStatus === 'all' || batch.status === filterStatus;
    
    return (hasMatchingProducts || matchesBatchNumber) && matchesFilter;
  });

  // Handle QR code actions
  const handleQRCodeClick = (product) => {
    setSelectedProduct(product);
    setShowQRModal(true);
  };

  const downloadQRCode = (qrCodeUrl, fileName) => {
    const link = document.createElement('a');
    link.href = qrCodeUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Debounce search input to improve performance
  const debounce = (func, wait) => {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  };

  // Handle search input change with debouncing
  const handleSearchChange = useCallback(
    debounce((value) => {
      setSearchTerm(value);
    }, 300),
    []
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'manufactured':
      case 'produced':
        return 'bg-blue-100 text-blue-800';
      case 'in-transit':
        return 'bg-amber-100 text-amber-800';
      case 'delivered':
        return 'bg-emerald-100 text-emerald-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Loading products...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-red-600">Error: {error}</p>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Registered Products</h1>
          <p className="mt-2 text-lg text-gray-600">
            View and manage all your registered pharmaceutical products
          </p>
        </div>

      {/* Filters and Search */}
      <div className="grid gap-4 mb-6 md:flex md:items-center md:justify-between">
        <div className="flex items-center justify-between flex-1 gap-4">
      
          <Select
            options={statusOptions}
            value={filterStatus}
            onChange={setFilterStatus}
            className="w-40 h-10 text-sm border-gray-300 rounded-lg"
            icon={<Filter className="w-5 h-5" />}
            placeholder="Select status"
          />
        </div>
        <Button
          variant="secondary"
          className="flex items-center h-10 gap-2 text-sm border-gray-300 rounded-lg"
        >
          <Download className="w-5 h-5" />
          Export
        </Button>
      </div>

      {/* Batches List */}
      <div className="space-y-6">
        {filteredBatches.length === 0 ? (
          <p className="text-gray-600">No batches found.</p>
        ) : (
          filteredBatches.map((batch) => (
            <motion.div
              key={batch._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="overflow-hidden bg-white border shadow-lg rounded-2xl border-gray-200/50"
            >
              {/* Batch Header */}
              <div className="p-6 border-b border-gray-100">
                <div className="flex flex-wrap items-start justify-between gap-4 sm:flex-nowrap">
                  <div className="flex items-start flex-1 gap-4">
                    <div className="flex items-center justify-center flex-shrink-0 w-12 h-12 bg-blue-100 rounded-xl">
                      <Boxes className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Batch: {batch.batchNumber}
                      </h3>
                      <div className="mt-1 space-y-1">
                        <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>Mfg: {new Date(batch.manufactureDate).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>Exp: {new Date(batch.expiryDate).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Box className="w-4 h-4" />
                            <span>Products: {batch.products.length}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(batch.status)}`}>
                    {batch.status.charAt(0).toUpperCase() + batch.status.slice(1)}
                  </span>
                </div>
              </div>

              {/* Products Grid */}
              <div className="p-6 bg-gray-50">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {batch.products.map((product) => (
                    <div
                      key={product._id}
                      className="p-4 transition-all duration-200 bg-white border rounded-xl border-gray-200/50 hover:border-blue-200 hover:shadow-md"
                    >
                      <div className="flex justify-between">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 truncate">
                            {product.productName}
                          </h4>
                          <p className="mt-1 text-sm text-gray-500">
                            SN: {product.serialNumber}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => handleQRCodeClick(product)}
                            className="p-2 text-gray-400 transition-colors rounded-lg hover:text-blue-600 hover:bg-blue-50"
                          >
                            <QrCode className="w-5 h-5" />
                          </button>
                          <Link
                            to={`/manufacturer/track/${product.serialNumber}`}
                            className="p-2 text-gray-400 transition-colors rounded-lg hover:text-blue-600 hover:bg-blue-50"
                          >
                            <Route className="w-5 h-5" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* QR Code Modal */}
      {showQRModal && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md p-6 bg-white rounded-2xl">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 mb-4 text-green-500">
                <QrCode className="w-full h-full" />
              </div>
              <h3 className="mb-2 text-xl font-semibold text-gray-900">
                Product QR Code
              </h3>

              <div className="w-full p-4 mb-4 rounded-lg bg-gray-50">
                <div className="mb-2">
                  <p className="text-sm text-gray-600">Serial Number</p>
                  <p className="font-mono text-sm break-all">{selectedProduct.serialNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Digital Fingerprint</p>
                  <p className="font-mono text-sm break-all">{selectedProduct.fingerprint}</p>
                </div>
              </div>

              <div className="p-4 mb-6 bg-white border rounded-lg">
                <img
                  src={selectedProduct.qrCodeUrl}
                  alt="Product QR Code"
                  className="w-48 h-48 mx-auto"
                />
              </div>

              <div className="flex flex-wrap justify-center gap-4">
                <Button
                  variant="secondary"
                  className="flex items-center gap-2"
                  onClick={() => downloadQRCode(selectedProduct.qrCodeUrl, `QR-${selectedProduct.serialNumber}.png`)}
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
                onClick={() => setShowQRModal(false)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
      </div>
    </>
  );
};

export default ProductsList;