/**
 * Frontend Validation Rules & Utilities (BAT-38)
 * Mirrors backend rules to provide immediate client-side feedback and prevent invalid form submissions
 */

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PHONE_REGEX = /^[0-9+\-\s()]{7,20}$/;
export const URL_REGEX = /^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(:\d+)?(\/.*)?$/;
export const PINCODE_REGEX = /^[a-zA-Z0-9\s-]{4,10}$/;

/**
 * Validate Company Registration Form (BAT-33 & BAT-38)
 */
export function validateRegistrationData({ company_name, email, password, confirm_password, contact_number }) {
  const errors = {};

  // Company Name
  if (!company_name || !company_name.trim()) {
    errors.company_name = 'Company name is required.';
  } else {
    const trimmed = company_name.trim();
    if (trimmed.length < 2) {
      errors.company_name = 'Company name must be at least 2 characters.';
    } else if (trimmed.length > 100) {
      errors.company_name = 'Company name cannot exceed 100 characters.';
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
    }
  }

  // Password
  if (!password) {
    errors.password = 'Password is required.';
  } else if (password.length < 6) {
    errors.password = 'Password must be at least 6 characters.';
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
  };
}

/**
 * Validate Company Profile Form (BAT-33, BAT-37, BAT-38)
 */
export function validateProfileData({
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

  // Company Name
  if (!company_name || !company_name.trim()) {
    errors.company_name = 'Company name is required.';
  } else {
    const trimmed = company_name.trim();
    if (trimmed.length < 2) {
      errors.company_name = 'Company name must be at least 2 characters.';
    } else if (trimmed.length > 100) {
      errors.company_name = 'Company name cannot exceed 100 characters.';
    }
  }

  // Description
  if (!description || !description.trim()) {
    errors.description = 'Company description is required.';
  } else {
    const trimmed = description.trim();
    if (trimmed.length < 10) {
      errors.description = 'Description should be at least 10 characters.';
    } else if (trimmed.length > 5000) {
      errors.description = 'Company description cannot exceed 5000 characters.';
    }
  }

  // Industry
  if (!industry || !industry.trim()) {
    errors.industry = 'Industry is required.';
  } else {
    const trimmed = industry.trim();
    if (trimmed.length < 2) {
      errors.industry = 'Industry must be at least 2 characters.';
    } else if (trimmed.length > 100) {
      errors.industry = 'Industry cannot exceed 100 characters.';
    }
  }

  // Website
  if (!website || !website.trim()) {
    errors.website = 'Website URL is required.';
  } else {
    const trimmed = website.trim();
    if (trimmed.length > 255) {
      errors.website = 'Website URL cannot exceed 255 characters.';
    } else if (!URL_REGEX.test(trimmed)) {
      errors.website = 'Please enter a valid website URL (e.g., https://example.com).';
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
      errors.official_email = 'Please enter a valid email address.';
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
    }
  }

  // Pincode
  if (!pincode || !pincode.trim()) {
    errors.pincode = 'Pincode is required.';
  } else {
    const trimmed = pincode.trim();
    if (!PINCODE_REGEX.test(trimmed)) {
      errors.pincode = 'Please enter a valid postal pincode (e.g. 560100).';
    }
  }

  // Logo URL (optional)
  if (logo_url !== undefined && logo_url !== null && logo_url.trim()) {
    const trimmed = logo_url.trim();
    if (trimmed.length > 500) {
      errors.logo_url = 'Logo URL cannot exceed 500 characters.';
    } else if (!URL_REGEX.test(trimmed)) {
      errors.logo_url = 'Please provide a valid image URL for logo.';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validate Job Posting Form (BAT-35 & BAT-38)
 */
export function validateJobPostingData(
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
    }
  }

  // Employment Type
  if (employment_type && !validEmploymentTypes.includes(employment_type)) {
    errors.employment_type = `Employment type must be one of: ${validEmploymentTypes.join(', ')}`;
  }

  // Salary Validations
  let parsedMin = null;
  let parsedMax = null;

  if (salary_min !== undefined && salary_min !== null && salary_min !== '') {
    parsedMin = Number(salary_min);
    if (isNaN(parsedMin) || parsedMin < 0) {
      errors.salary_min = 'Minimum salary must be a positive number.';
    } else if (parsedMin > 999999999.99) {
      errors.salary_min = 'Minimum salary cannot exceed 999,999,999.99.';
    }
  }

  if (salary_max !== undefined && salary_max !== null && salary_max !== '') {
    parsedMax = Number(salary_max);
    if (isNaN(parsedMax) || parsedMax < 0) {
      errors.salary_max = 'Maximum salary must be a positive number.';
    } else if (parsedMax > 999999999.99) {
      errors.salary_max = 'Maximum salary cannot exceed 999,999,999.99.';
    }
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
      errors.application_deadline = 'Please select a valid deadline date.';
    } else if (!isUpdate) {
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

  // Status Validation
  if (status && !validStatuses.includes(status)) {
    errors.status = `Status must be one of: ${validStatuses.join(', ')}`;
  }

  // Skills Validation
  if (skills !== undefined && skills !== null) {
    const skillsValidation = validateSkillsData(skills);
    if (!skillsValidation.isValid) {
      errors.skills = skillsValidation.errors.skills;
    }
  }

  // Eligibility Validation
  if (eligibility !== undefined && eligibility !== null) {
    const eligibilityValidation = validateEligibilityData(eligibility);
    if (!eligibilityValidation.isValid) {
      Object.assign(errors, eligibilityValidation.errors);
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validate Required Skills (BAT-36 & BAT-38)
 */
export function validateSkillsData(skills, { required = false } = {}) {
  const errors = {};
  const sanitizedSkills = [];
  const seenSkills = new Set();

  if (!Array.isArray(skills)) {
    errors.skills = 'Skills must be an array of skill names.';
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
 */
export function validateEligibilityData(eligibility) {
  const errors = {};

  if (!eligibility || typeof eligibility !== 'object') {
    return { isValid: true, errors: {} };
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

  // Minimum CGPA
  if (minimum_cgpa !== undefined && minimum_cgpa !== null && minimum_cgpa !== '') {
    const cgpa = Number(minimum_cgpa);
    if (isNaN(cgpa) || cgpa < 0 || cgpa > 10) {
      errors.minimum_cgpa = 'CGPA must be a number between 0.0 and 10.0.';
    }
  }

  // Minimum Percentage
  if (minimum_percentage !== undefined && minimum_percentage !== null && minimum_percentage !== '') {
    const pct = Number(minimum_percentage);
    if (isNaN(pct) || pct < 0 || pct > 100) {
      errors.minimum_percentage = 'Percentage must be a number between 0 and 100.';
    }
  }

  // Graduation Year
  if (graduation_year !== undefined && graduation_year !== null && graduation_year !== '') {
    const yr = Number(graduation_year);
    if (isNaN(yr) || !Number.isInteger(yr) || yr < 1990 || yr > 2100) {
      errors.graduation_year = 'Please enter a valid 4-digit graduation year (e.g. 2026).';
    }
  }

  // Minimum Qualification
  if (minimum_qualification && typeof minimum_qualification === 'string') {
    const trimmed = minimum_qualification.trim();
    if (trimmed.length > 255) {
      errors.minimum_qualification = 'Minimum qualification cannot exceed 255 characters.';
    } else if (trimmed.length > 0 && trimmed.length < 2) {
      errors.minimum_qualification = 'Minimum qualification must be at least 2 characters.';
    }
  }

  // Experience Required
  if (experience_required && typeof experience_required === 'string') {
    const trimmed = experience_required.trim();
    if (trimmed.length > 100) {
      errors.experience_required = 'Experience required cannot exceed 100 characters.';
    } else if (/-\d+/.test(trimmed)) {
      errors.experience_required = 'Experience required cannot be a negative value.';
    }
  }

  // Eligible Branches
  if (eligible_branches && typeof eligible_branches === 'string') {
    const trimmed = eligible_branches.trim();
    if (trimmed.length > 255) {
      errors.eligible_branches = 'Eligible branches cannot exceed 255 characters.';
    } else {
      const rawBranches = trimmed.split(',').map((b) => b.trim());
      if (rawBranches.some((b) => b === '')) {
        errors.eligible_branches = 'Eligible branches cannot contain empty entries.';
      } else {
        const seenBranches = new Set();
        for (const b of rawBranches) {
          const lower = b.toLowerCase();
          if (seenBranches.has(lower)) {
            errors.eligible_branches = `Duplicate branch "${b}" is not allowed.`;
            break;
          }
          seenBranches.add(lower);
        }
      }
    }
  }

  // Additional Requirements
  if (additional_requirements && typeof additional_requirements === 'string') {
    const trimmed = additional_requirements.trim();
    if (trimmed.length > 2000) {
      errors.additional_requirements = 'Additional requirements cannot exceed 2000 characters.';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
