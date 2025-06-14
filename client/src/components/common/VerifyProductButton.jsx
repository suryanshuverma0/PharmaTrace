import { useLocation, useNavigate } from "react-router";
import { MdVerified } from "react-icons/md";

export const VerifyProductButton = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Show only on homepage '/'
  if (location.pathname !== "/") return null;

  return (
    <div className="fixed z-50 bottom-6 right-6">
      <div className="flex items-center justify-end group">
        {/* Animated text label on the left */}
        <div className="w-0 mr-3 overflow-hidden transition-all duration-700 ease-out opacity-0 group-hover:opacity-100 group-hover:w-40">
          <div className="px-4 py-2 text-blue-600 transition-all duration-500 delay-100 transform translate-x-4 border rounded-lg shadow-xl bg-gradient-to-r from-blue-100 to-indigo-100 border-blue-400/30 backdrop-blur-sm group-hover:translate-x-0 whitespace-nowrap">
            <span className="font-semibold tracking-wide ">
              🔍 Verify Product
            </span>
            {/* Arrow pointing to button */}
            <div className="absolute right-0 w-0 h-0 transform translate-x-full -translate-y-1/2 top-1/2 border-l-6 border-l-blue-600 border-t-3 border-t-transparent border-b-3 border-b-transparent"></div>
          </div>
        </div>

        {/* Main circular button */}
        <button
          onClick={() => navigate("/verify-product")}
          className="relative flex items-center justify-center text-white transition-all duration-500 ease-in-out transform rounded-full shadow-2xl cursor-pointer w-14 h-14 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 hover:from-blue-600 hover:via-indigo-600 hover:to-purple-700 hover:scale-110 hover:shadow-3xl hover:shadow-blue-500/40 active:scale-95"
        >
          {/* Animated background pulse */}
          <div className="absolute inset-0 rounded-full opacity-0 bg-gradient-to-br from-blue-400 to-purple-500 group-hover:opacity-20 animate-pulse"></div>
          
          {/* Shimmer effect */}
          <div className="absolute inset-0 overflow-hidden transition-opacity duration-500 rounded-full opacity-0 group-hover:opacity-100">
            <div className="absolute inset-0 transform -skew-x-12 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
          </div>
          
          {/* Rotating border ring */}
          <div className="absolute inset-0 transition-opacity duration-300 border-2 border-transparent rounded-full opacity-0 bg-gradient-to-br from-blue-300 to-purple-400 group-hover:opacity-100 animate-spin-slow"></div>
          
          {/* Icon with animation */}
          <MdVerified className="relative z-10 text-3xl transition-all duration-500 group-hover:scale-125 group-hover:rotate-12 drop-shadow-lg" />
          
          {/* Floating particles effect */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute w-1 h-1 transition-opacity duration-300 bg-white rounded-full opacity-0 group-hover:opacity-100 animate-bounce" style={{ top: '15%', left: '25%', animationDelay: '0ms' }}></div>
            <div className="absolute w-1 h-1 transition-opacity duration-300 bg-white rounded-full opacity-0 group-hover:opacity-100 animate-bounce" style={{ top: '75%', right: '20%', animationDelay: '150ms' }}></div>
            <div className="absolute w-1 h-1 transition-opacity duration-300 bg-white rounded-full opacity-0 group-hover:opacity-100 animate-bounce" style={{ bottom: '25%', left: '15%', animationDelay: '300ms' }}></div>
          </div>
          
          {/* Glow effect */}
          <div className="absolute inset-0 transition-opacity duration-500 rounded-full opacity-0 group-hover:opacity-30 bg-gradient-to-r from-blue-400 to-purple-500 blur-sm -z-10"></div>
        </button>
      </div>
      
      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%) skewX(-12deg); }
          100% { transform: translateX(300%) skewX(-12deg); }
        }
        
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
        
        .animate-spin-slow {
          animation: spin-slow 3s linear infinite;
        }
        
        .shadow-3xl {
          box-shadow: 0 35px 60px -12px rgba(0, 0, 0, 0.25);
        }
        
        .border-l-6 {
          border-left-width: 6px;
        }
        
        .border-t-3 {
          border-top-width: 3px;
        }
        
        .border-b-3 {
          border-bottom-width: 3px;
        }
      `}</style>
    </div>
  );
};