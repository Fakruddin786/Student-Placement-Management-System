/**
 * BAT-34 Comprehensive Model and Database Test Suite
 * Verifies Company and JobPosting Data Models, Foreign Keys, Constraints, and Relationships
 */

const { pool } = require('./config/database');
const CompanyModel = require('./models/companyModel');
const JobPostingModel = require('./models/jobPostingModel');
const bcrypt = require('bcryptjs');

async function runBat34Tests() {
  console.log('====================================================');
  console.log('🧪 Starting BAT-34 Data Model & Relationship Tests');
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

  let testCompany = null;
  let testJob1 = null;
  let testJob2 = null;

  try {
    // -----------------------------------------------------------------
    // Test 1: Verify job_postings table exists in MySQL database
    // -----------------------------------------------------------------
    const [tables] = await pool.query(`SHOW TABLES LIKE 'job_postings';`);
    assert(
      tables.length === 1,
      'Test 1: job_postings table exists in database'
    );

    // -----------------------------------------------------------------
    // Test 2: Verify all required columns and data types in job_postings
    // -----------------------------------------------------------------
    const [columns] = await pool.query(`DESCRIBE job_postings;`);
    const colNames = columns.map((c) => c.Field);
    const requiredFields = [
      'id',
      'company_id',
      'job_title',
      'description',
      'location',
      'employment_type',
      'salary_min',
      'salary_max',
      'application_deadline',
      'status',
      'created_at',
      'updated_at',
    ];

    const hasAllFields = requiredFields.every((f) => colNames.includes(f));
    assert(
      hasAllFields,
      'Test 2: job_postings table contains all required fields from BAT-34 specification'
    );

    // -----------------------------------------------------------------
    // Test 3: Create a test company for model testing
    // -----------------------------------------------------------------
    const uniqueEmail = `bat34_test_${Date.now()}@testcompany.org`;
    const pwdHash = await bcrypt.hash('Secret123!', 10);
    testCompany = await CompanyModel.createCompany({
      company_name: 'BAT-34 Test Enterprises',
      email: uniqueEmail,
      password_hash: pwdHash,
      contact_number: '+91 9998887770',
    });

    await CompanyModel.saveProfile({
      company_id: testCompany.id,
      company_name: 'BAT-34 Test Enterprises',
      description: 'Pioneering technology solutions and automated testing.',
      industry: 'Software & Technology',
      website: 'https://bat34-test.org',
      official_email: uniqueEmail,
      contact_number: '+91 9998887770',
      address: 'Tech Innovation Park, Block C',
      city: 'Hyderabad',
      state: 'Telangana',
      pincode: '500081',
      logo_url: 'https://placehold.co/100x100?text=BAT34',
    });

    assert(
      testCompany && testCompany.id > 0,
      'Test 3: Created test company record with profile'
    );

    // -----------------------------------------------------------------
    // Test 4: JobPostingModel.createJobPosting with all fields
    // -----------------------------------------------------------------
    testJob1 = await JobPostingModel.createJobPosting({
      company_id: testCompany.id,
      job_title: 'Full Stack Engineer',
      description: 'Develop React frontend and Node.js backend services.',
      location: 'Hyderabad, India',
      employment_type: 'Full-time',
      salary_min: 600000.00,
      salary_max: 950000.00,
      application_deadline: '2026-12-31',
      status: 'Active',
    });

    assert(
      testJob1 &&
        testJob1.id > 0 &&
        testJob1.company_id === testCompany.id &&
        testJob1.job_title === 'Full Stack Engineer' &&
        testJob1.company_name === 'BAT-34 Test Enterprises',
      'Test 4: JobPostingModel.createJobPosting creates record and joins company data correctly'
    );

    // -----------------------------------------------------------------
    // Test 5: JobPosting default values (employment_type & status)
    // -----------------------------------------------------------------
    testJob2 = await JobPostingModel.createJobPosting({
      company_id: testCompany.id,
      job_title: 'Frontend Intern',
      description: 'Build responsive UI components in React and Bootstrap.',
      location: 'Remote',
      application_deadline: '2026-10-31',
      // employment_type and status omitted to test defaults
    });

    assert(
      testJob2.employment_type === 'Full-time' && testJob2.status === 'Active',
      'Test 5: Default values applied correctly (employment_type = "Full-time", status = "Active")'
    );

    // -----------------------------------------------------------------
    // Test 6: Verify 1-to-many relationship (Company 1 ---- N JobPosting)
    // -----------------------------------------------------------------
    const companyWithJobs = await CompanyModel.getCompanyWithJobs(testCompany.id);
    assert(
      companyWithJobs &&
        Array.isArray(companyWithJobs.job_postings) &&
        companyWithJobs.job_postings.length === 2 &&
        companyWithJobs.job_postings[0].company_id === testCompany.id,
      'Test 6: Company 1 ---- N JobPosting relationship retrieval verified (CompanyModel.getCompanyWithJobs)'
    );

    // -----------------------------------------------------------------
    // Test 7: Foreign Key constraint enforcement (reject invalid company_id)
    // -----------------------------------------------------------------
    let fkRejected = false;
    try {
      await JobPostingModel.createJobPosting({
        company_id: 99999999, // Non-existent foreign key
        job_title: 'Ghost Job',
        description: 'Should fail FK constraint.',
        location: 'Nowhere',
        application_deadline: '2026-12-31',
      });
    } catch (err) {
      if (err.code === 'ER_NO_REFERENCED_ROW_2' || err.message.includes('foreign key constraint fails')) {
        fkRejected = true;
      }
    }

    assert(
      fkRejected,
      'Test 7: Foreign key constraint enforced (rejects job posting with non-existent company_id)'
    );

    // -----------------------------------------------------------------
    // Test 8: Model update operations (BAT-35 extension support)
    // -----------------------------------------------------------------
    const updatedJob = await JobPostingModel.updateJobPosting(testJob1.id, testCompany.id, {
      job_title: 'Senior Full Stack Engineer',
      salary_max: 1200000.00,
      status: 'Active',
    });

    assert(
      updatedJob &&
        updatedJob.job_title === 'Senior Full Stack Engineer' &&
        parseFloat(updatedJob.salary_max) === 1200000.00,
      'Test 8: JobPostingModel.updateJobPosting updates fields cleanly'
    );

    // -----------------------------------------------------------------
    // Test 9: Model delete operation (BAT-39 extension support)
    // -----------------------------------------------------------------
    const deleted = await JobPostingModel.deleteJobPosting(testJob2.id, testCompany.id);
    const postDeleteFetch = await JobPostingModel.findById(testJob2.id);

    assert(
      deleted && postDeleteFetch === null,
      'Test 9: JobPostingModel.deleteJobPosting successfully deletes job posting'
    );

    // -----------------------------------------------------------------
    // Test 10: Foreign Key Cascade Delete
    // Deleting the company must automatically delete its remaining job postings
    // -----------------------------------------------------------------
    await CompanyModel.deleteCompany(testCompany.id);
    const orphanedJobs = await JobPostingModel.findByCompanyId(testCompany.id);

    assert(
      orphanedJobs.length === 0,
      'Test 10: ON DELETE CASCADE foreign key deletes associated job postings when company is deleted'
    );

    console.log('\n====================================================');
    console.log(`BAT-34 Test Summary: ${passed} Passed, ${failed} Failed`);
    console.log('====================================================\n');

    if (failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (err) {
    console.error('Unexpected test error:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runBat34Tests();
