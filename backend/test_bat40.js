/**
 * BAT-40 Automated Comprehensive Test Suite
 * "Write tests for company profile and job management workflows"
 *
 * Covers:
 * 1. Company Profile Workflow:
 *    - View Profile: authenticated access, correct fields, passwords never exposed, unauthenticated rejected (401)
 *    - Edit Profile: persistence of updates, input validation enforcement (BAT-38), invalid payload rejection, unchanged state on bad update
 *    - Profile Authorization: Company A cannot view or edit Company B profile (strict JWT scoping)
 *
 * 2. Job Creation Workflow:
 *    - Job Creation: authenticated company creates valid job, correct association with company, persistence of skills & eligibility (BAT-36)
 *    - Authentication check: unauthenticated user cannot create job (401)
 *    - Ownership check: cannot inject arbitrary company_id (derived strictly from token)
 *    - Job Validation: missing title, short description, invalid salary, deadline in past, invalid enum, duplicate skills, invalid eligibility
 *
 * 3. Job Edit Workflow:
 *    - Successful edit: authenticated owner edits job fields, updates skills, updates eligibility
 *    - Ownership enforcement: Company B cannot edit Company A's job (403 Forbidden)
 *    - Invalid edit rejection: BAT-38 validation on update
 *
 * 4. Company Job List Workflow:
 *    - List jobs: authenticated company retrieves only its jobs
 *    - Empty state: zero postings returned cleanly
 *    - Multiple jobs: correctly lists all owned jobs, excludes other companies' postings
 *    - Search and status filters: status filter & keyword search
 *    - Authorization: unauthenticated rejected (401)
 *
 * 5. Job Details Workflow:
 *    - Retrieval: returns full job info, required skills array, eligibility criteria object
 *    - Authorization: Company A cannot view Company B's job (403 Forbidden), unauthenticated rejected (401)
 *    - Non-existent & invalid ID handling: 404 for missing job, 400 for malformed ID
 *
 * 6. End-to-End Workflow:
 *    - Complete flow: Register -> Update Profile -> Create Job with Skills & Eligibility ->
 *      List in My Jobs -> View Details -> Edit Job -> Confirm changes -> Verify cross-company isolation -> Cleanup
 */

const http = require('http');
const { pool } = require('./config/database');

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000/api';

async function runBat40Tests() {
  console.log('================================================================');
  console.log('🧪 Starting BAT-40 Company Profile & Job Management Workflow Tests');
  console.log('================================================================\n');

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

  const cleanupCompanyIds = [];

  try {
    const rawPassword = 'Password123!';
    const emailA = `bat40_corpA_${Date.now()}@testdomain.org`;
    const emailB = `bat40_corpB_${Date.now()}@testdomain.org`;

    // -------------------------------------------------------------------------
    // Setup: Register & Login Company A and Company B
    // -------------------------------------------------------------------------
    const regResA = await fetch(`${BASE_URL}/companies/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        company_name: 'Alpha Systems BAT40',
        email: emailA,
        password: rawPassword,
        confirm_password: rawPassword,
        contact_number: '+91 9876543210',
      }),
    });
    const regDataA = await regResA.json();
    companyA = regDataA.company;
    if (companyA?.id) cleanupCompanyIds.push(companyA.id);

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
        company_name: 'Beta Global BAT40',
        email: emailB,
        password: rawPassword,
        confirm_password: rawPassword,
        contact_number: '+91 9876543211',
      }),
    });
    const regDataB = await regResB.json();
    companyB = regDataB.company;
    if (companyB?.id) cleanupCompanyIds.push(companyB.id);

    const loginResB = await fetch(`${BASE_URL}/companies/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: emailB, password: rawPassword }),
    });
    const loginDataB = await loginResB.json();
    tokenB = loginDataB.token;

    assert(
      tokenA && tokenB && companyA?.id && companyB?.id,
      'Setup: Registered and authenticated Company A and Company B'
    );

    // =========================================================================
    // SECTION 1: Company Profile Workflow Tests (BAT-37, BAT-38)
    // =========================================================================
    console.log('\n--- 1. Company Profile Workflow Tests ---');

    // 1.1 Create Initial Profile for Company A
    const profilePayloadA = {
      company_name: 'Alpha Systems Technologies',
      description: 'Pioneering next-generation enterprise distributed systems.',
      industry: 'Information Technology',
      website: 'https://alphasystems.org',
      official_email: emailA,
      contact_number: '+91 9876543210',
      address: 'Plot 42, Electronic City Phase 1',
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '560100',
      logo_url: 'https://alphasystems.org/logo.png',
    };

    const createProfResA = await fetch(`${BASE_URL}/companies/profile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify(profilePayloadA),
    });
    const createProfDataA = await createProfResA.json();

    assert(
      createProfResA.status === 201 || createProfResA.status === 200,
      'Profile: Company A creates initial company profile successfully'
    );

    // 1.2 View Profile: Authenticated company retrieves its own profile
    const viewProfResA = await fetch(`${BASE_URL}/companies/profile`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const viewProfDataA = await viewProfResA.json();
    const pA = viewProfDataA.profile || {};

    assert(
      viewProfResA.status === 200 &&
        viewProfDataA.success &&
        pA.company_name === 'Alpha Systems Technologies' &&
        pA.industry === 'Information Technology' &&
        pA.website === 'https://alphasystems.org' &&
        pA.city === 'Bangalore',
      'Profile: Authenticated company retrieves profile with all expected fields'
    );

    // 1.3 Security: Sensitive fields (password, password_hash) are never returned
    const noPasswordLeak =
      !viewProfDataA.company?.password &&
      !viewProfDataA.company?.password_hash &&
      !pA.password &&
      !pA.password_hash;

    assert(
      noPasswordLeak,
      'Profile Security: Passwords and password_hash are strictly excluded from response'
    );

    // 1.4 Unauthenticated profile view rejected (401)
    const unauthProfRes = await fetch(`${BASE_URL}/companies/profile`);
    assert(
      unauthProfRes.status === 401,
      'Profile Security: Unauthenticated request to GET /api/companies/profile rejected (401)'
    );

    // 1.5 Edit Profile: Company A updates its profile with valid values
    const updatedProfilePayloadA = {
      ...profilePayloadA,
      company_name: 'Alpha Systems Global Labs',
      description: 'Expanded multinational operations with advanced AI platform solutions.',
      contact_number: '+91 9988776655',
      website: 'https://alpha-global-labs.com',
      city: 'Mysuru',
      pincode: '570018',
    };

    const updateProfRes = await fetch(`${BASE_URL}/companies/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify(updatedProfilePayloadA),
    });
    const updateProfData = await updateProfRes.json();

    assert(
      updateProfRes.status === 200 &&
        updateProfData.success &&
        updateProfData.profile?.company_name === 'Alpha Systems Global Labs',
      'Profile Edit: Authenticated company updates profile successfully (200)'
    );

    // 1.6 Verify persistence of edited profile
    const refetchProfRes = await fetch(`${BASE_URL}/companies/profile`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const refetchProfData = await refetchProfRes.json();
    const persistedProf = refetchProfData.profile || {};

    assert(
      persistedProf.company_name === 'Alpha Systems Global Labs' &&
        persistedProf.contact_number === '+91 9988776655' &&
        persistedProf.city === 'Mysuru' &&
        persistedProf.pincode === '570018',
      'Profile Persistence: Updated profile values retrieved successfully on fresh GET'
    );

    // 1.7 Validation Rejection: Invalid company name, short description, invalid URL
    const invalidProfileRes = await fetch(`${BASE_URL}/companies/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        ...updatedProfilePayloadA,
        company_name: ' ', // Empty
        description: 'Short', // < 10 chars
        website: 'invalid-url', // Bad URL
        official_email: 'not-an-email', // Bad email
        pincode: '$$$###', // Bad pincode
      }),
    });
    const invalidProfileData = await invalidProfileRes.json();

    assert(
      invalidProfileRes.status === 400 &&
        invalidProfileData.errors?.company_name &&
        invalidProfileData.errors?.description &&
        invalidProfileData.errors?.website &&
        invalidProfileData.errors?.official_email &&
        invalidProfileData.errors?.pincode,
      'Profile Validation: Multiple invalid profile fields rejected with specific field errors (400)'
    );

    // 1.8 Unchanged state when invalid update is rejected
    const checkUnchangedProf = await fetch(`${BASE_URL}/companies/profile`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const unchangedProfData = await checkUnchangedProf.json();

    assert(
      unchangedProfData.profile?.company_name === 'Alpha Systems Global Labs',
      'Profile Integrity: Existing profile remains unchanged when invalid update is rejected'
    );

    // 1.9 Profile Isolation: Company A cannot modify Company B's profile
    // (Profile endpoints are strictly bound to JWT req.company.id)
    const crossProfileRes = await fetch(`${BASE_URL}/companies/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        ...updatedProfilePayloadA,
        company_id: companyB.id,
        company_name: 'Hijacked Company Name',
      }),
    });
    const crossProfileData = await crossProfileRes.json();

    // Verify Company B profile was not touched
    const [compBProfiles] = await pool.execute(
      'SELECT company_name FROM company_profiles WHERE company_id = ?',
      [companyB.id]
    );

    assert(
      crossProfileData.profile?.company_id === companyA.id &&
        (!compBProfiles[0] || compBProfiles[0].company_name !== 'Hijacked Company Name'),
      'Profile Security: Client-supplied company_id cannot bypass JWT scoping to affect Company B'
    );

    // =========================================================================
    // SECTION 2: Job Creation Workflow Tests (BAT-35, BAT-36, BAT-38)
    // =========================================================================
    console.log('\n--- 2. Job Creation Workflow Tests ---');

    let createdJobA1 = null;
    let createdJobA2 = null;
    let createdJobBeta = null;

    // 2.1 Successful job creation with skills & eligibility
    const validJobPayload = {
      job_title: 'Full Stack Cloud Engineer',
      description: 'Develop distributed web services, frontend interfaces, and database schemas.',
      location: 'Bengaluru, India',
      employment_type: 'Full-time',
      salary_min: 1000000,
      salary_max: 1600000,
      application_deadline: '2026-12-31',
      status: 'Active',
      skills: ['React', 'Node.js', 'MySQL', 'Docker'],
      eligibility: {
        minimum_qualification: 'B.Tech / B.E.',
        minimum_cgpa: 7.0,
        minimum_percentage: 65.0,
        graduation_year: 2026,
        experience_required: 'Fresher',
        eligible_branches: 'CSE, IT, ECE',
        additional_requirements: 'Must have working knowledge of Git and relational databases.',
      },
    };

    const createJobResA = await fetch(`${BASE_URL}/jobs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify(validJobPayload),
    });
    const createJobDataA = await createJobResA.json();
    createdJobA1 = createJobDataA.job;

    assert(
      createJobResA.status === 201 &&
        createJobDataA.success &&
        createdJobA1?.id > 0 &&
        createdJobA1?.company_id === companyA.id &&
        createdJobA1?.skills?.length === 4 &&
        parseFloat(createdJobA1?.eligibility?.minimum_cgpa) === 7.0,
      'Job Creation: Valid job created with associated company_id, skills, and eligibility (201)'
    );

    // 2.2 Create second job for Company A (Draft status, for list & filter tests)
    const createJobResA2 = await fetch(`${BASE_URL}/jobs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        job_title: 'Junior QA Automation Engineer',
        description: 'Design and execute automated integration and performance test suites.',
        location: 'Mysuru, India',
        employment_type: 'Full-time',
        salary_min: 500000,
        salary_max: 800000,
        application_deadline: '2026-11-30',
        status: 'Draft',
        skills: ['Selenium', 'JavaScript', 'Jest'],
      }),
    });
    const createJobDataA2 = await createJobResA2.json();
    createdJobA2 = createJobDataA2.job;

    // 2.3 Create job for Company B (to test isolation)
    const createJobResB = await fetch(`${BASE_URL}/jobs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenB}`,
      },
      body: JSON.stringify({
        job_title: 'Beta AI Research Scientist',
        description: 'Conduct machine learning model optimization and data pipeline design.',
        location: 'Hyderabad, India',
        employment_type: 'Full-time',
        application_deadline: '2026-12-15',
        status: 'Active',
        skills: ['Python', 'PyTorch'],
      }),
    });
    const createJobDataB = await createJobResB.json();
    createdJobBeta = createJobDataB.job;

    assert(
      createdJobA2?.id > 0 && createdJobBeta?.id > 0,
      'Job Creation: Secondary test jobs created for multi-company workflow verification'
    );

    // 2.4 Authentication: Unauthenticated user cannot create job (401)
    const unauthCreateJobRes = await fetch(`${BASE_URL}/jobs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validJobPayload),
    });
    assert(
      unauthCreateJobRes.status === 401,
      'Job Creation Security: Unauthenticated POST /api/jobs rejected (401)'
    );

    // 2.5 Ownership: Cannot inject arbitrary company_id to create job for another company
    const spoofJobRes = await fetch(`${BASE_URL}/jobs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        ...validJobPayload,
        company_id: companyB.id,
        job_title: 'Spoofed Job Posting Attempt',
      }),
    });
    const spoofJobData = await spoofJobRes.json();

    assert(
      spoofJobData.job?.company_id === companyA.id &&
        spoofJobData.job?.company_id !== companyB.id,
      'Job Creation Security: Ownership derived strictly from token; submitted company_id ignored'
    );

    // Clean up spoofed job
    if (spoofJobData.job?.id) {
      await pool.execute('DELETE FROM job_postings WHERE id = ?', [spoofJobData.job.id]);
    }

    // 2.6 Validation: Invalid job creation fields rejected (BAT-38)
    const testCasesBadJob = [
      {
        field: 'job_title',
        payload: { ...validJobPayload, job_title: ' ' },
        desc: 'Missing/blank job title rejected',
      },
      {
        field: 'description',
        payload: { ...validJobPayload, description: 'Short' },
        desc: 'Job description < 10 characters rejected',
      },
      {
        field: 'location',
        payload: { ...validJobPayload, location: ' ' },
        desc: 'Missing location rejected',
      },
      {
        field: 'salary_max',
        payload: { ...validJobPayload, salary_min: 800000, salary_max: 500000 },
        desc: 'salary_max < salary_min rejected',
      },
      {
        field: 'application_deadline',
        payload: { ...validJobPayload, application_deadline: '2020-01-01' },
        desc: 'Past application deadline rejected for new postings',
      },
      {
        field: 'status',
        payload: { ...validJobPayload, status: 'InvalidStatus' },
        desc: 'Invalid status enum rejected',
      },
      {
        field: 'skills',
        payload: { ...validJobPayload, skills: ['React', 'react'] },
        desc: 'Case-insensitive duplicate skills rejected',
      },
      {
        field: 'minimum_cgpa',
        payload: {
          ...validJobPayload,
          eligibility: { ...validJobPayload.eligibility, minimum_cgpa: 11.5 },
        },
        desc: 'CGPA > 10.0 rejected',
      },
    ];

    for (const tc of testCasesBadJob) {
      const res = await fetch(`${BASE_URL}/jobs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenA}`,
        },
        body: JSON.stringify(tc.payload),
      });
      const data = await res.json();
      assert(
        res.status === 400 && data.errors && Object.keys(data.errors).length > 0,
        `Job Creation Validation: ${tc.desc} (400)`
      );
    }

    // =========================================================================
    // SECTION 3: Job Edit Workflow Tests (BAT-35, BAT-36, BAT-38)
    // =========================================================================
    console.log('\n--- 3. Job Edit Workflow Tests ---');

    // 3.1 Authenticated owner edits its own job successfully
    const editPayload = {
      job_title: 'Senior Staff Cloud Architect',
      description: 'Lead high-scale architectural design, microservices, and Kubernetes clusters.',
      salary_min: 1500000,
      salary_max: 2200000,
      status: 'Active',
      skills: ['React', 'Node.js', 'Kubernetes', 'AWS', 'Docker'],
      eligibility: {
        minimum_qualification: 'M.Tech / B.Tech',
        minimum_cgpa: 8.0,
        graduation_year: 2026,
        experience_required: 'Fresher',
        eligible_branches: 'CSE, IT',
      },
    };

    const editRes = await fetch(`${BASE_URL}/jobs/${createdJobA1.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify(editPayload),
    });
    const editData = await editRes.json();

    assert(
      editRes.status === 200 &&
        editData.success &&
        editData.job?.job_title === 'Senior Staff Cloud Architect' &&
        editData.job?.skills?.includes('Kubernetes') &&
        parseFloat(editData.job?.eligibility?.minimum_cgpa) === 8.0,
      'Job Edit: Authenticated owner updates job title, skills, and eligibility successfully (200)'
    );

    // 3.2 Authorization: Company B cannot edit Company A's job (403 Forbidden)
    const crossEditRes = await fetch(`${BASE_URL}/jobs/${createdJobA1.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenB}`,
      },
      body: JSON.stringify({ job_title: 'Hijacked Job Title By Beta' }),
    });
    const crossEditData = await crossEditRes.json();

    assert(
      crossEditRes.status === 403 && !crossEditData.success,
      'Job Edit Security: Company B receives 403 Forbidden attempting to edit Company A job'
    );

    // 3.3 Verify job remained unchanged after rejected cross-company edit
    const [checkJobRows] = await pool.execute('SELECT job_title FROM job_postings WHERE id = ?', [
      createdJobA1.id,
    ]);
    assert(
      checkJobRows[0]?.job_title === 'Senior Staff Cloud Architect',
      'Job Edit Integrity: Job remains unchanged after unauthorized edit attempt'
    );

    // 3.4 Invalid job edit rejected (BAT-38)
    const badEditRes = await fetch(`${BASE_URL}/jobs/${createdJobA1.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        salary_min: 2500000,
        salary_max: 1000000, // Invalid: max < min
      }),
    });
    const badEditData = await badEditRes.json();

    assert(
      badEditRes.status === 400 && badEditData.errors?.salary_max,
      'Job Edit Validation: Updating with salary_max < salary_min rejected (400)'
    );

    // =========================================================================
    // SECTION 4: Company Job List Workflow Tests (BAT-39)
    // =========================================================================
    console.log('\n--- 4. Company Job List Workflow Tests ---');

    // 4.1 Authenticated company retrieves all of its postings
    const listResA = await fetch(`${BASE_URL}/jobs/my-jobs`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const listDataA = await listResA.json();

    const jobsA = listDataA.jobs || [];
    const allOwnedByA = jobsA.every((j) => j.company_id === companyA.id);
    const betaExcluded = !jobsA.some((j) => j.id === createdJobBeta.id);

    assert(
      listResA.status === 200 &&
        listDataA.success &&
        jobsA.length === 2 &&
        allOwnedByA &&
        betaExcluded,
      'Job List: GET /api/jobs/my-jobs returns only jobs belonging to Company A (excludes Beta)'
    );

    // 4.2 Company Beta retrieves only its own postings
    const listResB = await fetch(`${BASE_URL}/jobs/my-jobs`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    const listDataB = await listResB.json();

    assert(
      listResB.status === 200 &&
        listDataB.jobs?.length === 1 &&
        listDataB.jobs[0]?.id === createdJobBeta.id,
      'Job List: GET /api/jobs/my-jobs for Company Beta returns only Company Beta job'
    );

    // 4.3 Status Filter: Active vs Draft
    const filterActiveRes = await fetch(`${BASE_URL}/jobs/my-jobs?status=Active`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const filterActiveData = await filterActiveRes.json();

    const filterDraftRes = await fetch(`${BASE_URL}/jobs/my-jobs?status=Draft`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const filterDraftData = await filterDraftRes.json();

    assert(
      filterActiveData.jobs?.length === 1 &&
        filterActiveData.jobs[0]?.status === 'Active' &&
        filterDraftData.jobs?.length === 1 &&
        filterDraftData.jobs[0]?.status === 'Draft',
      'Job List Filtering: Filter by status (Active / Draft) returns correct matching subset'
    );

    // 4.4 Search Filter: By title keyword and location keyword
    const searchRes = await fetch(`${BASE_URL}/jobs/my-jobs?search=Architect`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const searchData = await searchRes.json();

    const searchLocRes = await fetch(`${BASE_URL}/jobs/my-jobs?search=Mysuru`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const searchLocData = await searchLocRes.json();

    assert(
      searchData.jobs?.length === 1 &&
        searchData.jobs[0]?.job_title.includes('Architect') &&
        searchLocData.jobs?.length === 1 &&
        searchLocData.jobs[0]?.location.includes('Mysuru'),
      'Job List Search: Keyword search by title ("Architect") and location ("Mysuru") matches accurately'
    );

    // 4.5 Unauthenticated list request rejected (401)
    const unauthListRes = await fetch(`${BASE_URL}/jobs/my-jobs`);
    assert(
      unauthListRes.status === 401,
      'Job List Security: Unauthenticated GET /api/jobs/my-jobs rejected (401)'
    );

    // =========================================================================
    // SECTION 5: Job Details Workflow Tests (BAT-39)
    // =========================================================================
    console.log('\n--- 5. Job Details Workflow Tests ---');

    // 5.1 Authenticated owner retrieves full job details
    const detailsRes = await fetch(`${BASE_URL}/jobs/${createdJobA1.id}`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const detailsData = await detailsRes.json();
    const jd = detailsData.job || {};

    assert(
      detailsRes.status === 200 &&
        detailsData.success &&
        jd.id === createdJobA1.id &&
        jd.job_title === 'Senior Staff Cloud Architect' &&
        jd.company_name &&
        jd.application_deadline &&
        jd.created_at &&
        jd.updated_at,
      'Job Details: GET /api/jobs/:id returns complete job overview and metadata'
    );

    // 5.2 Required Skills array is embedded in details response
    assert(
      Array.isArray(jd.skills) &&
        jd.skills.includes('Kubernetes') &&
        jd.skills.includes('Docker') &&
        jd.skills.includes('AWS'),
      'Job Details Skills: Embedded BAT-36 Required Skills array present and accurate'
    );

    // 5.3 Eligibility Criteria object is embedded in details response
    assert(
      jd.eligibility &&
        jd.eligibility.minimum_qualification === 'M.Tech / B.Tech' &&
        parseFloat(jd.eligibility.minimum_cgpa) === 8.0 &&
        jd.eligibility.eligible_branches === 'CSE, IT',
      'Job Details Eligibility: Embedded BAT-36 Eligibility Criteria object present and accurate'
    );

    // 5.4 Alias endpoint GET /api/jobs/my-jobs/:id returns identical details
    const aliasDetailsRes = await fetch(`${BASE_URL}/jobs/my-jobs/${createdJobA1.id}`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const aliasDetailsData = await aliasDetailsRes.json();

    assert(
      aliasDetailsRes.status === 200 &&
        aliasDetailsData.job?.id === createdJobA1.id,
      'Job Details Alias: GET /api/jobs/my-jobs/:id returns complete details for owner'
    );

    // 5.5 Security: Company A cannot view Company B's job details (403 Forbidden)
    const crossDetailsRes = await fetch(`${BASE_URL}/jobs/${createdJobBeta.id}`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const crossDetailsData = await crossDetailsRes.json();

    assert(
      crossDetailsRes.status === 403 && !crossDetailsData.success,
      'Job Details Security: Company A gets 403 Forbidden attempting to view Company B job details'
    );

    // 5.6 Unauthenticated details request rejected (401)
    const unauthDetailsRes = await fetch(`${BASE_URL}/jobs/${createdJobA1.id}`);
    assert(
      unauthDetailsRes.status === 401,
      'Job Details Security: Unauthenticated request to /api/jobs/:id rejected (401)'
    );

    // 5.7 Non-numeric ID returns 400 Bad Request
    const badIdRes = await fetch(`${BASE_URL}/jobs/invalid-id-string`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(badIdRes.status === 400, 'Job Details Error: Non-numeric job ID returns 400 Bad Request');

    // 5.8 Non-existent job ID returns 404 Not Found
    const notFoundRes = await fetch(`${BASE_URL}/jobs/999999`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(notFoundRes.status === 404, 'Job Details Error: Non-existent job ID returns 404 Not Found');

    // =========================================================================
    // SECTION 6: End-to-End Complete Workflow Test
    // =========================================================================
    console.log('\n--- 6. End-to-End Complete Lifecycle Test ---');

    // 6.1 Register a new Company E2E
    const e2eEmail = `e2e_company_${Date.now()}@lifecycle.org`;
    const e2eRegRes = await fetch(`${BASE_URL}/companies/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        company_name: 'Nexus Dynamics',
        email: e2eEmail,
        password: rawPassword,
        confirm_password: rawPassword,
        contact_number: '+91 9123456789',
      }),
    });
    const e2eRegData = await e2eRegRes.json();
    const e2eCompany = e2eRegData.company;
    if (e2eCompany?.id) cleanupCompanyIds.push(e2eCompany.id);

    const e2eLoginRes = await fetch(`${BASE_URL}/companies/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: e2eEmail, password: rawPassword }),
    });
    const e2eLoginData = await e2eLoginRes.json();
    const e2eToken = e2eLoginData.token;

    // 6.2 Setup Company Profile
    await fetch(`${BASE_URL}/companies/profile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${e2eToken}`,
      },
      body: JSON.stringify({
        company_name: 'Nexus Dynamics Global',
        description: 'Next-gen robotics and autonomous systems engineering laboratory.',
        industry: 'Robotics & AI',
        website: 'https://nexusdynamics.org',
        official_email: e2eEmail,
        contact_number: '+91 9123456789',
        address: 'Tower A, Cyber Valley',
        city: 'Hyderabad',
        state: 'Telangana',
        pincode: '500081',
      }),
    });

    // 6.3 Post a Job with Skills and Eligibility
    const e2eJobRes = await fetch(`${BASE_URL}/jobs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${e2eToken}`,
      },
      body: JSON.stringify({
        job_title: 'Robotics Software Developer',
        description: 'Design ROS2 control packages and simulation nodes for autonomous robots.',
        location: 'Hyderabad, India',
        employment_type: 'Full-time',
        salary_min: 1400000,
        salary_max: 2000000,
        application_deadline: '2026-12-31',
        status: 'Active',
        skills: ['C++', 'Python', 'ROS2', 'Linux'],
        eligibility: {
          minimum_qualification: 'B.Tech Mechanical / CSE',
          minimum_cgpa: 7.5,
          graduation_year: 2026,
          experience_required: 'Fresher',
          eligible_branches: 'Robotics, CSE, ECE',
        },
      }),
    });
    const e2eJobData = await e2eJobRes.json();
    const e2eJob = e2eJobData.job;

    // 6.4 List Jobs and verify newly posted job is present
    const e2eListRes = await fetch(`${BASE_URL}/jobs/my-jobs`, {
      headers: { Authorization: `Bearer ${e2eToken}` },
    });
    const e2eListData = await e2eListRes.json();

    // 6.5 View Job Details
    const e2eDetailRes = await fetch(`${BASE_URL}/jobs/${e2eJob.id}`, {
      headers: { Authorization: `Bearer ${e2eToken}` },
    });
    const e2eDetailData = await e2eDetailRes.json();

    // 6.6 Edit Job (update deadline and status)
    const e2eEditRes = await fetch(`${BASE_URL}/jobs/${e2eJob.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${e2eToken}`,
      },
      body: JSON.stringify({
        job_title: 'Senior Robotics Software Developer',
        skills: ['C++', 'Python', 'ROS2', 'Linux', 'Gazebo'],
      }),
    });
    const e2eEditData = await e2eEditRes.json();

    // 6.7 Verify other company cannot delete or view this job
    const e2eCrossRes = await fetch(`${BASE_URL}/jobs/${e2eJob.id}`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const e2eCrossDelete = await fetch(`${BASE_URL}/jobs/${e2eJob.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenA}` },
    });

    const e2eFlowSuccess =
      e2eRegRes.status === 201 &&
      e2eJobRes.status === 201 &&
      e2eListData.jobs?.some((j) => j.id === e2eJob.id) &&
      e2eDetailData.job?.skills?.includes('ROS2') &&
      e2eEditData.job?.skills?.includes('Gazebo') &&
      e2eCrossRes.status === 403 &&
      e2eCrossDelete.status === 403;

    assert(
      e2eFlowSuccess,
      'E2E Lifecycle: Full company profile, job creation, listing, editing, and security verified end-to-end'
    );

    // =========================================================================
    // SECTION 7: Cleanup and Teardown
    // =========================================================================
    for (const cId of cleanupCompanyIds) {
      await pool.execute('DELETE FROM job_postings WHERE company_id = ?', [cId]);
      await pool.execute('DELETE FROM company_profiles WHERE company_id = ?', [cId]);
      await pool.execute('DELETE FROM companies WHERE id = ?', [cId]);
    }
  } catch (err) {
    console.error('Unexpected error during BAT-40 test execution:', err);
    assert(false, 'BAT-40 test suite execution', err.message);
  } finally {
    console.log('\n================================================================');
    console.log(`📊 BAT-40 Test Suite Results: ${passed} Passed, ${failed} Failed`);
    console.log('================================================================\n');

    await pool.end();
    process.exit(failed > 0 ? 1 : 0);
  }
}

// Auto-boot in-process server if not running
const req = http.get('http://localhost:5000/api/health', (res) => {
  runBat40Tests();
});

req.on('error', () => {
  console.log('Starting in-process server on port 5000 for BAT-40 tests...');
  require('./server');
  setTimeout(() => {
    runBat40Tests();
  }, 1500);
});
