import { Fragment, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { XCircle, CheckCircle, Building2, Truck, Pill, ExternalLink, Download, ZoomIn, FileText, Eye } from "lucide-react";
import toast from "react-hot-toast";
import ConfirmationModal from "./ConfirmationDialog";
import LicenseDocumentViewer from "./LicenseDocumentViewer";

const AdminUserModal = ({ 
  isOpen, 
  closeModal, 
  user, 
  refresh, 
  userType, // 'manufacturer', 'distributor', 'pharmacist'
  approveFunction, // API function to call for approval
  title
}) => {
  const [loading, setLoading] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);

  if (!user) return null;

  // Get appropriate icon based on user type
  const getIcon = () => {
    switch (userType) {
      case 'manufacturer': return Building2;
      case 'distributor': return Truck;
      case 'pharmacist': return Pill;
      default: return Building2;
    }
  };

  const Icon = getIcon();

  // Get user-specific data
  const getUserData = () => {
    switch (userType) {
      case 'manufacturer':
        return {
          companyName: user.manufacturer?.companyName,
          registrationNumber: user.manufacturer?.registrationNumber,
          certifications: user.manufacturer?.certifications?.join(", "),
          licenseDocument: user.manufacturer?.licenseDocument,
          website: user.website,
          extraFields: []
        };
      case 'distributor':
        return {
          companyName: user.distributor?.companyName,
          registrationNumber: user.distributor?.registrationNumber,
          warehouseAddress: user.distributor?.warehouseAddress,
          operationalRegions: user.distributor?.operationalRegions?.join(", "),
          licenseDocument: user.distributor?.licenseDocument,
          extraFields: [
            { label: "Warehouse Address", value: user.distributor?.warehouseAddress },
            { label: "Operational Regions", value: user.distributor?.operationalRegions?.join(", ") }
          ]
        };
      case 'pharmacist':
        return {
          pharmacyName: user.pharmacist?.pharmacyName,
          licenseNumber: user.pharmacist?.licenseNumber,
          pharmacyLocation: user.pharmacist?.pharmacyLocation,
          licenseDocument: user.pharmacist?.licenseDocument,
          extraFields: [
            { label: "Pharmacy Name", value: user.pharmacist?.pharmacyName },
            { label: "License Number", value: user.pharmacist?.licenseNumber },
            { label: "Pharmacy Location", value: user.pharmacist?.pharmacyLocation }
          ]
        };
      default:
        return {};
    }
  };

  const userData = getUserData();

  const handleApprove = async (approve) => {
    if (!approveFunction) {
      toast.error("Approval function not configured");
      return;
    }

    // Close confirmation dialog immediately
    setConfirmAction(null);
    
    // Show loading state in main modal
    setLoading(true);
    
    try {
      console.log(`${approve ? 'Approving' : 'Disapproving'} ${userType}:`, user._id);
      
      const res = await approveFunction(user._id, approve);
      console.log('Approval response:', res);
      
      if (res?.success) {
        toast.success(res.message || `${userType} ${approve ? 'approved' : 'disapproved'} successfully`);
        if (refresh) refresh();
        closeModal();
      } else {
        toast.error(res?.message || "Failed to update status");
      }
    } catch (err) {
      console.error('Approval error:', err);
      toast.error(`Error occurred while ${approve ? 'approving' : 'disapproving'} ${userType}`);
    } finally {
      setLoading(false);
    }
  };

  const openConfirm = (approve) => {
    setConfirmAction({
      approve,
      message: approve
        ? `Are you sure you want to approve this ${userType}?`
        : `Are you sure you want to disapprove this ${userType}?`,
    });
  };

  return (
    <>
      {/* Main Modal */}
      <Transition appear show={isOpen} as={Fragment}>
        <Dialog as="div" className="fixed inset-0" style={{ zIndex: 10000 }} onClose={closeModal}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
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
                <Dialog.Panel className="relative w-full max-w-3xl p-6 overflow-hidden bg-white border-2 border-indigo-200 shadow-2xl rounded-2xl">
                  {/* Decorative Header Background */}
                  <div className="absolute top-0 left-0 right-0 h-16 opacity-50 bg-gradient-to-br from-indigo-50 to-blue-50" />
                  {/* Close Button */}
                  <button
                    onClick={closeModal}
                    className="absolute z-10 p-2 text-gray-400 transition-all duration-200 bg-white rounded-full shadow-md top-3 right-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 hover:text-gray-600 hover:bg-gray-50 hover:shadow-lg"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>

                  {/* Enhanced Header - Smaller */}
                  <div className="relative flex items-start gap-3 mb-4">
                    <div className="flex-shrink-0 p-2 bg-white border-2 border-indigo-200 rounded-lg shadow-md">
                      <Icon className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div className="flex-1">
                      <Dialog.Title className="mb-1 text-xl font-bold text-gray-900">
                        {user.name}
                      </Dialog.Title>
                      <p className="text-xs text-gray-600">{title || `${userType} Details & Approval Management`}</p>
                    </div>
                  </div>

                  {/* User Info - More Compact */}
                  <div className="grid gap-4 mb-4 md:grid-cols-2">
                    <Field label="Email" value={user.email} />
                    <Field label="Phone" value={user.phone} />
                    <Field label="Country" value={user.country} />
                    <Field label="State" value={user.state} />
                    <Field label="City" value={user.city} />
                    <Field label="Address" value={user.address} />
                    {userData.website && <Field label="Website" value={userData.website} />}
                    <Field
                      label="Status"
                      value={
                        user.isApproved ? (
                          <StatusBadge approved>Approved</StatusBadge>
                        ) : (
                          <StatusBadge>Pending</StatusBadge>
                        )
                      }
                    />
                  </div>

                  {/* Type-specific Info - Smaller */}
                  <h3 className="mb-3 text-lg font-semibold text-gray-800 capitalize">
                    {userType} Details
                  </h3>
                  <div className="grid gap-4 mb-4 md:grid-cols-2">
                    {userData.companyName && <Field label="Company Name" value={userData.companyName} />}
                    {userData.registrationNumber && <Field label="Registration No" value={userData.registrationNumber} />}
                    {userData.certifications && <Field label="Certifications" value={userData.certifications} />}
                    
                    {/* Extra fields for each user type */}
                    {userData.extraFields?.map((field, index) => (
                      <Field key={index} label={field.label} value={field.value} />
                    ))}
                  </div>

                  {/* License Document - Smaller */}
                  {userData.licenseDocument && (
                    <div className="mb-4">
                      <LicenseDocumentViewer 
                        licenseDocument={userData.licenseDocument} 
                        compact={true}
                      />
                    </div>
                  )}

                  {/* Action Buttons - Smaller */}
                  <div className="flex justify-end gap-3 mt-6">
                    {!user.isApproved ? (
                      <Button
                        onClick={() => openConfirm(true)}
                        loading={loading}
                        color="green"
                        label="Approve"
                        size="sm"
                      />
                    ) : (
                      <Button
                        onClick={() => openConfirm(false)}
                        loading={loading}
                        color="red"
                        label="Disapprove"
                        size="sm"
                      />
                    )}
                    <Button 
                      onClick={closeModal} 
                      label="Close" 
                      size="sm"
                    />
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Confirmation Modal */}
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

// Helper Components
const Field = ({ label, value }) => (
  <div>
    <span className="text-sm font-medium text-gray-700">{label}:</span>{" "}
    <span className="text-sm text-gray-900">{value || "N/A"}</span>
  </div>
);

const StatusBadge = ({ approved, children }) => (
  <span
    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
      approved ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
    }`}
  >
    {children}
  </span>
);

const Button = ({ onClick, loading, color, label, size = "md" }) => {
  const baseColors = {
    green: "bg-green-600 hover:bg-green-700 text-white",
    red: "bg-red-600 hover:bg-red-700 text-white",
    gray: "bg-gray-200 hover:bg-gray-300 text-gray-800",
  };
  
  const loadingColors = {
    green: "bg-green-500 cursor-not-allowed text-white",
    red: "bg-red-500 cursor-not-allowed text-white",
    gray: "bg-gray-300 cursor-not-allowed text-gray-600",
  };
  
  const sizes = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-2 text-base"
  };
  
  const currentColor = loading ? loadingColors[color || "gray"] : baseColors[color || "gray"];
  
  return (
    <button
      onClick={loading ? undefined : onClick}
      disabled={loading}
      className={`${sizes[size]} rounded-lg font-medium shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${currentColor} ${loading ? 'transform scale-95' : 'hover:transform hover:scale-105'}`}
    >
      <div className="flex items-center justify-center gap-2 min-h-[20px]">
        {loading ? (
          <>
            <div className="w-4 h-4 border-2 border-current rounded-full animate-spin border-t-transparent opacity-80"></div>
            <span>Processing...</span>
          </>
        ) : (
          <span>{label}</span>
        )}
      </div>
    </button>
  );
};

export default AdminUserModal;