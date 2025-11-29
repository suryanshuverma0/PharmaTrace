import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  PackageCheck,
  CheckCircle,
  Warehouse,
  Share,
  History,
  Settings,
  LogOut,
  User,
  Menu,
  X
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Button from '../UI/Button';

const DistributorSidebar = ({ isCollapsed, onToggle }) => {
  const location = useLocation();
  const { user, disconnectWallet } = useAuth();

  const sidebarVariants = {
    expanded: {
      width: "256px",
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30
      }
    },
    collapsed: {
      width: "80px",
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30
      }
    }
  };

  const sidebarLinks = [
    { 
      icon: <LayoutDashboard size={20} />, 
      label: 'Dashboard', 
      path: '/distributor/dashboard' 
    },
    { 
      icon: <PackageCheck size={20} />, 
      label: 'Assigned Batches', 
      path: '/distributor/assigned-batches' 
    },
    { 
      icon: <CheckCircle size={20} />, 
      label: 'Acknowledge Shipment', 
      path: '/distributor/acknowledge-shipment' 
    },
    { 
      icon: <Warehouse size={20} />, 
      label: 'Inventory', 
      path: '/distributor/inventory' 
    },
    { 
      icon: <Share size={20} />, 
      label: 'Distribute', 
      path: '/distributor/distribute' 
    },
    { 
      icon: <History size={20} />, 
      label: 'Track Transfers', 
      path: '/distributor/track-transfers' 
    },
  ];

  return (
    <motion.div 
      className="relative flex flex-col h-full bg-white border-r border-gray-200 shadow-xl"
      initial="expanded"
      animate={isCollapsed ? "collapsed" : "expanded"}
      variants={sidebarVariants}
    >
      {/* Toggle Buttons */}
      <div className="absolute -right-3 top-6">
        {/* Mobile Toggle */}
        <Button
          variant="ghost"
          onClick={onToggle}
          className="inline-flex items-center justify-center w-6 h-6 bg-white rounded-full shadow-md hover:bg-gray-50 md:hidden group"
        >
          <motion.div
            animate={{ rotate: isCollapsed ? 0 : 180 }}
            transition={{ duration: 0.2 }}
            className="group-hover:text-primary-600"
          >
            {isCollapsed ? <Menu size={14} /> : <X size={14} />}
          </motion.div>
        </Button>
        {/* Desktop Toggle */}
        <Button
          variant="ghost"
          onClick={onToggle}
          className="items-center justify-center hidden w-6 h-6 bg-white rounded-full shadow-md focus:outline-none hover:bg-gray-50 md:inline-flex group"
        >
          <motion.div
            animate={{ rotate: isCollapsed ? 0 : 180 }}
            transition={{ duration: 0.2 }}
            className="group-hover:text-primary-600"
          >
            {isCollapsed ? <Menu size={14} /> : <X size={14} />}
          </motion.div>
        </Button>
      </div>

      {/* User Profile Section */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center space-x-4">
          <div className="flex items-center justify-center flex-shrink-0 w-10 h-10 rounded-full bg-primary-100">
            <User size={20} className="text-primary-600" />
          </div>
          <AnimatePresence>
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                <h3 className="font-semibold text-gray-900">{user?.name || "Distributor"}</h3>
                <p className="text-sm text-gray-500 capitalize">{user?.role || "Distributor"}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-4">
        <div className="space-y-2">
          {sidebarLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                location.pathname === link.path
                  ? 'bg-primary-50 text-primary-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <div className="flex-shrink-0">{link.icon}</div>
              <AnimatePresence>
                {!isCollapsed && (
                  <motion.span
                    className="font-medium whitespace-nowrap"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    {link.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          ))}
        </div>
      </nav>

      {/* Bottom Section */}
      <div className="p-4 border-t border-gray-200">
        <button 
          onClick={disconnectWallet}
          className="flex items-center w-full px-4 py-3 space-x-3 text-red-600 transition-all duration-200 rounded-lg hover:bg-red-50"
        >
          <div className="flex-shrink-0">
            <LogOut size={20} />
          </div>
          <AnimatePresence>
            {!isCollapsed && (
              <motion.span
                className="font-medium"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                Logout
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
    </motion.div>
  );
};

export default DistributorSidebar;
