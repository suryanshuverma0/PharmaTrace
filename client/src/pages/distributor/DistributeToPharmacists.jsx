import React, { useState, useEffect } from 'react';
import { Card } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { Select } from '../../components/UI/Select';

const mockPharmacies = [
  { value: '0x123...', label: 'Pharmacy A' },
  { value: '0x456...', label: 'Pharmacy B' },
  { value: '0x789...', label: 'Pharmacy C' },
];

const DistributeToPharmacists = () => {
  const [batches, setBatches] = useState([]);
  const [selectedPharmacy, setSelectedPharmacy] = useState('');
  const [quantity, setQuantity] = useState('');
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    // Mock delivered batches
    setBatches([
      { batchId: 'BATCH001', product: 'Paracetamol', available: 800 },
      { batchId: 'BATCH002', product: 'Ibuprofen', available: 500 },
    ]);
  }, []);

  const handleDistribute = (batchId) => {
    if (!selectedPharmacy || !quantity || isNaN(quantity) || quantity <= 0) {
      setNotification('Select pharmacy and valid quantity');
      setTimeout(() => setNotification(null), 2000);
      return;
    }
    setNotification(`Distributed ${quantity} units of ${batchId} to ${selectedPharmacy}`);
    setTimeout(() => setNotification(null), 2000);
    setQuantity('');
    setSelectedPharmacy('');
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold mb-4">Distribute to Pharmacists</h2>
      {notification && (
        <div className="p-2 bg-blue-100 text-blue-800 rounded">{notification}</div>
      )}
      <div className="grid gap-4 md:grid-cols-2">
        {batches.map((batch) => (
          <Card key={batch.batchId} className="flex flex-col gap-2">
            <div className="font-semibold">Batch ID: {batch.batchId}</div>
            <div>Product: {batch.product}</div>
            <div>Available: {batch.available}</div>
            <div className="flex flex-col gap-2 md:flex-row md:items-center">
              <Select
                options={mockPharmacies}
                value={selectedPharmacy}
                onChange={setSelectedPharmacy}
                placeholder="Select Pharmacy"
                className="w-full md:w-40"
              />
              <input
                type="number"
                min="1"
                max={batch.available}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="Quantity"
                className="border rounded px-2 py-1 w-24"
              />
              <Button variant="primary" onClick={() => handleDistribute(batch.batchId)}>
                Distribute
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default DistributeToPharmacists;
