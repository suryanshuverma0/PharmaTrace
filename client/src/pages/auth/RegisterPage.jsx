// src/pages/RegisterPage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const RegisterPage = () => {
  const { connectWallet, registerUserWithRole, isLoading, user } = useAuth();
  const navigate = useNavigate();

  const [role, setRole] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleRegister = async () => {
    setError('');

    // If wallet not connected, connect first
    if (!user?.address) {
      const connectResult = await connectWallet();
      if (!connectResult.success) {
        setError(connectResult.error || 'Failed to connect wallet');
        return;
      }
    }

    if (!role || !name) {
      setError('Please enter your name and role');
      return;
    }

    // Call register with user data
    const result = await registerUserWithRole({ role, name });
    if (result.success) {
      alert('Registration successful! Please login now.');
      navigate('/login'); // Redirect to login page after register
    } else {
      setError(result.error || 'Registration failed');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50">
      <div className="w-full max-w-md p-6 bg-white rounded shadow">
        <h1 className="mb-4 text-xl font-bold">Register Wallet</h1>
        {error && <div className="mb-4 text-red-600">{error}</div>}

        <label className="block mb-2">
          <span className="text-gray-700">Name</span>
          <input
            type="text"
            className="block w-full p-2 mt-1 border rounded"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your full name"
          />
        </label>

        <label className="block mb-4">
          <span className="text-gray-700">Role</span>
          <select
            className="block w-full p-2 mt-1 border rounded"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            <option value="">Select your role</option>
            <option value="manufacturer">Manufacturer</option>
            <option value="distributor">Distributor</option>
            <option value="pharmacy">Pharmacy</option>
            <option value="consumer">Consumer</option>
          </select>
        </label>

        <button
          onClick={handleRegister}
          disabled={isLoading}
          className="w-full py-2 text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? 'Processing...' : 'Connect Wallet & Register'}
        </button>
      </div>
    </div>
  );
};

export default RegisterPage;
