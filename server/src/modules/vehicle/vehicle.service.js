const Vehicle = require('./vehicle.model');
const Delivery = require('../delivery/delivery.model');
const User = require('../auth/auth.model');

class VehicleService {
  async getAllVehicles(filters = {}) {
    const query = {};

    if (filters.search) {
      const searchRegex = new RegExp(filters.search, 'i');
      query.$or = [
        { vehicleNumber: searchRegex },
        { vehicleType: searchRegex },
        { assignedVolunteerName: searchRegex },
        { city: searchRegex },
        { vehicleId: searchRegex },
      ];
    }

    if (filters.status && filters.status !== 'ALL') {
      query.status = filters.status;
    }

    if (filters.vehicleType && filters.vehicleType !== 'ALL') {
      query.vehicleType = filters.vehicleType;
    }

    if (filters.accountStatus && filters.accountStatus !== 'ALL') {
      query.accountStatus = filters.accountStatus;
    }

    const vehicles = await Vehicle.find(query).sort({ createdAt: -1 });

    const enriched = await Promise.all(
      vehicles.map(async (veh) => {
        const json = veh.toJSON();

        // Find active current delivery assignment
        const currentDel = await Delivery.findOne({
          $or: [{ vehicle: veh._id }, { vehicleNumber: veh.vehicleNumber }],
          status: { $in: ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT'] },
        });

        // Find usage history count (all deliveries using this vehicle)
        const usageHistoryCount = await Delivery.countDocuments({
          $or: [{ vehicle: veh._id }, { vehicleNumber: veh.vehicleNumber }],
        });

        json.currentDeliveryDetails = currentDel ? currentDel.toJSON() : null;
        json.usageHistoryCount = usageHistoryCount;

        return json;
      })
    );

    return enriched;
  }

  async getVehicleById(id) {
    let vehicle;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      vehicle = await Vehicle.findById(id);
    } else {
      vehicle = await Vehicle.findOne({ vehicleId: id });
    }

    if (!vehicle) {
      const error = new Error('Vehicle record not found');
      error.statusCode = 404;
      throw error;
    }

    const json = vehicle.toJSON();

    // Fetch full usage history
    const usageHistory = await Delivery.find({
      $or: [{ vehicle: vehicle._id }, { vehicleNumber: vehicle.vehicleNumber }],
    }).sort({ createdAt: -1 });

    const activeDel = usageHistory.find((d) => ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT'].includes(d.status));

    json.currentDeliveryDetails = activeDel ? activeDel.toJSON() : null;
    json.usageHistory = usageHistory.map((d) => d.toJSON());
    json.usageHistoryCount = usageHistory.length;

    return json;
  }

  async createVehicle(data) {
    const existing = await Vehicle.findOne({ vehicleNumber: data.vehicleNumber.toUpperCase() });
    if (existing) {
      const error = new Error(`Vehicle with number ${data.vehicleNumber} already exists`);
      error.statusCode = 400;
      throw error;
    }

    const vehicle = await Vehicle.create(data);
    return vehicle.toJSON();
  }

  async updateVehicle(id, data) {
    let vehicle = await Vehicle.findById(id);
    if (!vehicle) vehicle = await Vehicle.findOne({ vehicleId: id });

    if (!vehicle) {
      const error = new Error('Vehicle not found');
      error.statusCode = 404;
      throw error;
    }

    const allowedFields = ['vehicleNumber', 'vehicleType', 'capacity', 'city', 'notes'];
    allowedFields.forEach((field) => {
      if (data[field] !== undefined) vehicle[field] = data[field];
    });

    await vehicle.save();
    return vehicle.toJSON();
  }

  async toggleStatus(id) {
    let vehicle = await Vehicle.findById(id);
    if (!vehicle) vehicle = await Vehicle.findOne({ vehicleId: id });

    if (!vehicle) {
      const error = new Error('Vehicle not found');
      error.statusCode = 404;
      throw error;
    }

    vehicle.accountStatus = vehicle.accountStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    if (vehicle.accountStatus === 'INACTIVE') {
      vehicle.status = 'UNAVAILABLE';
    } else {
      vehicle.status = 'AVAILABLE';
    }
    await vehicle.save();
    return vehicle.toJSON();
  }

  async updateVehicleStatus(id, status) {
    let vehicle = await Vehicle.findById(id);
    if (!vehicle) vehicle = await Vehicle.findOne({ vehicleId: id });

    if (!vehicle) {
      const error = new Error('Vehicle not found');
      error.statusCode = 404;
      throw error;
    }

    const validStatuses = ['AVAILABLE', 'ASSIGNED', 'IN_USE', 'UNAVAILABLE'];
    if (!validStatuses.includes(status)) {
      const error = new Error(`Invalid vehicle status. Must be one of: ${validStatuses.join(', ')}`);
      error.statusCode = 400;
      throw error;
    }

    vehicle.status = status;
    await vehicle.save();
    return vehicle.toJSON();
  }

  async assignVehicleToDelivery(vehicleId, deliveryId) {
    let vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) vehicle = await Vehicle.findOne({ vehicleId });

    if (!vehicle) {
      const error = new Error('Vehicle record not found');
      error.statusCode = 404;
      throw error;
    }

    const delivery = await Delivery.findById(deliveryId);
    if (!delivery) {
      const error = new Error('Delivery record not found');
      error.statusCode = 404;
      throw error;
    }

    // STRICT CAPACITY VALIDATION RULE
    const requiredMeals = Number(delivery.numberOfMeals) || 0;
    const vehicleCapacity = Number(vehicle.capacity) || 0;

    if (requiredMeals > vehicleCapacity) {
      const error = new Error(
        `Vehicle capacity (${vehicleCapacity} meals) is insufficient for required ${requiredMeals} meals`
      );
      error.statusCode = 400;
      throw error;
    }

    // Free up previous vehicle if delivery had one assigned
    if (delivery.vehicle && delivery.vehicle.toString() !== vehicle._id.toString()) {
      const oldVehicle = await Vehicle.findById(delivery.vehicle);
      if (oldVehicle) {
        oldVehicle.status = 'AVAILABLE';
        oldVehicle.currentDelivery = null;
        await oldVehicle.save();
      }
    }

    // Update Delivery Record
    delivery.vehicle = vehicle._id;
    delivery.vehicleNumber = vehicle.vehicleNumber;

    // Update Vehicle Record
    vehicle.currentDelivery = delivery._id;
    vehicle.status = 'ASSIGNED';
    if (delivery.volunteer) {
      vehicle.assignedVolunteer = delivery.volunteer;
      vehicle.assignedVolunteerName = delivery.volunteerName || '';
    }

    await delivery.save();
    await vehicle.save();

    return {
      success: true,
      message: `Vehicle ${vehicle.vehicleNumber} (Capacity: ${vehicle.capacity} meals) assigned to delivery ${delivery.deliveryId} (${requiredMeals} meals)`,
      vehicle: vehicle.toJSON(),
      delivery: delivery.toJSON(),
    };
  }

  async seedInitialVehicles() {
    const count = await Vehicle.countDocuments();
    if (count === 0) {
      // Find sample volunteer to link
      const vol = await User.findOne({ role: 'VOLUNTEER' });

      await Vehicle.create([
        {
          vehicleNumber: 'TS 09 EQ 4521',
          vehicleType: 'Two Wheeler',
          capacity: 60,
          status: 'ASSIGNED',
          accountStatus: 'ACTIVE',
          assignedVolunteer: vol ? vol._id : null,
          assignedVolunteerName: vol ? vol.name : 'Rahul Sharma',
          city: 'Hyderabad',
          notes: 'Standard delivery bike with insulated box.',
        },
        {
          vehicleNumber: 'TS 07 FA 8890',
          vehicleType: 'Four Wheeler',
          capacity: 150,
          status: 'AVAILABLE',
          accountStatus: 'ACTIVE',
          city: 'Hyderabad',
          notes: 'Sedan trunk equipped for catering containers.',
        },
        {
          vehicleNumber: 'TS 10 AB 3412',
          vehicleType: 'Mini Truck',
          capacity: 350,
          status: 'AVAILABLE',
          accountStatus: 'ACTIVE',
          city: 'Hyderabad',
          notes: 'Commercial mini-truck for large bulk event donations.',
        },
        {
          vehicleNumber: 'TS 11 CD 5678',
          vehicleType: 'Van',
          capacity: 250,
          status: 'AVAILABLE',
          accountStatus: 'ACTIVE',
          city: 'Hyderabad',
          notes: 'Temperature controlled food transport van.',
        },
      ]);
      console.log('✓ Initial seed vehicles created successfully');
    }
  }
}

module.exports = new VehicleService();
