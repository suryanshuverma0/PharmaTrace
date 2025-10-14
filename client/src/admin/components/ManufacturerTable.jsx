
import { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle, XCircle, Clock } from "lucide-react";
import { toast } from "react-hot-toast"; // ✅ import hot toast
import ManufacturerModal from "./ManufacturerModal";
import ConfirmationModal from "./ConfirmationDialog";
import { approveManufacturer as approveApi } from "../api/api";

const ManufacturerTable = ({ manufacturers, refresh }) => {
  const [loadingIds, setLoadingIds] = useState([]);
  const [selected, setSelected] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null); // {id, approve, message}

  const handleApprove = async (id, approve) => {
    setLoadingIds((prev) => [...prev, id]);
    try {
      const res = await approveApi(id, approve);
      if (res?.success) {
        toast.success(res.message); // ✅ Show success toast
        refresh();
      } else {
        toast.error("Failed to update status"); // ✅ Show error toast
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred"); // ✅ Show error toast
    } finally {
      setLoadingIds((prev) => prev.filter((i) => i !== id));
      setConfirmAction(null);
    }
  };

  const openConfirm = (id, approve, message) => {
    setConfirmAction({ id, approve, message });
  };

  return (
    <div className="overflow-hidden bg-white rounded-2xl shadow-md border border-gray-100">
      <table className="w-full border-collapse min-w-[900px]">
        <thead>
          <tr className="bg-gray-50 text-left text-gray-700 uppercase text-sm">
            <th className="py-3 px-4">#</th>
            <th className="py-3 px-4">Company</th>
            <th className="py-3 px-4">Email</th>
            <th className="py-3 px-4">Country</th>
            <th className="py-3 px-4">Reg. No.</th>
            <th className="py-3 px-4">Status</th>
            <th className="py-3 px-4 text-right">Action</th>
          </tr>
        </thead>
        <tbody>
          {manufacturers.length > 0 ? (
            manufacturers.map((m, i) => (
              <motion.tr
                key={m._id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => setSelected(m)}
                className="border-b hover:bg-gray-50 cursor-pointer transition-all group"
              >
                <td className="py-3 px-4">{i + 1}</td>
                <td className="py-3 px-4 font-medium text-gray-800">
                  <div>{m.manufacturer?.companyName || "—"}</div>
                  <div className="text-xs text-gray-500">{m.name || "—"}</div>
                </td>
                <td className="py-3 px-4">{m.email}</td>
                <td className="py-3 px-4">{m.country || "—"}</td>
                <td className="py-3 px-4">{m.manufacturer?.registrationNumber || "—"}</td>
                <td className="py-3 px-4">
                  {m.isApproved ? (
                    <span className="inline-flex items-center gap-1 text-green-600 font-medium bg-green-50 px-2 py-1 rounded-md">
                      <CheckCircle className="w-4 h-4" /> Approved
                    </span>
                  ) : m.isRejected ? (
                    <span className="inline-flex items-center gap-1 text-red-600 font-medium bg-red-50 px-2 py-1 rounded-md">
                      <XCircle className="w-4 h-4" /> Rejected
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-yellow-600 font-medium bg-yellow-50 px-2 py-1 rounded-md">
                      <Clock className="w-4 h-4" /> Pending
                    </span>
                  )}
                </td>
                <td className="py-3 px-4 text-right">
                  <div
                    className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {m.isApproved ? (
                      <button
                        onClick={() =>
                          openConfirm(
                            m._id,
                            false,
                            "Are you sure you want to disapprove this manufacturer?"
                          )
                        }
                        className="px-3 py-1 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700"
                      >
                        Disapprove
                      </button>
                    ) : (
                      <button
                        onClick={() =>
                          openConfirm(
                            m._id,
                            true,
                            "Are you sure you want to approve this manufacturer?"
                          )
                        }
                        className="px-3 py-1 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700"
                      >
                        Approve
                      </button>
                    )}
                  </div>
                </td>
              </motion.tr>
            ))
          ) : (
            <tr>
              <td colSpan="7" className="text-center py-6 text-gray-500 font-medium">
                No manufacturers found.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Manufacturer Modal */}
      {selected && (
        <ManufacturerModal
          isOpen={!!selected}
          closeModal={() => setSelected(null)}
          manufacturer={selected}
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
  color={confirmAction.approve ? "green" : "red"} // ✅ dynamic color
/>

      )}
    </div>
  );
};

export default ManufacturerTable;
