require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/modules/auth/auth.model');
const FoodRequest = require('./src/modules/foodRequests/foodRequest.model');
const app = require('./src/app');
const http = require('http');

let server;
let baseUrl;

const runPhase3Tests = async () => {
  console.log('--- STARTING PHASE 3 REQUEST MANAGEMENT TEST SUITE ---');

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✓ MongoDB Connected');

  // Clear test users & requests
  await User.deleteMany({ email: { $in: ['cust1_p3@example.com', 'cust2_p3@example.com', 'donor1_p3@example.com', 'vol1_p3@example.com', 'admin1_p3@example.com'] } });
  await FoodRequest.deleteMany({});
  console.log('✓ Cleaned test database records');

  // Seed Users
  const customer1 = await User.create({ name: 'Customer One P3', email: 'cust1_p3@example.com', password: 'password123', role: 'CUSTOMER' });
  const customer2 = await User.create({ name: 'Customer Two P3', email: 'cust2_p3@example.com', password: 'password123', role: 'CUSTOMER' });
  const donor1 = await User.create({ name: 'Donor One P3', email: 'donor1_p3@example.com', password: 'password123', role: 'DONOR' });
  const vol1 = await User.create({ name: 'Vol One P3', email: 'vol1_p3@example.com', password: 'password123', role: 'VOLUNTEER' });
  const admin1 = await User.create({ name: 'Admin One P3', email: 'admin1_p3@example.com', password: 'password123', role: 'ADMIN' });

  // Start HTTP server on port 5097 for testing
  await new Promise((resolve) => {
    server = http.createServer(app);
    server.listen(5097, () => {
      baseUrl = 'http://127.0.0.1:5097/api';
      console.log('✓ Test Server running on port 5097');
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

  const cust1Token = await getToken('cust1_p3@example.com', 'password123');
  const cust2Token = await getToken('cust2_p3@example.com', 'password123');
  const donorToken = await getToken('donor1_p3@example.com', 'password123');
  const volToken = await getToken('vol1_p3@example.com', 'password123');
  const adminToken = await getToken('admin1_p3@example.com', 'password123');

  const assert = (condition, testName) => {
    if (condition) {
      console.log(`[PASS] ${testName}`);
    } else {
      console.error(`[FAIL] ${testName}`);
      process.exitCode = 1;
    }
  };

  let req1Id = '';
  let req2Id = '';

  try {
    // Test 10: Existing POST /api/food-requests still works
    const createRes = await fetch(`${baseUrl}/food-requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cust1Token}` },
      body: JSON.stringify({
        peopleCount: 150,
        foodType: 'Vegetarian',
        location: 'Hall A, Hyderabad',
        requiredDate: '2026-09-30',
        requiredTime: '20:00',
        notes: 'Phase 3 test request',
      }),
    });
    const createData = await createRes.json();
    req1Id = createData.data?.id;
    assert(createRes.status === 201 && createData.success, 'Test 10: POST /api/food-requests still works (201 Created)');

    // Create a request for Customer 2
    const createRes2 = await fetch(`${baseUrl}/food-requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cust2Token}` },
      body: JSON.stringify({
        peopleCount: 50,
        foodType: 'Non-Vegetarian',
        location: 'Hall B, Secunderabad',
        requiredDate: '2026-10-01',
        requiredTime: '13:00',
      }),
    });
    const createData2 = await createRes2.json();
    req2Id = createData2.data?.id;

    // Test 1: CUSTOMER can retrieve own requests (GET /api/food-requests/my)
    const res1 = await fetch(`${baseUrl}/food-requests/my`, {
      headers: { Authorization: `Bearer ${cust1Token}` },
    });
    const data1 = await res1.json();
    assert(res1.status === 200 && data1.success && data1.data.length === 1 && data1.data[0].id === req1Id, 'Test 1: CUSTOMER can retrieve own requests');

    // Test 2: CUSTOMER cannot retrieve another customer's request (403 Forbidden)
    const res2 = await fetch(`${baseUrl}/food-requests/${req2Id}`, {
      headers: { Authorization: `Bearer ${cust1Token}` },
    });
    const data2 = await res2.json();
    assert(res2.status === 403 && !data2.success, 'Test 2: CUSTOMER cannot retrieve another customer request (403 Forbidden)');

    // Test 3: DONOR cannot access customer request APIs (403 Forbidden)
    const res3 = await fetch(`${baseUrl}/food-requests/my`, {
      headers: { Authorization: `Bearer ${donorToken}` },
    });
    const data3 = await res3.json();
    assert(res3.status === 403 && !data3.success, 'Test 3: DONOR cannot access customer request APIs (403 Forbidden)');

    // Test 4: VOLUNTEER cannot access customer request APIs (403 Forbidden)
    const res4 = await fetch(`${baseUrl}/food-requests/my`, {
      headers: { Authorization: `Bearer ${volToken}` },
    });
    const data4 = await res4.json();
    assert(res4.status === 403 && !data4.success, 'Test 4: VOLUNTEER cannot access customer request APIs (403 Forbidden)');

    // Test 5: ADMIN cannot access customer request APIs (403 Forbidden)
    const res5 = await fetch(`${baseUrl}/food-requests/my`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const data5 = await res5.json();
    assert(res5.status === 403 && !data5.success, 'Test 5: ADMIN cannot access customer request APIs (403 Forbidden)');

    // Test 6: Unauthenticated user receives 401 Unauthorized
    const res6 = await fetch(`${baseUrl}/food-requests/my`);
    const data6 = await res6.json();
    assert(res6.status === 401 && !data6.success, 'Test 6: Unauthenticated user receives 401 Unauthorized');

    // Test 7: Invalid request ID handled correctly (400 Bad Request)
    const res7 = await fetch(`${baseUrl}/food-requests/invalid_id_format`, {
      headers: { Authorization: `Bearer ${cust1Token}` },
    });
    const data7 = await res7.json();
    assert(res7.status === 400 && !data7.success, 'Test 7: Invalid request ID format handled correctly (400 Bad Request)');

    // Test 8: Non-existent request ID handled correctly (404 Not Found)
    const fakeId = new mongoose.Types.ObjectId().toString();
    const res8 = await fetch(`${baseUrl}/food-requests/${fakeId}`, {
      headers: { Authorization: `Bearer ${cust1Token}` },
    });
    const data8 = await res8.json();
    assert(res8.status === 404 && !data8.success, 'Test 8: Non-existent request ID handled correctly (404 Not Found)');

    // Test 9: Customer cannot change request status (PATCH /status does not exist)
    const res9 = await fetch(`${baseUrl}/food-requests/${req1Id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cust1Token}` },
      body: JSON.stringify({ status: 'DELIVERED' }),
    });
    assert(res9.status === 404, 'Test 9: Customer status mutation endpoint does not exist (404 Not Found)');

    console.log('--- ALL PHASE 3 BACKEND TESTS PASSED SUCCESSFULLY! ---');
  } catch (err) {
    console.error('Test execution error:', err);
    process.exitCode = 1;
  } finally {
    server.close();
    await mongoose.connection.close();
  }
};

runPhase3Tests();
