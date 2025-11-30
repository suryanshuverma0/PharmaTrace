import React, { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Scan, Search, CheckCircle } from "lucide-react";
import { useWalletModal } from "../context/WalletModalContext";
import { siteConfig } from "../constants/data";
import QRScannerModal from "../components/modals/QRScannerModal";

// Custom SVG Logo Component
export const PharmaChainLogo = ({ className = "w-12 h-12" }) => (
  <svg
    className={className}
    viewBox="0 0 60 60"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#3B82F6" />
        <stop offset="100%" stopColor="#1E40AF" />
      </linearGradient>
    </defs>
    <circle
      cx="30"
      cy="30"
      r="28"
      stroke="url(#logoGradient)"
      strokeWidth="2"
      fill="none"
      opacity="0.3"
    />
    <circle
      cx="30"
      cy="30"
      r="22"
      stroke="url(#logoGradient)"
      strokeWidth="1.5"
      fill="none"
      opacity="0.5"
    />
    <rect
      x="26"
      y="18"
      width="8"
      height="24"
      rx="2"
      fill="url(#logoGradient)"
    />
    <rect
      x="18"
      y="26"
      width="24"
      height="8"
      rx="2"
      fill="url(#logoGradient)"
    />
    <circle cx="15" cy="15" r="3" fill="url(#logoGradient)" opacity="0.8" />
    <circle cx="45" cy="15" r="3" fill="url(#logoGradient)" opacity="0.8" />
    <circle cx="15" cy="45" r="3" fill="url(#logoGradient)" opacity="0.8" />
    <circle cx="45" cy="45" r="3" fill="url(#logoGradient)" opacity="0.8" />
    <path
      d="M18 15 L27 24"
      stroke="url(#logoGradient)"
      strokeWidth="2"
      opacity="0.6"
    />
    <path
      d="M42 15 L33 24"
      stroke="url(#logoGradient)"
      strokeWidth="2"
      opacity="0.6"
    />
    <path
      d="M18 45 L27 36"
      stroke="url(#logoGradient)"
      strokeWidth="2"
      opacity="0.6"
    />
    <path
      d="M42 45 L33 36"
      stroke="url(#logoGradient)"
      strokeWidth="2"
      opacity="0.6"
    />
  </svg>
);

const LandingPage = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const { openConnectModal, openRegisterModal } = useWalletModal();
  const navigate = useNavigate();

  const openQRScanner = () => {
    setShowQRScanner(true);
  };

  const handleScanResult = (serialNumber, rawData) => {
    console.log("Scanned serial number:", serialNumber);
    setShowQRScanner(false);
    // Navigate to verification page with the scanned serial number
    navigate("/verify-product", { 
      state: { 
        serialNumber, 
        verificationMethod: 'qr', 
        autoVerify: true,
        fromLanding: true 
      } 
    });
  };

  const handleVerificationComplete = (verificationResult) => {
    console.log("Verification completed:", verificationResult);
    // Navigate to verification page with the verification result
    navigate("/verify-product", { 
      state: { 
        verificationResult,
        verificationMethod: 'qr',
        fromLanding: true 
      } 
    });
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { delayChildren: 0.2, staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  };

  const cardVariants = {
    hidden: { y: 50, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.6, ease: "easeOut" },
    },
    hover: {
      y: -10,
      scale: 1.02,
      transition: { duration: 0.3, ease: "easeInOut" },
    },
  };

  const features = [
    {
      icon: (
        <svg
          className="w-8 h-8"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12 2L3 7V17C3 18.1 3.9 19 5 19H19C20.1 19 21 18.1 21 17V7L12 2Z"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
          />
          <path d="M12 8V16M8 12H16" stroke="currentColor" strokeWidth="2" />
        </svg>
      ),
      title: "Immutable Drug Records",
      description:
        "Secure, tamper-proof records of drug manufacturing and distribution history using advanced blockchain technology",
    },
    {
      icon: (
        <svg
          className="w-8 h-8"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
          />
          <path
            d="M14 2V8H20M16 13H8M16 17H8M10 9H8"
            stroke="currentColor"
            strokeWidth="2"
          />
        </svg>
      ),
      title: "Smart Contracts",
      description:
        "Automated compliance and verification through intelligent blockchain smart contracts that ensure regulatory adherence",
    },
    {
      icon: (
        <svg
          className="w-8 h-8"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 19V21"
            stroke="currentColor"
            strokeWidth="2"
          />
          <circle
            cx="12"
            cy="7"
            r="4"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
          />
          <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="2" />
        </svg>
      ),
      title: "Patient Verification",
      description:
        "Advanced authentication system ensures that genuine medications reach verified patients safely and securely",
    },
  ];

  const roles = [
    {
      icon: (
        <svg
          className="w-8 h-8"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M3 21H21L18 8H6L3 21Z"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
          />
          <path
            d="M5 8V6C5 4.89543 5.42857 3.88721 6.17157 3.17157C6.91457 2.45593 7.95218 2 9 2H15C16.0478 2 17.0854 2.45593 17.8284 3.17157C18.5714 3.88721 19 4.89543 19 6V8"
            stroke="currentColor"
            strokeWidth="2"
          />
          <path d="M9 12H15M12 9V15" stroke="currentColor" strokeWidth="2" />
        </svg>
      ),
      title: "Manufacturer",
      description:
        "Register and track pharmaceutical production from raw materials to finished products",
    },
    {
      icon: (
        <svg
          className="w-8 h-8"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect
            x="1"
            y="3"
            width="15"
            height="13"
            rx="2"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
          />
          <path
            d="M16 8H20L23 11V16H19M16 16H19"
            stroke="currentColor"
            strokeWidth="2"
          />
          <circle
            cx="5.5"
            cy="18.5"
            r="2.5"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
          />
          <circle
            cx="18.5"
            cy="18.5"
            r="2.5"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
          />
        </svg>
      ),
      title: "Distributor",
      description:
        "Manage drug distribution and logistics with complete supply chain visibility",
    },
    {
      icon: (
        <svg
          className="w-8 h-8"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M3 21H21L18 8H6L3 21Z"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
          />
          <path
            d="M7 8V6C7 4.89543 7.42857 3.88721 8.17157 3.17157C8.91457 2.45593 9.95218 2 11 2H13C14.0478 2 15.0854 2.45593 15.8284 3.17157C16.5714 3.88721 17 4.89543 17 6V8"
            stroke="currentColor"
            strokeWidth="2"
          />
          <rect
            x="9"
            y="12"
            width="6"
            height="4"
            rx="1"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
          />
        </svg>
      ),
      title: "Pharmacy",
      description:
        "Verify authenticity and dispense medications with confidence and regulatory compliance",
    },
    {
      icon: (
        <svg
          className="w-8 h-8"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
          />
          <circle
            cx="12"
            cy="10"
            r="3"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
          />
          <path
            d="M7 20.662V19C7 17.9391 7.42143 16.9217 8.17157 16.1716C8.92172 15.4214 9.93913 15 11 15H13C14.0609 15 15.0783 15.4214 15.8284 16.1716C16.5786 16.9217 17 17.9391 17 19V20.662"
            stroke="currentColor"
            strokeWidth="2"
          />
        </svg>
      ),
      title: "Patient",
      description:
        "Access verified medication information and ensure authenticity of prescribed drugs",
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Banner Section */}
      <section className="overflow-hidden ">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-blue-700 to-blue-500">
          <div className="absolute inset-0 bg-black opacity-20"></div>
        </div>

        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 mx-auto max-w-7xl lg:px-8">
          <motion.div
            className="text-center"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
          >
            <motion.div
              className="flex justify-center mb-8"
              variants={itemVariants}
            >
              <PharmaChainLogo className="w-20 h-20 text-white" />
            </motion.div>
            <motion.h1
              className="text-2xl font-bold tracking-tight text-white sm:text-4xl lg:text-[65px]"
              variants={itemVariants}
            >
              {siteConfig?.siteName}
            </motion.h1>
            <motion.p
              className="max-w-2xl mx-auto mt-6 text-xl leading-8 text-blue-100 sm:text-2xl"
              variants={itemVariants}
            >
              Revolutionizing pharmaceutical supply chain transparency and
              security through blockchain innovation
            </motion.p>
            <motion.div
              className="flex items-center justify-center mt-10 gap-x-6"
              variants={itemVariants}
            >
              <motion.button
                className="inline-flex items-center px-6 py-4 text-lg font-semibold text-blue-600 transition-all duration-300 bg-white rounded-full shadow-xl hover:bg-blue-50 hover:shadow-2xl"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={openQRScanner}
              >
                <Scan className="w-5 h-5 mr-2" />
                Quick Verify
              </motion.button>
            </motion.div>
          </motion.div>
        </div>
      </section>
      
      {/* Quick Verification Section */}
      <QuickVerificationSection />

      {/* Roles Section */}
      <section className="py-24 bg-gray-50">
        <div className="px-6 mx-auto max-w-7xl lg:px-8">
          <motion.div
            className="text-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={containerVariants}
          >
            <motion.h2
              className="text-4xl font-bold tracking-tight text-gray-800 sm:text-[45px]"
              variants={itemVariants}
            >
              Platform Roles
            </motion.h2>
            <motion.p
              className="max-w-2xl mx-auto mt-6 text-lg text-gray-600"
              variants={itemVariants}
            >
              Each stakeholder in the pharmaceutical supply chain has a unique
              role to play in ensuring medication safety and authenticity.
            </motion.p>
          </motion.div>
          <motion.div
            className="grid grid-cols-1 gap-8 mt-16 sm:grid-cols-2 lg:grid-cols-4"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            variants={containerVariants}
          >
            {roles.map((role, index) => (
              <motion.div
                key={index}
                className="relative p-8 transition-all duration-300 bg-white border border-gray-100 shadow-lg rounded-2xl hover:shadow-2xl group"
                variants={cardVariants}
                whileHover="hover"
              >
                <div className="flex items-center justify-center w-16 h-16 mx-auto mb-6 text-blue-600 transition-colors duration-300 bg-blue-50 rounded-xl group-hover:bg-blue-600 group-hover:text-white">
                  {role.icon}
                </div>
                <h3 className="mb-4 text-xl font-semibold text-center text-gray-900">
                  {role.title}
                </h3>
                <p className="leading-relaxed text-center text-gray-600">
                  {role.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Connect Wallet Section */}
      <ConnectWalletCTASection />

      {/* QR Scanner Modal */}
      <QRScannerModal
        isOpen={showQRScanner}
        onClose={() => setShowQRScanner(false)}
        onVerificationComplete={handleVerificationComplete}
        title="Scan Medication QR Code"
        description="Position the QR code from your medication package within the frame"
      />
    </div>
  );
};

export const QuickVerificationSection = () => {
  const navigate = useNavigate();
  const [showQRScanner, setShowQRScanner] = useState(false);

  const handleVerificationComplete = (verificationResult) => {
    console.log("Verification completed:", verificationResult);
    // Navigate to verification page with the verification result
    navigate("/verify-product", { 
      state: { 
        verificationResult,
        verificationMethod: 'qr',
        fromLanding: true 
      } 
    });
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { delayChildren: 0.2, staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  };

  return (
    <>
      <section className="py-24 bg-gray-50">
        <div className="px-6 mx-auto max-w-7xl lg:px-8">
          <motion.div
            className="text-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={containerVariants}
          >
            <motion.h2
              className="text-4xl font-bold tracking-tight text-gray-800 sm:text-[45px]"
              variants={itemVariants}
            >
              Quick Verification
            </motion.h2>
            <motion.p
              className="max-w-2xl mx-auto mt-6 text-lg text-gray-600"
              variants={itemVariants}
            >
              Instantly verify your medication's authenticity and safety with
              our advanced scanning technology.
            </motion.p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 gap-8 mt-16 sm:grid-cols-2 lg:grid-cols-3"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            variants={containerVariants}
          >
            {/* QR Scanner Card */}
            <motion.div
              className="relative p-8 py-10 transition-all duration-300 bg-white border border-gray-100 shadow-lg cursor-pointer rounded-2xl hover:shadow-2xl group"
              variants={itemVariants}
              whileHover={{ y: -10, scale: 1.02 }}
              onClick={() => setShowQRScanner(true)}
            >
              <div className="flex items-center justify-center w-16 h-16 mx-auto mb-6 text-blue-600 transition-colors duration-300 bg-blue-50 rounded-xl group-hover:bg-blue-600 group-hover:text-white">
                <Scan className="w-8 h-8" />
              </div>
              <h3 className="mb-4 text-[22px] font-semibold text-center text-gray-800">
                Scan QR Code
              </h3>
              <p className="leading-relaxed text-center text-gray-600">
                Use your device's camera to scan the QR code on your medication
                package for instant verification.
              </p>
              <div className="flex items-center justify-center mt-6">
                <span className="px-4 py-2 text-sm font-medium text-blue-600 transition-colors duration-300 rounded-full bg-blue-50 group-hover:bg-blue-100">
                  Quick & Easy
                </span>
              </div>
            </motion.div>

            {/* Manual Entry Card */}
            <motion.div
              className="relative p-8 py-10 transition-all duration-300 bg-white border border-gray-100 shadow-lg cursor-pointer rounded-2xl hover:shadow-2xl group"
              variants={itemVariants}
              whileHover={{ y: -10, scale: 1.02 }}
              onClick={() => navigate("/verify-product")}
            >
              <div className="flex items-center justify-center w-16 h-16 mx-auto mb-6 text-green-600 transition-colors duration-300 bg-green-50 rounded-xl group-hover:bg-green-600 group-hover:text-white">
                <Search className="w-8 h-8" />
              </div>
              <h3 className="mb-4 text-[22px] font-semibold text-center text-gray-800">
                Manual Entry
              </h3>
              <p className="leading-relaxed text-center text-gray-600">
                Enter the serial number manually to verify your medication's
                authenticity and track its journey.
              </p>
              <div className="flex items-center justify-center mt-6">
                <span className="px-4 py-2 text-sm font-medium text-green-600 transition-colors duration-300 rounded-full bg-green-50 group-hover:bg-green-100">
                  Alternative Method
                </span>
              </div>
            </motion.div>

            {/* Learn More Card */}
            <motion.div
              className="relative p-8 py-10 transition-all duration-300 bg-white border border-gray-100 shadow-lg cursor-pointer rounded-2xl hover:shadow-2xl group sm:col-span-2 lg:col-span-1"
              variants={itemVariants}
              whileHover={{ y: -10, scale: 1.02 }}
              onClick={() => navigate("/about")}
            >
              <div className="flex items-center justify-center w-16 h-16 mx-auto mb-6 text-purple-600 transition-colors duration-300 bg-purple-50 rounded-xl group-hover:bg-purple-600 group-hover:text-white">
                <CheckCircle className="w-8 h-8" />
              </div>
              <h3 className="mb-4 text-[22px] font-semibold text-center text-gray-800">
                How It Works
              </h3>
              <p className="leading-relaxed text-center text-gray-600">
                Learn about our blockchain-powered verification system and how
                it protects patients from counterfeit drugs.
              </p>
              <div className="flex items-center justify-center mt-6">
                <span className="px-4 py-2 text-sm font-medium text-purple-600 transition-colors duration-300 rounded-full bg-purple-50 group-hover:bg-purple-100">
                  Learn More
                </span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* QR Scanner Modal */}
      <QRScannerModal
        isOpen={showQRScanner}
        onClose={() => setShowQRScanner(false)}
        onVerificationComplete={handleVerificationComplete}
        title="Scan Medication QR Code"
        description="Position the QR code from your medication package within the frame"
      />

    </>
  );
};

export const ConnectWalletCTASection = () => {
  const { openConnectModal } = useWalletModal();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { delayChildren: 0.2, staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  };

  return (
    <section className="relative py-24 overflow-hidden bg-gradient-to-r from-blue-600 to-blue-800">
      <div className="absolute inset-0">
        <div className="absolute top-0 right-0 transform translate-x-32 -translate-y-32 bg-white rounded-full w-96 h-96 opacity-5"></div>
        <div className="absolute bottom-0 left-0 transform -translate-x-32 translate-y-32 bg-white rounded-full w-80 h-80 opacity-5"></div>
      </div>
      <div className="relative px-6 mx-auto max-w-7xl lg:px-8">
        <motion.div
          className="text-center"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={containerVariants}
        >
          <motion.div
            className="flex items-center justify-center w-24 h-24 mx-auto mb-8 text-white bg-white rounded-full bg-opacity-10"
            variants={itemVariants}
          >
            <svg
              className="w-12 h-12"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M21 16V8C20.9996 7.64928 20.9071 7.30481 20.7315 7.00116C20.556 6.69751 20.3037 6.44536 20 6.27L13 2.27C12.696 2.09446 12.3511 2.00205 12 2.00205C11.6489 2.00205 11.304 2.09446 11 2.27L4 6.27C3.69626 6.44536 3.44398 6.69751 3.26846 7.00116C3.09293 7.30481 3.00036 7.64928 3 8V16C3.00036 16.3507 3.09293 16.6952 3.26846 16.9988C3.44398 17.3025 3.69626 17.5546 4 17.73L11 21.73C11.304 21.9055 11.6489 21.9979 12 21.9979C12.3511 21.9979 12.696 21.9055 13 21.73L20 17.73C20.3037 17.5546 20.556 17.3025 20.7315 16.9988C20.9071 16.6952 20.9996 16.3507 21 16Z"
                stroke="currentColor"
                strokeWidth="2"
                fill="none"
              />
              <path
                d="M7.5 4.21L12 6.81L16.5 4.21M12 22.08V12M12 6.81L3.27 2.04M12 6.81L20.73 2.04"
                stroke="currentColor"
                strokeWidth="2"
              />
            </svg>
          </motion.div>
          <motion.h2
            className="text-4xl font-bold tracking-tight text-white sm:text-[46px]"
            variants={itemVariants}
          >
            Connect Your Wallet
          </motion.h2>
          <motion.p
            className="max-w-2xl mx-auto mt-6 text-lg text-blue-100"
            variants={itemVariants}
          >
            Connect your MetaMask wallet to start using PharmaTrace and join the
            future of pharmaceutical supply chain transparency.
          </motion.p>
          <motion.div className="mt-10" variants={itemVariants}>
            <motion.button
              className="inline-flex items-center px-5 py-3 text-lg font-semibold text-blue-600 transition-all duration-300 bg-white rounded-full shadow-xl hover:bg-blue-50 hover:shadow-2xl"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={openConnectModal}
            >
              <svg
                className="w-6 h-6 mr-3"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M21 16V8C20.9996 7.64928 20.9071 7.30481 20.7315 7.00116C20.556 6.69751 20.3037 6.44536 20 6.27L13 2.27C12.696 2.09446 12.3511 2.00205 12 2.00205C11.6489 2.00205 11.304 2.09446 11 2.27L4 6.27C3.69626 6.44536 3.44398 6.69751 3.26846 7.00116C3.09293 7.30481 3.00036 7.64928 3 8V16C3.00036 16.3507 3.09293 16.6952 3.26846 16.9988C3.44398 17.3025 3.69626 17.5546 4 17.73L11 21.73C11.304 21.9055 11.6489 21.9979 12 21.9979C12.3511 21.9979 12.696 21.9055 13 21.73L20 17.73C20.3037 17.5546 20.556 17.3025 20.7315 16.9988C20.9071 16.6952 20.9996 16.3507 21 16Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="none"
                />
              </svg>
              Connect Wallet
            </motion.button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default LandingPage;
