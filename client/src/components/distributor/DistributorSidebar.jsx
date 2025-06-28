import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaBox, FaQrcode, FaShippingFast, FaClipboardCheck, FaCheckCircle, FaWarehouse, FaShareSquare, FaHistory } from 'react-icons/fa';

const DistributorSidebar = () => {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path ? 'bg-primary-600 text-white' : 'text-gray-600 hover:bg-primary-50';
  };

  const menuItems = [
    {
      path: '/distributor/dashboard',
      name: 'Dashboard',
      icon: <FaBox className="w-5 h-5" />,
    },
    {
      path: '/distributor/assigned-batches',
      name: 'Assigned Batches',
      icon: <FaShippingFast className="w-5 h-5" />,
    },
    {
      path: '/distributor/acknowledge-shipment',
      name: 'Acknowledge Shipment',
      icon: <FaCheckCircle className="w-5 h-5" />,
    },
    {
      path: '/distributor/inventory',
      name: 'Inventory',
      icon: <FaWarehouse className="w-5 h-5" />,
    },
    {
      path: '/distributor/distribute',
      name: 'Distribute',
      icon: <FaShareSquare className="w-5 h-5" />,
    },
    {
      path: '/distributor/track-transfers',
      name: 'Track Transfers',
      icon: <FaHistory className="w-5 h-5" />,
    },
    {
      path: '/distributor/verify',
      name: 'Verify Products',
      icon: <FaQrcode className="w-5 h-5" />,
    },
  ];

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200">
      <div className="flex flex-col flex-1 pt-5 pb-4 overflow-y-auto">
        <div className="flex-1 px-3 space-y-1">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center px-4 py-3 text-sm font-medium rounded-md ${isActive(
                item.path
              )}`}
            >
              {item.icon}
              <span className="ml-3">{item.name}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DistributorSidebar;
