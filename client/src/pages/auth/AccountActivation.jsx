import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import apiClient from "../../services/api/api";
import Alert from "../../components/UI/Alert";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

const AccountActivation = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [status, setStatus] = useState("validating");
  const [error, setError] = useState("");

  useEffect(() => {
    const activateAccount = async () => {
      const token = searchParams.get("token");

      if (!token) {
        setStatus("error");
        setError("Invalid activation link.");
        return;
      }

      try {
        await apiClient.get(`/auth/activate-account/${token}`);
        setStatus("success");

        setTimeout(() => {
          navigate("/", { state: { openConnectModal: true } });
        }, 3000);
      } catch (err) {
        setStatus("error");
        setError(err?.response?.data?.message || "Failed to activate account.");
      }
    };

    activateAccount();
  }, [searchParams, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen px-4 py-12 bg-gradient-to-br from-white via-gray-100 to-gray-200 sm:px-6 lg:px-8">
      <div className="w-full max-w-md p-6 space-y-6 bg-white shadow-xl rounded-xl animate-fade-in">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">Account Activation</h2>
          <p className="mt-1 text-sm text-gray-500">Verifying your token...</p>
        </div>

        {status === "validating" && (
          <div className="flex flex-col items-center justify-center gap-3 py-6 text-gray-700">
            <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
            <p>Activating your account...</p>
          </div>
        )}

        {status === "success" && (
          <Alert type="success" title="Activation Successful">
            <div className="flex items-center gap-2">
              <span>Your account has been successfully activated! Redirecting to login...</span>
            </div>
          </Alert>
        )}

        {status === "error" && (
          <Alert type="error" title="Activation Failed">
            <div className="flex items-center gap-2">
              <span>{error}</span>
            </div>
          </Alert>
        )}
      </div>
    </div>
  );
};

export default AccountActivation;
