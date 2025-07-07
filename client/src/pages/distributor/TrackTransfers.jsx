import React, { useState, useEffect } from 'react';
import { Card } from '../../components/UI/Card';
import apiClient from '../../services/api/api';

const TrackTransfers = () => {
  const [transfers, setTransfers] = useState([]);

  useEffect(() => {
    fetchTransfers();
  }, []);

  const fetchTransfers = async () => {
    try {
      const res = await apiClient.get('/distributer/transfers');
      // Group and aggregate transfers by batchId for UI compatibility
      const grouped = {};
      (res.data.transfers || []).forEach(t => {
        if (!grouped[t.batchId]) {
          grouped[t.batchId] = {
            batchId: t.batchId,
            product: t.product,
            total: 0,
            left: 0,
            distributions: []
          };
        }
        // Convert quantity to number for aggregation
        const qty = Number(t.quantity) || 0;
        grouped[t.batchId].total += qty;
        grouped[t.batchId].distributions.push({
          pharmacy: t.to,
          quantity: qty,
          status: t.status
        });
      });
      // Calculate left for each batch (total - sum of delivered)
      Object.values(grouped).forEach(batch => {
        const delivered = batch.distributions
          .filter(d => d.status === 'Delivered')
          .reduce((sum, d) => sum + d.quantity, 0);
        batch.left = batch.total - delivered;
      });
      setTransfers(Object.values(grouped));
    } catch (error) {
      setTransfers([]);
    }
  };

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
