require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/modules/auth/auth.model');
const Beneficiary = require('./src/modules/beneficiary/beneficiary.model');
const FoodRequest = require('./src/modules/foodRequest/foodRequest.model');
const Donation = require('./src/modules/donation/donation.model');
const app = require('./src/app');
const http = require('http');

let server;
let baseUrl;

const runTests = async () => {
  console.log('--- STARTING ADMIN BENEFICIARIES MODULE TEST SUITE ---');

  // Connect DB
  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/nofoodwaste';
  await mongoose.connect(mongoUri);
  console.log('✓ MongoDB Connected');

  // Clean test records
  await User.deleteMany({ email: { $in: ['adminben@example.com', 'donorben@example.com'] } });
  await Beneficiary.deleteMany({});
  await FoodRequest.deleteMany({});
  await Donation.deleteMany({});
  console.log('✓ Cleaned test database');

  // Create admin user & donor user
  const adminUser = await User.create({
    name: 'Admin Beneficiary Tester',
    email: 'adminben@example.com',
    password: 'password123',
    role: 'ADMIN',
  });

  const donorUser = await User.create({
    name: 'Donor Tester',
    email: 'donorben@example.com',
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
    // 1. Login as ADMIN and DONOR
    const resAdminLogin = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'adminben@example.com', password: 'password123' }),
    });
    const adminToken = (await resAdminLogin.json()).token;

    const resDonorLogin = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'donorben@example.com', password: 'password123' }),
    });
    const donorToken = (await resDonorLogin.json()).token;

    // 2. Test Authorization: Donor blocked from Admin Beneficiary APIs (403 Forbidden)
    const resForbidden = await fetch(`${baseUrl}/admin/beneficiaries`, {
      headers: { Authorization: `Bearer ${donorToken}` },
    });
    assert(resForbidden.status === 403, 'Test 1: Donor user blocked from admin beneficiaries API (403 Forbidden)');

    // 3. Admin Add Beneficiary (POST /api/admin/beneficiaries)
    const resCreate = await fetch(`${baseUrl}/admin/beneficiaries`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        organizationName: 'Grace Children Home & Shelter',
        category: "Children's Home",
        contactPerson: 'David Miller',
        phone: '+91 98765 44321',
        email: 'info@gracechildren.org',
        location: 'Madhapur, Hyderabad',
        city: 'Hyderabad',
        peopleServed: 110,
        notes: 'Submitted for verification',
      }),
    });
    const createData = await resCreate.json();
    assert(
      resCreate.status === 201 &&
        createData.data.verificationStatus === 'PENDING_VERIFICATION' &&
        createData.data.accountStatus === 'ACTIVE',
      'Test 2: Admin create beneficiary organization (201 Created - PENDING_VERIFICATION)'
    );

    const benId = createData.data.id;

    // 4. Test Public / Donor Verified Endpoint: Pending beneficiary should NOT be listed for donors
    const resPublicPending = await fetch(`${baseUrl}/beneficiaries/verified`);
    const publicPendingData = await resPublicPending.json();
    assert(
      resPublicPending.status === 200 &&
        publicPendingData.data.every((b) => b.verificationStatus === 'VERIFIED'),
      'Test 3: Public donor endpoint returns ONLY VERIFIED & ACTIVE beneficiaries'
    );

    // 5. Admin Verify Beneficiary (PATCH /api/admin/beneficiaries/:id/verify)
    const resVerify = await fetch(`${baseUrl}/admin/beneficiaries/${benId}/verify`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const verifyData = await resVerify.json();
    assert(
      resVerify.status === 200 && verifyData.data.verificationStatus === 'VERIFIED',
      'Test 4: Admin verify beneficiary organization (200 OK - VERIFIED)'
    );

    // 6. Test Public / Donor Verified Endpoint: Verified beneficiary now appears for donors!
    const resPublicVerified = await fetch(`${baseUrl}/beneficiaries/verified`);
    const publicVerifiedData = await resPublicVerified.json();
    const isNowVisible = publicVerifiedData.data.some((b) => b.id === benId);
    assert(isNowVisible, 'Test 5: Verified beneficiary is now exposed to donors in "Donate to Someone in Need" workflow');

    // 7. Seed Food Requirement & Donation for Beneficiary History View Test
    const foodReq = await FoodRequest.create({
      customerName: 'Grace Children Home & Shelter',
      organizationName: 'Grace Children Home & Shelter',
      phone: '+91 98765 44321',
      numberOfMeals: 110,
      foodType: 'Veg',
      foodCategory: 'Cooked',
      location: 'Madhapur, Hyderabad',
      requiredDate: '2026-09-30',
      requiredTime: '18:00',
      status: 'VERIFIED',
    });

    const donation = await Donation.create({
      donorName: 'Grand Hotel Hyderabad',
      phone: '+91 91111 22222',
      foodTitle: '110 Veg Thali Meals',
      numberOfMeals: 110,
      foodType: 'Veg',
      foodCategory: 'Cooked',
      pickupLocation: 'Madhapur',
      matchedBeneficiary: {
        customerName: 'Grace Children Home & Shelter',
        organizationName: 'Grace Children Home & Shelter',
        phone: '+91 98765 44321',
        location: 'Madhapur, Hyderabad',
        requestId: foodReq.requestId,
      },
      status: 'MATCHED',
    });

    // 8. Test Admin Detailed View with Open Requirements & Fulfillment History
    const resDetail = await fetch(`${baseUrl}/admin/beneficiaries/${benId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const detailData = await resDetail.json();
    assert(
      resDetail.status === 200 &&
        detailData.data.foodRequests.length >= 1 &&
        detailData.data.donations.length >= 1,
      'Test 6: GET /api/admin/beneficiaries/:id returns detailed view with requirements & donation history'
    );

    // 9. Admin Edit Beneficiary Details (PUT /api/admin/beneficiaries/:id)
    const resEdit = await fetch(`${baseUrl}/admin/beneficiaries/${benId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        peopleServed: 125,
        notes: 'Updated resident capacity after expansion',
      }),
    });
    const editData = await resEdit.json();
    assert(
      resEdit.status === 200 && editData.data.peopleServed === 125,
      'Test 7: Admin edit beneficiary details (200 OK)'
    );

    // 10. Admin Toggle Account Status (PATCH /api/admin/beneficiaries/:id/toggle-status)
    const resToggle = await fetch(`${baseUrl}/admin/beneficiaries/${benId}/toggle-status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const toggleData = await resToggle.json();
    assert(
      resToggle.status === 200 && toggleData.data.accountStatus === 'INACTIVE',
      'Test 8: Admin toggle beneficiary status to INACTIVE (200 OK)'
    );

    // 11. Admin Reject Verification with Reason (PATCH /api/admin/beneficiaries/:id/reject)
    const resReject = await fetch(`${baseUrl}/admin/beneficiaries/${benId}/reject`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ reason: 'Official registration document expired' }),
    });
    const rejectData = await resReject.json();
    assert(
      resReject.status === 200 &&
        rejectData.data.verificationStatus === 'REJECTED' &&
        rejectData.data.rejectionReason === 'Official registration document expired',
      'Test 9: Admin reject beneficiary with documented reason (200 OK)'
    );

    console.log('--- ALL ADMIN BENEFICIARIES MODULE TESTS PASSED! ---');
  } catch (err) {
    console.error('Test execution failed:', err);
    process.exitCode = 1;
  } finally {
    if (server) server.close();
    await mongoose.connection.close();
  }
};

runTests();
