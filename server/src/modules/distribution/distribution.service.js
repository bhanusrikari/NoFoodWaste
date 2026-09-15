const Distribution = require('./distribution.model');
const Assignment = require('../assignment/assignment.model');
const Collection = require('../collection/collection.model');

class DistributionService {
  /**
   * Create a distribution record
   */
  async createDistribution(data, volunteerId) {
    const { assignmentId, distributedQuantity, peopleServed, deliveryPhotoUrl, notes } = data;

    // Verify assignment
    const assignment = await Assignment.findById(assignmentId);

    if (!assignment) {
      const error = new Error('Assignment not found');
      error.statusCode = 404;
      throw error;
    }

    if (assignment.volunteerId.toString() !== volunteerId.toString()) {
      const error = new Error('You are not authorized to access this assignment');
      error.statusCode = 403;
      throw error;
    }

    if (assignment.status !== 'IN_TRANSIT') {
      const error = new Error(
        `Cannot create distribution. Assignment status is "${assignment.status}", expected "IN_TRANSIT".`
      );
      error.statusCode = 400;
      throw error;
    }

    // Check for duplicate distribution
    const existingDistribution = await Distribution.findOne({ assignmentId });
    if (existingDistribution) {
      const error = new Error('Distribution has already been recorded for this assignment');
      error.statusCode = 409;
      throw error;
    }

    // Parse distributedQuantity if provided as string or object
    let parsedDistributedQuantity = distributedQuantity;
    if (typeof distributedQuantity === 'string') {
      try {
        parsedDistributedQuantity = JSON.parse(distributedQuantity);
      } catch (e) {
        parsedDistributedQuantity = {
          value: Number(distributedQuantity),
          unit: assignment.quantity.unit,
        };
      }
    }

    if (
      !parsedDistributedQuantity ||
      typeof parsedDistributedQuantity.value !== 'number' ||
      parsedDistributedQuantity.value < 1
    ) {
      const error = new Error('Distributed quantity value must be a number greater than or equal to 1');
      error.statusCode = 400;
      throw error;
    }

    // Validate against collection
    const collection = await Collection.findOne({ assignmentId });
    const collectedValue = collection
      ? collection.collectedQuantity.value
      : assignment.quantity.value;
    const collectedUnit = collection
      ? collection.collectedQuantity.unit
      : assignment.quantity.unit;

    const distributedUnit = parsedDistributedQuantity.unit || collectedUnit;
    if (distributedUnit !== collectedUnit) {
      const error = new Error(
        `Distributed quantity unit "${distributedUnit}" must match collected quantity unit "${collectedUnit}"`
      );
      error.statusCode = 400;
      throw error;
    }

    // Validate: distributed quantity must not exceed collected quantity
    if (parsedDistributedQuantity.value > collectedValue) {
      const error = new Error(
        `Distributed quantity (${parsedDistributedQuantity.value}) cannot exceed collected quantity (${collectedValue})`
      );
      error.statusCode = 400;
      throw error;
    }

    const numPeopleServed = Number(peopleServed);
    if (!numPeopleServed || numPeopleServed < 1) {
      const error = new Error('People served must be at least 1');
      error.statusCode = 400;
      throw error;
    }

    const distribution = await Distribution.create({
      assignmentId,
      beneficiaryId: assignment.beneficiaryId,
      distributedQuantity: {
        value: parsedDistributedQuantity.value,
        unit: distributedUnit,
      },
      peopleServed: numPeopleServed,
      deliveryPhotoUrl: deliveryPhotoUrl || '',
      notes: notes || '',
      deliveredAt: new Date(),
    });

    return distribution.toJSON();
  }

  /**
   * Get distribution by assignment ID
   */
  async getByAssignmentId(assignmentId) {
    const distribution = await Distribution.findOne({ assignmentId });
    return distribution ? distribution.toJSON() : null;
  }
}

module.exports = new DistributionService();
