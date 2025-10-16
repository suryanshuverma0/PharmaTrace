import React, { useEffect, useState, useRef } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { useWalletModal } from "../context/WalletModalContext";
import { checkSuperAdmin } from "../services/api/authApi";
import MetaMaskService from "../services/blockchain/metamaskService";

const AdminProtectedRoute = () => {
  const { isAuthenticated, user, isLoading, checkAccountLoading } = useAuth();
  const { openConnectModal } = useWalletModal();
  
  const [isSuperAdminLoading, setIsSuperAdminLoading] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [superAdminCheckComplete, setSuperAdminCheckComplete] = useState(false);
  
  const hasTriggered = useRef(false);
  const wasAuthenticated = useRef(false);
  const navigate = useNavigate();

  // Check superadmin status when component mounts or user changes
  useEffect(() => {
    const checkSuperAdminStatus = async () => {
      try {
        setIsSuperAdminLoading(true);
        setSuperAdminCheckComplete(false);
        
        let addressToCheck = null;
        
        // First try to get address from authenticated user
        if (user?.address) {
          addressToCheck = user.address;
        }
        // If no user address, try to get from MetaMask
        else {
          try {
            const account = await MetaMaskService.getCurrentAccount();
            if (account) {
              addressToCheck = account;
            }
          } catch (error) {
            console.log("Could not get MetaMask account:", error.message);
          }
        }
        
        if (!addressToCheck) {
          console.log("No wallet address available for superadmin check");
          setIsSuperAdmin(false);
          setSuperAdminCheckComplete(true);
          return;
        }

        console.log("Checking superadmin status for address:", addressToCheck);
        
        const result = await checkSuperAdmin(addressToCheck);
        
        if (result.success) {
          setIsSuperAdmin(result.isSuperAdmin);
          console.log("SuperAdmin check result:", result.data);
          
          // If user is superadmin and authenticated, no need to redirect
          if (result.isSuperAdmin && isAuthenticated) {
            console.log("User is authenticated superadmin - allowing access");
          }
        } else {
          console.error("SuperAdmin check failed:", result.error);
          setIsSuperAdmin(false);
        }
        
      } catch (error) {
        console.error("Error checking superadmin status:", error);
        setIsSuperAdmin(false);
      } finally {
        setIsSuperAdminLoading(false);
        setSuperAdminCheckComplete(true);
      }
    };

    // Only check superadmin status if we're not in the middle of loading other auth states
    if (!isLoading && !checkAccountLoading) {
      checkSuperAdminStatus();
    }
  }, [user, isLoading, checkAccountLoading, isAuthenticated]);

  // Handle navigation logic
  useEffect(() => {
    // Don't do anything while still loading ANY authentication step
    if (isLoading || checkAccountLoading || isSuperAdminLoading || hasTriggered.current) {
      return;
    }

    // Don't proceed if superadmin check is not complete yet
    if (!superAdminCheckComplete) {
      return;
    }

    // Track if user was previously authenticated
    if (isAuthenticated && user) {
      wasAuthenticated.current = true;
    }

    const token = localStorage.getItem("token");
    
    // Case 1: No token at all - but only show error if all checks are complete
    if (!token) {
      hasTriggered.current = true;
      
      // Only show error if we've completed all checks and confirmed no token
      if (!wasAuthenticated.current && superAdminCheckComplete) {
        toast.error("You need to connect your wallet and login to access admin panel.");
      }
      
      navigate("/");
      return;
    }

    // Case 2: Have token but not authenticated yet - wait for auth process
    if (token && !isAuthenticated) {
      return;
    }

    // Case 3: Authenticated but no user data yet - wait for user data
    if (isAuthenticated && !user) {
      return;
    }

    // Case 4: Authenticated with user but not superadmin
    if (isAuthenticated && user && superAdminCheckComplete && !isSuperAdmin) {
      hasTriggered.current = true;
      toast.error("Access denied. You need superadmin privileges to access this page.");
      navigate("/");
      return;
    }

  }, [
    isAuthenticated, 
    isLoading, 
    checkAccountLoading, 
    isSuperAdminLoading,
    user, 
    isSuperAdmin, 
    superAdminCheckComplete,
    navigate
  ]);

  // Show loading while any authentication/verification is in progress
  if (isLoading || checkAccountLoading || isSuperAdminLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <div className="w-16 h-16 mb-4 border-b-4 border-blue-600 rounded-full animate-spin"></div>
        <div className="text-lg font-medium text-gray-600">
          {isLoading && "Loading authentication..."}
          {checkAccountLoading && "Checking account status..."}
          {isSuperAdminLoading && "Verifying admin privileges..."}
        </div>
        <div className="mt-2 text-sm text-gray-400">
          Please wait while we verify your access permissions.
        </div>
      </div>
    );
  }

  // Check if we have a token but authentication hasn't completed
  const token = localStorage.getItem("token");
  if (token && !isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <div className="w-16 h-16 mb-4 border-b-4 border-blue-600 rounded-full animate-spin"></div>
        <div className="text-lg font-medium text-gray-600">Authenticating...</div>
      </div>
    );
  }

  // No token - will be handled by useEffect
  if (!token || !isAuthenticated || !user) {
    return null;
  }

  // SuperAdmin check not complete yet - will be handled by useEffect
  if (!superAdminCheckComplete) {
    return null;
  }

  // User loaded and superadmin check complete, but not superadmin - will be handled by useEffect
  if (!isSuperAdmin) {
    return null;
  }

  // All checks passed - user is authenticated and is superadmin
  return (
    <div>
      {/* Optional: Add a subtle indicator that this is an admin area */}
      <div className="px-4 py-1 text-xs text-center text-white bg-red-600">
        🔒 Administrator Access - SuperAdmin Privileges Active
      </div>
      <Outlet />
    </div>
  );
};

export default AdminProtectedRoute;
