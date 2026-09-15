const mongoose = require('mongoose');

const QUANTITY_UNITS = ['MEALS', 'KG', 'PACKETS', 'CONTAINERS'];

const distributionSchema = new mongoose.Schema(
  {
    assignmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Assignment',
      required: [true, 'Assignment ID is required'],
      unique: true,
    },
    beneficiaryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Beneficiary',
      required: [true, 'Beneficiary ID is required'],
    },
    distributedQuantity: {
      value: {
        type: Number,
        required: [true, 'Distributed quantity value is required'],
        min: [1, 'Distributed quantity must be at least 1'],
      },
      unit: {
        type: String,
        required: [true, 'Distributed quantity unit is required'],
        enum: QUANTITY_UNITS,
      },
    },
    peopleServed: {
      type: Number,
      required: [true, 'People served is required'],
      min: [1, 'People served must be at least 1'],
    },
    deliveryPhotoUrl: {
      type: String,
      trim: true,
      default: '',
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
    deliveredAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

distributionSchema.set('toJSON', {
  transform: function (doc, ret) {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

const Distribution = mongoose.model('Distribution', distributionSchema);

module.exports = Distribution;
