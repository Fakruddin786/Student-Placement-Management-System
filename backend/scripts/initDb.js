const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function initializeDatabase() {
  const host = process.env.DB_HOST || 'localhost';
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';
  const port = process.env.DB_PORT || 3306;
  const dbName = process.env.DB_NAME || 'placement_management_db';

  console.log(`Connecting to MySQL server at ${host}:${port} as ${user}...`);

  // Connect to MySQL server without database selected initially
  const connection = await mysql.createConnection({
    host,
    user,
    password,
    port,
    multipleStatements: true,
  });

  try {
    console.log(`Ensuring database '${dbName}' exists...`);
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    await connection.query(`USE \`${dbName}\`;`);

    const schemaPath = path.join(__dirname, '..', 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    console.log('Applying schema definitions...');
    await connection.query(schemaSql);

    console.log('✅ Database and tables initialized successfully!');
  } catch (error) {
    console.error('❌ Failed to initialize database:', error.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

initializeDatabase();
