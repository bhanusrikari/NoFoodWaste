const User = require('../auth/auth.model');
const Delivery = require('../delivery/delivery.model');

class VolunteerService {
  async getAllVolunteers(filters = {}) {
    const query = { role: 'VOLUNTEER' };

    if (filters.search) {
      const searchRegex = new RegExp(filters.search, 'i');
      query.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { phone: searchRegex },
        { city: searchRegex },
        { vehicleNumber: searchRegex },
      ];
    }

    if (filters.verificationStatus && filters.verificationStatus !== 'ALL') {
      query.verificationStatus = filters.verificationStatus;
    }

    if (filters.availabilityStatus && filters.availabilityStatus !== 'ALL') {
      query.availabilityStatus = filters.availabilityStatus;
    }

    if (filters.accountStatus && filters.accountStatus !== 'ALL') {
      query.accountStatus = filters.accountStatus;
    }

    const volunteers = await User.find(query).sort({ createdAt: -1 });

    const enriched = await Promise.all(
      volunteers.map(async (vol) => {
        const json = vol.toJSON();

        // Find active delivery assignment
        const currentAssignment = await Delivery.findOne({
          $or: [{ volunteer: vol._id }, { volunteerName: vol.name }],
          status: { $in: ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT'] },
        });

        // Find completed deliveries count
        const completedDeliveriesCount = await Delivery.countDocuments({
          $or: [{ volunteer: vol._id }, { volunteerName: vol.name }],
          status: 'DELIVERED',
        });

        // Find cancelled/rejected deliveries count
        const cancelledDeliveriesCount = await Delivery.countDocuments({
          $or: [{ volunteer: vol._id }, { volunteerName: vol.name }],
          status: 'CANCELLED',
        });

        json.currentAssignment = currentAssignment ? currentAssignment.toJSON() : null;
        json.completedDeliveriesCount = completedDeliveriesCount;
        json.cancelledDeliveriesCount = cancelledDeliveriesCount;

        return json;
      })
    );

    return enriched;
  }

  async getVolunteerById(id) {
    const volunteer = await User.findOne({ _id: id, role: 'VOLUNTEER' });
    if (!volunteer) {
      const error = new Error('Volunteer user not found');
      error.statusCode = 404;
      throw error;
    }

    const json = volunteer.toJSON();

    // Fetch full delivery task history
    const deliveries = await Delivery.find({
      $or: [{ volunteer: volunteer._id }, { volunteerName: volunteer.name }],
    }).sort({ createdAt: -1 });

    const activeTask = deliveries.find((d) => ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT'].includes(d.status));
    const completedCount = deliveries.filter((d) => d.status === 'DELIVERED').length;
    const cancelledCount = deliveries.filter((d) => d.status === 'CANCELLED').length;

    json.currentAssignment = activeTask ? activeTask.toJSON() : null;
    json.deliveries = deliveries.map((d) => d.toJSON());
    json.completedDeliveriesCount = completedCount;
    json.cancelledDeliveriesCount = cancelledCount;

    return json;
  }

  async updateVolunteerProfile(id, data) {
    const volunteer = await User.findOne({ _id: id, role: 'VOLUNTEER' });
    if (!volunteer) {
      const error = new Error('Volunteer not found');
      error.statusCode = 404;
      throw error;
    }

    const allowedFields = ['name', 'phone', 'city', 'vehicleType', 'vehicleNumber', 'notes'];
    allowedFields.forEach((field) => {
      if (data[field] !== undefined) volunteer[field] = data[field];
    });

    await volunteer.save();
    return volunteer.toJSON();
  }

  async verifyVolunteer(id) {
    const volunteer = await User.findOne({ _id: id, role: 'VOLUNTEER' });
    if (!volunteer) {
      const error = new Error('Volunteer not found');
      error.statusCode = 404;
      throw error;
    }

    volunteer.verificationStatus = 'VERIFIED';
    volunteer.rejectionReason = '';
    await volunteer.save();
    return volunteer.toJSON();
  }

  async rejectVolunteer(id, reason) {
    const volunteer = await User.findOne({ _id: id, role: 'VOLUNTEER' });
    if (!volunteer) {
      const error = new Error('Volunteer not found');
      error.statusCode = 404;
      throw error;
    }

    volunteer.verificationStatus = 'REJECTED';
    volunteer.rejectionReason = reason || 'Background check or license verification failed';
    volunteer.availabilityStatus = 'OFFLINE';
    await volunteer.save();
    return volunteer.toJSON();
  }

  async toggleStatus(id) {
    const volunteer = await User.findOne({ _id: id, role: 'VOLUNTEER' });
    if (!volunteer) {
      const error = new Error('Volunteer not found');
      error.statusCode = 404;
      throw error;
    }

    volunteer.accountStatus = volunteer.accountStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    if (volunteer.accountStatus === 'INACTIVE') {
      volunteer.availabilityStatus = 'OFFLINE';
    } else {
      volunteer.availabilityStatus = 'AVAILABLE';
    }
    await volunteer.save();
    return volunteer.toJSON();
  }

  async updateAvailability(id, availabilityStatus) {
    const volunteer = await User.findOne({ _id: id, role: 'VOLUNTEER' });
    if (!volunteer) {
      const error = new Error('Volunteer not found');
      error.statusCode = 404;
      throw error;
    }

    const validStates = ['AVAILABLE', 'ASSIGNED', 'ON_DELIVERY', 'OFFLINE'];
    if (!validStates.includes(availabilityStatus)) {
      const error = new Error(`Invalid availability state. Must be one of: ${validStates.join(', ')}`);
      error.statusCode = 400;
      throw error;
    }

    volunteer.availabilityStatus = availabilityStatus;
    await volunteer.save();
    return volunteer.toJSON();
  }

  async assignVolunteerToDelivery(deliveryId, volunteerId) {
    const delivery = await Delivery.findById(deliveryId);
    if (!delivery) {
      const error = new Error('Delivery record not found');
      error.statusCode = 404;
      throw error;
    }

    const newVolunteer = await User.findOne({ _id: volunteerId, role: 'VOLUNTEER' });
    if (!newVolunteer) {
      const error = new Error('Selected volunteer not found');
      error.statusCode = 404;
      throw error;
    }

    // Reassign logic: if delivery already had a volunteer assigned, free up the old volunteer
    if (delivery.volunteer && delivery.volunteer.toString() !== volunteerId) {
      const oldVolunteer = await User.findById(delivery.volunteer);
      if (oldVolunteer) {
        oldVolunteer.availabilityStatus = 'AVAILABLE';
        await oldVolunteer.save();
      }
    }

    // Update delivery record
    delivery.volunteer = newVolunteer._id;
    delivery.volunteerName = newVolunteer.name;
    delivery.volunteerPhone = newVolunteer.phone;
    delivery.status = 'ASSIGNED';
    delivery.currentStage = 'Volunteer Assigned';

    // Update new volunteer availability status
    newVolunteer.availabilityStatus = 'ASSIGNED';

    await delivery.save();
    await newVolunteer.save();

    return {
      success: true,
      message: `Successfully assigned ${newVolunteer.name} to delivery ${delivery.deliveryId}`,
      delivery: delivery.toJSON(),
      volunteer: newVolunteer.toJSON(),
    };
  }

  async seedInitialVolunteers() {
    const volCount = await User.countDocuments({ role: 'VOLUNTEER' });
    if (volCount === 0) {
      await User.create([
        {
          name: 'Rahul Sharma',
          email: 'rahul@volunteers.org',
          password: 'password123',
          role: 'VOLUNTEER',
          phone: '+91 91234 11111',
          vehicleType: 'Two Wheeler',
          vehicleNumber: 'TS 09 EQ 4521',
          verificationStatus: 'VERIFIED',
          availabilityStatus: 'ASSIGNED',
          accountStatus: 'ACTIVE',
        },
        {
          name: 'Priya Verma',
          email: 'priya@volunteers.org',
          password: 'password123',
          role: 'VOLUNTEER',
          phone: '+91 91234 22222',
          vehicleType: 'Four Wheeler',
          vehicleNumber: 'TS 07 FA 8890',
          verificationStatus: 'VERIFIED',
          availabilityStatus: 'AVAILABLE',
          accountStatus: 'ACTIVE',
        },
        {
          name: 'Anil Kumar',
          email: 'anil@volunteers.org',
          password: 'password123',
          role: 'VOLUNTEER',
          phone: '+91 91234 33333',
          vehicleType: 'Two Wheeler',
          vehicleNumber: 'TS 10 AB 3412',
          verificationStatus: 'PENDING_VERIFICATION',
          availabilityStatus: 'OFFLINE',
          accountStatus: 'ACTIVE',
        },
      ]);
      console.log('✓ Initial seed volunteers created successfully');
    }
  }
}

module.exports = new VolunteerService();
