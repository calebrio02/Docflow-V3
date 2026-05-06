const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://docflow:docflow@localhost:5432/docflow',
});

async function initDB() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS folders (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        parent_folder_id INTEGER REFERENCES folders(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS documents (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        folder_id INTEGER REFERENCES folders(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        content TEXT DEFAULT '',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_folders_user_id ON folders(user_id);
      CREATE INDEX IF NOT EXISTS idx_folders_parent ON folders(parent_folder_id);
      CREATE INDEX IF NOT EXISTS idx_docs_user_id ON documents(user_id);
      CREATE INDEX IF NOT EXISTS idx_docs_folder_id ON documents(folder_id);
    `);

    const adminExists = await client.query('SELECT 1 FROM users WHERE username = $1', ['admin']);
    if (adminExists.rows.length === 0) {
      const hash = await bcrypt.hash('admin123', 10);
      await client.query('INSERT INTO users (username, password_hash) VALUES ($1, $2)', ['admin', hash]);
    }

    await client.query('COMMIT');
    console.log('Database initialized successfully');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('DB init error:', err);
    process.exit(1);
  } finally {
    client.release();
  }
}

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No token' });

  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
  if (!token || token !== process.env.AUTH_TOKEN) {
    return res.status(401).json({ error: 'Invalid token' });
  }
  req.userId = 1;
  next();
}

/* ─── Auth ─── */
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    if (result.rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });

    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });

    const authToken = process.env.AUTH_TOKEN || 'docflow-secret-token';
    res.json({ token: authToken, userId: user.id, username: user.username });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

/* ─── Folders ─── */
app.get('/api/folders', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM folders WHERE user_id = $1 ORDER BY created_at DESC',
      [req.userId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/folders', authMiddleware, async (req, res) => {
  const { name, parentFolderId } = req.body;
  if (!name) return res.status(400).json({ error: 'Name required' });
  try {
    const result = await pool.query(
      `INSERT INTO folders (user_id, name, parent_folder_id) VALUES ($1, $2, $3) RETURNING *`,
      [req.userId, name, parentFolderId || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.put('/api/folders/:id', authMiddleware, async (req, res) => {
  const { name, parentFolderId } = req.body;
  const fields = [];
  const values = [];
  let idx = 1;
  if (name !== undefined && name !== null && name !== '') {
    fields.push(`name = $${idx++}`);
    values.push(name);
  }
  if (parentFolderId !== undefined) {
    fields.push(`parent_folder_id = $${idx++}`);
    values.push(parentFolderId === '' ? null : parentFolderId);
  }
  fields.push('updated_at = NOW()');
  values.push(req.params.id, req.userId);
  try {
    const result = await pool.query(
      `UPDATE folders SET ${fields.join(', ')} WHERE id = $${idx} AND user_id = $${idx + 1} RETURNING *`,
      values
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Folder not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('PUT folder error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

app.delete('/api/folders/:id', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM folders WHERE id = $1 AND user_id = $2',
      [req.params.id, req.userId]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Folder not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

/* ─── Documents ─── */
app.get('/api/documents', authMiddleware, async (req, res) => {
  const { folderId } = req.query;
  try {
    let result;
    if (folderId) {
      result = await pool.query(
        'SELECT * FROM documents WHERE user_id = $1 AND folder_id = $2 ORDER BY created_at DESC',
        [req.userId, folderId]
      );
    } else {
      result = await pool.query(
        'SELECT * FROM documents WHERE user_id = $1 ORDER BY created_at DESC',
        [req.userId]
      );
    }
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/documents/:id', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM documents WHERE id = $1 AND user_id = $2',
      [req.params.id, req.userId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Document not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/documents', authMiddleware, async (req, res) => {
  const { name, folderId, content } = req.body;
  if (!name) return res.status(400).json({ error: 'Name required' });
  try {
    const result = await pool.query(
      `INSERT INTO documents (user_id, folder_id, name, content)
       VALUES ($1, $2, $3, COALESCE($4, ''))
       RETURNING *`,
      [req.userId, folderId || null, name, content || '']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.put('/api/documents/:id', authMiddleware, async (req, res) => {
  const { name, content, folderId } = req.body;
  const fields = [];
  const values = [];
  let idx = 1;
  if (name !== undefined && name !== null && name !== '') {
    fields.push(`name = $${idx++}`);
    values.push(name);
  }
  if (content !== undefined) {
    fields.push(`content = $${idx++}`);
    values.push(content === '' ? '' : content);
  }
  if (folderId !== undefined) {
    fields.push(`folder_id = $${idx++}`);
    values.push(folderId === '' ? null : folderId);
  }
  fields.push('updated_at = NOW()');
  values.push(req.params.id, req.userId);
  try {
    const result = await pool.query(
      `UPDATE documents SET ${fields.join(', ')} WHERE id = $${idx} AND user_id = $${idx + 1} RETURNING *`,
      values
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Document not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('PUT document error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

app.delete('/api/documents/:id', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM documents WHERE id = $1 AND user_id = $2',
      [req.params.id, req.userId]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Document not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/documents/import', authMiddleware, async (req, res) => {
  const { documents } = req.body;
  if (!Array.isArray(documents) || documents.length === 0) {
    return res.status(400).json({ error: 'Documents array required' });
  }
  try {
    const results = [];
    for (const doc of documents) {
      const result = await pool.query(
        `INSERT INTO documents (user_id, folder_id, name, content)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT DO NOTHING
         RETURNING *`,
        [req.userId, doc.folderId || null, doc.name, doc.content || '']
      );
      if (result.rows[0]) results.push(result.rows[0]);
    }
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

/* ─── Export ─── */
app.get('/api/export', authMiddleware, async (req, res) => {
  try {
    const folders = await pool.query('SELECT * FROM folders WHERE user_id = $1', [req.userId]);
    const docs = await pool.query(
      `SELECT d.*, f.name as folder_name FROM documents d
       LEFT JOIN folders f ON d.folder_id = f.id
       WHERE d.user_id = $1`,
      [req.userId]
    );

    const data = {
      exportedAt: new Date().toISOString(),
      folders: folders.rows,
      documents: docs.rows,
    };
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

initDB();

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
