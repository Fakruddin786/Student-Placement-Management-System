const JobPostingModel = require('../models/jobPostingModel');
const { validateJobPostingData } = require('../utils/validation');

/**
 * Job Controller (BAT-35)
 * Handles job posting creation, retrieval, and updating with company ownership verification
 */
const jobController = {
  /**
   * POST /api/jobs
   * Create a new job posting for the authenticated company
   */
  async createJob(req, res) {
    try {
      // 1. Identify logged-in company strictly from verified JWT
      const company_id = req.company.id;

      const {
        job_title,
        description,
        location,
        employment_type = 'Full-time',
        salary_min,
        salary_max,
        application_deadline,
        status = 'Active',
        skills,
        eligibility,
      } = req.body;

      // 2. Validate the request data (including BAT-36 skills and eligibility)
      const validation = validateJobPostingData({
        job_title,
        description,
        location,
        employment_type,
        salary_min,
        salary_max,
        application_deadline,
        status,
        skills,
        eligibility,
      });

      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed. Please correct the highlighted errors.',
          errors: validation.errors,
        });
      }

      // 3. Save job posting automatically associated with authenticated company
      const jobDataToSave = validation.sanitized || {
        job_title,
        description,
        location,
        employment_type,
        salary_min,
        salary_max,
        application_deadline,
        status,
        skills,
        eligibility,
      };

      const newJob = await JobPostingModel.createJobPosting({
        company_id,
        ...jobDataToSave,
      });

      // 4. Return appropriate success response
      return res.status(201).json({
        success: true,
        message: 'Job posting created successfully.',
        job: newJob,
      });
    } catch (error) {
      console.error('Create Job Error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error while creating job posting.',
        error: error.message,
      });
    }
  },

  /**
   * GET /api/jobs/:id
   * Get job posting details by ID with ownership verification for company portal (BAT-39)
   */
  async getJobById(req, res) {
    try {
      const jobId = parseInt(req.params.id, 10);

      if (isNaN(jobId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid job posting ID.',
        });
      }

      const job = await JobPostingModel.findById(jobId);

      if (!job) {
        return res.status(404).json({
          success: false,
          message: 'Job posting not found.',
        });
      }

      // Verify that the job belongs to the authenticated company (BAT-39)
      if (req.company && job.company_id !== req.company.id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You do not have permission to view this job posting.',
        });
      }

      return res.status(200).json({
        success: true,
        job,
      });
    } catch (error) {
      console.error('Get Job Error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error while retrieving job posting.',
        error: error.message,
      });
    }
  },

  /**
   * PUT /api/jobs/:id
   * Update an existing job posting with strict ownership verification
   */
  async updateJob(req, res) {
    try {
      const jobId = parseInt(req.params.id, 10);
      const companyId = req.company.id; // From verified JWT

      if (isNaN(jobId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid job posting ID.',
        });
      }

      // 1. Find requested job
      const existingJob = await JobPostingModel.findById(jobId);

      if (!existingJob) {
        return res.status(404).json({
          success: false,
          message: 'Job posting not found.',
        });
      }

      // 2. Strict Ownership / Authorization Check:
      // Verify that the job belongs to the authenticated company
      if (existingJob.company_id !== companyId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You do not have permission to edit this job posting.',
        });
      }

      const {
        job_title,
        description,
        location,
        employment_type,
        salary_min,
        salary_max,
        application_deadline,
        status,
        skills,
        eligibility,
      } = req.body;

      // 3. Validate update payload (fallback to existing values if not explicitly provided)
      const validation = validateJobPostingData(
        {
          job_title: job_title !== undefined ? job_title : existingJob.job_title,
          description: description !== undefined ? description : existingJob.description,
          location: location !== undefined ? location : existingJob.location,
          employment_type: employment_type !== undefined ? employment_type : existingJob.employment_type,
          salary_min: salary_min !== undefined ? salary_min : existingJob.salary_min,
          salary_max: salary_max !== undefined ? salary_max : existingJob.salary_max,
          application_deadline: application_deadline !== undefined ? application_deadline : existingJob.application_deadline,
          status: status !== undefined ? status : existingJob.status,
          skills,
          eligibility,
        },
        { isUpdate: true }
      );

      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed. Please correct the highlighted errors.',
          errors: validation.errors,
        });
      }

      // 4. Update job posting using sanitized values (including BAT-36 skills and eligibility)
      const updatePayload = validation.sanitized || {
        job_title,
        description,
        location,
        employment_type,
        salary_min,
        salary_max,
        application_deadline,
        status,
        skills,
        eligibility,
      };

      const updatedJob = await JobPostingModel.updateJobPosting(jobId, companyId, updatePayload);

      return res.status(200).json({
        success: true,
        message: 'Job posting updated successfully.',
        job: updatedJob,
      });
    } catch (error) {
      console.error('Update Job Error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error while updating job posting.',
        error: error.message,
      });
    }
  },

  /**
   * GET /api/jobs/my-jobs
   * Retrieve all jobs posted by the authenticated company with optional search and status filter
   */
  async getMyJobs(req, res) {
    try {
      const companyId = req.company.id;
      const { status, search } = req.query;
      const jobs = await JobPostingModel.findByCompanyId(companyId, { status, search });

      return res.status(200).json({
        success: true,
        total: jobs.length,
        jobs,
      });
    } catch (error) {
      console.error('Get My Jobs Error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error while retrieving company job postings.',
        error: error.message,
      });
    }
  },

  /**
   * DELETE /api/jobs/:id
   * Delete an existing job posting (BAT-39)
   */
  async deleteJob(req, res) {
    try {
      const jobId = parseInt(req.params.id, 10);
      const companyId = req.company.id;

      if (isNaN(jobId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid job posting ID.',
        });
      }

      const existingJob = await JobPostingModel.findById(jobId);
      if (!existingJob) {
        return res.status(404).json({
          success: false,
          message: 'Job posting not found.',
        });
      }

      if (existingJob.company_id !== companyId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You do not have permission to delete this job posting.',
        });
      }

      await JobPostingModel.deleteJobPosting(jobId, companyId);

      return res.status(200).json({
        success: true,
        message: 'Job posting deleted successfully.',
      });
    } catch (error) {
      console.error('Delete Job Error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error while deleting job posting.',
        error: error.message,
      });
    }
  },
};

module.exports = jobController;
