require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/modules/auth/auth.model');
const Donation = require('./src/modules/donation/donation.model');
const DonationInterest = require('./src/modules/donation/donationInterest.model');
const app = require('./src/app');
const http = require('http');

let server;
let baseUrl;

const runPhase6Tests = async () => {
  console.log('--- STARTING PHASE 6 CUSTOMER DONATION OPPORTUNITIES & INTEREST TEST SUITE ---');

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✓ MongoDB Connected');

  // Clear test users, donations, and interests
  await User.deleteMany({ email: { $in: ['donor_p6@example.com', 'custA_p6@example.com', 'custB_p6@example.com', 'admin_p6@example.com'] } });
  await Donation.deleteMany({});
  await DonationInterest.deleteMany({});
  console.log('✓ Cleaned test database records');

  // Seed Users
  const donor = await User.create({ name: 'Donor P6', email: 'donor_p6@example.com', password: 'password123', role: 'DONOR' });
  const customerA = await User.create({ name: 'Customer A P6', email: 'custA_p6@example.com', password: 'password123', role: 'CUSTOMER' });
  const customerB = await User.create({ name: 'Customer B P6', email: 'custB_p6@example.com', password: 'password123', role: 'CUSTOMER' });
  const adminP6 = await User.create({ name: 'Admin P6', email: 'admin_p6@example.com', password: 'password123', role: 'ADMIN' });

  // Seed Food Donations
  const donationAvailable1 = await Donation.create({
    donor: donor._id,
    foodType: 'Vegetarian Meals',
    quantity: 80,
    location: 'Hyderabad Main Road',
    availableDate: new Date('2026-10-25'),
    availableTime: '14:00',
    notes: 'Fresh untouched meals from event',
    status: 'AVAILABLE',
  });

  const donationAvailable2 = await Donation.create({
    donor: donor._id,
    foodType: 'Rice Packets',
    quantity: 50,
    location: 'Secunderabad Station',
    availableDate: new Date('2026-10-26'),
    availableTime: '16:30',
    status: 'AVAILABLE',
  });

  const donationClosed = await Donation.create({
    donor: donor._id,
    foodType: 'Snacks',
    quantity: 30,
    location: 'Kondapur',
    availableDate: new Date('2026-10-20'),
    availableTime: '10:00',
    status: 'CLOSED',
  });

  // Start HTTP server on test port 5095
  await new Promise((resolve) => {
    server = http.createServer(app);
    server.listen(5095, () => {
      baseUrl = 'http://127.0.0.1:5095/api';
      console.log('✓ Test Server running on port 5095');
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

  const tokenA = await getToken('custA_p6@example.com', 'password123');
  const tokenB = await getToken('custB_p6@example.com', 'password123');
  const tokenAdmin = await getToken('admin_p6@example.com', 'password123');

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
    // 1. Authenticated Customer can fetch available donations
    const resAvailable = await fetch(`${baseUrl}/donations/available`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const dataAvailable = await resAvailable.json();
    assert(
      resAvailable.status === 200 &&
        dataAvailable.success &&
        Array.isArray(dataAvailable.data) &&
        dataAvailable.data.length === 2 &&
        dataAvailable.data.every((d) => d.status === 'AVAILABLE'),
      'Test 1: Authenticated Customer can view available food donations'
    );

    // 2. Unauthenticated user rejected (401)
    const resUnauth = await fetch(`${baseUrl}/donations/available`);
    assert(resUnauth.status === 401, 'Test 2: Unauthenticated request rejected (401)');

    // 3. Non-CUSTOMER role blocked (403)
    const resAdmin = await fetch(`${baseUrl}/donations/available`, {
      headers: { Authorization: `Bearer ${tokenAdmin}` },
    });
    assert(resAdmin.status === 403, 'Test 3: Non-CUSTOMER role forbidden (403)');

    // 4. Customer can view single donation details
    const resSingle = await fetch(`${baseUrl}/donations/${donationAvailable1._id}`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const dataSingle = await resSingle.json();
    assert(
      resSingle.status === 200 &&
        dataSingle.data.quantity === 80 &&
        dataSingle.data.myInterest === null,
      'Test 4: Customer can view single donation details with no prior interest'
    );

    // 5. Customer A expresses interest in donationAvailable1
    const resInterest = await fetch(`${baseUrl}/donations/${donationAvailable1._id}/interests`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const dataInterest = await resInterest.json();
    assert(
      resInterest.status === 201 &&
        dataInterest.success &&
        dataInterest.data.status === 'INTERESTED' &&
        dataInterest.data.customer === customerA._id.toString(),
      'Test 5: Customer A expresses interest; status becomes INTERESTED'
    );

    // 6. Duplicate interest in same donation rejected (409)
    const resDup = await fetch(`${baseUrl}/donations/${donationAvailable1._id}/interests`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const dataDup = await resDup.json();
    assert(
      resDup.status === 409 &&
        dataDup.message === 'You have already expressed interest in this food donation.',
      'Test 6: Duplicate interest rejected with 409 Conflict'
    );

    // 7. Customer cannot express interest in unavailable/CLOSED donation (409)
    const resClosed = await fetch(`${baseUrl}/donations/${donationClosed._id}/interests`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const dataClosed = await resClosed.json();
    assert(
      resClosed.status === 409 &&
        dataClosed.message === 'This donation is no longer available.',
      'Test 7: Interest in unavailable donation rejected with 409 Conflict'
    );

    // 8. Customer A views my interests (returns only Customer A interests)
    const resMyIntA = await fetch(`${baseUrl}/donations/interests/my`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const dataMyIntA = await resMyIntA.json();
    assert(
      resMyIntA.status === 200 &&
        dataMyIntA.data.length === 1 &&
        dataMyIntA.data[0].customer === customerA._id.toString(),
      'Test 8: Customer A views own expressed interests'
    );

    // 9. Customer B views my interests (returns empty, non-leaking)
    const resMyIntB = await fetch(`${baseUrl}/donations/interests/my`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    const dataMyIntB = await resMyIntB.json();
    assert(
      resMyIntB.status === 200 && dataMyIntB.data.length === 0,
      'Test 9: Customer B cannot view Customer A interests (isolated per customer)'
    );

    // 10. Customer B cannot withdraw Customer A's interest record (403)
    const interestA = dataMyIntA.data[0];
    const resWithdrawOther = await fetch(`${baseUrl}/donations/interests/${interestA.id}/withdraw`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    assert(resWithdrawOther.status === 403, 'Test 10: Customer B forbidden from withdrawing Customer A interest (403)');

    // 11. Customer A can withdraw own active interest
    const resWithdrawSelf = await fetch(`${baseUrl}/donations/interests/${interestA.id}/withdraw`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const dataWithdrawSelf = await resWithdrawSelf.json();
    assert(
      resWithdrawSelf.status === 200 &&
        dataWithdrawSelf.data.status === 'WITHDRAWN',
      'Test 11: Customer A withdraws own interest; status becomes WITHDRAWN'
    );

    // 12. Re-expressing interest after withdrawal re-activates interest to INTERESTED
    const resReExpress = await fetch(`${baseUrl}/donations/${donationAvailable1._id}/interests`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const dataReExpress = await resReExpress.json();
    assert(
      resReExpress.status === 200 || resReExpress.status === 201,
      'Test 12: Re-expressing interest after withdrawal re-activates interest record'
    );

    // 13. Test SELECTED status handling
    // Manually set interest status to SELECTED in DB to test protection
    await DonationInterest.findByIdAndUpdate(interestA.id, { status: 'SELECTED' });

    // Customer A attempting to withdraw SELECTED interest is blocked (409)
    const resWithdrawSelected = await fetch(`${baseUrl}/donations/interests/${interestA.id}/withdraw`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const dataWithdrawSelected = await resWithdrawSelected.json();
    assert(
      resWithdrawSelected.status === 409 &&
        dataWithdrawSelected.message === 'Cannot withdraw interest after selection.',
      'Test 13: Cannot withdraw interest after status reaches SELECTED (409 Conflict)'
    );

    // 14. Donation details page query shows populated myInterest object with status SELECTED
    const resSingleSelected = await fetch(`${baseUrl}/donations/${donationAvailable1._id}`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const dataSingleSelected = await resSingleSelected.json();
    assert(
      resSingleSelected.status === 200 &&
        dataSingleSelected.data.myInterest.status === 'SELECTED',
      'Test 14: Single donation query returns populated myInterest state (SELECTED)'
    );

  } catch (err) {
    console.error('Test execution error:', err);
    process.exitCode = 1;
  } finally {
    if (server) {
      server.close();
    }
    await mongoose.connection.close();
    console.log(`\n--- PHASE 6 TEST RESULTS: ${passedCount} PASSED, ${failedCount} FAILED ---`);
  }
};

runPhase6Tests();
