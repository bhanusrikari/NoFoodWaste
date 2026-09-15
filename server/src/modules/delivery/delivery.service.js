const Delivery = require('./delivery.model');
const User = require('../auth/auth.model');
const Vehicle = require('../vehicle/vehicle.model');

class DeliveryService {
  async getPendingAssignments(query = {}) {
    const { search } = query;
    const filter = {
      deliveryMethod: 'VOLUNTEER_PICKUP',
      status: 'PENDING_ASSIGNMENT',
    };

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { deliveryId: searchRegex },
        { donorName: searchRegex },
        { customerName: searchRegex },
        { pickupLocation: searchRegex },
        { deliveryLocation: searchRegex },
      ];
    }

    const pendingDeliveries = await Delivery.find(filter)
      .populate('donation')
      .populate('foodRequest')
      .sort({ createdAt: -1 });

    return pendingDeliveries.map((d) => d.toJSON());
  }

  async getAvailableResources(numberOfMeals = 0) {
    // 1. Available Verified Volunteers
    const volunteers = await User.find({
      role: 'VOLUNTEER',
      verificationStatus: 'VERIFIED',
      accountStatus: 'ACTIVE',
      availabilityStatus: 'AVAILABLE',
    }).select('name phone email vehicleType vehicleNumber city availabilityStatus verificationStatus');

    // 2. Available Suitable Vehicles (capacity >= numberOfMeals if specified)
    const vehicleFilter = {
      accountStatus: 'ACTIVE',
      status: 'AVAILABLE',
    };

    if (numberOfMeals > 0) {
      vehicleFilter.capacity = { $gte: Number(numberOfMeals) };
    }

    const vehicles = await Vehicle.find(vehicleFilter)
      .populate('assignedVolunteer')
      .sort({ capacity: 1 });

    return {
      volunteers: volunteers.map((v) => ({
        id: v._id.toString(),
        name: v.name,
        phone: v.phone,
        email: v.email,
        vehicleType: v.vehicleType || 'None',
        vehicleNumber: v.vehicleNumber || '',
        city: v.city || '',
        availabilityStatus: v.availabilityStatus,
      })),
      vehicles: vehicles.map((v) => v.toJSON()),
    };
  }

  async assignDeliveryResources(deliveryId, { volunteerId, vehicleId }, adminUser = null) {
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

    // Find Volunteer
    const volunteer = await User.findById(volunteerId);
    if (!volunteer || volunteer.role !== 'VOLUNTEER') {
      const error = new Error('Selected volunteer not found');
      error.statusCode = 404;
      throw error;
    }

    // Find Vehicle
    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      const error = new Error('Selected vehicle not found');
      error.statusCode = 404;
      throw error;
    }

    // Validate Vehicle Capacity
    if (vehicle.capacity < delivery.numberOfMeals) {
      const error = new Error(
        `Selected vehicle capacity (${vehicle.capacity} meals) is insufficient for delivery requirement (${delivery.numberOfMeals} meals)`
      );
      error.statusCode = 400;
      throw error;
    }

    // Update Delivery Record
    delivery.volunteer = volunteer._id;
    delivery.volunteerName = volunteer.name;
    delivery.volunteerPhone = volunteer.phone || '';
    delivery.vehicle = vehicle._id;
    delivery.vehicleNumber = vehicle.vehicleNumber;
    delivery.status = 'ASSIGNED';
    delivery.currentStage = 'Volunteer & Vehicle Assigned';
    delivery.lifecycleLogs.push({
      status: 'ASSIGNED',
      note: `Assigned Volunteer ${volunteer.name} & Vehicle ${vehicle.vehicleNumber} (${vehicle.vehicleType})`,
      updatedBy: adminUser ? adminUser.name || 'Admin' : 'Administrator',
      timestamp: new Date(),
    });

    await delivery.save();

    // Sync Volunteer Availability Status
    volunteer.availabilityStatus = 'ASSIGNED';
    await volunteer.save();

    // Sync Vehicle Status
    vehicle.status = 'ASSIGNED';
    vehicle.assignedVolunteer = volunteer._id;
    vehicle.assignedVolunteerName = volunteer.name;
    vehicle.currentDelivery = delivery._id;
    await vehicle.save();

    return delivery.toJSON();
  }

  async reassignDeliveryResources(deliveryId, { volunteerId, vehicleId }, adminUser = null) {
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

    // Free Previous Volunteer if changing
    if (delivery.volunteer && delivery.volunteer.toString() !== volunteerId) {
      await User.findByIdAndUpdate(delivery.volunteer, { availabilityStatus: 'AVAILABLE' });
    }

    // Free Previous Vehicle if changing
    if (delivery.vehicle && delivery.vehicle.toString() !== vehicleId) {
      await Vehicle.findByIdAndUpdate(delivery.vehicle, {
        status: 'AVAILABLE',
        assignedVolunteer: null,
        assignedVolunteerName: '',
        currentDelivery: null,
      });
    }

    return await this.assignDeliveryResources(delivery._id.toString(), { volunteerId, vehicleId }, adminUser);
  }

  async cancelDeliveryAssignment(deliveryId, { reason }, adminUser = null) {
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

    // Free assigned volunteer
    if (delivery.volunteer) {
      await User.findByIdAndUpdate(delivery.volunteer, { availabilityStatus: 'AVAILABLE' });
    }

    // Free assigned vehicle
    if (delivery.vehicle) {
      await Vehicle.findByIdAndUpdate(delivery.vehicle, {
        status: 'AVAILABLE',
        assignedVolunteer: null,
        assignedVolunteerName: '',
        currentDelivery: null,
      });
    }

    delivery.status = 'CANCELLED';
    delivery.currentStage = 'Assignment Cancelled';
    delivery.lifecycleLogs.push({
      status: 'CANCELLED',
      note: reason || 'Assignment cancelled by administrator',
      updatedBy: adminUser ? adminUser.name || 'Admin' : 'Administrator',
      timestamp: new Date(),
    });

    await delivery.save();
    return delivery.toJSON();
  }

  async getAllDeliveries(query = {}) {
    const { filterType = 'ALL', search } = query;
    const filter = {};

    if (filterType === 'ACTIVE') {
      filter.status = {
        $in: [
          'PENDING_ASSIGNMENT',
          'ASSIGNED',
          'ACCEPTED',
          'GOING_TO_PICKUP',
          'FOOD_COLLECTED',
          'OUT_FOR_DELIVERY',
          'DELIVERED',
          'ACKNOWLEDGED',
          'PICKED_UP',
          'IN_TRANSIT',
        ],
      };
    } else if (filterType === 'COMPLETED') {
      filter.status = 'COMPLETED';
    } else if (filterType === 'CANCELLED') {
      filter.status = 'CANCELLED';
    } else if (filterType === 'DELAYED') {
      filter.$or = [{ isDelayed: true }];
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { deliveryId: searchRegex },
        { donorName: searchRegex },
        { customerName: searchRegex },
        { volunteerName: searchRegex },
        { vehicleNumber: searchRegex },
        { pickupLocation: searchRegex },
        { deliveryLocation: searchRegex },
      ];
    }

    const deliveries = await Delivery.find(filter)
      .populate('volunteer')
      .populate('vehicle')
      .sort({ createdAt: -1 });

    const allDeliveries = await Delivery.find({});
    const stats = {
      total: allDeliveries.length,
      pendingAssignment: allDeliveries.filter((d) => d.status === 'PENDING_ASSIGNMENT').length,
      active: allDeliveries.filter((d) =>
        [
          'PENDING_ASSIGNMENT',
          'ASSIGNED',
          'ACCEPTED',
          'GOING_TO_PICKUP',
          'FOOD_COLLECTED',
          'OUT_FOR_DELIVERY',
          'DELIVERED',
          'ACKNOWLEDGED',
          'PICKED_UP',
          'IN_TRANSIT',
        ].includes(d.status)
      ).length,
      completed: allDeliveries.filter((d) => d.status === 'COMPLETED').length,
      cancelled: allDeliveries.filter((d) => d.status === 'CANCELLED').length,
      delayed: allDeliveries.filter((d) => d.isDelayed).length,
    };

    return {
      deliveries: deliveries.map((d) => d.toJSON()),
      stats,
    };
  }

  async getDeliveryById(id) {
    let delivery;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      delivery = await Delivery.findById(id).populate('volunteer').populate('vehicle');
    } else {
      delivery = await Delivery.findOne({ deliveryId: id }).populate('volunteer').populate('vehicle');
    }

    if (!delivery) {
      const error = new Error('Delivery not found');
      error.statusCode = 404;
      throw error;
    }

    return delivery.toJSON();
  }

  async updateDeliveryStatus(id, { status, note, acknowledgement }, adminUser = null) {
    let delivery;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      delivery = await Delivery.findById(id);
    } else {
      delivery = await Delivery.findOne({ deliveryId: id });
    }

    if (!delivery) {
      const error = new Error('Delivery not found');
      error.statusCode = 404;
      throw error;
    }

    const validStatuses = [
      'PENDING_ASSIGNMENT',
      'ASSIGNED',
      'ACCEPTED',
      'GOING_TO_PICKUP',
      'FOOD_COLLECTED',
      'OUT_FOR_DELIVERY',
      'DELIVERED',
      'ACKNOWLEDGED',
      'COMPLETED',
      'CANCELLED',
    ];

    if (!validStatuses.includes(status)) {
      const error = new Error(`Invalid status '${status}'`);
      error.statusCode = 400;
      throw error;
    }

    const now = new Date();
    delivery.status = status;

    // Stage descriptions & Timestamps
    switch (status) {
      case 'ACCEPTED':
        delivery.currentStage = 'Volunteer Accepted Assignment';
        delivery.acceptedAt = now;
        break;
      case 'GOING_TO_PICKUP':
        delivery.currentStage = 'Volunteer Going to Pickup Location';
        delivery.goingToPickupAt = now;
        break;
      case 'FOOD_COLLECTED':
        delivery.currentStage = 'Food Collected from Donor';
        delivery.foodCollectedAt = now;
        if (delivery.volunteer) {
          await User.findByIdAndUpdate(delivery.volunteer, { availabilityStatus: 'ON_DELIVERY' });
        }
        if (delivery.vehicle) {
          await Vehicle.findByIdAndUpdate(delivery.vehicle, { status: 'IN_USE' });
        }
        break;
      case 'OUT_FOR_DELIVERY':
        delivery.currentStage = 'Out for Delivery to Recipient';
        delivery.outForDeliveryAt = now;
        break;
      case 'DELIVERED':
        delivery.currentStage = 'Food Delivered to Recipient';
        delivery.deliveredAt = now;
        break;
      case 'ACKNOWLEDGED':
        delivery.currentStage = 'Recipient Acknowledged Receipt';
        delivery.acknowledgedAt = now;
        if (acknowledgement) {
          delivery.acknowledgement = {
            isAcknowledged: true,
            feedback: acknowledgement.feedback || 'Food received in great condition',
            rating: acknowledgement.rating || 5,
            acknowledgedAt: now,
          };
        } else {
          delivery.acknowledgement.isAcknowledged = true;
          delivery.acknowledgement.acknowledgedAt = now;
        }
        break;
      case 'COMPLETED':
        delivery.currentStage = 'Delivery Completed';
        delivery.completedAt = now;
        delivery.acknowledgement.isAcknowledged = true;
        delivery.acknowledgement.acknowledgedAt = delivery.acknowledgement.acknowledgedAt || now;

        // Auto-release Volunteer & Vehicle back to AVAILABLE!
        if (delivery.volunteer) {
          await User.findByIdAndUpdate(delivery.volunteer, { availabilityStatus: 'AVAILABLE' });
        }
        if (delivery.vehicle) {
          await Vehicle.findByIdAndUpdate(delivery.vehicle, {
            status: 'AVAILABLE',
            assignedVolunteer: null,
            assignedVolunteerName: '',
            currentDelivery: null,
          });
        }
        break;
      case 'CANCELLED':
        delivery.currentStage = 'Delivery Cancelled';
        if (delivery.volunteer) {
          await User.findByIdAndUpdate(delivery.volunteer, { availabilityStatus: 'AVAILABLE' });
        }
        if (delivery.vehicle) {
          await Vehicle.findByIdAndUpdate(delivery.vehicle, {
            status: 'AVAILABLE',
            assignedVolunteer: null,
            assignedVolunteerName: '',
            currentDelivery: null,
          });
        }
        break;
      default:
        break;
    }

    delivery.lifecycleLogs.push({
      status,
      note: note || `Status updated to ${status}`,
      updatedBy: adminUser ? adminUser.name || 'Admin' : 'Administrator',
      timestamp: now,
    });

    await delivery.save();
    return delivery.toJSON();
  }

  async seedSampleDeliveries() {
    const count = await Delivery.countDocuments();
    if (count > 0) {
      return { seeded: false, count, message: 'Deliveries already exist in database' };
    }

    const todayStr = new Date().toISOString().split('T')[0];

    const sampleDeliveries = [
      {
        deliveryId: 'DEL-8001',
        customerName: 'Hope Foundation Shelter',
        donorName: 'Taj Hotel Kitchen',
        volunteerName: 'Rahul Sharma',
        volunteerPhone: '+91 91234 11111',
        vehicleNumber: 'TS 09 EQ 4521',
        numberOfMeals: 150,
        pickupLocation: 'Banjara Hills, Hyderabad',
        deliveryLocation: 'MG Road, Secunderabad',
        deliveryMethod: 'VOLUNTEER_PICKUP',
        requiredDeliveryDate: todayStr,
        requiredDeliveryTime: '14:00',
        status: 'GOING_TO_PICKUP',
        currentStage: 'Volunteer Going to Pickup Location',
        isDelayed: false,
        acceptedAt: new Date(Date.now() - 3600000),
        goingToPickupAt: new Date(Date.now() - 1800000),
        lifecycleLogs: [
          { status: 'PENDING_ASSIGNMENT', note: 'Created via donation match', updatedBy: 'System', timestamp: new Date(Date.now() - 7200000) },
          { status: 'ASSIGNED', note: 'Assigned Rahul Sharma & TS 09 EQ 4521', updatedBy: 'Admin', timestamp: new Date(Date.now() - 5400000) },
          { status: 'ACCEPTED', note: 'Volunteer accepted assignment', updatedBy: 'Rahul Sharma', timestamp: new Date(Date.now() - 3600000) },
          { status: 'GOING_TO_PICKUP', note: 'En route to Taj Hotel', updatedBy: 'Rahul Sharma', timestamp: new Date(Date.now() - 1800000) },
        ],
      },
      {
        deliveryId: 'DEL-8002',
        customerName: 'St. Jude Orphanage',
        donorName: 'Green Bakery & Cafe',
        volunteerName: 'Unassigned',
        volunteerPhone: '',
        vehicleNumber: '',
        numberOfMeals: 80,
        pickupLocation: 'Jubilee Hills, Hyderabad',
        deliveryLocation: 'Park Avenue, Banjara Hills',
        deliveryMethod: 'VOLUNTEER_PICKUP',
        requiredDeliveryDate: todayStr,
        requiredDeliveryTime: '18:00',
        status: 'PENDING_ASSIGNMENT',
        currentStage: 'Delivery Assistance Requested',
        isDelayed: false,
        lifecycleLogs: [
          { status: 'PENDING_ASSIGNMENT', note: 'Donor requested volunteer pickup & delivery', updatedBy: 'Green Bakery', timestamp: new Date(Date.now() - 1200000) },
        ],
      },
      {
        deliveryId: 'DEL-8003',
        customerName: 'Kukatpally Community Kitchen',
        donorName: 'Fresh Mart Supermarket',
        volunteerName: 'Priya Verma',
        volunteerPhone: '+91 98765 22222',
        vehicleNumber: 'TS 07 FG 9988',
        numberOfMeals: 200,
        pickupLocation: 'Hitec City, Hyderabad',
        deliveryLocation: 'Kukatpally Phase 3, Hyderabad',
        deliveryMethod: 'VOLUNTEER_PICKUP',
        requiredDeliveryDate: todayStr,
        requiredDeliveryTime: '13:00',
        status: 'OUT_FOR_DELIVERY',
        currentStage: 'Out for Delivery to Recipient',
        isDelayed: false,
        acceptedAt: new Date(Date.now() - 7200000),
        foodCollectedAt: new Date(Date.now() - 3600000),
        outForDeliveryAt: new Date(Date.now() - 1800000),
        lifecycleLogs: [
          { status: 'PENDING_ASSIGNMENT', note: 'Created', updatedBy: 'System', timestamp: new Date(Date.now() - 10800000) },
          { status: 'ASSIGNED', note: 'Assigned Priya Verma', updatedBy: 'Admin', timestamp: new Date(Date.now() - 9000000) },
          { status: 'FOOD_COLLECTED', note: 'Picked up 200 meal kits from Fresh Mart', updatedBy: 'Priya Verma', timestamp: new Date(Date.now() - 3600000) },
          { status: 'OUT_FOR_DELIVERY', note: 'On the way to Kukatpally', updatedBy: 'Priya Verma', timestamp: new Date(Date.now() - 1800000) },
        ],
      },
      {
        deliveryId: 'DEL-8004',
        customerName: 'Ananda Old Age Home',
        donorName: 'Royal Sweets & Catering',
        volunteerName: 'Vikram Singh',
        volunteerPhone: '+91 94444 33333',
        vehicleNumber: 'TS 10 AB 1234',
        numberOfMeals: 120,
        pickupLocation: 'Abids, Hyderabad',
        deliveryLocation: 'Tarnaka, Hyderabad',
        deliveryMethod: 'VOLUNTEER_PICKUP',
        requiredDeliveryDate: '2026-09-14',
        requiredDeliveryTime: '12:00',
        status: 'COMPLETED',
        currentStage: 'Delivery Completed',
        isDelayed: false,
        acceptedAt: new Date(Date.now() - 86400000),
        deliveredAt: new Date(Date.now() - 82800000),
        acknowledgedAt: new Date(Date.now() - 80000000),
        completedAt: new Date(Date.now() - 79000000),
        acknowledgement: {
          isAcknowledged: true,
          feedback: 'Extremely fresh food served to 120 senior citizens!',
          rating: 5,
          acknowledgedAt: new Date(Date.now() - 80000000),
        },
        lifecycleLogs: [
          { status: 'ASSIGNED', note: 'Assigned Vikram Singh', updatedBy: 'Admin', timestamp: new Date(Date.now() - 90000000) },
          { status: 'DELIVERED', note: 'Delivered', updatedBy: 'Vikram Singh', timestamp: new Date(Date.now() - 82800000) },
          { status: 'COMPLETED', note: 'Acknowledged and finalized', updatedBy: 'System', timestamp: new Date(Date.now() - 79000000) },
        ],
      },
      {
        deliveryId: 'DEL-8005',
        customerName: 'Metro Night Shelter',
        donorName: 'Paradise Biryani Express',
        volunteerName: 'Unassigned',
        volunteerPhone: '',
        vehicleNumber: '',
        numberOfMeals: 300,
        pickupLocation: 'Secunderabad Station Road',
        deliveryLocation: 'Nampally, Hyderabad',
        deliveryMethod: 'VOLUNTEER_PICKUP',
        requiredDeliveryDate: '2026-09-14',
        requiredDeliveryTime: '11:00',
        status: 'PENDING_ASSIGNMENT',
        currentStage: 'Delivery Assistance Requested',
        isDelayed: true,
        lifecycleLogs: [
          { status: 'PENDING_ASSIGNMENT', note: 'High capacity delivery requested', updatedBy: 'Paradise Biryani', timestamp: new Date(Date.now() - 90000000) },
        ],
      },
    ];

    const seeded = await Delivery.insertMany(sampleDeliveries);
    return { seeded: true, count: seeded.length, message: 'Successfully seeded sample deliveries' };
  }
}

module.exports = new DeliveryService();
