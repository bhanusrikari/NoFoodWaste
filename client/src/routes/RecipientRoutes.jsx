import React from 'react';
import { Routes, Route } from 'react-router-dom';
import RecipientDashboard from '../pages/recipient/RecipientDashboard';
import CreateRequirement from '../pages/recipient/CreateRequirement';

const RecipientRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<RecipientDashboard />} />
      <Route path="/create-requirement" element={<CreateRequirement />} />
    </Routes>
  );
};

export default RecipientRoutes;
