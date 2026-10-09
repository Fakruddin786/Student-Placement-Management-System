const { pool } = require('../config/database');

/**
 * Company Model - Database Access Layer
 * Handles queries for companies and company_profiles tables
 */
const CompanyModel = {
  /**
   * Find company by email (used for login and duplicate check)
   */
  async findByEmail(email) {
    const query = `
      SELECT id, company_name, email, password_hash, contact_number, created_at, updated_at
      FROM companies
      WHERE email = ?
      LIMIT 1
    `;
    const [rows] = await pool.execute(query, [email.toLowerCase().trim()]);
    return rows[0] || null;
  },

  /**
   * Find company by ID (excludes password_hash for safety)
   */
  async findById(id) {
    const query = `
      SELECT id, company_name, email, contact_number, created_at, updated_at
      FROM companies
      WHERE id = ?
      LIMIT 1
    `;
    const [rows] = await pool.execute(query, [id]);
    return rows[0] || null;
  },

  /**
   * Create a new company registration record
   */
  async createCompany({ company_name, email, password_hash, contact_number }) {
    const query = `
      INSERT INTO companies (company_name, email, password_hash, contact_number)
      VALUES (?, ?, ?, ?)
    `;
    const [result] = await pool.execute(query, [
      company_name.trim(),
      email.toLowerCase().trim(),
      password_hash,
      contact_number.trim(),
    ]);

    return {
      id: result.insertId,
      company_name: company_name.trim(),
      email: email.toLowerCase().trim(),
      contact_number: contact_number.trim(),
    };
  },

  /**
   * Find company profile by company_id
   */
  async findProfileByCompanyId(companyId) {
    const query = `
      SELECT id, company_id, company_name, description, industry, website,
             official_email, contact_number, address, city, state, pincode,
             logo_url, created_at, updated_at
      FROM company_profiles
      WHERE company_id = ?
      LIMIT 1
    `;
    const [rows] = await pool.execute(query, [companyId]);
    return rows[0] || null;
  },

  /**
   * Create or update company profile (Upsert behavior for robust profile creation & edit)
   */
  async saveProfile({
    company_id,
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
    const existing = await this.findProfileByCompanyId(company_id);

    if (existing) {
      // Update existing profile (Extensible for BAT-37)
      const updateQuery = `
        UPDATE company_profiles
        SET company_name = ?, description = ?, industry = ?, website = ?,
            official_email = ?, contact_number = ?, address = ?, city = ?,
            state = ?, pincode = ?, logo_url = ?, updated_at = CURRENT_TIMESTAMP
        WHERE company_id = ?
      `;
      await pool.execute(updateQuery, [
        company_name.trim(),
        description.trim(),
        industry.trim(),
        website.trim(),
        official_email.trim(),
        contact_number.trim(),
        address.trim(),
        city.trim(),
        state.trim(),
        pincode.trim(),
        logo_url ? logo_url.trim() : null,
        company_id,
      ]);

      return await this.findProfileByCompanyId(company_id);
    } else {
      // Insert new profile
      const insertQuery = `
        INSERT INTO company_profiles (
          company_id, company_name, description, industry, website,
          official_email, contact_number, address, city, state, pincode, logo_url
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      const [result] = await pool.execute(insertQuery, [
        company_id,
        company_name.trim(),
        description.trim(),
        industry.trim(),
        website.trim(),
        official_email.trim(),
        contact_number.trim(),
        address.trim(),
        city.trim(),
        state.trim(),
        pincode.trim(),
        logo_url ? logo_url.trim() : null,
      ]);

      return await this.findProfileByCompanyId(company_id);
    }
  },

  /**
   * Get unified Company entity with Profile details (BAT-34)
   * @param {number|string} companyId
   * @returns {Promise<Object|null>} Complete company entity
   */
  async getCompanyWithProfile(companyId) {
    const query = `
      SELECT 
        c.id,
        c.company_name,
        c.email,
        c.contact_number,
        c.created_at,
        c.updated_at,
        cp.description,
        cp.industry,
        cp.website,
        cp.official_email,
        cp.address,
        cp.city,
        cp.state,
        cp.pincode,
        cp.logo_url
      FROM companies c
      LEFT JOIN company_profiles cp ON c.id = cp.company_id
      WHERE c.id = ?
      LIMIT 1
    `;
    const [rows] = await pool.execute(query, [companyId]);
    return rows[0] || null;
  },

  /**
   * Get Company with all its Job Postings (BAT-34 1-to-many relationship)
   * Company 1 ---- N JobPosting
   * @param {number|string} companyId
   * @returns {Promise<Object|null>} Company object with job_postings array
   */
  async getCompanyWithJobs(companyId) {
    const company = await this.getCompanyWithProfile(companyId);
    if (!company) return null;

    const jobQuery = `
      SELECT 
        id, company_id, job_title, description, location,
        employment_type, salary_min, salary_max,
        application_deadline, status, created_at, updated_at
      FROM job_postings
      WHERE company_id = ?
      ORDER BY created_at DESC
    `;
    const [jobs] = await pool.execute(jobQuery, [companyId]);

    return {
      ...company,
      job_postings: jobs,
    };
  },

  /**
   * Update company core account fields (company_name, contact_number) (BAT-37)
   * @param {number|string} companyId
   * @param {Object} data
   */
  async updateCompany(companyId, { company_name, contact_number }) {
    const query = `
      UPDATE companies
      SET 
        company_name = COALESCE(?, company_name),
        contact_number = COALESCE(?, contact_number),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    await pool.execute(query, [
      company_name ? company_name.trim() : null,
      contact_number ? contact_number.trim() : null,
      companyId,
    ]);
    return await this.findById(companyId);
  },

  /**
   * Delete company account and cascade delete profile and jobs
   * @param {number|string} companyId
   */
  async deleteCompany(companyId) {
    const [result] = await pool.execute('DELETE FROM companies WHERE id = ?', [companyId]);
    return result.affectedRows > 0;
  },
};

module.exports = CompanyModel;
