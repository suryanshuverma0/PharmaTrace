import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  QrCode,
  Download,
  Printer,
  Search,
  Filter,
  Box,
  Calendar,
  Check
} from 'lucide-react';
import { Input } from '../../components/UI/Input';
import { Button } from '../../components/UI/Button';
import { Select } from '../../components/UI/Select';
import { Card } from '../../components/UI/Card';

const QRCodeManager = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedProducts, setSelectedProducts] = useState([]);

  // Sample data
  const products = [
    {
      id: 1,
      name: "Amoxicillin 500mg",
      serialNumber: "AMX500-B247",
      batchNumber: "B247",
      manufactureDate: "2025-06-01",
      qrGenerated: true,
      status: "active"
    },
    {
      id: 2,
      name: "Lisinopril 10mg",
      serialNumber: "LSP010-B123",
      batchNumber: "B123",
      manufactureDate: "2025-06-01",
      qrGenerated: false,
      status: "pending"
    },
    {
      id: 3,
      name: "Metformin 850mg",
      serialNumber: "MTF850-B789",
      batchNumber: "B789",
      manufactureDate: "2025-05-30",
      qrGenerated: true,
      status: "active"
    }
  ];

  const handleSelectProduct = (productId) => {
    setSelectedProducts(prev => {
      if (prev.includes(productId)) {
        return prev.filter(id => id !== productId);
      }
      return [...prev, productId];
    });
  };

  const handleSelectAll = () => {
    if (selectedProducts.length === products.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(products.map(p => p.id));
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.serialNumber.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' || 
      (filterStatus === 'generated' && product.qrGenerated) ||
      (filterStatus === 'pending' && !product.qrGenerated);
    
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">QR Code Manager</h1>
        <p className="mt-2 text-lg text-gray-600">
          Generate and manage QR codes for your pharmaceutical products
        </p>
      </div>

      {/* Actions Bar */}
      <div className="grid gap-4 mb-6 md:flex md:items-center md:justify-between">
        <div className="flex items-center flex-1 gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={<Search className="w-5 h-5" />}
              className="max-w-md"
            />
          </div>
          <Select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-48"
            icon={<Filter className="w-5 h-5" />}
          >
            <option value="all">All Products</option>
            <option value="generated">QR Generated</option>
            <option value="pending">Pending Generation</option>
          </Select>
        </div>
        <div className="flex gap-3">
          <Button
            variant="secondary"
            className="flex items-center gap-2"
            disabled={selectedProducts.length === 0}
          >
            <Printer className="w-5 h-5" />
            Print Selected
          </Button>
          <Button
            variant="secondary"
            className="flex items-center gap-2"
            disabled={selectedProducts.length === 0}
          >
            <Download className="w-5 h-5" />
            Download Selected
          </Button>
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredProducts.map((product) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className={`relative overflow-hidden transition-all duration-200 ${
              selectedProducts.includes(product.id) ? 'ring-2 ring-blue-500' : ''
            }`}>
              {/* Selection Overlay */}
              <div
                className="absolute inset-0 z-10 cursor-pointer"
                onClick={() => handleSelectProduct(product.id)}
              >
                <div className="absolute top-4 right-4">
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    selectedProducts.includes(product.id)
                      ? 'bg-blue-500 border-blue-500'
                      : 'border-gray-300'
                  }`}>
                    {selectedProducts.includes(product.id) && (
                      <Check className="w-4 h-4 text-white" />
                    )}
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="flex items-center justify-center flex-shrink-0 w-12 h-12 bg-blue-100 rounded-xl">
                    {product.qrGenerated ? (
                      <QrCode className="w-6 h-6 text-blue-600" />
                    ) : (
                      <Box className="w-6 h-6 text-blue-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 truncate">
                      {product.name}
                    </h3>
                    <div className="mt-1 space-y-1">
                      <p className="text-sm text-gray-500">
                        SN: {product.serialNumber}
                      </p>
                      <p className="text-sm text-gray-500">
                        Batch: {product.batchNumber}
                      </p>
                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar className="w-4 h-4 mr-1" />
                        {product.manufactureDate}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Status & Actions */}
                <div className="flex items-center justify-between mt-6 pt-6 border-t">
                  <span className={`px-3 py-1 text-sm rounded-full ${
                    product.qrGenerated
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {product.qrGenerated ? 'Generated' : 'Pending'}
                  </span>
                  {product.qrGenerated && (
                    <div className="flex -space-x-1">
                      <Button
                        variant="ghost"
                        className="p-2 hover:text-blue-600"
                        title="Download QR Code"
                      >
                        <Download className="w-5 h-5" />
                      </Button>
                      <Button
                        variant="ghost"
                        className="p-2 hover:text-blue-600"
                        title="Print QR Code"
                      >
                        <Printer className="w-5 h-5" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default QRCodeManager;
