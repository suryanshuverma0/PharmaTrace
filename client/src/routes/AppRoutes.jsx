import React from "react";
import { Routes, Route } from "react-router-dom";

// Layouts
import PublicLayout from "../layout/PublicLayout";
import ConsumerLayout from "../layout/ConsumerLayout";

// Public Pages
import LandingPage from "../pages/LandingPage";
import AboutPage from "../pages/home/AboutPage";
import FeaturePage from "../pages/home/FeaturePage";
import LoginPage from "../pages/auth/LoginPage";

// Consumer Pages
import ConsumerDashboard from "../pages/consumer/ConsumerDashboard";
import VerifyDrug from "../pages/consumer/VerifyDrug";
import JourneyDetails from "../pages/consumer/JourneyDetails";


const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<PublicLayout />}>
        <Route index element={<LandingPage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="feature" element={<FeaturePage />} />
        <Route path="login" element={<LoginPage />} />
      </Route>

      {/* Consumer Routes */}
      <Route path="/consumer" element={<ConsumerLayout />}>
        <Route index element={<ConsumerDashboard />} />
        <Route path="dashboard" element={<ConsumerDashboard />} />
        <Route path="verify" element={<VerifyDrug />} />
        <Route path="journey/:drugId" element={<JourneyDetails />} />
        <Route path="vault" element={<div></div>} />
        <Route path="history" element={<div></div>} />
        <Route path="settings" element={<div></div>} />
      </Route>

      {/* Add routes for manufacturer, distributor, etc. similarly */}
    </Routes>
  );
};

export default AppRoutes;
