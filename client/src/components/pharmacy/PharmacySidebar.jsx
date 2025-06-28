import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  FaBox,
  FaCheckCircle,
  FaQrcode,
  FaExclamationTriangle,
} from "react-icons/fa";

const PharmacySidebar = ({ isCollapsed, onToggle }) => {
  const location = useLocation();
  const isActive = (path) =>
    location.pathname === path
      ? "bg-primary-600 text-white"
      : "text-gray-600 hover:bg-primary-50";
  const menuItems = [
    {
      path: "/pharmacy/dashboard",
      name: "Dashboard",
      icon: <FaBox className="w-5 h-5" />,
    },
    {
      path: "/pharmacy/inventory",
      name: "Inventory",
      icon: <FaCheckCircle className="w-5 h-5" />,
    },
    {
      path: "/pharmacy/verify",
      name: "Verify Product",
      icon: <FaQrcode className="w-5 h-5" />,
    },
    {
      path: "/pharmacy/expiry-alerts",
      name: "Expiry Alerts",
      icon: <FaExclamationTriangle className="w-5 h-5" />,
    },
  ];
  return (
    <div
      className={`flex flex-col h-full bg-white border-r border-gray-200 ${
        isCollapsed ? "w-20" : "w-64"
      } transition-all duration-300`}
    >
      <div className="flex flex-col flex-1 pt-0 pb-4 overflow-y-auto">
        <div className="flex-1 px-3 space-y-1">
          {/* Collapse/Expand Button */}
          <div className="flex items-center justify-end">
            <button
              onClick={onToggle}
              className="p-1 my-1 mb-1 rounded hover:bg-primary-100 text-primary-700 focus:outline-none"
              aria-label="Toggle Sidebar"
            >
              {isCollapsed ? "→" : "←"}
            </button>
          </div>

          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center px-4 py-3 text-sm font-medium rounded-md ${isActive(
                item.path
              )} ${isCollapsed ? "justify-center" : ""}`}
              title={item.name}
            >
              {item.icon}
              {!isCollapsed && <span className="ml-3">{item.name}</span>}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PharmacySidebar;
