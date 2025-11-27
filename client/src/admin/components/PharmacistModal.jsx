import { Toaster } from "react-hot-toast";
import { approvePharmacist } from "../api/api";
import AdminUserModal from "./AdminUserModal";

const PharmacistModal = ({ isOpen, closeModal, pharmacist, refresh }) => {

  return (
    <>
      <Toaster position="top-right" reverseOrder={false} />
      <AdminUserModal
        isOpen={isOpen}
        closeModal={closeModal}
        user={pharmacist}
        refresh={refresh}
        userType="pharmacist"
        approveFunction={approvePharmacist}
        title="Pharmacist Details & Approval Management"
      />
    </>
  );
};

export default PharmacistModal;
