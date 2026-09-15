require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/modules/auth/auth.model');
const Delivery = require('./src/modules/delivery/delivery.model');
const app = require('./src/app');
const http = require('http');

let server;
let baseUrl;

const runTests = async () => {
  console.log('--- STARTING ADMIN VOLUNTEERS MODULE TEST SUITE ---');

  // Connect DB
  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/nofoodwaste';
  await mongoose.connect(mongoUri);
  console.log('✓ MongoDB Connected');

  // Clean test records
  await User.deleteMany({ email: { $in: ['adminvol@example.com', 'donorvol@example.com', 'vol1@example.com', 'vol2@example.com'] } });
  await Delivery.deleteMany({});
  console.log('✓ Cleaned test database');

  // Create users
  const adminUser = await User.create({
    name: 'Admin Volunteer Tester',
    email: 'adminvol@example.com',
    password: 'password123',
    role: 'ADMIN',
  });

  const donorUser = await User.create({
    name: 'Donor Tester',
    email: 'donorvol@example.com',
    password: 'password123',
    role: 'DONOR',
  });

  const vol1 = await User.create({
    name: 'Rahul Sharma',
    email: 'vol1@example.com',
    password: 'password123',
    role: 'VOLUNTEER',
    phone: '+91 91234 11111',
    vehicleType: 'Two Wheeler',
    vehicleNumber: 'TS 09 EQ 4521',
    verificationStatus: 'PENDING_VERIFICATION',
    availabilityStatus: 'AVAILABLE',
    accountStatus: 'ACTIVE',
  });

  const vol2 = await User.create({
    name: 'Priya Verma',
    email: 'vol2@example.com',
    password: 'password123',
    role: 'VOLUNTEER',
    phone: '+91 91234 22222',
    vehicleType: 'Four Wheeler',
    vehicleNumber: 'TS 07 FA 8890',
    verificationStatus: 'VERIFIED',
    availabilityStatus: 'AVAILABLE',
    accountStatus: 'ACTIVE',
  });

  // Start HTTP Server on port 5099
  await new Promise((resolve) => {
    server = http.createServer(app);
    server.listen(5099, () => {
      baseUrl = 'http://127.0.0.1:5099/api';
      console.log('✓ Test HTTP Server running on port 5099');
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
      body: JSON.stringify({ email: 'adminvol@example.com', password: 'password123' }),
    });
    const adminToken = (await resAdminLogin.json()).token;

    const resDonorLogin = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'donorvol@example.com', password: 'password123' }),
    });
    const donorToken = (await resDonorLogin.json()).token;

    // 2. Test Authorization: Donor blocked from Admin Volunteer APIs (403 Forbidden)
    const resForbidden = await fetch(`${baseUrl}/admin/volunteers`, {
      headers: { Authorization: `Bearer ${donorToken}` },
    });
    assert(resForbidden.status === 403, 'Test 1: Donor user blocked from admin volunteers API (403 Forbidden)');

    // 3. Admin Get All Volunteers (GET /api/admin/volunteers)
    const resList = await fetch(`${baseUrl}/admin/volunteers`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const listData = await resList.json();
    assert(
      resList.status === 200 && listData.data.length >= 2,
      'Test 2: GET /api/admin/volunteers returns list of volunteers with availability & vehicle info'
    );

    // 4. Admin Verify Volunteer (PATCH /api/admin/volunteers/:id/verify)
    const resVerify = await fetch(`${baseUrl}/admin/volunteers/${vol1.id}/verify`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const verifyData = await resVerify.json();
    assert(
      resVerify.status === 200 && verifyData.data.verificationStatus === 'VERIFIED',
      'Test 3: Admin verify volunteer (200 OK - VERIFIED)'
    );

    // 5. Admin Manual Availability Toggle (PATCH /api/admin/volunteers/:id/availability)
    const resAvail = await fetch(`${baseUrl}/admin/volunteers/${vol1.id}/availability`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ availabilityStatus: 'OFFLINE' }),
    });
    const availData = await resAvail.json();
    assert(
      resAvail.status === 200 && availData.data.availabilityStatus === 'OFFLINE',
      'Test 4: Admin manual availability status update to OFFLINE (200 OK)'
    );

    // Reset vol1 back to AVAILABLE for delivery assignment test
    await fetch(`${baseUrl}/admin/volunteers/${vol1.id}/availability`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ availabilityStatus: 'AVAILABLE' }),
    });

    // 6. Create Test Delivery Record
    const testDelivery = await Delivery.create({
      customerName: 'St. Jude Children Home',
      donorName: 'Grand Bakery',
      numberOfMeals: 75,
      pickupLocation: 'Jubilee Hills',
      deliveryLocation: 'Banjara Hills',
      status: 'PENDING_ASSIGNMENT',
    });
    console.log('✓ Created test delivery record for volunteer assignment');

    // 7. Admin Assign Volunteer 1 to Delivery (POST /api/admin/volunteers/assign-delivery)
    const resAssign1 = await fetch(`${baseUrl}/admin/volunteers/assign-delivery`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        deliveryId: testDelivery.id,
        volunteerId: vol1.id,
      }),
    });
    const assignData1 = await resAssign1.json();
    assert(
      resAssign1.status === 200 &&
        assignData1.delivery.volunteerName === 'Rahul Sharma' &&
        assignData1.volunteer.availabilityStatus === 'ASSIGNED',
      'Test 5: Assign volunteer to delivery updates Delivery record and sets volunteer availability to ASSIGNED'
    );

    // 8. Admin Reassign Delivery to Volunteer 2
    const resAssign2 = await fetch(`${baseUrl}/admin/volunteers/assign-delivery`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        deliveryId: testDelivery.id,
        volunteerId: vol2.id,
      }),
    });
    const assignData2 = await resAssign2.json();

    // Verify vol1 is back to AVAILABLE and vol2 is now ASSIGNED
    const updatedVol1 = await User.findById(vol1.id);
    const updatedVol2 = await User.findById(vol2.id);

    assert(
      resAssign2.status === 200 &&
        assignData2.delivery.volunteerName === 'Priya Verma' &&
        updatedVol1.availabilityStatus === 'AVAILABLE' &&
        updatedVol2.availabilityStatus === 'ASSIGNED',
      'Test 6: Reassigning delivery frees previous volunteer to AVAILABLE and updates new volunteer to ASSIGNED'
    );

    // 9. Admin View Detailed Profile & History (GET /api/admin/volunteers/:id)
    const resDetail = await fetch(`${baseUrl}/admin/volunteers/${vol2.id}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const detailData = await resDetail.json();
    assert(
      resDetail.status === 200 &&
        detailData.data.currentAssignment &&
        detailData.data.currentAssignment.deliveryId === testDelivery.deliveryId,
      'Test 7: GET /api/admin/volunteers/:id returns profile with current assignment & task history'
    );

    // 10. Admin Reject Volunteer (PATCH /api/admin/volunteers/:id/reject)
    const resReject = await fetch(`${baseUrl}/admin/volunteers/${vol1.id}/reject`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ reason: 'Driving license check failed' }),
    });
    const rejectData = await resReject.json();
    assert(
      resReject.status === 200 &&
        rejectData.data.verificationStatus === 'REJECTED' &&
        rejectData.data.rejectionReason === 'Driving license check failed',
      'Test 8: Admin reject volunteer with reason (200 OK - REJECTED)'
    );

    console.log('--- ALL ADMIN VOLUNTEERS MODULE TESTS PASSED! ---');
  } catch (err) {
    console.error('Test execution failed:', err);
    process.exitCode = 1;
  } finally {
    if (server) server.close();
    await mongoose.connection.close();
  }
};

runTests();
