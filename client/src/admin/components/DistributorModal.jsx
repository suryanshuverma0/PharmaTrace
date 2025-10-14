import { Fragment, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { XCircle } from "lucide-react";
import { approveDistributor } from "../api/api";
import toast, { Toaster } from "react-hot-toast";
import ConfirmationModal from "./ConfirmationDialog";

const DistributorModal = ({ isOpen, closeModal, distributor, refresh }) => {
  const [loading, setLoading] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null); // { approve, message }

  if (!distributor) return null;

  const handleApprove = async (approve) => {
    setLoading(true);
    try {
      const res = await approveDistributor(distributor._id, approve);
      if (res?.success) {
        toast.success(res.message);
        refresh();
        closeModal();
      } else {
        toast.error("Failed to update status");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error occurred while updating status");
    }
    setLoading(false);
    setConfirmAction(null);
  };

  const openConfirm = (approve) => {
    setConfirmAction({
      approve,
      message: approve
        ? "Are you sure you want to approve this distributor?"
        : "Are you sure you want to disapprove this distributor?",
    });
  };

  return (
    <>
      <Toaster position="top-right" reverseOrder={false} />

      {/* Main Modal */}
      <Transition appear show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={closeModal}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-40" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex items-center justify-center min-h-full p-4">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl p-8 relative overflow-hidden">
                  {/* Close Button */}
                  <button
                    onClick={closeModal}
                    className="absolute top-5 right-5 text-gray-500 hover:text-gray-900 transition"
                  >
                    <XCircle className="w-7 h-7" />
                  </button>

                  {/* Header */}
                  <Dialog.Title className="text-3xl font-extrabold mb-6 text-gray-900">
                    {distributor.name}
                  </Dialog.Title>

                  {/* User Info */}
                  <div className="grid md:grid-cols-2 gap-6 mb-6">
                    <Field label="Email" value={distributor.email} />
                    <Field label="Phone" value={distributor.phone} />
                    <Field label="Country" value={distributor.country} />
                    <Field label="State" value={distributor.state} />
                    <Field label="City" value={distributor.city} />
                    <Field label="Address" value={distributor.address} />
                    <Field label="Website" value={distributor.website} />
                    <Field
                      label="Status"
                      value={
                        distributor.isApproved ? (
                          <StatusBadge approved>Approved</StatusBadge>
                        ) : (
                          <StatusBadge>Pending</StatusBadge>
                        )
                      }
                    />
                  </div>

                  {/* Distributor Info */}
                  <h3 className="text-2xl font-semibold mb-4 text-gray-800">
                    Distributor Details
                  </h3>
                  <div className="grid md:grid-cols-2 gap-6 mb-6">
                    <Field
                      label="Company Name"
                      value={distributor.distributor?.companyName}
                    />
                    <Field
                      label="Registration No"
                      value={distributor.distributor?.registrationNumber}
                    />
                    <Field
                      label="Warehouse Address"
                      value={distributor.distributor?.warehouseAddress}
                    />
                    <Field
                      label="Operational Regions"
                      value={distributor.distributor?.operationalRegions?.join(
                        ", "
                      )}
                    />

                    {/* License Document */}
                    <div className="col-span-full">
                      <span className="font-medium text-gray-700">
                        License Document
                      </span>
                      {distributor.distributor?.licenseDocument ? (
                        <div className="mt-2 border rounded-xl overflow-hidden shadow-md hover:shadow-xl transition">
                          <a
                            href={distributor.distributor.licenseDocument}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <img
                              src={distributor.distributor.licenseDocument}
                              alt="License Document"
                              className="w-full h-60 object-cover"
                            />
                          </a>
                        </div>
                      ) : (
                        <p className="text-gray-500 mt-1">
                          No license document uploaded
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end gap-4 mt-8">
                    {!distributor.isApproved ? (
                      <Button
                        onClick={() => openConfirm(true)}
                        loading={loading}
                        color="green"
                        label="Approve"
                      />
                    ) : (
                      <Button
                        onClick={() => openConfirm(false)}
                        loading={loading}
                        color="red"
                        label="Disapprove"
                      />
                    )}
                    <Button onClick={closeModal} label="Close" />
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Confirmation Dialog */}
      {confirmAction && (
        <ConfirmationModal
          isOpen={!!confirmAction}
          closeModal={() => setConfirmAction(null)}
          onConfirm={() => handleApprove(confirmAction.approve)}
          message={confirmAction.message}
          color={confirmAction.approve ? "green" : "red"}
        />
      )}
    </>
  );
};

/* -------------------- Helper Components -------------------- */

const Field = ({ label, value }) => (
  <div>
    <span className="font-medium text-gray-700">{label}:</span>{" "}
    <span className="text-gray-900">{value || "N/A"}</span>
  </div>
);

const StatusBadge = ({ approved, children }) => (
  <span
    className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
      approved ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
    }`}
  >
    {children}
  </span>
);

const Button = ({ onClick, loading, color, label }) => {
  const colors = {
    green: "bg-green-600 hover:bg-green-700 text-white",
    red: "bg-red-600 hover:bg-red-700 text-white",
    gray: "bg-gray-200 hover:bg-gray-300 text-gray-800",
  };
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`px-6 py-2 rounded-lg font-medium shadow-md transition ${
        colors[color || "gray"]
      }`}
    >
      {loading ? "Processing..." : label}
    </button>
  );
};

export default DistributorModal;
