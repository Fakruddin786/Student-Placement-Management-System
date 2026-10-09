import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import companyService from '../services/companyService';
import jobService from '../services/jobService';
import FormInput from '../components/FormInput';
import { validateProfileData } from '../utils/validation';

export default function CompanyProfile({ initialEditMode = false }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [profileExists, setProfileExists] = useState(false);
  const [isEditing, setIsEditing] = useState(initialEditMode);

  const [companyInfo, setCompanyInfo] = useState(null);
  const [companyJobs, setCompanyJobs] = useState([]);
  const [profileData, setProfileData] = useState({
    company_name: '',
    description: '',
    industry: '',
    website: '',
    official_email: '',
    contact_number: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    logo_url: '',
  });
  const [baselineProfile, setBaselineProfile] = useState(null);

  const [errors, setErrors] = useState({});
  const [feedbackMessage, setFeedbackMessage] = useState({
    type: location.state?.msg ? 'success' : '',
    text: location.state?.msg || '',
  });

  useEffect(() => {
    // Check authentication
    if (!companyService.isAuthenticated()) {
      navigate('/company/login');
      return;
    }

    fetchProfile();
  }, [navigate]);

  const fetchProfile = async () => {
    setLoading(true);
    setFeedbackMessage({ type: '', text: '' });

    try {
      const response = await companyService.getProfile();

      if (response.company) {
        setCompanyInfo(response.company);
      }

      if (response.hasProfile && response.profile) {
        setProfileExists(true);
        setIsEditing(initialEditMode);
        const loadedProfile = {
          company_name: response.profile.company_name || '',
          description: response.profile.description || '',
          industry: response.profile.industry || '',
          website: response.profile.website || '',
          official_email: response.profile.official_email || '',
          contact_number: response.profile.contact_number || '',
          address: response.profile.address || '',
          city: response.profile.city || '',
          state: response.profile.state || '',
          pincode: response.profile.pincode || '',
          logo_url: response.profile.logo_url || '',
        };
        setProfileData(loadedProfile);
        setBaselineProfile(loadedProfile);
      } else {
        // Pre-fill initial defaults from company registration
        setProfileExists(false);
        setIsEditing(true);
        const stored = companyService.getStoredCompany();
        const initialProfile = {
          company_name: stored?.company_name || response.company?.company_name || '',
          description: '',
          industry: '',
          website: '',
          official_email: stored?.email || response.company?.email || '',
          contact_number: stored?.contact_number || response.company?.contact_number || '',
          address: '',
          city: '',
          state: '',
          pincode: '',
          logo_url: '',
        };
        setProfileData(initialProfile);
        setBaselineProfile(initialProfile);
      }

      // Fetch company's job postings (BAT-35)
      try {
        const jobsRes = await jobService.getMyJobs();
        if (jobsRes.success) {
          setCompanyJobs(jobsRes.jobs || []);
        }
      } catch (jobErr) {
        console.warn('Could not fetch company jobs:', jobErr);
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      if (err.response?.status === 401) {
        companyService.clearAuth();
        navigate('/company/login');
      } else {
        setFeedbackMessage({
          type: 'danger',
          text: err.response?.data?.message || 'Failed to load company profile information.',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (baselineProfile) {
      setProfileData({ ...baselineProfile });
    }
    setErrors({});
    setIsEditing(false);
    if (location.pathname === '/company/profile/edit') {
      navigate('/company/profile');
    }
  };

  const validateFrontend = () => {
    const validation = validateProfileData(profileData);
    setErrors(validation.errors);
    return validation.isValid;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFeedbackMessage({ type: '', text: '' });

    if (!validateFrontend()) {
      return;
    }

    setSubmitting(true);

    try {
      const response = profileExists
        ? await companyService.updateProfile(profileData)
        : await companyService.saveProfile(profileData);

      if (response.success) {
        setFeedbackMessage({
          type: 'success',
          text: profileExists
            ? 'Company profile updated successfully!'
            : 'Company profile created successfully!',
        });
        setProfileExists(true);
        setIsEditing(false);
        setBaselineProfile({ ...profileData });

        // Synchronize stored company in localStorage
        const stored = companyService.getStoredCompany();
        if (stored) {
          companyService.setAuth(localStorage.getItem('token'), {
            ...stored,
            company_name: profileData.company_name,
            contact_number: profileData.contact_number,
          });
        }

        if (location.pathname === '/company/profile/edit') {
          navigate('/company/profile', {
            state: { msg: 'Company profile updated successfully!' },
          });
        }
      }
    } catch (err) {
      console.error('Error saving profile:', err);
      if (err.response?.data?.errors) {
        setErrors(err.response.data.errors);
      }
      setFeedbackMessage({
        type: 'danger',
        text: err.response?.data?.message || 'Failed to save company profile.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-primary" style={{ width: '3rem', height: '3rem' }} role="status">
          <span className="visually-hidden">Loading Profile...</span>
        </div>
        <p className="mt-3 text-muted fw-semibold">Loading company profile details...</p>
      </div>
    );
  }

  return (
    <div className="container py-5">
      {/* Header Banner */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 pb-3 border-bottom">
        <div>
          <h2 className="fw-bold mb-1">Company Profile Dashboard</h2>
          <p className="text-muted mb-0">
            Jira Tasks <span className="badge bg-secondary">BAT-33</span> <span className="badge bg-primary">BAT-37</span> | Placement Management System
          </p>
        </div>
        {profileExists && !isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="btn btn-outline-primary fw-semibold px-4 mt-2 mt-sm-0"
          >
            ✏️ Edit Profile
          </button>
        )}
      </div>

      {feedbackMessage.text && (
        <div className={`alert alert-${feedbackMessage.type} alert-dismissible fade show`} role="alert">
          {feedbackMessage.text}
          <button
            type="button"
            className="btn-close"
            onClick={() => setFeedbackMessage({ type: '', text: '' })}
            aria-label="Close"
          ></button>
        </div>
      )}

      {/* VIEW PROFILE MODE */}
      {profileExists && !isEditing ? (
        <div className="row g-4">
          {/* Main Info Card */}
          <div className="col-12 col-lg-8">
            <div className="card shadow-sm border-0 rounded-4 mb-4">
              <div className="card-body p-4 p-md-5">
                <div className="d-flex align-items-start gap-4 mb-4 flex-wrap flex-sm-nowrap">
                  <div
                    className="rounded-4 bg-light border d-flex align-items-center justify-content-center text-primary fw-bold"
                    style={{
                      width: '90px',
                      height: '90px',
                      fontSize: '2rem',
                      overflow: 'hidden',
                      flexShrink: 0,
                    }}
                  >
                    {profileData.logo_url ? (
                      <img
                        src={profileData.logo_url}
                        alt={profileData.company_name}
                        className="w-100 h-100 object-fit-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    ) : (
                      profileData.company_name?.charAt(0)?.toUpperCase() || '🏢'
                    )}
                  </div>
                  <div>
                    <h3 className="fw-bold mb-1 text-dark">{profileData.company_name}</h3>
                    <span className="badge bg-primary-subtle text-primary border border-primary-subtle px-3 py-2 rounded-pill fs-6 me-2">
                      🏷️ {profileData.industry}
                    </span>
                    <a
                      href={
                        profileData.website.startsWith('http')
                          ? profileData.website
                          : `https://${profileData.website}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-decoration-none text-muted small d-inline-block mt-2"
                    >
                      🔗 {profileData.website}
                    </a>
                  </div>
                </div>

                <div className="mb-4">
                  <h5 className="fw-bold text-secondary mb-2">About Company</h5>
                  <p className="text-muted lh-base" style={{ whiteSpace: 'pre-line' }}>
                    {profileData.description}
                  </p>
                </div>

                <hr className="my-4" />

                <h5 className="fw-bold text-secondary mb-3">Office Location & Address</h5>
                <div className="row g-3">
                  <div className="col-sm-6">
                    <span className="text-muted d-block small">Street Address:</span>
                    <span className="fw-semibold text-dark">{profileData.address}</span>
                  </div>
                  <div className="col-sm-6">
                    <span className="text-muted d-block small">City, State & Pincode:</span>
                    <span className="fw-semibold text-dark">
                      {profileData.city}, {profileData.state} - {profileData.pincode}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* BAT-35: Company Job Postings Section */}
            <div className="card shadow-sm border-0 rounded-4 p-4 mb-4">
              <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                <div>
                  <h4 className="fw-bold mb-0 text-dark">💼 Campus Job Postings</h4>
                  <p className="text-muted small mb-0">
                    Manage your active placement drives, internships, and recruitment opportunities
                  </p>
                </div>
                <div className="d-flex gap-2">
                  <Link
                    to="/company/jobs"
                    className="btn btn-outline-primary fw-semibold btn-sm px-3 shadow-sm"
                  >
                    📋 View All Jobs
                  </Link>
                  <Link
                    to="/company/jobs/create"
                    className="btn btn-primary fw-semibold btn-sm px-3 shadow-sm"
                  >
                    ➕ Post New Job
                  </Link>
                </div>
              </div>

              {companyJobs.length === 0 ? (
                <div className="bg-light border-dashed rounded-4 p-4 text-center my-2">
                  <div className="fs-2 mb-2">📄</div>
                  <h6 className="fw-bold text-dark">No job postings yet</h6>
                  <p className="text-muted small mb-3">
                    Start publishing campus recruitment openings for prospective students.
                  </p>
                  <Link to="/company/jobs/create" className="btn btn-outline-primary btn-sm px-4">
                    Create First Job Posting
                  </Link>
                </div>
              ) : (
                <div className="d-flex flex-column gap-3 mt-2">
                  {companyJobs.map((job) => (
                    <div
                      key={job.id}
                      className="border rounded-3 p-3 bg-white d-flex justify-content-between align-items-center flex-wrap gap-2 hover-shadow"
                    >
                      <div>
                        <div className="d-flex align-items-center gap-2 mb-1 flex-wrap">
                          <h6 className="fw-bold mb-0 text-dark">
                            <Link
                              to={`/company/jobs/${job.id}`}
                              className="text-dark text-decoration-none hover-primary"
                            >
                              {job.job_title}
                            </Link>
                          </h6>
                          <span className="badge bg-primary-subtle text-primary border border-primary-subtle">
                            {job.employment_type}
                          </span>
                          <span
                            className={`badge ${
                              job.status === 'Active'
                                ? 'bg-success text-white'
                                : job.status === 'Draft'
                                ? 'bg-secondary text-white'
                                : 'bg-danger text-white'
                            }`}
                          >
                            {job.status}
                          </span>
                        </div>
                        <div className="text-muted small d-flex flex-wrap gap-3">
                          <span>📍 {job.location}</span>
                          {(job.salary_min || job.salary_max) && (
                            <span>
                              💰 ₹{job.salary_min ? Number(job.salary_min).toLocaleString() : '0'} - ₹
                              {job.salary_max ? Number(job.salary_max).toLocaleString() : 'N/A'}
                            </span>
                          )}
                          <span>
                            📅 Deadline: {new Date(job.application_deadline).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <div className="d-flex gap-2">
                        <Link
                          to={`/company/jobs/${job.id}`}
                          className="btn btn-outline-primary btn-sm px-3 fw-semibold"
                        >
                          👁️ View
                        </Link>
                        <Link
                          to={`/company/jobs/${job.id}/edit`}
                          className="btn btn-outline-secondary btn-sm px-3 fw-semibold"
                        >
                          ✏️ Edit
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Quick Contact & Metadata Card */}
          <div className="col-12 col-lg-4">
            <div className="card shadow-sm border-0 rounded-4 mb-4">
              <div className="card-header bg-white py-3 border-0">
                <h5 className="fw-bold mb-0 text-dark">Contact Information</h5>
              </div>
              <div className="card-body pt-0">
                <ul className="list-group list-group-flush">
                  <li className="list-group-item px-0 py-3">
                    <span className="text-muted small d-block">Official Email</span>
                    <a
                      href={`mailto:${profileData.official_email}`}
                      className="fw-semibold text-decoration-none text-primary"
                    >
                      ✉️ {profileData.official_email}
                    </a>
                  </li>
                  <li className="list-group-item px-0 py-3">
                    <span className="text-muted small d-block">Contact Phone</span>
                    <span className="fw-semibold text-dark">📞 {profileData.contact_number}</span>
                  </li>
                  <li className="list-group-item px-0 py-3">
                    <span className="text-muted small d-block">Company Website</span>
                    <a
                      href={
                        profileData.website.startsWith('http')
                          ? profileData.website
                          : `https://${profileData.website}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="fw-semibold text-decoration-none text-primary text-truncate d-block"
                    >
                      🌐 {profileData.website}
                    </a>
                  </li>
                </ul>
              </div>
            </div>

            <div className="card shadow-sm border-0 rounded-4 bg-primary text-white p-4">
              <h6 className="fw-bold text-white-50 text-uppercase small">Verification Status</h6>
              <h4 className="fw-bold mb-2">Verified Company</h4>
              <p className="text-white-50 small mb-0">
                Account registered and verified with Placement Management System.
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* CREATE / EDIT PROFILE FORM MODE */
        <div className="row justify-content-center">
          <div className="col-12 col-xl-10">
            <div className="card shadow-lg border-0 rounded-4">
              <div className="card-header bg-white py-4 px-4 px-md-5 border-0">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h3 className="fw-bold text-dark mb-1">
                      {profileExists ? 'Edit Company Profile' : 'Create Company Profile'}
                    </h3>
                    <p className="text-muted mb-0">
                      {profileExists
                        ? 'Update your company profile information visible to students and placement coordinators'
                        : 'Complete your company profile setup to begin posting placement opportunities'}
                    </p>
                  </div>
                  {profileExists && (
                    <button
                      type="button"
                      className="btn btn-outline-secondary btn-sm"
                      onClick={handleCancel}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>

              <div className="card-body p-4 p-md-5 pt-0">
                <form onSubmit={handleSubmit} noValidate>
                  <h5 className="fw-bold text-primary mb-3">1. Basic Information</h5>
                  <div className="row">
                    <div className="col-md-6">
                      <FormInput
                        label="Company Name"
                        id="company_name"
                        name="company_name"
                        value={profileData.company_name}
                        onChange={handleChange}
                        placeholder="e.g. Infosys Ltd"
                        required
                        error={errors.company_name}
                        disabled={submitting}
                      />
                    </div>
                    <div className="col-md-6">
                      <FormInput
                        label="Industry / Domain"
                        id="industry"
                        name="industry"
                        value={profileData.industry}
                        onChange={handleChange}
                        placeholder="e.g. Information Technology & Services"
                        required
                        error={errors.industry}
                        disabled={submitting}
                      />
                    </div>
                  </div>

                  <FormInput
                    label="Company Description"
                    id="description"
                    name="description"
                    type="textarea"
                    rows={4}
                    value={profileData.description}
                    onChange={handleChange}
                    placeholder="Provide a comprehensive summary of your company, mission, work culture, and key focus areas..."
                    required
                    error={errors.description}
                    disabled={submitting}
                    helpText="Minimum 10 characters."
                  />

                  <div className="row">
                    <div className="col-md-6">
                      <FormInput
                        label="Company Website"
                        id="website"
                        name="website"
                        type="url"
                        value={profileData.website}
                        onChange={handleChange}
                        placeholder="https://www.company.com"
                        required
                        error={errors.website}
                        disabled={submitting}
                      />
                    </div>
                    <div className="col-md-6">
                      <FormInput
                        label="Logo URL (Optional)"
                        id="logo_url"
                        name="logo_url"
                        type="url"
                        value={profileData.logo_url}
                        onChange={handleChange}
                        placeholder="https://example.com/logo.png"
                        error={errors.logo_url}
                        disabled={submitting}
                        helpText="URL to your company logo image."
                      />
                    </div>
                  </div>

                  <h5 className="fw-bold text-primary mt-4 mb-3">2. Official Contact Information</h5>
                  <div className="row">
                    <div className="col-md-6">
                      <FormInput
                        label="Official Email"
                        id="official_email"
                        name="official_email"
                        type="email"
                        value={profileData.official_email}
                        onChange={handleChange}
                        placeholder="contact@company.com"
                        required
                        error={errors.official_email}
                        disabled={submitting}
                      />
                    </div>
                    <div className="col-md-6">
                      <FormInput
                        label="Contact Number"
                        id="contact_number"
                        name="contact_number"
                        type="tel"
                        value={profileData.contact_number}
                        onChange={handleChange}
                        placeholder="+91 9876543210"
                        required
                        error={errors.contact_number}
                        disabled={submitting}
                      />
                    </div>
                  </div>

                  <h5 className="fw-bold text-primary mt-4 mb-3">3. Location & Address</h5>
                  <FormInput
                    label="Street Address"
                    id="address"
                    name="address"
                    value={profileData.address}
                    onChange={handleChange}
                    placeholder="e.g. Tech Park, 4th Floor, Electronic City"
                    required
                    error={errors.address}
                    disabled={submitting}
                  />

                  <div className="row">
                    <div className="col-md-4">
                      <FormInput
                        label="City"
                        id="city"
                        name="city"
                        value={profileData.city}
                        onChange={handleChange}
                        placeholder="e.g. Bangalore"
                        required
                        error={errors.city}
                        disabled={submitting}
                      />
                    </div>
                    <div className="col-md-4">
                      <FormInput
                        label="State"
                        id="state"
                        name="state"
                        value={profileData.state}
                        onChange={handleChange}
                        placeholder="e.g. Karnataka"
                        required
                        error={errors.state}
                        disabled={submitting}
                      />
                    </div>
                    <div className="col-md-4">
                      <FormInput
                        label="Pincode / Postal Code"
                        id="pincode"
                        name="pincode"
                        value={profileData.pincode}
                        onChange={handleChange}
                        placeholder="e.g. 560100"
                        required
                        error={errors.pincode}
                        disabled={submitting}
                      />
                    </div>
                  </div>

                  <div className="d-flex justify-content-end gap-3 mt-4">
                    {profileExists && (
                      <button
                        type="button"
                        className="btn btn-outline-secondary px-4 fw-semibold"
                        onClick={handleCancel}
                        disabled={submitting}
                      >
                        Cancel
                      </button>
                    )}
                    <button
                      type="submit"
                      className="btn btn-primary btn-lg px-5 fw-semibold shadow-sm"
                      disabled={submitting}
                    >
                      {submitting ? (
                        <>
                          <span
                            className="spinner-border spinner-border-sm me-2"
                            role="status"
                            aria-hidden="true"
                          ></span>
                          Saving Profile...
                        </>
                      ) : profileExists ? (
                        'Update Profile'
                      ) : (
                        'Save Company Profile'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
