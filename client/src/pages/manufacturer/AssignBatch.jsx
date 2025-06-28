import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Truck, Send, Package, Loader2 } from 'lucide-react';
import apiClient from '../../services/api/api';
import Button from '../../components/UI/Button';
import Select from '../../components/UI/Select';
import Alert from '../../components/UI/Alert';

const DUMMY_ASSIGNED_BATCHES = [
  {
    batchNumber: 'BN2025',
    productName: 'Paracetamol',
    distributor: 'Health Distributors',
    distributorWallet: '0x123...abcd',
    quantity: 1000,
    remarks: 'Urgent shipment',
    assignedAt: '2025-06-28 10:30',
    shipmentStatus: 'Produced',
  },
  {
    batchNumber: 'BN2024',
    productName: 'Ibuprofen',
    distributor: 'MediLogix',
    distributorWallet: '0x456...efgh',
    quantity: 500,
    remarks: '',
    assignedAt: '2025-06-27 15:20',
    shipmentStatus: 'In Transit',
  },
];

const AssignBatch = () => {
  const [batches, setBatches] = useState([]);
  const [distributors, setDistributors] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState('');
  const [selectedDistributor, setSelectedDistributor] = useState('');
  const [quantity, setQuantity] = useState('');
  const [remarks, setRemarks] = useState('');
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [recentAssignments, setRecentAssignments] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch batches that are ready for shipment
        const batchRes = await apiClient.get('/manufacturer/batches?status=manufactured');
        // Fetch all distributors
        const distRes = await apiClient.get('/distributors');
        setBatches(batchRes.data.batches || []);
        setDistributors(distRes.data.distributors || []);
        // Fetch recent assignments
        try {
          const assignRes = await apiClient.get('/manufacturer/assigned-batches');
          setRecentAssignments(assignRes.data.assignments || DUMMY_ASSIGNED_BATCHES);
        } catch {
          setRecentAssignments(DUMMY_ASSIGNED_BATCHES);
        }
      } catch (err) {
        setError('Failed to load data.');
        setRecentAssignments(DUMMY_ASSIGNED_BATCHES);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleAssign = async (e) => {
    e.preventDefault();
    setAssigning(true);
    setError('');
    setSuccess('');
    try {
      await apiClient.post('/manufacturer/assign-batch', {
        batchNumber: selectedBatch,
        distributorId: selectedDistributor,
        quantity,
        remarks,
      });
      setSuccess('Batch assigned to distributor successfully!');
      setSelectedBatch('');
      setSelectedDistributor('');
      setQuantity('');
      setRemarks('');
      // Optionally, refresh recent assignments
      try {
        const assignRes = await apiClient.get('/manufacturer/assigned-batches');
        setRecentAssignments(assignRes.data.assignments || DUMMY_ASSIGNED_BATCHES);
      } catch {
        setRecentAssignments(DUMMY_ASSIGNED_BATCHES);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to assign batch.');
    } finally {
      setAssigning(false);
    }
  };

  return (
    <div className="flex flex-col items-center min-h-screen space-y-8">
      <div className="w-full max-w-3xl bg-white border border-gray-200 shadow rounded-2xl p-6">
        <h3 className="mb-4 text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Package className="w-5 h-5 text-blue-600" /> Recently Assigned Batches
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-left">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-2 font-semibold">Batch Number</th>
                <th className="px-4 py-2 font-semibold">Product</th>
                <th className="px-4 py-2 font-semibold">Distributor</th>
                <th className="px-4 py-2 font-semibold">Wallet</th>
                <th className="px-4 py-2 font-semibold">Quantity</th>
                <th className="px-4 py-2 font-semibold">Remarks</th>
                <th className="px-4 py-2 font-semibold">Assigned At</th>
                <th className="px-4 py-2 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentAssignments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-6 text-center text-gray-500">No assignments found.</td>
                </tr>
              ) : (
                recentAssignments.map((a, idx) => (
                  <tr key={a.batchNumber + a.distributor + idx} className="border-b last:border-0">
                    <td className="px-4 py-2">{a.batchNumber}</td>
                    <td className="px-4 py-2">{a.productName}</td>
                    <td className="px-4 py-2">{a.distributor}</td>
                    <td className="px-4 py-2 font-mono text-xs">{a.distributorWallet}</td>
                    <td className="px-4 py-2">{a.quantity}</td>
                    <td className="px-4 py-2">{a.remarks || '-'}</td>
                    <td className="px-4 py-2 whitespace-nowrap">{a.assignedAt}</td>
                    <td className="px-4 py-2">
                      <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold
                        ${a.shipmentStatus === 'Produced' ? 'bg-blue-100 text-blue-800' :
                          a.shipmentStatus === 'In Transit' ? 'bg-amber-100 text-amber-800' :
                          a.shipmentStatus === 'Delivered' ? 'bg-emerald-100 text-emerald-800' :
                          a.shipmentStatus === 'Returned' ? 'bg-red-100 text-red-800' :
                          a.shipmentStatus === 'Recalled' ? 'bg-gray-200 text-gray-800' :
                          'bg-gray-100 text-gray-800'}`}
                      >
                        <span className="w-2 h-2 rounded-full inline-block"
                          style={{
                            backgroundColor:
                              a.shipmentStatus === 'Produced' ? '#2563eb' :
                              a.shipmentStatus === 'In Transit' ? '#f59e42' :
                              a.shipmentStatus === 'Delivered' ? '#059669' :
                              a.shipmentStatus === 'Returned' ? '#dc2626' :
                              a.shipmentStatus === 'Recalled' ? '#6b7280' :
                              '#a3a3a3'
                          }}
                        />
                        {a.shipmentStatus}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-3xl p-8 mb-10 bg-white border border-gray-200 shadow-lg rounded-2xl"
      >
        <div className="flex items-center gap-3 mb-6">
          <Truck className="w-8 h-8 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">Assign Batch to Distributor</h2>
        </div>
        <p className="mb-6 text-gray-600">Select a batch and assign it to a distributor for shipment.</p>
        {error && <Alert type="error" message={error} onClose={() => setError('')} className="mb-4" />}
        {success && <Alert type="success" message={success} onClose={() => setSuccess('')} className="mb-4" />}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            <span className="ml-3 text-blue-600">Loading...</span>
          </div>
        ) : (
          <form onSubmit={handleAssign} className="space-y-6">
            <div>
              <label className="block mb-2 font-medium text-gray-700">Select Batch</label>
              <Select
                value={selectedBatch}
                onChange={e => setSelectedBatch(e.target.value)}
                required
                className="w-full"
              >
                <option value="">-- Select Batch --</option>
                {batches.map(batch => (
                  <option key={batch.batchNumber} value={batch.batchNumber}>
                    {batch.batchNumber} ({batch.productName})
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="block mb-2 font-medium text-gray-700">Select Distributor</label>
              <Select
                value={selectedDistributor}
                onChange={e => setSelectedDistributor(e.target.value)}
                required
                className="w-full"
              >
                <option value="">-- Select Distributor --</option>
                {distributors.map(dist => (
                  <option key={dist._id} value={dist._id}>
                    {dist.name} ({dist.walletAddress})
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="block mb-2 font-medium text-gray-700">Quantity</label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={e => setQuantity(e.target.value)}
                required
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter quantity to assign"
              />
            </div>
            <div>
              <label className="block mb-2 font-medium text-gray-700">Remarks</label>
              <textarea
                value={remarks}
                onChange={e => setRemarks(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Any remarks (optional)"
                rows={3}
              />
            </div>
            <Button
              type="submit"
              variant="primary"
              className="flex items-center justify-center w-full gap-2"
              disabled={assigning || !selectedBatch || !selectedDistributor || !quantity}
            >
              {assigning ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              Assign Batch
            </Button>
          </form>
        )}
      </motion.div>
      {/* Recently Assigned Batches Table */}
    
    </div>
  );
};

export default AssignBatch;
