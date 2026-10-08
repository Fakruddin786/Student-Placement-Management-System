const express = require('express');
const router = express.Router();
const jobController = require('../controllers/jobController');
const { authenticateCompany } = require('../middleware/authMiddleware');

// ==============================================================
// BAT-35: Job Posting Create and Edit Routes
// ==============================================================

// Create job posting (Requires authenticated company)
router.post('/', authenticateCompany, jobController.createJob);

// Retrieve all jobs for the authenticated company
router.get('/my-jobs', authenticateCompany, jobController.getMyJobs);

// Retrieve single job details by ID (Requires authenticated owner company)
router.get('/my-jobs/:id', authenticateCompany, jobController.getJobById);
router.get('/:id', authenticateCompany, jobController.getJobById);

// Update existing job posting (Requires authenticated owner company)
router.put('/:id', authenticateCompany, jobController.updateJob);

// Delete existing job posting (Requires authenticated owner company) (BAT-39)
router.delete('/:id', authenticateCompany, jobController.deleteJob);

module.exports = router;
