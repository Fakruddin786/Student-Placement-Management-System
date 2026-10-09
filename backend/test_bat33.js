/**
 * BAT-33 Automated Integration Test Script
 * Verifies all 10 acceptance scenarios
 */

const BASE_URL = 'http://localhost:5000/api/companies';

async function runTests() {
  console.log('====================================================');
  console.log('🧪 Starting BAT-33 Comprehensive Integration Tests');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, details = '') {
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName} - ${details}`);
      failed++;
    }
  }

  const testEmail = `test_company_${Date.now()}@acme.org`;
  let authToken = '';

  // ----------------------------------------------------
  // Test 1: Company registration with valid data
  // ----------------------------------------------------
  try {
    const res = await fetch(`${BASE_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        company_name: 'Acme Innovations Tech',
        email: testEmail,
        password: 'SecurePassword123!',
        confirm_password: 'SecurePassword123!',
        contact_number: '+919876543210',
      }),
    });
    const data = await res.json();
    assert(
      res.status === 201 && data.success && data.company?.email === testEmail && !data.company?.password_hash,
      'Test 1: Company registration with valid data (returns 201, safe response, no password hash)'
    );
  } catch (err) {
    assert(false, 'Test 1', err.message);
  }

  // ----------------------------------------------------
  // Test 2: Registration with missing fields
  // ----------------------------------------------------
  try {
    const res = await fetch(`${BASE_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        company_name: '',
        email: '',
      }),
    });
    const data = await res.json();
    assert(
      res.status === 400 && !data.success && data.errors?.company_name && data.errors?.email,
      'Test 2: Registration with missing fields (returns 400 with validation messages)'
    );
  } catch (err) {
    assert(false, 'Test 2', err.message);
  }

  // ----------------------------------------------------
  // Test 3: Registration with invalid email format
  // ----------------------------------------------------
  try {
    const res = await fetch(`${BASE_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        company_name: 'Bad Email Co',
        email: 'invalid-email-format',
        password: 'Password123!',
        confirm_password: 'Password123!',
        contact_number: '9876543210',
      }),
    });
    const data = await res.json();
    assert(
      res.status === 400 && data.errors?.email === 'Please enter a valid email address.',
      'Test 3: Registration with invalid email (returns 400 "Please enter a valid email address.")'
    );
  } catch (err) {
    assert(false, 'Test 3', err.message);
  }

  // ----------------------------------------------------
  // Test 4: Registration with duplicate email
  // ----------------------------------------------------
  try {
    const res = await fetch(`${BASE_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        company_name: 'Duplicate Acme Co',
        email: testEmail, // Already registered in Test 1
        password: 'Password123!',
        confirm_password: 'Password123!',
        contact_number: '9876543210',
      }),
    });
    const data = await res.json();
    assert(
      res.status === 409 && !data.success,
      'Test 4: Registration with duplicate email (returns 409 Conflict)'
    );
  } catch (err) {
    assert(false, 'Test 4', err.message);
  }

  // ----------------------------------------------------
  // Test 5: Registration with password mismatch
  // ----------------------------------------------------
  try {
    const res = await fetch(`${BASE_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        company_name: 'Mismatch Co',
        email: `mismatch_${Date.now()}@acme.org`,
        password: 'Password123!',
        confirm_password: 'DifferentPassword456!',
        contact_number: '9876543210',
      }),
    });
    const data = await res.json();
    assert(
      res.status === 400 && data.errors?.confirm_password === 'Passwords do not match.',
      'Test 5: Registration with password mismatch (returns 400 "Passwords do not match.")'
    );
  } catch (err) {
    assert(false, 'Test 5', err.message);
  }

  // ----------------------------------------------------
  // Test 6: Successful login & JWT issuance
  // ----------------------------------------------------
  try {
    const res = await fetch(`${BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: 'SecurePassword123!',
      }),
    });
    const data = await res.json();
    authToken = data.token;
    assert(
      res.status === 200 && data.success && !!authToken && !data.company?.password_hash,
      'Test 6: Successful login (returns 200, JWT token, safe company object)'
    );
  } catch (err) {
    assert(false, 'Test 6', err.message);
  }

  // ----------------------------------------------------
  // Test 7: Login with incorrect password
  // ----------------------------------------------------
  try {
    const res = await fetch(`${BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: 'WrongPassword!',
      }),
    });
    const data = await res.json();
    assert(
      res.status === 401 && !data.success,
      'Test 7: Login with incorrect password (returns 401 Unauthorized)'
    );
  } catch (err) {
    assert(false, 'Test 7', err.message);
  }

  // ----------------------------------------------------
  // Test 8: Profile creation after authentication
  // ----------------------------------------------------
  try {
    const res = await fetch(`${BASE_URL}/profile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        company_name: 'Acme Innovations Tech',
        description: 'Leading provider of enterprise cloud computing and AI applications.',
        industry: 'Information Technology',
        website: 'https://acme-innovations.org',
        official_email: testEmail,
        contact_number: '+919876543210',
        address: 'Plot 42, Electronic City Phase 1',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560100',
        logo_url: 'https://placehold.co/150x150/1e40af/ffffff?text=Acme',
      }),
    });
    const data = await res.json();
    assert(
      res.status === 201 && data.success && data.profile?.city === 'Bengaluru',
      'Test 8: Profile creation after authentication (returns 201 and saved profile)'
    );
  } catch (err) {
    assert(false, 'Test 8', err.message);
  }

  // ----------------------------------------------------
  // Test 9: Profile creation without authentication
  // ----------------------------------------------------
  try {
    const res = await fetch(`${BASE_URL}/profile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        company_name: 'Unauthorized Co',
        description: 'Should fail authentication check.',
      }),
    });
    const data = await res.json();
    assert(
      res.status === 401 && !data.success,
      'Test 9: Profile creation without authentication (rejected with 401 Unauthorized)'
    );
  } catch (err) {
    assert(false, 'Test 9', err.message);
  }

  // ----------------------------------------------------
  // Test 10: Retrieve authenticated company profile
  // ----------------------------------------------------
  try {
    const res = await fetch(`${BASE_URL}/profile`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });
    const data = await res.json();
    assert(
      res.status === 200 &&
        data.success &&
        data.profile &&
        data.profile.website === 'https://acme-innovations.org' &&
        !data.profile.password_hash,
      'Test 10: Retrieve authenticated company profile (returns 200 and complete profile details)'
    );
  } catch (err) {
    assert(false, 'Test 10', err.message);
  }

  console.log('\n====================================================');
  console.log(`Test Results Summary: ${passed} Passed, ${failed} Failed`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

const http = require('http');

const req = http.get('http://localhost:5000/api/health', (res) => {
  runTests();
});

req.on('error', () => {
  console.log('Starting in-process server on port 5000 for BAT-33 tests...');
  require('./server');
  setTimeout(() => {
    runTests();
  }, 1500);
});
