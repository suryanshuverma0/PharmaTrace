import React, { useState, useEffect } from 'react';
import { Card } from '../../components/UI/Card';
import { FaTruck } from 'react-icons/fa';
import apiClient from '../../services/api/api';

const AssignedBatches = () => {
  const [batches, setBatches] = useState([]);

  useEffect(() => {
    fetchAssignedBatches();
  }, []);

  const fetchAssignedBatches = async () => {
    try {
      const res = await apiClient.get('/distributer/batches');
      setBatches(res.data.batches || []);
    } catch (error) {
      setBatches([]);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="mb-4 text-2xl font-bold">Assigned Batches</h2>
      <div className="grid gap-4 md:grid-cols-2">
        {batches.map((batch) => (
          <Card key={batch.batchId} className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <FaTruck className="text-blue-500" />
              <span className="font-semibold">Batch ID:</span> {batch.batchId}
            </div>
            <div>Product: <span className="font-medium">{batch.product}</span></div>
            <div>Quantity: {batch.quantity}</div>
            <div>Manufacturer: {batch.manufacturer.slice(0, 6)}...</div>
            <div>
              <span className="px-2 py-1 text-xs font-semibold text-yellow-800 bg-yellow-100 rounded">
                {batch.status}
              </span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AssignedBatches;
