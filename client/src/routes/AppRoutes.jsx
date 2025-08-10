import PharmacyLayout from '../layout/PharmacyLayout';
import PharmacyDashboard from '../pages/pharmacy/PharmacyDashboard';
import ExpiryAlerts from '../pages/pharmacy/ExpiryAlerts';
import Inventory from '../pages/pharmacy/Inventory';

import React from 'react';
import { Routes, Route } from 'react-router-dom';

// Layouts
import PublicLayout from '../layout/PublicLayout';
import ConsumerLayout from '../layout/ConsumerLayout';
import ManufacturerLayout from '../layout/ManufacturerLayout';
import DistributorLayout from '../layout/DistributorLayout';
import ProtectedRoute from './ProtectedRoute';

// Public Pages
import LandingPage from '../pages/LandingPage';
import AboutPage from '../pages/home/AboutPage';
import FeaturePage from '../pages/home/FeaturePage';
import LoginPage from '../pages/auth/LoginPage';
import AccountActivation from '../pages/auth/AccountActivation';
import RegisterPage from '../pages/auth/RegisterPage';
import UnauthorizedPage from '../pages/UnauthorizedPage';

// Consumer Pages
import ConsumerDashboard from '../pages/consumer/ConsumerDashboard';
import VerifyDrug from '../pages/consumer/VerifyDrug';
import JourneyDetails from '../pages/consumer/JourneyDetails';

// Manufacturer Pages
import ManufacturerDashboard from '../pages/manufacturer/ManufacturerDashboard';
import RegisterProduct from '../pages/manufacturer/RegisterProduct';
import RegisterBatch from '../pages/manufacturer/RegisterBatch';
import RegisteredBatch from '../pages/manufacturer/RegisteredBatch';
import ProductsList from '../pages/manufacturer/ProductsList';
import TrackProducts from '../pages/manufacturer/TrackProducts';
import QRCodeManager from '../pages/manufacturer/QRCodeManager';

// Distributor Pages
import DistributorDashboard from '../pages/distributor/DistributorDashboard';
import AssignedBatches from '../pages/distributor/AssignedBatches';
import AcknowledgeShipment from '../pages/distributor/AcknowledgeShipment';
import InventoryManagement from '../pages/distributor/InventoryManagement';
import DistributeToPharmacists from '../pages/distributor/DistributeToPharmacists';
import TrackTransfers from '../pages/distributor/TrackTransfers';
import AssignBatch from '../pages/manufacturer/AssignBatch';

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<PublicLayout />}>
        <Route index element={<LandingPage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="feature" element={<FeaturePage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="activate-account" element={<AccountActivation />} />
        <Route path="connect" element={<RegisterPage />} />
        <Route path="verify-product" element={<VerifyDrug />} />
        <Route path="consumer/journey/:serialNumber" element={<JourneyDetails />} />
        <Route path="unauthorized" element={<UnauthorizedPage />} />
      </Route>

      {/* Consumer Routes */}
      <Route path="/consumer" element={<ConsumerLayout />}>
        <Route index element={<ConsumerDashboard />} />
        <Route path="dashboard" element={<ConsumerDashboard />} />
        <Route path="verify" element={<VerifyDrug />} />
        <Route path="journey/:serialNumber" element={<JourneyDetails />} />
        <Route path="vault" element={<div>Vault Placeholder</div>} />
        <Route path="history" element={<div>History Placeholder</div>} />
        <Route path="settings" element={<div>Settings Placeholder</div>} />
      </Route>

      {/* Manufacturer Routes */}
      <Route element={<ProtectedRoute allowedRoles={['manufacturer']} />}>
        <Route path="/manufacturer" element={<ManufacturerLayout />}>
          <Route index element={<ManufacturerDashboard />} />
          <Route path="dashboard" element={<ManufacturerDashboard />} />
          <Route path="register" element={<RegisterProduct />} />
          <Route path="register/batch" element={<RegisterBatch />} />
          <Route path="registered-batches" element={<RegisteredBatch />} />
          <Route path="products" element={<ProductsList />} />
          <Route path="assign-batch" element={<AssignBatch />} />
          <Route path="assigned-batches" element={<AssignedBatches />} />
          <Route path="track" element={<TrackProducts />} />
          <Route path="track/:serialNumber" element={<TrackProducts />} />
          <Route path="qr-codes" element={<QRCodeManager />} />
          <Route path="settings" element={<div>Settings Placeholder</div>} />
        </Route>
      </Route>

      {/* Distributor Routes */}
      <Route element={<ProtectedRoute allowedRoles={['distributor']} />}>
        <Route path="/distributor" element={<DistributorLayout />}>
          <Route index element={<DistributorDashboard />} />
          <Route path="dashboard" element={<DistributorDashboard />} />
          <Route path="assigned-batches" element={<AssignedBatches />} />
          <Route path="acknowledge-shipment" element={<AcknowledgeShipment />} />
          <Route path="inventory" element={<InventoryManagement />} />
          <Route path="distribute" element={<DistributeToPharmacists />} />
          <Route path="track-transfers" element={<TrackTransfers />} />
          <Route path="verify" element={<VerifyDrug />} />
          <Route path="track" element={<TrackProducts />} />
          <Route path="track/:serialNumber" element={<TrackProducts />} />
        </Route>
      </Route>

            {/* Pharmacy Routes */}
      {/* <Route element={<ProtectedRoute allowedRoles={['pharmacy']} />}> */}
        <Route path="/pharmacy" element={<PharmacyLayout />}>
          <Route index element={<PharmacyDashboard />} />
          <Route path="dashboard" element={<PharmacyDashboard />} />
          <Route path="inventory" element={<Inventory />} />
          <Route path="verify" element={<VerifyDrug />} />
          <Route path="expiry-alerts" element={<ExpiryAlerts />} />
        </Route>
      {/* </Route> */}


    </Routes>
  );
};

export default AppRoutes;
