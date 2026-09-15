import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const DonorNavLinks = () => {
  const location = useLocation();

  return (
    <div className="navbar-nav">
      <Link to="/donor" className={`nav-link ${location.pathname === '/donor' ? 'active' : ''}`}>
        Dashboard
      </Link>
      <Link to="/donor/requirements" className={`nav-link ${location.pathname === '/donor/requirements' ? 'active' : ''}`}>
        Fulfill Requests
      </Link>
      <Link to="/donor/donate" className={`nav-link ${location.pathname === '/donor/donate' ? 'active' : ''}`}>
        Donate Food
      </Link>
      <Link to="/donor/fulfillments" className={`nav-link ${location.pathname === '/donor/fulfillments' ? 'active' : ''}`}>
        My Activity
      </Link>
    </div>
  );
};

export default DonorNavLinks;
