import React from "react";
import AppRoutes from "./routes/AppRoutes";
import { BrowserRouter as Router, useLocation, useNavigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { VerifyProductButton } from "./components/common/VerifyProductButton";


// Enhanced Floating Verify Button Component


const App = () => {
  return (
    <Router>
      <AppRoutes />
      <VerifyProductButton />

      <Toaster
        position="top-center"
        reverseOrder={false}
        toastOptions={{
          duration: 5000,
        }}
      />
      
      {/* Custom CSS for additional animations */}
      <style jsx>{`
        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        
        .animate-spin-slow {
          animation: spin-slow 3s linear infinite;
        }
        
        .shadow-3xl {
          box-shadow: 0 35px 60px -12px rgba(0, 0, 0, 0.25);
        }
      `}</style>
    </Router>
  );
};

export default App;