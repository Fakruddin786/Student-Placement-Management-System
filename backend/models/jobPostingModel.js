const { pool } = require('../config/database');

/**
 * Job Posting Model - Database Access Layer (BAT-34)
 * Handles data access for job_postings table with Company relationship
 * 
 * Future Jira Subtask Extension Points:
 * - BAT-35: Full create/edit workflows
 * - BAT-36: Join with job_skills and eligibility_criteria
 * - BAT-39: Company job posting management and status toggling
 */
const JobPostingModel = {
  /**
   * Create a new job posting record with optional skills and eligibility criteria (BAT-36)
   * Executes within an ACID MySQL transaction
   * @param {Object} jobData
   * @returns {Promise<Object>} Created job posting with skills and eligibility
   */
  async createJobPosting({
    company_id,
    job_title,
    description,
    location,
    employment_type = 'Full-time',
    salary_min = null,
    salary_max = null,
    application_deadline,
    status = 'Active',
    skills = [],
    eligibility = null,
  }) {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      const query = `
        INSERT INTO job_postings (
          company_id, job_title, description, location,
          employment_type, salary_min, salary_max,
          application_deadline, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const [result] = await connection.execute(query, [
        company_id,
        job_title.trim(),
        description.trim(),
        location.trim(),
        employment_type,
        salary_min !== null && salary_min !== undefined && salary_min !== '' ? salary_min : null,
        salary_max !== null && salary_max !== undefined && salary_max !== '' ? salary_max : null,
        application_deadline,
        status,
      ]);

      const jobId = result.insertId;

      // 1. Insert required skills (BAT-36)
      if (Array.isArray(skills) && skills.length > 0) {
        for (const skill of skills) {
          if (typeof skill === 'string' && skill.trim()) {
            await connection.execute(
              `INSERT INTO job_skills (job_posting_id, skill_name) VALUES (?, ?)`,
              [jobId, skill.trim()]
            );
          }
        }
      }

      // 2. Insert eligibility criteria (BAT-36)
      if (eligibility && typeof eligibility === 'object') {
        const minQual = eligibility.minimum_qualification !== undefined ? eligibility.minimum_qualification : eligibility.minimumQualification;
        const minCgpa = eligibility.minimum_cgpa !== undefined ? eligibility.minimum_cgpa : eligibility.minimumCgpa;
        const minPct = eligibility.minimum_percentage !== undefined ? eligibility.minimum_percentage : eligibility.minimumPercentage;
        const gradYr = eligibility.graduation_year !== undefined ? eligibility.graduation_year : eligibility.graduationYear;
        const expReq = eligibility.experience_required !== undefined ? eligibility.experience_required : eligibility.experienceRequired;
        const eligBranches = eligibility.eligible_branches !== undefined ? eligibility.eligible_branches : eligibility.eligibleBranches;
        const addReq = eligibility.additional_requirements !== undefined ? eligibility.additional_requirements : eligibility.additionalRequirements;

        await connection.execute(
          `INSERT INTO job_eligibility (
            job_posting_id, minimum_qualification, minimum_cgpa,
            minimum_percentage, graduation_year, experience_required,
            eligible_branches, additional_requirements
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            jobId,
            minQual ? String(minQual).trim() : null,
            minCgpa !== undefined && minCgpa !== null && minCgpa !== '' ? Number(minCgpa) : null,
            minPct !== undefined && minPct !== null && minPct !== '' ? Number(minPct) : null,
            gradYr !== undefined && gradYr !== null && gradYr !== '' ? Number(gradYr) : null,
            expReq ? String(expReq).trim() : null,
            eligBranches ? String(eligBranches).trim() : null,
            addReq ? String(addReq).trim() : null,
          ]
        );
      }

      await connection.commit();
      return await this.findById(jobId);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  /**
   * Find job posting by ID with company details, required skills, and eligibility criteria
   * @param {number|string} id
   * @returns {Promise<Object|null>}
   */
  async findById(id) {
    const query = `
      SELECT 
        j.id,
        j.company_id,
        c.company_name,
        c.email AS company_email,
        j.job_title,
        j.description,
        j.location,
        j.employment_type,
        j.salary_min,
        j.salary_max,
        j.application_deadline,
        j.status,
        j.created_at,
        j.updated_at
      FROM job_postings j
      INNER JOIN companies c ON j.company_id = c.id
      WHERE j.id = ?
      LIMIT 1
    `;

    const [rows] = await pool.execute(query, [id]);
    if (!rows[0]) return null;

    const job = rows[0];

    // Fetch associated skills (BAT-36)
    const [skillRows] = await pool.execute(
      `SELECT id, skill_name FROM job_skills WHERE job_posting_id = ? ORDER BY id ASC`,
      [id]
    );
    job.skills = skillRows.map((r) => r.skill_name);
    job.job_skills = skillRows;

    // Fetch associated eligibility criteria (BAT-36)
    const [eligibilityRows] = await pool.execute(
      `SELECT 
        id, job_posting_id, minimum_qualification, minimum_cgpa,
        minimum_percentage, graduation_year, experience_required,
        eligible_branches, additional_requirements, created_at, updated_at
      FROM job_eligibility
      WHERE job_posting_id = ?
      LIMIT 1`,
      [id]
    );
    job.eligibility = eligibilityRows[0] || null;

    return job;
  },

  /**
   * Find all job postings belonging to a specific company (BAT-39 extension)
   * Supports optional status filter and search keyword
   * @param {number|string} companyId
   * @param {string|Object|null} options - Optional status string or { status, search } object
   * @returns {Promise<Array>}
   */
  async findByCompanyId(companyId, options = null) {
    let status = null;
    let search = null;

    if (typeof options === 'string') {
      status = options;
    } else if (options && typeof options === 'object') {
      status = options.status || null;
      search = options.search || null;
    }

    let query = `
      SELECT 
        id, company_id, job_title, description, location,
        employment_type, salary_min, salary_max,
        application_deadline, status, created_at, updated_at
      FROM job_postings
      WHERE company_id = ?
    `;
    const params = [companyId];

    if (status && status !== 'All') {
      query += ` AND status = ?`;
      params.push(status);
    }

    if (search && typeof search === 'string' && search.trim()) {
      query += ` AND (job_title LIKE ? OR location LIKE ? OR description LIKE ?)`;
      const term = `%${search.trim()}%`;
      params.push(term, term, term);
    }

    query += ` ORDER BY created_at DESC`;

    const [rows] = await pool.execute(query, params);
    return rows;
  },

  /**
   * Find all job postings across all companies (with optional status filter)
   * @param {Object} filter
   * @returns {Promise<Array>}
   */
  async findAll({ status = 'Active', limit = 50, offset = 0 } = {}) {
    let query = `
      SELECT 
        j.id,
        j.company_id,
        c.company_name,
        j.job_title,
        j.description,
        j.location,
        j.employment_type,
        j.salary_min,
        j.salary_max,
        j.application_deadline,
        j.status,
        j.created_at,
        j.updated_at
      FROM job_postings j
      INNER JOIN companies c ON j.company_id = c.id
    `;
    const params = [];

    if (status) {
      query += ` WHERE j.status = ?`;
      params.push(status);
    }

    query += ` ORDER BY j.created_at DESC LIMIT ? OFFSET ?`;
    params.push(String(limit), String(offset));

    const [rows] = await pool.execute(query, params);
    return rows;
  },

  /**
   * Update an existing job posting and optionally update skills & eligibility (BAT-36)
   * Executes within an ACID MySQL transaction
   * @param {number|string} id
   * @param {number|string} companyId - Ensures only the owner company can update
   * @param {Object} updateData
   * @returns {Promise<Object|null>}
   */
  async updateJobPosting(id, companyId, {
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
  }) {
    const existing = await this.findById(id);
    if (!existing || existing.company_id !== parseInt(companyId, 10)) {
      return null;
    }

    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      const query = `
        UPDATE job_postings
        SET 
          job_title = COALESCE(?, job_title),
          description = COALESCE(?, description),
          location = COALESCE(?, location),
          employment_type = COALESCE(?, employment_type),
          salary_min = ?,
          salary_max = ?,
          application_deadline = COALESCE(?, application_deadline),
          status = COALESCE(?, status),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND company_id = ?
      `;

      await connection.execute(query, [
        job_title !== undefined ? job_title.trim() : null,
        description !== undefined ? description.trim() : null,
        location !== undefined ? location.trim() : null,
        employment_type !== undefined ? employment_type : null,
        salary_min !== undefined ? salary_min : existing.salary_min,
        salary_max !== undefined ? salary_max : existing.salary_max,
        application_deadline !== undefined ? application_deadline : null,
        status !== undefined ? status : null,
        id,
        companyId,
      ]);

      // Update skills if provided (BAT-36)
      if (skills !== undefined && Array.isArray(skills)) {
        await connection.execute(`DELETE FROM job_skills WHERE job_posting_id = ?`, [id]);
        for (const skill of skills) {
          if (typeof skill === 'string' && skill.trim()) {
            await connection.execute(
              `INSERT INTO job_skills (job_posting_id, skill_name) VALUES (?, ?)`,
              [id, skill.trim()]
            );
          }
        }
      }

      // Update eligibility if provided (BAT-36)
      if (eligibility !== undefined) {
        if (eligibility === null) {
          await connection.execute(`DELETE FROM job_eligibility WHERE job_posting_id = ?`, [id]);
        } else if (typeof eligibility === 'object') {
          const minQual = eligibility.minimum_qualification !== undefined ? eligibility.minimum_qualification : eligibility.minimumQualification;
          const minCgpa = eligibility.minimum_cgpa !== undefined ? eligibility.minimum_cgpa : eligibility.minimumCgpa;
          const minPct = eligibility.minimum_percentage !== undefined ? eligibility.minimum_percentage : eligibility.minimumPercentage;
          const gradYr = eligibility.graduation_year !== undefined ? eligibility.graduation_year : eligibility.graduationYear;
          const expReq = eligibility.experience_required !== undefined ? eligibility.experience_required : eligibility.experienceRequired;
          const eligBranches = eligibility.eligible_branches !== undefined ? eligibility.eligible_branches : eligibility.eligibleBranches;
          const addReq = eligibility.additional_requirements !== undefined ? eligibility.additional_requirements : eligibility.additionalRequirements;

          const elQuery = `
            INSERT INTO job_eligibility (
              job_posting_id, minimum_qualification, minimum_cgpa,
              minimum_percentage, graduation_year, experience_required,
              eligible_branches, additional_requirements
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
              minimum_qualification = VALUES(minimum_qualification),
              minimum_cgpa = VALUES(minimum_cgpa),
              minimum_percentage = VALUES(minimum_percentage),
              graduation_year = VALUES(graduation_year),
              experience_required = VALUES(experience_required),
              eligible_branches = VALUES(eligible_branches),
              additional_requirements = VALUES(additional_requirements),
              updated_at = CURRENT_TIMESTAMP
          `;

          await connection.execute(elQuery, [
            id,
            minQual ? String(minQual).trim() : null,
            minCgpa !== undefined && minCgpa !== null && minCgpa !== '' ? Number(minCgpa) : null,
            minPct !== undefined && minPct !== null && minPct !== '' ? Number(minPct) : null,
            gradYr !== undefined && gradYr !== null && gradYr !== '' ? Number(gradYr) : null,
            expReq ? String(expReq).trim() : null,
            eligBranches ? String(eligBranches).trim() : null,
            addReq ? String(addReq).trim() : null,
          ]);
        }
      }

      await connection.commit();
      return await this.findById(id);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  /**
   * Delete a job posting (BAT-39 extension)
   * @param {number|string} id
   * @param {number|string} companyId
   * @returns {Promise<boolean>}
   */
  async deleteJobPosting(id, companyId) {
    const query = `
      DELETE FROM job_postings
      WHERE id = ? AND company_id = ?
    `;
    const [result] = await pool.execute(query, [id, companyId]);
    return result.affectedRows > 0;
  },

  /**
   * Count job postings for a company
   * @param {number|string} companyId
   * @returns {Promise<number>}
   */
  async countByCompanyId(companyId) {
    const query = `
      SELECT COUNT(*) AS total
      FROM job_postings
      WHERE company_id = ?
    `;
    const [rows] = await pool.execute(query, [companyId]);
    return rows[0]?.total || 0;
  },
};

module.exports = JobPostingModel;
