const mongoose = require('mongoose');

const BENEFICIARY_TYPES = [
  'NGO',
  'SHELTER',
  'CHILDREN_HOME',
  'COMMUNITY_CENTER',
  'OTHER',
];

const beneficiarySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Beneficiary name is required'],
      trim: true,
    },
    type: {
      type: String,
      required: [true, 'Beneficiary type is required'],
      enum: {
        values: BENEFICIARY_TYPES,
        message: `Type must be one of: ${BENEFICIARY_TYPES.join(', ')}`,
      },
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    address: {
      type: String,
      required: [true, 'Address is required'],
      trim: true,
    },
    location: {
      latitude: { type: Number, default: null },
      longitude: { type: Number, default: null },
    },
    verified: {
      type: Boolean,
      default: false,
    },
    // Optional link to User account if the beneficiary has a login
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

beneficiarySchema.set('toJSON', {
  transform: function (doc, ret) {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

const Beneficiary = mongoose.model('Beneficiary', beneficiarySchema);

Beneficiary.TYPES = BENEFICIARY_TYPES;

module.exports = Beneficiary;
