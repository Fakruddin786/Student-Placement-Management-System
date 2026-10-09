import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api/companies';

// Axios instance configured with base settings
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const companyService = {
  /**
   * Register a new company account
   */
  async register(registrationData) {
    const response = await api.post('/register', registrationData);
    return response.data;
  },

  /**
   * Authenticate company and retrieve JWT token
   */
  async login(loginData) {
    const response = await api.post('/login', loginData);
    if (response.data.success && response.data.token) {
      this.setAuth(response.data.token, response.data.company);
    }
    return response.data;
  },

  /**
   * Save or update company profile (JWT required)
   */
  async saveProfile(profileData) {
    const response = await api.post('/profile', profileData);
    return response.data;
  },

  /**
   * Update existing company profile (BAT-37)
   */
  async updateProfile(profileData) {
    const response = await api.put('/profile', profileData);
    return response.data;
  },

  /**
   * Fetch company profile of current authenticated company
   */
  async getProfile() {
    const response = await api.get('/profile');
    return response.data;
  },

  /**
   * Store token and company details in localStorage
   */
  setAuth(token, company) {
    localStorage.setItem('token', token);
    localStorage.setItem('company', JSON.stringify(company));
  },

  /**
   * Remove stored authentication tokens (Logout)
   */
  clearAuth() {
    localStorage.removeItem('token');
    localStorage.removeItem('company');
  },

  /**
   * Check if user is currently authenticated
   */
  isAuthenticated() {
    return !!localStorage.getItem('token');
  },

  /**
   * Get authenticated company details from localStorage
   */
  getStoredCompany() {
    const company = localStorage.getItem('company');
    try {
      return company ? JSON.parse(company) : null;
    } catch {
      return null;
    }
  },
};

export default companyService;
