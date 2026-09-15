const Collection = require('./collection.model');
const Assignment = require('../assignment/assignment.model');

class CollectionService {
  /**
   * Create a collection record with safety verification data
   */
  async createCollection(data, volunteerId) {
    const { assignmentId, collectedQuantity, foodSafety, collectionPhotoUrl } = data;

    // Verify assignment exists, belongs to volunteer, and is in PICKUP_STARTED
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

    if (assignment.status !== 'PICKUP_STARTED') {
      const error = new Error(
        `Cannot create collection. Assignment status is "${assignment.status}", expected "PICKUP_STARTED".`
      );
      error.statusCode = 400;
      throw error;
    }

    // Check for duplicate collection
    const existingCollection = await Collection.findOne({ assignmentId });
    if (existingCollection) {
      const error = new Error('Collection has already been recorded for this assignment');
      error.statusCode = 409;
      throw error;
    }

    // Parse collectedQuantity if provided as string or object
    let parsedCollectedQuantity = collectedQuantity;
    if (typeof collectedQuantity === 'string') {
      try {
        parsedCollectedQuantity = JSON.parse(collectedQuantity);
      } catch (e) {
        parsedCollectedQuantity = { value: Number(collectedQuantity), unit: assignment.quantity.unit };
      }
    }

    if (
      !parsedCollectedQuantity ||
      typeof parsedCollectedQuantity.value !== 'number' ||
      parsedCollectedQuantity.value < 1
    ) {
      const error = new Error('Collected quantity value must be a number greater than or equal to 1');
      error.statusCode = 400;
      throw error;
    }

    const collectedUnit = parsedCollectedQuantity.unit || assignment.quantity.unit;
    if (collectedUnit !== assignment.quantity.unit) {
      const error = new Error(
        `Collected quantity unit "${collectedUnit}" must match expected quantity unit "${assignment.quantity.unit}"`
      );
      error.statusCode = 400;
      throw error;
    }

    // Validate: collected quantity value <= expected quantity value
    if (parsedCollectedQuantity.value > assignment.quantity.value) {
      const error = new Error(
        `Collected quantity (${parsedCollectedQuantity.value}) cannot exceed expected quantity (${assignment.quantity.value})`
      );
      error.statusCode = 400;
      throw error;
    }

    // Parse foodSafety if provided as string (e.g. from multipart form)
    let parsedFoodSafety = foodSafety || {};
    if (typeof foodSafety === 'string') {
      try {
        parsedFoodSafety = JSON.parse(foodSafety);
      } catch (e) {
        parsedFoodSafety = {};
      }
    }

    const collection = await Collection.create({
      assignmentId,
      volunteerId,
      expectedQuantity: {
        value: assignment.quantity.value,
        unit: assignment.quantity.unit,
      },
      collectedQuantity: {
        value: parsedCollectedQuantity.value,
        unit: collectedUnit,
      },
      foodSafety: {
        preparationTime: parsedFoodSafety.preparationTime || '',
        temperature: parsedFoodSafety.temperature !== undefined ? Number(parsedFoodSafety.temperature) : null,
        temperatureUnit: parsedFoodSafety.temperatureUnit || 'C',
        temperatureChecked: Boolean(parsedFoodSafety.temperatureChecked),
        properlyPacked: Boolean(parsedFoodSafety.properlyPacked),
        packagingIntact: Boolean(parsedFoodSafety.packagingIntact),
        noVisibleContamination: Boolean(parsedFoodSafety.noVisibleContamination),
        notes: parsedFoodSafety.notes || '',
      },
      collectionPhotoUrl: collectionPhotoUrl || '',
      verifiedBy: volunteerId,
      verifiedAt: new Date(),
    });

    return collection.toJSON();
  }

  /**
   * Get collection by assignment ID
   */
  async getByAssignmentId(assignmentId) {
    const collection = await Collection.findOne({ assignmentId });
    return collection ? collection.toJSON() : null;
  }
}

module.exports = new CollectionService();
