const mongoose = require('mongoose');

const QUANTITY_UNITS = ['MEALS', 'KG', 'PACKETS', 'CONTAINERS'];

const collectionSchema = new mongoose.Schema(
  {
    assignmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Assignment',
      required: [true, 'Assignment ID is required'],
      unique: true,
    },
    volunteerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Volunteer ID is required'],
    },
    expectedQuantity: {
      value: {
        type: Number,
        required: [true, 'Expected quantity value is required'],
        min: [1, 'Expected quantity must be at least 1'],
      },
      unit: {
        type: String,
        required: [true, 'Expected quantity unit is required'],
        enum: QUANTITY_UNITS,
      },
    },
    collectedQuantity: {
      value: {
        type: Number,
        required: [true, 'Collected quantity value is required'],
        min: [1, 'Collected quantity must be at least 1'],
      },
      unit: {
        type: String,
        required: [true, 'Collected quantity unit is required'],
        enum: QUANTITY_UNITS,
      },
    },
    foodSafety: {
      preparationTime: { type: String, default: '' },
      temperature: { type: Number, default: null },
      temperatureUnit: { type: String, default: 'C' },
      temperatureChecked: { type: Boolean, default: false },
      properlyPacked: { type: Boolean, default: false },
      packagingIntact: { type: Boolean, default: false },
      noVisibleContamination: { type: Boolean, default: false },
      notes: { type: String, trim: true, default: '' },
    },
    collectionPhotoUrl: {
      type: String,
      trim: true,
      default: '',
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    verifiedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

collectionSchema.set('toJSON', {
  transform: function (doc, ret) {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

const Collection = mongoose.model('Collection', collectionSchema);

module.exports = Collection;
