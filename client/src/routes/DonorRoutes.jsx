import React from 'react';
import { Routes, Route } from 'react-router-dom';
import DonorDashboard from '../pages/DonorDashboard';
import AvailableRequirements from '../pages/donor/AvailableRequirements';
import CreateDonationFlow from '../pages/donor/CreateDonationFlow';
import MyFulfillments from '../pages/donor/MyFulfillments';
import FulfillmentDetail from '../pages/donor/FulfillmentDetail';
import DonationInterests from '../pages/donor/DonationInterests';

const DonorRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<DonorDashboard />} />
      <Route path="/requirements" element={<AvailableRequirements />} />
      <Route path="/donate" element={<CreateDonationFlow />} />
      <Route path="/donations/:id/interests" element={<DonationInterests />} />
      <Route path="/fulfillments" element={<MyFulfillments />} />
      <Route path="/fulfillments/:id" element={<FulfillmentDetail />} />
    </Routes>
  );
};

export default DonorRoutes;
