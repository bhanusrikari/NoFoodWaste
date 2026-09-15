require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/modules/auth/auth.model');
const FoodRequest = require('./src/modules/foodRequest/foodRequest.model');
const Donation = require('./src/modules/donation/donation.model');
const app = require('./src/app');
const http = require('http');

let server;
let baseUrl;

const runTests = async () => {
  console.log('--- STARTING ADMIN FOOD REQUESTS MODULE WORKFLOW TEST SUITE ---');

  // Connect DB
  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/nofoodwaste';
  await mongoose.connect(mongoUri);
  console.log('✓ MongoDB Connected');

  // Clean test records
  await User.deleteMany({ email: { $in: ['adminmod@example.com', 'donormod@example.com'] } });
  await FoodRequest.deleteMany({});
  await Donation.deleteMany({});
  console.log('✓ Cleaned test database');

  // Create admin user & donor user
  const adminUser = await User.create({
    name: 'Admin Module Tester',
    email: 'adminmod@example.com',
    password: 'password123',
    role: 'ADMIN',
  });

  const donorUser = await User.create({
    name: 'Donor Module Tester',
    email: 'donormod@example.com',
    password: 'password123',
    role: 'DONOR',
  });

  // Start HTTP Server on port 5096
  await new Promise((resolve) => {
    server = http.createServer(app);
    server.listen(5096, () => {
      baseUrl = 'http://127.0.0.1:5096/api';
      console.log('✓ Test HTTP Server running on port 5096');
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
    // 1. Login as ADMIN
    const resAdminLogin = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'adminmod@example.com', password: 'password123' }),
    });
    const adminToken = (await resAdminLogin.json()).token;

    // 2. Submit Customer Food Requirement
    const resReq = await fetch(`${baseUrl}/food-requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName: 'Hope Foundation Shelter',
        phone: '+91 98765 43210',
        numberOfMeals: 120,
        foodType: 'Veg',
        foodCategory: 'Cooked',
        location: 'Secunderabad',
        requiredDate: '2026-09-25',
        requiredTime: '13:00',
      }),
    });
    const reqData = await resReq.json();
    assert(resReq.status === 201 && reqData.data.status === 'SUBMITTED', 'Test 1: Customer submit requirement (201 - SUBMITTED)');

    const reqId = reqData.data.id;

    // 3. Admin Verify Requirement (SUBMITTED -> VERIFIED)
    const resVerify = await fetch(`${baseUrl}/admin/food-requests/${reqId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ status: 'VERIFIED', adminNotes: 'Verified phone call' }),
    });
    const verifyData = await resVerify.json();
    assert(resVerify.status === 200 && verifyData.data.status === 'VERIFIED', 'Test 2: Admin verify requirement (SUBMITTED -> VERIFIED)');

    // 4. Create Available Donation
    const donation = await Donation.create({
      donorName: 'Taj Hotel Kitchen',
      phone: '+91 98765 00001',
      foodTitle: '120 Meals of Rice & Curry',
      numberOfMeals: 120,
      foodType: 'Veg',
      foodCategory: 'Cooked',
      pickupLocation: 'Banjara Hills',
      status: 'AVAILABLE',
    });
    console.log('✓ Created available donation for matching');

    // 5. Test Admin Get Available Donations
    const resAvail = await fetch(`${baseUrl}/admin/donations/available`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const availData = await resAvail.json();
    assert(resAvail.status === 200 && availData.data.length > 0, 'Test 3: Admin get available donations (200)');

    // 6. Test Admin Manual Donor Matching
    const resMatch = await fetch(`${baseUrl}/admin/food-requests/${reqId}/match-donor`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ donationId: donation.id }),
    });
    const matchData = await resMatch.json();
    assert(
      resMatch.status === 200 &&
        matchData.data.status === 'DONOR_MATCHED' &&
        matchData.data.matchedDonorDetails.donorName === 'Taj Hotel Kitchen',
      'Test 4: Admin manual match donor (VERIFIED -> DONOR_MATCHED)'
    );

    // 7. Verify Lifecycle Logs Tracking
    const resGetSingle = await fetch(`${baseUrl}/admin/food-requests/${reqId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const singleData = await resGetSingle.json();
    assert(
      resGetSingle.status === 200 &&
        Array.isArray(singleData.data.lifecycleLogs) &&
        singleData.data.lifecycleLogs.length >= 3,
      'Test 5: Request contains detailed lifecycle tracking logs'
    );

    // 8. Test Multi-parameter Filtering (Status, Location, FoodType)
    const resFilter = await fetch(`${baseUrl}/admin/food-requests?status=DONOR_MATCHED&foodType=Veg&location=Secunderabad`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const filterData = await resFilter.json();
    assert(resFilter.status === 200 && filterData.data.length > 0, 'Test 6: Multi-parameter filtering works accurately');

    console.log('--- ALL ADMIN FOOD REQUESTS MODULE WORKFLOW TESTS PASSED! ---');
  } catch (err) {
    console.error('Test execution failed:', err);
    process.exitCode = 1;
  } finally {
    if (server) server.close();
    await mongoose.connection.close();
  }
};

runTests();
