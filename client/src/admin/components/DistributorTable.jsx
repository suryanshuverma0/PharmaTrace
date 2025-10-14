// import { useState } from "react";
// import { motion } from "framer-motion";
// import { CheckCircle, XCircle } from "lucide-react";
// import { approveDistributor as approveApi } from "../api/api";
// import DistributorModal from "./DistributorModal"; // we'll create this next

// const DistributorTable = ({ distributors, refresh }) => {
//   const [loadingIds, setLoadingIds] = useState([]);
//   const [selected, setSelected] = useState(null);

//   const handleApprove = async (id, approve) => {
//     setLoadingIds((prev) => [...prev, id]);
//     const res = await approveApi(id, approve);
//     if (res?.success) {
//       alert(res.message);
//       refresh();
//     } else {
//       alert("Failed to update status");
//     }
//     setLoadingIds((prev) => prev.filter((i) => i !== id));
//   };

//   return (
//     <div className="overflow-x-auto bg-white rounded-2xl shadow-md border border-gray-100">
//       <table className="w-full border-collapse min-w-[700px]">
//         <thead>
//           <tr className="bg-gray-100 text-left text-gray-700 uppercase text-sm">
//             <th className="py-3 px-4">#</th>
//             <th className="py-3 px-4">Company</th>
//             <th className="py-3 px-4">Email</th>
//             <th className="py-3 px-4">Country</th>
//             <th className="py-3 px-4">Reg. No.</th>
//             <th className="py-3 px-4">Status</th>
//             <th className="py-3 px-4 text-right">Action</th>
//           </tr>
//         </thead>
//         <tbody>
//           {distributors.length > 0 ? (
//             distributors.map((d, i) => (
//               <motion.tr
//                 key={d._id}
//                 initial={{ opacity: 0, y: 10 }}
//                 animate={{ opacity: 1, y: 0 }}
//                 transition={{ delay: i * 0.05 }}
//                 onClick={() => setSelected(d)}
//                 className="border-b hover:bg-gray-50 cursor-pointer transition-all"
//               >
//                 <td className="py-3 px-4">{i + 1}</td>
//                 <td className="py-3 px-4 font-medium">{d.distributor?.companyName || "—"}</td>
//                 <td className="py-3 px-4">{d.email}</td>
//                 <td className="py-3 px-4">{d.country || "—"}</td>
//                 <td className="py-3 px-4">{d.distributor?.registrationNumber || "—"}</td>
//                 <td className="py-3 px-4">
//                   {d.isApproved ? (
//                     <span className="flex items-center text-green-600 font-medium">
//                       <CheckCircle className="w-4 h-4 mr-1" /> Approved
//                     </span>
//                   ) : (
//                     <span className="flex items-center text-yellow-600 font-medium">
//                       <XCircle className="w-4 h-4 mr-1" /> Pending
//                     </span>
//                   )}
//                 </td>
//                 <td className="py-3 px-4 text-right">
//                   {!d.isApproved ? (
//                     <button
//                       onClick={(e) => {
//                         e.stopPropagation();
//                         handleApprove(d._id, true);
//                       }}
//                       disabled={loadingIds.includes(d._id)}
//                       className="px-3 py-1 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700"
//                     >
//                       {loadingIds.includes(d._id) ? "..." : "Approve"}
//                     </button>
//                   ) : (
//                     <button
//                       onClick={(e) => {
//                         e.stopPropagation();
//                         handleApprove(d._id, false);
//                       }}
//                       disabled={loadingIds.includes(d._id)}
//                       className="px-3 py-1 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700"
//                     >
//                       {loadingIds.includes(d._id) ? "..." : "Disapprove"}
//                     </button>
//                   )}
//                 </td>
//               </motion.tr>
//             ))
//           ) : (
//             <tr>
//               <td colSpan="7" className="text-center py-6 text-gray-500 font-medium">
//                 No distributors found.
//               </td>
//             </tr>
//           )}
//         </tbody>
//       </table>

//       {/* Distributor Modal */}
//       {selected && (
//         <DistributorModal distributor={selected} isOpen={!!selected} closeModal={() => setSelected(null)} refresh={refresh} />
//       )}
//     </div>
//   );
// };

// export default DistributorTable;



import { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle, XCircle, Clock } from "lucide-react";
import { toast } from "react-hot-toast";
import DistributorModal from "./DistributorModal";
import ConfirmationModal from "./ConfirmationDialog";
import { approveDistributor as approveApi } from "../api/api";

const DistributorTable = ({ distributors, refresh }) => {
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
          {distributors.length > 0 ? (
            distributors.map((d, i) => (
              <motion.tr
                key={d._id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => setSelected(d)}
                className="border-b hover:bg-gray-50 cursor-pointer transition-all group"
              >
                <td className="py-3 px-4">{i + 1}</td>
                <td className="py-3 px-4 font-medium text-gray-800">
                  <div>{d.distributor?.companyName || "—"}</div>
                  <div className="text-xs text-gray-500">{d.name || "—"}</div>
                </td>
                <td className="py-3 px-4">{d.email}</td>
                <td className="py-3 px-4">{d.country || "—"}</td>
                <td className="py-3 px-4">{d.distributor?.registrationNumber || "—"}</td>
                <td className="py-3 px-4">
                  {d.isApproved ? (
                    <span className="inline-flex items-center gap-1 text-green-600 font-medium bg-green-50 px-2 py-1 rounded-md">
                      <CheckCircle className="w-4 h-4" /> Approved
                    </span>
                  ) : d.isRejected ? (
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
                    {d.isApproved ? (
                      <button
                        onClick={() =>
                          openConfirm(
                            d._id,
                            false,
                            "Are you sure you want to disapprove this distributor?"
                          )
                        }
                        disabled={loadingIds.includes(d._id)}
                        className="px-3 py-1 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 disabled:opacity-70"
                      >
                        {loadingIds.includes(d._id) ? "..." : "Disapprove"}
                      </button>
                    ) : (
                      <button
                        onClick={() =>
                          openConfirm(
                            d._id,
                            true,
                            "Are you sure you want to approve this distributor?"
                          )
                        }
                        disabled={loadingIds.includes(d._id)}
                        className="px-3 py-1 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-70"
                      >
                        {loadingIds.includes(d._id) ? "..." : "Approve"}
                      </button>
                    )}
                  </div>
                </td>
              </motion.tr>
            ))
          ) : (
            <tr>
              <td colSpan="7" className="text-center py-6 text-gray-500 font-medium">
                No distributors found.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Distributor Modal */}
      {selected && (
        <DistributorModal
          isOpen={!!selected}
          closeModal={() => setSelected(null)}
          distributor={selected}
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

export default DistributorTable;
