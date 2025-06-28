import React, { useState, useEffect } from 'react';
import { Card } from '../../components/UI/Card';
import { Input } from '../../components/UI/Input';

const InventoryManagement = () => {
  const [inventory, setInventory] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    // Mock inventory data
    setInventory([
      { batchId: 'BATCH001', product: 'Paracetamol', quantity: 800, total: 1000, status: 'Ready' },
      { batchId: 'BATCH002', product: 'Ibuprofen', quantity: 500, total: 500, status: 'Ready' },
    ]);
  }, []);

  const filtered = inventory.filter((item) =>
    item.product.toLowerCase().includes(search.toLowerCase()) ||
    item.batchId.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold mb-4">Inventory Management</h2>
      <div className="mb-4">
        <Input
          type="text"
          placeholder="Search by product or batch ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full md:w-1/2"
        />
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-xs font-medium text-left text-gray-500 uppercase">Batch ID</th>
              <th className="px-6 py-3 text-xs font-medium text-left text-gray-500 uppercase">Product</th>
              <th className="px-6 py-3 text-xs font-medium text-left text-gray-500 uppercase">Available Qty</th>
              <th className="px-6 py-3 text-xs font-medium text-left text-gray-500 uppercase">Total Qty</th>
              <th className="px-6 py-3 text-xs font-medium text-left text-gray-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filtered.map((item) => (
              <tr key={item.batchId}>
                <td className="px-6 py-4 whitespace-nowrap">{item.batchId}</td>
                <td className="px-6 py-4 whitespace-nowrap">{item.product}</td>
                <td className="px-6 py-4 whitespace-nowrap">{item.quantity}</td>
                <td className="px-6 py-4 whitespace-nowrap">{item.total}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 py-1 rounded bg-green-100 text-green-800 text-xs font-semibold">{item.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default InventoryManagement;
