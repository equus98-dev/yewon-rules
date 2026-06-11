const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DIRECT_URL });

pool.query(`SELECT 
        r.*, 
        c.name AS "categoryName", d.name AS "departmentName"
       FROM "Rule" r
       LEFT JOIN "Category" c ON r."categoryId" = c.id
       LEFT JOIN "Department" d ON r."departmentId" = d.id
       WHERE r.id = '1'`)
  .then(res => console.log(res.rows))
  .catch(err => console.error(err.message))
  .finally(() => pool.end());
