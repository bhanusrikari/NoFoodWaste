const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema(
  {
    vehicleId: {
      type: String,
      unique: true,
      trim: true,
    },
    vehicleNumber: {
      type: String,
      required: [true, 'Vehicle number is required'],
      trim: true,
      uppercase: true,
    },
    vehicleType: {
      type: String,
      required: [true, 'Vehicle type is required'],
      enum: {
        values: ['Two Wheeler', 'Three Wheeler', 'Four Wheeler', 'Mini Truck', 'Van'],
        message: 'Invalid vehicle type',
      },
      default: 'Two Wheeler',
    },
    capacity: {
      type: Number,
      required: [true, 'Meal capacity is required'],
      min: [1, 'Capacity must be at least 1 meal'],
    },
    status: {
      type: String,
      enum: {
        values: ['AVAILABLE', 'ASSIGNED', 'IN_USE', 'UNAVAILABLE'],
        message: 'Invalid vehicle status',
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
    assignedVolunteer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    assignedVolunteerName: {
      type: String,
      trim: true,
      default: '',
    },
    currentDelivery: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Delivery',
      default: null,
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

// Pre-save hook to generate vehicleId
vehicleSchema.pre('save', async function (next) {
  if (!this.vehicleId) {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const timestampSuffix = Date.now().toString().slice(-4);
    this.vehicleId = `VEH-${timestampSuffix}${randomSuffix}`;
  }
  next();
});

vehicleSchema.set('toJSON', {
  transform: function (doc, ret) {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

const Vehicle = mongoose.model('Vehicle', vehicleSchema);

module.exports = Vehicle;
