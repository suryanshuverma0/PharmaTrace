import { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import ConfirmationModal from "./ConfirmationDialog";

const DashboardLayout = () => {
  const [logoutModal, setLogoutModal] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    setLogoutModal(false);
    navigate("/"); // redirect to login page
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      <div className="flex-1 flex flex-col">
        <Topbar onLogout={() => setLogoutModal(true)} />
        <main className="p-6 flex-1 overflow-auto">
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
