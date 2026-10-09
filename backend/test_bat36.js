/**
 * BAT-36 Comprehensive Integration Test Suite
 * Tests Required Skills and Eligibility Criteria in Job Postings:
 * Create, Edit, Data Model, Relations, Validations, Authorization, Transactions, and Persistence
 */

const { pool } = require('./config/database');
const CompanyModel = require('./models/companyModel');
const JobPostingModel = require('./models/jobPostingModel');
const { validateJobPostingData, validateSkillsData, validateEligibilityData } = require('./utils/validation');
const bcrypt = require('bcryptjs');

async function runBat36Tests() {
  console.log('====================================================');
  console.log('🧪 Starting BAT-36 Required Skills & Eligibility Tests');
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

  try {
    // ----------------------------------------------------
    // Setup Test Companies A & B
    // ----------------------------------------------------
    const pwdHash = await bcrypt.hash('Password123!', 10);
    companyA = await CompanyModel.createCompany({
      company_name: 'Company Alpha Tech (BAT-36)',
      email: `alpha_${Date.now()}@domain.org`,
      password_hash: pwdHash,
      contact_number: '+91 9876543210',
    });

    companyB = await CompanyModel.createCompany({
      company_name: 'Company Beta Labs (BAT-36)',
      email: `beta_${Date.now()}@domain.org`,
      password_hash: pwdHash,
      contact_number: '+91 9876543211',
    });

    // ----------------------------------------------------
    // Test 1: Create job without skills (backward compatibility)
    // ----------------------------------------------------
    const job1 = await JobPostingModel.createJobPosting({
      company_id: companyA.id,
      job_title: 'Junior QA Engineer',
      description: 'Perform manual and automated testing for web platforms.',
      location: 'Bengaluru, India',
      employment_type: 'Full-time',
      application_deadline: '2026-12-31',
    });

    assert(
      job1 && job1.id > 0 && Array.isArray(job1.skills) && job1.skills.length === 0 && job1.eligibility === null,
      'Test 1: Create job without skills works cleanly (returns skills: [], eligibility: null)'
    );

    // ----------------------------------------------------
    // Test 2: Create job with one skill
    // ----------------------------------------------------
    const job2 = await JobPostingModel.createJobPosting({
      company_id: companyA.id,
      job_title: 'Python Specialist',
      description: 'Build backend data pipelines using Python and SQL.',
      location: 'Remote',
      employment_type: 'Full-time',
      application_deadline: '2026-12-31',
      skills: ['Python'],
    });

    assert(
      job2 && job2.skills.length === 1 && job2.skills[0] === 'Python',
      'Test 2: Create job with one skill persists skill correctly'
    );

    // ----------------------------------------------------
    // Test 3: Create job with multiple skills
    // ----------------------------------------------------
    const job3 = await JobPostingModel.createJobPosting({
      company_id: companyA.id,
      job_title: 'Full Stack Engineer',
      description: 'End to end web development with React, Node.js, and SQL.',
      location: 'Hyderabad, India',
      employment_type: 'Full-time',
      application_deadline: '2026-12-31',
      skills: ['React', 'Node.js', 'SQL', 'Git'],
    });

    assert(
      job3 &&
        job3.skills.length === 4 &&
        job3.skills.includes('React') &&
        job3.skills.includes('Node.js') &&
        job3.skills.includes('SQL') &&
        job3.skills.includes('Git'),
      'Test 3: Create job with multiple skills persists all skills'
    );

    // ----------------------------------------------------
    // Test 4: Duplicate skills validation rejection
    // ----------------------------------------------------
    const duplicateSkillsVal = validateSkillsData(['Java', 'React', 'java']);
    assert(
      !duplicateSkillsVal.isValid && duplicateSkillsVal.errors?.skills?.includes('Duplicate skill'),
      'Test 4: Duplicate skills rejected (case-insensitive check)'
    );

    // ----------------------------------------------------
    // Test 5: Empty skill name validation rejection
    // ----------------------------------------------------
    const emptySkillVal = validateSkillsData(['Java', '   ', 'React']);
    assert(
      !emptySkillVal.isValid && emptySkillVal.errors?.skills === 'Skill name cannot be empty.',
      'Test 5: Empty/whitespace skill name rejected'
    );

    // ----------------------------------------------------
    // Test 6: Create job with eligibility criteria
    // ----------------------------------------------------
    const jobWithEligibility = await JobPostingModel.createJobPosting({
      company_id: companyA.id,
      job_title: 'Campus Graduate Trainee',
      description: 'Exciting opportunity for fresh engineering graduates.',
      location: 'Pune, India',
      employment_type: 'Full-time',
      application_deadline: '2026-11-30',
      skills: ['C++', 'Data Structures', 'Algorithms'],
      eligibility: {
        minimum_qualification: 'B.Tech / B.E.',
        minimum_cgpa: 7.5,
        minimum_percentage: 75.0,
        graduation_year: 2027,
        experience_required: 'Fresher (0 years)',
        eligible_branches: 'Computer Science, Information Technology, Electronics',
        additional_requirements: 'Must have strong analytical and problem-solving skills.',
      },
    });

    assert(
      jobWithEligibility &&
        jobWithEligibility.eligibility &&
        jobWithEligibility.eligibility.minimum_qualification === 'B.Tech / B.E.' &&
        parseFloat(jobWithEligibility.eligibility.minimum_cgpa) === 7.5 &&
        parseFloat(jobWithEligibility.eligibility.minimum_percentage) === 75.0 &&
        jobWithEligibility.eligibility.graduation_year === 2027 &&
        jobWithEligibility.eligibility.experience_required === 'Fresher (0 years)',
      'Test 6: Create job with eligibility criteria persists all criteria fields'
    );

    // ----------------------------------------------------
    // Test 7: Invalid CGPA validation rejection (> 10 or < 0)
    // ----------------------------------------------------
    const invalidCgpaVal = validateEligibilityData({ minimum_cgpa: 11.5 });
    const negativeCgpaVal = validateEligibilityData({ minimum_cgpa: -2.0 });
    assert(
      !invalidCgpaVal.isValid &&
        invalidCgpaVal.errors?.minimum_cgpa &&
        !negativeCgpaVal.isValid &&
        negativeCgpaVal.errors?.minimum_cgpa,
      'Test 7: Invalid CGPA (> 10.0 or negative) rejected'
    );

    // ----------------------------------------------------
    // Test 8: Invalid percentage validation rejection (> 100 or < 0)
    // ----------------------------------------------------
    const invalidPctVal = validateEligibilityData({ minimum_percentage: 125 });
    assert(
      !invalidPctVal.isValid && invalidPctVal.errors?.minimum_percentage,
      'Test 8: Invalid percentage (> 100) rejected'
    );

    // ----------------------------------------------------
    // Test 9: Invalid graduation year validation rejection (< 1990 or > 2100 or decimal)
    // ----------------------------------------------------
    const invalidYearVal = validateEligibilityData({ graduation_year: 1850 });
    const nonIntegerYearVal = validateEligibilityData({ graduation_year: 2026.5 });
    assert(
      !invalidYearVal.isValid &&
        invalidYearVal.errors?.graduation_year &&
        !nonIntegerYearVal.isValid &&
        nonIntegerYearVal.errors?.graduation_year,
      'Test 9: Invalid graduation year rejected'
    );

    // ----------------------------------------------------
    // Test 10: validateJobPostingData integration with skills & eligibility
    // ----------------------------------------------------
    const fullFormVal = validateJobPostingData({
      job_title: 'Valid Job Title',
      description: 'Sufficiently long description for validation.',
      location: 'Chennai',
      employment_type: 'Full-time',
      application_deadline: '2026-12-31',
      skills: ['React', 'React'], // Duplicate
      eligibility: { minimum_cgpa: 15 }, // Invalid CGPA
    });

    assert(
      !fullFormVal.isValid && fullFormVal.errors?.skills && fullFormVal.errors?.minimum_cgpa,
      'Test 10: validateJobPostingData aggregates skills and eligibility errors cleanly'
    );

    // ----------------------------------------------------
    // Test 11: Edit existing skills (replace skills array)
    // ----------------------------------------------------
    const updatedSkillsJob = await JobPostingModel.updateJobPosting(
      job3.id,
      companyA.id,
      {
        skills: ['React', 'TypeScript', 'Docker'],
      }
    );

    assert(
      updatedSkillsJob &&
        updatedSkillsJob.skills.length === 3 &&
        updatedSkillsJob.skills.includes('TypeScript') &&
        updatedSkillsJob.skills.includes('Docker') &&
        !updatedSkillsJob.skills.includes('SQL'),
      'Test 11: Edit job skills replaces skills list properly'
    );

    // ----------------------------------------------------
    // Test 12: Add new skill to existing job
    // ----------------------------------------------------
    const addedSkillJob = await JobPostingModel.updateJobPosting(
      job3.id,
      companyA.id,
      {
        skills: [...updatedSkillsJob.skills, 'Kubernetes'],
      }
    );

    assert(
      addedSkillJob &&
        addedSkillJob.skills.length === 4 &&
        addedSkillJob.skills.includes('Kubernetes'),
      'Test 12: Add new skill persists on edit'
    );

    // ----------------------------------------------------
    // Test 13: Remove skill from existing job
    // ----------------------------------------------------
    const removedSkillJob = await JobPostingModel.updateJobPosting(
      job3.id,
      companyA.id,
      {
        skills: addedSkillJob.skills.filter((s) => s !== 'Docker'),
      }
    );

    assert(
      removedSkillJob &&
        removedSkillJob.skills.length === 3 &&
        !removedSkillJob.skills.includes('Docker'),
      'Test 13: Remove skill updates job skills list correctly'
    );

    // ----------------------------------------------------
    // Test 14: Update eligibility criteria
    // ----------------------------------------------------
    const updatedEligibilityJob = await JobPostingModel.updateJobPosting(
      jobWithEligibility.id,
      companyA.id,
      {
        eligibility: {
          minimum_qualification: 'M.Tech / M.E. / B.Tech',
          minimum_cgpa: 8.0,
          minimum_percentage: 80.0,
          graduation_year: 2026,
          experience_required: '1-2 years',
          eligible_branches: 'CSE, ECE',
          additional_requirements: 'Updated additional requirement.',
        },
      }
    );

    assert(
      updatedEligibilityJob &&
        updatedEligibilityJob.eligibility &&
        parseFloat(updatedEligibilityJob.eligibility.minimum_cgpa) === 8.0 &&
        parseFloat(updatedEligibilityJob.eligibility.minimum_percentage) === 80.0 &&
        updatedEligibilityJob.eligibility.graduation_year === 2026 &&
        updatedEligibilityJob.eligibility.minimum_qualification === 'M.Tech / M.E. / B.Tech',
      'Test 14: Update eligibility criteria updates all fields'
    );

    // ----------------------------------------------------
    // Test 15: Add eligibility criteria to a job that didn't have any
    // ----------------------------------------------------
    const newEligibilityJob = await JobPostingModel.updateJobPosting(
      job1.id,
      companyA.id,
      {
        eligibility: {
          minimum_qualification: 'BCA / B.Sc Computer Science',
          minimum_cgpa: 6.5,
          graduation_year: 2026,
        },
      }
    );

    assert(
      newEligibilityJob &&
        newEligibilityJob.eligibility &&
        newEligibilityJob.eligibility.minimum_qualification === 'BCA / B.Sc Computer Science' &&
        parseFloat(newEligibilityJob.eligibility.minimum_cgpa) === 6.5,
      'Test 15: Add eligibility to existing job without prior eligibility'
    );

    // ----------------------------------------------------
    // Test 16: Verify changes persist after reload (fresh findById)
    // ----------------------------------------------------
    const freshJob = await JobPostingModel.findById(jobWithEligibility.id);
    assert(
      freshJob &&
        freshJob.skills.length === 3 &&
        freshJob.skills.includes('C++') &&
        freshJob.eligibility &&
        parseFloat(freshJob.eligibility.minimum_cgpa) === 8.0,
      'Test 16: Skills and eligibility persist across fresh database query'
    );

    // ----------------------------------------------------
    // Test 17: Company A cannot modify Company B's job skills
    // ----------------------------------------------------
    const jobB = await JobPostingModel.createJobPosting({
      company_id: companyB.id,
      job_title: 'Beta Security Analyst',
      description: 'Audit network infrastructure and pen test internal endpoints.',
      location: 'Mumbai, India',
      employment_type: 'Full-time',
      application_deadline: '2026-12-31',
      skills: ['Wireshark', 'Burp Suite'],
    });

    // Company A attempts to update Company B's job skills
    const unauthorizedSkillUpdate = await JobPostingModel.updateJobPosting(
      jobB.id,
      companyA.id, // Company A's ID
      {
        skills: ['Hacked Skill'],
      }
    );

    const checkJobBAfter = await JobPostingModel.findById(jobB.id);

    assert(
      unauthorizedSkillUpdate === null &&
        checkJobBAfter.skills.length === 2 &&
        !checkJobBAfter.skills.includes('Hacked Skill'),
      'Test 17: Company A cannot modify Company B job skills (ownership check strictly enforced)'
    );

    // ----------------------------------------------------
    // Test 18: Company A cannot modify Company B's eligibility
    // ----------------------------------------------------
    const unauthorizedEligibilityUpdate = await JobPostingModel.updateJobPosting(
      jobB.id,
      companyA.id, // Company A's ID
      {
        eligibility: { minimum_cgpa: 9.9 },
      }
    );

    const checkJobBEligibility = await JobPostingModel.findById(jobB.id);

    assert(
      unauthorizedEligibilityUpdate === null && checkJobBEligibility.eligibility === null,
      'Test 18: Company A cannot modify Company B eligibility criteria'
    );

    // ----------------------------------------------------
    // Test 19: Database foreign key constraints in job_skills
    // ----------------------------------------------------
    let fkSkillError = false;
    try {
      await pool.execute(
        `INSERT INTO job_skills (job_posting_id, skill_name) VALUES (?, ?)`,
        [99999999, 'Orphaned Skill']
      );
    } catch (err) {
      if (err.code === 'ER_NO_REFERENCED_ROW_2' || err.message.includes('foreign key constraint')) {
        fkSkillError = true;
      }
    }

    assert(
      fkSkillError,
      'Test 19: Foreign key constraint enforced in job_skills (rejects non-existent job_posting_id)'
    );

    // ----------------------------------------------------
    // Test 20: Database foreign key constraints in job_eligibility
    // ----------------------------------------------------
    let fkEligibilityError = false;
    try {
      await pool.execute(
        `INSERT INTO job_eligibility (job_posting_id, minimum_qualification) VALUES (?, ?)`,
        [99999999, 'Orphaned Degree']
      );
    } catch (err) {
      if (err.code === 'ER_NO_REFERENCED_ROW_2' || err.message.includes('foreign key constraint')) {
        fkEligibilityError = true;
      }
    }

    assert(
      fkEligibilityError,
      'Test 20: Foreign key constraint enforced in job_eligibility (rejects non-existent job_posting_id)'
    );

    // ----------------------------------------------------
    // Test 21: Unique skill constraint per job in database
    // ----------------------------------------------------
    let uniqueConstraintError = false;
    try {
      await pool.execute(
        `INSERT INTO job_skills (job_posting_id, skill_name) VALUES (?, ?)`,
        [job2.id, 'Python'] // Python already exists for job2
      );
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY' || err.message.includes('Duplicate entry')) {
        uniqueConstraintError = true;
      }
    }

    assert(
      uniqueConstraintError,
      'Test 21: Unique constraint uq_job_skill prevents duplicate skill records in database'
    );

    // ----------------------------------------------------
    // Test 22: Cascade Delete (Deleting Job deletes its skills & eligibility)
    // ----------------------------------------------------
    const tempJob = await JobPostingModel.createJobPosting({
      company_id: companyA.id,
      job_title: 'Temporary Role',
      description: 'Short term project contract for immediate hire.',
      location: 'Remote',
      employment_type: 'Contract',
      application_deadline: '2026-12-31',
      skills: ['Rust', 'WebAssembly'],
      eligibility: { minimum_cgpa: 7.0 },
    });

    const tempJobId = tempJob.id;
    await JobPostingModel.deleteJobPosting(tempJobId, companyA.id);

    const [orphanedSkills] = await pool.execute(
      `SELECT * FROM job_skills WHERE job_posting_id = ?`,
      [tempJobId]
    );
    const [orphanedEligibility] = await pool.execute(
      `SELECT * FROM job_eligibility WHERE job_posting_id = ?`,
      [tempJobId]
    );

    assert(
      orphanedSkills.length === 0 && orphanedEligibility.length === 0,
      'Test 22: ON DELETE CASCADE automatically cleans up job_skills and job_eligibility on job deletion'
    );

    // ----------------------------------------------------
    // Test 23: Transaction Rollback on Error
    // Verify that if an error occurs while saving skills (e.g. duplicate skill violating DB constraint),
    // the entire job creation rolls back cleanly
    // ----------------------------------------------------
    const [preCountJobs] = await pool.execute(`SELECT COUNT(*) AS total FROM job_postings`);
    const preCount = preCountJobs[0].total;

    let transactionRolledBack = false;
    try {
      // Pass duplicate skills directly to model to bypass validation and trigger DB constraint ER_DUP_ENTRY
      await JobPostingModel.createJobPosting({
        company_id: companyA.id,
        job_title: 'Failed Transaction Job',
        description: 'This job should not be saved if transaction rolls back.',
        location: 'Nowhere',
        application_deadline: '2026-12-31',
        skills: ['SQL', 'SQL'], // Triggers MySQL uq_job_skill UNIQUE constraint violation
      });
    } catch {
      transactionRolledBack = true;
    }

    const [postCountJobs] = await pool.execute(`SELECT COUNT(*) AS total FROM job_postings`);
    const postCount = postCountJobs[0].total;

    assert(
      transactionRolledBack && preCount === postCount,
      'Test 23: Transaction rollback ensures no partial/inconsistent data is committed on failure'
    );

    // ----------------------------------------------------
    // Test 24: Cascade Delete from Company to Job Posting to Skills and Eligibility
    // ----------------------------------------------------
    await CompanyModel.deleteCompany(companyB.id);

    const [compBSkills] = await pool.execute(
      `SELECT * FROM job_skills WHERE job_posting_id = ?`,
      [jobB.id]
    );

    assert(
      compBSkills.length === 0,
      'Test 24: Cascade delete from Company -> JobPosting -> JobSkills cleans up all nested data'
    );

    // Clean up test company A
    if (companyA) {
      await CompanyModel.deleteCompany(companyA.id);
    }

    console.log('\n====================================================');
    console.log(`BAT-36 Test Summary: ${passed} Passed, ${failed} Failed`);
    console.log('====================================================\n');

    if (failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (err) {
    console.error('Unexpected test error in BAT-36 suite:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runBat36Tests();
