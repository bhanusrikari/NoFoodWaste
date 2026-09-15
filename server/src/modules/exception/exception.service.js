const Delivery = require('../delivery/delivery.model');
const Donation = require('../donation/donation.model');
const FoodRequest = require('../foodRequest/foodRequest.model');
const User = require('../auth/auth.model');
const Vehicle = require('../vehicle/vehicle.model');
const notificationService = require('../notification/notification.service');
const activityLogService = require('../activityLog/activityLog.service');

class ExceptionService {
  async handleVolunteerRejection(deliveryId, { volunteerId, reason }, user = null) {
    let delivery;
    if (deliveryId.match(/^[0-9a-fA-F]{24}$/)) {
      delivery = await Delivery.findById(deliveryId);
    } else {
      delivery = await Delivery.findOne({ deliveryId });
    }

    if (!delivery) {
      const error = new Error('Delivery not found');
      error.statusCode = 404;
      throw error;
    }

    const previousVolunteer = delivery.volunteerName;
    const previousStatus = delivery.status;

    // Free Volunteer if assigned
    if (delivery.volunteer) {
      await User.findByIdAndUpdate(delivery.volunteer, { availabilityStatus: 'AVAILABLE' });
    }

    // Free Vehicle if assigned
    if (delivery.vehicle) {
      await Vehicle.findByIdAndUpdate(delivery.vehicle, {
        status: 'AVAILABLE',
        assignedVolunteer: null,
        assignedVolunteerName: '',
        currentDelivery: null,
      });
    }

    delivery.volunteer = null;
    delivery.volunteerName = 'Unassigned';
    delivery.volunteerPhone = '';
    delivery.vehicle = null;
    delivery.vehicleNumber = '';
    delivery.status = 'PENDING_REASSIGNMENT';
    delivery.currentStage = 'Volunteer Rejection - Pending Reassignment';
    delivery.lifecycleLogs.push({
      status: 'PENDING_REASSIGNMENT',
      note: `Volunteer ${previousVolunteer} rejected task: ${reason || 'No reason provided'}`,
      updatedBy: user ? user.name || 'Volunteer' : previousVolunteer,
      timestamp: new Date(),
    });

    await delivery.save();

    // Trigger Admin Notification
    await notificationService.createNotification({
      title: `Volunteer Rejected Delivery Assignment`,
      message: `Volunteer ${previousVolunteer} rejected delivery ${delivery.deliveryId}. Reason: ${reason || 'None provided'}. Task marked PENDING_REASSIGNMENT.`,
      type: 'VOLUNTEER_REJECTED',
      relatedEntity: 'Delivery',
      relatedEntityId: delivery.deliveryId,
    });

    // Log Activity Audit
    await activityLogService.logActivity({
      actorName: user ? user.name || 'Volunteer' : previousVolunteer,
      actorEmail: user ? user.email || '' : '',
      actorRole: 'VOLUNTEER',
      actionType: 'VOLUNTEER_REJECTED_DELIVERY',
      relatedEntity: 'Delivery',
      relatedEntityId: delivery.deliveryId,
      previousStatus,
      newStatus: 'PENDING_REASSIGNMENT',
      details: `Volunteer rejected task. Reason: ${reason || 'N/A'}. Delivery set to PENDING_REASSIGNMENT`,
    });

    return delivery.toJSON();
  }

  async handlePartialFulfillment(donationId, requestId, { fulfilledQuantity, notes }, adminUser = null) {
    const donation = await Donation.findById(donationId);
    const foodRequest = await FoodRequest.findById(requestId);

    if (!donation || !foodRequest) {
      const error = new Error('Donation or Food Request not found');
      error.statusCode = 404;
      throw error;
    }

    const fulfilled = Number(fulfilledQuantity);
    if (isNaN(fulfilled) || fulfilled <= 0) {
      const error = new Error('Fulfilled quantity must be greater than 0');
      error.statusCode = 400;
      throw error;
    }

    const required = foodRequest.numberOfMeals;
    const remaining = Math.max(0, required - fulfilled);

    // Update Food Request for Partial Fulfillment
    foodRequest.fulfilledQuantity = (foodRequest.fulfilledQuantity || 0) + fulfilled;
    foodRequest.remainingQuantity = remaining;
    foodRequest.status = remaining > 0 ? 'PARTIALLY_FULFILLED' : 'FULFILLED';
    foodRequest.lifecycleLogs.push({
      status: foodRequest.status,
      note: `Partial fulfillment of ${fulfilled} meals from ${donation.donorName}. Remaining requirement: ${remaining} meals`,
      updatedBy: adminUser ? adminUser.name || 'Admin' : 'Administrator',
      timestamp: new Date(),
    });

    // Update Donation
    donation.status = 'MATCHED';
    donation.matchedBeneficiary = {
      customerName: foodRequest.customerName,
      organizationName: foodRequest.organizationName || '',
      phone: foodRequest.phone,
      location: foodRequest.location,
      requestId: foodRequest.requestId,
    };
    donation.lifecycleLogs.push({
      status: 'MATCHED',
      note: `Partial match: Provided ${fulfilled} meals for requirement ${foodRequest.requestId}`,
      updatedBy: adminUser ? adminUser.name || 'Admin' : 'Administrator',
      timestamp: new Date(),
    });

    // Create Converged Delivery Record for Fulfilled Portion
    const delivery = await Delivery.create({
      foodRequest: foodRequest._id,
      donation: donation._id,
      customerName: foodRequest.customerName,
      donorName: donation.donorName,
      volunteerName: 'Unassigned',
      volunteerPhone: '',
      vehicleNumber: '',
      numberOfMeals: fulfilled,
      pickupLocation: donation.pickupLocation,
      deliveryLocation: foodRequest.location,
      deliveryMethod: donation.deliveryMethod || 'VOLUNTEER_PICKUP',
      requiredDeliveryDate: donation.availableDate || '',
      requiredDeliveryTime: donation.availableTime || '',
      status: donation.deliveryMethod === 'DONOR_SELF_DROP' ? 'ASSIGNED' : 'PENDING_ASSIGNMENT',
      currentStage: `Partial Fulfillment Delivery (${fulfilled} meals)`,
      lifecycleLogs: [
        {
          status: donation.deliveryMethod === 'DONOR_SELF_DROP' ? 'ASSIGNED' : 'PENDING_ASSIGNMENT',
          note: `Created partial fulfillment delivery for ${fulfilled} meals (Remaining required: ${remaining} meals)`,
          updatedBy: adminUser ? adminUser.name || 'Admin' : 'Administrator',
          timestamp: new Date(),
        },
      ],
    });

    donation.delivery = delivery._id;
    await donation.save();
    await foodRequest.save();

    // Log Activity Audit
    await activityLogService.logActivity({
      actorName: adminUser ? adminUser.name || 'Admin' : 'Administrator',
      actorEmail: adminUser ? adminUser.email || '' : '',
      actorRole: 'ADMIN',
      actionType: 'ADMIN_PARTIAL_FULFILLMENT_PROCESSED',
      relatedEntity: 'FoodRequest',
      relatedEntityId: foodRequest.requestId,
      previousStatus: 'OPEN',
      newStatus: foodRequest.status,
      details: `Fulfilled ${fulfilled} meals for ${foodRequest.requestId}. Remaining: ${remaining} meals. Delivery ${delivery.deliveryId} created.`,
    });

    return {
      fulfilled,
      remaining,
      foodRequest: foodRequest.toJSON(),
      donation: donation.toJSON(),
      delivery: delivery.toJSON(),
    };
  }

  async handleCancellation(entityType, entityId, { reason }, adminUser = null) {
    let result;
    if (entityType === 'Delivery') {
      const delivery = await Delivery.findById(entityId);
      if (delivery) {
        if (delivery.volunteer) await User.findByIdAndUpdate(delivery.volunteer, { availabilityStatus: 'AVAILABLE' });
        if (delivery.vehicle) await Vehicle.findByIdAndUpdate(delivery.vehicle, { status: 'AVAILABLE', assignedVolunteer: null, currentDelivery: null });
        delivery.status = 'CANCELLED';
        delivery.currentStage = 'Cancelled';
        delivery.lifecycleLogs.push({ status: 'CANCELLED', note: reason || 'Cancelled', updatedBy: adminUser ? adminUser.name : 'Admin', timestamp: new Date() });
        await delivery.save();
        result = delivery.toJSON();
      }
    } else if (entityType === 'Donation') {
      const donation = await Donation.findById(entityId);
      if (donation) {
        donation.status = 'CANCELLED';
        donation.cancellationReason = reason || 'Cancelled by donor/admin';
        await donation.save();
        result = donation.toJSON();
      }
    } else if (entityType === 'FoodRequest') {
      const request = await FoodRequest.findById(entityId);
      if (request) {
        request.status = 'CANCELLED';
        request.cancellationReason = reason || 'Cancelled by customer/admin';
        await request.save();
        result = request.toJSON();
      }
    }

    // Trigger Notification & Log
    await notificationService.createNotification({
      title: `${entityType} Cancelled`,
      message: `${entityType} ${entityId} was cancelled. Reason: ${reason || 'N/A'}`,
      type: 'CANCELLATION',
      relatedEntity: entityType,
      relatedEntityId: entityId,
    });

    await activityLogService.logActivity({
      actorName: adminUser ? adminUser.name || 'Admin' : 'Administrator',
      actorRole: 'ADMIN',
      actionType: `${entityType.toUpperCase()}_CANCELLED`,
      relatedEntity: entityType,
      relatedEntityId: entityId,
      newStatus: 'CANCELLED',
      details: `Cancelled ${entityType}. Reason: ${reason || 'N/A'}`,
    });

    return result;
  }
}

module.exports = new ExceptionService();
