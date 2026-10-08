/**
 * BAT-39 Comprehensive Automated Integration Test Suite
 * Tests Company Job Postings Management List and Details Pages:
 *
 * 1. Authenticated company retrieves its jobs (GET /api/jobs/my-jobs)
 * 2. Empty state correctly handled (returns total: 0, jobs: [])
 * 3. Status filtering (status=Active, status=Draft, status=Closed)
 * 4. Search filtering (by title, location, description keyword)
 * 5. Authenticated company retrieves full job details (GET /api/jobs/:id)
 * 6. Required skills (BAT-36) returned with job details
 * 7. Eligibility criteria (BAT-36) returned with job details
 * 8. Company management endpoint alias (GET /api/jobs/my-jobs/:id)
 * 9. Security: Company A blocked from accessing Company B's job (403 Forbidden)
 * 10. Security: Company A blocked from deleting Company B's job (403 Forbidden)
 * 11. Security: Unauthenticated request rejected (401 Unauthorized)
 * 12. Error handling: Invalid job ID rejected (400 Bad Request)
 * 13. Error handling: Non-existent job ID rejected (404 Not Found)
 * 14. Scoped deletion: Authenticated company deletes its own job (DELETE /api/jobs/:id)
 * 15. Deleted job no longer appears in my-jobs list
 */

const http = require('http');
const { pool } = require('./config/database');

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000/api';

async function runBat39Tests() {
  console.log('====================================================');
  console.log('🧪 Starting BAT-39 Job Postings Management Tests');
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

  let jobA1 = null;
  let jobA2 = null;
  let jobA3 = null;
  let jobBeta = null;

  try {
    const rawPassword = 'Password123!';
    const emailA = `alpha_mgmt_${Date.now()}@domain.org`;
    const emailB = `beta_mgmt_${Date.now()}@domain.org`;

    // ----------------------------------------------------
    // Setup: Register & Login Company Alpha and Company Beta
    // ----------------------------------------------------
    const regResA = await fetch(`${BASE_URL}/companies/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        company_name: 'Alpha Solutions Corp',
        email: emailA,
        password: rawPassword,
        confirm_password: rawPassword,
        contact_number: '+91 9876543201',
      }),
    });
    const regDataA = await regResA.json();
    companyA = regDataA.company;

    const loginResA = await fetch(`${BASE_URL}/companies/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: emailA, password: rawPassword }),
    });
    const loginDataA = await loginResA.json();
    tokenA = loginDataA.token;

    const regResB = await fetch(`${BASE_URL}/companies/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        company_name: 'Beta Global Analytics',
        email: emailB,
        password: rawPassword,
        confirm_password: rawPassword,
        contact_number: '+91 9876543202',
      }),
    });
    const regDataB = await regResB.json();
    companyB = regDataB.company;

    const loginResB = await fetch(`${BASE_URL}/companies/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: emailB, password: rawPassword }),
    });
    const loginDataB = await loginResB.json();
    tokenB = loginDataB.token;

    console.log('--- 1. Empty State Testing ---');
    // ----------------------------------------------------
    // Test 1: Empty state for Company Alpha before posting
    // ----------------------------------------------------
    const emptyRes = await fetch(`${BASE_URL}/jobs/my-jobs`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const emptyData = await emptyRes.json();

    assert(
      emptyRes.status === 200 &&
        emptyData.success &&
        emptyData.total === 0 &&
        Array.isArray(emptyData.jobs) &&
        emptyData.jobs.length === 0,
      'Test 1: GET /api/jobs/my-jobs returns empty array (total: 0) for company without jobs'
    );

    console.log('\n--- 2. Job Creation Setup ---');
    // ----------------------------------------------------
    // Create Job 1 for Alpha (Active, Frontend, with Skills and Eligibility)
    // ----------------------------------------------------
    const createRes1 = await fetch(`${BASE_URL}/jobs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        job_title: 'Senior Frontend Engineer',
        description: 'Build high-performance web applications using modern React and TypeScript.',
        location: 'Bengaluru, Karnataka',
        employment_type: 'Full-time',
        salary_min: 1200000,
        salary_max: 1800000,
        application_deadline: '2026-12-31',
        status: 'Active',
        skills: ['React', 'TypeScript', 'CSS', 'Redux'],
        eligibility: {
          minimum_qualification: 'B.Tech / B.E.',
          minimum_cgpa: 7.5,
          minimum_percentage: 70,
          graduation_year: 2026,
          experience_required: 'Fresher',
          eligible_branches: 'CSE, IT, ECE',
          additional_requirements: 'Must have strong JavaScript fundamentals.',
        },
      }),
    });
    const createData1 = await createRes1.json();
    if (!createData1.success) console.error('Job 1 creation error:', createData1);
    jobA1 = createData1.job;

    // Create Job 2 for Alpha (Draft, Backend)
    const createRes2 = await fetch(`${BASE_URL}/jobs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        job_title: 'Junior Backend Developer',
        description: 'Develop RESTful microservices and database query optimization with Node.js.',
        location: 'Mysuru, Karnataka',
        employment_type: 'Full-time',
        salary_min: 600000,
        salary_max: 900000,
        application_deadline: '2026-11-30',
        status: 'Draft',
        skills: ['Node.js', 'Express', 'MySQL'],
        eligibility: {
          minimum_qualification: 'B.Tech',
          minimum_cgpa: 6.5,
          graduation_year: 2026,
        },
      }),
    });
    const createData2 = await createRes2.json();
    jobA2 = createData2.job;

    // Create Job 3 for Alpha (Closed, DevOps)
    const createRes3 = await fetch(`${BASE_URL}/jobs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        job_title: 'DevOps & Cloud Specialist',
        description: 'Deploy CI/CD pipelines and infrastructure as code using Docker and AWS.',
        location: 'Bengaluru, Karnataka',
        employment_type: 'Contract',
        salary_min: 800000,
        salary_max: 1400000,
        application_deadline: '2026-10-31',
        status: 'Closed',
        skills: ['Docker', 'AWS', 'Linux'],
      }),
    });
    const createData3 = await createRes3.json();
    jobA3 = createData3.job;

    // Create Job for Beta (Company B job for isolation testing)
    const createResB = await fetch(`${BASE_URL}/jobs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenB}`,
      },
      body: JSON.stringify({
        job_title: 'Data Science Researcher',
        description: 'Machine learning model development for Beta Analytics team.',
        location: 'Hyderabad, Telangana',
        employment_type: 'Full-time',
        application_deadline: '2026-12-15',
        status: 'Active',
        skills: ['Python', 'TensorFlow'],
      }),
    });
    const createDataB = await createResB.json();
    jobBeta = createDataB.job;

    assert(
      jobA1?.id && jobA2?.id && jobA3?.id && jobBeta?.id,
      'Test 2: Test job postings created across Company Alpha (3 jobs) and Beta (1 job)'
    );

    console.log('\n--- 3. Company Job List Retrieval & Scoping ---');
    // ----------------------------------------------------
    // Test 3: Authenticated company retrieves all of its jobs
    // ----------------------------------------------------
    const listResA = await fetch(`${BASE_URL}/jobs/my-jobs`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const listDataA = await listResA.json();

    const allBelongToA = listDataA.jobs?.every((j) => j.company_id === companyA.id);
    const betaNotPresent = !listDataA.jobs?.some((j) => j.id === jobBeta.id);

    assert(
      listResA.status === 200 &&
        listDataA.success &&
        listDataA.total === 3 &&
        allBelongToA &&
        betaNotPresent,
      'Test 3: GET /api/jobs/my-jobs returns only Company Alpha jobs (3 jobs, Beta excluded)'
    );

    // ----------------------------------------------------
    // Test 4: Company Beta retrieves only its own job
    // ----------------------------------------------------
    const listResB = await fetch(`${BASE_URL}/jobs/my-jobs`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    const listDataB = await listResB.json();

    assert(
      listResB.status === 200 &&
        listDataB.total === 1 &&
        listDataB.jobs[0]?.id === jobBeta.id,
      'Test 4: GET /api/jobs/my-jobs for Company Beta returns only Company Beta job'
    );

    console.log('\n--- 4. Status Filtering ---');
    // ----------------------------------------------------
    // Test 5: Status filter - Active
    // ----------------------------------------------------
    const activeRes = await fetch(`${BASE_URL}/jobs/my-jobs?status=Active`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const activeData = await activeRes.json();

    assert(
      activeRes.status === 200 &&
        activeData.total === 1 &&
        activeData.jobs[0]?.status === 'Active' &&
        activeData.jobs[0]?.job_title === 'Senior Frontend Engineer',
      'Test 5: Status filter "Active" returns only active job postings'
    );

    // ----------------------------------------------------
    // Test 6: Status filter - Draft
    // ----------------------------------------------------
    const draftRes = await fetch(`${BASE_URL}/jobs/my-jobs?status=Draft`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const draftData = await draftRes.json();

    assert(
      draftRes.status === 200 &&
        draftData.total === 1 &&
        draftData.jobs[0]?.status === 'Draft' &&
        draftData.jobs[0]?.job_title === 'Junior Backend Developer',
      'Test 6: Status filter "Draft" returns only draft job postings'
    );

    // ----------------------------------------------------
    // Test 7: Status filter - Closed
    // ----------------------------------------------------
    const closedRes = await fetch(`${BASE_URL}/jobs/my-jobs?status=Closed`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const closedData = await closedRes.json();

    assert(
      closedRes.status === 200 &&
        closedData.total === 1 &&
        closedData.jobs[0]?.status === 'Closed' &&
        closedData.jobs[0]?.job_title === 'DevOps & Cloud Specialist',
      'Test 7: Status filter "Closed" returns only closed job postings'
    );

    console.log('\n--- 5. Search Filtering ---');
    // ----------------------------------------------------
    // Test 8: Keyword search by title
    // ----------------------------------------------------
    const searchTitleRes = await fetch(`${BASE_URL}/jobs/my-jobs?search=Frontend`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const searchTitleData = await searchTitleRes.json();

    assert(
      searchTitleRes.status === 200 &&
        searchTitleData.total === 1 &&
        searchTitleData.jobs[0]?.job_title === 'Senior Frontend Engineer',
      'Test 8: Search by title keyword ("Frontend") matches correct job'
    );

    // ----------------------------------------------------
    // Test 9: Keyword search by location
    // ----------------------------------------------------
    const searchLocRes = await fetch(`${BASE_URL}/jobs/my-jobs?search=Mysuru`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const searchLocData = await searchLocRes.json();

    assert(
      searchLocRes.status === 200 &&
        searchLocData.total === 1 &&
        searchLocData.jobs[0]?.location.includes('Mysuru'),
      'Test 9: Search by location keyword ("Mysuru") matches correct job'
    );

    // ----------------------------------------------------
    // Test 10: Search with no matches
    // ----------------------------------------------------
    const searchNoneRes = await fetch(`${BASE_URL}/jobs/my-jobs?search=NonExistentSkillOrTitle`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const searchNoneData = await searchNoneRes.json();

    assert(
      searchNoneRes.status === 200 && searchNoneData.total === 0,
      'Test 10: Search with no matching terms returns empty list without error'
    );

    console.log('\n--- 6. Job Details Retrieval (BAT-39) ---');
    // ----------------------------------------------------
    // Test 11: Company retrieves full job details for its own job
    // ----------------------------------------------------
    const detailRes = await fetch(`${BASE_URL}/jobs/${jobA1.id}`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const detailData = await detailRes.json();
    const j = detailData.job || {};

    const hasAllFields =
      j.id === jobA1.id &&
      j.job_title === 'Senior Frontend Engineer' &&
      j.employment_type === 'Full-time' &&
      j.status === 'Active' &&
      parseFloat(j.salary_min) === 1200000 &&
      parseFloat(j.salary_max) === 1800000 &&
      j.application_deadline &&
      j.created_at &&
      j.updated_at;

    assert(
      detailRes.status === 200 && detailData.success && hasAllFields,
      'Test 11: GET /api/jobs/:id returns complete job overview details'
    );

    // ----------------------------------------------------
    // Test 12: Job details includes BAT-36 Required Skills
    // ----------------------------------------------------
    const skillsValid =
      Array.isArray(j.skills) &&
      j.skills.length === 4 &&
      j.skills.includes('React') &&
      j.skills.includes('TypeScript');

    assert(
      skillsValid,
      'Test 12: Job details response correctly embeds BAT-36 Required Skills array'
    );

    // ----------------------------------------------------
    // Test 13: Job details includes BAT-36 Eligibility Criteria
    // ----------------------------------------------------
    const el = j.eligibility || {};
    const eligValid =
      el.minimum_qualification === 'B.Tech / B.E.' &&
      parseFloat(el.minimum_cgpa) === 7.5 &&
      parseFloat(el.minimum_percentage) === 70 &&
      el.graduation_year === 2026 &&
      el.eligible_branches === 'CSE, IT, ECE';

    assert(
      eligValid,
      'Test 13: Job details response correctly embeds BAT-36 Eligibility Criteria'
    );

    // ----------------------------------------------------
    // Test 14: Dedicated company alias endpoint GET /api/jobs/my-jobs/:id
    // ----------------------------------------------------
    const aliasRes = await fetch(`${BASE_URL}/jobs/my-jobs/${jobA1.id}`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const aliasData = await aliasRes.json();

    assert(
      aliasRes.status === 200 && aliasData.job?.id === jobA1.id,
      'Test 14: GET /api/jobs/my-jobs/:id alias retrieves company job details correctly'
    );

    console.log('\n--- 7. Security & Ownership Authorization ---');
    // ----------------------------------------------------
    // Test 15: Cross-company access rejected: Company A cannot view Company B's job
    // ----------------------------------------------------
    const crossViewRes = await fetch(`${BASE_URL}/jobs/${jobBeta.id}`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const crossViewData = await crossViewRes.json();

    assert(
      crossViewRes.status === 403 && !crossViewData.success,
      'Test 15: Cross-company access rejected: Company A gets 403 Forbidden viewing Company B job'
    );

    // ----------------------------------------------------
    // Test 16: Cross-company delete rejected: Company A cannot delete Company B's job
    // ----------------------------------------------------
    const crossDeleteRes = await fetch(`${BASE_URL}/jobs/${jobBeta.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenA}` },
    });

    assert(
      crossDeleteRes.status === 403,
      'Test 16: Cross-company delete rejected: Company A gets 403 Forbidden deleting Company B job'
    );

    // ----------------------------------------------------
    // Test 17: Unauthenticated request to my-jobs rejected
    // ----------------------------------------------------
    const unauthListRes = await fetch(`${BASE_URL}/jobs/my-jobs`);

    assert(
      unauthListRes.status === 401,
      'Test 17: Unauthenticated access to /api/jobs/my-jobs returns 401 Unauthorized'
    );

    // ----------------------------------------------------
    // Test 18: Unauthenticated request to job details rejected
    // ----------------------------------------------------
    const unauthDetailRes = await fetch(`${BASE_URL}/jobs/${jobA1.id}`);

    assert(
      unauthDetailRes.status === 401,
      'Test 18: Unauthenticated access to /api/jobs/:id returns 401 Unauthorized'
    );

    // ----------------------------------------------------
    // Test 19: Invalid Job ID returns 400 Bad Request
    // ----------------------------------------------------
    const invalidIdRes = await fetch(`${BASE_URL}/jobs/not-a-number`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });

    assert(
      invalidIdRes.status === 400,
      'Test 19: Non-numeric job ID returns 400 Bad Request'
    );

    // ----------------------------------------------------
    // Test 20: Non-existent Job ID returns 404 Not Found
    // ----------------------------------------------------
    const missingIdRes = await fetch(`${BASE_URL}/jobs/999999`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });

    assert(
      missingIdRes.status === 404,
      'Test 20: Non-existent job ID returns 404 Not Found'
    );

    console.log('\n--- 8. Deletion & Persistence Testing ---');
    // ----------------------------------------------------
    // Test 21: Company Alpha deletes its own job (Job A3)
    // ----------------------------------------------------
    const deleteRes = await fetch(`${BASE_URL}/jobs/${jobA3.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const deleteData = await deleteRes.json();

    assert(
      deleteRes.status === 200 && deleteData.success,
      'Test 21: Authenticated company deletes its own job posting successfully (200 OK)'
    );

    // ----------------------------------------------------
    // Test 22: Deleted job no longer appears in my-jobs
    // ----------------------------------------------------
    const afterDeleteRes = await fetch(`${BASE_URL}/jobs/my-jobs`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const afterDeleteData = await afterDeleteRes.json();

    const jobA3Gone = !afterDeleteData.jobs?.some((j) => j.id === jobA3.id);

    assert(
      afterDeleteRes.status === 200 && afterDeleteData.total === 2 && jobA3Gone,
      'Test 22: Deleted job is removed from database and no longer returned in my-jobs list'
    );

    // ----------------------------------------------------
    // Teardown / Cleanup
    // ----------------------------------------------------
    if (companyA?.id) {
      await pool.execute('DELETE FROM job_postings WHERE company_id = ?', [companyA.id]);
      await pool.execute('DELETE FROM company_profiles WHERE company_id = ?', [companyA.id]);
      await pool.execute('DELETE FROM companies WHERE id = ?', [companyA.id]);
    }
    if (companyB?.id) {
      await pool.execute('DELETE FROM job_postings WHERE company_id = ?', [companyB.id]);
      await pool.execute('DELETE FROM company_profiles WHERE company_id = ?', [companyB.id]);
      await pool.execute('DELETE FROM companies WHERE id = ?', [companyB.id]);
    }

  } catch (err) {
    console.error('Unexpected error during BAT-39 test suite execution:', err);
    assert(false, 'BAT-39 test suite execution', err.message);
  } finally {
    console.log('\n====================================================');
    console.log(`📊 BAT-39 Test Results: ${passed} Passed, ${failed} Failed`);
    console.log('====================================================\n');

    await pool.end();
    process.exit(failed > 0 ? 1 : 0);
  }
}

// Auto-boot in-process server if not running
const req = http.get('http://localhost:5000/api/health', (res) => {
  runBat39Tests();
});

req.on('error', () => {
  console.log('Starting in-process server on port 5000 for BAT-39 tests...');
  require('./server');
  setTimeout(() => {
    runBat39Tests();
  }, 1500);
});
