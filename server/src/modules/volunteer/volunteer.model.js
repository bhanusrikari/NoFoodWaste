const mongoose = require('mongoose');

const volunteerSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      unique: true,
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    availability: {
      type: String,
      enum: {
        values: ['AVAILABLE', 'BUSY', 'UNAVAILABLE'],
        message: 'Availability must be AVAILABLE, BUSY, or UNAVAILABLE',
      },
      default: 'AVAILABLE',
    },
    currentLocation: {
      latitude: { type: Number, default: null },
      longitude: { type: Number, default: null },
      updatedAt: { type: Date, default: null },
    },
    trainingStatus: {
      type: String,
      enum: {
        values: ['PENDING', 'COMPLETED'],
        message: 'Training status must be PENDING or COMPLETED',
      },
      default: 'PENDING',
    },
    certificationStatus: {
      type: String,
      enum: {
        values: ['PENDING', 'CERTIFIED'],
        message: 'Certification status must be PENDING or CERTIFIED',
      },
      default: 'PENDING',
    },
    totalTasks: {
      type: Number,
      default: 0,
      min: 0,
    },
    completedTasks: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalMealsDelivered: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalDistance: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

volunteerSchema.set('toJSON', {
  transform: function (doc, ret) {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

const Volunteer = mongoose.model('Volunteer', volunteerSchema);

module.exports = Volunteer;
