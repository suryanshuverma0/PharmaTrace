// components/ConnectWallet.jsx
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const ConnectWallet = () => {
  const navigate = useNavigate();
  const { connectWallet, registerUserWithRole, login, user, isLoading } = useAuth();
  const [showRegistration, setShowRegistration] = useState(false);
  const [name, setName] = useState('');
  const [role, setRole] = useState('manufacturer'); 

  const handleConnect = async () => {
    const { success, account } = await connectWallet();

    if (success) {
      if (user?.isRegistered) {
        const loginResult = await login();
        if (loginResult.success) {
          redirectUser(loginResult.role);
        } else {
          alert(loginResult.error);
        }
      } else {
        setShowRegistration(true); 
      }
    } else {
      alert("Failed to connect wallet.");
    }
  };

  const handleRegister = async () => {
    if (!name || !role) return alert("Please fill all fields");

    const result = await registerUserWithRole({ name, role });

    if (result.success) {
      const loginResult = await login();
      if (loginResult.success) {
        redirectUser(loginResult.role);
      } else {
        alert(loginResult.error);
      }
    } else {
      alert(result.error);
    }
  };

  const redirectUser = (role) => {

    console.log(role)
    if (role === 'manufacturer') {
      navigate('/manufacturer');
    } else if (role === 'distributor') {
      navigate('/distributor');
    } else {
      navigate('/');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center">
      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <>
          {!showRegistration ? (
            <button
              onClick={handleConnect}
              className="px-6 py-2 text-white bg-indigo-600 rounded hover:bg-indigo-700"
            >
              Connect Wallet
            </button>
          ) : (
            <div className="mt-6 p-4 bg-gray-800 rounded-lg text-white w-[300px]">
              <h3 className="mb-2 text-lg font-bold">Register</h3>
              <input
                type="text"
                placeholder="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 mb-3 text-black rounded"
              />
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-3 py-2 mb-3 text-black rounded"
              >
                <option value="manufacturer">Manufacturer</option>
                <option value="distributor">Distributor</option>
              </select>
              <button
                onClick={handleRegister}
                className="w-full px-4 py-2 mt-2 bg-green-600 rounded hover:bg-green-700"
              >
                Register & Login
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ConnectWallet;
