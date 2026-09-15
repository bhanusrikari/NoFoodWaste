const mongoose = require('mongoose');

const fulfillmentSchema = new mongoose.Schema(
  {
    fulfillmentId: {
      type: String,
      unique: true,
      required: true,
    },
    requirement: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FoodRequirement',
    },
    donation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Donation',
    },
    donor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    recipientName: {
      type: String,
      required: true,
      trim: true,
    },
    recipientLocation: {
      type: String,
      required: true,
      trim: true,
    },
    deliveryMethod: {
      type: String,
      enum: ['DIRECT', 'VOLUNTEER_REQUIRED'],
      required: [true, 'Delivery method is required (DIRECT or VOLUNTEER_REQUIRED)'],
    },
    status: {
      type: String,
      enum: [
        'BENEFICIARY_PENDING',
        'BENEFICIARY_ACCEPTED',
        'BENEFICIARY_REJECTED',
        'MATCHED',
        'DELIVERY_METHOD_SELECTED',
        'VOLUNTEER_REQUESTED',
        'VOLUNTEER_ASSIGNED',
        'PICKUP_IN_PROGRESS',
        'COLLECTED',
        'SAFETY_VERIFICATION',
        'SAFETY_APPROVED',
        'SAFETY_REJECTED',
        'IN_TRANSIT',
        'DELIVERED',
        'ACKNOWLEDGED',
        'COMPLETED',
        'CANCELLED',
      ],
      default: 'MATCHED',
    },
    volunteer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    vehicleInfo: {
      type: String,
      default: '',
    },
    pickupAddress: {
      type: String,
      required: true,
    },
    pickupWindow: {
      type: String,
      default: '09:00 - 21:00',
    },
    foodSummary: {
      foodType: { type: String, required: true },
      cuisine: { type: String, default: 'Mixed' },
      quantity: { type: Number, required: true },
      unit: { type: String, default: 'Meals' },
      foodItems: { type: String, default: 'Food items' },
      expiry: { type: Date },
    },
    safetyVerification: {
      isVerified: { type: Boolean, default: false },
      verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      verifiedAt: { type: Date },
      hygieneCheck: { type: String, enum: ['Pass', 'Fail'], default: 'Pass' },
      freshnessCheck: { type: String, enum: ['Pass', 'Fail'], default: 'Pass' },
      temperatureCheck: { type: String, default: 'Normal' },
      packagingCondition: { type: String, enum: ['Intact', 'Damaged'], default: 'Intact' },
      notes: { type: String, default: '' },
      result: { type: String, enum: ['APPROVED', 'REJECTED'] },
    },
    acknowledgement: {
      isAcknowledged: { type: Boolean, default: false },
      acknowledgedBy: { type: String, default: '' },
      acknowledgedAt: { type: Date },
      receivedQuantity: { type: Number },
      note: { type: String, default: '' },
    },
  },
  {
    timestamps: true,
  }
);

fulfillmentSchema.set('toJSON', {
  transform: function (doc, ret) {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('Fulfillment', fulfillmentSchema);
