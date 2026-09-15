const validateRegisterInput = (data) => {
  const errors = [];
  const { name, email, password, role } = data;

  if (!name || typeof name !== 'string' || name.trim() === '') {
    errors.push('Name is required');
  }

  if (!email || typeof email !== 'string' || email.trim() === '') {
    errors.push('Email is required');
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      errors.push('Invalid email format');
    }
  }

  if (!password || typeof password !== 'string') {
    errors.push('Password is required');
  } else if (password.length < 6) {
    errors.push('Password must be at least 6 characters long');
  }

  if (!role || typeof role !== 'string') {
    errors.push('Role is required');
  } else if (!['DONOR', 'VOLUNTEER', 'CUSTOMER'].includes(role.toUpperCase())) {
    if (role.toUpperCase() === 'ADMIN') {
      errors.push('Public registration for ADMIN role is not allowed');
    } else {
      errors.push('Role must be DONOR, VOLUNTEER, or CUSTOMER');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

const validateLoginInput = (data) => {
  const errors = [];
  const { email, password } = data;

  if (!email || typeof email !== 'string' || email.trim() === '') {
    errors.push('Email is required');
  }

  if (!password || typeof password !== 'string' || password === '') {
    errors.push('Password is required');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

module.exports = {
  validateRegisterInput,
  validateLoginInput,
};
