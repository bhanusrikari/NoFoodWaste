require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/modules/auth/auth.model');
const FoodRequest = require('./src/modules/foodRequests/foodRequest.model');
const app = require('./src/app');
const http = require('http');

let server;
let baseUrl;

const runPhase2Tests = async () => {
  console.log('--- STARTING PHASE 2 FOOD REQUEST TEST SUITE ---');

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✓ MongoDB Connected');

  // Clear test users & requests
  await User.deleteMany({ email: { $in: ['cust1@example.com', 'cust2@example.com', 'donor1@example.com', 'vol1@example.com', 'admin1@example.com'] } });
  await FoodRequest.deleteMany({});
  console.log('✓ Cleaned test database records');

  // Seed Users
  const customer1 = await User.create({ name: 'Cust One', email: 'cust1@example.com', password: 'password123', role: 'CUSTOMER' });
  const customer2 = await User.create({ name: 'Cust Two', email: 'cust2@example.com', password: 'password123', role: 'CUSTOMER' });
  const donor1 = await User.create({ name: 'Donor One', email: 'donor1@example.com', password: 'password123', role: 'DONOR' });
  const vol1 = await User.create({ name: 'Vol One', email: 'vol1@example.com', password: 'password123', role: 'VOLUNTEER' });
  const admin1 = await User.create({ name: 'Admin One', email: 'admin1@example.com', password: 'password123', role: 'ADMIN' });

  // Start HTTP server
  await new Promise((resolve) => {
    server = http.createServer(app);
    server.listen(5098, () => {
      baseUrl = 'http://127.0.0.1:5098/api';
      console.log('✓ Test Server running on port 5098');
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

  const cust1Token = await getToken('cust1@example.com', 'password123');
  const cust2Token = await getToken('cust2@example.com', 'password123');
  const donorToken = await getToken('donor1@example.com', 'password123');
  const volToken = await getToken('vol1@example.com', 'password123');
  const adminToken = await getToken('admin1@example.com', 'password123');

  const assert = (condition, testName) => {
    if (condition) {
      console.log(`[PASS] ${testName}`);
    } else {
      console.error(`[FAIL] ${testName}`);
      process.exitCode = 1;
    }
  };

  let createdRequestId = '';

  try {
    // Test 1-4: CUSTOMER can create FoodRequest, stored in DB, status OPEN, customer derived from JWT
    const res1 = await fetch(`${baseUrl}/food-requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${cust1Token}`,
      },
      body: JSON.stringify({
        customer: customer2._id.toString(), // Attempting to spoof customer2 ID
        peopleCount: 100,
        foodType: 'Vegetarian',
        location: 'Community Hall, Hyderabad',
        requiredDate: '2026-09-25',
        requiredTime: '19:30',
        notes: 'Evening gathering',
      }),
    });
    const data1 = await res1.json();
    createdRequestId = data1.data?.id;

    assert(res1.status === 201 && data1.success, 'Test 1: CUSTOMER can create FoodRequest (201 Created)');

    const dbRecord = await FoodRequest.findById(createdRequestId);
    assert(!!dbRecord, 'Test 2: FoodRequest is stored in MongoDB');
    assert(dbRecord?.status === 'OPEN', 'Test 3: New request status is OPEN');
    assert(dbRecord?.customer.toString() === customer1._id.toString(), 'Test 4: Customer ID is derived from JWT (spoofed body ID ignored)');

    // Test 5: CUSTOMER can retrieve own requests
    const res5 = await fetch(`${baseUrl}/food-requests/my`, {
      headers: { Authorization: `Bearer ${cust1Token}` },
    });
    const data5 = await res5.json();
    assert(res5.status === 200 && data5.success && data5.data.length === 1 && data5.data[0].id === createdRequestId, 'Test 5: CUSTOMER can retrieve own requests (GET /api/food-requests/my)');

    // Test 6: CUSTOMER can retrieve own request by ID
    const res6 = await fetch(`${baseUrl}/food-requests/${createdRequestId}`, {
      headers: { Authorization: `Bearer ${cust1Token}` },
    });
    const data6 = await res6.json();
    assert(res6.status === 200 && data6.success && data6.data.id === createdRequestId, 'Test 6: CUSTOMER can retrieve own request by ID');

    // Test 7: CUSTOMER cannot retrieve another customer's request
    const res7 = await fetch(`${baseUrl}/food-requests/${createdRequestId}`, {
      headers: { Authorization: `Bearer ${cust2Token}` },
    });
    const data7 = await res7.json();
    assert(res7.status === 403 && !data7.success, 'Test 7: CUSTOMER cannot retrieve another customer request (403 Forbidden)');

    // Test 8: DONOR cannot create FoodRequest
    const res8 = await fetch(`${baseUrl}/food-requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${donorToken}` },
      body: JSON.stringify({ peopleCount: 50, foodType: 'Veg', location: 'Loc', requiredDate: '2026-09-25', requiredTime: '12:00' }),
    });
    const data8 = await res8.json();
    assert(res8.status === 403 && !data8.success, 'Test 8: DONOR cannot create FoodRequest (403 Forbidden)');

    // Test 9: VOLUNTEER cannot create FoodRequest
    const res9 = await fetch(`${baseUrl}/food-requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${volToken}` },
      body: JSON.stringify({ peopleCount: 50, foodType: 'Veg', location: 'Loc', requiredDate: '2026-09-25', requiredTime: '12:00' }),
    });
    const data9 = await res9.json();
    assert(res9.status === 403 && !data9.success, 'Test 9: VOLUNTEER cannot create FoodRequest (403 Forbidden)');

    // Test 10: ADMIN cannot create FoodRequest
    const res10 = await fetch(`${baseUrl}/food-requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ peopleCount: 50, foodType: 'Veg', location: 'Loc', requiredDate: '2026-09-25', requiredTime: '12:00' }),
    });
    const data10 = await res10.json();
    assert(res10.status === 403 && !data10.success, 'Test 10: ADMIN cannot create FoodRequest (403 Forbidden)');

    // Test 11: Unauthenticated user cannot create FoodRequest
    const res11 = await fetch(`${baseUrl}/food-requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ peopleCount: 50, foodType: 'Veg', location: 'Loc', requiredDate: '2026-09-25', requiredTime: '12:00' }),
    });
    const data11 = await res11.json();
    assert(res11.status === 401 && !data11.success, 'Test 11: Unauthenticated user cannot create FoodRequest (401 Unauthorized)');

    // Test 12: Invalid peopleCount (0)
    const res12 = await fetch(`${baseUrl}/food-requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cust1Token}` },
      body: JSON.stringify({ peopleCount: 0, foodType: 'Veg', location: 'Loc', requiredDate: '2026-09-25', requiredTime: '12:00' }),
    });
    const data12 = await res12.json();
    assert(res12.status === 400 && !data12.success, 'Test 12: Invalid peopleCount (0) rejected (400 Bad Request)');

    // Test 13: Missing foodType
    const res13 = await fetch(`${baseUrl}/food-requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cust1Token}` },
      body: JSON.stringify({ peopleCount: 50, location: 'Loc', requiredDate: '2026-09-25', requiredTime: '12:00' }),
    });
    const data13 = await res13.json();
    assert(res13.status === 400 && !data13.success, 'Test 13: Missing foodType rejected (400 Bad Request)');

    // Test 14: Missing location
    const res14 = await fetch(`${baseUrl}/food-requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cust1Token}` },
      body: JSON.stringify({ peopleCount: 50, foodType: 'Veg', requiredDate: '2026-09-25', requiredTime: '12:00' }),
    });
    const data14 = await res14.json();
    assert(res14.status === 400 && !data14.success, 'Test 14: Missing location rejected (400 Bad Request)');

    // Test 15: Missing requiredDate
    const res15 = await fetch(`${baseUrl}/food-requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cust1Token}` },
      body: JSON.stringify({ peopleCount: 50, foodType: 'Veg', location: 'Loc', requiredTime: '12:00' }),
    });
    const data15 = await res15.json();
    assert(res15.status === 400 && !data15.success, 'Test 15: Missing requiredDate rejected (400 Bad Request)');

    // Test 16: Missing requiredTime
    const res16 = await fetch(`${baseUrl}/food-requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cust1Token}` },
      body: JSON.stringify({ peopleCount: 50, foodType: 'Veg', location: 'Loc', requiredDate: '2026-09-25' }),
    });
    const data16 = await res16.json();
    assert(res16.status === 400 && !data16.success, 'Test 16: Missing requiredTime rejected (400 Bad Request)');

    console.log('--- ALL PHASE 2 BACKEND TESTS PASSED SUCCESSFULLY! ---');
  } catch (err) {
    console.error('Test execution error:', err);
    process.exitCode = 1;
  } finally {
    server.close();
    await mongoose.connection.close();
  }
};

runPhase2Tests();
