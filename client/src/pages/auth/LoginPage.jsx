import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import  Button  from "../../components/UI/Button";
import { PharmaChainLogo } from "../LandingPage";
import toast, { Toaster } from 'react-hot-toast';
import { useAuth } from "../../context/authContext";

const LoginPage = () => {
  const { connectWallet, login, user, isLoading } = useAuth();
  const navigate = useNavigate();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { delayChildren: 0.3, staggerChildren: 0.2 },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5, ease: "easeOut" },
    },
  };

  const handleLogin = async () => {
  const result = await connectWallet();
  if (result.success) {
    if (user?.isRegistered) {
      const loginResult = await login();
      if (loginResult.success) {
        toast.success("Logged in successfully!");
        redirectUser(user.role);
      } else {
        toast.error(loginResult.error || "Login failed.");
      }
    } else {
      toast("Wallet connected, but you need to register first.");
      navigate("/connect");
    }
  } else {
    toast.error("Wallet connection failed.");
  }
};

  const redirectUser = (role) => {
    if (role === "manufacturer") {
      navigate("/manufacturer");
    } else if (role === "distributor") {
      navigate("/distributor");
    } else {
      navigate("/");
    }
  };

  return (
    <div className="flex flex-col justify-center min-h-screen py-12 bg-gray-50 sm:px-6 lg:px-8">
      <motion.div
        className="mt-10 sm:mx-auto sm:w-full sm:max-w-md"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <motion.div variants={itemVariants} className="flex justify-center">
          <PharmaChainLogo />
        </motion.div>
        <motion.h2
          variants={itemVariants}
          className="mt-6 text-3xl font-extrabold text-center text-gray-900"
        >
          Welcome Back
        </motion.h2>
        <motion.p
          variants={itemVariants}
          className="mt-2 text-sm text-center text-gray-600"
        >
          Sign in to your PharmaChain account using MetaMask
        </motion.p>
      </motion.div>

      <motion.div
        className="mt-8 sm:mx-auto sm:w-full sm:max-w-md"
        variants={containerVariants}
      >
        <motion.div
          className="px-4 py-8 bg-white rounded-lg shadow-xl sm:px-10"
          variants={itemVariants}
        >
          <Button
            type="button"
            onClick={handleLogin}
            className="w-full"
            variant="primary"
            disabled={isLoading}
          >
            {isLoading ? "Connecting..." : "Connect Wallet & Login"}
          </Button>

          <div className="mt-6">
            <p className="text-sm text-center text-gray-600">
              Don't have an account?{" "}
              <span className="font-medium text-blue-600 cursor-pointer hover:text-blue-500" onClick={() => navigate("/connect")}>
                Register now
              </span>
            </p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
