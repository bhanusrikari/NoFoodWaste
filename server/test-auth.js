require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/modules/auth/auth.model');
const app = require('./src/app');
const http = require('http');

let server;
let baseUrl;

const runTests = async () => {
  console.log('--- STARTING PHASE 1 AUTH & AUTHORIZATION TEST SUITE ---');

  // Connect DB
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✓ MongoDB Connected');

  // Clear test users
  await User.deleteMany({ email: { $in: ['testdonor@example.com', 'testvolunteer@example.com', 'admin@example.com', 'invalid@example.com'] } });
  console.log('✓ Cleaned up old test database records');

  // Seed Admin user directly in DB (since public registration for ADMIN is blocked)
  const adminUser = await User.create({
    name: 'System Admin',
    email: 'admin@example.com',
    password: 'adminpassword123',
    role: 'ADMIN',
  });
  console.log('✓ Seeded ADMIN user in database');

  // Start HTTP server on port 5099 for testing
  await new Promise((resolve) => {
    server = http.createServer(app);
    server.listen(5099, () => {
      baseUrl = 'http://127.0.0.1:5099/api';
      console.log('✓ Test HTTP Server running on port 5099');
      resolve();
    });
  });

  let donorToken = '';
  let volunteerToken = '';
  let adminToken = '';

  const assert = (condition, testName) => {
    if (condition) {
      console.log(`[PASS] ${testName}`);
    } else {
      console.error(`[FAIL] ${testName}`);
      process.exitCode = 1;
    }
  };

  try {
    // Test 1: Donor registration
    const res1 = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Donor User',
        email: 'testdonor@example.com',
        password: 'password123',
        role: 'DONOR',
      }),
    });
    const data1 = await res1.json();
    assert(res1.status === 201 && data1.success && data1.user.role === 'DONOR' && !data1.user.password, 'Test 1: Donor registration');

    // Test 2: Volunteer registration
    const res2 = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Volunteer User',
        email: 'testvolunteer@example.com',
        password: 'password123',
        role: 'VOLUNTEER',
      }),
    });
    const data2 = await res2.json();
    assert(res2.status === 201 && data2.success && data2.user.role === 'VOLUNTEER', 'Test 2: Volunteer registration');

    // Test 3: Public Admin registration blocked
    const res3a = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Hacker Admin',
        email: 'hacker@example.com',
        password: 'password123',
        role: 'ADMIN',
      }),
    });
    const data3a = await res3a.json();
    assert(res3a.status === 400 && !data3a.success, 'Test 3a: Public Admin registration blocked');

    // Test 3b: Duplicate email registration
    const res3 = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Duplicate User',
        email: 'testdonor@example.com',
        password: 'password123',
        role: 'DONOR',
      }),
    });
    const data3 = await res3.json();
    assert(res3.status === 409 && !data3.success, 'Test 3b: Duplicate email prevention (409)');

    // Test 4: Invalid email format
    const res4 = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Bad Email',
        email: 'notanemail',
        password: 'password123',
        role: 'DONOR',
      }),
    });
    const data4 = await res4.json();
    assert(res4.status === 400 && !data4.success, 'Test 4: Invalid email format (400)');

    // Test 5: Weak password
    const res5 = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Weak Pass',
        email: 'weakpass@example.com',
        password: '123',
        role: 'DONOR',
      }),
    });
    const data5 = await res5.json();
    assert(res5.status === 400 && !data5.success, 'Test 5: Weak password validation (400)');

    // Test 6: Login with correct credentials (DONOR)
    const res6 = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'testdonor@example.com',
        password: 'password123',
      }),
    });
    const data6 = await res6.json();
    donorToken = data6.token;
    assert(res6.status === 200 && data6.success && data6.token && data6.user.role === 'DONOR', 'Test 6: Successful Login with correct credentials');

    // Also get tokens for volunteer & admin
    const resVol = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'testvolunteer@example.com', password: 'password123' }),
    });
    volunteerToken = (await resVol.json()).token;

    const resAdmin = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@example.com', password: 'adminpassword123' }),
    });
    adminToken = (await resAdmin.json()).token;

    // Test 7: Login with wrong password
    const res7 = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'testdonor@example.com',
        password: 'wrongpassword',
      }),
    });
    const data7 = await res7.json();
    assert(res7.status === 401 && !data7.success, 'Test 7: Login with wrong password (401)');

    // Test 8: Login with nonexistent user
    const res8 = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'nobody@example.com',
        password: 'password123',
      }),
    });
    const data8 = await res8.json();
    assert(res8.status === 401 && !data8.success, 'Test 8: Login with nonexistent user (401)');

    // Test 9: JWT Generation
    assert(typeof donorToken === 'string' && donorToken.split('.').length === 3, 'Test 9: JWT generation format valid');

    // Test 10: GET /api/auth/me with valid token
    const res10 = await fetch(`${baseUrl}/auth/me`, {
      headers: { Authorization: `Bearer ${donorToken}` },
    });
    const data10 = await res10.json();
    assert(res10.status === 200 && data10.success && data10.user.email === 'testdonor@example.com' && !data10.user.password, 'Test 10: /api/auth/me with valid token');

    // Test 11: GET /api/auth/me without token
    const res11 = await fetch(`${baseUrl}/auth/me`);
    const data11 = await res11.json();
    assert(res11.status === 401 && !data11.success, 'Test 11: /api/auth/me without token (401)');

    // Test 12: GET /api/auth/me with invalid token
    const res12 = await fetch(`${baseUrl}/auth/me`, {
      headers: { Authorization: 'Bearer invalid_token_xyz' },
    });
    const data12 = await res12.json();
    assert(res12.status === 401 && !data12.success, 'Test 12: /api/auth/me with invalid token (401)');

    // Test 13: Admin-only route with ADMIN token
    const res13 = await fetch(`${baseUrl}/admin/test`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const data13 = await res13.json();
    assert(res13.status === 200 && data13.success, 'Test 13: Admin-only route with ADMIN role (200)');

    // Test 14: Admin-only route with DONOR token
    const res14 = await fetch(`${baseUrl}/admin/test`, {
      headers: { Authorization: `Bearer ${donorToken}` },
    });
    const data14 = await res14.json();
    assert(res14.status === 403 && !data14.success, 'Test 14: Admin-only route with DONOR role (403)');

    // Test 15: Volunteer-only route with VOLUNTEER token
    const res15 = await fetch(`${baseUrl}/volunteer/test`, {
      headers: { Authorization: `Bearer ${volunteerToken}` },
    });
    const data15 = await res15.json();
    assert(res15.status === 200 && data15.success, 'Test 15: Volunteer-only route with VOLUNTEER role (200)');

    // Test 16: Donor-only route with DONOR token
    const res16 = await fetch(`${baseUrl}/donor/test`, {
      headers: { Authorization: `Bearer ${donorToken}` },
    });
    const data16 = await res16.json();
    assert(res16.status === 200 && data16.success, 'Test 16: Donor-only route with DONOR role (200)');

    console.log('--- ALL AUTHENTICATION & AUTHORIZATION API TESTS PASSED! ---');
  } catch (err) {
    console.error('Test execution error:', err);
    process.exitCode = 1;
  } finally {
    server.close();
    await mongoose.connection.close();
  }
};

runTests();
