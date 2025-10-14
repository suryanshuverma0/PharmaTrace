// import { NavLink } from "react-router-dom";
// import { LayoutDashboard, Factory, Package } from "lucide-react";

// const Sidebar = () => {
//   const links = [
//     { name: "Dashboard", icon: <LayoutDashboard />, path: "/admin" },
//     { name: "Manufacturers", icon: <Factory />, path: "/admin/manufacturers" },
//     {name: "Distributors", icon: <Factory />, path: "/admin/distributors" },
//     { name: "Pharmacists", icon: <Package />, path: "/admin/pharmacists" },];

//   return (
//     <aside className="w-64 bg-white shadow-xl p-5 flex flex-col justify-between">
//       <div>
//         <h1 className="text-2xl font-semibold text-blue-600 mb-10">Admin Panel</h1>
//         <nav className="space-y-2">
//           {links.map((link) => (
//             <NavLink
//               key={link.name}
//               to={link.path}
//               className={({ isActive }) =>
//                 `flex items-center gap-3 p-3 rounded-lg transition-all ${
//                   isActive
//                     ? "bg-blue-600 text-white shadow-md"
//                     : "text-gray-700 hover:bg-gray-100"
//                 }`
//               }
//             >
//               {link.icon}
//               <span>{link.name}</span>
//             </NavLink>
//           ))}
//         </nav>
//       </div>
//       <div className="text-sm text-gray-400">© 2025 Counterfeit Chain</div>
//     </aside>
//   );
// };

// export default Sidebar;


import { NavLink } from "react-router-dom";
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
              className={({ isActive }) =>
                `flex items-center gap-3 p-3 rounded-lg transition-all ${
                  isActive
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
