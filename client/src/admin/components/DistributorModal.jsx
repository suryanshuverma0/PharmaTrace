import { Toaster } from "react-hot-toast";
import { approveDistributor } from "../api/api";
import AdminUserModal from "./AdminUserModal";

const DistributorModal = ({ isOpen, closeModal, distributor, refresh }) => {
  return (
    <>
      <Toaster position="top-right" reverseOrder={false} />
      <AdminUserModal
        isOpen={isOpen}
        closeModal={closeModal}
        user={distributor}
        refresh={refresh}
        userType="distributor"
        approveFunction={approveDistributor}
        title="Distributor Details & Approval Management"
      />
    </>
  );
};



export default DistributorModal;
