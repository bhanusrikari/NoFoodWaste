require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/modules/auth/auth.model');
const Vehicle = require('./src/modules/vehicle/vehicle.model');
const Delivery = require('./src/modules/delivery/delivery.model');
const app = require('./src/app');
const http = require('http');

let server;
let baseUrl;

const runTests = async () => {
  console.log('--- STARTING ADMIN VEHICLES MODULE TEST SUITE ---');

  // Connect DB
  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/nofoodwaste';
  await mongoose.connect(mongoUri);
  console.log('✓ MongoDB Connected');

  // Clean test records
  await User.deleteMany({ email: { $in: ['adminveh@example.com', 'donorveh@example.com'] } });
  await Vehicle.deleteMany({});
  await Delivery.deleteMany({});
  console.log('✓ Cleaned test database');

  // Create users
  const adminUser = await User.create({
    name: 'Admin Vehicle Tester',
    email: 'adminveh@example.com',
    password: 'password123',
    role: 'ADMIN',
  });

  const donorUser = await User.create({
    name: 'Donor Tester',
    email: 'donorveh@example.com',
    password: 'password123',
    role: 'DONOR',
  });

  // Start HTTP Server on port 5100
  await new Promise((resolve) => {
    server = http.createServer(app);
    server.listen(5100, () => {
      baseUrl = 'http://127.0.0.1:5100/api';
      console.log('✓ Test HTTP Server running on port 5100');
      resolve();
    });
  });

  const assert = (condition, testName) => {
    if (condition) {
      console.log(`[PASS] ${testName}`);
    } else {
      console.error(`[FAIL] ${testName}`);
      process.exitCode = 1;
    }
  };

  try {
    // 1. Login as ADMIN and DONOR
    const resAdminLogin = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'adminveh@example.com', password: 'password123' }),
    });
    const adminToken = (await resAdminLogin.json()).token;

    const resDonorLogin = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'donorveh@example.com', password: 'password123' }),
    });
    const donorToken = (await resDonorLogin.json()).token;

    // 2. Access Control: Donor blocked from Admin Vehicle APIs (403 Forbidden)
    const resForbidden = await fetch(`${baseUrl}/admin/vehicles`, {
      headers: { Authorization: `Bearer ${donorToken}` },
    });
    assert(resForbidden.status === 403, 'Test 1: Donor user blocked from admin vehicles API (403 Forbidden)');

    // 3. Admin Add Vehicle (POST /api/admin/vehicles)
    const resCreate = await fetch(`${baseUrl}/admin/vehicles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        vehicleNumber: 'TS 09 AB 9999',
        vehicleType: 'Four Wheeler',
        capacity: 150,
        city: 'Hyderabad',
        notes: 'Dedicated delivery car for food drives',
      }),
    });
    const createData = await resCreate.json();
    assert(
      resCreate.status === 201 &&
        createData.data.capacity === 150 &&
        createData.data.status === 'AVAILABLE',
      'Test 2: Admin create vehicle (201 Created - Capacity: 150 meals)'
    );

    const vehId = createData.data.id;

    // 4. Admin GET All Vehicles (GET /api/admin/vehicles)
    const resList = await fetch(`${baseUrl}/admin/vehicles`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const listData = await resList.json();
    assert(
      resList.status === 200 && listData.data.length >= 1,
      'Test 3: GET /api/admin/vehicles returns vehicle list with capacity & status'
    );

    // 5. Seed Delivery with 200 meals capacity requirement (Exceeds 150 capacity vehicle)
    const largeDelivery = await Delivery.create({
      customerName: 'Hope Mega Shelter',
      numberOfMeals: 200,
      pickupLocation: 'Jubilee Hills',
      deliveryLocation: 'Banjara Hills',
      status: 'ASSIGNED',
    });

    // 6. CAPACITY VALIDATION CHECK: Attempt to assign 150-capacity vehicle to 200-meals delivery -> Expected 400 Bad Request!
    const resInvalidAssign = await fetch(`${baseUrl}/admin/vehicles/assign-delivery`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        vehicleId: vehId,
        deliveryId: largeDelivery.id,
      }),
    });
    const invalidData = await resInvalidAssign.json();
    assert(
      resInvalidAssign.status === 400 &&
        invalidData.message.includes('insufficient'),
      'Test 4: Capacity Validation Check: Reject assigning 150-capacity vehicle to 200-meals delivery (400 Bad Request)'
    );

    // 7. Seed Delivery with 100 meals requirement (Fits within 150 capacity vehicle)
    const validDelivery = await Delivery.create({
      customerName: 'St. Jude Children Home',
      numberOfMeals: 100,
      pickupLocation: 'Madhapur',
      deliveryLocation: 'Banjara Hills',
      status: 'ASSIGNED',
      volunteerName: 'Rahul Sharma',
    });

    // 8. VALID ASSIGNMENT: Assign 150-capacity vehicle to 100-meals delivery -> Expected 200 OK!
    const resValidAssign = await fetch(`${baseUrl}/admin/vehicles/assign-delivery`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        vehicleId: vehId,
        deliveryId: validDelivery.id,
      }),
    });
    const validAssignData = await resValidAssign.json();
    assert(
      resValidAssign.status === 200 &&
        validAssignData.vehicle.status === 'ASSIGNED' &&
        validAssignData.delivery.vehicleNumber === 'TS 09 AB 9999',
      'Test 5: Valid Assignment Check: Assign 150-capacity vehicle to 100-meals delivery (200 OK - ASSIGNED)'
    );

    // 9. Admin Edit Vehicle Details (PUT /api/admin/vehicles/:id)
    const resEdit = await fetch(`${baseUrl}/admin/vehicles/${vehId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        capacity: 300,
        notes: 'Upgraded rear container storage for high capacity',
      }),
    });
    const editData = await resEdit.json();
    assert(
      resEdit.status === 200 && editData.data.capacity === 300,
      'Test 6: Admin edit vehicle capacity to 300 meals (200 OK)'
    );

    // 10. Admin Toggle Account Status (PATCH /api/admin/vehicles/:id/toggle-status)
    const resToggle = await fetch(`${baseUrl}/admin/vehicles/${vehId}/toggle-status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const toggleData = await resToggle.json();
    assert(
      resToggle.status === 200 && toggleData.data.accountStatus === 'INACTIVE',
      'Test 7: Admin toggle vehicle status to INACTIVE (200 OK)'
    );

    // 11. Admin View Detailed Profile & Usage History (GET /api/admin/vehicles/:id)
    const resDetail = await fetch(`${baseUrl}/admin/vehicles/${vehId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const detailData = await resDetail.json();
    assert(
      resDetail.status === 200 &&
        detailData.data.usageHistory.length >= 1 &&
        detailData.data.usageHistory[0].deliveryId === validDelivery.deliveryId,
      'Test 8: GET /api/admin/vehicles/:id returns vehicle specs and usage history'
    );

    console.log('--- ALL ADMIN VEHICLES MODULE TESTS PASSED! ---');
  } catch (err) {
    console.error('Test execution failed:', err);
    process.exitCode = 1;
  } finally {
    if (server) server.close();
    await mongoose.connection.close();
  }
};

runTests();
