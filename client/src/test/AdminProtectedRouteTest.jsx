// Test script for AdminProtectedRoute functionality
// This script can be used to test the admin route protection

import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import { WalletModalProvider } from '../context/WalletModalContext';
import AdminProtectedRoute from '../routes/AdminProtectedRoute';
import AdminDashboard from '../pages/AdminDashboard';

// Mock component to test AdminProtectedRoute
const AdminProtectedRouteTest = () => {
  return (
    <BrowserRouter>
      <WalletModalProvider>
        <AuthProvider>
          <div className="min-h-screen bg-gray-50">
            <h1 className="py-4 text-2xl font-bold text-center">
              AdminProtectedRoute Test Environment
            </h1>
            
            {/* Test different scenarios */}
            <div className="max-w-4xl p-6 mx-auto">
              <div className="p-6 mb-6 bg-white rounded-lg shadow">
                <h2 className="mb-4 text-xl font-semibold">Test Scenarios:</h2>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center space-x-2">
                    <span className="w-4 h-4 bg-green-500 rounded"></span>
                    <span>✅ Valid SuperAdmin Wallet Connected & Authenticated</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="w-4 h-4 bg-red-500 rounded"></span>
                    <span>❌ Non-SuperAdmin Wallet Connected</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="w-4 h-4 bg-yellow-500 rounded"></span>
                    <span>⚠️ No Wallet Connected</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="w-4 h-4 bg-blue-500 rounded"></span>
                    <span>🔄 Loading/Authentication in Progress</span>
                  </div>
                </div>
              </div>

              {/* Test the actual AdminProtectedRoute */}
              <div className="bg-white rounded-lg shadow">
                <AdminProtectedRoute>
                  <AdminDashboard />
                </AdminProtectedRoute>
              </div>
            </div>
          </div>
        </AuthProvider>
      </WalletModalProvider>
    </BrowserRouter>
  );
};

export default AdminProtectedRouteTest;