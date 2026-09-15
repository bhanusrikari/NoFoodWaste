import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const RecipientNavLinks = () => {
  const location = useLocation();

  return (
    <div className="navbar-nav">
      <Link to="/recipient" className={`nav-link ${location.pathname === '/recipient' ? 'active' : ''}`}>
        Dashboard
      </Link>
      <Link to="/recipient/create-requirement" className={`nav-link ${location.pathname === '/recipient/create-requirement' ? 'active' : ''}`}>
        Post Food Need
      </Link>
    </div>
  );
};

export default RecipientNavLinks;
