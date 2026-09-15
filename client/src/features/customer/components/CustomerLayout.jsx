import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';

const CustomerLayout = () => {
  return (
    <div className="customer-layout">
      <div className="customer-nav-bar">
        <div className="container" style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          <NavLink
            to="/customer"
            end
            className={({ isActive }) => (isActive ? 'customer-nav-link active' : 'customer-nav-link')}
          >
            Dashboard
          </NavLink>
          <NavLink
            to="/customer/request-food"
            className={({ isActive }) => (isActive ? 'customer-nav-link active' : 'customer-nav-link')}
          >
            Request Food
          </NavLink>
          <NavLink
            to="/customer/requests"
            className={({ isActive }) => (isActive ? 'customer-nav-link active' : 'customer-nav-link')}
          >
            My Requests
          </NavLink>
          <NavLink
            to="/customer/donations"
            className={({ isActive }) => (isActive ? 'customer-nav-link active' : 'customer-nav-link')}
          >
            Available Food
          </NavLink>
          <NavLink
            to="/customer/donations/interests"
            className={({ isActive }) => (isActive ? 'customer-nav-link active' : 'customer-nav-link')}
          >
            My Interests
          </NavLink>
        </div>
      </div>
      <main>
        <Outlet />
      </main>
    </div>
  );
};

export default CustomerLayout;
