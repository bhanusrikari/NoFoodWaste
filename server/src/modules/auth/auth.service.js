const User = require('./auth.model');
const { generateToken } = require('./auth.utils');

class AuthService {
  async registerUser(userData) {
    const { name, email, password, role, phone } = userData;

    // Check duplicate email
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      const error = new Error('Email address is already registered');
      error.statusCode = 409;
      throw error;
    }

    // Create new user
    const newUser = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role: role.toUpperCase(),
      phone: phone ? phone.trim() : '',
    });

    return newUser.toJSON();
  }

  async loginUser(credentials) {
    const { email, password } = credentials;

    // Find user and explicitly select password
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');

    if (!user) {
      const error = new Error('Invalid email or password');
      error.statusCode = 401;
      throw error;
    }

    // Compare password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      const error = new Error('Invalid email or password');
      error.statusCode = 401;
      throw error;
    }

    // Generate JWT token
    const token = generateToken(user);
    const userJSON = user.toJSON();

    return {
      token,
      user: userJSON,
    };
  }

  async getUserById(userId) {
    const user = await User.findById(userId);
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }
    return user.toJSON();
  }

  async seedInitialUsers() {
    const defaultUsers = [
      {
        name: 'System Admin',
        email: 'admin@nofoodwaste.org',
        password: 'Admin123!',
        role: 'ADMIN',
        accountStatus: 'ACTIVE',
      },
      {
        name: 'Demo Donor',
        email: 'donor@nofoodwaste.org',
        password: 'Password123!',
        role: 'DONOR',
        accountStatus: 'ACTIVE',
      },
      {
        name: 'Demo Volunteer',
        email: 'volunteer@nofoodwaste.org',
        password: 'Password123!',
        role: 'VOLUNTEER',
        accountStatus: 'ACTIVE',
      },
      {
        name: 'Hope Orphanage Customer',
        email: 'customer@nofoodwaste.org',
        password: 'Password123!',
        role: 'CUSTOMER',
        accountStatus: 'ACTIVE',
      },
    ];

    for (const u of defaultUsers) {
      let existing = await User.findOne({ email: u.email });
      if (!existing) {
        await User.create(u);
      } else {
        existing.password = u.password;
        existing.accountStatus = 'ACTIVE';
        await existing.save();
      }
    }
  }
}

module.exports = new AuthService();
