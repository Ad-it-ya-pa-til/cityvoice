/**
 * User Database - SQLite3
 * Simple, secure user management without Firebase
 */

const Database = require('better-sqlite3');
const path = require('path');

// Initialize database
const db = new Database(path.join(__dirname, '..', 'users.db'));

// Create users table
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT DEFAULT 'user',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT 1,
    last_login DATETIME
  )
`);

// Create index for faster email lookups
db.exec(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`);

// User operations
const UserDB = {
  /**
   * Create new user
   */
  create(email, hashedPassword, name, role = 'user') {
    const stmt = db.prepare(`
      INSERT INTO users (email, password, name, role)
      VALUES (?, ?, ?, ?)
    `);
    
    const result = stmt.run(email, hashedPassword, name, role);
    return this.findById(result.lastInsertRowid);
  },

  /**
   * Find user by email
   */
  findByEmail(email) {
    const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
    return stmt.get(email);
  },

  /**
   * Find user by ID
   */
  findById(id) {
    const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
    return stmt.get(id);
  },

  /**
   * Update user
   */
  update(id, updates) {
    const fields = [];
    const values = [];
    
    Object.keys(updates).forEach(key => {
      fields.push(`${key} = ?`);
      values.push(updates[key]);
    });
    
    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);
    
    const stmt = db.prepare(`
      UPDATE users 
      SET ${fields.join(', ')}
      WHERE id = ?
    `);
    
    stmt.run(...values);
    return this.findById(id);
  },

  /**
   * Update last login
   */
  updateLastLogin(id) {
    const stmt = db.prepare(`
      UPDATE users 
      SET last_login = CURRENT_TIMESTAMP 
      WHERE id = ?
    `);
    stmt.run(id);
  },

  /**
   * Delete user (soft delete)
   */
  delete(id) {
    const stmt = db.prepare('UPDATE users SET is_active = 0 WHERE id = ?');
    return stmt.run(id);
  },

  /**
   * Get all users
   */
  getAll() {
    const stmt = db.prepare('SELECT id, email, name, role, created_at, last_login FROM users WHERE is_active = 1');
    return stmt.all();
  },

  /**
   * Get user without sensitive data
   */
  getSafe(user) {
    if (!user) return null;
    const { password, ...safeUser } = user;
    return safeUser;
  }
};

module.exports = UserDB;
