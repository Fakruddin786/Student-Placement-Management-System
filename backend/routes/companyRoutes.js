const express = require('express');
const router = express.Router();
const companyController = require('../controllers/companyController');
const { authenticateCompany } = require('../middleware/authMiddleware');

// ==============================================================
// BAT-33: Company Registration & Profile Creation Routes
// ==============================================================

// Public routes
router.post('/register', companyController.register);
router.post('/login', companyController.login);

// Protected routes (JWT Authentication Required)
router.post('/profile', authenticateCompany, companyController.createProfile);
router.get('/profile', authenticateCompany, companyController.getProfile);
router.put('/profile', authenticateCompany, companyController.updateProfile); // BAT-37: Profile Edit / Update
router.patch('/profile', authenticateCompany, companyController.updateProfile);

// ==============================================================
// Extension Points for Future Jira Subtasks:
// - BAT-39: router.get('/:id/jobs', authenticateCompany, jobController.getCompanyJobs);
// ==============================================================

module.exports = router;
