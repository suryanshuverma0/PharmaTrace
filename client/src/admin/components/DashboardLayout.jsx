import { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import Navbar from "../../components/common/Navbar";
import { useModalZIndexFix } from "../../hooks/useModalZIndex";

const DashboardLayout = () => {
  const [logoutModal, setLogoutModal] = useState(false);
  const navigate = useNavigate();

  // Apply global modal z-index fixes
  useModalZIndexFix();

  const handleLogout = () => {
    setLogoutModal(false);
    navigate("/");
  };
  
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      <div className="flex flex-col flex-1">
        <Navbar/>
        <main className="flex-1 p-6 overflow-auto mt-14">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
