import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import companyService from '../services/companyService';
import FormInput from '../components/FormInput';

export default function CompanyLogin() {
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({
    email: location.state?.registeredEmail || '',
    password: '',
  });

  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [infoMessage] = useState(location.state?.msg || '');
  const [loading, setLoading] = useState(false);

  const validateFrontend = () => {
    const newErrors = {};

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'Official email is required.';
    } else if (!emailRegex.test(formData.email.trim())) {
      newErrors.email = 'Please enter a valid email address.';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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

    if (!validateFrontend()) {
      return;
    }

    setLoading(true);

    try {
      const response = await companyService.login(formData);

      if (response.success && response.token) {
        // Redirect to profile page after successful authentication
        navigate('/company/profile');
      }
    } catch (err) {
      console.error('Login error:', err);
      setServerError(
        err.response?.data?.message || 'Login failed. Please verify your email and password.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-12 col-md-8 col-lg-5">
          <div className="card shadow-lg border-0 rounded-4">
            <div className="card-header bg-gradient bg-primary text-white text-center py-4 rounded-top-4">
              <h3 className="fw-bold mb-1">Company Login</h3>
              <p className="mb-0 text-white-50">Sign in to your Placement Portal account</p>
            </div>

            <div className="card-body p-4 p-md-5">
              {infoMessage && (
                <div className="alert alert-info alert-dismissible fade show" role="alert">
                  {infoMessage}
                </div>
              )}

              {serverError && (
                <div className="alert alert-danger" role="alert">
                  <strong>Authentication Failed:</strong> {serverError}
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate>
                <FormInput
                  label="Official Email"
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="hr@company.com"
                  required
                  error={errors.email}
                  disabled={loading}
                />

                <FormInput
                  label="Password"
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  required
                  error={errors.password}
                  disabled={loading}
                />

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
                        Signing In...
                      </>
                    ) : (
                      'Sign In'
                    )}
                  </button>
                </div>
              </form>

              <hr className="my-4" />

              <div className="text-center">
                <span className="text-muted">New company on our platform? </span>
                <Link to="/company/register" className="text-decoration-none fw-bold text-primary">
                  Register Company
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
