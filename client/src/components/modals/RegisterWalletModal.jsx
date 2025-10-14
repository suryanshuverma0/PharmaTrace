// import React, { useState } from "react";
// import Modal from "../UI/Modal";
// import Button from "../UI/Button";
// import Input from "../UI/Input";
// import Select from "../UI/Select";
// import { FaUser, FaBuilding, FaWallet } from "react-icons/fa";
// import { useAuth } from "../../context/AuthContext";
// import { useWalletModal } from "../../context/WalletModalContext"; // ✅ Added
// import { toast } from "react-hot-toast";

// // Role-specific field configurations
// const roleFieldsConfig = {
//   consumer: [],
//   manufacturer: [
//     {
//       name: "companyName",
//       label: "Company Name",
//       type: "text",
//       required: false,
//     },
//     {
//       name: "registrationNumber",
//       label: "Registration Number",
//       type: "text",
//       required: false,
//     },
//     {
//       name: "licenseDocument",
//       label: "License Document",
//       type: "file",
//       accept: "image/*",
//       required: false,
//     },
//     {
//       name: "website",
//       label: "Website",
//       type: "url",
//       placeholder: "https://",
//       required: false,
//     },
//     {
//       name: "certifications",
//       label: "Certifications (comma-separated)",
//       type: "text",
//       required: false,
//     },
//   ],
//   distributor: [
//     {
//       name: "companyName",
//       label: "Company Name",
//       type: "text",
//       required: true,
//     },
//     {
//       name: "registrationNumber",
//       label: "Registration Number",
//       type: "text",
//       required: true,
//     },
//     {
//       name: "licenseDocument",
//       label: "License Document",
//       type: "file",
//       accept: "image/*",
//       required: false,
//     },
//     {
//       name: "warehouseAddress",
//       label: "Warehouse Address",
//       type: "text",
//       required: true,
//     },
//     {
//       name: "operationalRegions",
//       label: "Operational Regions (comma-separated)",
//       type: "text",
//       required: false,
//     },
//   ],
//   pharmacist: [
//     {
//       name: "pharmacyName",
//       label: "Pharmacy Name",
//       type: "text",
//       required: true,
//     },
//     {
//       name: "licenseNumber",
//       label: "License Number",
//       type: "text",
//       required: true,
//     },
//     {
//       name: "licenseDocument",
//       label: "License Document",
//       type: "file",
//       accept: "image/*",
//       required: false,
//     },
//     {
//       name: "pharmacyLocation",
//       label: "Pharmacy Location",
//       type: "text",
//       required: false,
//     },
//   ],
// };

// const RegisterWalletModal = () => {
//   const {
//     connectWallet,
//     registerUserWithRole,
//     isLoading,
//     isConnected,
//     checkAccountLoading,
//   } = useAuth();
//   const { isRegisterModalOpen, closeRegisterModal, openConnectModal } =
//     useWalletModal(); // ✅ use context

//   const [formData, setFormData] = useState({
//     name: "",
//     email: "",
//     phone: "",
//     role: "",
//     country: "",
//     city: "",
//     state: "",
//     companyName: "",
//     registrationNumber: "",
//     licenseDocument: "",
//     website: "",
//     certifications: "",
//     warehouseAddress: "",
//     operationalRegions: "",
//     pharmacyName: "",
//     licenseNumber: "",
//     pharmacyLocation: "",
//   });

//   const roles = [
//     { value: "consumer", label: "Consumer" },
//     { value: "manufacturer", label: "Manufacturer" },
//     { value: "distributor", label: "Distributor" },
//     { value: "pharmacist", label: "Pharmacist" },
//   ];

//   const handleInputChange = (e) => {
//     const { name, value, files } = e.target;
//     if (files) {
//       const file = files[0];
//       if (file) {
//         const reader = new FileReader();
//         reader.readAsDataURL(file);
//         reader.onload = () => {
//           setFormData((prev) => ({ ...prev, [name]: reader.result }));
//         };
//         reader.onerror = () => toast.error("Failed to read file");
//       }
//     } else {
//       setFormData((prev) => ({ ...prev, [name]: value }));
//     }
//   };

//   const handleSelectChange = (value) => {
//     setFormData((prev) => ({ ...prev, role: value }));
//   };

//   const validateForm = () => {
//     if (!formData.name) return "Full Name is required";
//     if (!formData.email) return "Email is required";
//     if (!/^\S+@\S+\.\S+$/.test(formData.email))
//       return "Valid Email is required";
//     if (!formData.phone) return "Phone is required";
//     if (!formData.role) return "Role is required";
//     if (!formData.country) return "Country is required";

//     const roleFields = roleFieldsConfig[formData.role] || [];
//     for (const field of roleFields) {
//       if (field.required && !formData[field.name]) {
//         return `${field.label} is required`;
//       }
//     }
//     return null;
//   };

//   const handleConnectClick = () => {
//     closeRegisterModal(); // ✅ Close register modal
//     openConnectModal(); // ✅ Open connect modal
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     if (isLoading) return;

//     const error = validateForm();
//     if (error) {
//       toast.error(error);
//       return;
//     }

//     try {
//       if (!isConnected) {
//         const connectResult = await connectWallet();
//         if (!connectResult.success) {
//           toast.error(connectResult.error || "Failed to connect wallet");
//           return;
//         }
//       }

//       const roleData = {};
//       const roleFields = roleFieldsConfig[formData.role] || [];
//       roleFields.forEach((field) => {
//         if (formData[field.name]) {
//           roleData[field.name] =
//             field.name === "certifications" ||
//             field.name === "operationalRegions"
//               ? formData[field.name].split(",").map((item) => item.trim())
//               : formData[field.name];
//         }
//       });

//       // Create a message to sign
//       const message = `Register ${formData.name} as ${
//         formData.role
//       } at ${new Date().toISOString()}`;
//       const signature = await window.ethereum.request({
//         method: "personal_sign",
//         params: [message, window.ethereum.selectedAddress],
//       });

//       const registrationData = {
//         name: formData.name,
//         email: formData.email,
//         phone: formData.phone,
//         role: formData.role,
//         country: formData.country,
//         city: formData.city,
//         state: formData.state,
//         message,
//         signature,
//         address: window.ethereum.selectedAddress,
//         ...roleData,
//       };

//       const result = await registerUserWithRole(registrationData);

//       if (result.success) {
//         toast.success("Registration successful! Check your email to activate.");
//         setTimeout(() => {
//           handleConnectClick();
//           setFormData({
//             name: "",
//             email: "",
//             phone: "",
//             role: "",
//             country: "",
//             city: "",
//             state: "",
//             companyName: "",
//             registrationNumber: "",
//             licenseDocument: "",
//             website: "",
//             certifications: "",
//             warehouseAddress: "",
//             operationalRegions: "",
//             pharmacyName: "",
//             licenseNumber: "",
//             pharmacyLocation: "",
//           });
//         }, 3000);
//       } else {
//         toast.error(result.error || "Registration failed");
//       }
//     } catch (err) {
//       toast.error(err.message || "Failed to register");
//     }
//   };

//   const selectedRoleFields = roleFieldsConfig[formData.role] || [];

//   return (
//     <Modal
//       isOpen={isRegisterModalOpen}
//       onClose={closeRegisterModal}
//       size="lg"
//       className="max-w-xl"
//     >
//       <div className="px-4 overflow-y-auto max-h-[75vh]">
//         <div className="flex flex-col items-center justify-center mb-6">
//           <div className="p-4 mb-4 rounded-full bg-primary-100">
//             <FaBuilding className="w-8 h-8 text-primary-600" />
//           </div>
//           <h2 className="mb-2 text-2xl font-bold text-gray-900">
//             Register Your Account
//           </h2>
//           <p className="text-center text-gray-600">
//             Fill in your details to register in the pharmaceutical supply chain.
//           </p>
//         </div>

//         <form onSubmit={handleSubmit} className="space-y-4">
//           <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
//             <Input
//               label="Full Name"
//               name="name"
//               value={formData.name}
//               onChange={handleInputChange}
//               required
//             />
//             <Select
//               label="Role"
//               name="role"
//               value={formData.role}
//               onChange={handleSelectChange}
//               options={roles}
//               required
//             />
//             <Input
//               label="Email"
//               type="email"
//               name="email"
//               value={formData.email}
//               onChange={handleInputChange}
//               required
//             />
//             <Input
//               label="Phone"
//               type="tel"
//               name="phone"
//               value={formData.phone}
//               onChange={handleInputChange}
//               required
//             />
//             <Input
//               label="Country"
//               name="country"
//               value={formData.country}
//               onChange={handleInputChange}
//               required
//             />
//             <Input
//               label="City"
//               name="city"
//               value={formData.city}
//               onChange={handleInputChange}
//             />
//             <Input
//               label="State"
//               name="state"
//               value={formData.state}
//               onChange={handleInputChange}
//             />
//           </div>

//           {selectedRoleFields.length > 0 && (
//             <div className="space-y-4">
//               <h3 className="text-lg font-semibold text-gray-900">
//                 Role-Specific Information
//               </h3>
//               <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
//                 {selectedRoleFields.map((field) => (
//                   <Input
//                     key={field.name}
//                     label={field.label}
//                     name={field.name}
//                     type={field.type}
//                     value={formData[field.name]}
//                     onChange={handleInputChange}
//                     required={field.required}
//                     accept={field.accept}
//                     placeholder={field.placeholder}
//                   />
//                 ))}
//               </div>
//             </div>
//           )}

//           <div className="mt-6">
//             <Button
//               type="submit"
//               variant="primary"
//               className="w-full"
//               disabled={isLoading || checkAccountLoading}
//             >
//               {isLoading ? "Processing..." : "Connect Wallet & Register"}
//             </Button>
//           </div>
//         </form>

//         <div className="mt-6">
//           <div className="relative">
//             <div className="absolute inset-0 flex items-center">
//               <div className="w-full border-t border-gray-300"></div>
//             </div>
//             <div className="relative flex justify-center text-sm">
//               <span className="px-2 text-gray-500 bg-white">
//                 Already have an account?
//               </span>
//             </div>
//           </div>

//           <div className="mt-6">
//             <button
//               onClick={handleConnectClick}
//               className="flex items-center justify-center w-full gap-2 px-4 py-2 transition-colors duration-200 border rounded-lg text-primary-600 border-primary-600 hover:bg-primary-50"
//             >
//               <FaWallet className="w-5 h-5" />
//               Connect Existing Wallet
//             </button>
//           </div>
//         </div>

//         <div className="mt-6 text-sm text-center text-gray-600">
//           By registering, you agree to our{" "}
//           <a href="/terms" className="text-primary-600 hover:text-primary-700">
//             Terms of Service
//           </a>{" "}
//           and{" "}
//           <a
//             href="/privacy"
//             className="text-primary-600 hover:text-primary-700"
//           >
//             Privacy Policy
//           </a>
//           .
//         </div>
//       </div>
//     </Modal>
//   );
// };

// export default RegisterWalletModal;


import React, { useState } from "react";
import Modal from "../UI/Modal";
import Button from "../UI/Button";
import Input from "../UI/Input";
import Select from "../UI/Select";
import { FaUser, FaBuilding, FaWallet } from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";
import { useWalletModal } from "../../context/WalletModalContext";
import { toast } from "react-hot-toast";

// Role-specific field configurations
const roleFieldsConfig = {
  consumer: [],
  manufacturer: [
    { name: "companyName", label: "Company Name", type: "text", required: false },
    { name: "registrationNumber", label: "Registration Number", type: "text", required: false },
    { name: "licenseDocument", label: "License Document", type: "file", accept: "image/*", required: true },
    { name: "website", label: "Website", type: "url", placeholder: "https://", required: false },
    { name: "certifications", label: "Certifications (comma-separated)", type: "text", required: false },
  ],
  distributor: [
    { name: "companyName", label: "Company Name", type: "text", required: true },
    { name: "registrationNumber", label: "Registration Number", type: "text", required: true },
    { name: "licenseDocument", label: "License Document", type: "file", accept: "image/*", required: true },
    { name: "warehouseAddress", label: "Warehouse Address", type: "text", required: true },
    { name: "operationalRegions", label: "Operational Regions (comma-separated)", type: "text", required: false },
  ],
  pharmacist: [
    { name: "pharmacyName", label: "Pharmacy Name", type: "text", required: true },
    { name: "licenseNumber", label: "License Number", type: "text", required: true },
    { name: "licenseDocument", label: "License Document", type: "file", accept: "image/*", required: true },
    { name: "pharmacyLocation", label: "Pharmacy Location", type: "text", required: false },
  ],
};

const RegisterWalletModal = () => {
  const {
    connectWallet,
    registerUserWithRole,
    isLoading,
    isConnected,
    checkAccountLoading,
  } = useAuth();

  const { isRegisterModalOpen, closeRegisterModal, openConnectModal } = useWalletModal();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    role: "",
    country: "",
    city: "",
    state: "",
    companyName: "",
    registrationNumber: "",
    licenseDocument: "",
    website: "",
    certifications: "",
    warehouseAddress: "",
    operationalRegions: "",
    pharmacyName: "",
    licenseNumber: "",
    pharmacyLocation: "",
  });

  const roles = [
    { value: "consumer", label: "Consumer" },
    { value: "manufacturer", label: "Manufacturer" },
    { value: "distributor", label: "Distributor" },
    { value: "pharmacist", label: "Pharmacist" },
  ];

  // const handleInputChange = (e) => {
  //   const { name, value, files } = e.target;
  //   if (files) {
  //     setFormData((prev) => ({ ...prev, [name]: files[0] })); // store file directly for FormData
  //   } else {
  //     setFormData((prev) => ({ ...prev, [name]: value }));
  //   }
  // };


  const handleInputChange = (e) => {
  const { name, value, files } = e.target;

  if (files) {
    // ✅ Store the raw file, NOT base64
    setFormData((prev) => ({ ...prev, [name]: files[0] }));
  } else {
    setFormData((prev) => ({ ...prev, [name]: value }));
  }
};

  const handleSelectChange = (value) => {
    setFormData((prev) => ({ ...prev, role: value }));
  };

  const validateForm = () => {
    if (!formData.name) return "Full Name is required";
    if (!formData.email) return "Email is required";
    if (!/^\S+@\S+\.\S+$/.test(formData.email)) return "Valid Email is required";
    if (!formData.phone) return "Phone is required";
    if (!formData.role) return "Role is required";
    if (!formData.country) return "Country is required";

    const roleFields = roleFieldsConfig[formData.role] || [];
    for (const field of roleFields) {
      if (field.required && !formData[field.name]) {
        return `${field.label} is required`;
      }
    }
    return null;
  };

  const handleConnectClick = () => {
    closeRegisterModal();
    openConnectModal();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLoading) return;

    const error = validateForm();
    if (error) {
      toast.error(error);
      return;
    }

    try {
      if (!isConnected) {
        const connectResult = await connectWallet();
        if (!connectResult.success) {
          toast.error(connectResult.error || "Failed to connect wallet");
          return;
        }
      }

      const roleData = {};
      const roleFields = roleFieldsConfig[formData.role] || [];
      roleFields.forEach((field) => {
        if (formData[field.name]) {
          roleData[field.name] =
            field.name === "certifications" || field.name === "operationalRegions"
              ? formData[field.name].split(",").map((item) => item.trim())
              : formData[field.name];
        }
      });

      // Message for signature
      const message = `Register ${formData.name} as ${formData.role} at ${new Date().toISOString()}`;
      const signature = await window.ethereum.request({
        method: "personal_sign",
        params: [message, window.ethereum.selectedAddress],
      });

      // Prepare FormData for backend
      const formPayload = new FormData();
      formPayload.append("name", formData.name);
      formPayload.append("email", formData.email);
      formPayload.append("phone", formData.phone);
      formPayload.append("role", formData.role);
      formPayload.append("country", formData.country);
      formPayload.append("city", formData.city);
      formPayload.append("state", formData.state);
      formPayload.append("message", message);
      formPayload.append("signature", signature);
      formPayload.append("address", window.ethereum.selectedAddress);

      // Append role-specific fields
      Object.keys(roleData).forEach((key) => {
        if (key === "licenseDocument" && roleData[key] instanceof File) {
          formPayload.append("licenseDocument", roleData[key]);
        } else if (Array.isArray(roleData[key])) {
          formPayload.append(key, JSON.stringify(roleData[key]));
        } else {
          formPayload.append(key, roleData[key]);
        }
      });

      // Call context function with FormData
      const result = await registerUserWithRole(formPayload, true);

      if (result.success) {
        toast.success("Registration successful! Check your email to activate.");
        setTimeout(() => {
          handleConnectClick();
          setFormData({
            name: "",
            email: "",
            phone: "",
            role: "",
            country: "",
            city: "",
            state: "",
            companyName: "",
            registrationNumber: "",
            licenseDocument: "",
            website: "",
            certifications: "",
            warehouseAddress: "",
            operationalRegions: "",
            pharmacyName: "",
            licenseNumber: "",
            pharmacyLocation: "",
          });
        }, 3000);
      } else {
        toast.error(result.error || "Registration failed");
      }
    } catch (err) {
      toast.error(err.message || "Failed to register");
    }
  };

  const selectedRoleFields = roleFieldsConfig[formData.role] || [];

  return (
    <Modal
      isOpen={isRegisterModalOpen}
      onClose={closeRegisterModal}
      size="lg"
      className="max-w-xl"
    >
      <div className="px-4 overflow-y-auto max-h-[75vh]">
        <div className="flex flex-col items-center justify-center mb-6">
          <div className="p-4 mb-4 rounded-full bg-primary-100">
            <FaBuilding className="w-8 h-8 text-primary-600" />
          </div>
          <h2 className="mb-2 text-2xl font-bold text-gray-900">Register Your Account</h2>
          <p className="text-center text-gray-600">
            Fill in your details to register in the pharmaceutical supply chain.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input label="Full Name" name="name" value={formData.name} onChange={handleInputChange} required />
            <Select label="Role" name="role" value={formData.role} onChange={handleSelectChange} options={roles} required />
            <Input label="Email" type="email" name="email" value={formData.email} onChange={handleInputChange} required />
            <Input label="Phone" type="tel" name="phone" value={formData.phone} onChange={handleInputChange} required />
            <Input label="Country" name="country" value={formData.country} onChange={handleInputChange} required />
            <Input label="City" name="city" value={formData.city} onChange={handleInputChange} />
            <Input label="State" name="state" value={formData.state} onChange={handleInputChange} />
          </div>

          {selectedRoleFields.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Role-Specific Information</h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {selectedRoleFields.map((field) => (
                  <Input
                    key={field.name}
                    label={field.label}
                    name={field.name}
                    type={field.type}
                    value={field.type === "file" ? undefined : formData[field.name]}
                    onChange={handleInputChange}
                    required={field.required}
                    accept={field.accept}
                    placeholder={field.placeholder}
                  />
                ))}
              </div>
            </div>
          )}

          <div className="mt-6">
            <Button type="submit" variant="primary" className="w-full" disabled={isLoading || checkAccountLoading}>
              {isLoading ? "Processing..." : "Connect Wallet & Register"}
            </Button>
          </div>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 text-gray-500 bg-white">Already have an account?</span>
            </div>
          </div>

          <div className="mt-6">
            <button
              onClick={handleConnectClick}
              className="flex items-center justify-center w-full gap-2 px-4 py-2 transition-colors duration-200 border rounded-lg text-primary-600 border-primary-600 hover:bg-primary-50"
            >
              <FaWallet className="w-5 h-5" />
              Connect Existing Wallet
            </button>
          </div>
        </div>

        <div className="mt-6 text-sm text-center text-gray-600">
          By registering, you agree to our{" "}
          <a href="/terms" className="text-primary-600 hover:text-primary-700">
            Terms of Service
          </a>{" "}
          and{" "}
          <a href="/privacy" className="text-primary-600 hover:text-primary-700">
            Privacy Policy
          </a>
          .
        </div>
      </div>
    </Modal>
  );
};

export default RegisterWalletModal;
