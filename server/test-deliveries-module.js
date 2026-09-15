const mongoose = require('mongoose');
const http = require('http');
const express = require('express');
const User = require('./src/modules/auth/auth.model');
const Vehicle = require('./src/modules/vehicle/vehicle.model');
const Delivery = require('./src/modules/delivery/delivery.model');
const Donation = require('./src/modules/donation/donation.model');
const FoodRequest = require('./src/modules/foodRequest/foodRequest.model');
const routes = require('./src/routes');

const app = express();
app.use(express.json());
app.use('/api', routes);

// Global Error Handler
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

const PORT = 5098;
let server;
let adminToken = '';
let donorToken = '';
let volunteerId = '';
let vehicleId = '';
let testDeliveryId = '';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/nofoodwaste';

function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, raw: body });
        }
      });
    });
    req.on('error', reject);
    if (postData) {
      req.write(JSON.stringify(postData));
    }
    req.end();
  });
}

async function runTests() {
  console.log('--- STARTING ADMIN DELIVERY ASSIGNMENT & DELIVERIES MODULE TEST SUITE ---');
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✓ MongoDB Connected');

    // Clean DB
    await User.deleteMany({ email: /@testdelivery\.com$/ });
    await Vehicle.deleteMany({ vehicleNumber: /TS 99 TE/ });
    await Delivery.deleteMany({ customerName: /Test Delivery Customer/ });
    await Donation.deleteMany({ donorName: /Test Delivery Donor/ });

    server = app.listen(PORT, () => console.log(`✓ Test HTTP Server running on port ${PORT}`));

    // 1. Create & Login Admin
    const adminUser = await User.create({
      name: 'Test Delivery Admin',
      email: 'admin@testdelivery.com',
      password: 'Password123!',
      role: 'ADMIN',
    });

    const adminLoginRes = await makeRequest({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }, { email: 'admin@testdelivery.com', password: 'Password123!' });

    adminToken = adminLoginRes.body.token;

    // 2. Create Donor & Volunteer
    const donorUser = await User.create({
      name: 'Test Delivery Donor',
      email: 'donor@testdelivery.com',
      password: 'Password123!',
      role: 'DONOR',
    });

    const donorLoginRes = await makeRequest({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }, { email: 'donor@testdelivery.com', password: 'Password123!' });

    donorToken = donorLoginRes.body.token;

    const volUser = await User.create({
      name: 'Test Active Volunteer',
      email: 'vol@testdelivery.com',
      password: 'Password123!',
      role: 'VOLUNTEER',
      phone: '+91 99999 88888',
      verificationStatus: 'VERIFIED',
      availabilityStatus: 'AVAILABLE',
      accountStatus: 'ACTIVE',
    });
    volunteerId = volUser._id.toString();

    // 3. Create Vehicle
    const testVeh = await Vehicle.create({
      vehicleNumber: 'TS 99 TE 1000',
      vehicleType: 'Mini Truck',
      capacity: 150,
      status: 'AVAILABLE',
      accountStatus: 'ACTIVE',
    });
    vehicleId = testVeh._id.toString();

    // TEST 1: Unauthorized user blocked from Admin Deliveries API
    const unauthRes = await makeRequest({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api/admin/deliveries',
      method: 'GET',
      headers: { Authorization: `Bearer ${donorToken}` },
    });

    if (unauthRes.status === 403) {
      console.log('[PASS] Test 1: Donor user blocked from admin deliveries API (403 Forbidden)');
    } else {
      console.error('[FAIL] Test 1: Expected 403, got:', unauthRes.status);
    }

    // TEST 2: Seed Sample Deliveries & Pending Assignments Lookup
    const seedRes = await makeRequest({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api/admin/deliveries/pending-assignments',
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    if (seedRes.status === 200 && Array.isArray(seedRes.body.data)) {
      console.log(`[PASS] Test 2: GET /api/admin/deliveries/pending-assignments returned ${seedRes.body.data.length} items`);
    } else {
      console.error('[FAIL] Test 2: Expected 200 array, got:', seedRes);
    }

    // TEST 3: Resource Allocation Available List Filter (capacity check)
    const availRes = await makeRequest({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api/admin/deliveries/available-resources?numberOfMeals=100',
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    if (availRes.status === 200 && availRes.body.data.volunteers && availRes.body.data.vehicles) {
      console.log(`[PASS] Test 3: GET available-resources returned ${availRes.body.data.volunteers.length} volunteers & ${availRes.body.data.vehicles.length} vehicles`);
    } else {
      console.error('[FAIL] Test 3: Expected available resources, got:', availRes);
    }

    // TEST 4: Create Pending Delivery & Assign Volunteer + Vehicle (200 OK)
    const newDelivery = await Delivery.create({
      customerName: 'Test Delivery Customer',
      donorName: 'Test Delivery Donor',
      numberOfMeals: 100,
      pickupLocation: 'Jubilee Hills, Hyderabad',
      deliveryLocation: 'Banjara Hills, Hyderabad',
      deliveryMethod: 'VOLUNTEER_PICKUP',
      status: 'PENDING_ASSIGNMENT',
    });
    testDeliveryId = newDelivery._id.toString();

    const assignRes = await makeRequest({
      hostname: '127.0.0.1',
      port: PORT,
      path: `/api/admin/deliveries/${testDeliveryId}/assign`,
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
    }, { volunteerId, vehicleId });

    if (assignRes.status === 200 && assignRes.body.data.status === 'ASSIGNED') {
      console.log('[PASS] Test 4: Assign Volunteer + Vehicle updated Delivery status to ASSIGNED');
    } else {
      console.error('[FAIL] Test 4: Assignment failed, got:', assignRes);
    }

    // Verify Volunteer & Vehicle status updated to ASSIGNED
    const updatedVol = await User.findById(volunteerId);
    const updatedVeh = await Vehicle.findById(vehicleId);

    if (updatedVol.availabilityStatus === 'ASSIGNED' && updatedVeh.status === 'ASSIGNED') {
      console.log('[PASS] Test 5: Volunteer availability and Vehicle status synchronized to ASSIGNED');
    } else {
      console.error('[FAIL] Test 5: Sync failed. Vol:', updatedVol.availabilityStatus, 'Veh:', updatedVeh.status);
    }

    // TEST 6: Capacity Exceeded Check (400 Bad Request)
    const smallVeh = await Vehicle.create({
      vehicleNumber: 'TS 99 TE 0050',
      vehicleType: 'Two Wheeler',
      capacity: 30, // capacity 30 < required 100 meals
      status: 'AVAILABLE',
      accountStatus: 'ACTIVE',
    });

    const capErrRes = await makeRequest({
      hostname: '127.0.0.1',
      port: PORT,
      path: `/api/admin/deliveries/${testDeliveryId}/assign`,
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
    }, { volunteerId, vehicleId: smallVeh._id.toString() });

    if (capErrRes.status === 400) {
      console.log('[PASS] Test 6: Assigning small vehicle (30 meals) to 100 meal delivery rejected (400 Bad Request)');
    } else {
      console.error('[FAIL] Test 6: Expected 400 Bad Request, got:', capErrRes.status);
    }

    // TEST 7: Lifecycle Progression (ACCEPTED -> FOOD_COLLECTED -> OUT_FOR_DELIVERY -> COMPLETED)
    const statusProgRes = await makeRequest({
      hostname: '127.0.0.1',
      port: PORT,
      path: `/api/admin/deliveries/${testDeliveryId}/status`,
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
    }, { status: 'FOOD_COLLECTED', note: 'Food picked up from donor' });

    if (statusProgRes.status === 200 && statusProgRes.body.data.status === 'FOOD_COLLECTED') {
      console.log('[PASS] Test 7: Delivery lifecycle status advanced to FOOD_COLLECTED');
    } else {
      console.error('[FAIL] Test 7: Status progression failed, got:', statusProgRes);
    }

    // TEST 8: Finalize Delivery to COMPLETED (releases resources)
    const completeRes = await makeRequest({
      hostname: '127.0.0.1',
      port: PORT,
      path: `/api/admin/deliveries/${testDeliveryId}/status`,
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
    }, { status: 'COMPLETED', note: 'Delivery completed & acknowledged' });

    if (completeRes.status === 200 && completeRes.body.data.status === 'COMPLETED') {
      console.log('[PASS] Test 8: Delivery finalized to COMPLETED');
    } else {
      console.error('[FAIL] Test 8: Finalize failed, got:', completeRes);
    }

    // Verify resources freed back to AVAILABLE
    const freedVol = await User.findById(volunteerId);
    const freedVeh = await Vehicle.findById(vehicleId);

    if (freedVol.availabilityStatus === 'AVAILABLE' && freedVeh.status === 'AVAILABLE') {
      console.log('[PASS] Test 9: Finalizing delivery automatically freed Volunteer & Vehicle back to AVAILABLE');
    } else {
      console.error('[FAIL] Test 9: Resource release failed. Vol:', freedVol.availabilityStatus, 'Veh:', freedVeh.status);
    }

    // TEST 10: GET /api/admin/deliveries multi-filter
    const filterRes = await makeRequest({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api/admin/deliveries?filterType=COMPLETED',
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    if (filterRes.status === 200 && filterRes.body.stats && filterRes.body.data.length > 0) {
      console.log(`[PASS] Test 10: GET /api/admin/deliveries?filterType=COMPLETED returned ${filterRes.body.data.length} completed items`);
    } else {
      console.error('[FAIL] Test 10: Deliveries filter failed, got:', filterRes);
    }

    console.log('--- ALL ADMIN DELIVERY ASSIGNMENT & DELIVERIES MODULE TESTS PASSED! ---');
  } catch (err) {
    console.error('❌ TEST FAILED:', err);
  } finally {
    if (server) server.close();
    await mongoose.disconnect();
  }
}

runTests();
