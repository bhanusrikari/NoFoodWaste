const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },

    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters long'],
      select: false,
    },

    role: {
      type: String,
      required: [true, 'Role is required'],
      enum: {
        values: ['DONOR', 'VOLUNTEER', 'ADMIN', 'CUSTOMER'],
        message: 'Role must be DONOR, VOLUNTEER, ADMIN, or CUSTOMER',
      },
    },

    phone: {
      type: String,
      trim: true,
      default: '',
    },
    verificationStatus: {
      type: String,
      enum: {
        values: ['PENDING_VERIFICATION', 'VERIFIED', 'REJECTED'],
        message: 'Invalid verification status',
      },
      default: 'VERIFIED',
    },
    rejectionReason: {
      type: String,
      trim: true,
      default: '',
    },
    availabilityStatus: {
      type: String,
      enum: {
        values: ['AVAILABLE', 'ASSIGNED', 'ON_DELIVERY', 'OFFLINE'],
        message: 'Invalid availability status',
      },
      default: 'AVAILABLE',
    },
    accountStatus: {
      type: String,
      enum: {
        values: ['ACTIVE', 'INACTIVE'],
        message: 'Invalid account status',
      },
      default: 'ACTIVE',
    },
    vehicleType: {
      type: String,
      enum: {
        values: ['Two Wheeler', 'Three Wheeler', 'Four Wheeler', 'Van', 'None'],
        message: 'Invalid vehicle type',
      },
      default: 'Two Wheeler',
    },
    vehicleNumber: {
      type: String,
      trim: true,
      default: 'TS 09 EQ 4521',
    },
    city: {
      type: String,
      trim: true,
      default: 'Hyderabad',
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Compare entered password with hashed password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);