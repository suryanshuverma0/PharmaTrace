// import { Routes, Route } from "react-router-dom";
// import DashboardLayout from "./components/DashboardLayout";
// import Dashboard from "./pages/Dashboard";
// import Manufacturers from "./pages/Manufacturers";
// import Distributors from "./pages/Distributors";
// import Pharmacists from "./pages/Pharmacists";

// export default function AdminApp() {
//   return (
//     <Routes>
//       <Route path="/" element={<DashboardLayout />}>
//         <Route index element={<Dashboard />} />
//         <Route path="manufacturers" element={<Manufacturers />} />
//         <Route path="distributors" element={<Distributors />} />
//         <Route path="pharmacists" element={<Pharmacists />} />
//       </Route>
//     </Routes>
//   );
// }



import DashboardLayout from "./components/DashboardLayout";

const AdminApp = () => {
  return <DashboardLayout />; // Layout handles <Outlet /> for admin pages
};

export default AdminApp;
