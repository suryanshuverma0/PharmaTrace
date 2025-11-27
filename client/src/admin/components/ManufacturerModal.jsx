
import { Toaster } from "react-hot-toast";
import { approveManufacturer } from "../api/api";
import AdminUserModal from "./AdminUserModal";

const ManufacturerModal = ({ isOpen, closeModal, manufacturer, refresh }) => {
  return (
    <>
      <Toaster position="top-right" reverseOrder={false} />
      <AdminUserModal
        isOpen={isOpen}
        closeModal={closeModal}
        user={manufacturer}
        refresh={refresh}
        userType="manufacturer"
        approveFunction={approveManufacturer}
        title="Manufacturer Details & Approval Management"
      />
    </>
  );
};

export default ManufacturerModal;
