import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import DistributorSidebar from '../components/distributor/DistributorSidebar';
import { useModalZIndexFix } from '../hooks/useModalZIndex';

const DistributorLayout = () => {
  // Apply global modal z-index fixes
  useModalZIndexFix();

  return (
    <div className="flex flex-col h-screen">
      <Navbar />
      <div className="flex flex-1 mt-24 overflow-hidden">
        <aside className="hidden md:flex md:flex-shrink-0">
          <div className="w-64">
            <DistributorSidebar />
          </div>
        </aside>
        <main className="flex-1 p-4 overflow-y-auto bg-gray-50">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DistributorLayout;
