/**
 * Seed Minimal Test Data for Placement Management System (BAT-34)
 * 1 Company with Profile
 * 2 Job Postings
 */

const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');
const CompanyModel = require('../models/companyModel');
const JobPostingModel = require('../models/jobPostingModel');

async function seed() {
  console.log('🌱 Seeding minimal test data for BAT-34...');

  try {
    const seedEmail = 'campus-hiring@techcorp-demo.com';
    let company = await CompanyModel.findByEmail(seedEmail);

    if (!company) {
      const password_hash = await bcrypt.hash('DemoPass@123', 10);
      company = await CompanyModel.createCompany({
        company_name: 'TechCorp Solutions Ltd',
        email: seedEmail,
        password_hash,
        contact_number: '+91 9876500001',
      });
      console.log(`✅ Created seed company: ${company.company_name} (ID: ${company.id})`);
    } else {
      console.log(`ℹ️ Seed company already exists (ID: ${company.id})`);
    }

    // Ensure company profile exists
    await CompanyModel.saveProfile({
      company_id: company.id,
      company_name: 'TechCorp Solutions Ltd',
      description: 'Enterprise cloud services, AI consulting, and software development provider.',
      industry: 'Information Technology & Cloud Services',
      website: 'https://techcorp-solutions-demo.com',
      official_email: seedEmail,
      contact_number: '+91 9876500001',
      address: 'Plot 101, Electronic City Phase 1',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560100',
      logo_url: 'https://placehold.co/150x150/1e40af/ffffff?text=TechCorp',
    });
    console.log('✅ Created/updated seed company profile');

    // Check existing jobs for this company
    const existingJobs = await JobPostingModel.findByCompanyId(company.id);

    if (existingJobs.length === 0) {
      // 1. Job Posting 1: Software Development Engineer
      const job1 = await JobPostingModel.createJobPosting({
        company_id: company.id,
        job_title: 'Graduate Software Engineer (Backend)',
        description: 'Design and build resilient microservices in Node.js, Express, and MySQL. Collaborate with frontend and DevOps engineers.',
        location: 'Bengaluru, India (Hybrid)',
        employment_type: 'Full-time',
        salary_min: 750000.00,
        salary_max: 1200000.00,
        application_deadline: '2026-12-31',
        status: 'Active',
      });
      console.log(`✅ Created Job 1: "${job1.job_title}" (ID: ${job1.id})`);

      // 2. Job Posting 2: Cloud & DevOps Intern
      const job2 = await JobPostingModel.createJobPosting({
        company_id: company.id,
        job_title: 'Cloud & DevOps Intern',
        description: 'Assist in setting up CI/CD pipelines, containerization with Docker, and infrastructure monitoring.',
        location: 'Remote / Hybrid',
        employment_type: 'Internship',
        salary_min: 30000.00,
        salary_max: 45000.00,
        application_deadline: '2026-11-30',
        status: 'Active',
      });
      console.log(`✅ Created Job 2: "${job2.job_title}" (ID: ${job2.id})`);
    } else {
      console.log(`ℹ️ Company already has ${existingJobs.length} job postings.`);
    }

    console.log('\n🎉 Seed completed successfully!');
  } catch (err) {
    console.error('❌ Seeding error:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seed();
