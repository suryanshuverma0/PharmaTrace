import { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle, XCircle, Clock } from "lucide-react";
import toast from "react-hot-toast";
import PharmacistModal from "./PharmacistModal";
import ConfirmationModal from "./ConfirmationDialog";
import { approvePharmacist as approveApi } from "../api/api";

// Skeleton component
const TableRowSkeleton = () => (
  <tr className="border-b animate-pulse">
    <td className="px-4 py-3">
      <div className="w-6 h-4 bg-gray-200 rounded"></div>
    </td>
    <td className="px-4 py-3">
      <div className="space-y-2">
        <div className="w-32 h-4 bg-gray-200 rounded"></div>
        <div className="w-24 h-3 bg-gray-200 rounded"></div>
      </div>
    </td>
    <td className="px-4 py-3">
      <div className="w-40 h-4 bg-gray-200 rounded"></div>
    </td>
    <td className="px-4 py-3">
      <div className="w-16 h-4 bg-gray-200 rounded"></div>
    </td>
    <td className="px-4 py-3">
      <div className="w-20 h-4 bg-gray-200 rounded"></div>
    </td>
    <td className="px-4 py-3">
      <div className="w-20 h-6 bg-gray-200 rounded-full"></div>
    </td>
    <td className="px-4 py-3 text-right">
      <div className="w-16 h-6 bg-gray-200 rounded"></div>
    </td>
  </tr>
);

const PharmacistTable = ({ pharmacists, refresh, setFilter, loading = false }) => {
  const [loadingIds, setLoadingIds] = useState([]);
  const [selected, setSelected] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null); // {id, approve, message}

  const handleApprove = async (id, approve) => {
    setLoadingIds((prev) => [...prev, id]);
    try {
      const res = await approveApi(id, approve);
      if (res?.success) {
        toast.success(res.message);
        refresh();
        setFilter("all");
      } else {
        toast.error("Failed to update status");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred while updating status");
    } finally {
      setLoadingIds((prev) => prev.filter((i) => i !== id));
      setConfirmAction(null);
    }
  };

  const openConfirm = (id, approve, message) => {
    setConfirmAction({ id, approve, message });
  };

  return (
    <div className="overflow-hidden bg-white border border-gray-100 shadow-md rounded-2xl">
      <table className="w-full border-collapse min-w-[900px]">
        <thead>
          <tr className="text-sm text-left text-gray-700 uppercase bg-gray-50">
            <th className="px-4 py-3">#</th>
            <th className="px-4 py-3">Pharmacy</th>
            <th className="px-4 py-3">Email</th>
            <th className="px-4 py-3">Phone</th>
            <th className="px-4 py-3">License No.</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3 text-right">Action</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            // Show skeleton rows while loading
            Array.from({ length: 5 }).map((_, index) => (
              <TableRowSkeleton key={index} />
            ))
          ) : pharmacists.length > 0 ? (
            pharmacists.map((p, i) => (
              <motion.tr
                key={p._id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => setSelected(p)}
                className="transition-all border-b cursor-pointer hover:bg-gray-50 group"
              >
                <td className="px-4 py-3">{i + 1}</td>
                <td className="px-4 py-3 font-medium text-gray-800">
                  <div>{p.pharmacist?.pharmacyName || "—"}</div>
                  <div className="text-xs text-gray-500">{p.name || "—"}</div>
                </td>
                <td className="px-4 py-3">{p.email}</td>
                <td className="px-4 py-3">{p.phone || "—"}</td>
                <td className="px-4 py-3">{p.pharmacist?.licenseNumber || "—"}</td>
                <td className="px-4 py-3">
                  {p.isApproved ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 font-medium text-green-600 rounded-md bg-green-50">
                      <CheckCircle className="w-4 h-4" /> Approved
                    </span>
                  ) : p.isRejected ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 font-medium text-red-600 rounded-md bg-red-50">
                      <XCircle className="w-4 h-4" /> Rejected
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-1 font-medium text-yellow-600 rounded-md bg-yellow-50">
                      <Clock className="w-4 h-4" /> Pending
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <div
                    className="flex items-center justify-end gap-2 transition-opacity opacity-100 group-hover:opacity-100"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {p.isApproved ? (
                      <button
                        onClick={() =>
                          openConfirm(
                            p._id,
                            false,
                            "Are you sure you want to disapprove this pharmacist?"
                          )
                        }
                        disabled={loadingIds.includes(p._id)}
                        className="px-3 py-1 text-sm text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-70"
                      >
                        {loadingIds.includes(p._id) ? "..." : "Disapprove"}
                      </button>
                    ) : (
                      <button
                        onClick={() =>
                          openConfirm(
                            p._id,
                            true,
                            "Are you sure you want to approve this pharmacist?"
                          )
                        }
                        disabled={loadingIds.includes(p._id)}
                        className="px-3 py-1 text-sm text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-70"
                      >
                        {loadingIds.includes(p._id) ? "..." : "Approve"}
                      </button>
                    )}
                  </div>
                </td>
              </motion.tr>
            ))
          ) : (
            <tr>
              <td colSpan="7" className="py-6 font-medium text-center text-gray-500">
                No pharmacists found.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Pharmacist Modal */}
      {selected && (
        <PharmacistModal
          isOpen={!!selected}
          closeModal={() => setSelected(null)}
          pharmacist={selected}
          refresh={refresh}
        />
      )}

      {/* Confirmation Modal */}
      {confirmAction && (
        <ConfirmationModal
          isOpen={!!confirmAction}
          closeModal={() => setConfirmAction(null)}
          onConfirm={() => handleApprove(confirmAction.id, confirmAction.approve)}
          message={confirmAction.message}
          color={confirmAction.approve ? "green" : "red"}
        />
      )}
    </div>
  );
};

export default PharmacistTable;
