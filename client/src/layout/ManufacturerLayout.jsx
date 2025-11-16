import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ManufacturerSidebar from '../components/manufacturer/ManufacturerSidebar';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import { useModalZIndexFix } from '../hooks/useModalZIndex';

const ManufacturerLayout = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Apply global modal z-index fixes
  useModalZIndexFix();

  // Handle screen resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 768);
      if (window.innerWidth >= 1024) {
        setIsSidebarCollapsed(false);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = () => {
    if (isMobileView) {
      setIsSidebarOpen(!isSidebarOpen);
    } else {
      setIsSidebarCollapsed(!isSidebarCollapsed);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      {/* Navbar */}
      <Navbar />

      {/* Content Section */}
      <div className="flex flex-1">
        {/* Mobile Overlay */}
        <AnimatePresence>
          {isMobileView && isSidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-20 bg-black"
              onClick={() => setIsSidebarOpen(false)}
            />
          )}
        </AnimatePresence>

        {/* Sidebar */}
        <AnimatePresence>
          {(!isMobileView || isSidebarOpen) && (
            <motion.aside
              initial={isMobileView ? { x: -320 } : false}
              animate={{ x: 0 }}
              exit={isMobileView ? { x: -320 } : false}
              transition={{ type: "spring", bounce: 0.1 }}
              className={`fixed md:sticky top-20 z-30 md:z-0 h-[calc(100vh-5rem)] overflow-auto bg-white ${
                isMobileView ? 'w-[280px]' : 'w-auto'
              }`}
            >
              <ManufacturerSidebar
                isCollapsed={isSidebarCollapsed}
                onToggle={toggleSidebar}
              />
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <main className={`flex-1 p-4 mt-20 md:p-6 min-h-screen transition-all duration-300 ${
          !isMobileView && !isSidebarCollapsed ? 'md:ml-0' : 'md:ml-0'
        }`}>
          {/* Mobile Menu Button */}
          <div className="fixed z-10 top-24 left-4 md:hidden">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 bg-white border border-gray-200 rounded-lg shadow-lg hover:bg-gray-50"
            >
              <Menu className="w-6 h-6 text-gray-600" />
            </button>
          </div>

          {/* Page Content */}
          <Outlet />
        </main>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default ManufacturerLayout;