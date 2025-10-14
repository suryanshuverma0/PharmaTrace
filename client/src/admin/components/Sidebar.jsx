import { NavLink, useLocation } from "react-router-dom";
import { LayoutDashboard, Factory, Truck, Package } from "lucide-react";
import { useState } from "react";

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);

  const links = [
    { name: "Dashboard", icon: <LayoutDashboard />, path: "/admin" },
    { name: "Manufacturers", icon: <Factory />, path: "/admin/manufacturers" },
    { name: "Distributors", icon: <Truck />, path: "/admin/distributors" },
    { name: "Pharmacists", icon: <Package />, path: "/admin/pharmacists" },
  ];

  const location = useLocation();
  

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <aside
      className={`${
        collapsed ? "w-20" : "w-64"
      } bg-white shadow-xl p-5 flex flex-col justify-between transition-width duration-300`}
    >
      <div>
        <h1
          className={`text-2xl font-semibold text-blue-600 mb-10 ${
            collapsed ? "opacity-0" : "opacity-100"
          } transition-opacity duration-300`}
        >
          Admin Panel
        </h1>
        <nav className="space-y-2">
          {links.map((link) => (
            <NavLink
              key={link.name}
              to={link.path}
              className={() =>
                `flex items-center gap-3 p-3 rounded-lg transition-all ${
                  isActive(link.path)
                    ? "bg-blue-600 text-white shadow-md"
                    : "text-gray-700 hover:bg-gray-100"
                }`
              }
            >
              {link.icon}
              <span className={`${collapsed ? "hidden" : "block"}`}>{link.name}</span>
            </NavLink>
          ))}
        </nav>
      </div>
      <div className="text-sm text-gray-400">© 2025 Counterfeit Chain</div>
    </aside>
  );
};

export default Sidebar;
