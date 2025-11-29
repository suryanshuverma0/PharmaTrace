import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Table2,
  ArrowLeft
} from "lucide-react";
import Card from "../../components/UI/Card";
import Alert from "../../components/UI/Alert";
import QuantityExplanation from "../../components/UI/QuantityExplanation";
import apiClient from "../../services/api/api";
import { useNavigate, Link } from "react-router-dom";

const RegisteredBatch = () => {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBatches = async () => {
      setLoading(true);
      try {
        const response = await apiClient.get("/batches");
        setBatches(response.data.batches || []);
        setAlert(null);
      } catch (err) {
        setAlert({
          type: "error",
          title: "Failed to Load Batches",
          message:
            err.response?.data?.message ||
            "An error occurred while fetching batches.",
        });
        setBatches([]);
      } finally {
        setLoading(false);
      }
    };
    fetchBatches();
  }, []);
  return (
    <>
      {alert && (
        <Alert
          type={alert.type}
          title={alert.title}
          onClose={() => setAlert(null)}
          className="max-w-full mx-auto mb-6"
        >
          {alert.message}
        </Alert>
      )}

      {loading && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="max-w-6xl mx-auto animate-pulse"
        >
          <Card className="overflow-hidden">
            <div className="p-6">
              {/* Header Skeleton */}
              <div className="flex items-center justify-between gap-2 mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-gray-200 rounded"></div>
                  <div className="w-48 h-6 bg-gray-200 rounded"></div>
                </div>
                <div className="w-32 bg-gray-200 rounded-lg h-9"></div>
              </div>
              
              {/* Quantity Explanation Skeleton */}
              <div className="p-4 mb-6 border rounded-lg bg-gray-50">
                <div className="w-40 h-5 mb-2 bg-gray-200 rounded"></div>
                <div className="space-y-2">
                  <div className="w-full h-4 bg-gray-200 rounded"></div>
                  <div className="w-3/4 h-4 bg-gray-200 rounded"></div>
                </div>
              </div>
              
              {/* Table Skeleton */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                    <tr>
                      <th className="px-6 py-3"><div className="w-20 h-4 bg-gray-200 rounded"></div></th>
                      <th className="px-6 py-3"><div className="w-20 h-4 bg-gray-200 rounded"></div></th>
                      <th className="px-6 py-3"><div className="w-16 h-4 bg-gray-200 rounded"></div></th>
                      <th className="px-6 py-3"><div className="w-24 h-4 bg-gray-200 rounded"></div></th>
                      <th className="px-6 py-3"><div className="w-20 h-4 bg-gray-200 rounded"></div></th>
                      <th className="px-6 py-3"><div className="w-16 h-4 bg-gray-200 rounded"></div></th>
                      <th className="px-6 py-3"><div className="w-20 h-4 bg-gray-200 rounded"></div></th>
                      <th className="px-6 py-3"><div className="w-16 h-4 bg-gray-200 rounded"></div></th>
                      <th className="px-6 py-3"><div className="h-4 bg-gray-200 rounded w-18"></div></th>
                      <th className="px-6 py-3"><div className="w-24 h-4 bg-gray-200 rounded"></div></th>
                      <th className="px-6 py-3"><div className="w-16 h-4 bg-gray-200 rounded"></div></th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: 3 }).map((_, index) => (
                      <tr key={index} className="bg-white border-b">
                        <td className="px-6 py-4"><div className="w-24 h-4 bg-gray-200 rounded"></div></td>
                        <td className="px-6 py-4"><div className="w-16 h-4 bg-gray-200 rounded"></div></td>
                        <td className="px-6 py-4"><div className="w-12 h-4 bg-gray-200 rounded"></div></td>
                        <td className="px-6 py-4"><div className="w-20 h-4 bg-gray-200 rounded"></div></td>
                        <td className="px-6 py-4"><div className="w-20 h-4 bg-gray-200 rounded"></div></td>
                        <td className="px-6 py-4"><div className="w-12 h-4 bg-gray-200 rounded"></div></td>
                        <td className="px-6 py-4"><div className="w-12 h-4 bg-gray-200 rounded"></div></td>
                        <td className="px-6 py-4"><div className="w-12 h-4 bg-gray-200 rounded"></div></td>
                        <td className="px-6 py-4"><div className="w-12 h-4 bg-gray-200 rounded"></div></td>
                        <td className="px-6 py-4"><div className="w-16 h-4 bg-gray-200 rounded"></div></td>
                        <td className="px-6 py-4"><div className="w-20 h-6 bg-gray-200 rounded-full"></div></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="max-w-6xl mx-auto"
      >
        {batches.length === 0 && !loading ? (
          <Card className="overflow-hidden">
            <div className="p-6 text-center">
              <p className="text-gray-500">No batches have been registered yet.</p>
              <Link
                to="/manufacturer/register/batch"
                className="inline-block px-6 py-2 mt-4 text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                Register Your First Batch
              </Link>
            </div>
          </Card>
        ) : (
          <Card className="overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between gap-2 mb-6 text-lg font-semibold text-gray-900">
                <div className="flex items-center gap-2">
                  <Table2 className="w-5 h-5 text-primary-600" />
                  <h3>All Registered Batches ({batches.length})</h3>
                </div>
                <Link
                  to="/manufacturer/register/batch"
                  className="px-4 py-2 text-sm font-medium text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700"
                >
                  Register New Batch
                </Link>
              </div>
              
              <QuantityExplanation />
              
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-500">
                  <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                    <tr>
                      <th className="px-6 py-3">Batch Number</th>
                      <th className="px-6 py-3">Dosage Form</th>
                      <th className="px-6 py-3">Strength</th>
                      <th className="px-6 py-3">Manufacture Date</th>
                      <th className="px-6 py-3">Expiry Date</th>
                      <th className="px-6 py-3">Produced</th>
                      <th className="px-6 py-3">Products Reg.</th>
                      <th className="px-6 py-3">Assigned</th>
                      <th className="px-6 py-3">Remaining</th>
                      <th className="px-6 py-3">Approval Cert.</th>
                      <th className="px-6 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {batches.map((batch) => (
                      <tr
                        key={batch._id}
                        className="transition-colors bg-white border-b hover:bg-gray-50"
                      >
                        <td className="px-6 py-4 font-medium text-gray-900">
                          {batch.batchNumber}
                        </td>
                        <td className="px-6 py-4">{batch.dosageForm || "-"}</td>
                        <td className="px-6 py-4">{batch.strength || "-"}</td>
                        <td className="px-6 py-4">
                          {new Date(batch.manufactureDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          {new Date(batch.expiryDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 font-medium">
                          {batch.quantityProduced}
                        </td>
                        <td className="px-6 py-4 text-blue-600">
                          {batch.totalProductsRegistered || (batch.quantityProduced - batch.quantityAvailable)}
                        </td>
                        <td className="px-6 py-4 text-orange-600">
                          {batch.quantityAssigned || 0}
                        </td>
                        <td className="px-6 py-4 font-medium text-green-600">
                          {batch.quantityRemainingForAssignment || (batch.quantityProduced - (batch.quantityAssigned || 0))}
                        </td>
                        <td className="px-6 py-4">
                          {batch.approvalCertId || "-"}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold
                            ${batch.shipmentStatus === 'Produced' ? 'bg-blue-100 text-blue-800' :
                              batch.shipmentStatus === 'In Transit' ? 'bg-amber-100 text-amber-800' :
                                batch.shipmentStatus === 'Delivered' ? 'bg-emerald-100 text-emerald-800' :
                                  batch.shipmentStatus === 'Returned' ? 'bg-red-100 text-red-800' :
                                    batch.shipmentStatus === 'Recalled' ? 'bg-gray-200 text-gray-800' :
                                      'bg-gray-100 text-gray-800'}`}
                          >
                            <span className="inline-block w-2 h-2 rounded-full"
                              style={{
                                backgroundColor:
                                  batch.shipmentStatus === 'Produced' ? '#2563eb' :
                                    batch.shipmentStatus === 'In Transit' ? '#f59e42' :
                                      batch.shipmentStatus === 'Delivered' ? '#059669' :
                                        batch.shipmentStatus === 'Returned' ? '#dc2626' :
                                          batch.shipmentStatus === 'Recalled' ? '#6b7280' :
                                            '#a3a3a3'
                              }}
                            />
                            {batch.shipmentStatus || 'Produced'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {batches.length === 0 && !loading && (
                <div className="py-12 text-center">
                  <p className="text-gray-500">No batches found.</p>
                </div>
              )}
            </div>
          </Card>
        )}
      </motion.div>
    </>
  );
};

export default RegisteredBatch;
