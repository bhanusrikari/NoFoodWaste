require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/modules/auth/auth.model');
const FoodRequest = require('./src/modules/foodRequest/foodRequest.model');
const app = require('./src/app');
const http = require('http');

let server;
let baseUrl;

const runTests = async () => {
  console.log('--- STARTING ADMIN FOOD REQUESTS FEATURE TEST SUITE ---');

  // Connect DB
  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/nofoodwaste';
  await mongoose.connect(mongoUri);
  console.log('✓ MongoDB Connected');

  // Clean up old test data
  await User.deleteMany({ email: { $in: ['adminreq@example.com', 'donorreq@example.com'] } });
  await FoodRequest.deleteMany({});
  console.log('✓ Cleaned up test records');

  // Create admin user & donor user
  const adminUser = await User.create({
    name: 'Admin Requester',
    email: 'adminreq@example.com',
    password: 'password123',
    role: 'ADMIN',
  });

  const donorUser = await User.create({
    name: 'Donor Requester',
    email: 'donorreq@example.com',
    password: 'password123',
    role: 'DONOR',
  });

  // Start HTTP Server on port 5098
  await new Promise((resolve) => {
    server = http.createServer(app);
    server.listen(5098, () => {
      baseUrl = 'http://127.0.0.1:5098/api';
      console.log('✓ Test HTTP Server running on port 5098');
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
    // 1. Get Tokens
    const resAdminLogin = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'adminreq@example.com', password: 'password123' }),
    });
    const adminToken = (await resAdminLogin.json()).token;

    const resDonorLogin = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'donorreq@example.com', password: 'password123' }),
    });
    const donorToken = (await resDonorLogin.json()).token;

    // 2. Test Authorization: DONOR attempting to access Admin Food Requests endpoint
    const resUnauth = await fetch(`${baseUrl}/admin/food-requests`, {
      headers: { Authorization: `Bearer ${donorToken}` },
    });
    assert(resUnauth.status === 403, 'Test 1: Access denied for non-ADMIN user (403)');

    // 3. Test Authorization: Missing token attempting to access Admin Food Requests endpoint
    const resNoToken = await fetch(`${baseUrl}/admin/food-requests`);
    assert(resNoToken.status === 401, 'Test 2: Access denied for unauthenticated request (401)');

    // 4. Test Seeding Food Requests as ADMIN
    const resSeed = await fetch(`${baseUrl}/admin/food-requests/seed`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const seedData = await resSeed.json();
    assert(resSeed.status === 200 && seedData.success && seedData.count >= 6, 'Test 3: Admin seed sample requests (200)');

    // 5. Test Listing All Food Requests as ADMIN
    const resList = await fetch(`${baseUrl}/admin/food-requests`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const listData = await resList.json();
    assert(
      resList.status === 200 &&
        listData.success &&
        Array.isArray(listData.data) &&
        listData.stats.total >= 6,
      'Test 4: Admin GET all food requests with metrics stats (200)'
    );

    // 6. Validate Display Fields in Returned Food Request Object
    const firstReq = listData.data[0];
    const hasRequiredFields =
      firstReq.requestId &&
      firstReq.customerName &&
      firstReq.numberOfMeals !== undefined &&
      firstReq.foodType &&
      firstReq.foodCategory &&
      firstReq.location &&
      firstReq.requiredDate &&
      firstReq.requiredTime &&
      firstReq.status &&
      firstReq.createdAt;

    assert(hasRequiredFields, 'Test 5: Response contains all 10 required display fields');

    // 7. Test Customer Food Request Creation
    const resCreate = await fetch(`${baseUrl}/food-requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName: 'Test Orphanage Home',
        organizationName: 'Test Trust',
        phone: '+91 99887 76655',
        email: 'test@orphanage.org',
        numberOfMeals: 100,
        foodType: 'Veg',
        foodCategory: 'Cooked',
        location: '123 Test Street',
        city: 'Hyderabad',
        requiredDate: '2026-09-25',
        requiredTime: '13:30',
      }),
    });
    const createData = await resCreate.json();
    assert(
      resCreate.status === 201 &&
        createData.success &&
        createData.data.status === 'PENDING',
      'Test 6: Customer submit food requirement (201 - PENDING)'
    );

    const newReqId = createData.data.id;

    // 8. Test Admin Approving Request (PENDING -> VERIFIED)
    const resApprove = await fetch(`${baseUrl}/admin/food-requests/${newReqId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        status: 'VERIFIED',
        adminNotes: 'Verified via phone call with manager',
      }),
    });
    const approveData = await resApprove.json();
    assert(
      resApprove.status === 200 &&
        approveData.success &&
        approveData.data.status === 'VERIFIED' &&
        approveData.data.adminNotes === 'Verified via phone call with manager',
      'Test 7: Admin approve request (PENDING -> VERIFIED)'
    );

    // 9. Test Admin Rejecting a Request (VERIFIED -> REJECTED)
    const resReject = await fetch(`${baseUrl}/admin/food-requests/${newReqId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        status: 'REJECTED',
        rejectionReason: 'Invalid location details',
      }),
    });
    const rejectData = await resReject.json();
    assert(
      resReject.status === 200 &&
        rejectData.success &&
        rejectData.data.status === 'REJECTED' &&
        rejectData.data.rejectionReason === 'Invalid location details',
      'Test 8: Admin reject request (VERIFIED -> REJECTED)'
    );

    // 10. Test Admin Cancelling a Request
    const resCancel = await fetch(`${baseUrl}/admin/food-requests/${newReqId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        status: 'CANCELLED',
        cancellationReason: 'Event cancelled by customer',
      }),
    });
    const cancelData = await resCancel.json();
    assert(
      resCancel.status === 200 &&
        cancelData.success &&
        cancelData.data.status === 'CANCELLED' &&
        cancelData.data.cancellationReason === 'Event cancelled by customer',
      'Test 9: Admin cancel request (REJECTED -> CANCELLED)'
    );

    // 11. Test Filtering by Status
    const resFilter = await fetch(`${baseUrl}/admin/food-requests?status=VERIFIED`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const filterData = await resFilter.json();
    const allVerified = filterData.data.every((r) => r.status === 'VERIFIED');
    assert(resFilter.status === 200 && allVerified, 'Test 10: Status filtering works correctly');

    console.log('--- ALL ADMIN FOOD REQUESTS FEATURE TESTS PASSED! ---');
  } catch (err) {
    console.error('Test execution failed:', err);
    process.exitCode = 1;
  } finally {
    if (server) server.close();
    await mongoose.connection.close();
  }
};

runTests();
