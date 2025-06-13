import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {Card} from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import {Select} from '../../components/UI/Select';
// import Alert from '../../components/UI/Alert';
import { FaBox, FaTruck, FaCheckCircle } from 'react-icons/fa';

const DistributorDashboard = () => {
  const [products, setProducts] = useState([]);
  const [selectedPharmacy, setSelectedPharmacy] = useState('');
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  const navigate = useNavigate();

  // Mock pharmacy list - Replace with actual data from smart contract
  const pharmacies = [
    { value: '0x123...', label: 'Pharmacy A' },
    { value: '0x456...', label: 'Pharmacy B' },
    { value: '0x789...', label: 'Pharmacy C' },
  ];

  useEffect(() => {
    // Fetch products assigned to distributor
    // Replace with actual smart contract call
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    // TODO: Replace with actual smart contract call
    const mockProducts = [
      {
        serialNumber: 'SN001',
        name: 'Product A',
        manufacturer: '0xabc...',
        status: 'Manufactured',
      },
      {
        serialNumber: 'SN002',
        name: 'Product B',
        manufacturer: '0xdef...',
        status: 'At Distributor',
      },
    ];
    setProducts(mockProducts);
  };

  const handleReceiveProduct = async (serialNumber) => {
    try {
      // TODO: Call smart contract method to update product status
      setNotification({
        show: true,
        message: 'Product received successfully',
        type: 'success',
      });
      // Refresh products list
      fetchProducts();
    } catch (error) {
      setNotification({
        show: true,
        message: 'Failed to receive product',
        type: 'error',
      });
    }
  };

  const handleShipToPharmacy = async (serialNumber) => {
    if (!selectedPharmacy) {
      setNotification({
        show: true,
        message: 'Please select a pharmacy',
        type: 'error',
      });
      return;
    }

    try {
      // TODO: Call smart contract method to update product status and assign to pharmacy
      setNotification({
        show: true,
        message: 'Product shipped successfully',
        type: 'success',
      });
      // Refresh products list
      fetchProducts();
    } catch (error) {
      setNotification({
        show: true,
        message: 'Failed to ship product',
        type: 'error',
      });
    }
  };

  const handleTrackProduct = (serialNumber) => {
    navigate(`/distributor/track?serial=${serialNumber}`);
  };

  const handleVerifyProduct = () => {
    navigate('/distributor/verify');
  };

  return (
    <div className="space-y-6">
      {notification.show && (
        {/* <Alert
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification({ show: false })}
        /> */}
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="bg-blue-50">
          <div className="flex items-center">
            <FaBox className="w-8 h-8 text-blue-500" />
            <div className="ml-4">
              <h3 className="text-lg font-medium">Total Products</h3>
              <p className="text-2xl font-bold">{products.length}</p>
            </div>
          </div>
        </Card>
        <Card className="bg-green-50">
          <div className="flex items-center">
            <FaTruck className="w-8 h-8 text-green-500" />
            <div className="ml-4">
              <h3 className="text-lg font-medium">In Transit</h3>
              <p className="text-2xl font-bold">
                {products.filter((p) => p.status === 'Shipped').length}
              </p>
            </div>
          </div>
        </Card>
        <Card className="bg-purple-50">
          <div className="flex items-center">
            <FaCheckCircle className="w-8 h-8 text-purple-500" />
            <div className="ml-4">
              <h3 className="text-lg font-medium">Delivered</h3>
              <p className="text-2xl font-bold">
                {products.filter((p) => p.status === 'Delivered').length}
              </p>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <div className="flex flex-col items-center justify-between mb-4 md:flex-row">
          <h2 className="mb-4 text-xl font-semibold md:mb-0">Manage Products</h2>
          <div className="flex flex-col gap-4 md:flex-row">
            <Button variant="secondary" onClick={handleVerifyProduct}>
              Verify Product
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  Serial Number
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  Product Name
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  Manufacturer
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {products.map((product) => (
                <tr key={product.serialNumber}>
                  <td className="px-6 py-4 whitespace-nowrap">{product.serialNumber}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{product.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {product.manufacturer.slice(0, 6)}...
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        product.status === 'Manufactured'
                          ? 'bg-yellow-100 text-yellow-800'
                          : product.status === 'At Distributor'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {product.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 space-x-2 text-sm font-medium whitespace-nowrap">
                    {product.status === 'Manufactured' && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleReceiveProduct(product.serialNumber)}
                      >
                        Receive
                      </Button>
                    )}
                    {product.status === 'At Distributor' && (
                      <div className="flex flex-col gap-2 md:flex-row">
                        <Select
                          options={pharmacies}
                          value={selectedPharmacy}
                          onChange={(value) => setSelectedPharmacy(value)}
                          placeholder="Select Pharmacy"
                          className="w-full md:w-48"
                        />
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleShipToPharmacy(product.serialNumber)}
                        >
                          Ship
                        </Button>
                      </div>
                    )}
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleTrackProduct(product.serialNumber)}
                    >
                      Track
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default DistributorDashboard;
