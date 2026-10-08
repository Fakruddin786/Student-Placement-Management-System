/**
 * BAT-37 Comprehensive Automated Integration Test Suite
 * Tests Company Profile View and Edit Functionality:
 * 1. Authenticated company views profile (GET 200)
 * 2. Profile fields present and correct
 * 3. Password/hash strictly excluded from response
 * 4. Unauthenticated user gets 401
 * 5. Edit profile with valid inputs (PUT 200)
 * 6. Edited profile retrieval with updated values
 * 7. Company name update persistence
 * 8. Contact number update persistence
 * 9. Description update persistence
 * 10. Industry update persistence
 * 11. Website update persistence
 * 12. Address update persistence
 * 13. City, state, pincode update persistence
 * 14. Logo URL update persistence
 * 15. Synchronization between company_profiles and companies tables
 * 16. Validation rejection: empty company name (400)
 * 17. Validation rejection: description < 10 chars (400)
 * 18. Validation rejection: invalid website URL (400)
 * 19. Validation rejection: invalid email format (400)
 * 20. Validation rejection: invalid pincode format (400)
 * 21. Authorization isolation: Company A cannot view or edit Company B's profile
 */

const { pool } = require('./config/database');
const CompanyModel = require('./models/companyModel');
const bcrypt = require('bcryptjs');

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000/api/companies';

async function runBat37Tests() {
  console.log('====================================================');
  console.log('🧪 Starting BAT-37 Company Profile View & Edit Tests');
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

  let companyA = null;
  let companyB = null;
  let tokenA = '';
  let tokenB = '';

  try {
    const rawPassword = 'Password123!';
    const emailA = `alpha_corp_${Date.now()}@domain.org`;
    const emailB = `beta_ltd_${Date.now()}@domain.org`;

    // ----------------------------------------------------
    // Setup: Register Company A and B via API
    // ----------------------------------------------------
    const regResA = await fetch(`${BASE_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        company_name: 'Alpha Systems Inc',
        email: emailA,
        password: rawPassword,
        confirm_password: rawPassword,
        contact_number: '+91 9876543201',
      }),
    });
    const regDataA = await regResA.json();
    companyA = regDataA.company;

    const loginResA = await fetch(`${BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: emailA, password: rawPassword }),
    });
    const loginDataA = await loginResA.json();
    tokenA = loginDataA.token;

    const regResB = await fetch(`${BASE_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        company_name: 'Beta Global Tech',
        email: emailB,
        password: rawPassword,
        confirm_password: rawPassword,
        contact_number: '+91 9876543202',
      }),
    });
    const regDataB = await regResB.json();
    companyB = regDataB.company;

    const loginResB = await fetch(`${BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: emailB, password: rawPassword }),
    });
    const loginDataB = await loginResB.json();
    tokenB = loginDataB.token;

    // Create Initial Profile for Company A (BAT-33)
    await fetch(`${BASE_URL}/profile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        company_name: 'Alpha Systems Inc',
        description: 'Original description for Alpha Systems technology firm.',
        industry: 'Information Technology',
        website: 'https://alpha-systems.com',
        official_email: emailA,
        contact_number: '+91 9876543201',
        address: '100 Innovation Blvd',
        city: 'Bangalore',
        state: 'Karnataka',
        pincode: '560001',
        logo_url: 'https://alpha-systems.com/logo.png',
      }),
    });

    // Create Initial Profile for Company B
    await fetch(`${BASE_URL}/profile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenB}`,
      },
      body: JSON.stringify({
        company_name: 'Beta Global Tech',
        description: 'Original description for Beta Global Tech research.',
        industry: 'Biotechnology',
        website: 'https://betaglobal.com',
        official_email: emailB,
        contact_number: '+91 9876543202',
        address: '200 Science Park',
        city: 'Hyderabad',
        state: 'Telangana',
        pincode: '500001',
        logo_url: 'https://betaglobal.com/logo.png',
      }),
    });

    // ----------------------------------------------------
    // Test 1: Authenticated company views its profile (GET 200)
    // ----------------------------------------------------
    const getRes1 = await fetch(`${BASE_URL}/profile`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const getData1 = await getRes1.json();
    assert(
      getRes1.status === 200 && getData1.success && getData1.hasProfile && getData1.profile,
      'Test 1: Authenticated company views its profile (GET /api/companies/profile returns 200)'
    );

    // ----------------------------------------------------
    // Test 2: Profile contains correct expected fields
    // ----------------------------------------------------
    const p1 = getData1.profile || {};
    const hasRequiredFields =
      p1.company_name === 'Alpha Systems Inc' &&
      p1.description &&
      p1.industry === 'Information Technology' &&
      p1.website === 'https://alpha-systems.com' &&
      p1.official_email === emailA &&
      p1.contact_number === '+91 9876543201' &&
      p1.address === '100 Innovation Blvd' &&
      p1.city === 'Bangalore' &&
      p1.state === 'Karnataka' &&
      p1.pincode === '560001' &&
      p1.logo_url === 'https://alpha-systems.com/logo.png';

    assert(
      hasRequiredFields,
      'Test 2: Profile contains all correct expected fields (name, description, industry, website, email, phone, address, city, state, pincode, logo)'
    );

    // ----------------------------------------------------
    // Test 3: Password / password_hash is strictly excluded
    // ----------------------------------------------------
    const safeCompany = getData1.company || {};
    const safeProfile = getData1.profile || {};
    const noPasswordExposed =
      !safeCompany.password &&
      !safeCompany.password_hash &&
      !safeProfile.password &&
      !safeProfile.password_hash;

    assert(
      noPasswordExposed,
      'Test 3: Security: password and password_hash are strictly excluded from the profile response'
    );

    // ----------------------------------------------------
    // Test 4: Unauthenticated user gets 401
    // ----------------------------------------------------
    const unauthGetRes = await fetch(`${BASE_URL}/profile`);
    const unauthPutRes = await fetch(`${BASE_URL}/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ company_name: 'Hack' }),
    });

    assert(
      unauthGetRes.status === 401 && unauthPutRes.status === 401,
      'Test 4: Unauthenticated user receives 401 Unauthorized for both GET and PUT /profile'
    );

    // ----------------------------------------------------
    // Test 5: Edit profile with valid inputs persists (PUT 200)
    // ----------------------------------------------------
    const updatedPayload = {
      company_name: 'Alpha Systems International Ltd',
      description: 'Updated comprehensive description for Alpha Systems International leading innovations.',
      industry: 'Cloud & AI Solutions',
      website: 'https://alphasystems-intl.com',
      official_email: emailA,
      contact_number: '+91 9988776655',
      address: '999 Cyber Park, Phase 2',
      city: 'Mysuru',
      state: 'Karnataka',
      pincode: '570018',
      logo_url: 'https://alphasystems-intl.com/assets/logo-v2.png',
    };

    const putRes = await fetch(`${BASE_URL}/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify(updatedPayload),
    });
    const putData = await putRes.json();

    assert(
      putRes.status === 200 && putData.success && putData.profile,
      'Test 5: Edit profile with valid inputs succeeds (PUT /api/companies/profile returns 200)'
    );

    // ----------------------------------------------------
    // Test 6: Edited profile can be retrieved with updated values
    // ----------------------------------------------------
    const getRes2 = await fetch(`${BASE_URL}/profile`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const getData2 = await getRes2.json();
    const p2 = getData2.profile || {};

    assert(
      getRes2.status === 200 && p2.company_name === 'Alpha Systems International Ltd',
      'Test 6: Edited profile retrieved via GET /profile reflects updated values'
    );

    // ----------------------------------------------------
    // Test 7: Company name update persists
    // ----------------------------------------------------
    assert(
      p2.company_name === 'Alpha Systems International Ltd',
      'Test 7: Field persistence: company_name updated correctly'
    );

    // ----------------------------------------------------
    // Test 8: Contact number update persists
    // ----------------------------------------------------
    assert(
      p2.contact_number === '+91 9988776655',
      'Test 8: Field persistence: contact_number updated correctly'
    );

    // ----------------------------------------------------
    // Test 9: Description update persists
    // ----------------------------------------------------
    assert(
      p2.description === 'Updated comprehensive description for Alpha Systems International leading innovations.',
      'Test 9: Field persistence: description updated correctly'
    );

    // ----------------------------------------------------
    // Test 10: Industry update persists
    // ----------------------------------------------------
    assert(
      p2.industry === 'Cloud & AI Solutions',
      'Test 10: Field persistence: industry updated correctly'
    );

    // ----------------------------------------------------
    // Test 11: Website URL update persists
    // ----------------------------------------------------
    assert(
      p2.website === 'https://alphasystems-intl.com',
      'Test 11: Field persistence: website URL updated correctly'
    );

    // ----------------------------------------------------
    // Test 12: Address update persists
    // ----------------------------------------------------
    assert(
      p2.address === '999 Cyber Park, Phase 2',
      'Test 12: Field persistence: address updated correctly'
    );

    // ----------------------------------------------------
    // Test 13: City, State, Pincode updates persist
    // ----------------------------------------------------
    assert(
      p2.city === 'Mysuru' && p2.state === 'Karnataka' && p2.pincode === '570018',
      'Test 13: Field persistence: city, state, and pincode updated correctly'
    );

    // ----------------------------------------------------
    // Test 14: Logo URL update persists
    // ----------------------------------------------------
    assert(
      p2.logo_url === 'https://alphasystems-intl.com/assets/logo-v2.png',
      'Test 14: Field persistence: logo_url updated correctly'
    );

    // ----------------------------------------------------
    // Test 15: Synchronization between company_profiles and companies tables
    // ----------------------------------------------------
    const [compRows] = await pool.execute(
      'SELECT id, company_name, contact_number FROM companies WHERE id = ?',
      [companyA.id]
    );
    const syncedComp = compRows[0] || {};

    assert(
      syncedComp.company_name === 'Alpha Systems International Ltd' &&
        syncedComp.contact_number === '+91 9988776655',
      'Test 15: Synchronization: base companies table updated in sync with company_profiles'
    );

    // ----------------------------------------------------
    // Test 16: Validation rejection on empty company name (400)
    // ----------------------------------------------------
    const invalidNameRes = await fetch(`${BASE_URL}/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        ...updatedPayload,
        company_name: '   ',
      }),
    });
    const invalidNameData = await invalidNameRes.json();

    assert(
      invalidNameRes.status === 400 && invalidNameData.errors?.company_name,
      'Test 16: Validation rejection: empty company name returns 400 with specific field error'
    );

    // ----------------------------------------------------
    // Test 17: Validation rejection on description < 10 chars (400)
    // ----------------------------------------------------
    const shortDescRes = await fetch(`${BASE_URL}/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        ...updatedPayload,
        description: 'Too short',
      }),
    });
    const shortDescData = await shortDescRes.json();

    assert(
      shortDescRes.status === 400 && shortDescData.errors?.description,
      'Test 17: Validation rejection: description < 10 characters returns 400 with specific field error'
    );

    // ----------------------------------------------------
    // Test 18: Validation rejection on invalid website URL (400)
    // ----------------------------------------------------
    const badUrlRes = await fetch(`${BASE_URL}/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        ...updatedPayload,
        website: 'not-a-valid-url-domain',
      }),
    });
    const badUrlData = await badUrlRes.json();

    assert(
      badUrlRes.status === 400 && badUrlData.errors?.website,
      'Test 18: Validation rejection: invalid website URL returns 400 with specific field error'
    );

    // ----------------------------------------------------
    // Test 19: Validation rejection on invalid official email format (400)
    // ----------------------------------------------------
    const badEmailRes = await fetch(`${BASE_URL}/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        ...updatedPayload,
        official_email: 'plainaddress-no-at-sign',
      }),
    });
    const badEmailData = await badEmailRes.json();

    assert(
      badEmailRes.status === 400 && badEmailData.errors?.official_email,
      'Test 19: Validation rejection: invalid official email returns 400 with specific field error'
    );

    // ----------------------------------------------------
    // Test 20: Validation rejection on invalid pincode format (400)
    // ----------------------------------------------------
    const badPincodeRes = await fetch(`${BASE_URL}/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        ...updatedPayload,
        pincode: '$$$###',
      }),
    });
    const badPincodeData = await badPincodeRes.json();

    assert(
      badPincodeRes.status === 400 && badPincodeData.errors?.pincode,
      'Test 20: Validation rejection: invalid pincode format returns 400 with specific field error'
    );

    // ----------------------------------------------------
    // Test 21: Authorization isolation: Company A cannot edit or view Company B's profile
    // ----------------------------------------------------
    // Company A attempts to pass Company B's ID in body to hijack Beta's profile
    const hijackRes = await fetch(`${BASE_URL}/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        ...updatedPayload,
        company_id: companyB.id,
        company_name: 'Hijacked by Alpha',
      }),
    });
    const hijackData = await hijackRes.json();

    // Verify Company B's profile was untouched
    const getResB = await fetch(`${BASE_URL}/profile`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    const getDataB = await getResB.json();

    const betaUntouched =
      getDataB.profile.company_name === 'Beta Global Tech' &&
      getDataB.profile.company_id === companyB.id;

    assert(
      betaUntouched && hijackData.profile?.company_id === companyA.id,
      'Test 21: Authorization enforcement: Company A cannot view or edit Company B profile (strict JWT company_id binding)'
    );

    // ----------------------------------------------------
    // Teardown / Cleanup
    // ----------------------------------------------------
    if (companyA?.id) {
      await pool.execute('DELETE FROM company_profiles WHERE company_id = ?', [companyA.id]);
      await pool.execute('DELETE FROM companies WHERE id = ?', [companyA.id]);
    }
    if (companyB?.id) {
      await pool.execute('DELETE FROM company_profiles WHERE company_id = ?', [companyB.id]);
      await pool.execute('DELETE FROM companies WHERE id = ?', [companyB.id]);
    }

  } catch (err) {
    console.error('Unexpected error in test runner:', err);
    assert(false, 'Integration test suite execution', err.message);
  } finally {
    console.log('\n====================================================');
    console.log(`📊 BAT-37 Test Results: ${passed} Passed, ${failed} Failed`);
    console.log('====================================================');

    await pool.end();
    process.exit(failed > 0 ? 1 : 0);
  }
}

const http = require('http');

const req = http.get('http://localhost:5000/api/health', (res) => {
  runBat37Tests();
});

req.on('error', () => {
  console.log('Starting in-process server on port 5000 for BAT-37 tests...');
  require('./server');
  setTimeout(() => {
    runBat37Tests();
  }, 1500);
});
