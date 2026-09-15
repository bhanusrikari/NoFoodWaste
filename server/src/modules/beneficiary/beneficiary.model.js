const mongoose = require('mongoose');

const beneficiarySchema = new mongoose.Schema(
  {
    beneficiaryId: {
      type: String,
      unique: true,
      trim: true,
    },
    organizationName: {
      type: String,
      required: [true, 'Organization name is required'],
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: {
        values: [
          'Orphanage',
          "Children's Home",
          'Shelter',
          'NGO',
          'Community Center',
          'Old-Age Home',
          'Other',
        ],
        message: 'Invalid beneficiary category',
      },
    },
    contactPerson: {
      type: String,
      required: [true, 'Contact person name is required'],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: '',
    },
    location: {
      type: String,
      required: [true, 'Location/Address is required'],
      trim: true,
    },
    city: {
      type: String,
      trim: true,
      default: 'Hyderabad',
    },
    peopleServed: {
      type: Number,
      required: [true, 'Number of people served is required'],
      min: [1, 'Number of people served must be at least 1'],
    },
    verificationStatus: {
      type: String,
      enum: {
        values: ['PENDING_VERIFICATION', 'VERIFIED', 'REJECTED'],
        message: 'Invalid verification status',
      },
      default: 'PENDING_VERIFICATION',
    },
    rejectionReason: {
      type: String,
      trim: true,
      default: '',
    },
    accountStatus: {
      type: String,
      enum: {
        values: ['ACTIVE', 'INACTIVE'],
        message: 'Invalid account status',
      },
      default: 'ACTIVE',
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook to generate beneficiaryId
beneficiarySchema.pre('save', async function (next) {
  if (!this.beneficiaryId) {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const timestampSuffix = Date.now().toString().slice(-4);
    this.beneficiaryId = `BEN-${timestampSuffix}${randomSuffix}`;
  }
  next();
});

beneficiarySchema.set('toJSON', {
  transform: function (doc, ret) {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

const Beneficiary = mongoose.model('Beneficiary', beneficiarySchema);

module.exports = Beneficiary;
