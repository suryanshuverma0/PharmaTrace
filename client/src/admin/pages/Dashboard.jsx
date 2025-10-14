// import { useEffect, useState } from "react";
// import { motion } from "framer-motion";
// import { Users, Factory, Truck, ClipboardList } from "lucide-react";
// import {
//   getAllManufacturers,
//   getAllDistributors,
//   getAllPharmacists,
// } from "../api/api";

// const Dashboard = () => {
//   const [stats, setStats] = useState({
//     totalUsers: 0,
//     totalManufacturers: 0,
//     totalDistributors: 0,
//     totalPharmacists: 0,
//   });

//   useEffect(() => {
//     const fetchStats = async () => {
//       const manufacturers = await getAllManufacturers();
//       const distributors = await getAllDistributors();
//       const pharmacists = await getAllPharmacists();

//       const totalUsers =
//         manufacturers.length + distributors.length + pharmacists.length;

//       setStats({
//         totalUsers,
//         totalManufacturers: manufacturers.length,
//         totalDistributors: distributors.length,
//         totalPharmacists: pharmacists.length,
//       });
//     };

//     fetchStats();
//   }, []);

//   const cards = [
//     {
//       title: "Total Users",
//       value: stats.totalUsers,
//       icon: Users,
//       color: "from-blue-100 to-blue-50",
//       iconColor: "text-blue-600",
//       glow: "shadow-blue-200",
//     },
//     {
//       title: "Manufacturers",
//       value: stats.totalManufacturers,
//       icon: Factory,
//       color: "from-purple-100 to-purple-50",
//       iconColor: "text-purple-600",
//       glow: "shadow-purple-200",
//     },
//     {
//       title: "Distributors",
//       value: stats.totalDistributors,
//       icon: Truck,
//       color: "from-green-100 to-green-50",
//       iconColor: "text-green-600",
//       glow: "shadow-green-200",
//     },
//     {
//       title: "Pharmacists",
//       value: stats.totalPharmacists,
//       icon: ClipboardList,
//       color: "from-pink-100 to-pink-50",
//       iconColor: "text-pink-600",
//       glow: "shadow-pink-200",
//     },
//   ];

//   return (
//     <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white px-6 py-10">
//       <h1 className="text-3xl font-semibold text-gray-800 mb-8">
//         Dashboard Overview
//       </h1>

//       <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
//         {cards.map((card, index) => (
//           <motion.div
//             key={index}
//             initial={{ opacity: 0, y: 30 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ delay: index * 0.1 }}
//             whileHover={{ scale: 1.05 }}
//             className={`bg-gradient-to-br ${card.color} shadow-md ${card.glow} rounded-2xl p-6 flex flex-col items-center justify-center text-center border border-gray-100 hover:shadow-xl transition-all duration-300`}
//           >
//             <div
//               className={`p-4 rounded-full bg-white shadow-sm mb-4 ${card.iconColor}`}
//             >
//               <card.icon size={32} />
//             </div>
//             <h3 className="text-gray-600 text-sm font-medium uppercase tracking-wide">
//               {card.title}
//             </h3>
//             <p className="text-4xl font-bold text-gray-800 mt-2">
//               {card.value}
//             </p>
//           </motion.div>
//         ))}
//       </div>
//     </div>
//   );
// };

// export default Dashboard;


// import { useEffect, useState, Fragment } from "react";
// import { motion } from "framer-motion";
// import { Users, Factory, Truck, ClipboardList, LogOut,XCircle } from "lucide-react";
// import { Dialog, Transition } from "@headlessui/react";
// import { useNavigate } from "react-router-dom";
// import {
//   getAllManufacturers,
//   getAllDistributors,
//   getAllPharmacists,
// } from "../api/api";

// const Dashboard = () => {
//   const navigate = useNavigate();
//   const [stats, setStats] = useState({
//     totalUsers: 0,
//     totalManufacturers: 0,
//     totalDistributors: 0,
//     totalPharmacists: 0,
//   });

//   const [logoutModal, setLogoutModal] = useState(false);

//   useEffect(() => {
//     const fetchStats = async () => {
//       const manufacturers = await getAllManufacturers();
//       const distributors = await getAllDistributors();
//       const pharmacists = await getAllPharmacists();

//       const totalUsers =
//         manufacturers.length + distributors.length + pharmacists.length;

//       setStats({
//         totalUsers,
//         totalManufacturers: manufacturers.length,
//         totalDistributors: distributors.length,
//         totalPharmacists: pharmacists.length,
//       });
//     };

//     fetchStats();
//   }, []);

//   const cards = [
//     {
//       title: "Total Users",
//       value: stats.totalUsers,
//       icon: Users,
//       color: "from-blue-100 to-blue-50",
//       iconColor: "text-blue-600",
//       glow: "shadow-blue-200",
//     },
//     {
//       title: "Manufacturers",
//       value: stats.totalManufacturers,
//       icon: Factory,
//       color: "from-purple-100 to-purple-50",
//       iconColor: "text-purple-600",
//       glow: "shadow-purple-200",
//     },
//     {
//       title: "Distributors",
//       value: stats.totalDistributors,
//       icon: Truck,
//       color: "from-green-100 to-green-50",
//       iconColor: "text-green-600",
//       glow: "shadow-green-200",
//     },
//     {
//       title: "Pharmacists",
//       value: stats.totalPharmacists,
//       icon: ClipboardList,
//       color: "from-pink-100 to-pink-50",
//       iconColor: "text-pink-600",
//       glow: "shadow-pink-200",
//     },
//   ];

//   const handleLogout = () => {
//     // clear user session if any
//     navigate("/"); // redirect to login or home
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white px-6 py-10">
//       {/* Header */}
//       <div className="flex justify-between items-center mb-10">
//         <h1 className="text-3xl font-semibold text-gray-800">Dashboard Overview</h1>
//         <motion.button
//           whileHover={{ scale: 1.05 }}
//           whileTap={{ scale: 0.95 }}
//           onClick={() => setLogoutModal(true)}
//           className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg shadow hover:bg-red-700 transition"
//         >
//           <LogOut size={20} /> Logout
//         </motion.button>
//       </div>

//       {/* Stats Cards */}
//       <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
//         {cards.map((card, index) => (
//           <motion.div
//             key={index}
//             initial={{ opacity: 0, y: 30 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ delay: index * 0.1 }}
//             whileHover={{ scale: 1.05 }}
//             className={`bg-gradient-to-br ${card.color} shadow-md ${card.glow} rounded-2xl p-6 flex flex-col items-center justify-center text-center border border-gray-100 hover:shadow-xl transition-all duration-300`}
//           >
//             <div className={`p-4 rounded-full bg-white shadow-sm mb-4 ${card.iconColor}`}>
//               <card.icon size={32} />
//             </div>
//             <h3 className="text-gray-600 text-sm font-medium uppercase tracking-wide">{card.title}</h3>
//             <p className="text-4xl font-bold text-gray-800 mt-2">{card.value}</p>
//           </motion.div>
//         ))}
//       </div>

//       {/* Logout Confirmation Modal */}
//       <Transition appear show={logoutModal} as={Fragment}>
//         <Dialog as="div" className="relative z-50" onClose={() => setLogoutModal(false)}>
//           <Transition.Child
//             as={Fragment}
//             enter="ease-out duration-300"
//             enterFrom="opacity-0"
//             enterTo="opacity-100"
//             leave="ease-in duration-200"
//             leaveFrom="opacity-100"
//             leaveTo="opacity-0"
//           >
//             <div className="fixed inset-0 bg-black bg-opacity-40" />
//           </Transition.Child>

//           <div className="fixed inset-0 flex items-center justify-center p-4">
//             <Transition.Child
//               as={Fragment}
//               enter="ease-out duration-300"
//               enterFrom="opacity-0 scale-95"
//               enterTo="opacity-100 scale-100"
//               leave="ease-in duration-200"
//               leaveFrom="opacity-100 scale-100"
//               leaveTo="opacity-0 scale-95"
//             >
//               <Dialog.Panel className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 relative">
//                 <button
//                   onClick={() => setLogoutModal(false)}
//                   className="absolute top-4 right-4 text-gray-500 hover:text-gray-900 transition"
//                 >
//                   <XCircle className="w-6 h-6" />
//                 </button>
//                 <div className="flex flex-col items-center text-center">
//                   <LogOut className="w-12 h-12 text-red-500 mb-4" />
//                   <Dialog.Title className="text-xl font-bold mb-2">Confirm Logout</Dialog.Title>
//                   <p className="text-gray-700 mb-6">Do you really want to logout?</p>
//                   <div className="flex gap-4">
//                     <button
//                       onClick={handleLogout}
//                       className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition"
//                     >
//                       Yes, Logout
//                     </button>
//                     <button
//                       onClick={() => setLogoutModal(false)}
//                       className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition"
//                     >
//                       Cancel
//                     </button>
//                   </div>
//                 </div>
//               </Dialog.Panel>
//             </Transition.Child>
//           </div>
//         </Dialog>
//       </Transition>
//     </div>
//   );
// };

// export default Dashboard;



import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Users, Factory, Truck, ClipboardList } from "lucide-react";
import { getAllManufacturers, getAllDistributors, getAllPharmacists } from "../api/api";

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalManufacturers: 0,
    totalDistributors: 0,
    totalPharmacists: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      const manufacturers = await getAllManufacturers();
      const distributors = await getAllDistributors();
      const pharmacists = await getAllPharmacists();

      setStats({
        totalUsers: manufacturers.length + distributors.length + pharmacists.length,
        totalManufacturers: manufacturers.length,
        totalDistributors: distributors.length,
        totalPharmacists: pharmacists.length,
      });
    };
    fetchStats();
  }, []);

  const cards = [
    { title: "Total Users", value: stats.totalUsers, icon: Users, color: "from-blue-100 to-blue-50", iconColor: "text-blue-600", glow: "shadow-blue-200" },
    { title: "Manufacturers", value: stats.totalManufacturers, icon: Factory, color: "from-purple-100 to-purple-50", iconColor: "text-purple-600", glow: "shadow-purple-200" },
    { title: "Distributors", value: stats.totalDistributors, icon: Truck, color: "from-green-100 to-green-50", iconColor: "text-green-600", glow: "shadow-green-200" },
    { title: "Pharmacists", value: stats.totalPharmacists, icon: ClipboardList, color: "from-pink-100 to-pink-50", iconColor: "text-pink-600", glow: "shadow-pink-200" },
  ];

  return (
    <div className="min-h-screen">
      <h1 className="text-3xl font-semibold text-gray-800 mb-8">Dashboard Overview</h1>
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
        {cards.map((card, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.05 }}
            className={`bg-gradient-to-br ${card.color} shadow-md ${card.glow} rounded-2xl p-6 flex flex-col items-center justify-center text-center border border-gray-100 hover:shadow-xl transition-all duration-300`}
          >
            <div className={`p-4 rounded-full bg-white shadow-sm mb-4 ${card.iconColor}`}>
              <card.icon size={32} />
            </div>
            <h3 className="text-gray-600 text-sm font-medium uppercase tracking-wide">{card.title}</h3>
            <p className="text-4xl font-bold text-gray-800 mt-2">{card.value}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
