import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../features/auth/authContext';

const Navbar = () => {
  const { currentUser, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
        <Link to="/" className="navbar-brand">
          NoFoodWaste
        </Link>

        {isAuthenticated && currentUser?.role === 'CUSTOMER' && (
          <div style={{ display: 'flex', gap: '1.25rem', fontSize: '0.9rem', fontWeight: 500 }}>
            <Link to="/customer" style={{ color: '#374151' }}>
              Dashboard
            </Link>
            <Link to="/customer/request-food" style={{ color: '#374151' }}>
              Request Food
            </Link>
            <Link to="/customer/requests" style={{ color: '#374151' }}>
              My Requests
            </Link>
          </div>
        )}
      </div>

      <div className="navbar-user">
        {isAuthenticated ? (
          <>
            <div>
              <span>Welcome, <strong>{currentUser.name}</strong></span>{' '}
              <span className="user-badge">{currentUser.role}</span>
            </div>
            <button onClick={handleLogout} className="btn btn-secondary">
              Logout
            </button>
          </>
        ) : (
          <div style={{ display: 'flex', gap: '1rem' }}>
            <Link to="/login" style={{ fontWeight: 600 }}>
              Login
            </Link>
            <Link to="/register" style={{ fontWeight: 600, color: '#10b981' }}>
              Register
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
