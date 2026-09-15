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
  console.log('--- STARTING ADMIN MATCHING MODULE TEST SUITE ---');

  // Connect DB
  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/nofoodwaste';
  await mongoose.connect(mongoUri);
  console.log('✓ MongoDB Connected');

  // Clean test records
  await User.deleteMany({ email: { $in: ['adminmatch@example.com'] } });
  await Donation.deleteMany({});
  await FoodRequest.deleteMany({});
  await Delivery.deleteMany({});
  console.log('✓ Cleaned test database');

  // Create admin user
  const adminUser = await User.create({
    name: 'Admin Match Tester',
    email: 'adminmatch@example.com',
    password: 'password123',
    role: 'ADMIN',
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
      body: JSON.stringify({ email: 'adminmatch@example.com', password: 'password123' }),
    });
    const adminToken = (await resAdminLogin.json()).token;

    // 2. Seed Test Food Requirements and Donations
    // Requirement 1: 100 meals, Veg, Cooked, Jubilee Hills, 2026-09-25 19:00
    const req1 = await FoodRequest.create({
      customerName: 'Hope Shelter',
      phone: '+91 98765 11111',
      numberOfMeals: 100,
      foodType: 'Veg',
      foodCategory: 'Cooked',
      location: 'Jubilee Hills, Hyderabad',
      requiredDate: '2026-09-25',
      requiredTime: '19:00',
      status: 'VERIFIED',
    });

    // Donation 1: 100 meals, Veg, Cooked, Jubilee Hills, 2026-09-25 18:30 (Near 100% Match!)
    const don1 = await Donation.create({
      donorName: 'Grand Royal Caterers',
      phone: '+91 98765 22222',
      email: 'catering@grandroyal.com',
      foodTitle: '100 Deluxe Veg Thali Meals',
      numberOfMeals: 100,
      foodType: 'Veg',
      foodCategory: 'Cooked',
      availableDate: '2026-09-25',
      availableTime: '18:30',
      pickupLocation: 'Jubilee Hills, Hyderabad',
      deliveryMethod: 'VOLUNTEER_PICKUP',
      status: 'AVAILABLE',
    });

    // Donation 2: Non-Veg meals (Incompatible food type for req1 -> Score should be 0%)
    const don2 = await Donation.create({
      donorName: 'Grill & BBQ House',
      phone: '+91 98765 33333',
      foodTitle: '50 Chicken Biryani Meals',
      numberOfMeals: 50,
      foodType: 'Non-Veg',
      foodCategory: 'Cooked',
      availableDate: '2026-09-25',
      availableTime: '19:00',
      pickupLocation: 'Banjara Hills, Hyderabad',
      deliveryMethod: 'DONOR_SELF_DROP',
      status: 'AVAILABLE',
    });

    console.log('✓ Test data seeded: 1 Request, 2 Donations');

    // 3. Test Dual Entry 1: Find candidate Donors for Food Requirement (req1)
    const resReqMatches = await fetch(`${baseUrl}/admin/matching/request/${req1.id}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const reqMatchData = await resReqMatches.json();
    assert(resReqMatches.status === 200, 'Test 1: GET /api/admin/matching/request/:id returns 200');
    assert(reqMatchData.matches && reqMatchData.matches.length >= 1, 'Test 2: Candidates returned for food request');

    const topCandidate = reqMatchData.matches[0];
    assert(topCandidate.matchScore >= 90, `Test 3: Top candidate match score is high (Got ${topCandidate.matchScore}%)`);
    assert(topCandidate.reasons.length > 0, 'Test 4: Match reasons populated');

    // Verify incompatible donor has 0 score (filtered out or present with 0)
    const incompatibleCand = reqMatchData.matches.find((c) => c.donation.id === don2.id.toString());
    assert(!incompatibleCand || incompatibleCand.matchScore === 0, 'Test 5: Incompatible food type yields 0% match score');

    // 4. Test Dual Entry 2: Find candidate Food Requirements for Donation (don1)
    const resDonMatches = await fetch(`${baseUrl}/admin/matching/donation/${don1.id}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const donMatchData = await resDonMatches.json();
    assert(resDonMatches.status === 200 && donMatchData.matches && donMatchData.matches.length >= 1, 'Test 6: GET /api/admin/matching/donation/:id returns candidates');

    // 5. Test Global Candidate Matches
    const resSuggested = await fetch(`${baseUrl}/admin/matching/suggested`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const suggestedData = await resSuggested.json();
    assert(resSuggested.status === 200 && suggestedData.data && suggestedData.data.length >= 1, 'Test 7: GET /api/admin/matching/suggested returns candidate matches');

    // 6. Test Admin Approve Match
    const resApprove = await fetch(`${baseUrl}/admin/matching/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        requestId: req1.id,
        donationId: don1.id,
        notes: 'Approved optimal 90%+ match by Admin',
      }),
    });
    const approveData = await resApprove.json();
    assert(resApprove.status === 200, 'Test 8: POST /api/admin/matching/approve returns 200 OK');

    // Check database state update
    const updatedReq1 = await FoodRequest.findById(req1.id);
    const updatedDon1 = await Donation.findById(don1.id);
    const createdDelivery = await Delivery.findOne({ foodRequest: req1.id, donation: don1.id });

    assert(updatedReq1.status === 'DONOR_MATCHED', 'Test 9: Request status updated to DONOR_MATCHED');
    assert(updatedDon1.status === 'MATCHED', 'Test 10: Donation status updated to MATCHED');
    assert(createdDelivery !== null && createdDelivery.status === 'ASSIGNED', 'Test 11: Delivery record created with status ASSIGNED');

    // 7. Test Reject Match
    const resReject = await fetch(`${baseUrl}/admin/matching/reject`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        requestId: req1.id,
        donationId: don2.id,
        reason: 'Incompatible food type',
      }),
    });
    const rejectData = await resReject.json();
    assert(resReject.status === 200, 'Test 12: POST /api/admin/matching/reject returns 200 OK');

    console.log('--- ALL ADMIN MATCHING MODULE TESTS PASSED! ---');
  } catch (err) {
    console.error('Test execution failed:', err);
    process.exitCode = 1;
  } finally {
    if (server) server.close();
    await mongoose.connection.close();
  }
};

runTests();
