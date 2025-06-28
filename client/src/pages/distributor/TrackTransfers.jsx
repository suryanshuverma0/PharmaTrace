import React, { useState, useEffect } from 'react';
import { Card } from '../../components/UI/Card';

const TrackTransfers = () => {
  const [transfers, setTransfers] = useState([]);

  useEffect(() => {
    // Mock transfer history
    setTransfers([
      {
        batchId: 'BATCH001',
        product: 'Paracetamol',
        total: 1000,
        left: 600,
        distributions: [
          { pharmacy: 'Pharmacy A', quantity: 200, status: 'Delivered' },
          { pharmacy: 'Pharmacy B', quantity: 200, status: 'In Transit' },
        ],
      },
      {
        batchId: 'BATCH002',
        product: 'Ibuprofen',
        total: 500,
        left: 300,
        distributions: [
          { pharmacy: 'Pharmacy C', quantity: 200, status: 'Delivered' },
        ],
      },
    ]);
  }, []);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold mb-4">Track All Transfers</h2>
      <div className="grid gap-4 md:grid-cols-2">
        {transfers.map((batch) => (
          <Card key={batch.batchId} className="flex flex-col gap-2">
            <div className="font-semibold">Batch ID: {batch.batchId}</div>
            <div>Product: {batch.product}</div>
            <div>Total: {batch.total}</div>
            <div>Quantity Left: <span className="font-bold">{batch.left}</span></div>
            <div className="mt-2">
              <div className="font-semibold mb-1">Distributions:</div>
              <ul className="list-disc ml-6">
                {batch.distributions.map((d, idx) => (
                  <li key={idx}>
                    {d.pharmacy}: {d.quantity} units -
                    <span className={`ml-2 px-2 py-1 rounded text-xs font-semibold ${d.status === 'Delivered' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {d.status}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default TrackTransfers;
