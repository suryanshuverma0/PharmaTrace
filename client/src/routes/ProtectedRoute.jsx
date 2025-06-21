import React, { useEffect, useRef } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/authContext';
import { useWalletModal } from '../context/WalletModalContext';

const ProtectedRoute = ({ allowedRoles }) => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const {
    openConnectModal,
    isConnectModalOpen,
  } = useWalletModal();

  const hasTriggered = useRef(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Avoid running if loading or already handled
    if (isLoading || hasTriggered.current) return;

    // Case 1: Not authenticated
    if (!isAuthenticated) {
      hasTriggered.current = true;
      openConnectModal();
      return;
    }

    // Case 2: Authenticated but user data not yet available
    if (!user) return;

    // Case 3: Authenticated but not authorized
    if (!allowedRoles.includes(user.role)) {
      hasTriggered.current = true;
      toast.error('You do not have permission to access this page.');
      openConnectModal();
    }

  }, [isAuthenticated, isLoading, user, allowedRoles, openConnectModal]);

  // Delay rendering until user is fully loaded
  if (isLoading || !isAuthenticated || !user) {
    return null; // Or a loader/spinner
  }

  // User loaded, but role not allowed
  if (!allowedRoles.includes(user.role)) {
    return null;
  }

  return <Outlet />;
};

export default ProtectedRoute;
