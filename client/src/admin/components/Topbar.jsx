import { LogOut } from "lucide-react";

const Topbar = ({ onLogout }) => {
  return (
    <header className="flex items-center justify-between px-6 py-3 bg-white shadow-sm">
      <h2 className="text-lg font-semibold text-gray-700">Admin Dashboard</h2>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full">
          <img
            src="https://ui-avatars.com/api/?name=Admin&background=0D8ABC&color=fff"
            alt="Admin Avatar"
            className="w-8 h-8 rounded-full"
          />
          <span className="font-medium text-gray-700">Admin</span>
        </div>

        <button
          onClick={onLogout}
          className="flex items-center gap-1 px-4 py-1 font-medium text-red-500 transition border border-red-400 rounded-lg hover:bg-red-50"
        >
          <LogOut size={16} /> Logout
        </button>
      </div>
    </header>
  );
};

export default Topbar;
