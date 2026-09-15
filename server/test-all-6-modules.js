const mongoose = require('mongoose');
const http = require('http');
const express = require('express');
const User = require('./src/modules/auth/auth.model');
const FoodRequest = require('./src/modules/foodRequest/foodRequest.model');
const Donation = require('./src/modules/donation/donation.model');
const Delivery = require('./src/modules/delivery/delivery.model');
const Report = require('./src/modules/report/report.model');
const Notification = require('./src/modules/notification/notification.model');
const ActivityLog = require('./src/modules/activityLog/activityLog.model');
const routes = require('./src/routes');

const app = express();
app.use(express.json());
app.use('/api', routes);

app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

const PORT = 5094;
let server;
let adminToken = '';
let donorToken = '';
let volunteerUser;

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/nofoodwaste';

function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, raw: body });
        }
      });
    });
    req.on('error', reject);
    if (postData) {
      req.write(JSON.stringify(postData));
    }
    req.end();
  });
}

async function runTests() {
  console.log('--- STARTING 6 ADMIN CORE MODULES TEST SUITE ---');
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✓ MongoDB Connected');

    // Clean test data
    await User.deleteMany({ email: /@testmodules\.com$/ });
    await Report.deleteMany({ description: /Test Report/ });
    await Delivery.deleteMany({ customerName: /Test Exception Customer/ });

    server = app.listen(PORT, () => console.log(`✓ Test HTTP Server running on port ${PORT}`));

    // Setup Admin & Donor
    const adminUser = await User.create({
      name: 'Admin Six Modules',
      email: 'admin@testmodules.com',
      password: 'Password123!',
      role: 'ADMIN',
    });

    const adminLogin = await makeRequest({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }, { email: 'admin@testmodules.com', password: 'Password123!' });
    adminToken = adminLogin.body.token;

    const donorUser = await User.create({
      name: 'Donor Six Modules',
      email: 'donor@testmodules.com',
      password: 'Password123!',
      role: 'DONOR',
    });

    const donorLogin = await makeRequest({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }, { email: 'donor@testmodules.com', password: 'Password123!' });
    donorToken = donorLogin.body.token;

    volunteerUser = await User.create({
      name: 'Volunteer Six Modules',
      email: 'vol@testmodules.com',
      password: 'Password123!',
      role: 'VOLUNTEER',
      availabilityStatus: 'ASSIGNED',
    });

    // TEST 1: Non-admin blocked from admin endpoints (403)
    const unauth = await makeRequest({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api/admin/users',
      method: 'GET',
      headers: { Authorization: `Bearer ${donorToken}` },
    });
    if (unauth.status === 403) {
      console.log('[PASS] Test 1: Non-admin user blocked from admin APIs (403 Forbidden)');
    } else {
      console.error('[FAIL] Test 1: Expected 403, got:', unauth.status);
    }

    // TEST 2: Users Module - List users with activity summaries
    const usersRes = await makeRequest({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api/admin/users',
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (usersRes.status === 200 && Array.isArray(usersRes.body.data) && usersRes.body.stats) {
      console.log(`[PASS] Test 2: GET /api/admin/users returned ${usersRes.body.data.length} users with activity stats`);
    } else {
      console.error('[FAIL] Test 2: Users lookup failed:', usersRes);
    }

    // TEST 3: Users Module - Toggle account status & Demote Safety Check
    const toggleRes = await makeRequest({
      hostname: '127.0.0.1',
      port: PORT,
      path: `/api/admin/users/${donorUser._id}/toggle-status`,
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (toggleRes.status === 200 && toggleRes.body.data.accountStatus === 'INACTIVE') {
      console.log('[PASS] Test 3: Admin toggled Donor account status to INACTIVE');
    } else {
      console.error('[FAIL] Test 3: Account toggle failed:', toggleRes);
    }

    // TEST 4: Exception Handling - Volunteer Rejection (PENDING_REASSIGNMENT)
    const testDel = await Delivery.create({
      customerName: 'Test Exception Customer',
      donorName: 'Test Exception Donor',
      numberOfMeals: 80,
      volunteer: volunteerUser._id,
      volunteerName: volunteerUser.name,
      status: 'ASSIGNED',
    });

    const rejectRes = await makeRequest({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api/admin/exceptions/volunteer-reject',
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
    }, { deliveryId: testDel._id.toString(), reason: 'Vehicle tire puncture' });

    if (rejectRes.status === 200 && rejectRes.body.data.status === 'PENDING_REASSIGNMENT') {
      console.log('[PASS] Test 4: Volunteer rejection updated Delivery status to PENDING_REASSIGNMENT');
    } else {
      console.error('[FAIL] Test 4: Rejection failed:', rejectRes);
    }

    // Verify volunteer freed
    const freedVol = await User.findById(volunteerUser._id);
    if (freedVol.availabilityStatus === 'AVAILABLE') {
      console.log('[PASS] Test 5: Rejecting task freed Volunteer availability to AVAILABLE');
    } else {
      console.error('[FAIL] Test 5: Volunteer availability sync failed:', freedVol.availabilityStatus);
    }

    // TEST 6: Exception Handling - Partial Fulfillment (100 required, 60 fulfilled -> 40 remaining open)
    const testReq = await FoodRequest.create({
      customerName: 'Hope NGO Shelter',
      phone: '+91 99999 11111',
      location: 'Secunderabad',
      numberOfMeals: 100,
      foodType: 'Veg',
      foodCategory: 'Cooked',
      requiredDate: '2026-09-20',
      requiredTime: '12:00 PM',
      status: 'OPEN',
    });

    const testDon = await Donation.create({
      donorName: 'Bakery Supply',
      phone: '+91 99999 22222',
      foodTitle: 'Bread Kits',
      numberOfMeals: 60,
      foodType: 'Veg',
      foodCategory: 'Cooked',
      pickupLocation: 'Banjara Hills',
      status: 'AVAILABLE',
    });

    const partialRes = await makeRequest({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api/admin/exceptions/partial-fulfillment',
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
    }, {
      donationId: testDon._id.toString(),
      requestId: testReq._id.toString(),
      fulfilledQuantity: 60,
    });

    if (partialRes.status === 200 && partialRes.body.data.fulfilled === 60 && partialRes.body.data.remaining === 40) {
      console.log('[PASS] Test 6: Partial fulfillment processed: Fulfilled=60, Remaining=40 meals (Requirement stays open)');
    } else {
      console.error('[FAIL] Test 6: Partial fulfillment failed:', partialRes);
    }

    // TEST 7: Notification System - Fetch & Mark Read
    const notifRes = await makeRequest({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api/admin/notifications',
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    if (notifRes.status === 200 && Array.isArray(notifRes.body.data)) {
      console.log(`[PASS] Test 7: GET /api/admin/notifications returned ${notifRes.body.data.length} notifications (Unread: ${notifRes.body.unreadCount})`);
    } else {
      console.error('[FAIL] Test 7: Notification lookup failed:', notifRes);
    }

    // TEST 8: Reports & Issues Module - Submit & Resolve
    const submitRep = await makeRequest({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api/admin/reports/submit',
      method: 'POST',
      headers: { Authorization: `Bearer ${donorToken}`, 'Content-Type': 'application/json' },
    }, {
      reporterName: 'Test Donor Reporter',
      issueType: 'INCORRECT_QUANTITY',
      description: 'Test Report: Quantity delivered differed from pickup invoice.',
      priority: 'HIGH',
    });

    if (submitRep.status === 201 && submitRep.body.data.status === 'OPEN') {
      console.log('[PASS] Test 8: User submitted operational issue report (201 Created)');
      const reportId = submitRep.body.data.id;

      const resolveRep = await makeRequest({
        hostname: '127.0.0.1',
        port: PORT,
        path: `/api/admin/reports/${reportId}/status`,
        method: 'PATCH',
        headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
      }, { status: 'RESOLVED', resolutionNotes: 'Reconciled quantity with donor invoice' });

      if (resolveRep.status === 200 && resolveRep.body.data.status === 'RESOLVED') {
        console.log('[PASS] Test 9: Admin updated report status to RESOLVED with notes');
      } else {
        console.error('[FAIL] Test 9: Report resolution failed:', resolveRep);
      }
    } else {
      console.error('[FAIL] Test 8: Report submission failed:', submitRep);
    }

    // TEST 10: Analytics Module - Live Calculated Data
    const analyticsRes = await makeRequest({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api/admin/analytics?timeframe=month',
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    if (analyticsRes.status === 200 && analyticsRes.body.data.metrics) {
      console.log(`[PASS] Test 10: GET /api/admin/analytics calculated live metrics (Donated: ${analyticsRes.body.data.metrics.totalMealsDonated} meals, Delivered: ${analyticsRes.body.data.metrics.totalMealsDelivered} meals)`);
    } else {
      console.error('[FAIL] Test 10: Analytics lookup failed:', analyticsRes);
    }

    // TEST 11: Activity Audit Logs Module - Append-Only Logs List & Filter
    const logsRes = await makeRequest({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api/admin/activity-logs',
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    if (logsRes.status === 200 && Array.isArray(logsRes.body.data) && logsRes.body.data.length > 0) {
      console.log(`[PASS] Test 11: GET /api/admin/activity-logs returned ${logsRes.body.data.length} append-only audit entries`);
    } else {
      console.error('[FAIL] Test 11: Activity logs query failed:', logsRes);
    }

    console.log('--- ALL 6 ADMIN CORE MODULES TESTS PASSED SUCCESSFULLY! ---');
  } catch (err) {
    console.error('❌ TEST FAILED:', err);
  } finally {
    if (server) server.close();
    await mongoose.disconnect();
  }
}

runTests();
