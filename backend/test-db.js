const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://postgres:postgres@localhost:5432/orbit' // guess default?
});
pool.query('SELECT id, "imageUrls" FROM "Post" WHERE array_length("imageUrls", 1) > 0 LIMIT 1').then(res => {
  console.log(JSON.stringify(res.rows));
  process.exit();
}).catch(err => {
  console.log('Error:', err.message);
  process.exit();
});
