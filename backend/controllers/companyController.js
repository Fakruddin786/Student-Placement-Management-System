const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const CompanyModel = require('../models/companyModel');
const {
  validateRegistrationData,
  validateLoginData,
  validateProfileData,
} = require('../utils/validation');

/**
 * Company Controller for BAT-33
 * Handles registration, authentication, and profile management
 */
const companyController = {
  /**
   * POST /api/companies/register
   * Registers a new company account
   */
  async register(req, res) {
    try {
      const { company_name, email, password, confirm_password, contact_number } = req.body;

      // 1. Validate request data
      const validation = validateRegistrationData({
        company_name,
        email,
        password,
        confirm_password,
        contact_number,
      });

      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed. Please correct the highlighted errors.',
          errors: validation.errors,
        });
      }

      // 2. Check whether email already exists
      const existingCompany = await CompanyModel.findByEmail(validation.sanitized?.email || email);
      if (existingCompany) {
        return res.status(409).json({
          success: false,
          message: 'An account with this email already exists.',
          errors: { email: 'An account with this email already exists.' },
        });
      }

      // 3. Hash the password using bcrypt
      const saltRounds = 10;
      const password_hash = await bcrypt.hash(password, saltRounds);

      // 4. Create company account in MySQL with sanitized values
      const newCompany = await CompanyModel.createCompany({
        company_name: validation.sanitized?.company_name || company_name,
        email: validation.sanitized?.email || email,
        password_hash,
        contact_number: validation.sanitized?.contact_number || contact_number,
      });

      // 5. Return a safe success response (Never return password)
      return res.status(201).json({
        success: true,
        message: 'Company registered successfully! You can now log in.',
        company: {
          id: newCompany.id,
          company_name: newCompany.company_name,
          email: newCompany.email,
          contact_number: newCompany.contact_number,
        },
      });
    } catch (error) {
      console.error('Registration Error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error during registration.',
        error: error.message,
      });
    }
  },

  /**
   * POST /api/companies/login
   * Authenticates company and returns JWT
   */
  async login(req, res) {
    try {
      const { email, password } = req.body;

      // 1. Validate request data
      const validation = validateLoginData({ email, password });
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: 'Please provide both email and password.',
          errors: validation.errors,
        });
      }

      // 2. Verify email existence
      const company = await CompanyModel.findByEmail(email);
      if (!company) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password.',
        });
      }

      // 3. Verify password with bcrypt
      const isMatch = await bcrypt.compare(password, company.password_hash);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password.',
        });
      }

      // 4. Generate JWT
      const secret = process.env.JWT_SECRET;
      const expiresIn = process.env.JWT_EXPIRES_IN || '24h';

      const token = jwt.sign(
        {
          id: company.id,
          email: company.email,
          company_name: company.company_name,
        },
        secret,
        { expiresIn }
      );

      // 5. Return JWT safely without exposing password_hash
      return res.status(200).json({
        success: true,
        message: 'Login successful.',
        token,
        company: {
          id: company.id,
          company_name: company.company_name,
          email: company.email,
          contact_number: company.contact_number,
        },
      });
    } catch (error) {
      console.error('Login Error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error during login.',
        error: error.message,
      });
    }
  },

  /**
   * POST /api/companies/profile
   * Protected: Creates or updates profile for the authenticated company
   */
  async createProfile(req, res) {
    try {
      const company_id = req.company.id;
      const {
        company_name,
        description,
        industry,
        website,
        official_email,
        contact_number,
        address,
        city,
        state,
        pincode,
        logo_url,
      } = req.body;

      // 1. Validate profile data
      const validation = validateProfileData({
        company_name,
        description,
        industry,
        website,
        official_email,
        contact_number,
        address,
        city,
        state,
        pincode,
        logo_url,
      });

      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed. Please correct the profile details.',
          errors: validation.errors,
        });
      }

      // 2. Save profile in MySQL against company_id with sanitized values
      const profileToSave = validation.sanitized || {
        company_name,
        description,
        industry,
        website,
        official_email,
        contact_number,
        address,
        city,
        state,
        pincode,
        logo_url,
      };

      const savedProfile = await CompanyModel.saveProfile({
        company_id,
        ...profileToSave,
      });

      return res.status(201).json({
        success: true,
        message: 'Company profile saved successfully.',
        profile: savedProfile,
      });
    } catch (error) {
      console.error('Profile Creation Error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error while saving company profile.',
        error: error.message,
      });
    }
  },

  /**
   * GET /api/companies/profile
   * Protected: Retrieves profile of the authenticated company
   */
  async getProfile(req, res) {
    try {
      const company_id = req.company.id;
      const profile = await CompanyModel.findProfileByCompanyId(company_id);
      const company = await CompanyModel.findById(company_id);

      if (!profile) {
        return res.status(200).json({
          success: true,
          hasProfile: false,
          message: 'No company profile found yet. Please create your profile.',
          company: company,
          profile: null,
        });
      }

      return res.status(200).json({
        success: true,
        hasProfile: true,
        company: company,
        profile,
      });
    } catch (error) {
      console.error('Get Profile Error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error while retrieving profile.',
        error: error.message,
      });
    }
  },

  /**
   * PUT /api/companies/profile
   * Protected: Updates the profile of the authenticated company (BAT-37)
   */
  async updateProfile(req, res) {
    try {
      const company_id = req.company.id; // Strictly from verified JWT
      const existingProfile = await CompanyModel.findProfileByCompanyId(company_id);

      const {
        company_name,
        description,
        industry,
        website,
        official_email,
        contact_number,
        address,
        city,
        state,
        pincode,
        logo_url,
      } = req.body;

      // Fallback to existing values if fields are omitted in partial update
      const profileToValidate = {
        company_name: company_name !== undefined ? company_name : existingProfile?.company_name,
        description: description !== undefined ? description : existingProfile?.description,
        industry: industry !== undefined ? industry : existingProfile?.industry,
        website: website !== undefined ? website : existingProfile?.website,
        official_email: official_email !== undefined ? official_email : existingProfile?.official_email,
        contact_number: contact_number !== undefined ? contact_number : existingProfile?.contact_number,
        address: address !== undefined ? address : existingProfile?.address,
        city: city !== undefined ? city : existingProfile?.city,
        state: state !== undefined ? state : existingProfile?.state,
        pincode: pincode !== undefined ? pincode : existingProfile?.pincode,
        logo_url: logo_url !== undefined ? logo_url : existingProfile?.logo_url,
      };

      const validation = validateProfileData(profileToValidate);

      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed. Please correct the profile details.',
          errors: validation.errors,
        });
      }

      // Save updated profile using sanitized values
      const profileToSave = validation.sanitized || profileToValidate;

      const updatedProfile = await CompanyModel.saveProfile({
        company_id,
        ...profileToSave,
      });

      // Synchronize core company account fields (company_name, contact_number)
      await CompanyModel.updateCompany(company_id, {
        company_name: profileToSave.company_name,
        contact_number: profileToSave.contact_number,
      });

      return res.status(200).json({
        success: true,
        message: 'Company profile updated successfully.',
        profile: updatedProfile,
      });
    } catch (error) {
      console.error('Profile Update Error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error while updating company profile.',
        error: error.message,
      });
    }
  },
};

module.exports = companyController;
