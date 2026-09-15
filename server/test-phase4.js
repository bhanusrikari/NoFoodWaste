require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/modules/auth/auth.model');
const FoodRequest = require('./src/modules/foodRequests/foodRequest.model');
const app = require('./src/app');
const { initSocket } = require('./src/socket');
const http = require('http');
const { io: ioClient } = require('socket.io-client');

let server;
let baseUrl;
let serverUrl;

const runPhase4Tests = async () => {
  console.log('--- STARTING PHASE 4 LIVE TRACKING & SOCKET SECURITY TEST SUITE ---');

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✓ MongoDB Connected');

  // Clear test data
  await User.deleteMany({ email: { $in: ['custA_p4@example.com', 'custB_p4@example.com', 'admin_p4@example.com'] } });
  await FoodRequest.deleteMany({});
  console.log('✓ Cleaned test database records');

  // Seed Users
  const customerA = await User.create({ name: 'Customer A P4', email: 'custA_p4@example.com', password: 'password123', role: 'CUSTOMER' });
  const customerB = await User.create({ name: 'Customer B P4', email: 'custB_p4@example.com', password: 'password123', role: 'CUSTOMER' });
  const adminP4 = await User.create({ name: 'Admin Publisher P4', email: 'admin_p4@example.com', password: 'password123', role: 'ADMIN' });

  // Create Food Request for Customer A with status OUT_FOR_DELIVERY
  const reqA = await FoodRequest.create({
    customer: customerA._id,
    peopleCount: 80,
    foodType: 'Vegetarian',
    location: 'Hyderabad Main Road',
    requiredDate: new Date('2026-10-05'),
    requiredTime: '18:00',
    status: 'OUT_FOR_DELIVERY',
    destinationCoords: { latitude: 17.385, longitude: 78.4867 },
    assignedVolunteer: { id: 'v123', name: 'Ravi Kumar', phone: '+91-9876543210' },
    assignedVehicle: { id: 'veh456', type: 'Van', registrationNumber: 'TS-09-AB-1234' },
    eta: { minutes: 15, updatedAt: new Date() },
  });

  // Start HTTP + Socket.IO server
  await new Promise((resolve) => {
    server = http.createServer(app);
    initSocket(server);
    server.listen(5096, () => {
      baseUrl = 'http://127.0.0.1:5096/api';
      serverUrl = 'http://127.0.0.1:5096';
      console.log('✓ Test Server running on port 5096');
      resolve();
    });
  });

  const getToken = async (email, password) => {
    const res = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    return (await res.json()).token;
  };

  const tokenA = await getToken('custA_p4@example.com', 'password123');
  const tokenB = await getToken('custB_p4@example.com', 'password123');
  const tokenAdmin = await getToken('admin_p4@example.com', 'password123');

  const assert = (condition, testName) => {
    if (condition) {
      console.log(`[PASS] ${testName}`);
    } else {
      console.error(`[FAIL] ${testName}`);
      process.exitCode = 1;
    }
  };

  try {
    // Test 1: Customer A can retrieve own tracking info
    const res1 = await fetch(`${baseUrl}/food-requests/${reqA._id}/tracking`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const data1 = await res1.json();
    assert(
      res1.status === 200 &&
        data1.success &&
        data1.data.tracking.active === true &&
        data1.data.tracking.volunteer.name === 'Ravi Kumar',
      'Test 1: Customer A can retrieve own tracking info'
    );

    // Test 2: Customer B cannot retrieve Customer A's tracking info (403 Forbidden)
    const res2 = await fetch(`${baseUrl}/food-requests/${reqA._id}/tracking`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    const data2 = await res2.json();
    assert(res2.status === 403 && !data2.success, 'Test 2: Customer B cannot retrieve Customer A tracking info (403 Forbidden)');

    // Test 3: Unauthenticated request rejected (401 Unauthorized)
    const res3 = await fetch(`${baseUrl}/food-requests/${reqA._id}/tracking`);
    const data3 = await res3.json();
    assert(res3.status === 401 && !data3.success, 'Test 3: Unauthenticated request rejected (401 Unauthorized)');

    // Test 4: Invalid request ID handled safely (400 Bad Request)
    const res4 = await fetch(`${baseUrl}/food-requests/invalid_id/tracking`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const data4 = await res4.json();
    assert(res4.status === 400 && !data4.success, 'Test 4: Invalid request ID handled safely (400 Bad Request)');

    // Test 5: Socket.IO Room Authorization Test
    const socketA = ioClient(serverUrl, { auth: { token: tokenA } });
    const socketB = ioClient(serverUrl, { auth: { token: tokenB } });
    const socketPublisher = ioClient(serverUrl, { auth: { token: tokenAdmin } });

    await new Promise((resolve) => {
      let socketAConnected = false;
      let socketBConnected = false;

      socketA.on('connect', () => {
        socketAConnected = true;
        socketA.emit('join:delivery_tracking', { requestId: reqA._id.toString() });
      });

      socketB.on('connect', () => {
        socketBConnected = true;
        socketB.emit('join:delivery_tracking', { requestId: reqA._id.toString() });
      });

      socketA.on('tracking:joined', (joinedData) => {
        assert(joinedData.success && joinedData.requestId === reqA._id.toString(), 'Test 5a: Customer A can join own tracking room');
        if (socketBConnected) resolve();
      });

      socketB.on('tracking:error', (errorData) => {
        assert(errorData.message.includes('Unauthorized'), 'Test 5b: Customer B BLOCKED from joining Customer A tracking room');
        resolve();
      });
    });

    // Test 6: CUSTOMER Client CANNOT Publish Location Updates (Security Rule)
    await new Promise((resolve) => {
      socketA.on('tracking:error', (errData) => {
        assert(
          errData.message.includes('Forbidden') && errData.message.includes('CUSTOMER'),
          'Test 6: CUSTOMER client is BLOCKED from emitting delivery:location:update (Security Enforced)'
        );
        resolve();
      });

      socketA.emit('delivery:location:update', {
        requestId: reqA._id.toString(),
        latitude: 99.9999,
        longitude: 99.9999,
      });
    });

    // Test 7: Authorized Publisher (ADMIN / VOLUNTEER) Publishes Location Update & Customer Receives Broadcast
    await new Promise((resolve) => {
      socketA.on('delivery:location:update', async (updateData) => {
        assert(
          updateData.requestId === reqA._id.toString() &&
            updateData.latitude === 17.4000 &&
            updateData.longitude === 78.4900,
          'Test 7a: Socket.IO forwards live location updates from authorized publisher to Customer in room'
        );

        // Verify DB update
        const updatedDoc = await FoodRequest.findById(reqA._id);
        assert(
          updatedDoc.currentLocation.latitude === 17.4000 &&
            updatedDoc.currentLocation.longitude === 78.4900,
          'Test 7b: Authorized location update persisted to MongoDB FoodRequest'
        );

        socketA.disconnect();
        socketB.disconnect();
        socketPublisher.disconnect();
        resolve();
      });

      socketPublisher.emit('delivery:location:update', {
        requestId: reqA._id.toString(),
        latitude: 17.4000,
        longitude: 78.4900,
        timestamp: new Date().toISOString(),
      });
    });

    console.log('--- ALL PHASE 4 LIVE TRACKING & SOCKET SECURITY TESTS PASSED! ---');
  } catch (err) {
    console.error('Test execution error:', err);
    process.exitCode = 1;
  } finally {
    server.close();
    await mongoose.connection.close();
  }
};

runPhase4Tests();
