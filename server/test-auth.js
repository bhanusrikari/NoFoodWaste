require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/modules/auth/auth.model');
const app = require('./src/app');
const { authorizeRoles } = require('./src/middleware/role.middleware');
const http = require('http');

let server;
let baseUrl;

const runTests = async () => {
  console.log('--- STARTING PHASE 1 AUTH & CUSTOMER TEST SUITE ---');

  // Connect DB
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✓ MongoDB Connected');

  // Clear test users
  await User.deleteMany({ email: { $in: ['testdonor@example.com', 'testvolunteer@example.com', 'testcustomer@example.com', 'admin@example.com', 'invalid@example.com'] } });
  console.log('✓ Cleaned up old test database records');

  // Seed Admin user directly in DB
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
  let customerToken = '';
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
    assert(res1.status === 201 && data1.success && data1.user.role === 'DONOR', 'Test 1: Donor registration');

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

    // Test 3: Customer registration
    const res3 = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Customer User',
        email: 'testcustomer@example.com',
        password: 'password123',
        role: 'CUSTOMER',
      }),
    });
    const data3 = await res3.json();
    assert(res3.status === 201 && data3.success && data3.user.role === 'CUSTOMER', 'Test 3: Customer registration');

    // Test 4: Public Admin registration blocked
    const res4 = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Hacker Admin',
        email: 'hacker@example.com',
        password: 'password123',
        role: 'ADMIN',
      }),
    });
    const data4 = await res4.json();
    assert(res4.status === 400 && !data4.success, 'Test 4: Public Admin registration blocked');

    // Test 5: Customer Login
    const res5 = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'testcustomer@example.com',
        password: 'password123',
      }),
    });
    const data5 = await res5.json();
    customerToken = data5.token;
    assert(res5.status === 200 && data5.success && data5.token && data5.user.role === 'CUSTOMER', 'Test 5: Customer Login successful');

    // Login for other roles
    const resDonor = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'testdonor@example.com', password: 'password123' }),
    });
    donorToken = (await resDonor.json()).token;

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

    // Test 6: Customer GET /api/auth/me
    const res6 = await fetch(`${baseUrl}/auth/me`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    const data6 = await res6.json();
    assert(res6.status === 200 && data6.success && data6.user.role === 'CUSTOMER', 'Test 6: Customer /api/auth/me Profile');

    // Test 7 & 8: Test authorizeRoles middleware directly for CUSTOMER role
    let nextCalled = false;
    let resCode = 0;
    const createMockRes = () => ({
      status: (code) => {
        resCode = code;
        return { json: () => {} };
      },
    });

    const customerGuard = authorizeRoles('CUSTOMER');

    // Test 7: CUSTOMER role allowed
    customerGuard({ user: { role: 'CUSTOMER' } }, createMockRes(), () => { nextCalled = true; });
    assert(nextCalled, 'Test 7: authorizeRoles middleware permits CUSTOMER role');

    // Test 8: DONOR role blocked for CUSTOMER guard
    nextCalled = false;
    resCode = 0;
    customerGuard({ user: { role: 'DONOR' } }, createMockRes(), () => { nextCalled = true; });
    assert(!nextCalled && resCode === 403, 'Test 8: authorizeRoles middleware blocks DONOR role for CUSTOMER guard (403)');

    // Test 9: VOLUNTEER role blocked for CUSTOMER guard
    nextCalled = false;
    resCode = 0;
    customerGuard({ user: { role: 'VOLUNTEER' } }, createMockRes(), () => { nextCalled = true; });
    assert(!nextCalled && resCode === 403, 'Test 9: authorizeRoles middleware blocks VOLUNTEER role for CUSTOMER guard (403)');

    // Test 10: ADMIN role blocked for CUSTOMER guard
    nextCalled = false;
    resCode = 0;
    customerGuard({ user: { role: 'ADMIN' } }, createMockRes(), () => { nextCalled = true; });
    assert(!nextCalled && resCode === 403, 'Test 10: authorizeRoles middleware blocks ADMIN role for CUSTOMER guard (403)');

    console.log('--- ALL AUTHENTICATION & CUSTOMER TESTS PASSED! ---');
  } catch (err) {
    console.error('Test execution error:', err);
    process.exitCode = 1;
  } finally {
    server.close();
    await mongoose.connection.close();
  }
};

runTests();
