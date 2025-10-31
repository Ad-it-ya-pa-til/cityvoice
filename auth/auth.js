/**
 * Authentication Logic
 * JWT + bcrypt implementation
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const UserDB = require('./database');

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';
const JWT_EXPIRE = process.env.JWT_EXPIRE || '7d';

const Auth = {
  /**
   * Hash password
   */
  async hashPassword(password) {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  },

  /**
   * Compare password
   */
  async comparePassword(password, hashedPassword) {
    return bcrypt.compare(password, hashedPassword);
  },

  /**
   * Generate JWT token
   */
  generateToken(user) {
    const payload = {
      id: user.id,
      email: user.email,
      role: user.role
    };

    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRE
    });
  },

  /**
   * Verify JWT token
   */
  verifyToken(token) {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return null;
    }
  },

  /**
   * Register new user
   */
  async register(email, password, name, role = 'user') {
    try {
      // Check if user exists
      const existing = UserDB.findByEmail(email);
      if (existing) {
        return { success: false, error: 'User already exists' };
      }

      // Validate inputs
      if (!email || !password || !name) {
        return { success: false, error: 'All fields are required' };
      }

      if (password.length < 6) {
        return { success: false, error: 'Password must be at least 6 characters' };
      }

      // Hash password
      const hashedPassword = await this.hashPassword(password);

      // Create user
      const user = UserDB.create(email, hashedPassword, name, role);

      // Generate token
      const token = this.generateToken(user);

      return {
        success: true,
        user: UserDB.getSafe(user),
        token
      };
    } catch (error) {
      console.error('Register error:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Login user
   */
  async login(email, password) {
    try {
      // Find user
      const user = UserDB.findByEmail(email);
      if (!user) {
        return { success: false, error: 'Invalid credentials' };
      }

      // Check if active
      if (!user.is_active) {
        return { success: false, error: 'Account is deactivated' };
      }

      // Compare password
      const isMatch = await this.comparePassword(password, user.password);
      if (!isMatch) {
        return { success: false, error: 'Invalid credentials' };
      }

      // Update last login
      UserDB.updateLastLogin(user.id);

      // Generate token
      const token = this.generateToken(user);

      return {
        success: true,
        user: UserDB.getSafe(user),
        token
      };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Get user from token
   */
  getUserFromToken(token) {
    const decoded = this.verifyToken(token);
    if (!decoded) return null;

    const user = UserDB.findById(decoded.id);
    return user ? UserDB.getSafe(user) : null;
  },

  /**
   * Check if user is admin
   */
  isAdmin(user) {
    return user && user.role === 'admin';
  },

  /**
   * Create first admin (run once)
   */
  async createFirstAdmin(email, password, name) {
    try {
      const result = await this.register(email, password, name, 'admin');
      if (result.success) {
        console.log('✅ Admin user created successfully!');
        console.log('Email:', email);
        console.log('Role: admin');
      }
      return result;
    } catch (error) {
      console.error('Error creating admin:', error);
      return { success: false, error: error.message };
    }
  }
};

module.exports = Auth;
