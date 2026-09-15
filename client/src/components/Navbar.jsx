import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../features/auth/authContext';
import DonorNavLinks from './navigation/DonorNavLinks';
import RecipientNavLinks from './navigation/RecipientNavLinks';
import NotificationBell from './notifications/NotificationBell';

const Navbar = () => {
  const { currentUser, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRoleLabel = (role) => {
    if (role === 'CUSTOMER') return 'Food Recipient';
    if (role === 'DONOR') return 'Donor';
    if (role === 'VOLUNTEER') return 'Volunteer';
    if (role === 'ADMIN') return 'NGO Admin';
    return role;
  };

  return (
    <nav className="navbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
        <Link to="/" className="navbar-brand">
          NoFoodWaste
        </Link>

        {isAuthenticated && currentUser?.role === 'DONOR' && <DonorNavLinks />}
        {isAuthenticated && currentUser?.role === 'CUSTOMER' && <RecipientNavLinks />}
      </div>

      <div className="navbar-user">
        {isAuthenticated ? (
          <>
            <NotificationBell isAuthenticated={isAuthenticated} />

            <div>
              <span>Welcome, <strong>{currentUser.name}</strong></span>{' '}
              <span className={`user-badge ${currentUser.role.toLowerCase()}`}>
                {getRoleLabel(currentUser.role)}
              </span>
            </div>

            <button
              onClick={handleLogout}
              className="btn btn-secondary"
              style={{
                padding: '0.4rem 0.8rem',
                fontSize: '0.85rem'
              }}
            >
              Logout
            </button>
          </>
        ) : (
          <div style={{ display: 'flex', gap: '1rem' }}>
            <Link
              to="/login"
              className="btn btn-outline"
              style={{
                padding: '0.4rem 0.8rem',
                fontSize: '0.9rem'
              }}
            >
              Login
            </Link>

            <Link
              to="/register"
              className="btn btn-primary"
              style={{
                padding: '0.4rem 0.8rem',
                fontSize: '0.9rem'
              }}
            >
              Register
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;