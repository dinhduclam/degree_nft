const express = require('express');
const cors = require('cors');
const mariadb = require('mariadb');

const app = express();
const PORT = 5002;

app.use(cors());
app.use(express.json());

const pool = mariadb.createPool({
  host: 'localhost',
  port: 3006,
  user: 'root',
  password: 'root',
  database: 'degree_nft',
  connectionLimit: 5
});

// GET /students?search=term
app.get('/students', async (req, res) => {
  const search = req.query.search;
  let conn;
  try {
    conn = await pool.getConnection();
    let rows;
    if (search && search.length >= 2) {
      rows = await conn.query(
        `SELECT * FROM Students WHERE StudentName LIKE ? OR StudentAddress LIKE ? ORDER BY StudentName`,
        [`%${search}%`, `%${search}%`]
      );
    } else {
      rows = await conn.query('SELECT * FROM Students ORDER BY StudentName');
    }
    // mariadb returns an array with an extra meta object at the end, remove it
    if (Array.isArray(rows) && rows.length && rows[rows.length-1]?.constructor?.name === 'OkPacket') {
      rows = rows.slice(0, -1);
    }
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  } finally {
    if (conn) conn.release();
  }
});

// POST /students
app.post('/students', async (req, res) => {
  const { studentName, studentAddress, email, phone } = req.body;
  if (!studentName || !studentAddress) {
    return res.status(400).json({ error: 'Name and address required' });
  }
  let conn;
  try {
    conn = await pool.getConnection();
    await conn.query(
      'INSERT INTO Students (StudentName, StudentAddress, Email, Phone) VALUES (?, ?, ?, ?)',
      [studentName, studentAddress, email, phone]
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  } finally {
    if (conn) conn.release();
  }
});

app.listen(PORT, () => {
  console.log(`Backend API running on http://localhost:${PORT}`);
}); 