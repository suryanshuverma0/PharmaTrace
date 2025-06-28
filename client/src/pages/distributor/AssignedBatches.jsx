import React, { useState, useEffect } from 'react';
import { Card } from '../../components/UI/Card';
import { FaTruck } from 'react-icons/fa';

const AssignedBatches = () => {
  const [batches, setBatches] = useState([]);

  useEffect(() => {
    // Mock data for assigned batches
    setBatches([
      { batchId: 'BATCH001', product: 'Paracetamol', quantity: 1000, status: 'In Transit', manufacturer: '0xabc...' },
      { batchId: 'BATCH002', product: 'Ibuprofen', quantity: 500, status: 'In Transit', manufacturer: '0xdef...' },
    ]);
  }, []);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold mb-4">Assigned Batches</h2>
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
              <span className="px-2 py-1 rounded bg-yellow-100 text-yellow-800 text-xs font-semibold">
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
