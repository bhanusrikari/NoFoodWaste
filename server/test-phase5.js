require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/modules/auth/auth.model');
const FoodRequest = require('./src/modules/foodRequests/foodRequest.model');
const app = require('./src/app');
const http = require('http');

let server;
let baseUrl;

const runPhase5Tests = async () => {
  console.log('--- STARTING PHASE 5 CUSTOMER DELIVERY ACKNOWLEDGEMENT TEST SUITE ---');

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✓ MongoDB Connected');

  // Clear test users & requests
  await User.deleteMany({ email: { $in: ['custA_p5@example.com', 'custB_p5@example.com', 'admin_p5@example.com'] } });
  await FoodRequest.deleteMany({});
  console.log('✓ Cleaned test database records');

  // Seed Users
  const customerA = await User.create({ name: 'Customer A P5', email: 'custA_p5@example.com', password: 'password123', role: 'CUSTOMER' });
  const customerB = await User.create({ name: 'Customer B P5', email: 'custB_p5@example.com', password: 'password123', role: 'CUSTOMER' });
  const adminP5 = await User.create({ name: 'Admin P5', email: 'admin_p5@example.com', password: 'password123', role: 'ADMIN' });

  // Seed Food Requests for status testing
  const reqDelivered = await FoodRequest.create({
    customer: customerA._id,
    peopleCount: 50,
    foodType: 'Meals',
    location: 'Banjara Hills',
    requiredDate: new Date('2026-10-10'),
    requiredTime: '13:00',
    status: 'DELIVERED',
  });

  const reqOpen = await FoodRequest.create({
    customer: customerA._id,
    peopleCount: 20,
    foodType: 'Snacks',
    location: 'Jubilee Hills',
    requiredDate: new Date('2026-10-11'),
    requiredTime: '16:00',
    status: 'OPEN',
  });

  const reqMatched = await FoodRequest.create({
    customer: customerA._id,
    peopleCount: 30,
    foodType: 'Rice Packets',
    location: 'Gachibowli',
    requiredDate: new Date('2026-10-12'),
    requiredTime: '12:00',
    status: 'MATCHED',
  });

  const reqAssigned = await FoodRequest.create({
    customer: customerA._id,
    peopleCount: 40,
    foodType: 'Meals',
    location: 'Madhapur',
    requiredDate: new Date('2026-10-13'),
    requiredTime: '14:00',
    status: 'DELIVERY_ASSIGNED',
  });

  const reqOutForDelivery = await FoodRequest.create({
    customer: customerA._id,
    peopleCount: 60,
    foodType: 'Meals',
    location: 'Kukatpally',
    requiredDate: new Date('2026-10-14'),
    requiredTime: '15:00',
    status: 'OUT_FOR_DELIVERY',
  });

  const reqRejected = await FoodRequest.create({
    customer: customerA._id,
    peopleCount: 25,
    foodType: 'Bread',
    location: 'Hitec City',
    requiredDate: new Date('2026-10-15'),
    requiredTime: '11:00',
    status: 'REJECTED',
  });

  const reqCancelled = await FoodRequest.create({
    customer: customerA._id,
    peopleCount: 15,
    foodType: 'Fruit',
    location: 'Ameerpet',
    requiredDate: new Date('2026-10-16'),
    requiredTime: '10:00',
    status: 'CANCELLED',
  });

  // Start HTTP server on test port 5097
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

  const tokenA = await getToken('custA_p5@example.com', 'password123');
  const tokenB = await getToken('custB_p5@example.com', 'password123');
  const tokenAdmin = await getToken('admin_p5@example.com', 'password123');

  let passedCount = 0;
  let failedCount = 0;

  const assert = (condition, testName, detail = '') => {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passedCount++;
    } else {
      console.error(`[FAIL] ${testName} ${detail}`);
      failedCount++;
      process.exitCode = 1;
    }
  };

  try {
    // 1. OPEN request cannot be acknowledged (409)
    const resOpen = await fetch(`${baseUrl}/food-requests/${reqOpen._id}/acknowledge`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const dataOpen = await resOpen.json();
    assert(resOpen.status === 409 && dataOpen.message === 'Food delivery has not been completed yet.', 'Test 1: OPEN request cannot be acknowledged (409)');

    // 2. MATCHED request cannot be acknowledged (409)
    const resMatched = await fetch(`${baseUrl}/food-requests/${reqMatched._id}/acknowledge`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(resMatched.status === 409, 'Test 2: MATCHED request cannot be acknowledged (409)');

    // 3. DELIVERY_ASSIGNED request cannot be acknowledged (409)
    const resAssigned = await fetch(`${baseUrl}/food-requests/${reqAssigned._id}/acknowledge`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(resAssigned.status === 409, 'Test 3: DELIVERY_ASSIGNED request cannot be acknowledged (409)');

    // 4. OUT_FOR_DELIVERY request cannot be acknowledged (409)
    const resOut = await fetch(`${baseUrl}/food-requests/${reqOutForDelivery._id}/acknowledge`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(resOut.status === 409, 'Test 4: OUT_FOR_DELIVERY request cannot be acknowledged (409)');

    // 5. REJECTED request cannot be acknowledged (409)
    const resRej = await fetch(`${baseUrl}/food-requests/${reqRejected._id}/acknowledge`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(resRej.status === 409, 'Test 5: REJECTED request cannot be acknowledged (409)');

    // 6. CANCELLED request cannot be acknowledged (409)
    const resCanc = await fetch(`${baseUrl}/food-requests/${reqCancelled._id}/acknowledge`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(resCanc.status === 409, 'Test 6: CANCELLED request cannot be acknowledged (409)');

    // 7. Unauthenticated request rejected (401)
    const resUnauth = await fetch(`${baseUrl}/food-requests/${reqDelivered._id}/acknowledge`, {
      method: 'PATCH',
    });
    assert(resUnauth.status === 401, 'Test 7: Unauthenticated acknowledgement rejected (401)');

    // 8. Non-CUSTOMER role cannot use endpoint (403)
    const resAdmin = await fetch(`${baseUrl}/food-requests/${reqDelivered._id}/acknowledge`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${tokenAdmin}` },
    });
    assert(resAdmin.status === 403, 'Test 8: Non-CUSTOMER role forbidden from acknowledge endpoint (403)');

    // 9. Customer B cannot acknowledge Customer A's DELIVERED request (403)
    const resOtherCust = await fetch(`${baseUrl}/food-requests/${reqDelivered._id}/acknowledge`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    assert(resOtherCust.status === 403, 'Test 9: Customer B cannot acknowledge Customer A request (403)');

    // 10. Customer cannot force status or change customer identity in request body payload
    const resBodyTamper = await fetch(`${baseUrl}/food-requests/${reqDelivered._id}/acknowledge`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${tokenA}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'ACKNOWLEDGED', customer: customerB._id }),
    });
    const dataBodyTamper = await resBodyTamper.json();
    assert(
      resBodyTamper.status === 200 &&
        dataBodyTamper.data.customer === customerA._id.toString(),
      'Test 10: Request body tampering ignored; customer identity derived strictly from JWT'
    );

    // 11. Customer A can acknowledge own DELIVERED request (200 OK)
    assert(
      dataBodyTamper.success === true &&
        dataBodyTamper.data.status === 'ACKNOWLEDGED' &&
        dataBodyTamper.data.acknowledgement.acknowledged === true &&
        Boolean(dataBodyTamper.data.acknowledgement.acknowledgedAt) &&
        dataBodyTamper.data.acknowledgement.acknowledgedBy === customerA._id.toString(),
      'Test 11: Valid acknowledgement transitions DELIVERED -> ACKNOWLEDGED with complete audit data'
    );

    // 12. Idempotency test: Second call on already ACKNOWLEDGED request returns 200 OK without failing
    const resIdempotent = await fetch(`${baseUrl}/food-requests/${reqDelivered._id}/acknowledge`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const dataIdempotent = await resIdempotent.json();
    assert(
      resIdempotent.status === 200 &&
        dataIdempotent.success &&
        dataIdempotent.data.status === 'ACKNOWLEDGED',
      'Test 12: Idempotent re-submission succeeds cleanly with 200 OK'
    );

    // 13. Database state verification directly in MongoDB
    const dbRecord = await FoodRequest.findById(reqDelivered._id);
    assert(
      dbRecord.status === 'ACKNOWLEDGED' &&
        dbRecord.acknowledgement.acknowledged === true &&
        dbRecord.acknowledgement.acknowledgedBy.toString() === customerA._id.toString(),
      'Test 13: Database record reflects status=ACKNOWLEDGED and valid acknowledgement object'
    );

    // 14. Race Condition Test: Concurrent simultaneous requests to acknowledge a DELIVERED request
    const reqRace = await FoodRequest.create({
      customer: customerA._id,
      peopleCount: 100,
      foodType: 'Buffet',
      location: 'Kondapur',
      requiredDate: new Date('2026-10-20'),
      requiredTime: '20:00',
      status: 'DELIVERED',
    });

    const [raceRes1, raceRes2] = await Promise.all([
      fetch(`${baseUrl}/food-requests/${reqRace._id}/acknowledge`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${tokenA}` },
      }),
      fetch(`${baseUrl}/food-requests/${reqRace._id}/acknowledge`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${tokenA}` },
      }),
    ]);

    assert(
      raceRes1.status === 200 && raceRes2.status === 200,
      'Test 14: Concurrent simultaneous acknowledgement calls both resolve cleanly (200 OK)'
    );

  } catch (err) {
    console.error('Test execution error:', err);
    process.exitCode = 1;
  } finally {
    if (server) {
      server.close();
    }
    await mongoose.connection.close();
    console.log(`\n--- PHASE 5 TEST RESULTS: ${passedCount} PASSED, ${failedCount} FAILED ---`);
  }
};

runPhase5Tests();
