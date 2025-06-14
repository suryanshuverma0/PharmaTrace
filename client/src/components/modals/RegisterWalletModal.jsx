import React, { useState } from "react";
import Modal from "../UI/Modal";
import Button from "../UI/Button";
import Input from "../UI/Input";
import Select from "../UI/Select";
import { FaUser, FaBuilding, FaWallet } from "react-icons/fa";
import { useAuth } from "../../context/authContext";
import { toast } from "react-hot-toast";

const RegisterWalletModal = ({ isOpen, onClose, onConnectClick }) => {
  const { connectWallet, registerUserWithRole, isLoading, user } = useAuth();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    role: "",
    registrationNumber: "",
    licenseDocument: "",
    website: "",
    headOfficeAddress: "",
    country: "",
    city: "",
  });

  const roles = [
    { value: "manufacturer", label: "Manufacturer" },
    { value: "distributor", label: "Distributor" },
    { value: "pharmacy", label: "Pharmacy" },
    { value: "consumer", label: "Consumer" },
  ];

  const handleInputChange = (e) => {
    const { name, value, files } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (!user?.address) {
        const connectResult = await connectWallet();
        if (!connectResult.success) {
          toast.error(connectResult.error || "Failed to connect wallet");
          return;
        }
      }

      if (!formData.role || !formData.name || !formData.email || !formData.phone) {
        toast.error("Please fill in all required fields");
        return;
      }

      const result = await registerUserWithRole(formData);

      if (result.success) {
        toast.success("Registration successful! Check your email to activate.");
        setTimeout(() => {
          onClose();
          setFormData({
            name: "",
            email: "",
            phone: "",
            role: "",
            registrationNumber: "",
            licenseDocument: "",
            website: "",
            headOfficeAddress: "",
            country: "",
            city: "",
          });
        }, 3000);
      } else {
        toast.error(result.error || "Registration failed");
      }
    } catch (err) {
      toast.error(err.message || "Failed to register");
    }
  };

  const handleConnectClick = () => {
    onClose();
    if (onConnectClick) {
      onConnectClick();
    }
  };

  const isManufacturer = formData.role === "manufacturer";

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-2xl">
      <div className="px-4 overflow-y-auto max-h-[75vh]">
        <div className="flex flex-col items-center justify-center mb-6">
          <div className="p-4 mb-4 rounded-full bg-primary-100">
            <FaBuilding className="w-8 h-8 text-primary-600" />
          </div>
          <h2 className="mb-2 text-2xl font-bold text-gray-900">
            Register Your Account
          </h2>
          <p className="text-center text-gray-600">
            Fill in your details to register in the pharmaceutical supply chain.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input label="Full Name" name="name" value={formData.name} onChange={handleInputChange} required />
            <Select
              label="Role"
              name="role"
              value={formData.role}
              onChange={(value) => handleInputChange({ target: { name: "role", value } })}
              options={roles}
              required
            />
            <Input label="Email" type="email" name="email" value={formData.email} onChange={handleInputChange} required />
            <Input label="Phone" type="tel" name="phone" value={formData.phone} onChange={handleInputChange} required />
          </div>

          {isManufacturer && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Input label="Registration Number" name="registrationNumber" value={formData.registrationNumber} onChange={handleInputChange} />
                <Input label="Website" type="url" name="website" value={formData.website} onChange={handleInputChange} placeholder="https://" />
              </div>
              <Input label="License Document" type="file" name="licenseDocument" onChange={handleInputChange} accept=".pdf,.doc,.docx" />
              <Input label="Head Office Address" name="headOfficeAddress" value={formData.headOfficeAddress} onChange={handleInputChange} />
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Input label="Country" name="country" value={formData.country} onChange={handleInputChange} />
                <Input label="City" name="city" value={formData.city} onChange={handleInputChange} />
              </div>
            </div>
          )}

          <div className="mt-6">
            <Button type="submit" variant="primary" className="w-full" disabled={isLoading}>
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
          <a href="/terms" className="text-primary-600 hover:text-primary-700">Terms of Service</a> and{" "}
          <a href="/privacy" className="text-primary-600 hover:text-primary-700">Privacy Policy</a>.
        </div>
      </div>
    </Modal>
  );
};

export default RegisterWalletModal;
