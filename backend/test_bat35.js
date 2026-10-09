/**
 * BAT-35 Comprehensive Integration Test Suite
 * Tests Job Posting Create and Edit Workflows, Validations, and Ownership Verification
 */

const BASE_URL = 'http://localhost:5000/api';

async function runBat35Tests() {
  console.log('====================================================');
  console.log('🧪 Starting BAT-35 Job Create & Edit Integration Tests');
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

  // Set up two separate companies to verify ownership authorization
  let tokenCompanyA = '';
  let tokenCompanyB = '';
  let companyAId = null;
  let companyBId = null;

  try {
    // 1. Register & Login Company A
    const emailA = `compA_${Date.now()}@domain.org`;
    const regResA = await fetch(`${BASE_URL}/companies/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        company_name: 'Company Alpha Tech',
        email: emailA,
        password: 'Password123!',
        confirm_password: 'Password123!',
        contact_number: '+91 9876543211',
      }),
    });
    const regDataA = await regResA.json();
    companyAId = regDataA.company.id;

    const loginResA = await fetch(`${BASE_URL}/companies/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: emailA, password: 'Password123!' }),
    });
    const loginDataA = await loginResA.json();
    tokenCompanyA = loginDataA.token;

    // 2. Register & Login Company B (for cross-company authorization testing)
    const emailB = `compB_${Date.now()}@domain.org`;
    const regResB = await fetch(`${BASE_URL}/companies/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        company_name: 'Company Beta Systems',
        email: emailB,
        password: 'Password123!',
        confirm_password: 'Password123!',
        contact_number: '+91 9876543212',
      }),
    });
    const regDataB = await regResB.json();
    companyBId = regDataB.company.id;

    const loginResB = await fetch(`${BASE_URL}/companies/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: emailB, password: 'Password123!' }),
    });
    const loginDataB = await loginResB.json();
    tokenCompanyB = loginDataB.token;

    let createdJobId = null;

    // ----------------------------------------------------
    // Test 1: Authenticated company creates a valid job
    // ----------------------------------------------------
    try {
      const res = await fetch(`${BASE_URL}/jobs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenCompanyA}`,
        },
        body: JSON.stringify({
          job_title: 'Full Stack Web Developer',
          description: 'Build robust web applications using React, Node.js, and MySQL database.',
          location: 'Bengaluru, India (Hybrid)',
          employment_type: 'Full-time',
          salary_min: 600000,
          salary_max: 900000,
          application_deadline: '2026-12-31',
          status: 'Active',
        }),
      });
      const data = await res.json();
      createdJobId = data.job?.id;

      assert(
        res.status === 201 &&
          data.success &&
          data.job?.job_title === 'Full Stack Web Developer' &&
          data.job?.company_id === companyAId,
        'Test 1: Authenticated company creates a valid job (201 Created, assigned to authenticated company)'
      );
    } catch (err) {
      assert(false, 'Test 1', err.message);
    }

    // ----------------------------------------------------
    // Test 2: Unauthenticated user attempts to create a job
    // ----------------------------------------------------
    try {
      const res = await fetch(`${BASE_URL}/jobs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_title: 'Unauthorized Job',
          description: 'Should fail authentication check.',
          location: 'Remote',
          application_deadline: '2026-12-31',
        }),
      });
      const data = await res.json();
      assert(
        res.status === 401 && !data.success,
        'Test 2: Unauthenticated user attempts to create a job (401 Unauthorized)'
      );
    } catch (err) {
      assert(false, 'Test 2', err.message);
    }

    // ----------------------------------------------------
    // Test 3: Missing job title
    // ----------------------------------------------------
    try {
      const res = await fetch(`${BASE_URL}/jobs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenCompanyA}`,
        },
        body: JSON.stringify({
          job_title: '',
          description: 'Valid description with more than ten characters.',
          location: 'Remote',
          application_deadline: '2026-12-31',
        }),
      });
      const data = await res.json();
      assert(
        res.status === 400 && data.errors?.job_title,
        'Test 3: Missing job title rejected (400 Bad Request)'
      );
    } catch (err) {
      assert(false, 'Test 3', err.message);
    }

    // ----------------------------------------------------
    // Test 4: Missing description
    // ----------------------------------------------------
    try {
      const res = await fetch(`${BASE_URL}/jobs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenCompanyA}`,
        },
        body: JSON.stringify({
          job_title: 'Junior Developer',
          description: '',
          location: 'Remote',
          application_deadline: '2026-12-31',
        }),
      });
      const data = await res.json();
      assert(
        res.status === 400 && data.errors?.description,
        'Test 4: Missing description rejected (400 Bad Request)'
      );
    } catch (err) {
      assert(false, 'Test 4', err.message);
    }

    // ----------------------------------------------------
    // Test 5: Invalid salary (negative salary)
    // ----------------------------------------------------
    try {
      const res = await fetch(`${BASE_URL}/jobs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenCompanyA}`,
        },
        body: JSON.stringify({
          job_title: 'Backend Engineer',
          description: 'Develop high throughput backend services.',
          location: 'Remote',
          salary_min: -5000,
          application_deadline: '2026-12-31',
        }),
      });
      const data = await res.json();
      assert(
        res.status === 400 && data.errors?.salary_min,
        'Test 5: Invalid negative salary rejected (400 Bad Request)'
      );
    } catch (err) {
      assert(false, 'Test 5', err.message);
    }

    // ----------------------------------------------------
    // Test 6: Salary maximum lower than salary minimum
    // ----------------------------------------------------
    try {
      const res = await fetch(`${BASE_URL}/jobs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenCompanyA}`,
        },
        body: JSON.stringify({
          job_title: 'Data Analyst',
          description: 'Analyze student placement statistics and trends.',
          location: 'Remote',
          salary_min: 800000,
          salary_max: 500000, // Invalid: max < min
          application_deadline: '2026-12-31',
        }),
      });
      const data = await res.json();
      assert(
        res.status === 400 && data.errors?.salary_max === 'Maximum salary cannot be lower than minimum salary.',
        'Test 6: Salary maximum lower than salary minimum rejected (400 Bad Request)'
      );
    } catch (err) {
      assert(false, 'Test 6', err.message);
    }

    // ----------------------------------------------------
    // Test 7: Invalid application deadline
    // ----------------------------------------------------
    try {
      const res = await fetch(`${BASE_URL}/jobs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenCompanyA}`,
        },
        body: JSON.stringify({
          job_title: 'DevOps Specialist',
          description: 'Manage automated deployments and testing.',
          location: 'Remote',
          application_deadline: 'not-a-valid-date',
        }),
      });
      const data = await res.json();
      assert(
        res.status === 400 && data.errors?.application_deadline,
        'Test 7: Invalid application deadline rejected (400 Bad Request)'
      );
    } catch (err) {
      assert(false, 'Test 7', err.message);
    }

    // ----------------------------------------------------
    // Test 8: Invalid status
    // ----------------------------------------------------
    try {
      const res = await fetch(`${BASE_URL}/jobs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenCompanyA}`,
        },
        body: JSON.stringify({
          job_title: 'QA Automation Engineer',
          description: 'Automate testing pipelines and load test suites.',
          location: 'Remote',
          application_deadline: '2026-12-31',
          status: 'UnsupportedStatus',
        }),
      });
      const data = await res.json();
      assert(
        res.status === 400 && data.errors?.status,
        'Test 8: Invalid status value rejected (400 Bad Request)'
      );
    } catch (err) {
      assert(false, 'Test 8', err.message);
    }

    // ----------------------------------------------------
    // Test 9: Company edits its own job successfully
    // ----------------------------------------------------
    try {
      const res = await fetch(`${BASE_URL}/jobs/${createdJobId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenCompanyA}`,
        },
        body: JSON.stringify({
          job_title: 'Lead Full Stack Web Developer',
          status: 'Active',
        }),
      });
      const data = await res.json();
      assert(
        res.status === 200 && data.success && data.job?.job_title === 'Lead Full Stack Web Developer',
        'Test 9: Company edits its own job successfully (200 OK)'
      );
    } catch (err) {
      assert(false, 'Test 9', err.message);
    }

    // ----------------------------------------------------
    // Test 10: Company edits job title
    // ----------------------------------------------------
    try {
      const res = await fetch(`${BASE_URL}/jobs/${createdJobId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenCompanyA}`,
        },
        body: JSON.stringify({
          job_title: 'Principal Software Engineer',
        }),
      });
      const data = await res.json();
      assert(
        res.status === 200 && data.job?.job_title === 'Principal Software Engineer',
        'Test 10: Company edits job title successfully'
      );
    } catch (err) {
      assert(false, 'Test 10', err.message);
    }

    // ----------------------------------------------------
    // Test 11: Company edits description
    // ----------------------------------------------------
    try {
      const updatedDesc = 'Updated description: Lead architectural design and mentor junior campus recruits.';
      const res = await fetch(`${BASE_URL}/jobs/${createdJobId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenCompanyA}`,
        },
        body: JSON.stringify({
          description: updatedDesc,
        }),
      });
      const data = await res.json();
      assert(
        res.status === 200 && data.job?.description === updatedDesc,
        'Test 11: Company edits job description successfully'
      );
    } catch (err) {
      assert(false, 'Test 11', err.message);
    }

    // ----------------------------------------------------
    // Test 12: Company edits salary
    // ----------------------------------------------------
    try {
      const res = await fetch(`${BASE_URL}/jobs/${createdJobId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenCompanyA}`,
        },
        body: JSON.stringify({
          salary_min: 800000,
          salary_max: 1250000,
        }),
      });
      const data = await res.json();
      assert(
        res.status === 200 &&
          parseFloat(data.job?.salary_min) === 800000 &&
          parseFloat(data.job?.salary_max) === 1250000,
        'Test 12: Company edits salary range successfully'
      );
    } catch (err) {
      assert(false, 'Test 12', err.message);
    }

    // ----------------------------------------------------
    // Test 13: Company edits deadline
    // ----------------------------------------------------
    try {
      const res = await fetch(`${BASE_URL}/jobs/${createdJobId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenCompanyA}`,
        },
        body: JSON.stringify({
          application_deadline: '2027-01-15',
        }),
      });
      const data = await res.json();
      assert(
        res.status === 200 && data.job?.application_deadline?.startsWith('2027-01-15'),
        'Test 13: Company edits application deadline successfully'
      );
    } catch (err) {
      assert(false, 'Test 13', err.message);
    }

    // ----------------------------------------------------
    // Test 14: Company attempts to edit another company's job
    // (Company B tries to edit Company A's job)
    // ----------------------------------------------------
    try {
      const res = await fetch(`${BASE_URL}/jobs/${createdJobId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenCompanyB}`, // Authenticated as Company B
        },
        body: JSON.stringify({
          job_title: 'Malicious Hijack Attempt',
        }),
      });
      const data = await res.json();
      assert(
        res.status === 403 && !data.success,
        'Test 14: Cross-company edit attempt rejected (403 Forbidden / Ownership Enforced)'
      );
    } catch (err) {
      assert(false, 'Test 14', err.message);
    }

    // ----------------------------------------------------
    // Test 15: Nonexistent job ID
    // ----------------------------------------------------
    try {
      const res = await fetch(`${BASE_URL}/jobs/999999`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenCompanyA}`,
        },
        body: JSON.stringify({
          job_title: 'Nonexistent Job Update',
        }),
      });
      const data = await res.json();
      assert(
        res.status === 404 && !data.success,
        'Test 15: Nonexistent job ID update rejected (404 Not Found)'
      );
    } catch (err) {
      assert(false, 'Test 15', err.message);
    }

    // ----------------------------------------------------
    // Test 16: Unauthenticated edit attempt
    // ----------------------------------------------------
    try {
      const res = await fetch(`${BASE_URL}/jobs/${createdJobId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          // No Authorization header provided
        },
        body: JSON.stringify({
          job_title: 'Unauthenticated Edit',
        }),
      });
      const data = await res.json();
      assert(
        res.status === 401 && !data.success,
        'Test 16: Unauthenticated edit attempt rejected (401 Unauthorized)'
      );
    } catch (err) {
      assert(false, 'Test 16', err.message);
    }

    console.log('\n====================================================');
    console.log(`BAT-35 Integration Test Results: ${passed} Passed, ${failed} Failed`);
    console.log('====================================================\n');

    if (failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (err) {
    console.error('Unexpected test error in BAT-35 suite:', err);
    process.exit(1);
  }
}

const http = require('http');

const req = http.get('http://localhost:5000/api/health', (res) => {
  runBat35Tests();
});

req.on('error', () => {
  console.log('Starting in-process server on port 5000 for BAT-35 tests...');
  require('./server');
  setTimeout(() => {
    runBat35Tests();
  }, 1500);
});
