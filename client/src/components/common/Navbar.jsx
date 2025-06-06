import React, { useState, useEffect } from "react";
import {
  Menu,
  X,
  Wallet,
  ChevronDown,
  CheckCircle,
  Wallet2,
  WalletIcon,
} from "lucide-react";
import { useNavigate, Link } from "react-router-dom"; // Import Link
import useWalletConnect from "../../hooks/useWalletConnect";

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

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const navigate = useNavigate();
  const {
    account,
    connectWallet,
    disconnectWallet,
    error,
    isLoading,
    isConnected,
  } = useWalletConnect();

  const handleConnectWallet = async () => {
    try {
      const connectedAccount = await connectWallet();
      if (connectedAccount) {
        navigate("/consumer");
      } else if (error) {
        // You might want to show this error in a toast notification or alert
        console.error(error);
      }
    } catch (err) {
      console.error("Failed to connect wallet:", err);
    }
  };

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navItems = [
    { name: "Home", link: "/" },
    {
      name: "Platform",
      link: "#platform",
      dropdown: [
        { name: "For Manufacturers", link: "/manufacturers" },
        { name: "For Distributors", link: "/distributors" },
        { name: "For Pharmacies", link: "/pharmacies" },
        { name: "For Patients", link: "/patients" },
      ],
    },
    { name: "Features", link: "/feature" },
    { name: "About", link: "/about" },
  ];

  return (
    <nav
      className={`fixed z-50 w-full transition-all duration-300 ${
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
                PharmaChain
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
                    className={`absolute top-full left-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 transition-all duration-300 transform ${
                      activeDropdown === item.name
                        ? "opacity-100 translate-y-0 visible"
                        : "opacity-0 -translate-y-2 invisible"
                    }`}
                    onMouseEnter={() => setActiveDropdown(item.name)}
                    onMouseLeave={() => setActiveDropdown(null)}
                  >
                    <div className="py-2">
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

          {/* Desktop Connect Wallet Button */}
          <div className="hidden lg:flex lg:items-center lg:space-x-4">
            <button
              className="px-4 py-2 font-medium text-gray-700 transition-all duration-200 rounded-lg hover:text-blue-600 hover:bg-blue-50/50"
              onClick={() => navigate("/login")}
            >
              Sign In
            </button>

            <button
              className={`relative px-4 py-2.5 overflow-hidden font-semibold transition-all duration-300 transform rounded-full shadow-lg group ${
                isConnected
                  ? "bg-gray-800 hover:bg-gray-700"
                  : "bg-gradient-to-r from-gray-800 to-gray-700 hover:from-gray-700 hover:to-gray-800"
              } text-white hover:shadow-xl hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed`}
              onClick={isConnected ? disconnectWallet : handleConnectWallet}
              disabled={isLoading}
            >
              <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
              <div className="relative flex items-center">
                {isLoading ? (
                  <>
                    <svg
                      className="w-5 h-5 mr-2 animate-spin"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    <span>Connecting...</span>
                  </>
                ) : (
                  <>
                    {isConnected ? (
                      <>
                        <CheckCircle
                          className="mr-2 text-green-500"
                          size={20}
                        />
                        <span>Disconnect Wallet</span>
                      </>
                    ) : (
                      <>
                        <WalletIcon className="mr-2" size={20} />
                        <span>Connect Wallet</span>
                      </>
                    )}
                  </>
                )}
              </div>
            </button>
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

      {/* Mobile menu */}
      <div
        className={`lg:hidden transition-all duration-300 ${
          isOpen
            ? "max-h-screen opacity-100"
            : "max-h-0 opacity-0 overflow-hidden"
        }`}
      >
        <div className="border-t border-gray-100 bg-white/95 backdrop-blur-md">
          <div className="px-4 py-6 space-y-2">
            {navItems.map((item) => (
              <div key={item.name}>
                <Link
                  to={item.link}
                  className="flex items-center justify-between px-4 py-3 font-medium text-gray-700 transition-all duration-200 rounded-lg hover:text-blue-600 hover:bg-blue-50/50"
                  onClick={() => setIsOpen(false)}
                >
                  <span>{item.name}</span>
                  {item.dropdown && <ChevronDown size={16} />}
                </Link>
                {item.dropdown && (
                  <div className="mt-2 ml-4 space-y-1">
                    {item.dropdown.map((subItem) => (
                      <Link
                        key={subItem.name}
                        to={subItem.link}
                        className="block px-4 py-2 text-sm text-gray-600 transition-all duration-200 rounded-lg hover:text-blue-600 hover:bg-blue-50/50"
                        onClick={() => setIsOpen(false)}
                      >
                        {subItem.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Mobile buttons */}
            <div className="pt-4 space-y-3 border-t border-gray-200">
              <button
                className="w-full px-4 py-3 font-medium text-center text-gray-700 transition-all duration-200 rounded-lg hover:text-blue-600 hover:bg-blue-50/50"
                onClick={() => {
                  navigate("/login");
                  setIsOpen(false);
                }}
              >
                Sign In
              </button>
              <button
                className="w-full px-6 py-3 font-semibold text-white transition-all duration-300 transform rounded-full shadow-lg bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 hover:shadow-xl hover:scale-105"
                onClick={() => {
                  navigate("/connect-wallet");
                  setIsOpen(false);
                }}
              >
                <div className="flex items-center justify-center">
                  <Wallet size={20} className="mr-2" />
                  <span>Connect Wallet</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
