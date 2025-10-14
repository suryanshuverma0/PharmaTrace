// import { useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { toast } from "react-hot-toast";
// import { connectWallet, isAdminWallet } from "../utils/metamaskAuth";
// import { FaLock, FaEthereum } from "react-icons/fa";
// import { ClipLoader } from "react-spinners"; // optional spinner library

// const AdminRoute = ({ children }) => {
//   const [loading, setLoading] = useState(false);
//   const [authorized, setAuthorized] = useState(false);
//   const [error, setError] = useState("");
//   const navigate = useNavigate();

//   const handleConnect = async () => {
//     setLoading(true);
//     setError("");
//     try {
//       const address = await connectWallet(); // MetaMask popup
//       if (isAdminWallet(address)) {
//         setAuthorized(true);
//         toast.success("Wallet connected successfully!"); // success toast
//       } else {
//         setAuthorized(false);
//         setError("This wallet is not authorized as admin.");
//         toast.error("Unauthorized wallet!"); // error toast
//       }
//     } catch (err) {
//       console.error(err);
//       setError(err.message || "Failed to connect MetaMask.");
//       toast.error("MetaMask connection failed!");
//       setAuthorized(false);
//     } finally {
//       setLoading(false);
//     }
//   };

//   if (authorized) return children;

//   return (
//     <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-r from-gray-100 to-gray-200 p-4">
//       <div className="bg-white shadow-lg rounded-xl p-8 w-full max-w-md text-center">
//         <FaEthereum className="w-16 h-16 mx-auto mb-4 text-blue-600 animate-bounce" />
//         <h1 className="text-2xl font-bold mb-2 text-gray-800">Admin Access Required</h1>
//         <p className="mb-6 text-gray-600">
//           Connect your admin wallet in MetaMask to continue to the dashboard.
//         </p>

//         {error && <p className="mb-4 text-red-600 font-medium">{error}</p>}

//         <button
//           onClick={handleConnect}
//           disabled={loading}
//           className="flex items-center justify-center gap-2 px-6 py-3 w-full text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-all duration-200"
//         >
//           {loading ? <ClipLoader size={20} color="#fff" /> : <FaLock />}
//           {loading ? "Connecting..." : "Connect MetaMask"}
//         </button>

//         <button
//           onClick={() => {
//             toast("Returning to homepage...", { icon: "🏠" });
//             navigate("/");
//           }}
//           className="mt-4 px-6 py-2 w-full bg-gray-200 hover:bg-gray-300 rounded-lg text-gray-800 transition-all duration-200"
//         >
//           Go Back to Homepage
//         </button>
//       </div>
//     </div>
//   );
// };

// export default AdminRoute;



import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { connectWallet, isAdminWallet } from "../utils/metamaskAuth";
import { FaLock, FaEthereum } from "react-icons/fa";
import { ClipLoader } from "react-spinners";

const AdminRoute = ({ children }) => {
  const [loading, setLoading] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleConnect = async () => {
    if (loading) return; // prevent multiple clicks

    setLoading(true);
    setError("");

    try {
      const address = await connectWallet();

      if (!address) {
        throw new Error("No wallet address detected. Please try again.");
      }

      if (isAdminWallet(address)) {
        setAuthorized(true);
        toast.success("✅ Wallet connected successfully!");
      } else {
        setAuthorized(false);
        setError("This wallet is not authorized as admin.");
        toast.error("❌ Unauthorized wallet!");
      }
    } catch (err) {
      console.error("MetaMask Connection Error:", err);

      // 🌐 Extract useful info
      const code = err.code || err?.error?.code;
      const message = err.message || err?.error?.message || "Unknown MetaMask error";

      // 🧠 Unified error handling
      if (code === -32002) {
        // Request already pending
        toast.error("MetaMask request already pending. Please open MetaMask and complete it.");
        setError("MetaMask request already pending. Check MetaMask popup.");
      } else if (code === 4001 || message.includes("user rejected") || err.code === "ACTION_REJECTED") {
        // User rejected the request (covers both ethers v6 and MetaMask)
        toast.error("MetaMask connection request was rejected.");
        setError("You rejected the MetaMask connection request.");
      } else if (message.includes("No Ethereum provider")) {
        // No MetaMask
        toast.error("MetaMask not detected. Please install it first.");
        setError("MetaMask extension not found in your browser.");
      } else if (message.includes("Request of type 'wallet_requestPermissions' already pending")) {
        toast.error("MetaMask connection already in progress. Please check MetaMask.");
        setError("Connection already in progress. Open MetaMask to continue.");
      } else {
        // Unknown/unexpected errors
        toast.error("Failed to connect MetaMask. Please try again.");
        setError(message);
      }

      setAuthorized(false);
    } finally {
      setLoading(false);
    }
  };

  if (authorized) return children;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-r from-gray-100 to-gray-200 p-4">
      <div className="bg-white shadow-lg rounded-xl p-8 w-full max-w-md text-center">
        <FaEthereum className="w-16 h-16 mx-auto mb-4 text-blue-600 animate-bounce" />
        <h1 className="text-2xl font-bold mb-2 text-gray-800">Admin Access Required</h1>
        <p className="mb-6 text-gray-600">
          Connect your admin wallet in MetaMask to continue to the dashboard.
        </p>

        {error && <p className="mb-4 text-red-600 font-medium">{error}</p>}

        <button
          onClick={handleConnect}
          disabled={loading}
          className="flex items-center justify-center gap-2 px-6 py-3 w-full text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-all duration-200"
        >
          {loading ? <ClipLoader size={20} color="#fff" /> : <FaLock />}
          {loading ? "Connecting..." : "Connect MetaMask"}
        </button>

        <button
          onClick={() => {
            toast("Returning to homepage...", { icon: "🏠" });
            navigate("/");
          }}
          className="mt-4 px-6 py-2 w-full bg-gray-200 hover:bg-gray-300 rounded-lg text-gray-800 transition-all duration-200"
        >
          Go Back to Homepage
        </button>
      </div>
    </div>
  );
};

export default AdminRoute;
