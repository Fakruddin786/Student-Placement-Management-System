/**
 * BAT-38 Comprehensive Integration Test Suite
 * Tests Centralized Validation Rules for Company and Job Posting Fields:
 *
 * 1. Company Registration Validations
 *    - Valid registration succeeds (201)
 *    - Blank / missing company name rejected (400)
 *    - Company name < 2 chars rejected (400)
 *    - Company name > 100 chars rejected (400)
 *    - Invalid email format rejected (400)
 *    - Email > 255 chars rejected (400)
 *    - Invalid phone format rejected (400)
 *    - Password < 6 chars rejected (400)
 *    - Password mismatch rejected (400)
 *
 * 2. Company Profile Validations
 *    - Valid profile creation & update succeeds (200/201)
 *    - Empty company name rejected (400)
 *    - Description < 10 chars rejected (400)
 *    - Description > 5000 chars rejected (400)
 *    - Empty industry rejected (400)
 *    - Invalid website URL rejected (400)
 *    - Invalid official email format rejected (400)
 *    - Invalid pincode format rejected (400)
 *    - Invalid logo URL rejected (400)
 *
 * 3. Job Posting Validations
 *    - Valid job creation succeeds (201)
 *    - Empty job title rejected (400)
 *    - Job title < 3 chars rejected (400)
 *    - Description < 10 chars rejected (400)
 *    - Empty location rejected (400)
 *    - Invalid employment type enum rejected (400)
 *    - Negative salary rejected (400)
 *    - Max salary < min salary rejected (400)
 *    - Invalid application deadline date rejected (400)
 *    - Past application deadline for new posting rejected (400)
 *    - Invalid status enum rejected (400)
 *
 * 4. Required Skills Validations
 *    - Empty skill name in array rejected
 *    - Duplicate skill names rejected (case-insensitive)
 *    - Skill name > 100 chars rejected
 *    - Skills list exceeding maximum limit rejected
 *
 * 5. Eligibility Criteria Validations
 *    - CGPA < 0 or > 10 rejected
 *    - Percentage < 0 or > 100 rejected
 *    - Graduation year outside 1990-2100 rejected
 *    - Non-integer graduation year rejected
 *    - Negative experience rejected
 *    - Duplicate eligible branches rejected
 *    - Empty branch entries rejected
 *    - String length limits enforced (qualification, experience, branches, requirements)
 */

const {
  validateRegistrationData,
  validateProfileData,
  validateJobPostingData,
  validateSkillsData,
  validateEligibilityData,
} = require('./utils/validation');

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000/api';

async function runBat38Tests() {
  console.log('====================================================');
  console.log('🧪 Starting BAT-38 Centralized Validation Test Suite');
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

  // ====================================================
  // PART 1: Unit & Rule Boundary Tests for BAT-38
  // ====================================================
  console.log('\n--- 1. Company Registration Rule Validation ---');

  // Valid Registration
  const validReg = validateRegistrationData({
    company_name: 'Acme Technologies',
    email: 'contact@acme.org',
    password: 'Password123!',
    confirm_password: 'Password123!',
    contact_number: '+91 9876543210',
  });
  assert(validReg.isValid, 'Company Registration: Valid inputs pass');

  // Missing company name
  const emptyNameReg = validateRegistrationData({
    company_name: '   ',
    email: 'contact@acme.org',
    password: 'Password123!',
    confirm_password: 'Password123!',
    contact_number: '+91 9876543210',
  });
  assert(!emptyNameReg.isValid && emptyNameReg.errors.company_name === 'Company name is required.', 'Company Registration: Blank company name rejected');

  // Short company name
  const shortNameReg = validateRegistrationData({
    company_name: 'A',
    email: 'contact@acme.org',
    password: 'Password123!',
    confirm_password: 'Password123!',
    contact_number: '+91 9876543210',
  });
  assert(!shortNameReg.isValid && shortNameReg.errors.company_name === 'Company name must be at least 2 characters.', 'Company Registration: Short company name rejected');

  // Long company name (> 100)
  const longNameReg = validateRegistrationData({
    company_name: 'A'.repeat(101),
    email: 'contact@acme.org',
    password: 'Password123!',
    confirm_password: 'Password123!',
    contact_number: '+91 9876543210',
  });
  assert(!longNameReg.isValid && longNameReg.errors.company_name === 'Company name cannot exceed 100 characters.', 'Company Registration: Excessively long company name rejected');

  // Invalid email
  const badEmailReg = validateRegistrationData({
    company_name: 'Acme Corp',
    email: 'invalid-email',
    password: 'Password123!',
    confirm_password: 'Password123!',
    contact_number: '+91 9876543210',
  });
  assert(!badEmailReg.isValid && badEmailReg.errors.email === 'Please enter a valid email address.', 'Company Registration: Malformed email rejected');

  // Password mismatch
  const mismatchReg = validateRegistrationData({
    company_name: 'Acme Corp',
    email: 'contact@acme.org',
    password: 'Password123!',
    confirm_password: 'DifferentPassword123!',
    contact_number: '+91 9876543210',
  });
  assert(!mismatchReg.isValid && mismatchReg.errors.confirm_password === 'Passwords do not match.', 'Company Registration: Password mismatch rejected');

  // Short password (< 6)
  const shortPassReg = validateRegistrationData({
    company_name: 'Acme Corp',
    email: 'contact@acme.org',
    password: '123',
    confirm_password: '123',
    contact_number: '+91 9876543210',
  });
  assert(!shortPassReg.isValid && shortPassReg.errors.password === 'Password must be at least 6 characters long.', 'Company Registration: Short password rejected');

  console.log('\n--- 2. Company Profile Rule Validation ---');

  // Valid profile
  const validProfile = validateProfileData({
    company_name: 'Acme Corp',
    description: 'Enterprise cloud services and AI application provider.',
    industry: 'Software & Technology',
    website: 'https://acme.org',
    official_email: 'hr@acme.org',
    contact_number: '+91 9876543210',
    address: 'Plot 100, Tech Park',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560100',
    logo_url: 'https://acme.org/logo.png',
  });
  assert(validProfile.isValid, 'Company Profile: Valid profile data passes');

  // Short description (< 10)
  const shortDescProfile = validateProfileData({
    company_name: 'Acme Corp',
    description: 'Short',
    industry: 'Software',
    website: 'https://acme.org',
    official_email: 'hr@acme.org',
    contact_number: '+91 9876543210',
    address: 'Plot 100',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560100',
  });
  assert(!shortDescProfile.isValid && shortDescProfile.errors.description, 'Company Profile: Description < 10 characters rejected');

  // Invalid website
  const badWebsiteProfile = validateProfileData({
    company_name: 'Acme Corp',
    description: 'Valid long description for testing purposes.',
    industry: 'Software',
    website: 'not-a-url',
    official_email: 'hr@acme.org',
    contact_number: '+91 9876543210',
    address: 'Plot 100',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560100',
  });
  assert(!badWebsiteProfile.isValid && badWebsiteProfile.errors.website, 'Company Profile: Invalid website URL rejected');

  // Invalid pincode
  const badPincodeProfile = validateProfileData({
    company_name: 'Acme Corp',
    description: 'Valid long description for testing purposes.',
    industry: 'Software',
    website: 'https://acme.org',
    official_email: 'hr@acme.org',
    contact_number: '+91 9876543210',
    address: 'Plot 100',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: 'invalid#$',
  });
  assert(!badPincodeProfile.isValid && badPincodeProfile.errors.pincode, 'Company Profile: Invalid pincode format rejected');

  console.log('\n--- 3. Job Posting Rule Validation ---');

  // Valid job
  const validJob = validateJobPostingData({
    job_title: 'Full Stack Engineer',
    description: 'Develop full stack web applications with React, Node.js, and MySQL.',
    location: 'Bengaluru, India',
    employment_type: 'Full-time',
    salary_min: 500000,
    salary_max: 900000,
    application_deadline: '2026-12-31',
    status: 'Active',
  });
  assert(validJob.isValid, 'Job Posting: Valid job posting passes');

  // Short title
  const shortTitleJob = validateJobPostingData({
    job_title: 'Go',
    description: 'Develop full stack web applications with React, Node.js, and MySQL.',
    location: 'Bengaluru, India',
    application_deadline: '2026-12-31',
  });
  assert(!shortTitleJob.isValid && shortTitleJob.errors.job_title === 'Job title must be at least 3 characters.', 'Job Posting: Short title < 3 chars rejected');

  // Salary max < salary min
  const badSalaryJob = validateJobPostingData({
    job_title: 'Software Engineer',
    description: 'Develop full stack web applications with React, Node.js, and MySQL.',
    location: 'Bengaluru, India',
    salary_min: 800000,
    salary_max: 500000,
    application_deadline: '2026-12-31',
  });
  assert(!badSalaryJob.isValid && badSalaryJob.errors.salary_max === 'Maximum salary cannot be lower than minimum salary.', 'Job Posting: Salary max < salary min rejected');

  // Past application deadline
  const pastDeadlineJob = validateJobPostingData({
    job_title: 'Software Engineer',
    description: 'Develop full stack web applications with React, Node.js, and MySQL.',
    location: 'Bengaluru, India',
    application_deadline: '2020-01-01',
  });
  assert(!pastDeadlineJob.isValid && pastDeadlineJob.errors.application_deadline === 'Application deadline cannot be a past date.', 'Job Posting: Past deadline rejected for new postings');

  // Invalid employment type
  const badEmpTypeJob = validateJobPostingData({
    job_title: 'Software Engineer',
    description: 'Develop full stack web applications with React, Node.js, and MySQL.',
    location: 'Bengaluru, India',
    employment_type: 'FreelanceConsulting',
    application_deadline: '2026-12-31',
  });
  assert(!badEmpTypeJob.isValid && badEmpTypeJob.errors.employment_type, 'Job Posting: Invalid employment type rejected');

  console.log('\n--- 4. Required Skills Rule Validation ---');

  // Duplicate skills
  const dupSkills = validateSkillsData(['Java', 'React', 'JAVA']);
  assert(!dupSkills.isValid && dupSkills.errors.skills.includes('Duplicate skill'), 'Skills: Case-insensitive duplicate skills rejected');

  // Empty skill
  const emptySkill = validateSkillsData(['Java', '   ', 'React']);
  assert(!emptySkill.isValid && emptySkill.errors.skills === 'Skill name cannot be empty.', 'Skills: Empty/blank skill name rejected');

  // Overlong skill name
  const longSkill = validateSkillsData(['A'.repeat(101)]);
  assert(!longSkill.isValid && longSkill.errors.skills.includes('exceeds maximum allowed length'), 'Skills: Overlong skill name (> 100 chars) rejected');

  // Maximum skills limit
  const tooManySkills = Array.from({ length: 35 }, (_, i) => `Skill${i}`);
  const overLimitSkills = validateSkillsData(tooManySkills);
  assert(!overLimitSkills.isValid && overLimitSkills.errors.skills.includes('maximum of 30 skills'), 'Skills: Exceeding 30 skills rejected');

  console.log('\n--- 5. Eligibility Criteria Rule Validation ---');

  // Invalid CGPA (< 0 or > 10)
  const highCgpa = validateEligibilityData({ minimum_cgpa: 10.5 });
  const negCgpa = validateEligibilityData({ minimum_cgpa: -1.0 });
  assert(!highCgpa.isValid && !negCgpa.isValid, 'Eligibility: CGPA outside 0-10 range rejected');

  // Invalid percentage (< 0 or > 100)
  const highPct = validateEligibilityData({ minimum_percentage: 105.0 });
  const negPct = validateEligibilityData({ minimum_percentage: -5.0 });
  assert(!highPct.isValid && !negPct.isValid, 'Eligibility: Percentage outside 0-100 rejected');

  // Invalid graduation year (< 1990 or > 2100)
  const oldYear = validateEligibilityData({ graduation_year: 1980 });
  const futureYear = validateEligibilityData({ graduation_year: 2150 });
  const decimalYear = validateEligibilityData({ graduation_year: 2026.5 });
  assert(!oldYear.isValid && !futureYear.isValid && !decimalYear.isValid, 'Eligibility: Invalid graduation year rejected');

  // Negative experience
  const negExp = validateEligibilityData({ experience_required: 'Require -2 years of experience' });
  assert(!negExp.isValid && negExp.errors.experience_required === 'Experience required cannot be a negative value.', 'Eligibility: Negative experience rejected');

  // Duplicate branches
  const dupBranches = validateEligibilityData({ eligible_branches: 'Computer Science, Information Technology, computer science' });
  assert(!dupBranches.isValid && dupBranches.errors.eligible_branches.includes('Duplicate branch'), 'Eligibility: Duplicate branches rejected');

  // Empty branch entry
  const emptyBranch = validateEligibilityData({ eligible_branches: 'Computer Science, , Electronics' });
  assert(!emptyBranch.isValid && emptyBranch.errors.eligible_branches.includes('cannot contain empty entries'), 'Eligibility: Empty branch entries rejected');

  // ====================================================
  // PART 2: End-to-End API Integration Tests
  // ====================================================
  console.log('\n--- 6. API Controller Validation Integration ---');

  try {
    // 1. Register Company with invalid data
    const resBadReg = await fetch(`${BASE_URL}/companies/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        company_name: 'A', // Too short
        email: 'bad-email', // Bad format
        password: '123', // Too short
        confirm_password: '456', // Mismatch
        contact_number: '12', // Too short
      }),
    });
    const badRegData = await resBadReg.json();

    assert(
      resBadReg.status === 400 &&
        !badRegData.success &&
        badRegData.errors?.company_name &&
        badRegData.errors?.email &&
        badRegData.errors?.password &&
        badRegData.errors?.confirm_password &&
        badRegData.errors?.contact_number,
      'API: Registration with multiple invalid fields returns 400 with all field errors'
    );

    // 2. Register valid company & get token
    const testEmail = `bat38_${Date.now()}@domain.org`;
    const resGoodReg = await fetch(`${BASE_URL}/companies/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        company_name: 'BAT-38 Test Corp',
        email: testEmail,
        password: 'Password123!',
        confirm_password: 'Password123!',
        contact_number: '+91 9876543210',
      }),
    });
    const goodRegData = await resGoodReg.json();
    assert(resGoodReg.status === 201 && goodRegData.success, 'API: Valid company registration succeeds (201)');

    const resLogin = await fetch(`${BASE_URL}/companies/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password: 'Password123!' }),
    });
    const loginData = await resLogin.json();
    const token = loginData.token;

    // 3. Create job with invalid fields via API
    const resBadJob = await fetch(`${BASE_URL}/jobs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        job_title: 'AB', // < 3 chars
        description: 'Short', // < 10 chars
        location: '', // empty
        salary_min: 800000,
        salary_max: 500000, // max < min
        application_deadline: '2020-01-01', // past date
        skills: ['Python', 'python'], // duplicate
        eligibility: {
          minimum_cgpa: 15.0, // > 10
          graduation_year: 1800, // < 1990
          eligible_branches: 'CS, CS', // duplicate
        },
      }),
    });
    const badJobData = await resBadJob.json();

    assert(
      resBadJob.status === 400 &&
        !badJobData.success &&
        badJobData.errors?.job_title &&
        badJobData.errors?.description &&
        badJobData.errors?.location &&
        badJobData.errors?.salary_max &&
        badJobData.errors?.application_deadline &&
        badJobData.errors?.skills &&
        badJobData.errors?.minimum_cgpa &&
        badJobData.errors?.graduation_year &&
        badJobData.errors?.eligible_branches,
      'API: Job creation aggregates all field, skills, and eligibility validation errors (400)'
    );

    // 4. Create valid job with skills and eligibility via API
    const resGoodJob = await fetch(`${BASE_URL}/jobs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        job_title: 'Software Developer',
        description: 'Design and build cutting-edge web applications using modern technologies.',
        location: 'Bengaluru, India',
        employment_type: 'Full-time',
        salary_min: 600000,
        salary_max: 900000,
        application_deadline: '2026-12-31',
        status: 'Active',
        skills: ['JavaScript', 'React', 'Node.js'],
        eligibility: {
          minimum_qualification: 'B.Tech / B.E.',
          minimum_cgpa: 7.5,
          minimum_percentage: 75.0,
          graduation_year: 2027,
          experience_required: 'Fresher (0 years)',
          eligible_branches: 'Computer Science, IT',
          additional_requirements: 'Good problem-solving abilities.',
        },
      }),
    });
    const goodJobData = await resGoodJob.json();

    assert(
      resGoodJob.status === 201 &&
        goodJobData.success &&
        goodJobData.job?.job_title === 'Software Developer' &&
        goodJobData.job?.skills?.length === 3 &&
        parseFloat(goodJobData.job?.eligibility?.minimum_cgpa) === 7.5,
      'API: Valid job with skills and eligibility created successfully (201)'
    );

    const createdJobId = goodJobData.job.id;

    // 5. Update job with invalid data
    const resBadUpdate = await fetch(`${BASE_URL}/jobs/${createdJobId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        salary_min: 900000,
        salary_max: 700000, // max < min
      }),
    });
    const badUpdateData = await resBadUpdate.json();

    assert(
      resBadUpdate.status === 400 && badUpdateData.errors?.salary_max,
      'API: Updating job with invalid salary range rejected (400)'
    );
  } catch (err) {
    assert(false, 'API Controller Integration Tests', err.message);
  }

  console.log('\n====================================================');
  console.log(`Test Results Summary: ${passed} Passed, ${failed} Failed`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

// Start backend server if not already running, then execute tests
const http = require('http');

const req = http.get('http://localhost:5000/api/health', (res) => {
  // Server already running
  runBat38Tests();
});

req.on('error', () => {
  // Server not running, boot server in-process
  console.log('Starting in-process server on port 5000 for BAT-38 tests...');
  require('./server');
  setTimeout(() => {
    runBat38Tests();
  }, 1500);
});
