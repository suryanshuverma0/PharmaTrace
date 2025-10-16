import { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import ConfirmationModal from "./ConfirmationDialog";
import Navbar from "../../components/common/Navbar";

const DashboardLayout = () => {
  const [logoutModal, setLogoutModal] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    setLogoutModal(false);
    navigate("/");
  };
  
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      <div className="flex flex-col flex-1">
        <Navbar/>
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>

      <ConfirmationModal
        isOpen={logoutModal}
        closeModal={() => setLogoutModal(false)}
        onConfirm={handleLogout}
        message="Do you really want to logout?"
        color="red"
      />
    </div>
  );
};

export default DashboardLayout;
