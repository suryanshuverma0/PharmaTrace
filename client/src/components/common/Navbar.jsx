import React, { useState, useEffect, useRef } from "react";
import {
  Menu,
  X,
  Wallet,
  ChevronDown,
  CheckCircle,
  Wallet2,
  WalletIcon,
  LogOut,
  User,
  Settings,
} from "lucide-react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import ConnectWalletModal from "../modals/ConnectWalletModal";
import RegisterWalletModal from "../modals/RegisterWalletModal";
import { useAuth } from "../../context/AuthContext";
import { siteConfig } from "../../constants/data";
import { useWalletModal } from "../../context/WalletModalContext";

// Custom SVG Logo Component
const PharmaChainLogo = ({ className = "w-12 h-12" }) => (
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

const ProfileDropdown = ({ user,  onDisconnect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const navigateToDashboard = () => {
    switch (user?.role) {
      case "superadmin":
        navigate("/admin");
        break;
      case "admin":
        navigate("/admin");
        break;
      case "manufacturer":
        navigate("/manufacturer/dashboard");
        break;
      case "distributor":
        navigate("/distributor/dashboard");
        break;
      case "pharmacist":
        navigate("/pharmacy/dashboard");
        break;
      case "consumer":
        navigate("/consumer/dashboard");
        break;
      default:
        navigate("/");
    }
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100 focus:outline-none shadow-lg transition-all duration-200 ${
          isOpen ? "bg-gray-100" : "bg-gray-50"
        }`}
      >
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary-100">
            <User className="w-5 h-5 text-primary-600" />
          </div>
          <span className="hidden sm:inline">{user?.name || "Profile"}</span>
        </div>
        <ChevronDown
          className={`w-4 h-4 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 z-[9998] w-full py-2 mt-2 space-y-2.5 origin-top-right bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="px-4 pb-2 text-sm text-gray-900 border-b">
            <div className="py-2 text-xs text-gray-500 ">Welcome!</div>

            <div className="font-medium">{user?.name}</div>
            <div className="text-xs text-gray-500 truncate">{user?.address}</div>
          </div>

          <button
            onClick={navigateToDashboard}
            className="flex items-center w-full gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            <User className="w-4 h-4" />
            Dashboard
          </button>


          <button
            onClick={() => {
              onDisconnect();
              setIsOpen(false);
            }}
            className="flex items-center w-full gap-2 px-4 py-2 text-sm text-red-700 hover:bg-red-50"
          >
            <LogOut className="w-4 h-4" />
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
};

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const { user, isAuthenticated, disconnectWallet } =
    useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const {
      isConnectModalOpen,
      closeConnectModal,
      isRegisterModalOpen,
      closeRegisterModal,
      openRegisterModal,
      openConnectModal,
    } = useWalletModal();



  useEffect(() => {
    // Check if we should open connect modal after account activation
    if (location.state?.openConnectModal) {
      openConnectModal(true);
      // Clear the state
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navItems = [
    // { name: "Home", link: "/" },
    // {
    //   name: "Platform",
    //   link: "#platform",
    //   dropdown: [
    //     { name: "For Manufacturers", link: "/manufacturer/dashboard" },
    //     { name: "For Distributors", link: "/distributor/dashboard" },
    //     { name: "For Pharmacies", link: "/pharmacy/dashboard" },
    //     { name: "For Patients", link: "/consumer" },
    //   ],
    // },
    // { name: "Features", link: "/feature" },
    // { name: "About", link: "/about" },
  ];

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-[9997] w-full transition-all duration-300 ${
          isScrolled
            ? "bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-100"
            : "bg-white/90 backdrop-blur-sm shadow-md"
        }`}
      >
        <div className="px-4 mx-auto max-w-8xl sm:px-6 lg:px-14">
          <div className="flex items-center justify-between h-20">
            {/* Logo and Brand Name */}
            <div
              className="flex items-center flex-shrink-0 space-x-3 cursor-pointer group"
              onClick={() => {
                window.scrollTo({ top: 0, behavior: "smooth" });
                navigate("/");
              }}
            >
              <div className="transition-transform duration-300 group-hover:scale-110">
                <PharmaChainLogo className="w-12 h-12" />
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-bold text-transparent bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text">
                  {siteConfig?.siteName}
                </span>
                <span className="-mt-1 text-xs text-gray-500">
                  Blockchain Security
                </span>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex lg:items-center lg:space-x-1">
              {navItems.map((item) => (
                <div key={item.name} className="relative group">
                  <button
                    className="flex items-center px-4 py-2 text-gray-700 transition-all duration-200 rounded-lg hover:text-blue-600 hover:bg-blue-50/50 group"
                    onMouseEnter={() =>
                      item.dropdown && setActiveDropdown(item.name)
                    }
                    onMouseLeave={() => setActiveDropdown(null)}
                    onClick={() => {
                      if (!item.dropdown) {
                        navigate(item.link); // Navigate only if no dropdown
                      }
                    }}
                  >
                    <span className="font-medium">{item.name}</span>
                    {item.dropdown && (
                      <ChevronDown
                        size={16}
                        className={`ml-1 transition-transform duration-200 ${
                          activeDropdown === item.name ? "rotate-180" : ""
                        }`}
                      />
                    )}
                  </button>

                  {/* Dropdown Menu */}
                  {item.dropdown && (
                    <div
                      className={`absolute top-full left-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 transition-all duration-300 transform ${
                        activeDropdown === item.name
                          ? "opacity-100 translate-y-0 visible"
                          : "opacity-0 -translate-y-2 invisible"
                      }`}
                      onMouseEnter={() => setActiveDropdown(item.name)}
                      onMouseLeave={() => setActiveDropdown(null)}
                    >
                      <div className="py-4">
                        {item.dropdown.map((subItem) => (
                          <Link
                            key={subItem.name}
                            to={subItem.link}
                            className="flex items-center px-4 py-3 text-gray-700 transition-all duration-200 hover:text-blue-600 hover:bg-blue-50/50"
                            onClick={() => {
                              setActiveDropdown(null); // Close dropdown on click
                            }}
                          >
                            <span className="font-medium">{subItem.name}</span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="hidden lg:flex lg:items-center lg:space-x-4">
              {isAuthenticated ? (
                <ProfileDropdown user={user} isAuthenticated={isAuthenticated} onDisconnect={disconnectWallet} />
              ) : (
                <div className="flex items-center gap-3 sm:gap-4 lg:gap-6">
                  <button
                    onClick={() => openConnectModal()}
                    className="flex items-center gap-2 px-4 py-3 text-[15px] font-medium text-white rounded-lg shadow-md bg-primary-600 hover:bg-primary-700 focus:outline-none transition-all duration-200"
                  >
                    <Wallet className="w-5 h-5" />
                    <span className="hidden sm:inline">Connect Wallet</span>
                    <span className="sm:hidden">Connect</span>
                  </button>
                  <button
                    onClick={() => openRegisterModal()}
                    className="flex items-center gap-2 px-4 py-2.5 text-[15px] font-medium border rounded-lg text-primary-600 border-primary-600 hover:bg-primary-50 focus:outline-none transition-all duration-200"
                  >
                    <span className="hidden sm:inline">Register</span>
                    <span className="sm:hidden">Sign Up</span>
                  </button>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="lg:hidden">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="inline-flex items-center justify-center p-2 text-gray-600 transition-colors duration-200 rounded-lg hover:text-blue-600 hover:bg-blue-50/50 focus:outline-none"
              >
                <div className="relative w-6 h-6">
                  <span
                    className={`absolute block w-full h-0.5 bg-current transform transition-all duration-300 ${
                      isOpen ? "rotate-45 top-3" : "top-1"
                    }`}
                  ></span>
                  <span
                    className={`absolute block w-full h-0.5 bg-current transform transition-all duration-300 top-3 ${
                      isOpen ? "opacity-0" : "opacity-100"
                    }`}
                  ></span>
                  <span
                    className={`absolute block w-full h-0.5 bg-current transform transition-all duration-300 ${
                      isOpen ? "-rotate-45 top-3" : "top-5"
                    }`}
                  ></span>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu backdrop */}
        {isOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 lg:hidden"
            onClick={() => setIsOpen(false)}
          />
        )}

        {/* Mobile menu */}
        <div
          className={`lg:hidden fixed top-0 right-0 w-80 max-w-[85vw] bg-white shadow-2xl h-screen transform transition-transform duration-300 ease-in-out ${
            isOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          {/* Mobile menu header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <PharmaChainLogo className="w-8 h-8" />
              <span className="text-lg font-semibold text-gray-900">
                {siteConfig?.siteName}
              </span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 text-gray-500 transition-colors rounded-lg hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Mobile menu content */}
          <div className="flex flex-col h-full overflow-y-auto">
            <div className="flex-1 px-6 py-2">
        
              {/* Mobile authentication section */}
              <div className="pt-2 border-t border-gray-200">
                <h3 className="mb-4 text-sm font-semibold tracking-wider text-gray-500 uppercase">
                  Account
                </h3>
                <div className="space-y-3">
                {isAuthenticated ? (
                  <div className="space-y-3">
                    {/* Mobile Profile Section */}
                    <div className="flex items-center gap-3 px-4 py-4 border border-blue-100 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50">
                      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary-100">
                        <User className="w-6 h-6 text-primary-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{user?.name || "Profile"}</p>
                        <p className="text-sm text-gray-600 capitalize">{user?.role}</p>
                      </div>
                    </div>
                    
                    {/* Mobile Dashboard Button */}
                    <button
                      className="w-full px-4 py-3 font-medium text-center text-white transition-all duration-200 shadow-lg rounded-xl bg-primary-600 hover:bg-primary-700 hover:shadow-xl"
                      onClick={() => {
                        switch (user?.role) {
                          case "manufacturer":
                            navigate("/manufacturer/dashboard");
                            break;
                          case "distributor":
                            navigate("/distributor/dashboard");
                            break;
                          case "pharmacist":
                            navigate("/pharmacy/dashboard");
                            break;
                          case "consumer":
                            navigate("/consumer/dashboard");
                            break;
                          default:
                            navigate("/");
                        }
                        setIsOpen(false);
                      }}
                    >
                      Go to Dashboard
                    </button>
                    
                    {/* Mobile Disconnect Button */}
                    <button
                      className="w-full px-4 py-3 font-medium text-center text-red-600 transition-all duration-200 border border-red-200 rounded-xl hover:bg-red-50"
                      onClick={() => {
                        disconnectWallet();
                        setIsOpen(false);
                      }}
                    >
                      <div className="flex items-center justify-center gap-2">
                        <LogOut className="w-4 h-4" />
                        <span>Disconnect Wallet</span>
                      </div>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Mobile Connect Wallet Button */}
                    <button
                      className="w-full px-4 py-3 font-semibold text-white transition-all duration-300 transform shadow-lg rounded-xl bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 hover:shadow-xl hover:scale-105"
                      onClick={() => {
                        openConnectModal();
                        setIsOpen(false);
                      }}
                    >
                      <div className="flex items-center justify-center gap-2">
                        <Wallet className="w-5 h-5" />
                        <span>Connect Wallet</span>
                      </div>
                    </button>
                    
                    {/* Mobile Register Button */}
                    <button
                      className="w-full px-4 py-3 font-medium transition-all duration-200 border rounded-xl text-primary-600 border-primary-300 hover:bg-primary-50 hover:border-primary-400"
                      onClick={() => {
                        openRegisterModal();
                        setIsOpen(false);
                      }}
                    >
                      Register
                    </button>
                  </div>
                )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>
    </>
  );
};

export default Navbar;
