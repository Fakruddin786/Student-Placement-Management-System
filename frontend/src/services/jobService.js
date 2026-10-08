import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api/jobs';

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

export const jobService = {
  /**
   * Create a new job posting (authenticated company)
   * @param {Object} jobData
   */
  async createJob(jobData) {
    const response = await api.post('/', jobData);
    return response.data;
  },

  /**
   * Get single job posting by ID
   * @param {number|string} id
   */
  async getJobById(id) {
    const response = await api.get(`/${id}`);
    return response.data;
  },

  /**
   * Update existing job posting (authenticated owner company)
   * @param {number|string} id
   * @param {Object} jobData
   */
  async updateJob(id, jobData) {
    const response = await api.put(`/${id}`, jobData);
    return response.data;
  },

  /**
   * Get all job postings created by the current authenticated company
   * @param {Object} [params] - Optional { status, search }
   */
  async getMyJobs(params = {}) {
    const response = await api.get('/my-jobs', { params });
    return response.data;
  },

  /**
   * Delete job posting (authenticated owner company)
   * @param {number|string} id
   */
  async deleteJob(id) {
    const response = await api.delete(`/${id}`);
    return response.data;
  },
};

export default jobService;
