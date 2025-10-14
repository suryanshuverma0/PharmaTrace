import { LogOut } from "lucide-react";

const Topbar = ({ onLogout }) => {
  return (
    <header className="flex justify-between items-center bg-white shadow px-6 py-3 rounded-b-lg">
      <h2 className="text-lg font-semibold text-gray-700">Admin Dashboard</h2>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-full">
          <img
            src="https://ui-avatars.com/api/?name=Admin&background=0D8ABC&color=fff"
            alt="Admin Avatar"
            className="w-8 h-8 rounded-full"
          />
          <span className="text-gray-700 font-medium">Admin</span>
        </div>

        <button
          onClick={onLogout}
          className="flex items-center gap-1 text-white bg-red-600 hover:bg-red-700 px-4 py-1 rounded-lg font-medium transition"
        >
          <LogOut size={16} /> Logout
        </button>
      </div>
    </header>
  );
};

export default Topbar;
