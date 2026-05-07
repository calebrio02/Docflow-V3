const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');

const JWT_SECRET = process.env.JWT_SECRET || 'docflow-jwt-secret-2025-change-in-production';
const JWT_EXPIRES = '7d';

const app = express();
const PORT = process.env.PORT || 4000;

const UPLOAD_DIR = path.join(__dirname, 'data', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});
const allowedImageExts = ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp', '.svg'];
const allowedVideoExts = ['.mp4', '.webm', '.mov', '.avi', '.mkv'];
const allowedExts = [...allowedImageExts, ...allowedVideoExts];

const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!allowedExts.includes(ext)) return cb(new Error(`Invalid file type. Allowed: ${allowedExts.join(', ')}`));
    cb(null, true);
  },
});

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use('/uploads', express.static(UPLOAD_DIR));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://docflow:docflow@localhost:5432/docflow',
});

// ─── Migration helper ───
async function runMigrations(client) {
  // Enable uuid and pgcrypto if needed
  try { await client.query('CREATE EXTENSION IF NOT EXISTS pgcrypto'); } catch (err) { console.error('Migration error:', err); }
  try { await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"'); } catch (err) { console.error('Migration error:', err); }

  // users - preserve, add email if missing
  await client.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);
  await client.query(`
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='email') THEN
        ALTER TABLE users ADD COLUMN email VARCHAR(255);
      END IF;
    END $$;
  `);
  await client.query(`
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='is_admin') THEN
        ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT false;
      END IF;
    END $$;
  `);

  // projects
  await client.query(`
    CREATE TABLE IF NOT EXISTS projects (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      description TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      created_by INTEGER REFERENCES users(id)
    )
  `);

  // project_members
  await client.query(`
    CREATE TABLE IF NOT EXISTS project_members (
      id SERIAL PRIMARY KEY,
      project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      role VARCHAR(50) NOT NULL DEFAULT 'viewer',
      created_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(project_id, user_id)
    )
  `);

  // folders (subcarpetas dentro de proyectos)
  await client.query(`
    CREATE TABLE IF NOT EXISTS folders (
      id SERIAL PRIMARY KEY,
      project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
      parent_folder_id INTEGER REFERENCES folders(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `);
  await client.query(`
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='folders' AND column_name='project_id') THEN
        ALTER TABLE folders ADD COLUMN project_id UUID REFERENCES projects(id) ON DELETE CASCADE;
      END IF;
    END $$;
  `);

  // documents
  await client.query(`
    CREATE TABLE IF NOT EXISTS documents (
      id SERIAL PRIMARY KEY,
      project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
      folder_id INTEGER REFERENCES folders(id) ON DELETE SET NULL,
      title VARCHAR(500) NOT NULL DEFAULT 'Untitled',
      content JSONB DEFAULT '[]',
      published_content JSONB,
      is_public BOOLEAN DEFAULT false,
      public_token UUID UNIQUE DEFAULT gen_random_uuid(),
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW(),
      created_by INTEGER REFERENCES users(id),
      updated_by INTEGER REFERENCES users(id)
    )
  `);
  await client.query(`
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='documents' AND column_name='project_id') THEN
        ALTER TABLE documents ADD COLUMN project_id UUID REFERENCES projects(id) ON DELETE CASCADE;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='documents' AND column_name='published_content') THEN
        ALTER TABLE documents ADD COLUMN published_content JSONB;
      END IF;
    END $$;
  `);

  // releases (commits públicos)
  await client.query(`
    CREATE TABLE IF NOT EXISTS releases (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      document_id INTEGER REFERENCES documents(id) ON DELETE CASCADE,
      content JSONB NOT NULL,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      version_number INTEGER NOT NULL,
      created_at TIMESTAMP DEFAULT NOW(),
      created_by INTEGER REFERENCES users(id)
    )
  `);

  // invitations
  await client.query(`
    CREATE TABLE IF NOT EXISTS invitations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email VARCHAR(255) NOT NULL,
      project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
      role VARCHAR(50) NOT NULL DEFAULT 'editor',
      token VARCHAR(255) UNIQUE NOT NULL,
      expires_at TIMESTAMP NOT NULL,
      used_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW(),
      created_by INTEGER REFERENCES users(id)
    )
  `);

  // indices
  await client.query(`CREATE INDEX IF NOT EXISTS idx_project_members_project ON project_members(project_id)`);
  await client.query(`CREATE INDEX IF NOT EXISTS idx_project_members_user ON project_members(user_id)`);
  await client.query(`CREATE INDEX IF NOT EXISTS idx_folders_project ON folders(project_id)`);
  await client.query(`CREATE INDEX IF NOT EXISTS idx_folders_parent ON folders(parent_folder_id)`);
  await client.query(`CREATE INDEX IF NOT EXISTS idx_docs_project ON documents(project_id)`);
  await client.query(`CREATE INDEX IF NOT EXISTS idx_docs_folder ON documents(folder_id)`);
  await client.query(`CREATE INDEX IF NOT EXISTS idx_releases_doc ON releases(document_id)`);
  await client.query(`CREATE INDEX IF NOT EXISTS idx_invitations_token ON invitations(token)`);
  await client.query(`CREATE INDEX IF NOT EXISTS idx_invitations_email ON invitations(email)`);
}

async function initDB() {
  await runMigrations(pool);

  // Default admin if no users exist
  const adminExists = await pool.query('SELECT 1 FROM users WHERE username = $1', ['admin']);
  if (adminExists.rows.length === 0) {
    const hash = await bcrypt.hash('admin123', 10);
    await pool.query('INSERT INTO users (username, email, password_hash, is_admin) VALUES ($1, $2, $3, true)', ['admin', 'admin@docflow.local', hash]);
  } else {
    // Ensure existing admin user has is_admin=true
    await pool.query('UPDATE users SET is_admin = true WHERE username = $1', ['admin']);
  }

  console.log('Database initialized successfully');
}

// ─── Auth helpers ───
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No token' });
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.userId = payload.userId;
    req.username = payload.username;
    req.isAdmin = payload.isAdmin || false;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

function adminMiddleware(req, res, next) {
  if (!req.isAdmin) return res.status(403).json({ error: 'Admin access required' });
  next();
}

async function requireRole(userId, projectId, role) {
  const result = await pool.query(
    `SELECT role FROM project_members WHERE user_id = $1 AND project_id = $2`,
    [userId, projectId]
  );
  if (result.rows.length === 0) return null;
  const memberRole = result.rows[0].role;
  const roleRank = { owner: 3, editor: 2, viewer: 1 };
  if (roleRank[memberRole] >= roleRank[role]) return memberRole;
  return null;
}

// ─── Auth ───
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM users WHERE username = $1 OR email = $1', [username]);
    if (result.rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });
    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign(
      { userId: user.id, username: user.username, isAdmin: user.is_admin || false },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES }
    );

    res.json({
      token,
      userId: user.id,
      username: user.username,
      email: user.email,
      isAdmin: user.is_admin || false,
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/auth/register', async (req, res) => {
  const { username, email, password, invitationToken } = req.body;
  try {
    if (!invitationToken) {
      return res.status(403).json({ error: 'Registration requires an invitation link' });
    }

    const invite = await pool.query(
      `SELECT * FROM invitations WHERE token = $1 AND used_at IS NULL AND expires_at > NOW()`,
      [invitationToken]
    );
    if (invite.rows.length === 0) return res.status(400).json({ error: 'Invalid or expired invitation' });

    const inv = invite.rows[0];
    const emailToUse = inv.email || email;
    if (!emailToUse) return res.status(400).json({ error: 'Email required' });

    const exists = await pool.query('SELECT 1 FROM users WHERE username = $1 OR email = $2', [username, emailToUse]);
    if (exists.rows.length > 0) return res.status(400).json({ error: 'Username or email already taken' });

    const hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email`,
      [username, emailToUse, hash]
    );
    const user = result.rows[0];

    // Mark invitation as used
    await pool.query(`UPDATE invitations SET used_at = NOW() WHERE token = $1`, [invitationToken]);

    // If invite has a project, add user to it
    if (inv.project_id) {
      await pool.query(
        `INSERT INTO project_members (project_id, user_id, role) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
        [inv.project_id, user.id, inv.role]
      );
    }

    const token = jwt.sign(
      { userId: user.id, username: user.username, isAdmin: false },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES }
    );

    res.status(201).json({ token, userId: user.id, username: user.username, email: user.email, isAdmin: false });
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'Username or email already taken' });
    console.error('Register error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/auth/me', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, username, email, is_admin, created_at FROM users WHERE id = $1', [req.userId]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    const user = result.rows[0];

    const projectsResult = await pool.query(
      `SELECT p.id as project_id, CASE WHEN u.is_admin THEN 'owner' ELSE pm.role END as role,
              p.name, p.description
       FROM projects p
       LEFT JOIN project_members pm ON p.id = pm.project_id AND pm.user_id = $1
       JOIN users u ON u.id = $1
       WHERE u.is_admin = true OR pm.user_id = $1
       ORDER BY p.name`,
      [req.userId]
    );

    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      isAdmin: user.is_admin || false,
      projects: projectsResult.rows,
    });
  } catch (err) {
    console.error('me error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── Admin: User Management ───
app.get('/api/admin/users', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, username, email, is_admin, created_at FROM users ORDER BY created_at ASC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.delete('/api/admin/users/:id', authMiddleware, adminMiddleware, async (req, res) => {
  const targetId = parseInt(req.params.id);
  if (targetId === req.userId) return res.status(400).json({ error: 'Cannot delete yourself' });
  try {
    await pool.query('DELETE FROM users WHERE id = $1', [targetId]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin: Create a signup invite link (no project required, just gives platform access)
app.post('/api/admin/invite', authMiddleware, adminMiddleware, async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });
  try {
    const token = uuidv4();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // project_id is NULL for platform-level invites
    const result = await pool.query(
      `INSERT INTO invitations (email, project_id, role, token, expires_at, created_by)
       VALUES ($1, NULL, 'viewer', $2, $3, $4) RETURNING *`,
      [email, token, expiresAt, req.userId]
    );

    const origin = req.headers.origin || `http://localhost:${PORT}`;
    res.status(201).json({
      ...result.rows[0],
      invitationLink: `${origin}/invite/${token}`,
    });
  } catch (err) {
    console.error('Admin invite error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin: list all invitations
app.get('/api/admin/invitations', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT i.*, u.username as created_by_name FROM invitations i
       LEFT JOIN users u ON i.created_by = u.id
       ORDER BY i.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── Invitations ───
app.post('/api/invitations', authMiddleware, async (req, res) => {
  const { email, projectId, role } = req.body;
  if (!email || !projectId) return res.status(400).json({ error: 'Email and project required' });

  const memberRole = role || 'editor';
  try {
    const hasAccess = await pool.query(
      `SELECT role FROM project_members WHERE user_id = $1 AND project_id = $2`,
      [req.userId, projectId]
    );
    if (hasAccess.rows.length === 0 || hasAccess.rows[0].role !== 'owner') {
      return res.status(403).json({ error: 'Only project owners can invite members' });
    }

    const token = uuidv4();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const result = await pool.query(
      `INSERT INTO invitations (email, project_id, role, token, expires_at, created_by)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [email, projectId, memberRole, token, expiresAt, req.userId]
    );

    res.status(201).json({ ...result.rows[0], invitationLink: `/invite/${token}` });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/invitations/accept', async (req, res) => {
  const { token, username, email, password } = req.body;
  try {
    const invite = await pool.query(
      `SELECT * FROM invitations WHERE token = $1 AND used_at IS NULL AND expires_at > NOW()`,
      [token]
    );
    if (invite.rows.length === 0) return res.status(400).json({ error: 'Invalid or expired invitation' });

    const inv = invite.rows[0];
    const emailToUse = inv.email || email;
    if (!emailToUse) return res.status(400).json({ error: 'Email required' });

    const hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email`,
      [username, emailToUse, hash]
    );
    const user = result.rows[0];

    await pool.query(`UPDATE invitations SET used_at = NOW() WHERE token = $1`, [token]);

    if (inv.project_id) {
      await pool.query(
        `INSERT INTO project_members (project_id, user_id, role) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
        [inv.project_id, user.id, inv.role]
      );
    }

    const jwtToken = jwt.sign(
      { userId: user.id, username: user.username, isAdmin: false },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES }
    );

    res.status(201).json({
      token: jwtToken,
      userId: user.id,
      username: user.username,
      email: user.email,
      isAdmin: false,
    });
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'Username or email already taken' });
    console.error('Accept invite error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── Projects ───
app.get('/api/projects', authMiddleware, async (req, res) => {
  try {
    // Admins see all projects
    const isAdminCheck = await pool.query('SELECT is_admin FROM users WHERE id = $1', [req.userId]);
    const isAdmin = isAdminCheck.rows[0]?.is_admin;

    let result;
    if (isAdmin) {
      result = await pool.query(
        `SELECT p.*, 'owner' as role FROM projects p ORDER BY p.name`,
        []
      );
    } else {
      result = await pool.query(
        `SELECT p.*, pm.role FROM projects p
         JOIN project_members pm ON p.id = pm.project_id
         WHERE pm.user_id = $1 ORDER BY p.name`,
        [req.userId]
      );
    }
    res.json(result.rows);
  } catch (err) {
    console.error('projects list error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/projects', authMiddleware, async (req, res) => {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ error: 'Name required' });
  try {
    const projectId = uuidv4();
    await pool.query(
      `INSERT INTO projects (id, name, description, created_by) VALUES ($1, $2, $3, $4)`,
      [projectId, name, description || null, req.userId]
    );
    await pool.query(
      `INSERT INTO project_members (project_id, user_id, role) VALUES ($1, $2, $3)`,
      [projectId, req.userId, 'owner']
    );
    const result = await pool.query(
      `SELECT p.*, pm.role FROM projects p JOIN project_members pm ON p.id = pm.project_id WHERE p.id = $1 AND pm.user_id = $2`,
      [projectId, req.userId]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/projects/:id', authMiddleware, async (req, res) => {
  try {
    const isAdminCheck = await pool.query('SELECT is_admin FROM users WHERE id = $1', [req.userId]);
    const isAdmin = isAdminCheck.rows[0]?.is_admin;

    let result;
    if (isAdmin) {
      result = await pool.query(
        `SELECT p.*, 'owner' as role FROM projects p WHERE p.id = $1`,
        [req.params.id]
      );
    } else {
      result = await pool.query(
        `SELECT p.*, pm.role FROM projects p JOIN project_members pm ON p.id = pm.project_id
         WHERE p.id = $1 AND pm.user_id = $2`,
        [req.params.id, req.userId]
      );
    }
    if (result.rows.length === 0) return res.status(404).json({ error: 'Project not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('get project error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.delete('/api/projects/:id', authMiddleware, async (req, res) => {
  try {
    const canDelete = await requireRole(req.userId, req.params.id, 'owner');
    if (!canDelete) return res.status(403).json({ error: 'Only owners can delete projects' });
    await pool.query('DELETE FROM projects WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.patch('/api/projects/:id', authMiddleware, async (req, res) => {
  const { name, description } = req.body;
  try {
    const canEdit = await requireRole(req.userId, req.params.id, 'owner');
    if (!canEdit) return res.status(403).json({ error: 'Only owners can edit projects' });
    const fields = [];
    const values = [];
    let idx = 1;
    if (name !== undefined) { fields.push(`name = $${idx++}`); values.push(name); }
    if (description !== undefined) { fields.push(`description = $${idx++}`); values.push(description); }
    fields.push(`updated_at = NOW()`);
    values.push(req.params.id);
    await pool.query(`UPDATE projects SET ${fields.join(', ')} WHERE id = $${idx}`, values);
    const result = await pool.query(
      `SELECT p.*, pm.role FROM projects p JOIN project_members pm ON p.id = pm.project_id WHERE p.id = $1 AND pm.user_id = $2`,
      [req.params.id, req.userId]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── Project Members ───
app.get('/api/projects/:id/members', authMiddleware, async (req, res) => {
  try {
    const canView = await requireRole(req.userId, req.params.id, 'viewer');
    if (!canView) return res.status(403).json({ error: 'Access denied' });
    const result = await pool.query(
      `SELECT u.id, u.username, u.email, pm.role, u.created_at
       FROM project_members pm
       JOIN users u ON pm.user_id = u.id
       WHERE pm.project_id = $1
       ORDER BY u.username`,
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/projects/:id/members', authMiddleware, async (req, res) => {
  const { userId, role } = req.body;
  if (!userId || !role) return res.status(400).json({ error: 'userId and role required' });
  try {
    const canManage = await requireRole(req.userId, req.params.id, 'owner');
    if (!canManage) return res.status(403).json({ error: 'Only owners can manage members' });

    const exists = await pool.query(
      `SELECT 1 FROM project_members WHERE project_id = $1 AND user_id = $2`,
      [req.params.id, userId]
    );
    if (exists.rows.length > 0) return res.status(400).json({ error: 'User already a member' });

    await pool.query(
      `INSERT INTO project_members (project_id, user_id, role) VALUES ($1, $2, $3)`,
      [req.params.id, userId, role]
    );
    res.status(201).json({ success: true });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.delete('/api/projects/:id/members/:userId', authMiddleware, async (req, res) => {
  try {
    const canManage = await requireRole(req.userId, req.params.id, 'owner');
    if (!canManage) return res.status(403).json({ error: 'Only owners can manage members' });
    if (parseInt(req.params.userId) === req.userId) return res.status(400).json({ error: 'Cannot remove yourself' });
    await pool.query(
      `DELETE FROM project_members WHERE project_id = $1 AND user_id = $2`,
      [req.params.id, req.params.userId]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.patch('/api/projects/:id/members/:userId', authMiddleware, async (req, res) => {
  const { role } = req.body;
  if (!role) return res.status(400).json({ error: 'Role required' });
  try {
    const canManage = await requireRole(req.userId, req.params.id, 'owner');
    if (!canManage) return res.status(403).json({ error: 'Only owners can manage members' });
    await pool.query(
      `UPDATE project_members SET role = $1 WHERE project_id = $2 AND user_id = $3`,
      [role, req.params.id, req.params.userId]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── Folders (subcarpetas) ───
app.get('/api/projects/:id/folders', authMiddleware, async (req, res) => {
  try {
    const canView = await requireRole(req.userId, req.params.id, 'viewer');
    if (!canView) return res.status(403).json({ error: 'Access denied' });
    const result = await pool.query(
      `SELECT * FROM folders WHERE project_id = $1 AND parent_folder_id IS NULL ORDER BY name`,
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/folders/:id/subfolders', authMiddleware, async (req, res) => {
  try {
    const parent = await pool.query('SELECT project_id FROM folders WHERE id = $1', [req.params.id]);
    if (parent.rows.length === 0) return res.status(404).json({ error: 'Folder not found' });
    const canView = await requireRole(req.userId, parent.rows[0].project_id, 'viewer');
    if (!canView) return res.status(403).json({ error: 'Access denied' });
    const result = await pool.query(
      `SELECT * FROM folders WHERE parent_folder_id = $1 ORDER BY name`,
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/folders', authMiddleware, async (req, res) => {
  const { name, projectId, parentFolderId } = req.body;
  if (!name || !projectId) return res.status(400).json({ error: 'Name and projectId required' });
  try {
    const canEdit = await requireRole(req.userId, projectId, 'editor');
    if (!canEdit) return res.status(403).json({ error: 'Access denied' });
    const result = await pool.query(
      `INSERT INTO folders (project_id, name, parent_folder_id) VALUES ($1, $2, $3) RETURNING *`,
      [projectId, name, parentFolderId || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.delete('/api/folders/:id', authMiddleware, async (req, res) => {
  try {
    const folder = await pool.query('SELECT project_id FROM folders WHERE id = $1', [req.params.id]);
    if (folder.rows.length === 0) return res.status(404).json({ error: 'Folder not found' });
    const canEdit = await requireRole(req.userId, folder.rows[0].project_id, 'editor');
    if (!canEdit) return res.status(403).json({ error: 'Access denied' });
    await pool.query('DELETE FROM folders WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── Documents ───
app.get('/api/projects/:id/documents', authMiddleware, async (req, res) => {
  try {
    const canView = await requireRole(req.userId, req.params.id, 'viewer');
    if (!canView) return res.status(403).json({ error: 'Access denied' });
    const { folderId } = req.query;
    let result;
    if (folderId) {
      result = await pool.query(
        `SELECT id, project_id, folder_id, title, is_public, public_token, created_at, updated_at,
                created_by, updated_by,
                (SELECT username FROM users WHERE id = d.created_by) as author_name
         FROM documents d
         WHERE project_id = $1 AND folder_id = $2
         ORDER BY created_at DESC`,
        [req.params.id, folderId]
      );
    } else {
      result = await pool.query(
        `SELECT id, project_id, folder_id, title, is_public, public_token, created_at, updated_at,
                created_by, updated_by,
                (SELECT username FROM users WHERE id = d.created_by) as author_name
         FROM documents d
         WHERE project_id = $1 AND folder_id IS NULL
         ORDER BY created_at DESC`,
        [req.params.id]
      );
    }
    res.json(result.rows);
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/documents/:id', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT d.*, u.username as author_name FROM documents d
       LEFT JOIN users u ON d.created_by = u.id
       WHERE d.id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Document not found' });
    const doc = result.rows[0];

    const hasAccess = await requireRole(req.userId, doc.project_id, 'viewer');
    if (!hasAccess) return res.status(403).json({ error: 'Access denied' });

    res.json({
      id: doc.id,
      project_id: doc.project_id,
      folder_id: doc.folder_id,
      title: doc.title,
      is_public: doc.is_public,
      public_token: doc.public_token,
      content: doc.content || [],
      created_at: doc.created_at,
      updated_at: doc.updated_at,
      author_name: doc.author_name,
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/documents', authMiddleware, async (req, res) => {
  const { title, projectId, folderId, content } = req.body;
  if (!title || !projectId) return res.status(400).json({ error: 'Title and projectId required' });
  try {
    const canEdit = await requireRole(req.userId, projectId, 'editor');
    if (!canEdit) return res.status(403).json({ error: 'Access denied' });
    const result = await pool.query(
      `INSERT INTO documents (project_id, folder_id, title, content, created_by, updated_by)
       VALUES ($1, $2, $3, COALESCE($4::jsonb, '[]'::jsonb), $5, $5) RETURNING *`,
      [projectId, folderId || null, title, JSON.stringify(content || []), req.userId]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.put('/api/documents/:id', authMiddleware, async (req, res) => {
  const { title, content, folderId } = req.body;
  const fields = [];
  const params = [];
  let idx = 1;
  if (title !== undefined && title !== '') { fields.push(`title = $${idx}`); params.push(title); idx++; }
  if (content !== undefined) { fields.push(`content = $${idx}`); params.push(JSON.stringify(content)); idx++; }
  if (folderId !== undefined) { fields.push(`folder_id = $${idx}`); params.push(folderId === '' ? null : folderId); idx++; }
  fields.push(`updated_at = NOW(), updated_by = $${idx}`); params.push(req.userId); idx++;
  params.push(req.params.id);

  try {
    const result = await pool.query(
      `UPDATE documents SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
      params
    );
    if (result.rows.length === 0) {
      const check = await pool.query('SELECT id FROM documents WHERE id = $1', [req.params.id]);
      if (check.rows.length === 0) return res.status(404).json({ error: 'Document not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('PUT document error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

app.delete('/api/documents/:id', authMiddleware, async (req, res) => {
  try {
    const doc = await pool.query('SELECT project_id FROM documents WHERE id = $1', [req.params.id]);
    if (doc.rows.length === 0) return res.status(404).json({ error: 'Document not found' });
    const canEdit = await requireRole(req.userId, doc.rows[0].project_id, 'editor');
    if (!canEdit) return res.status(403).json({ error: 'Access denied' });
    await pool.query('DELETE FROM documents WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/documents/:id/copy', authMiddleware, async (req, res) => {
  try {
    const canEdit = await requireRole(req.userId, req.body.projectId || 'none', 'editor');
    if (!canEdit) return res.status(403).json({ error: 'Access denied' });
    const src = await pool.query('SELECT * FROM documents WHERE id = $1', [req.params.id]);
    if (src.rows.length === 0) return res.status(404).json({ error: 'Source not found' });
    const s = src.rows[0];
    const result = await pool.query(
      `INSERT INTO documents (project_id, folder_id, title, content, created_by, updated_by)
       VALUES ($1, $2, $3 || ' (copy)', $4, $5, $5) RETURNING *`,
      [s.project_id, s.folder_id, s.title, s.content, req.userId]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.patch('/api/documents/:id', authMiddleware, async (req, res) => {
  const { folderId } = req.body;
  try {
    const doc = await pool.query('SELECT project_id FROM documents WHERE id = $1', [req.params.id]);
    if (doc.rows.length === 0) return res.status(404).json({ error: 'Document not found' });
    const canEdit = await requireRole(req.userId, doc.rows[0].project_id, 'editor');
    if (!canEdit) return res.status(403).json({ error: 'Access denied' });
    const result = await pool.query(
      `UPDATE documents SET folder_id = $1, updated_at = NOW(), updated_by = $2 WHERE id = $3 RETURNING *`,
      [folderId === '' ? null : folderId, req.userId, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.patch('/api/documents/:id/share', authMiddleware, async (req, res) => {
  const { isPublic } = req.body;
  try {
    const doc = await pool.query('SELECT project_id FROM documents WHERE id = $1', [req.params.id]);
    if (doc.rows.length === 0) return res.status(404).json({ error: 'Document not found' });
    const canShare = await requireRole(req.userId, doc.rows[0].project_id, 'owner');
    if (!canShare) return res.status(403).json({ error: 'Only owners can share documents' });
    const result = await pool.query(
      `UPDATE documents SET is_public = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [isPublic, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── Releases ───
app.post('/api/documents/:id/releases', authMiddleware, async (req, res) => {
  const { title, description } = req.body;
  if (!title) return res.status(400).json({ error: 'Release title required' });
  try {
    const doc = await pool.query(
      `SELECT content, project_id FROM documents WHERE id = $1`,
      [req.params.id]
    );
    if (doc.rows.length === 0) return res.status(404).json({ error: 'Document not found' });

    const canCommit = await requireRole(req.userId, doc.rows[0].project_id, 'editor');
    if (!canCommit) return res.status(403).json({ error: 'Access denied' });

    const docContent = doc.rows[0].content || [];
    if (docContent.length === 0) return res.status(400).json({ error: 'Cannot release an empty document' });

    // Get next version number
    const verResult = await pool.query(
      `SELECT COALESCE(MAX(version_number), 0) as max_ver FROM releases WHERE document_id = $1`,
      [req.params.id]
    );
    const nextVersion = verResult.rows[0].max_ver + 1;

    const result = await pool.query(
      `INSERT INTO releases (document_id, content, title, description, version_number, created_by)
       VALUES ($1, $2::jsonb, $3, $4, $5, $6) RETURNING *`,
      [req.params.id, JSON.stringify(docContent), title, description || null, nextVersion, req.userId]
    );

    // Also update published_content
    await pool.query(
      `UPDATE documents SET published_content = $1::jsonb, updated_at = NOW(), updated_by = $2 WHERE id = $3`,
      [JSON.stringify(docContent), req.userId, req.params.id]
    );

    const release = result.rows[0];
    const author = await pool.query('SELECT username FROM users WHERE id = $1', [req.userId]);

    res.status(201).json({
      ...release,
      version_number: release.version_number,
      content: docContent,
      author: author.rows[0]?.username,
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/documents/:id/releases', authMiddleware, async (req, res) => {
  try {
    const doc = await pool.query('SELECT project_id FROM documents WHERE id = $1', [req.params.id]);
    if (doc.rows.length === 0) return res.status(404).json({ error: 'Document not found' });
    const canView = await requireRole(req.userId, doc.rows[0].project_id, 'viewer');
    if (!canView) return res.status(403).json({ error: 'Access denied' });

    const result = await pool.query(
      `SELECT r.*, u.username as author FROM releases r
       LEFT JOIN users u ON r.created_by = u.id
       WHERE r.document_id = $1
       ORDER BY r.version_number DESC`,
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/documents/:id/releases/:releaseId', authMiddleware, async (req, res) => {
  try {
    const doc = await pool.query('SELECT project_id FROM documents WHERE id = $1', [req.params.id]);
    if (doc.rows.length === 0) return res.status(404).json({ error: 'Document not found' });
    const canView = await requireRole(req.userId, doc.rows[0].project_id, 'viewer');
    if (!canView) return res.status(403).json({ error: 'Access denied' });

    const result = await pool.query(
      `SELECT r.*, u.username as author FROM releases r
       LEFT JOIN users u ON r.created_by = u.id
       WHERE r.document_id = $1 AND r.id = $2`,
      [req.params.id, req.params.releaseId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Release not found' });
    const release = result.rows[0];
    res.json({
      ...release,
      content: typeof release.content === 'string' ? JSON.parse(release.content) : release.content,
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── Share (public, no auth) ───
app.get('/api/share/:token', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT d.id, d.title, d.published_content, d.is_public, d.public_token,
              u.username as author_name, d.updated_at
       FROM documents d
       LEFT JOIN users u ON d.created_by = u.id
       WHERE d.public_token = $1 AND d.is_public = true`,
      [req.params.token]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Document not found or not shared' });
    const doc = result.rows[0];

    const releases = await pool.query(
      `SELECT r.id, r.title, r.description, r.version_number, r.created_at, r.content, u.username as author
       FROM releases r
       LEFT JOIN users u ON r.created_by = u.id
       WHERE r.document_id = $1
       ORDER BY r.version_number DESC`,
      [doc.id]
    );

    res.json({
      id: doc.id,
      title: doc.title,
      content: typeof doc.published_content === 'string' ? JSON.parse(doc.published_content) : doc.published_content,
      author_name: doc.author_name,
      updated_at: doc.updated_at,
      releases: releases.rows.map(r => ({
        ...r,
        content: typeof r.content === 'string' ? JSON.parse(r.content) : r.content,
      })),
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── Upload ───
app.post('/api/upload', authMiddleware, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  try {
    const ext = path.extname(req.file.filename).toLowerCase();
    const originalPath = req.file.path;
    const mimeType = req.file.mimetype;
    const isImage = allowedImageExts.includes(ext);
    const isVideo = allowedVideoExts.includes(ext);

    let finalPath = originalPath;
    let urlPath = `/uploads/${req.file.filename}`;
    let type = 'unknown';

    if (isImage) {
      const webpName = `${uuidv4()}.webp`;
      const webpPath = path.join(UPLOAD_DIR, webpName);
      const webpUrl = `/uploads/${webpName}`;
      await sharp(originalPath)
        .webp({ quality: 80 })
        .toFile(webpPath);
      fs.unlinkSync(originalPath);
      finalPath = webpPath;
      urlPath = webpUrl;
      type = 'image';
    } else if (isVideo) {
      type = 'video';
    }

    res.json({
      url: urlPath,
      type: type,
      mimeType: mimeType,
      size: fs.statSync(finalPath).size,
    });
  } catch (err) {
    console.error('Upload error:', err.message);
    if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ error: 'Upload failed' });
  }
});

app.delete('/api/uploads/:filename', authMiddleware, async (req, res) => {
  const filename = path.basename(req.params.filename);
  const filePath = path.join(UPLOAD_DIR, filename);
  try {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Delete failed' });
  }
});

// ─── Export ───
app.get('/api/export', authMiddleware, async (req, res) => {
  try {
    const folders = await pool.query(
      `SELECT f.*, p.name as project_name FROM folders f
       JOIN projects p ON f.project_id = p.id
       WHERE EXISTS (SELECT 1 FROM project_members WHERE project_id = f.project_id AND user_id = $1)`,
      [req.userId]
    );
    const docs = await pool.query(
      `SELECT d.*, f.name as folder_name, p.name as project_name FROM documents d
       JOIN projects p ON d.project_id = p.id
       LEFT JOIN folders f ON d.folder_id = f.id
       WHERE EXISTS (SELECT 1 FROM project_members WHERE project_id = d.project_id AND user_id = $1)`,
      [req.userId]
    );
    res.json({
      exportedAt: new Date().toISOString(),
      folders: folders.rows,
      documents: docs.rows,
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

initDB();

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
