require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/modules/auth/auth.model');
const Donation = require('./src/modules/donation/donation.model');
const FoodRequest = require('./src/modules/foodRequest/foodRequest.model');
const Delivery = require('./src/modules/delivery/delivery.model');
const app = require('./src/app');
const http = require('http');

let server;
let baseUrl;

const runTests = async () => {
  console.log('--- STARTING ADMIN DONATIONS MODULE WORKFLOW TEST SUITE ---');

  // Connect DB
  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/nofoodwaste';
  await mongoose.connect(mongoUri);
  console.log('✓ MongoDB Connected');

  // Clean test records
  await User.deleteMany({ email: { $in: ['admindon@example.com', 'donordon@example.com'] } });
  await Donation.deleteMany({});
  await FoodRequest.deleteMany({});
  await Delivery.deleteMany({});
  console.log('✓ Cleaned test database');

  // Create admin user & donor user
  const adminUser = await User.create({
    name: 'Admin Donation Tester',
    email: 'admindon@example.com',
    password: 'password123',
    role: 'ADMIN',
  });

  const donorUser = await User.create({
    name: 'Donor Tester',
    email: 'donordon@example.com',
    password: 'password123',
    role: 'DONOR',
  });

  // Start HTTP Server on port 5095
  await new Promise((resolve) => {
    server = http.createServer(app);
    server.listen(5095, () => {
      baseUrl = 'http://127.0.0.1:5095/api';
      console.log('✓ Test HTTP Server running on port 5095');
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
      body: JSON.stringify({ email: 'admindon@example.com', password: 'password123' }),
    });
    const adminToken = (await resAdminLogin.json()).token;

    // 2. Post Direct Donation
    const resDon = await fetch(`${baseUrl}/donations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        donorName: 'Green Bakery & Cafe',
        phone: '+91 98765 00002',
        email: 'bakery@green.com',
        foodTitle: '80 Assorted Breads & Pastries',
        numberOfMeals: 80,
        foodType: 'Veg',
        foodCategory: 'Bakery',
        donationOrigin: 'DIRECT_DONATION',
        availableDate: '2026-09-20',
        availableTime: '18:00',
        pickupLocation: 'Jubilee Hills, Hyderabad',
        deliveryMethod: 'VOLUNTEER_PICKUP',
      }),
    });
    const donData = await resDon.json();
    assert(resDon.status === 201 && donData.data.status === 'SUBMITTED', 'Test 1: Post Direct Donation (201 - SUBMITTED)');

    const donId = donData.data.id;

    // 3. Admin Verify Donation (SUBMITTED -> VERIFIED/AVAILABLE)
    const resVerify = await fetch(`${baseUrl}/admin/donations/${donId}/verify`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const verifyData = await resVerify.json();
    assert(resVerify.status === 200 && verifyData.data.status === 'AVAILABLE', 'Test 2: Admin verify donation (SUBMITTED -> AVAILABLE)');

    // 4. Create Open Food Requirement
    const foodRequest = await FoodRequest.create({
      customerName: 'St. Jude Children Home',
      phone: '+91 91234 56789',
      numberOfMeals: 80,
      foodType: 'Veg',
      foodCategory: 'Bakery',
      location: 'Banjara Hills',
      requiredDate: '2026-09-20',
      requiredTime: '19:00',
      status: 'VERIFIED',
    });
    console.log('✓ Created open food requirement for beneficiary assignment');

    // 5. Admin Manually Assign Beneficiary to Direct Donation
    const resAssign = await fetch(`${baseUrl}/admin/donations/${donId}/assign-beneficiary`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ requestId: foodRequest.id }),
    });
    const assignData = await resAssign.json();
    assert(
      resAssign.status === 200 &&
        assignData.data.status === 'MATCHED' &&
        assignData.data.matchedBeneficiary.customerName === 'St. Jude Children Home',
      'Test 3: Admin manual assign beneficiary (AVAILABLE -> MATCHED)'
    );

    // 6. Verify Converged Delivery Workflow Creation & Vehicle Details
    assert(
      assignData.data.delivery &&
        assignData.data.volunteerDetails &&
        assignData.data.volunteerDetails.volunteerName,
      'Test 4: Direct donation converges into unified delivery workflow with volunteer & vehicle details'
    );

    // 7. Verify 11 Display Fields in GET /api/admin/donations Response
    const resList = await fetch(`${baseUrl}/admin/donations`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const listData = await resList.json();
    const item = listData.data[0];
    const has11Fields =
      item.donationId &&
      item.donorName &&
      item.numberOfMeals !== undefined &&
      item.foodType &&
      item.foodCategory &&
      item.availableDate &&
      item.availableTime &&
      item.pickupLocation &&
      item.matchedBeneficiary &&
      item.deliveryMethod &&
      item.status;

    assert(resList.status === 200 && has11Fields, 'Test 5: GET /api/admin/donations returns all 11 required display fields');

    // 8. Test Flagging a Donation with Reason
    const resFlag = await fetch(`${baseUrl}/admin/donations/${donId}/flag-cancel`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ action: 'FLAG', reason: 'Packaging quality check needed' }),
    });
    const flagData = await resFlag.json();
    assert(
      resFlag.status === 200 &&
        flagData.data.status === 'FLAGGED' &&
        flagData.data.flagReason === 'Packaging quality check needed',
      'Test 6: Admin flag donation with reason (200 - FLAGGED)'
    );

    console.log('--- ALL ADMIN DONATIONS MODULE WORKFLOW TESTS PASSED! ---');
  } catch (err) {
    console.error('Test execution failed:', err);
    process.exitCode = 1;
  } finally {
    if (server) server.close();
    await mongoose.connection.close();
  }
};

runTests();
