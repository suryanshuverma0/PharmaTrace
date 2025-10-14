
import { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle, XCircle, Clock } from "lucide-react";
import { toast } from "react-hot-toast"; // ✅ import hot toast
import ManufacturerModal from "./ManufacturerModal";
import ConfirmationModal from "./ConfirmationDialog";
import { approveManufacturer as approveApi } from "../api/api";

const ManufacturerTable = ({ manufacturers, refresh, setFilter }) => {
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
        setFilter("all");
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
    <div className="overflow-hidden bg-white border border-gray-100 shadow-md rounded-2xl">
      <table className="w-full border-collapse min-w-[900px]">
        <thead>
          <tr className="text-sm text-left text-gray-700 uppercase bg-gray-50">
            <th className="px-4 py-3">#</th>
            <th className="px-4 py-3">Company</th>
            <th className="px-4 py-3">Email</th>
            <th className="px-4 py-3">Country</th>
            <th className="px-4 py-3">Reg. No.</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3 text-right">Action</th>
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
                className="transition-all border-b cursor-pointer hover:bg-gray-50 group"
              >
                <td className="px-4 py-3">{i + 1}</td>
                <td className="px-4 py-3 font-medium text-gray-800">
                  <div>{m.manufacturer?.companyName || "—"}</div>
                  <div className="text-xs text-gray-500">{m.name || "—"}</div>
                </td>
                <td className="px-4 py-3">{m.email}</td>
                <td className="px-4 py-3">{m.country || "—"}</td>
                <td className="px-4 py-3">{m.manufacturer?.registrationNumber || "—"}</td>
                <td className="px-4 py-3">
                  {m.isApproved ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 font-medium text-green-600 rounded-md bg-green-50">
                      <CheckCircle className="w-4 h-4" /> Approved
                    </span>
                  ) : m.isRejected ? (
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
                    {m.isApproved ? (
                      <button
                        onClick={() =>
                          openConfirm(
                            m._id,
                            false,
                            "Are you sure you want to disapprove this manufacturer?"
                          )
                        }
                        className="px-3 py-1 text-sm text-white bg-red-600 rounded-lg hover:bg-red-700"
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
                        className="px-3 py-1 text-sm text-white bg-green-600 rounded-lg hover:bg-green-700"
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
              <td colSpan="7" className="py-6 font-medium text-center text-gray-500">
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
