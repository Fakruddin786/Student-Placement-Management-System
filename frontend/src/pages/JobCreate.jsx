import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import companyService from '../services/companyService';
import jobService from '../services/jobService';
import FormInput from '../components/FormInput';
import { validateJobPostingData } from '../utils/validation';

export default function JobCreate() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    job_title: '',
    description: '',
    location: '',
    employment_type: 'Full-time',
    salary_min: '',
    salary_max: '',
    application_deadline: '',
    status: 'Active',
  });

  // BAT-36: Required Skills State
  const [skills, setSkills] = useState([]);
  const [skillInput, setSkillInput] = useState('');
  const [skillError, setSkillError] = useState('');

  // BAT-36: Eligibility Criteria State
  const [eligibility, setEligibility] = useState({
    minimum_qualification: '',
    minimum_cgpa: '',
    minimum_percentage: '',
    graduation_year: '',
    experience_required: 'Fresher',
    eligible_branches: '',
    additional_requirements: '',
  });

  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Protected route: Ensure company is authenticated
    if (!companyService.isAuthenticated()) {
      navigate('/company/login', {
        state: { msg: 'Please log in to create a job posting.' },
      });
    }
  }, [navigate]);

  const handleAddSkill = (e) => {
    if (e) e.preventDefault();
    const trimmed = skillInput.trim();

    if (!trimmed) {
      setSkillError('Please enter a skill name.');
      return;
    }
    if (trimmed.length > 100) {
      setSkillError('Skill name cannot exceed 100 characters.');
      return;
    }
    if (skills.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
      setSkillError(`Skill "${trimmed}" has already been added.`);
      return;
    }

    setSkills((prev) => [...prev, trimmed]);
    setSkillInput('');
    setSkillError('');
  };

  const handleRemoveSkill = (indexToRemove) => {
    setSkills((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleEligibilityChange = (e) => {
    const { name, value } = e.target;
    setEligibility((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateFrontend = () => {
    const validation = validateJobPostingData(
      {
        ...formData,
        skills,
        eligibility,
      },
      { isUpdate: false }
    );

    setErrors(validation.errors);
    return validation.isValid;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
    setServerError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    setSuccessMessage('');

    if (!validateFrontend()) {
      return;
    }

    setLoading(true);

    try {
      const payload = {
        ...formData,
        salary_min: formData.salary_min !== '' ? Number(formData.salary_min) : null,
        salary_max: formData.salary_max !== '' ? Number(formData.salary_max) : null,
        skills,
        eligibility: {
          minimum_qualification: eligibility.minimum_qualification.trim() || null,
          minimum_cgpa: eligibility.minimum_cgpa !== '' ? Number(eligibility.minimum_cgpa) : null,
          minimum_percentage: eligibility.minimum_percentage !== '' ? Number(eligibility.minimum_percentage) : null,
          graduation_year: eligibility.graduation_year !== '' ? Number(eligibility.graduation_year) : null,
          experience_required: eligibility.experience_required.trim() || null,
          eligible_branches: eligibility.eligible_branches.trim() || null,
          additional_requirements: eligibility.additional_requirements.trim() || null,
        },
      };

      const response = await jobService.createJob(payload);

      if (response.success) {
        setSuccessMessage('Job posting created successfully! Redirecting to profile...');
        setTimeout(() => {
          navigate('/company/profile', {
            state: { msg: 'Job posting published successfully!' },
          });
        }, 1500);
      }
    } catch (err) {
      console.error('Job creation error:', err);
      if (err.response?.data?.errors) {
        setErrors(err.response.data.errors);
      }
      setServerError(
        err.response?.data?.message || 'Failed to create job posting. Please check your inputs.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-12 col-lg-9">
          {/* Breadcrumb Navigation */}
          <nav aria-label="breadcrumb" className="mb-3">
            <ol className="breadcrumb">
              <li className="breadcrumb-item">
                <Link to="/company/profile">Company Profile</Link>
              </li>
              <li className="breadcrumb-item active" aria-current="page">
                Create Job Posting
              </li>
            </ol>
          </nav>

          <div className="card shadow-lg border-0 rounded-4">
            <div className="card-header bg-gradient bg-primary text-white py-4 px-4 px-md-5 rounded-top-4">
              <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                <div>
                  <h3 className="fw-bold mb-1">Create New Job Posting</h3>
                  <p className="mb-0 text-white-50">
                    Jira Subtask <span className="badge bg-warning text-dark">BAT-36</span> | Required Skills & Eligibility Criteria
                  </p>
                </div>
                <Link to="/company/profile" className="btn btn-outline-light btn-sm px-3">
                  Back to Profile
                </Link>
              </div>
            </div>

            <div className="card-body p-4 p-md-5">
              {serverError && (
                <div className="alert alert-danger d-flex align-items-center" role="alert">
                  <div>
                    <strong>Creation Error:</strong> {serverError}
                  </div>
                </div>
              )}

              {successMessage && (
                <div className="alert alert-success d-flex align-items-center" role="alert">
                  <div>{successMessage}</div>
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate>
                {/* 1. Job Basic Details */}
                <h5 className="fw-bold text-primary mb-3">1. Role & Position Details</h5>

                <FormInput
                  label="Job Title"
                  id="job_title"
                  name="job_title"
                  value={formData.job_title}
                  onChange={handleChange}
                  placeholder="e.g. Graduate Software Engineer (Backend)"
                  required
                  error={errors.job_title}
                  disabled={loading}
                />

                <FormInput
                  label="Job Description"
                  id="description"
                  name="description"
                  type="textarea"
                  rows={4}
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Describe key responsibilities, project scope, tech stack, and what the role entails..."
                  required
                  error={errors.description}
                  disabled={loading}
                  helpText="Minimum 10 characters."
                />

                <div className="row">
                  <div className="col-md-6">
                    <FormInput
                      label="Job Location"
                      id="location"
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      placeholder="e.g. Bengaluru, India (Hybrid) or Remote"
                      required
                      error={errors.location}
                      disabled={loading}
                    />
                  </div>

                  <div className="col-md-6">
                    <div className="mb-3">
                      <label htmlFor="employment_type" className="form-label fw-semibold">
                        Employment Type <span className="text-danger">*</span>
                      </label>
                      <select
                        id="employment_type"
                        name="employment_type"
                        className={`form-select ${errors.employment_type ? 'is-invalid' : ''}`}
                        value={formData.employment_type}
                        onChange={handleChange}
                        disabled={loading}
                      >
                        <option value="Full-time">Full-time</option>
                        <option value="Part-time">Part-time</option>
                        <option value="Internship">Internship</option>
                        <option value="Contract">Contract</option>
                      </select>
                      {errors.employment_type && (
                        <div className="invalid-feedback d-block">{errors.employment_type}</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 2. Compensation & Timeline */}
                <h5 className="fw-bold text-primary mt-4 mb-3">2. Compensation & Timeline</h5>

                <div className="row">
                  <div className="col-md-6">
                    <FormInput
                      label="Minimum Salary / CTC (Annual ₹)"
                      id="salary_min"
                      name="salary_min"
                      type="number"
                      value={formData.salary_min}
                      onChange={handleChange}
                      placeholder="e.g. 600000"
                      error={errors.salary_min}
                      disabled={loading}
                      helpText="Optional (Leave blank if not disclosed)"
                    />
                  </div>

                  <div className="col-md-6">
                    <FormInput
                      label="Maximum Salary / CTC (Annual ₹)"
                      id="salary_max"
                      name="salary_max"
                      type="number"
                      value={formData.salary_max}
                      onChange={handleChange}
                      placeholder="e.g. 1000000"
                      error={errors.salary_max}
                      disabled={loading}
                      helpText="Must be greater than or equal to minimum salary"
                    />
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6">
                    <FormInput
                      label="Application Deadline"
                      id="application_deadline"
                      name="application_deadline"
                      type="date"
                      value={formData.application_deadline}
                      onChange={handleChange}
                      required
                      error={errors.application_deadline}
                      disabled={loading}
                    />
                  </div>

                  <div className="col-md-6">
                    <div className="mb-3">
                      <label htmlFor="status" className="form-label fw-semibold">
                        Initial Job Status <span className="text-danger">*</span>
                      </label>
                      <select
                        id="status"
                        name="status"
                        className={`form-select ${errors.status ? 'is-invalid' : ''}`}
                        value={formData.status}
                        onChange={handleChange}
                        disabled={loading}
                      >
                        <option value="Active">Active (Accepting applications)</option>
                        <option value="Draft">Draft (Private, not visible yet)</option>
                        <option value="Closed">Closed</option>
                      </select>
                      {errors.status && (
                        <div className="invalid-feedback d-block">{errors.status}</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 3. Required Skills (BAT-36) */}
                <h5 className="fw-bold text-primary mt-4 mb-3">3. Required Skills</h5>
                <div className="card bg-light border-0 rounded-3 p-3 mb-4">
                  <div className="row g-2 align-items-center">
                    <div className="col-12 col-md-9">
                      <div className="input-group">
                        <span className="input-group-text bg-white border-end-0">
                          <i className="bi bi-tools text-muted"></i> 🎯
                        </span>
                        <input
                          type="text"
                          className={`form-control border-start-0 ${skillError ? 'is-invalid' : ''}`}
                          placeholder="e.g. Java, React, SQL, Python, Git..."
                          value={skillInput}
                          onChange={(e) => {
                            setSkillInput(e.target.value);
                            setSkillError('');
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddSkill();
                            }
                          }}
                          disabled={loading}
                        />
                      </div>
                      {skillError && <div className="invalid-feedback d-block mt-1">{skillError}</div>}
                      {errors.skills && <div className="invalid-feedback d-block mt-1">{errors.skills}</div>}
                    </div>
                    <div className="col-12 col-md-3">
                      <button
                        type="button"
                        className="btn btn-outline-primary w-100 fw-semibold"
                        onClick={handleAddSkill}
                        disabled={loading}
                      >
                        + Add Skill
                      </button>
                    </div>
                  </div>

                  {/* Skills Chips / Badges Display */}
                  <div className="mt-3">
                    {skills.length === 0 ? (
                      <span className="text-muted small fst-italic">
                        No skills added yet. Type a skill above and press Add or Enter.
                      </span>
                    ) : (
                      <div className="d-flex flex-wrap gap-2">
                        {skills.map((skill, index) => (
                          <span
                            key={index}
                            className="badge bg-primary fs-6 px-3 py-2 rounded-pill d-inline-flex align-items-center shadow-sm"
                          >
                            <span>{skill}</span>
                            <button
                              type="button"
                              className="btn-close btn-close-white ms-2"
                              style={{ width: '0.5rem', height: '0.5rem' }}
                              aria-label={`Remove ${skill}`}
                              onClick={() => handleRemoveSkill(index)}
                              disabled={loading}
                            ></button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* 4. Eligibility Criteria (BAT-36) */}
                <h5 className="fw-bold text-primary mt-4 mb-3">4. Eligibility Criteria</h5>
                <div className="card bg-light border-0 rounded-3 p-3 mb-4">
                  <div className="row">
                    <div className="col-md-6">
                      <FormInput
                        label="Minimum Qualification / Degree"
                        id="minimum_qualification"
                        name="minimum_qualification"
                        value={eligibility.minimum_qualification}
                        onChange={handleEligibilityChange}
                        placeholder="e.g. B.Tech / B.E. / M.Tech / MCA"
                        error={errors.minimum_qualification}
                        disabled={loading}
                        helpText="Degree requirements for candidates"
                      />
                    </div>
                    <div className="col-md-6">
                      <FormInput
                        label="Eligible Branches / Specializations"
                        id="eligible_branches"
                        name="eligible_branches"
                        value={eligibility.eligible_branches}
                        onChange={handleEligibilityChange}
                        placeholder="e.g. Computer Science, IT, Electronics"
                        error={errors.eligible_branches}
                        disabled={loading}
                        helpText="Comma-separated branches eligible to apply"
                      />
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-4">
                      <FormInput
                        label="Minimum CGPA (Scale 0-10)"
                        id="minimum_cgpa"
                        name="minimum_cgpa"
                        type="number"
                        step="0.01"
                        value={eligibility.minimum_cgpa}
                        onChange={handleEligibilityChange}
                        placeholder="e.g. 7.00"
                        error={errors.minimum_cgpa}
                        disabled={loading}
                        helpText="e.g. 7.0 or leave blank"
                      />
                    </div>

                    <div className="col-md-4">
                      <FormInput
                        label="Minimum Aggregate Percentage (%)"
                        id="minimum_percentage"
                        name="minimum_percentage"
                        type="number"
                        step="0.1"
                        value={eligibility.minimum_percentage}
                        onChange={handleEligibilityChange}
                        placeholder="e.g. 70.0"
                        error={errors.minimum_percentage}
                        disabled={loading}
                        helpText="e.g. 65 or leave blank"
                      />
                    </div>

                    <div className="col-md-4">
                      <FormInput
                        label="Eligible Graduation Year"
                        id="graduation_year"
                        name="graduation_year"
                        type="number"
                        value={eligibility.graduation_year}
                        onChange={handleEligibilityChange}
                        placeholder="e.g. 2026 or 2027"
                        error={errors.graduation_year}
                        disabled={loading}
                        helpText="Batch passing out year"
                      />
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label htmlFor="experience_required" className="form-label fw-semibold">
                          Experience Required
                        </label>
                        <select
                          id="experience_required"
                          name="experience_required"
                          className={`form-select ${errors.experience_required ? 'is-invalid' : ''}`}
                          value={eligibility.experience_required}
                          onChange={handleEligibilityChange}
                          disabled={loading}
                        >
                          <option value="Fresher">Fresher (0 years)</option>
                          <option value="0-1 years">0 - 1 years</option>
                          <option value="1-2 years">1 - 2 years</option>
                          <option value="2+ years">2+ years</option>
                        </select>
                        {errors.experience_required && (
                          <div className="invalid-feedback d-block">{errors.experience_required}</div>
                        )}
                      </div>
                    </div>

                    <div className="col-md-6">
                      <FormInput
                        label="Additional Criteria / Requirements"
                        id="additional_requirements"
                        name="additional_requirements"
                        type="textarea"
                        rows={2}
                        value={eligibility.additional_requirements}
                        onChange={handleEligibilityChange}
                        placeholder="e.g. No active backlogs, strong verbal and written communication..."
                        error={errors.additional_requirements}
                        disabled={loading}
                      />
                    </div>
                  </div>
                </div>

                <div className="d-flex justify-content-end gap-3 mt-4">
                  <Link
                    to="/company/profile"
                    className="btn btn-outline-secondary px-4 fw-semibold"
                  >
                    Cancel
                  </Link>
                  <button
                    type="submit"
                    className="btn btn-primary btn-lg px-5 fw-semibold shadow-sm"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span
                          className="spinner-border spinner-border-sm me-2"
                          role="status"
                          aria-hidden="true"
                        ></span>
                        Publishing Job...
                      </>
                    ) : (
                      'Publish Job Posting'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
