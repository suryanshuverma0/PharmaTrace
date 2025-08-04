import React, { useState, useEffect } from 'react';
import { Card } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { Select } from '../../components/UI/Select';
import { Input } from '../../components/UI/Input';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import { pharmacyDistributionApi } from '../../services/api/pharmacyDistribution';
import { format } from 'date-fns';

const DistributeBatches = () => {
  const { user, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [distributing, setDistributing] = useState(false);
  const [error, setError] = useState(null);

  const [batches, setBatches] = useState([]);
  const [pharmacies, setPharmacies] = useState([]);
  const [selectedPharmacy, setSelectedPharmacy] = useState('');
  const [quantity, setQuantity] = useState('');
  const [remarks, setRemarks] = useState('');

  // Fetch available batches and pharmacies
  useEffect(() => {
    const fetchData = async () => {

   
      try {
        setLoading(true);
        setError(null);

        const [batchesRes, pharmaciesRes] = await Promise.all([
          pharmacyDistributionApi.getAvailableBatches(),
          pharmacyDistributionApi.getApprovedPharmacies()
        ]);

        if (!batchesRes?.data?.batches) {
          console.warn('No batch data in response:', batchesRes);
          setBatches([]);
        } else {
          setBatches(batchesRes.data.batches);
        }

        if (!pharmaciesRes?.pharmacies) {
          console.warn('No pharmacy data in response:', pharmaciesRes);
          setPharmacies([]);
        } else {
          setPharmacies(pharmaciesRes.pharmacies);
        }

      } catch (err) {
        console.error('Error fetching data:', err);
        setError(
          err.response?.data?.message || 
          err.message || 
          'Failed to load data. Please check your connection and try again.'
        );
        toast.error('Failed to load data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, isAuthenticated]);

  const handleDistribute = async (batch) => {
    if (!selectedPharmacy || !quantity || isNaN(quantity) || quantity <= 0) {
      toast.error('Please select pharmacy and enter valid quantity');
      return;
    }

    if (quantity > batch.quantity) {
      toast.error(`Only ${batch.quantity} units available`);
      return;
    }

    try {
      setDistributing(true);
      // Prepare the assignment data with all required fields
      await pharmacyDistributionApi.assignToPharmacy({
        batchAssignmentId: batch.batchId, // Required field from the API
        pharmacistId: selectedPharmacy,   // Required field from the API
        quantity: parseInt(quantity),      // Required field from the API
        remarks: remarks || '',
        expectedDeliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
        transportationMethod: 'Standard Ground',
        storageRequirements: JSON.stringify({
          temperature: '25°C',
          humidity: '60%',
          lightExposure: 'Store in a dark place',
          specialInstructions: 'Handle with care'
        }),
        // Additional metadata
        batchNumber: batch.batchNumber,
        status: 'pending',
        distributor: {
          name: user.distributor?.companyName || 'Unknown Distributor',
          id: user.distributor?.id,
          type: 'Distributor'
        }
      });

      toast.success('Successfully distributed to pharmacy');
      
      // Refresh available batches
      const { data } = await pharmacyDistributionApi.getAvailableBatches(user._id);
      setBatches(data.batches);

      // Reset form
      setQuantity('');
      setSelectedPharmacy('');
      setRemarks('');
      
    } catch (err) {
      console.error('Distribution error:', err);
      toast.error(err.response?.data?.message || 'Failed to distribute batch');
    } finally {
      setDistributing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-red-500 rounded-lg bg-red-50">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-4 text-sm text-gray-500">
        {batches.length} batches available for distribution
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {batches.map((batch) => (
          <Card key={batch.batchId} className="p-4">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">{batch.product}</h3>
                <p className="text-sm text-gray-600">Batch: {batch.batchNumber}</p>
              </div>
              <div className="px-3 py-1 text-sm text-blue-700 rounded-full bg-blue-50">
                {batch.quantity} available
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4 text-sm text-gray-600">
              <div>
                <p>Manufacturing Date:</p>
                <p className="font-medium text-gray-900">
                  {format(new Date(batch.manufacturingDate), 'MMM dd, yyyy')}
                </p>
              </div>
              <div>
                <p>Expiry Date:</p>
                <p className="font-medium text-gray-900">
                  {format(new Date(batch.expiryDate), 'MMM dd, yyyy')}
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1 text-sm font-medium">Select Pharmacy</label>
                  <Select
                    options={pharmacies.map(p => ({
                      value: p.id,
                      label: `${p.name} - ${p.location}`
                    }))}
                    value={selectedPharmacy}
                    onChange={setSelectedPharmacy}
                    placeholder="Choose pharmacy..."
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium">Quantity</label>
                  <Input
                    type="number"
                    min="1"
                    max={batch.quantity}
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="Enter quantity"
                  />
                </div>
              </div>

              <div>
                <label className="block mb-1 text-sm font-medium">Remarks (Optional)</label>
                <Input
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Add any notes..."
                />
              </div>

              <Button
                variant="primary"
                className="w-full"
                onClick={() => handleDistribute(batch)}
                disabled={distributing}
              >
                {distributing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Distribute Batch'
                )}
              </Button>
            </div>
          </Card>
        ))}

        {batches.length === 0 && (
          <div className="col-span-2 py-8 text-center text-gray-500">
            No batches available for distribution
          </div>
        )}
      </div>
    </div>
  );
};

const DistributionHistory = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [distributions, setDistributions] = useState([]);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const { data } = await pharmacyDistributionApi.getDistributionHistory();
        setDistributions(data.history);
      } catch (err) {
        console.error('Error fetching history:', err);
        setError(err.response?.data?.message || 'Failed to load history');
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [user._id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-red-500 rounded-lg bg-red-50">
        {error}
      </div>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="mb-4 text-xl font-semibold">Distribution History</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th className="px-6 py-3 text-xs font-medium text-left text-gray-500 uppercase">Date</th>
              <th className="px-6 py-3 text-xs font-medium text-left text-gray-500 uppercase">Batch</th>
              <th className="px-6 py-3 text-xs font-medium text-left text-gray-500 uppercase">Pharmacy</th>
              <th className="px-6 py-3 text-xs font-medium text-left text-gray-500 uppercase">Quantity</th>
              <th className="px-6 py-3 text-xs font-medium text-left text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-xs font-medium text-left text-gray-500 uppercase">Last Update</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {distributions.map((dist) => (
              <tr key={dist.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm whitespace-nowrap">
                  {format(new Date(dist.assignedAt), 'MMM dd, yyyy')}
                </td>
                <td className="px-6 py-4 text-sm font-medium whitespace-nowrap">
                  {dist.batchNumber}
                </td>
                <td className="px-6 py-4 text-sm whitespace-nowrap">
                  <div>{dist.pharmacy.name}</div>
                  <div className="text-xs text-gray-500">{dist.pharmacy.location}</div>
                </td>
                <td className="px-6 py-4 text-sm whitespace-nowrap">
                  {dist.quantity}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full
                    ${dist.status === 'delivered' ? 'bg-green-100 text-green-800' :
                      dist.status === 'in_transit' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'}`}>
                    {dist.status.replace('_', ' ').toUpperCase()}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                  {format(new Date(dist.lastUpdated), 'MMM dd, yyyy HH:mm')}
                </td>
              </tr>
            ))}
            {distributions.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                  No distribution history found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
};

const DistributeToPharmacists = () => {
  const [activeView, setActiveView] = useState('distribute');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Pharmacy Distribution</h2>
        <div className="flex gap-2">
          <Button
            variant={activeView === 'distribute' ? 'primary' : 'outline'}
            onClick={() => setActiveView('distribute')}
          >
            Distribute
          </Button>
          <Button
            variant={activeView === 'history' ? 'primary' : 'outline'}
            onClick={() => setActiveView('history')}
          >
            History
          </Button>
        </div>
      </div>

      {activeView === 'distribute' ? <DistributeBatches /> : <DistributionHistory />}
    </div>
  );
};

// Export only one default and make other components available as named exports
// Make internal components available as named exports
export { DistributeBatches, DistributionHistory };
// Export the main component as default
export default DistributeToPharmacists;
