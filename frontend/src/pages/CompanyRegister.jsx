import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import companyService from '../services/companyService';
import FormInput from '../components/FormInput';
import { validateRegistrationData } from '../utils/validation';

export default function CompanyRegister() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    company_name: '',
    email: '',
    password: '',
    confirm_password: '',
    contact_number: '',
  });

  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const validateFrontend = () => {
    const validation = validateRegistrationData(formData);
    setErrors(validation.errors);
    return validation.isValid;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear validation error on change
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
      const response = await companyService.register(formData);

      if (response.success) {
        setSuccessMessage('Registration successful! Redirecting to login page...');
        setTimeout(() => {
          navigate('/company/login', {
            state: { registeredEmail: formData.email, msg: 'Registration successful! Please log in.' },
          });
        }, 1500);
      }
    } catch (err) {
      console.error('Registration API error:', err);
      if (err.response?.data?.errors) {
        setErrors(err.response.data.errors);
      }
      setServerError(
        err.response?.data?.message || 'Failed to complete registration. Please check your inputs.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-12 col-md-9 col-lg-7">
          <div className="card shadow-lg border-0 rounded-4">
            <div className="card-header bg-gradient bg-primary text-white text-center py-4 rounded-top-4">
              <h3 className="fw-bold mb-1">Company Registration</h3>
              <p className="mb-0 text-white-50">
                Join our Placement Portal to recruit top talent and manage job drives
              </p>
            </div>

            <div className="card-body p-4 p-md-5">
              {serverError && (
                <div className="alert alert-danger d-flex align-items-center" role="alert">
                  <div>
                    <strong>Registration Error:</strong> {serverError}
                  </div>
                </div>
              )}

              {successMessage && (
                <div className="alert alert-success d-flex align-items-center" role="alert">
                  <div>{successMessage}</div>
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate>
                <FormInput
                  label="Company Name"
                  id="company_name"
                  name="company_name"
                  value={formData.company_name}
                  onChange={handleChange}
                  placeholder="e.g. Acme Innovations Corp"
                  required
                  error={errors.company_name}
                  disabled={loading}
                />

                <FormInput
                  label="Official Email"
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="e.g. hr@acme.com"
                  required
                  error={errors.email}
                  disabled={loading}
                  helpText="Official corporate domain email is recommended."
                />

                <FormInput
                  label="Contact Number"
                  id="contact_number"
                  name="contact_number"
                  type="tel"
                  value={formData.contact_number}
                  onChange={handleChange}
                  placeholder="e.g. +91 9876543210"
                  required
                  error={errors.contact_number}
                  disabled={loading}
                />

                <div className="row">
                  <div className="col-md-6">
                    <FormInput
                      label="Password"
                      id="password"
                      name="password"
                      type="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Minimum 6 characters"
                      required
                      error={errors.password}
                      disabled={loading}
                    />
                  </div>
                  <div className="col-md-6">
                    <FormInput
                      label="Confirm Password"
                      id="confirm_password"
                      name="confirm_password"
                      type="password"
                      value={formData.confirm_password}
                      onChange={handleChange}
                      placeholder="Re-enter password"
                      required
                      error={errors.confirm_password}
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="d-grid mt-4">
                  <button
                    type="submit"
                    className="btn btn-primary btn-lg fw-semibold shadow-sm"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span
                          className="spinner-border spinner-border-sm me-2"
                          role="status"
                          aria-hidden="true"
                        ></span>
                        Registering Company...
                      </>
                    ) : (
                      'Register Company'
                    )}
                  </button>
                </div>
              </form>

              <hr className="my-4" />

              <div className="text-center">
                <span className="text-muted">Already registered? </span>
                <Link to="/company/login" className="text-decoration-none fw-bold text-primary">
                  Log in here
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
