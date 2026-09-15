require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/modules/auth/auth.model');
const FoodRequest = require('./src/modules/foodRequest/foodRequest.model');
const Donation = require('./src/modules/donation/donation.model');
const Delivery = require('./src/modules/delivery/delivery.model');
const app = require('./src/app');
const http = require('http');

let server;
let baseUrl;

const runTests = async () => {
  console.log('--- STARTING ADMIN DASHBOARD OPERATIONS CENTER TEST SUITE ---');

  // Connect DB
  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/nofoodwaste';
  await mongoose.connect(mongoUri);
  console.log('✓ MongoDB Connected');

  // Clean test users & entities
  await User.deleteMany({ email: { $in: ['admindash@example.com', 'donordash@example.com'] } });
  console.log('✓ Cleaned test database');

  // Create admin user & donor user
  const adminUser = await User.create({
    name: 'Admin Dashboard Tester',
    email: 'admindash@example.com',
    password: 'password123',
    role: 'ADMIN',
  });

  const donorUser = await User.create({
    name: 'Donor Dashboard Tester',
    email: 'donordash@example.com',
    password: 'password123',
    role: 'DONOR',
  });

  // Start HTTP Server on port 5097
  await new Promise((resolve) => {
    server = http.createServer(app);
    server.listen(5097, () => {
      baseUrl = 'http://127.0.0.1:5097/api';
      console.log('✓ Test HTTP Server running on port 5097');
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
    // Get tokens
    const resAdminLogin = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admindash@example.com', password: 'password123' }),
    });
    const adminToken = (await resAdminLogin.json()).token;

    const resDonorLogin = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'donordash@example.com', password: 'password123' }),
    });
    const donorToken = (await resDonorLogin.json()).token;

    // Test 1: Access denied for non-ADMIN user (403)
    const resForbidden = await fetch(`${baseUrl}/admin/dashboard`, {
      headers: { Authorization: `Bearer ${donorToken}` },
    });
    assert(resForbidden.status === 403, 'Test 1: Access denied for DONOR role (403)');

    // Test 2: Access denied for unauthenticated request (401)
    const resUnauth = await fetch(`${baseUrl}/admin/dashboard`);
    assert(resUnauth.status === 401, 'Test 2: Access denied for unauthenticated request (401)');

    // Test 3: Admin Seed Dashboard Data
    const resSeed = await fetch(`${baseUrl}/admin/dashboard/seed`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const seedResult = await resSeed.json();
    assert(resSeed.status === 200 && seedResult.success, 'Test 3: Seed dashboard operations data (200)');

    // Test 4: Admin GET Dashboard Data
    const resDash = await fetch(`${baseUrl}/admin/dashboard`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const dashData = await resDash.json();
    assert(
      resDash.status === 200 &&
        dashData.success &&
        dashData.data.summaryCards &&
        dashData.data.activeOperations &&
        dashData.data.todaysImpact,
      'Test 4: GET /api/admin/dashboard returns complete dashboard data'
    );

    // Test 5: Verify 8 Summary Cards metrics exist
    const cards = dashData.data.summaryCards;
    const hasAll8Cards =
      cards.openFoodRequests !== undefined &&
      cards.availableDonations !== undefined &&
      cards.pendingMatches !== undefined &&
      cards.pendingDeliveryAssignments !== undefined &&
      cards.activeDeliveries !== undefined &&
      cards.completedDeliveriesToday !== undefined &&
      cards.availableVolunteers !== undefined &&
      cards.verifiedBeneficiaries !== undefined;
    assert(hasAll8Cards, 'Test 5: Summary Cards contain all 8 real-time metric counters');

    // Test 6: Verify Active Operations Pipeline Flow Structure
    const ops = dashData.data.activeOperations;
    assert(Array.isArray(ops) && ops.length > 0 && ops[0].deliveryId && ops[0].customerName, 'Test 6: Active Operations pipeline array formatted correctly');

    // Test 7: Verify Today's Impact Statistics
    const impact = dashData.data.todaysImpact;
    const hasImpactMetrics =
      impact.mealsDonated !== undefined &&
      impact.mealsDelivered !== undefined &&
      impact.requestsFulfilled !== undefined &&
      impact.activeDonors !== undefined &&
      impact.activeBeneficiaries !== undefined;
    assert(hasImpactMetrics, "Test 7: Today's Impact statistics contains all 5 impact metrics");

    console.log('--- ALL ADMIN DASHBOARD TESTS PASSED SUCCESSFULLY! ---');
  } catch (err) {
    console.error('Test execution failed:', err);
    process.exitCode = 1;
  } finally {
    if (server) server.close();
    await mongoose.connection.close();
  }
};

runTests();
