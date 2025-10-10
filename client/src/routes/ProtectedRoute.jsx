import React, { useEffect, useRef } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { useWalletModal } from "../context/WalletModalContext";

const ProtectedRoute = ({ allowedRoles }) => {
  const { isAuthenticated, user, isLoading, checkAccountLoading } = useAuth();
  const { openConnectModal, isConnectModalOpen } = useWalletModal();

  const hasTriggered = useRef(false);
  const wasAuthenticated = useRef(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Track if user was previously authenticated
    if (isAuthenticated && user) {
      wasAuthenticated.current = true;
    }
    
    // Don't do anything while still loading
    if (isLoading || checkAccountLoading || hasTriggered.current) return;

    const token = localStorage.getItem("token");
    
    // Case 1: No token at all
    if (!token) {
      hasTriggered.current = true;
      
      // If user was previously authenticated, they likely disconnected intentionally
      // Don't show error toast in that case
      if (!wasAuthenticated.current) {
        toast.error("You need to connect your wallet to access this page.");
      }
      
      navigate("/");
      return;
    }

    // Case 2: Have token but not authenticated yet - wait for auth process
    if (token && !isAuthenticated) {
      // Don't navigate, just wait for authentication to complete
      return;
    }

    // Case 3: Authenticated but no user data yet - wait for user data
    if (isAuthenticated && !user) {
      // Don't navigate, wait for user data to load
      return;
    }

    // Case 4: Authenticated with user but wrong role
    if (isAuthenticated && user && !allowedRoles.includes(user.role)) {
      hasTriggered.current = true;
      toast.error("You do not have permission to access this page.");
      navigate("/");
      return;
    }
  }, [isAuthenticated, isLoading, checkAccountLoading, user, allowedRoles, navigate]);

  // Show loading while authentication is being restored
  if (isLoading || checkAccountLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Check if we have a token but authentication hasn't completed
  const token = localStorage.getItem("token");
  if (token && !isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // No token - will be handled by useEffect
  if (!token || !isAuthenticated || !user) {
    return null;
  }

  // User loaded, but role not allowed - will be handled by useEffect
  if (!allowedRoles.includes(user.role)) {
    return null;
  }

  return <Outlet />;
};

export default ProtectedRoute;
