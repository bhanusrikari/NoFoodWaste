const mongoose = require('mongoose');
const Assignment = require('./assignment.model');
const Vehicle = require('../vehicle/vehicle.model');
const Beneficiary = require('../beneficiary/beneficiary.model');
const FoodRequest = require('../foodRequest/foodRequest.model');
const User = require('../auth/auth.model');
const volunteerService = require('../volunteer/volunteer.service');
const notificationService = require('../notification/notification.service');

class AssignmentService {
  /**
   * Admin creates an assignment.
   * Validates all 11 business rules.
   */
  async createAssignment(data, adminUserId) {
    const {
      foodRequestId,
      donorId,
      beneficiaryId,
      volunteerId,
      vehicleId,
      pickupAddress,
      deliveryAddress,
      foodType,
      quantity,
      pickupLocation,
      deliveryLocation,
    } = data;

    // 11. Required pickup/delivery information exists
    if (!pickupAddress || !deliveryAddress || !foodType || !quantity) {
      const error = new Error('Missing required fields: pickupAddress, deliveryAddress, foodType, and quantity are required.');
      error.statusCode = 400;
      throw error;
    }

    const qtyValue = typeof quantity === 'object' ? quantity.value : Number(quantity);
    const qtyUnit = (typeof quantity === 'object' && quantity.unit) ? quantity.unit : 'MEALS';

    if (!qtyValue || qtyValue < 1) {
      const error = new Error('Quantity value must be at least 1.');
      error.statusCode = 400;
      throw error;
    }

    // 10. Guarantee ONE FOOD REQUEST = MAXIMUM ONE ACTIVE ASSIGNMENT (Application check + partial unique index)
    const existingActive = await Assignment.findOne({
      foodRequestId: foodRequestId.toString(),
      isActive: true,
    });
    if (existingActive) {
      const error = new Error(`An active assignment already exists for food request ${foodRequestId}.`);
      error.statusCode = 409;
      throw error;
    }

    // 1 & 2. Food request exists and is still open
    let foodRequest = null;
    if (mongoose.Types.ObjectId.isValid(foodRequestId)) {
      foodRequest = await FoodRequest.findById(foodRequestId);
    }
    if (foodRequest && foodRequest.status !== 'OPEN') {
      const error = new Error(`Food request is not open (current status: ${foodRequest.status}).`);
      error.statusCode = 400;
      throw error;
    }

    // 3. Beneficiary exists
    const beneficiary = await Beneficiary.findById(beneficiaryId);
    if (!beneficiary) {
      const error = new Error('Beneficiary not found.');
      error.statusCode = 404;
      throw error;
    }

    // 4 & 5. Volunteer exists and has VOLUNTEER role
    const volunteerUser = await User.findById(volunteerId);
    if (!volunteerUser) {
      const error = new Error('Volunteer not found.');
      error.statusCode = 404;
      throw error;
    }
    if (volunteerUser.role !== 'VOLUNTEER') {
      const error = new Error('Assigned user does not have VOLUNTEER role.');
      error.statusCode = 400;
      throw error;
    }

    // 6. Volunteer is AVAILABLE
    const volunteerProfile = await volunteerService.getProfileByUserId(volunteerId);
    if (volunteerProfile.availability !== 'AVAILABLE') {
      const error = new Error(`Volunteer is currently ${volunteerProfile.availability}. Only AVAILABLE volunteers can be assigned.`);
      error.statusCode = 400;
      throw error;
    }

    // Check if volunteer already has an active assignment
    const volunteerActiveAssignment = await Assignment.findOne({
      volunteerId,
      isActive: true,
    });
    if (volunteerActiveAssignment) {
      const error = new Error('Volunteer already has an active assignment.');
      error.statusCode = 400;
      throw error;
    }

    // 7 & 8. Vehicle exists and is AVAILABLE
    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      const error = new Error('Vehicle not found.');
      error.statusCode = 404;
      throw error;
    }
    if (vehicle.status !== 'AVAILABLE') {
      const error = new Error(`Vehicle is currently ${vehicle.status}. Only AVAILABLE vehicles can be assigned.`);
      error.statusCode = 400;
      throw error;
    }

    // 9. Vehicle capacity is sufficient
    if (vehicle.capacity < qtyValue) {
      const error = new Error(`Vehicle capacity (${vehicle.capacity}) is insufficient for quantity (${qtyValue}).`);
      error.statusCode = 400;
      throw error;
    }

    // Create assignment
    let assignment;
    try {
      assignment = await Assignment.create({
        foodRequestId: foodRequestId.toString(),
        donorId: donorId || adminUserId,
        beneficiaryId,
        volunteerId,
        vehicleId,
        pickupLocation: pickupLocation || {},
        pickupAddress,
        deliveryLocation: deliveryLocation || {},
        deliveryAddress,
        foodType,
        quantity: {
          value: qtyValue,
          unit: qtyUnit,
        },
        status: 'ASSIGNED',
        isActive: true,
        assignedAt: new Date(),
      });
    } catch (err) {
      // MongoDB duplicate key error for partial unique index
      if (err.code === 11000) {
        const conflictErr = new Error(`An active assignment already exists for food request ${foodRequestId}.`);
        conflictErr.statusCode = 409;
        throw conflictErr;
      }
      throw err;
    }

    // Update vehicle status to ASSIGNED
    await Vehicle.findByIdAndUpdate(vehicleId, { status: 'ASSIGNED' });

    // Update food request status to ASSIGNED if exists
    if (foodRequest) {
      foodRequest.status = 'ASSIGNED';
      await foodRequest.save();
    }

    // Update volunteer totalTasks count
    await volunteerService.incrementTotalTasks(volunteerId);

    // Create notification for the assigned volunteer
    const shortId = assignment._id.toString().slice(-4).toUpperCase();
    await notificationService.create({
      userId: volunteerId,
      title: 'New Assignment Received',
      message: `You have been assigned Delivery #${shortId} (${qtyValue} ${qtyUnit} of ${foodType}).`,
      type: 'ASSIGNMENT_CREATED',
      relatedAssignmentId: assignment._id,
    });

    return assignment.toJSON();
  }

  /**
   * Get assignments for authenticated volunteer
   */
  async getMyAssignments(volunteerId) {
    const assignments = await Assignment.find({ volunteerId })
      .sort({ createdAt: -1 })
      .populate('donorId', 'name email phone')
      .populate('beneficiaryId', 'name address phone type')
      .populate('vehicleId', 'vehicleNumber vehicleType capacity');

    return assignments.map((a) => a.toJSON());
  }

  /**
   * Get active assignment for authenticated volunteer
   */
  async getMyActiveAssignment(volunteerId) {
    const assignment = await Assignment.findOne({
      volunteerId,
      isActive: true,
    })
      .populate('donorId', 'name email phone')
      .populate('beneficiaryId', 'name address phone type')
      .populate('vehicleId', 'vehicleNumber vehicleType capacity');

    return assignment ? assignment.toJSON() : null;
  }

  /**
   * Get completed/cancelled assignment history for volunteer
   */
  async getMyHistory(volunteerId) {
    const assignments = await Assignment.find({
      volunteerId,
      isActive: false,
    })
      .sort({ updatedAt: -1 })
      .populate('donorId', 'name email phone')
      .populate('beneficiaryId', 'name address phone type')
      .populate('vehicleId', 'vehicleNumber vehicleType capacity');

    return assignments.map((a) => a.toJSON());
  }

  /**
   * Get single assignment by ID (with ownership verification for volunteers)
   */
  async getAssignmentById(assignmentId, userId, userRole) {
    const assignment = await Assignment.findById(assignmentId)
      .populate('donorId', 'name email phone')
      .populate('beneficiaryId', 'name address phone type')
      .populate('vehicleId', 'vehicleNumber vehicleType capacity');

    if (!assignment) {
      const error = new Error('Assignment not found');
      error.statusCode = 404;
      throw error;
    }

    if (userRole === 'VOLUNTEER' && assignment.volunteerId.toString() !== userId.toString()) {
      const error = new Error('You are not authorized to access this assignment');
      error.statusCode = 403;
      throw error;
    }

    return assignment.toJSON();
  }

  /**
   * ATOMIC accept assignment.
   * Concurrency protected via findOneAndUpdate with status 'ASSIGNED'.
   */
  async acceptAssignment(assignmentId, volunteerId) {
    const now = new Date();

    const assignment = await Assignment.findOneAndUpdate(
      {
        _id: assignmentId,
        volunteerId: volunteerId,
        status: 'ASSIGNED',
      },
      {
        $set: {
          status: 'VOLUNTEER_ACCEPTED',
          acceptedAt: now,
          isActive: true,
        },
      },
      {
        new: true,
        runValidators: true,
      }
    )
      .populate('donorId', 'name email phone')
      .populate('beneficiaryId', 'name address phone type')
      .populate('vehicleId', 'vehicleNumber vehicleType capacity');

    if (!assignment) {
      const existing = await Assignment.findById(assignmentId);

      if (!existing) {
        const error = new Error('Assignment not found');
        error.statusCode = 404;
        throw error;
      }

      if (existing.volunteerId.toString() !== volunteerId.toString()) {
        const error = new Error('You are not authorized to access this assignment');
        error.statusCode = 403;
        throw error;
      }

      // Assignment exists and belongs to this volunteer, but status != ASSIGNED
      const error = new Error('This assignment has already been accepted or is no longer available.');
      error.statusCode = 409;
      throw error;
    }

    // Set volunteer to BUSY
    await volunteerService.setBusy(volunteerId);

    // Set vehicle to IN_USE
    await Vehicle.findByIdAndUpdate(assignment.vehicleId, { status: 'IN_USE' });

    // Notify admins
    const admins = await User.find({ role: 'ADMIN' });
    const volunteer = await User.findById(volunteerId);
    const shortId = assignment._id.toString().slice(-4).toUpperCase();

    for (const admin of admins) {
      await notificationService.create({
        userId: admin._id,
        title: 'Assignment Accepted',
        message: `Volunteer ${volunteer ? volunteer.name : 'Unknown'} accepted Delivery #${shortId}.`,
        type: 'ASSIGNMENT_ACCEPTED',
        relatedAssignmentId: assignment._id,
      });
    }

    return assignment.toJSON();
  }

  /**
   * Start pickup: VOLUNTEER_ACCEPTED -> PICKUP_STARTED
   */
  async startPickup(assignmentId, volunteerId) {
    const assignment = await Assignment.findOneAndUpdate(
      {
        _id: assignmentId,
        volunteerId: volunteerId,
        status: 'VOLUNTEER_ACCEPTED',
      },
      {
        $set: {
          status: 'PICKUP_STARTED',
          pickupStartedAt: new Date(),
          isActive: true,
        },
      },
      { new: true, runValidators: true }
    )
      .populate('donorId', 'name email phone')
      .populate('beneficiaryId', 'name address phone type')
      .populate('vehicleId', 'vehicleNumber vehicleType capacity');

    if (!assignment) {
      await this._throwTransitionError(assignmentId, volunteerId, 'VOLUNTEER_ACCEPTED');
    }

    // Notify volunteer & donor
    await notificationService.create({
      userId: volunteerId,
      title: 'Pickup Started',
      message: `You started pickup for Delivery #${assignment._id.toString().slice(-4).toUpperCase()}.`,
      type: 'PICKUP_STARTED',
      relatedAssignmentId: assignment._id,
    });

    return assignment.toJSON();
  }

  /**
   * Confirm collection: PICKUP_STARTED -> COLLECTED
   */
  async confirmCollection(assignmentId, volunteerId) {
    const assignment = await Assignment.findOneAndUpdate(
      {
        _id: assignmentId,
        volunteerId: volunteerId,
        status: 'PICKUP_STARTED',
      },
      {
        $set: {
          status: 'COLLECTED',
          collectedAt: new Date(),
          isActive: true,
        },
      },
      { new: true, runValidators: true }
    )
      .populate('donorId', 'name email phone')
      .populate('beneficiaryId', 'name address phone type')
      .populate('vehicleId', 'vehicleNumber vehicleType capacity');

    if (!assignment) {
      await this._throwTransitionError(assignmentId, volunteerId, 'PICKUP_STARTED');
    }

    // Notify donor
    if (assignment.donorId) {
      const donorId =
        typeof assignment.donorId === 'object' ? assignment.donorId._id : assignment.donorId;
      await notificationService.create({
        userId: donorId,
        title: 'Food Collected',
        message: 'Your food donation has been collected by the volunteer.',
        type: 'COLLECTION_COMPLETE',
        relatedAssignmentId: assignment._id,
      });
    }

    return assignment.toJSON();
  }

  /**
   * Start transport: COLLECTED -> IN_TRANSIT
   */
  async startTransport(assignmentId, volunteerId) {
    const assignment = await Assignment.findOneAndUpdate(
      {
        _id: assignmentId,
        volunteerId: volunteerId,
        status: 'COLLECTED',
      },
      {
        $set: {
          status: 'IN_TRANSIT',
          transportStartedAt: new Date(),
          isActive: true,
        },
      },
      { new: true, runValidators: true }
    )
      .populate('donorId', 'name email phone')
      .populate('beneficiaryId', 'name address phone type')
      .populate('vehicleId', 'vehicleNumber vehicleType capacity');

    if (!assignment) {
      await this._throwTransitionError(assignmentId, volunteerId, 'COLLECTED');
    }

    return assignment.toJSON();
  }

  /**
   * Confirm delivery: IN_TRANSIT -> DELIVERED
   * This is the VOLUNTEER'S FINAL ACTION.
   * Remains in DELIVERED state until beneficiary acknowledges receipt.
   */
  async confirmDelivery(assignmentId, volunteerId) {
    const assignment = await Assignment.findOneAndUpdate(
      {
        _id: assignmentId,
        volunteerId: volunteerId,
        status: 'IN_TRANSIT',
      },
      {
        $set: {
          status: 'DELIVERED',
          deliveredAt: new Date(),
          isActive: true, // Still active until acknowledged!
        },
      },
      { new: true, runValidators: true }
    )
      .populate('donorId', 'name email phone')
      .populate('beneficiaryId', 'name address phone type')
      .populate('vehicleId', 'vehicleNumber vehicleType capacity');

    if (!assignment) {
      await this._throwTransitionError(assignmentId, volunteerId, 'IN_TRANSIT');
    }

    const shortId = assignment._id.toString().slice(-4).toUpperCase();

    // Create notification for admin and beneficiary
    const admins = await User.find({ role: 'ADMIN' });
    for (const admin of admins) {
      await notificationService.create({
        userId: admin._id,
        title: 'Delivery Confirmed',
        message: `Delivery #${shortId} has been delivered. Waiting for beneficiary acknowledgement.`,
        type: 'DELIVERY_COMPLETE',
        relatedAssignmentId: assignment._id,
      });
    }

    return assignment.toJSON();
  }

  /**
   * Beneficiary / Customer Receipt Acknowledgement:
   * DELIVERED -> COMPLETED
   * Owned by beneficiary/customer side, NOT the volunteer.
   * Can be invoked by ADMIN or the authenticated beneficiary.
   */
  async acknowledgeReceipt(assignmentId, user) {
    // Verify caller is NOT a volunteer trying to complete their own task
    if (user.role === 'VOLUNTEER') {
      const error = new Error('Volunteers are not authorized to acknowledge delivery receipt.');
      error.statusCode = 403;
      throw error;
    }

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      const error = new Error('Assignment not found');
      error.statusCode = 404;
      throw error;
    }

    // Verify authorized user: ADMIN or the beneficiary
    if (user.role !== 'ADMIN') {
      const beneficiary = await Beneficiary.findById(assignment.beneficiaryId);
      const isAuthorized = beneficiary && beneficiary.userId && beneficiary.userId.toString() === user.id.toString();
      if (!isAuthorized) {
        const error = new Error('You are not authorized to acknowledge receipt for this delivery.');
        error.statusCode = 403;
        throw error;
      }
    }

    if (assignment.status !== 'DELIVERED') {
      const error = new Error(
        `Assignment cannot be acknowledged. Current status is "${assignment.status}", expected "DELIVERED".`
      );
      error.statusCode = 400;
      throw error;
    }

    // Atomic update from DELIVERED -> COMPLETED
    const updatedAssignment = await Assignment.findOneAndUpdate(
      {
        _id: assignmentId,
        status: 'DELIVERED',
      },
      {
        $set: {
          status: 'COMPLETED',
          completedAt: new Date(),
          isActive: false, // Inactive now
        },
      },
      { new: true }
    )
      .populate('donorId', 'name email phone')
      .populate('beneficiaryId', 'name address phone type')
      .populate('vehicleId', 'vehicleNumber vehicleType capacity');

    if (!updatedAssignment) {
      const error = new Error('Assignment is no longer in DELIVERED status.');
      error.statusCode = 409;
      throw error;
    }

    // Release volunteer: BUSY -> AVAILABLE
    await volunteerService.setAvailable(updatedAssignment.volunteerId);

    // Release vehicle: IN_USE -> AVAILABLE
    await Vehicle.findByIdAndUpdate(updatedAssignment.vehicleId, { status: 'AVAILABLE' });

    // Update volunteer statistics
    const qtyValue = updatedAssignment.quantity ? updatedAssignment.quantity.value : 0;
    await volunteerService.incrementStats(updatedAssignment.volunteerId, qtyValue, 0);

    // Update FoodRequest to FULFILLED if exists
    if (mongoose.Types.ObjectId.isValid(updatedAssignment.foodRequestId)) {
      await FoodRequest.findByIdAndUpdate(updatedAssignment.foodRequestId, { status: 'FULFILLED' });
    }

    const shortId = updatedAssignment._id.toString().slice(-4).toUpperCase();

    // Create notification for volunteer
    await notificationService.create({
      userId: updatedAssignment.volunteerId,
      title: 'Delivery Acknowledged & Completed',
      message: `Beneficiary acknowledged receipt for Delivery #${shortId}. Task is now completed!`,
      type: 'TASK_COMPLETED',
      relatedAssignmentId: updatedAssignment._id,
    });

    // Create notification for donor
    if (updatedAssignment.donorId) {
      const donorId = typeof updatedAssignment.donorId === 'object' ? updatedAssignment.donorId._id : updatedAssignment.donorId;
      await notificationService.create({
        userId: donorId,
        title: 'Donation Completed',
        message: `Your food donation for Delivery #${shortId} has been acknowledged and received.`,
        type: 'TASK_COMPLETED',
        relatedAssignmentId: updatedAssignment._id,
      });
    }

    return updatedAssignment.toJSON();
  }

  /**
   * Admin cancels an assignment.
   */
  async cancelAssignment(assignmentId, adminUserId, reason) {
    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      const error = new Error('Assignment not found');
      error.statusCode = 404;
      throw error;
    }

    if (assignment.status === 'COMPLETED' || assignment.status === 'CANCELLED') {
      const error = new Error(`Cannot cancel an assignment that is already ${assignment.status}.`);
      error.statusCode = 400;
      throw error;
    }

    const previousStatus = assignment.status;

    assignment.status = 'CANCELLED';
    assignment.isActive = false;
    assignment.cancelledAt = new Date();
    assignment.cancellationReason = reason || 'Cancelled by Admin';
    await assignment.save();

    // Release vehicle
    await Vehicle.findByIdAndUpdate(assignment.vehicleId, { status: 'AVAILABLE' });

    // Release volunteer if they had accepted
    if (previousStatus !== 'ASSIGNED') {
      await volunteerService.setAvailable(assignment.volunteerId);
    }

    // Reopen food request if exists
    if (mongoose.Types.ObjectId.isValid(assignment.foodRequestId)) {
      await FoodRequest.findByIdAndUpdate(assignment.foodRequestId, { status: 'OPEN' });
    }

    const shortId = assignment._id.toString().slice(-4).toUpperCase();

    // Notify volunteer
    await notificationService.create({
      userId: assignment.volunteerId,
      title: 'Assignment Cancelled',
      message: `Delivery #${shortId} has been cancelled.`,
      type: 'ASSIGNMENT_CANCELLED',
      relatedAssignmentId: assignment._id,
    });

    return assignment.toJSON();
  }

  /**
   * Helper: Determine error reason for failed atomic updates
   */
  async _throwTransitionError(assignmentId, volunteerId, expectedStatus) {
    const existing = await Assignment.findById(assignmentId);

    if (!existing) {
      const error = new Error('Assignment not found');
      error.statusCode = 404;
      throw error;
    }

    if (existing.volunteerId.toString() !== volunteerId.toString()) {
      const error = new Error('You are not authorized to access this assignment');
      error.statusCode = 403;
      throw error;
    }

    const error = new Error(
      `Invalid status transition. Assignment is currently "${existing.status}", expected "${expectedStatus}".`
    );
    error.statusCode = 400;
    throw error;
  }
}

module.exports = new AssignmentService();
