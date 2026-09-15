require('dotenv').config();
const mongoose = require('mongoose');
const http = require('http');
const app = require('./src/app');

const User = require('./src/modules/auth/auth.model');
const Volunteer = require('./src/modules/volunteer/volunteer.model');
const volunteerService = require('./src/modules/volunteer/volunteer.service');
const Beneficiary = require('./src/modules/beneficiary/beneficiary.model');
const Vehicle = require('./src/modules/vehicle/vehicle.model');
const FoodRequest = require('./src/modules/foodRequest/foodRequest.model');
const Assignment = require('./src/modules/assignment/assignment.model');
const Collection = require('./src/modules/collection/collection.model');
const Distribution = require('./src/modules/distribution/distribution.model');
const Notification = require('./src/modules/notification/notification.model');

let server;
let baseUrl;

const runTests = async () => {
  console.log('====================================================');
  console.log('   VOLUNTEER MODULE TEST SUITE (CRITERIA A - F)     ');
  console.log('====================================================');

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✓ Connected to MongoDB');

  // Clean test data
  const testEmails = [
    'admin.test@example.com',
    'volunteer.a@example.com',
    'volunteer.b@example.com',
    'donor.test@example.com',
  ];
  await User.deleteMany({ email: { $in: testEmails } });
  await Beneficiary.deleteMany({ name: /^TEST_/ });
  await Vehicle.deleteMany({ vehicleNumber: /^TEST-/ });
  await FoodRequest.deleteMany({ foodType: /^TEST_/ });
  await Assignment.deleteMany({ foodType: /^TEST_/ });
  console.log('✓ Cleaned up prior test records');

  // Seed Admin
  const adminUser = await User.create({
    name: 'Test Admin',
    email: 'admin.test@example.com',
    password: 'password123',
    role: 'ADMIN',
  });

  // Seed Volunteer A
  const volAUser = await User.create({
    name: 'Volunteer Alice',
    email: 'volunteer.a@example.com',
    password: 'password123',
    role: 'VOLUNTEER',
  });
  const volAProfile = await Volunteer.create({
    userId: volAUser._id,
    phone: '555-0101',
    availability: 'AVAILABLE',
  });

  // Seed Volunteer B
  const volBUser = await User.create({
    name: 'Volunteer Bob',
    email: 'volunteer.b@example.com',
    password: 'password123',
    role: 'VOLUNTEER',
  });
  const volBProfile = await Volunteer.create({
    userId: volBUser._id,
    phone: '555-0102',
    availability: 'AVAILABLE',
  });

  // Seed Donor
  const donorUser = await User.create({
    name: 'Test Donor',
    email: 'donor.test@example.com',
    password: 'password123',
    role: 'DONOR',
  });

  // Seed Beneficiary
  const testBeneficiary = await Beneficiary.create({
    name: 'TEST_Shelter_Alpha',
    type: 'SHELTER',
    phone: '555-0200',
    address: '456 Charity Lane',
    location: { latitude: 37.78, longitude: -122.41 },
    verified: true,
  });

  // Seed Vehicles
  const vehicle1 = await Vehicle.create({
    vehicleNumber: 'TEST-VEH-01',
    vehicleType: 'VAN',
    capacity: 200,
    status: 'AVAILABLE',
  });
  const vehicle2 = await Vehicle.create({
    vehicleNumber: 'TEST-VEH-02',
    vehicleType: 'SUV',
    capacity: 100,
    status: 'AVAILABLE',
  });

  // Start test server on port 5098
  await new Promise((resolve) => {
    server = http.createServer(app);
    server.listen(5098, () => {
      baseUrl = 'http://127.0.0.1:5098/api';
      console.log('✓ Test HTTP server running on port 5098\n');
      resolve();
    });
  });

  // Login tokens
  const login = async (email, password) => {
    const res = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    return data.token;
  };

  const adminToken = await login('admin.test@example.com', 'password123');
  const volAToken = await login('volunteer.a@example.com', 'password123');
  const volBToken = await login('volunteer.b@example.com', 'password123');
  const donorToken = await login('donor.test@example.com', 'password123');

  let passed = 0;
  let failed = 0;

  const assert = (condition, title) => {
    if (condition) {
      console.log(`  [PASS] ${title}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${title}`);
      failed++;
      process.exitCode = 1;
    }
  };

  try {
    // -------------------------------------------------------------
    // TEST SUITE A: Happy Path Workflow
    // ASSIGNED → ACCEPTED → PICKUP_STARTED → COLLECTED → IN_TRANSIT → DELIVERED → BENEFICIARY ACK → COMPLETED
    // -------------------------------------------------------------
    console.log('--- TEST SUITE A: HAPPY PATH WORKFLOW ---');

    // 1. Seed food request
    const foodReqA = await FoodRequest.create({
      donorId: donorUser._id,
      beneficiaryId: testBeneficiary._id,
      foodType: 'TEST_Sandwiches',
      quantity: { value: 50, unit: 'MEALS' },
      pickupAddress: '123 Bakery St',
      status: 'OPEN',
    });

    // 2. Admin creates assignment
    const createRes = await fetch(`${baseUrl}/assignments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        foodRequestId: foodReqA._id.toString(),
        donorId: donorUser._id.toString(),
        beneficiaryId: testBeneficiary._id.toString(),
        volunteerId: volAUser._id.toString(),
        vehicleId: vehicle1._id.toString(),
        pickupAddress: '123 Bakery St',
        deliveryAddress: '456 Charity Lane',
        foodType: 'TEST_Sandwiches',
        quantity: { value: 50, unit: 'MEALS' },
      }),
    });
    const createData = await createRes.json();
    assert(createRes.status === 201, 'Admin creates assignment (201 Created)');
    assert(createData.assignment.status === 'ASSIGNED', 'Assignment status is ASSIGNED');
    assert(createData.assignment.isActive === true, 'Assignment isActive is true');

    const assignmentId = createData.assignment.id;

    // Verify volunteer received notification
    const notifRes = await fetch(`${baseUrl}/notifications`, {
      headers: { Authorization: `Bearer ${volAToken}` },
    });
    const notifData = await notifRes.json();
    assert(notifData.notifications.length > 0, 'Volunteer received assignment notification');

    // 3. Volunteer accepts assignment
    const acceptRes = await fetch(`${baseUrl}/assignments/${assignmentId}/accept`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${volAToken}` },
    });
    const acceptData = await acceptRes.json();
    assert(acceptRes.status === 200, 'Volunteer accepts assignment (200 OK)');
    assert(acceptData.assignment.status === 'VOLUNTEER_ACCEPTED', 'Status transitioned to VOLUNTEER_ACCEPTED');

    // Check volunteer availability became BUSY
    const profileA = await Volunteer.findOne({ userId: volAUser._id });
    assert(profileA.availability === 'BUSY', 'Volunteer status transitioned to BUSY');

    // 4. Volunteer starts pickup
    const pickupRes = await fetch(`${baseUrl}/assignments/${assignmentId}/start-pickup`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${volAToken}` },
    });
    const pickupData = await pickupRes.json();
    assert(pickupRes.status === 200, 'Volunteer starts pickup (200 OK)');
    assert(pickupData.assignment.status === 'PICKUP_STARTED', 'Status transitioned to PICKUP_STARTED');

    // 5. Volunteer performs food safety verification and collection
    const collectRecordRes = await fetch(`${baseUrl}/collections`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${volAToken}`,
      },
      body: JSON.stringify({
        assignmentId,
        collectedQuantity: { value: 50, unit: 'MEALS' },
        foodSafety: {
          preparationTime: '10:30 AM',
          temperature: 4.5,
          temperatureUnit: 'C',
          temperatureChecked: true,
          properlyPacked: true,
          packagingIntact: true,
          noVisibleContamination: true,
          notes: 'Safe and properly stored',
        },
      }),
    });
    assert(collectRecordRes.status === 201, 'Volunteer records collection & food safety verification (201 Created)');

    const confirmCollectRes = await fetch(`${baseUrl}/assignments/${assignmentId}/collect`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${volAToken}` },
    });
    const confirmCollectData = await confirmCollectRes.json();
    assert(confirmCollectRes.status === 200, 'Volunteer confirms collection (200 OK)');
    assert(confirmCollectData.assignment.status === 'COLLECTED', 'Status transitioned to COLLECTED');

    // 6. Volunteer starts transport
    const transportRes = await fetch(`${baseUrl}/assignments/${assignmentId}/start-transport`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${volAToken}` },
    });
    const transportData = await transportRes.json();
    assert(transportRes.status === 200, 'Volunteer starts transport (200 OK)');
    assert(transportData.assignment.status === 'IN_TRANSIT', 'Status transitioned to IN_TRANSIT');

    // 7. Volunteer records distribution & confirms delivery
    const distRecordRes = await fetch(`${baseUrl}/distributions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${volAToken}`,
      },
      body: JSON.stringify({
        assignmentId,
        distributedQuantity: { value: 50, unit: 'MEALS' },
        peopleServed: 50,
        notes: 'Handed over directly to shelter manager',
      }),
    });
    assert(distRecordRes.status === 201, 'Volunteer records distribution (201 Created)');

    const deliverRes = await fetch(`${baseUrl}/assignments/${assignmentId}/deliver`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${volAToken}` },
    });
    const deliverData = await deliverRes.json();
    assert(deliverRes.status === 200, 'Volunteer confirms delivery (200 OK)');
    assert(deliverData.assignment.status === 'DELIVERED', 'Status transitioned to DELIVERED');
    assert(deliverData.assignment.isActive === true, 'Remains isActive true while DELIVERED');

    // 8. Volunteer CANNOT acknowledge / complete
    const volAckRes = await fetch(`${baseUrl}/assignments/${assignmentId}/acknowledge`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${volAToken}` },
    });
    assert(volAckRes.status === 403, 'Volunteer cannot self-acknowledge/complete (403 Forbidden)');

    // 9. Beneficiary/Admin acknowledges receipt
    const adminAckRes = await fetch(`${baseUrl}/assignments/${assignmentId}/acknowledge`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const ackData = await adminAckRes.json();
    assert(adminAckRes.status === 200, 'Beneficiary/Admin acknowledges receipt (200 OK)');
    assert(ackData.assignment.status === 'COMPLETED', 'Status transitioned to COMPLETED');
    assert(ackData.assignment.isActive === false, 'Assignment isActive is false after completion');

    // 10. Check volunteer & vehicle released
    const updatedVolA = await Volunteer.findOne({ userId: volAUser._id });
    assert(updatedVolA.availability === 'AVAILABLE', 'Volunteer released back to AVAILABLE');
    assert(updatedVolA.completedTasks === 1, 'Volunteer completedTasks incremented to 1');
    assert(updatedVolA.totalMealsDelivered === 50, 'Volunteer totalMealsDelivered updated to 50');

    const updatedVeh1 = await Vehicle.findById(vehicle1._id);
    assert(updatedVeh1.status === 'AVAILABLE', 'Vehicle released back to AVAILABLE');

    // -------------------------------------------------------------
    // TEST SUITE B: Concurrency (Simultaneous acceptance)
    // -------------------------------------------------------------
    console.log('\n--- TEST SUITE B: CONCURRENCY PROTECTION ---');

    const foodReqB = await FoodRequest.create({
      donorId: donorUser._id,
      beneficiaryId: testBeneficiary._id,
      foodType: 'TEST_Pastries',
      quantity: { value: 30, unit: 'PACKETS' },
      pickupAddress: '789 Sugar Ave',
      status: 'OPEN',
    });

    const assignBRes = await fetch(`${baseUrl}/assignments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        foodRequestId: foodReqB._id.toString(),
        donorId: donorUser._id.toString(),
        beneficiaryId: testBeneficiary._id.toString(),
        volunteerId: volAUser._id.toString(),
        vehicleId: vehicle1._id.toString(),
        pickupAddress: '789 Sugar Ave',
        deliveryAddress: '456 Charity Lane',
        foodType: 'TEST_Pastries',
        quantity: { value: 30, unit: 'PACKETS' },
      }),
    });
    const assignBData = await assignBRes.json();
    const assignmentBId = assignBData.assignment.id;

    // Simulate two simultaneous accept requests (Volunteer A first, duplicate second)
    const [simul1, simul2] = await Promise.all([
      fetch(`${baseUrl}/assignments/${assignmentBId}/accept`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${volAToken}` },
      }),
      fetch(`${baseUrl}/assignments/${assignmentBId}/accept`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${volAToken}` },
      }),
    ]);

    const statuses = [simul1.status, simul2.status].sort();
    assert(
      statuses[0] === 200 && statuses[1] === 409,
      `Simultaneous accept: one gets 200, one gets 409 (received: ${statuses[0]}, ${statuses[1]})`
    );

    // Clean up assignment B
    await Assignment.findByIdAndUpdate(assignmentBId, { status: 'CANCELLED', isActive: false });
    await volunteerService.setAvailable(volAUser._id);
    await Vehicle.findByIdAndUpdate(vehicle1._id, { status: 'AVAILABLE' });

    // -------------------------------------------------------------
    // TEST SUITE C: Volunteer Ownership Security
    // Volunteer A tries to access Volunteer B's assignment
    // -------------------------------------------------------------
    console.log('\n--- TEST SUITE C: OWNERSHIP SECURITY ---');

    const foodReqC = await FoodRequest.create({
      donorId: donorUser._id,
      beneficiaryId: testBeneficiary._id,
      foodType: 'TEST_RiceMeals',
      quantity: { value: 40, unit: 'MEALS' },
      pickupAddress: '100 Main St',
      status: 'OPEN',
    });

    const assignCRes = await fetch(`${baseUrl}/assignments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        foodRequestId: foodReqC._id.toString(),
        donorId: donorUser._id.toString(),
        beneficiaryId: testBeneficiary._id.toString(),
        volunteerId: volBUser._id.toString(), // Assigned to Volunteer B
        vehicleId: vehicle2._id.toString(),
        pickupAddress: '100 Main St',
        deliveryAddress: '456 Charity Lane',
        foodType: 'TEST_RiceMeals',
        quantity: { value: 40, unit: 'MEALS' },
      }),
    });
    const assignCData = await assignCRes.json();
    const assignmentCId = assignCData.assignment.id;

    // Volunteer A attempts to get assignment C
    const crossGetRes = await fetch(`${baseUrl}/assignments/${assignmentCId}`, {
      headers: { Authorization: `Bearer ${volAToken}` },
    });
    assert(crossGetRes.status === 403, 'Volunteer A viewing Volunteer B assignment returns 403');

    // Volunteer A attempts to accept Volunteer B assignment
    const crossAcceptRes = await fetch(`${baseUrl}/assignments/${assignmentCId}/accept`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${volAToken}` },
    });
    assert(crossAcceptRes.status === 403, 'Volunteer A accepting Volunteer B assignment returns 403');

    // Clean up assignment C
    await Assignment.findByIdAndUpdate(assignmentCId, { status: 'CANCELLED', isActive: false });
    await volunteerService.setAvailable(volBUser._id);
    await Vehicle.findByIdAndUpdate(vehicle2._id, { status: 'AVAILABLE' });

    // -------------------------------------------------------------
    // TEST SUITE D: Invalid Transitions
    // ASSIGNED → deliver, ASSIGNED → collect, COLLECTED → deliver, COMPLETED → accept
    // -------------------------------------------------------------
    console.log('\n--- TEST SUITE D: INVALID TRANSITIONS ---');

    const foodReqD = await FoodRequest.create({
      donorId: donorUser._id,
      beneficiaryId: testBeneficiary._id,
      foodType: 'TEST_Soup',
      quantity: { value: 20, unit: 'MEALS' },
      pickupAddress: '200 Broth Rd',
      status: 'OPEN',
    });

    const assignDRes = await fetch(`${baseUrl}/assignments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        foodRequestId: foodReqD._id.toString(),
        donorId: donorUser._id.toString(),
        beneficiaryId: testBeneficiary._id.toString(),
        volunteerId: volAUser._id.toString(),
        vehicleId: vehicle1._id.toString(),
        pickupAddress: '200 Broth Rd',
        deliveryAddress: '456 Charity Lane',
        foodType: 'TEST_Soup',
        quantity: { value: 20, unit: 'MEALS' },
      }),
    });
    const assignDData = await assignDRes.json();
    const assignmentDId = assignDData.assignment.id;

    // ASSIGNED -> deliver
    const invalidDeliver = await fetch(`${baseUrl}/assignments/${assignmentDId}/deliver`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${volAToken}` },
    });
    assert(invalidDeliver.status === 400, 'Invalid transition: ASSIGNED -> deliver returns 400');

    // ASSIGNED -> collect
    const invalidCollect = await fetch(`${baseUrl}/assignments/${assignmentDId}/collect`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${volAToken}` },
    });
    assert(invalidCollect.status === 400, 'Invalid transition: ASSIGNED -> collect returns 400');

    // Move to VOLUNTEER_ACCEPTED -> PICKUP_STARTED -> COLLECTED
    await fetch(`${baseUrl}/assignments/${assignmentDId}/accept`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${volAToken}` },
    });
    await fetch(`${baseUrl}/assignments/${assignmentDId}/start-pickup`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${volAToken}` },
    });
    await Collection.create({
      assignmentId: assignmentDId,
      volunteerId: volAUser._id,
      expectedQuantity: { value: 20, unit: 'MEALS' },
      collectedQuantity: { value: 20, unit: 'MEALS' },
      foodSafety: { packagingIntact: true },
    });
    await fetch(`${baseUrl}/assignments/${assignmentDId}/collect`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${volAToken}` },
    });

    // COLLECTED -> deliver (skipping IN_TRANSIT)
    const invalidDirectDeliver = await fetch(`${baseUrl}/assignments/${assignmentDId}/deliver`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${volAToken}` },
    });
    assert(invalidDirectDeliver.status === 400, 'Invalid transition: COLLECTED -> deliver returns 400');

    // Clean up assignment D
    await Assignment.findByIdAndUpdate(assignmentDId, { status: 'CANCELLED', isActive: false });
    await volunteerService.setAvailable(volAUser._id);
    await Vehicle.findByIdAndUpdate(vehicle1._id, { status: 'AVAILABLE' });

    // -------------------------------------------------------------
    // TEST SUITE E: Duplicate Active Assignment Prevention
    // Same food request attempts to create two active assignments
    // -------------------------------------------------------------
    console.log('\n--- TEST SUITE E: DUPLICATE ACTIVE ASSIGNMENT ---');

    const foodReqE = await FoodRequest.create({
      donorId: donorUser._id,
      beneficiaryId: testBeneficiary._id,
      foodType: 'TEST_Apples',
      quantity: { value: 15, unit: 'KG' },
      pickupAddress: '50 Orchard Ln',
      status: 'OPEN',
    });

    // First assignment creation
    const firstActiveRes = await fetch(`${baseUrl}/assignments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        foodRequestId: foodReqE._id.toString(),
        donorId: donorUser._id.toString(),
        beneficiaryId: testBeneficiary._id.toString(),
        volunteerId: volAUser._id.toString(),
        vehicleId: vehicle1._id.toString(),
        pickupAddress: '50 Orchard Ln',
        deliveryAddress: '456 Charity Lane',
        foodType: 'TEST_Apples',
        quantity: { value: 15, unit: 'KG' },
      }),
    });
    assert(firstActiveRes.status === 201, 'First active assignment created (201)');
    const assignE1 = await firstActiveRes.json();

    // Second active assignment creation attempt with SAME foodRequestId
    const dupActiveRes = await fetch(`${baseUrl}/assignments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        foodRequestId: foodReqE._id.toString(),
        donorId: donorUser._id.toString(),
        beneficiaryId: testBeneficiary._id.toString(),
        volunteerId: volBUser._id.toString(),
        vehicleId: vehicle2._id.toString(),
        pickupAddress: '50 Orchard Ln',
        deliveryAddress: '456 Charity Lane',
        foodType: 'TEST_Apples',
        quantity: { value: 15, unit: 'KG' },
      }),
    });
    assert(dupActiveRes.status === 409, 'Duplicate active assignment fails with 409 Conflict');

    // Clean up E
    await Assignment.findByIdAndUpdate(assignE1.assignment.id, { status: 'CANCELLED', isActive: false });
    await volunteerService.setAvailable(volAUser._id);
    await Vehicle.findByIdAndUpdate(vehicle1._id, { status: 'AVAILABLE' });

    // -------------------------------------------------------------
    // TEST SUITE F: Quantity Validation
    // Collected > expected → reject (400)
    // Distributed > collected → reject (400)
    // -------------------------------------------------------------
    console.log('\n--- TEST SUITE F: QUANTITY VALIDATION ---');

    const foodReqF = await FoodRequest.create({
      donorId: donorUser._id,
      beneficiaryId: testBeneficiary._id,
      foodType: 'TEST_GrainBags',
      quantity: { value: 10, unit: 'CONTAINERS' },
      pickupAddress: '88 Harvest Rd',
      status: 'OPEN',
    });

    const assignFRes = await fetch(`${baseUrl}/assignments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        foodRequestId: foodReqF._id.toString(),
        donorId: donorUser._id.toString(),
        beneficiaryId: testBeneficiary._id.toString(),
        volunteerId: volAUser._id.toString(),
        vehicleId: vehicle1._id.toString(),
        pickupAddress: '88 Harvest Rd',
        deliveryAddress: '456 Charity Lane',
        foodType: 'TEST_GrainBags',
        quantity: { value: 10, unit: 'CONTAINERS' },
      }),
    });
    const assignFData = await assignFRes.json();
    const assignmentFId = assignFData.assignment.id;

    // Accept & start pickup
    await fetch(`${baseUrl}/assignments/${assignmentFId}/accept`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${volAToken}` },
    });
    await fetch(`${baseUrl}/assignments/${assignmentFId}/start-pickup`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${volAToken}` },
    });

    // Collected quantity > expected quantity (15 > 10)
    const excessCollectRes = await fetch(`${baseUrl}/collections`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${volAToken}`,
      },
      body: JSON.stringify({
        assignmentId: assignmentFId,
        collectedQuantity: { value: 15, unit: 'CONTAINERS' },
        foodSafety: { properlyPacked: true },
      }),
    });
    assert(excessCollectRes.status === 400, 'Collected > expected quantity is rejected with 400');

    // Valid collection of 10
    const validCollectRes = await fetch(`${baseUrl}/collections`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${volAToken}`,
      },
      body: JSON.stringify({
        assignmentId: assignmentFId,
        collectedQuantity: { value: 10, unit: 'CONTAINERS' },
        foodSafety: { properlyPacked: true },
      }),
    });
    assert(validCollectRes.status === 201, 'Valid collected quantity accepted (201)');

    // Transition to COLLECTED -> IN_TRANSIT
    await fetch(`${baseUrl}/assignments/${assignmentFId}/collect`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${volAToken}` },
    });
    await fetch(`${baseUrl}/assignments/${assignmentFId}/start-transport`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${volAToken}` },
    });

    // Distributed quantity > collected quantity (12 > 10)
    const excessDistRes = await fetch(`${baseUrl}/distributions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${volAToken}`,
      },
      body: JSON.stringify({
        assignmentId: assignmentFId,
        distributedQuantity: { value: 12, unit: 'CONTAINERS' },
        peopleServed: 30,
      }),
    });
    assert(excessDistRes.status === 400, 'Distributed > collected quantity is rejected with 400');

    // Clean up F
    await Assignment.findByIdAndUpdate(assignmentFId, { status: 'CANCELLED', isActive: false });
    await volunteerService.setAvailable(volAUser._id);
    await Vehicle.findByIdAndUpdate(vehicle1._id, { status: 'AVAILABLE' });

    // -------------------------------------------------------------
    // TEST SUITE G: Volunteer Availability Active Assignment Rule
    // Cannot become UNAVAILABLE while having an active assignment
    // -------------------------------------------------------------
    console.log('\n--- TEST SUITE G: VOLUNTEER AVAILABILITY RESTRICTIONS ---');

    const foodReqG = await FoodRequest.create({
      donorId: donorUser._id,
      beneficiaryId: testBeneficiary._id,
      foodType: 'TEST_Salad',
      quantity: { value: 5, unit: 'PACKETS' },
      pickupAddress: '1 Green Way',
      status: 'OPEN',
    });

    const assignGRes = await fetch(`${baseUrl}/assignments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        foodRequestId: foodReqG._id.toString(),
        donorId: donorUser._id.toString(),
        beneficiaryId: testBeneficiary._id.toString(),
        volunteerId: volAUser._id.toString(),
        vehicleId: vehicle1._id.toString(),
        pickupAddress: '1 Green Way',
        deliveryAddress: '456 Charity Lane',
        foodType: 'TEST_Salad',
        quantity: { value: 5, unit: 'PACKETS' },
      }),
    });
    const assignGData = await assignGRes.json();
    const assignmentGId = assignGData.assignment.id;

    // Volunteer accepts assignment -> becomes BUSY
    await fetch(`${baseUrl}/assignments/${assignmentGId}/accept`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${volAToken}` },
    });

    // Try setting availability to UNAVAILABLE while task is active
    const unavailRes = await fetch(`${baseUrl}/volunteers/me/availability`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${volAToken}`,
      },
      body: JSON.stringify({ availability: 'UNAVAILABLE' }),
    });
    assert(unavailRes.status === 400, 'Cannot switch to UNAVAILABLE while active assignment exists (400)');

    // Clean up G
    await Assignment.findByIdAndUpdate(assignmentGId, { status: 'CANCELLED', isActive: false });
    await volunteerService.setAvailable(volAUser._id);
    await Vehicle.findByIdAndUpdate(vehicle1._id, { status: 'AVAILABLE' });

    console.log('\n====================================================');
    console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('====================================================');
  } catch (err) {
    console.error('Test execution error:', err);
    process.exitCode = 1;
  } finally {
    if (server) {
      server.close();
    }
    await mongoose.disconnect();
  }
};

runTests();
