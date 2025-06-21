import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaLock } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/authContext';

const UnauthorizedPage = () => {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  // Determine the attempted path
  const attemptedPath = location.state?.from || 'restricted page';

  // Role-specific dashboard paths
  const roleDashboards = {
    consumer: '/consumer/dashboard',
    manufacturer: '/manufacturer/dashboard',
    distributor: '/distributor/dashboard',
    pharmacist: '/pharmacist/dashboard',
  };

  // Handle navigation click
  const handleNavigation = (path, message) => {
    toast.success(message, { id: 'nav-toast' });
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-6 mx-4 text-center bg-white rounded-lg shadow-xl sm:p-8">
        <FaLock className="w-16 h-16 mx-auto mb-4 text-red-500" aria-hidden="true" />
        <h1 className="mb-4 text-2xl font-bold text-gray-800 sm:text-3xl">Access Denied</h1>
        <p className="mb-6 text-gray-600">
          {isAuthenticated
            ? `Sorry, your account (${user?.role || 'unknown'}) does not have permission to access ${attemptedPath}.`
            : 'You need to login to access this page.'}
        </p>
        <div className="flex flex-col justify-center gap-4 sm:flex-row">
          {isAuthenticated && user?.role && roleDashboards[user.role] ? (
            <Link
              to={roleDashboards[user.role]}
              onClick={() =>
                handleNavigation(
                  roleDashboards[user.role],
                  `Redirecting to your ${user.role} dashboard`
                )
              }
              className="px-4 py-2 text-white transition duration-200 rounded-lg bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
              aria-label={`Go to ${user.role} dashboard`}
            >
              Go to {user.role.charAt(0).toUpperCase() + user.role.slice(1)} Dashboard
            </Link>
          ) : (
            <Link
              to="/login"
              onClick={() => handleNavigation('/login', 'Redirecting to login page')}
              className="px-4 py-2 text-white transition duration-200 rounded-lg bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
              aria-label="Go to login page"
            >
              Login
            </Link>
          )}
          <Link
            to="/"
            onClick={() => handleNavigation('/', 'Returning to homepage')}
            className="px-4 py-2 text-gray-800 transition duration-200 bg-gray-200 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400"
            aria-label="Go to homepage"
          >
            Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default UnauthorizedPage;
