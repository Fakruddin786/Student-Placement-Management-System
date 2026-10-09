/**
 * Centralized Validation Rules and Utility Functions (BAT-38)
 * Implements comprehensive validation rules for:
 * 1. Company Registration
 * 2. Company Profile (Create and Edit)
 * 3. Job Postings (Create and Edit)
 * 4. Required Skills
 * 5. Eligibility Criteria
 */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[0-9+\-\s()]{7,20}$/;
const URL_REGEX = /^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(:\d+)?(\/.*)?$/;
const PINCODE_REGEX = /^[a-zA-Z0-9\s-]{4,10}$/;

/**
 * Validate Company Registration input (BAT-33 & BAT-38)
 * @param {Object} data
 * @returns {{ isValid: boolean, errors: Object, sanitized: Object }}
 */
function validateRegistrationData({ company_name, email, password, confirm_password, contact_number }) {
  const errors = {};
  const sanitized = {};

  // Company Name
  if (!company_name || !company_name.trim()) {
    errors.company_name = 'Company name is required.';
  } else {
    const trimmed = company_name.trim();
    if (trimmed.length < 2) {
      errors.company_name = 'Company name must be at least 2 characters.';
    } else if (trimmed.length > 100) {
      errors.company_name = 'Company name cannot exceed 100 characters.';
    } else {
      sanitized.company_name = trimmed;
    }
  }

  // Email
  if (!email || !email.trim()) {
    errors.email = 'Official email is required.';
  } else {
    const trimmed = email.trim();
    if (trimmed.length > 255) {
      errors.email = 'Email address cannot exceed 255 characters.';
    } else if (!EMAIL_REGEX.test(trimmed)) {
      errors.email = 'Please enter a valid email address.';
    } else {
      sanitized.email = trimmed.toLowerCase();
    }
  }

  // Contact Number
  if (!contact_number || !contact_number.trim()) {
    errors.contact_number = 'Contact number is required.';
  } else {
    const trimmed = contact_number.trim();
    const digitsOnly = trimmed.replace(/\D/g, '');
    if (!PHONE_REGEX.test(trimmed) || digitsOnly.length < 7) {
      errors.contact_number = 'Please enter a valid contact number (7-20 digits).';
    } else if (trimmed.length > 20) {
      errors.contact_number = 'Contact number cannot exceed 20 characters.';
    } else {
      sanitized.contact_number = trimmed;
    }
  }

  // Password
  if (!password) {
    errors.password = 'Password is required.';
  } else if (password.length < 6) {
    errors.password = 'Password must be at least 6 characters long.';
  } else if (password.length > 128) {
    errors.password = 'Password cannot exceed 128 characters.';
  }

  // Confirm Password
  if (!confirm_password) {
    errors.confirm_password = 'Confirm password is required.';
  } else if (password !== confirm_password) {
    errors.confirm_password = 'Passwords do not match.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    sanitized,
  };
}

/**
 * Validate Company Login input
 * @param {Object} data
 * @returns {{ isValid: boolean, errors: Object }}
 */
function validateLoginData({ email, password }) {
  const errors = {};

  if (!email || !email.trim()) {
    errors.email = 'Official email is required.';
  } else if (!EMAIL_REGEX.test(email.trim())) {
    errors.email = 'Please enter a valid email address.';
  }

  if (!password) {
    errors.password = 'Password is required.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validate Company Profile input (BAT-33, BAT-37, BAT-38)
 * @param {Object} profile
 * @returns {{ isValid: boolean, errors: Object, sanitized: Object }}
 */
function validateProfileData({
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
}) {
  const errors = {};
  const sanitized = {};

  // Company Name
  if (!company_name || !company_name.trim()) {
    errors.company_name = 'Company name is required.';
  } else {
    const trimmed = company_name.trim();
    if (trimmed.length < 2) {
      errors.company_name = 'Company name must be at least 2 characters.';
    } else if (trimmed.length > 100) {
      errors.company_name = 'Company name cannot exceed 100 characters.';
    } else {
      sanitized.company_name = trimmed;
    }
  }

  // Description
  if (!description || !description.trim()) {
    errors.description = 'Company description is required.';
  } else {
    const trimmed = description.trim();
    if (trimmed.length < 10) {
      errors.description = 'Description should be at least 10 characters long.';
    } else if (trimmed.length > 5000) {
      errors.description = 'Company description cannot exceed 5000 characters.';
    } else {
      sanitized.description = trimmed;
    }
  }

  // Industry
  if (!industry || !industry.trim()) {
    errors.industry = 'Industry field is required.';
  } else {
    const trimmed = industry.trim();
    if (trimmed.length < 2) {
      errors.industry = 'Industry name must be at least 2 characters.';
    } else if (trimmed.length > 100) {
      errors.industry = 'Industry name cannot exceed 100 characters.';
    } else {
      sanitized.industry = trimmed;
    }
  }

  // Website
  if (!website || !website.trim()) {
    errors.website = 'Company website is required.';
  } else {
    const trimmed = website.trim();
    if (trimmed.length > 255) {
      errors.website = 'Website URL cannot exceed 255 characters.';
    } else if (!URL_REGEX.test(trimmed)) {
      errors.website = 'Please enter a valid website URL (e.g., https://example.com).';
    } else {
      sanitized.website = trimmed;
    }
  }

  // Official Email
  if (!official_email || !official_email.trim()) {
    errors.official_email = 'Official email is required.';
  } else {
    const trimmed = official_email.trim();
    if (trimmed.length > 255) {
      errors.official_email = 'Official email cannot exceed 255 characters.';
    } else if (!EMAIL_REGEX.test(trimmed)) {
      errors.official_email = 'Please enter a valid official email address.';
    } else {
      sanitized.official_email = trimmed.toLowerCase();
    }
  }

  // Contact Number
  if (!contact_number || !contact_number.trim()) {
    errors.contact_number = 'Contact number is required.';
  } else {
    const trimmed = contact_number.trim();
    const digitsOnly = trimmed.replace(/\D/g, '');
    if (!PHONE_REGEX.test(trimmed) || digitsOnly.length < 7) {
      errors.contact_number = 'Please enter a valid contact number.';
    } else if (trimmed.length > 20) {
      errors.contact_number = 'Contact number cannot exceed 20 characters.';
    } else {
      sanitized.contact_number = trimmed;
    }
  }

  // Street Address
  if (!address || !address.trim()) {
    errors.address = 'Street address is required.';
  } else {
    const trimmed = address.trim();
    if (trimmed.length < 3) {
      errors.address = 'Street address must be at least 3 characters.';
    } else if (trimmed.length > 255) {
      errors.address = 'Street address cannot exceed 255 characters.';
    } else {
      sanitized.address = trimmed;
    }
  }

  // City
  if (!city || !city.trim()) {
    errors.city = 'City is required.';
  } else {
    const trimmed = city.trim();
    if (trimmed.length < 2) {
      errors.city = 'City must be at least 2 characters.';
    } else if (trimmed.length > 100) {
      errors.city = 'City cannot exceed 100 characters.';
    } else {
      sanitized.city = trimmed;
    }
  }

  // State
  if (!state || !state.trim()) {
    errors.state = 'State is required.';
  } else {
    const trimmed = state.trim();
    if (trimmed.length < 2) {
      errors.state = 'State must be at least 2 characters.';
    } else if (trimmed.length > 100) {
      errors.state = 'State cannot exceed 100 characters.';
    } else {
      sanitized.state = trimmed;
    }
  }

  // Pincode
  if (!pincode || !pincode.trim()) {
    errors.pincode = 'Pincode is required.';
  } else {
    const trimmed = pincode.trim();
    if (!PINCODE_REGEX.test(trimmed)) {
      errors.pincode = 'Please enter a valid postal pincode.';
    } else {
      sanitized.pincode = trimmed;
    }
  }

  // Logo URL (optional)
  if (logo_url !== undefined && logo_url !== null && logo_url.trim()) {
    const trimmed = logo_url.trim();
    if (trimmed.length > 500) {
      errors.logo_url = 'Logo URL cannot exceed 500 characters.';
    } else if (!URL_REGEX.test(trimmed)) {
      errors.logo_url = 'Please provide a valid logo image URL.';
    } else {
      sanitized.logo_url = trimmed;
    }
  } else {
    sanitized.logo_url = null;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    sanitized,
  };
}

/**
 * Validate Job Posting input data (BAT-35 & BAT-38)
 * @param {Object} jobData
 * @param {Object} [options]
 * @returns {{ isValid: boolean, errors: Object, sanitized: Object }}
 */
function validateJobPostingData(
  {
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
  },
  { isUpdate = false } = {}
) {
  const errors = {};
  const sanitized = {};
  const validEmploymentTypes = ['Full-time', 'Part-time', 'Internship', 'Contract'];
  const validStatuses = ['Draft', 'Active', 'Closed', 'Archived'];

  // Job Title
  if (!job_title || !job_title.trim()) {
    errors.job_title = 'Job title is required.';
  } else {
    const trimmed = job_title.trim();
    if (trimmed.length < 3) {
      errors.job_title = 'Job title must be at least 3 characters.';
    } else if (trimmed.length > 255) {
      errors.job_title = 'Job title cannot exceed 255 characters.';
    } else {
      sanitized.job_title = trimmed;
    }
  }

  // Description
  if (!description || !description.trim()) {
    errors.description = 'Job description is required.';
  } else {
    const trimmed = description.trim();
    if (trimmed.length < 10) {
      errors.description = 'Job description must be at least 10 characters.';
    } else if (trimmed.length > 5000) {
      errors.description = 'Job description cannot exceed 5000 characters.';
    } else {
      sanitized.description = trimmed;
    }
  }

  // Location
  if (!location || !location.trim()) {
    errors.location = 'Job location is required.';
  } else {
    const trimmed = location.trim();
    if (trimmed.length < 2) {
      errors.location = 'Job location must be at least 2 characters.';
    } else if (trimmed.length > 255) {
      errors.location = 'Job location cannot exceed 255 characters.';
    } else {
      sanitized.location = trimmed;
    }
  }

  // Employment Type
  if (employment_type) {
    if (!validEmploymentTypes.includes(employment_type)) {
      errors.employment_type = `Employment type must be one of: ${validEmploymentTypes.join(', ')}`;
    } else {
      sanitized.employment_type = employment_type;
    }
  } else {
    sanitized.employment_type = 'Full-time';
  }

  // Salary Validations
  let parsedMin = null;
  let parsedMax = null;

  if (salary_min !== undefined && salary_min !== null && salary_min !== '') {
    parsedMin = Number(salary_min);
    if (isNaN(parsedMin) || parsedMin < 0) {
      errors.salary_min = 'Minimum salary must be a valid positive number.';
    } else if (parsedMin > 999999999.99) {
      errors.salary_min = 'Minimum salary cannot exceed 999,999,999.99.';
    } else {
      sanitized.salary_min = parsedMin;
    }
  } else {
    sanitized.salary_min = null;
  }

  if (salary_max !== undefined && salary_max !== null && salary_max !== '') {
    parsedMax = Number(salary_max);
    if (isNaN(parsedMax) || parsedMax < 0) {
      errors.salary_max = 'Maximum salary must be a valid positive number.';
    } else if (parsedMax > 999999999.99) {
      errors.salary_max = 'Maximum salary cannot exceed 999,999,999.99.';
    } else {
      sanitized.salary_max = parsedMax;
    }
  } else {
    sanitized.salary_max = null;
  }

  if (parsedMin !== null && parsedMax !== null && !isNaN(parsedMin) && !isNaN(parsedMax)) {
    if (parsedMax < parsedMin) {
      errors.salary_max = 'Maximum salary cannot be lower than minimum salary.';
    }
  }

  // Application Deadline Validation
  if (!application_deadline) {
    errors.application_deadline = 'Application deadline is required.';
  } else {
    const deadlineDate = new Date(application_deadline);
    if (isNaN(deadlineDate.getTime())) {
      errors.application_deadline = 'Please provide a valid application deadline date.';
    } else {
      sanitized.application_deadline = application_deadline;
      if (!isUpdate) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const checkDate = new Date(deadlineDate);
        if (typeof application_deadline === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(application_deadline.trim())) {
          const [yr, mo, da] = application_deadline.trim().split('-').map(Number);
          checkDate.setFullYear(yr, mo - 1, da);
          checkDate.setHours(0, 0, 0, 0);
        }

        if (checkDate < today) {
          errors.application_deadline = 'Application deadline cannot be a past date.';
        }
      }
    }
  }

  // Status Validation
  if (status) {
    if (!validStatuses.includes(status)) {
      errors.status = `Status must be one of: ${validStatuses.join(', ')}`;
    } else {
      sanitized.status = status;
    }
  } else {
    sanitized.status = 'Active';
  }

  // BAT-36: Optional skills validation when provided
  if (skills !== undefined && skills !== null) {
    const skillsValidation = validateSkillsData(skills);
    if (!skillsValidation.isValid) {
      errors.skills = skillsValidation.errors.skills;
    } else {
      sanitized.skills = skillsValidation.sanitizedSkills;
    }
  }

  // BAT-36: Optional eligibility validation when provided
  if (eligibility !== undefined && eligibility !== null) {
    const eligibilityValidation = validateEligibilityData(eligibility);
    if (!eligibilityValidation.isValid) {
      Object.assign(errors, eligibilityValidation.errors);
    } else {
      sanitized.eligibility = eligibilityValidation.sanitized;
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    sanitized,
  };
}

/**
 * Validate Required Skills (BAT-36 & BAT-38)
 * @param {Array} skills
 * @param {Object} [options]
 * @returns {{ isValid: boolean, errors: Object, sanitizedSkills: Array }}
 */
function validateSkillsData(skills, { required = false } = {}) {
  const errors = {};
  const sanitizedSkills = [];
  const seenSkills = new Set();

  if (!Array.isArray(skills)) {
    errors.skills = 'Skills must be provided as an array of skill names.';
    return { isValid: false, errors, sanitizedSkills: [] };
  }

  if (required && skills.length === 0) {
    errors.skills = 'At least one skill is required.';
    return { isValid: false, errors, sanitizedSkills: [] };
  }

  if (skills.length > 30) {
    errors.skills = 'A maximum of 30 skills is allowed per job posting.';
    return { isValid: false, errors, sanitizedSkills: [] };
  }

  for (let i = 0; i < skills.length; i++) {
    const rawSkill = skills[i];

    if (typeof rawSkill !== 'string') {
      errors.skills = 'Each skill must be a text value.';
      break;
    }

    const trimmed = rawSkill.trim();

    if (!trimmed) {
      errors.skills = 'Skill name cannot be empty.';
      break;
    }

    if (trimmed.length > 100) {
      errors.skills = `Skill "${trimmed}" exceeds maximum allowed length of 100 characters.`;
      break;
    }

    const normalizedLower = trimmed.toLowerCase();
    if (seenSkills.has(normalizedLower)) {
      errors.skills = `Duplicate skill "${trimmed}" is not allowed.`;
      break;
    }

    seenSkills.add(normalizedLower);
    sanitizedSkills.push(trimmed);
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    sanitizedSkills,
  };
}

/**
 * Validate Eligibility Criteria (BAT-36 & BAT-38)
 * @param {Object} eligibility
 * @returns {{ isValid: boolean, errors: Object, sanitized: Object|null }}
 */
function validateEligibilityData(eligibility) {
  const errors = {};

  if (!eligibility || typeof eligibility !== 'object') {
    return { isValid: true, errors: {}, sanitized: null };
  }

  const {
    minimum_qualification,
    minimum_cgpa,
    minimum_percentage,
    graduation_year,
    experience_required,
    eligible_branches,
    additional_requirements,
  } = eligibility;

  const sanitized = {};

  // Minimum CGPA: numeric between 0.0 and 10.0
  if (minimum_cgpa !== undefined && minimum_cgpa !== null && minimum_cgpa !== '') {
    const cgpa = Number(minimum_cgpa);
    if (isNaN(cgpa) || cgpa < 0 || cgpa > 10) {
      errors.minimum_cgpa = 'Minimum CGPA must be a valid number between 0.0 and 10.0.';
    } else {
      sanitized.minimum_cgpa = cgpa;
    }
  } else {
    sanitized.minimum_cgpa = null;
  }

  // Minimum Percentage: numeric between 0 and 100
  if (minimum_percentage !== undefined && minimum_percentage !== null && minimum_percentage !== '') {
    const pct = Number(minimum_percentage);
    if (isNaN(pct) || pct < 0 || pct > 100) {
      errors.minimum_percentage = 'Minimum percentage must be a valid number between 0 and 100.';
    } else {
      sanitized.minimum_percentage = pct;
    }
  } else {
    sanitized.minimum_percentage = null;
  }

  // Graduation Year: 4-digit valid year between 1990 and 2100
  if (graduation_year !== undefined && graduation_year !== null && graduation_year !== '') {
    const yr = Number(graduation_year);
    if (isNaN(yr) || !Number.isInteger(yr) || yr < 1990 || yr > 2100) {
      errors.graduation_year = 'Graduation year must be a valid 4-digit year (e.g. 2026).';
    } else {
      sanitized.graduation_year = yr;
    }
  } else {
    sanitized.graduation_year = null;
  }

  // Minimum Qualification
  if (minimum_qualification !== undefined && minimum_qualification !== null && minimum_qualification !== '') {
    if (typeof minimum_qualification !== 'string') {
      errors.minimum_qualification = 'Minimum qualification must be a text value.';
    } else {
      const trimmed = minimum_qualification.trim();
      if (trimmed.length > 255) {
        errors.minimum_qualification = 'Minimum qualification cannot exceed 255 characters.';
      } else if (trimmed.length < 2) {
        errors.minimum_qualification = 'Minimum qualification must be at least 2 characters.';
      } else {
        sanitized.minimum_qualification = trimmed;
      }
    }
  } else {
    sanitized.minimum_qualification = null;
  }

  // Experience Required
  if (experience_required !== undefined && experience_required !== null && experience_required !== '') {
    if (typeof experience_required !== 'string') {
      errors.experience_required = 'Experience required must be a text value.';
    } else {
      const trimmed = experience_required.trim();
      if (trimmed.length > 100) {
        errors.experience_required = 'Experience required cannot exceed 100 characters.';
      } else if (/-\d+/.test(trimmed)) {
        errors.experience_required = 'Experience required cannot be a negative value.';
      } else {
        sanitized.experience_required = trimmed;
      }
    }
  } else {
    sanitized.experience_required = null;
  }

  // Eligible Branches (no empty entries, deduplicate, trim)
  if (eligible_branches !== undefined && eligible_branches !== null && eligible_branches !== '') {
    if (typeof eligible_branches !== 'string') {
      errors.eligible_branches = 'Eligible branches must be a comma-separated text string.';
    } else {
      const trimmed = eligible_branches.trim();
      if (trimmed.length > 255) {
        errors.eligible_branches = 'Eligible branches cannot exceed 255 characters.';
      } else {
        const rawBranches = trimmed.split(',').map((b) => b.trim());
        if (rawBranches.some((b) => b === '')) {
          errors.eligible_branches = 'Eligible branches cannot contain empty entries.';
        } else {
          const seenBranches = new Set();
          const cleanBranches = [];
          for (const b of rawBranches) {
            const lower = b.toLowerCase();
            if (seenBranches.has(lower)) {
              errors.eligible_branches = `Duplicate branch "${b}" is not allowed.`;
              break;
            }
            seenBranches.add(lower);
            cleanBranches.push(b);
          }
          if (!errors.eligible_branches) {
            sanitized.eligible_branches = cleanBranches.join(', ');
          }
        }
      }
    }
  } else {
    sanitized.eligible_branches = null;
  }

  // Additional Requirements
  if (additional_requirements !== undefined && additional_requirements !== null && additional_requirements !== '') {
    if (typeof additional_requirements !== 'string') {
      errors.additional_requirements = 'Additional requirements must be a text value.';
    } else {
      const trimmed = additional_requirements.trim();
      if (trimmed.length > 2000) {
        errors.additional_requirements = 'Additional requirements cannot exceed 2000 characters.';
      } else {
        sanitized.additional_requirements = trimmed;
      }
    }
  } else {
    sanitized.additional_requirements = null;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    sanitized,
  };
}

module.exports = {
  EMAIL_REGEX,
  PHONE_REGEX,
  URL_REGEX,
  PINCODE_REGEX,
  validateRegistrationData,
  validateLoginData,
  validateProfileData,
  validateJobPostingData,
  validateSkillsData,
  validateEligibilityData,
};
