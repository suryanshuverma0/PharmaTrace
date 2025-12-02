import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { Select } from '../../components/UI/Select';
import MultiSelect from '../../components/UI/MultiSelect';
import { Input } from '../../components/UI/Input';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import { pharmacyDistributionApi } from '../../services/api/pharmacyDistribution';
import apiClient from '../../services/api/api';
import { format } from 'date-fns';

const DistributeBatches = () => {
  const { user, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [distributing, setDistributing] = useState(false);
  const [error, setError] = useState(null);

  const [batches, setBatches] = useState([]);
  const [pharmacies, setPharmacies] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [selectedRegions, setSelectedRegions] = useState([]);
  const [loadingPharmacies, setLoadingPharmacies] = useState(false);
  
  // Store form data for each batch separately
  const [batchForms, setBatchForms] = useState({});

  // Fetch districts on component mount
  useEffect(() => {
    const fetchDistricts = async () => {
      try {
        const response = await apiClient.get('/nepal/districts');
        if (response.data.success) {
          const districtOptions = response.data.data.map(district => ({
            value: district,
            label: district
          }));
          setDistricts(districtOptions);
        }
      } catch (error) {
        console.error('Failed to fetch districts:', error);
        setError('Failed to load districts');
      }
    };
    
    fetchDistricts();
  }, []);

  // Fetch pharmacies based on selected regions
  useEffect(() => {
    const fetchPharmacies = async () => {
      if (selectedRegions.length === 0) {
        setPharmacies([]);
        return;
      }
      
      setLoadingPharmacies(true);
      try {
        const params = new URLSearchParams();
        selectedRegions.forEach(region => params.append('regions', region));
        
        const response = await apiClient.get(`/pharmacy?${params.toString()}`);
        let transformedPharmacies = [];
        if (response?.data?.success && response?.data?.data) {
          // Transform pharmacy data to match expected format
          transformedPharmacies = response.data.data.map(pharmacy => ({
            id: pharmacy._id,
            name: pharmacy.pharmacyName,
            location: pharmacy.pharmacyLocation || pharmacy.address || 'N/A',
            walletAddress: pharmacy.address,
            licenseNumber: pharmacy.licenseNumber,
            workingRegions: pharmacy.workingRegions || []
          }));
          setPharmacies(transformedPharmacies);
        } else {
          setPharmacies([]);
        }
        
        // Reset selected pharmacies in forms if not in the new list
        setBatchForms(prev => {
          const updated = { ...prev };
          Object.keys(updated).forEach(batchId => {
            if (updated[batchId].selectedPharmacy && 
                !transformedPharmacies.some(p => p.id === updated[batchId].selectedPharmacy)) {
              updated[batchId].selectedPharmacy = '';
            }
          });
          return updated;
        });
        
      } catch (err) {
        console.error('Failed to fetch pharmacies:', err);
        setError('Failed to load pharmacies for selected regions');
        setPharmacies([]);
      } finally {
        setLoadingPharmacies(false);
      }
    };
    
    fetchPharmacies();
  }, [selectedRegions]);

  // Fetch available batches
  useEffect(() => {
    const fetchBatches = async () => {
      try {
        setLoading(true);
        setError(null);

        const batchesRes = await apiClient.get('/distributer/batches');

        if (!batchesRes?.data?.batches) {
          console.warn('No batch data in response:', batchesRes);
          setBatches([]);
        } else {
          // Filter only batches with remaining quantity > 0
          const availableBatches = batchesRes.data.batches.filter(batch => batch.quantity > 0);
          
          // Sort batches by most recently assigned first
          const sortedBatches = availableBatches.sort((a, b) => {
            // Get the latest assignment timestamp for each batch (when manufacturer assigned to distributor)
            const getLatestAssignmentTime = (batch) => {
              if (!batch.shipmentHistory || batch.shipmentHistory.length === 0) {
                return new Date(0); // Very old date for batches with no history
              }
              
              // Find the most recent assignment from manufacturer to distributor
              const assignments = batch.shipmentHistory.filter(entry => 
                entry.status && !['produced', 'delivered'].includes(entry.status.toLowerCase())
              );
              
              if (assignments.length === 0) {
                return new Date(0);
              }
              
              // Get the most recent assignment timestamp
              const latestAssignment = assignments.reduce((latest, current) => {
                const currentTime = new Date(current.timestamp);
                const latestTime = new Date(latest.timestamp);
                return currentTime > latestTime ? current : latest;
              });
              
              return new Date(latestAssignment.timestamp);
            };
            
            const aTime = getLatestAssignmentTime(a);
            const bTime = getLatestAssignmentTime(b);
            
            // Sort in descending order (most recent first)
            return bTime - aTime;
          });
          
          setBatches(sortedBatches);
          
          // Initialize form state for each batch
          const initialForms = {};
          sortedBatches.forEach(batch => {
            initialForms[batch.batchId] = {
              selectedPharmacy: '',
              quantity: '',
              remarks: ''
            };
          });
          setBatchForms(initialForms);
        }

      } catch (err) {
        console.error('Error fetching batches:', err);
        setError(
          err.response?.data?.message || 
          err.message || 
          'Failed to load batches. Please check your connection and try again.'
        );
        toast.error('Failed to load batches. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchBatches();
  }, [user, isAuthenticated]);

  // Helper functions to update form data for specific batch
  const updateBatchForm = (batchId, field, value) => {
    if (field === 'quantity') {
      const batch = batches.find(b => b.batchId === batchId);
      const numValue = parseInt(value) || 0;
      
      // Prevent quantity from exceeding available amount
      if (batch && numValue > batch.quantity) {
        toast.error(`Only ${batch.quantity} units available for this batch`);
        return;
      }
      
      // Prevent negative values
      if (numValue < 0) {
        return;
      }
    }
    
    setBatchForms(prev => ({
      ...prev,
      [batchId]: {
        ...prev[batchId],
        [field]: value
      }
    }));
  };

  const getBatchForm = (batchId) => {
    return batchForms[batchId] || { selectedPharmacy: '', quantity: '', remarks: '' };
  };

  const resetBatchForm = (batchId) => {
    setBatchForms(prev => ({
      ...prev,
      [batchId]: {
        selectedPharmacy: '',
        quantity: '',
        remarks: ''
      }
    }));
  };

  const handleDistribute = async (batch) => {
    const form = getBatchForm(batch.batchId);
    
    if (selectedRegions.length === 0) {
      toast.error('Please select operational regions first');
      return;
    }
    
    if (!form.selectedPharmacy || !form.quantity || isNaN(form.quantity) || form.quantity <= 0) {
      toast.error('Please select pharmacy and enter valid quantity');
      return;
    }

    if (form.quantity > batch.quantity) {
      toast.error(`Only ${batch.quantity} units available`);
      return;
    }

    try {
      setDistributing(true);
      
      // Find selected pharmacy details
      const selectedPharmacyDetails = pharmacies.find(p => p.id === form.selectedPharmacy);
      const pharmacyAddress = selectedPharmacyDetails?.name || form.selectedPharmacy;
      
      // Use the consistent distributor batch endpoint
      await apiClient.post('/distributer/distribute-batch', {
        batchNumber: batch.batchId, // Use batchId as batchNumber
        pharmacyAddress: pharmacyAddress,
        quantity: parseInt(form.quantity),
        remarks: form.remarks || `Distribution to ${selectedPharmacyDetails?.name || 'pharmacy'}`
      });

      toast.success('Successfully distributed to pharmacy');
      
      // Refresh available batches using consistent endpoint
      const response = await apiClient.get('/distributer/batches');
      if (response?.data?.batches) {
        const availableBatches = response.data.batches.filter(batch => batch.quantity > 0);
        setBatches(availableBatches);
        
        // Update form state for refreshed batches
        const updatedForms = {};
        availableBatches.forEach(batch => {
          updatedForms[batch.batchId] = batchForms[batch.batchId] || {
            selectedPharmacy: '',
            quantity: '',
            remarks: ''
          };
        });
        setBatchForms(updatedForms);
      }

      // Reset form for this specific batch
      resetBatchForm(batch.batchId);
      
    } catch (err) {
      console.error('Distribution error:', err);
      toast.error(err.response?.data?.message || 'Failed to distribute batch');
    } finally {
      setDistributing(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="mb-4">
          <div className="w-48 h-4 bg-gray-200 rounded animate-pulse"></div>
        </div>
        
        <div className="grid gap-6 lg:grid-cols-2">
          {[...Array(2)].map((_, index) => (
            <Card key={index} className="p-4">
              <div className="flex items-start justify-between mb-4">
                <div className="space-y-2">
                  <div className="w-40 h-5 bg-gray-200 rounded animate-pulse"></div>
                  <div className="w-24 h-4 bg-gray-200 rounded animate-pulse"></div>
                </div>
                <div className="w-20 h-6 bg-gray-200 rounded-full animate-pulse"></div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="space-y-1">
                  <div className="w-24 h-3 bg-gray-200 rounded animate-pulse"></div>
                  <div className="w-20 h-4 bg-gray-200 rounded animate-pulse"></div>
                </div>
                <div className="space-y-1">
                  <div className="w-20 h-3 bg-gray-200 rounded animate-pulse"></div>
                  <div className="w-20 h-4 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className="w-24 h-4 bg-gray-200 rounded animate-pulse"></div>
                    <div className="w-full h-10 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                  <div className="space-y-1">
                    <div className="w-16 h-4 bg-gray-200 rounded animate-pulse"></div>
                    <div className="w-full h-10 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="h-4 bg-gray-200 rounded w-28 animate-pulse"></div>
                  <div className="w-full h-10 bg-gray-200 rounded animate-pulse"></div>
                </div>
                <div className="w-full h-10 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </Card>
          ))}
        </div>
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
      {batches.length > 0 && (
        <>
          {/* Region Selection */}
          <Card className="p-4">
            <div className="space-y-4">
              <div>
                <label className="block mb-2 text-sm font-medium">
                  Select Operational Regions *
                </label>
                <MultiSelect
                  options={districts}
                  value={selectedRegions}
                  onChange={setSelectedRegions}
                  placeholder="Select regions where you want to distribute..."
                  className="w-full"
                />
                {selectedRegions.length === 0 && (
                  <p className="mt-1 text-sm text-gray-500">
                    Please select regions to see available pharmacies
                  </p>
                )}
              </div>
            </div>
          </Card>

          <div className="mb-4 text-sm text-gray-500">
            {batches.length} batches available for distribution
            {selectedRegions.length > 0 && (
              <span className="ml-2 text-blue-600">
                • {pharmacies.length} pharmacies available in selected regions
              </span>
            )}
          </div>
        </>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {batches.map((batch) => {
          const form = getBatchForm(batch.batchId);
          
          return (
            <Card key={batch.batchId} className="p-4">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold">{batch.product}</h3>
                  <p className="text-sm text-gray-600">Batch: {batch.batchId}</p>
                </div>
                <div className="px-3 py-1 text-sm text-blue-700 rounded-full bg-blue-50">
                  {batch.quantity} available
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4 text-sm text-gray-600">
                <div>
                  <p>Manufacturing Date:</p>
                  <p className="font-medium text-gray-900">
                    {format(new Date(batch.manufactureDate), 'MMM dd, yyyy')}
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
                      value={form.selectedPharmacy}
                      onChange={(value) => updateBatchForm(batch.batchId, 'selectedPharmacy', value)}
                      placeholder={selectedRegions.length === 0 
                        ? "Select regions first..." 
                        : loadingPharmacies 
                          ? "Loading pharmacies..." 
                          : "Choose pharmacy..."
                      }
                      disabled={selectedRegions.length === 0 || loadingPharmacies}
                    />
                  </div>
                  <div>
                    <label className="block mb-1 text-sm font-medium">Quantity</label>
                    <Input
                      type="number"
                      min="1"
                      max={batch.quantity}
                      value={form.quantity}
                      onChange={(e) => {
                        const value = e.target.value;
                        // Allow empty string for clearing
                        if (value === '') {
                          updateBatchForm(batch.batchId, 'quantity', value);
                          return;
                        }
                        // Only allow valid positive integers
                        if (/^\d+$/.test(value)) {
                          updateBatchForm(batch.batchId, 'quantity', value);
                        }
                      }}
                      placeholder={`Max: ${batch.quantity}`}
                      className={`${form.quantity && parseInt(form.quantity) > batch.quantity ? 'border-red-500 focus:border-red-500' : ''}`}
                    />
                    {form.quantity && parseInt(form.quantity) > batch.quantity && (
                      <p className="mt-1 text-xs text-red-600">
                        Exceeds available quantity ({batch.quantity})
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block mb-1 text-sm font-medium">Remarks (Optional)</label>
                  <Input
                    value={form.remarks}
                    onChange={(e) => updateBatchForm(batch.batchId, 'remarks', e.target.value)}
                    placeholder="Add any notes..."
                  />
                </div>

                <Button
                  variant="primary"
                  className="w-full"
                  onClick={() => handleDistribute(batch)}
                  disabled={distributing || selectedRegions.length === 0 || !form.selectedPharmacy || !form.quantity || parseInt(form.quantity) > batch.quantity}
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
          );
        })}

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
        // Use consistent distributor transfers endpoint
        const response = await apiClient.get('/distributer/transfers');
        const transfers = response.data.transfers || [];
        
        // Transform transfers to match expected distribution format
        const formattedDistributions = transfers.map(transfer => ({
          id: `${transfer.batchId}-${transfer.timestamp}`,
          assignedAt: transfer.timestamp,
          batchNumber: transfer.batchId,
          pharmacy: {
            name: transfer.to,
            location: transfer.pharmacyLocation || null,
            walletAddress: transfer.pharmacyWalletAddress || null,
            licenseNumber: transfer.pharmacyLicenseNumber || null
          },
          quantity: transfer.quantity,
          status: transfer.status.toLowerCase().replace(' ', '_'),
          lastUpdated: transfer.timestamp
        }));
        
        setDistributions(formattedDistributions);
      } catch (err) {
        console.error('Error fetching history:', err);
        setError(err.response?.data?.message || 'Failed to load history');
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [user]);

  if (loading) {
    return (
      <Card className="p-6">
        <div className="mb-4">
          <div className="w-40 h-6 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-6 py-3 text-xs font-medium text-left text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-xs font-medium text-left text-gray-500 uppercase">Batch</th>
                <th className="px-6 py-3 text-xs font-medium text-left text-gray-500 uppercase">Pharmacy</th>
                <th className="px-6 py-3 text-xs font-medium text-left text-gray-500 uppercase">Quantity</th>
                <th className="px-6 py-3 text-xs font-medium text-left text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-xs font-medium text-left text-gray-500 uppercase">Updated</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {[...Array(5)].map((_, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="w-20 h-4 bg-gray-200 rounded animate-pulse"></div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="w-24 h-4 bg-gray-200 rounded animate-pulse"></div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="w-32 h-4 bg-gray-200 rounded animate-pulse"></div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="w-12 h-4 bg-gray-200 rounded animate-pulse"></div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="w-16 h-6 bg-gray-200 rounded-full animate-pulse"></div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="w-20 h-4 bg-gray-200 rounded animate-pulse"></div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
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
                  <div className="font-medium">{dist.pharmacy.name}</div>
                  {dist.pharmacy.location && (
                    <div className="text-xs text-gray-500">{dist.pharmacy.location}</div>
                  )}
                  {dist.pharmacy.walletAddress && (
                    <div className="font-mono text-xs text-blue-600">
                      {dist.pharmacy.walletAddress.slice(0, 6)}...{dist.pharmacy.walletAddress.slice(-4)}
                    </div>
                  )}
                  {dist.pharmacy.licenseNumber && (
                    <div className="text-xs text-gray-500">License: {dist.pharmacy.licenseNumber}</div>
                  )}
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
