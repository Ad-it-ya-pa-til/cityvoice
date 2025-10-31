// 1. Import Express
const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const admin = require('firebase-admin');
const multer = require('multer');
const { v2: cloudinary } = require('cloudinary');
const compression = require('compression');
const helmet = require('helmet');

// Import database functions
const db = require('./database/db');

// 2. Create an instance of an Express app
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Performance & security
app.set('etag', 'strong');
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://unpkg.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://unpkg.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "https://*.tile.openstreetmap.org", "https://*.openstreetmap.org"],
      connectSrc: ["'self'", "https://unpkg.com", "https://nominatim.openstreetmap.org", "https://*.tile.openstreetmap.org"],
      workerSrc: ["'self'", "blob:"],
      childSrc: ["'self'", "blob:"],
    },
  },
}));
app.use(compression({ threshold: 1024 })); // compress responses >1KB

// Static assets: long-term cache for assets, no-cache for HTML
app.use(express.static('public', {
  etag: true,
  lastModified: true,
  setHeaders(res, filePath) {
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    } else if (/\.(?:css|js|png|jpg|jpeg|gif|svg|webp|ico|woff2?|ttf|otf)$/.test(filePath)) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    } else {
      res.setHeader('Cache-Control', 'public, max-age=3600');
    }
  },
}));
app.use('/uploads', express.static('uploads'));

// Optional: file uploads via multer (if available)
let upload = null;
try {
  const multer = require('multer');
  const fs = require('fs');
  const uploadsDir = path.join(__dirname, 'uploads');
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);
  const storage = multer.diskStorage({
    destination: function (req, file, cb) { cb(null, uploadsDir); },
    filename: function (req, file, cb) {
      const ext = path.extname(file.originalname || '');
      cb(null, `evidence_${Date.now()}${ext}`);
    }
  });
  upload = multer({ storage });
} catch (e) {
  console.warn('multer not installed - evidence upload disabled');
}
const maybeUpload = (req, res, next) => {
  if (upload) return upload.single('evidence')(req, res, next);
  next();
};

// --- External services init (Firebase Admin, Cloudinary) ---
dotenv.config();
let firebaseEnabled = false;
try {
  if (!admin.apps.length) {
    let creds = null;
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      creds = JSON.parse(Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT, 'base64').toString('utf8'));
    }
    if (creds && creds.project_id && creds.private_key && creds.client_email) {
      admin.initializeApp({ credential: admin.credential.cert(creds) });
      firebaseEnabled = true;
      console.log('Firebase Admin initialized successfully');
    }
  }
} catch (e) {
  console.warn('Firebase Admin not initialized:', e.message);
  firebaseEnabled = false;
}
try {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
} catch (e) {
  console.warn('Cloudinary not configured:', e.message);
}
// Multer memory storage for Cloudinary uploads
const memUpload = multer({ storage: multer.memoryStorage ? multer.memoryStorage() : undefined });

// 3. Define the port number
const port = process.env.PORT || 3000;

// 4. Define a simple route
// This listens for GET requests on the root URL ("/")
app.get('/', (req, res) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Simple health check
app.get('/healthz', (req, res) => {
  res.json({ status: 'ok' });
});

// In-memory stores (for demo only)
const users = new Map(); // key: email, value: { name, email, password }
let complaintId = 1;
const complaints = []; // { id, title, description, location, status, userEmail, createdAt }

function getUserFromToken(req) {
  const token = req.headers['x-auth-token'];
  if (!token) return null;
  // naive token: "email:<email>"
  const prefix = 'email:';
  if (!token.startsWith(prefix)) return null;
  const email = token.slice(prefix.length);
  return users.get(email) || null;
}

// Auth routes
app.post('/api/auth/signup', (req, res) => {
  const { name, email, password } = req.body || {};
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'name, email, password are required' });
  }
  if (users.has(email)) {
    return res.status(409).json({ error: 'user already exists' });
  }
  users.set(email, { name, email, password });
  const token = `email:${email}`;
  res.status(201).json({ user: { name, email }, token });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body || {};
  const user = users.get(email);
  if (!user || user.password !== password) {
    return res.status(401).json({ error: 'invalid credentials' });
  }
  const token = `email:${email}`;
  res.json({ user: { name: user.name, email }, token });
});

// --- Firebase-based auth routes ---
// Register user with Firebase Admin
app.post('/api/auth/register', async (req, res) => {
  try {
    if (!firebaseEnabled) return res.status(503).json({ error: 'firebase not configured' });
    const { email, password, displayName, fcmToken } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'email and password required' });
    const user = await admin.auth().createUser({ email, password, displayName });
    if (fcmToken) {
      const current = (await admin.auth().getUser(user.uid)).customClaims || {};
      await admin.auth().setCustomUserClaims(user.uid, { ...current, fcmToken });
    }
    res.status(201).json({ uid: user.uid, email: user.email, displayName: user.displayName });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});
// Login verification using Firebase ID token
app.post('/api/auth/verify', async (req, res) => {
  try {
    if (!firebaseEnabled) return res.status(503).json({ error: 'firebase not configured' });
    const { idToken, fcmToken } = req.body || {};
    if (!idToken) return res.status(400).json({ error: 'idToken required' });
    const decoded = await admin.auth().verifyIdToken(idToken);
    if (fcmToken) {
      const current = (await admin.auth().getUser(decoded.uid)).customClaims || {};
      if (current.fcmToken !== fcmToken) {
        await admin.auth().setCustomUserClaims(decoded.uid, { ...current, fcmToken });
      }
    }
    res.json({ uid: decoded.uid, email: decoded.email, name: decoded.name || null });
  } catch (e) {
    res.status(401).json({ error: e.message });
  }
});

// Middleware to verify Firebase ID token from Authorization: Bearer <token>
function requireFirebaseAuth(req, res, next) {
  if (!firebaseEnabled) return res.status(401).json({ error: 'firebase not configured' });
  const idToken = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!idToken) return res.status(401).json({ error: 'missing id token' });
  admin.auth().verifyIdToken(idToken)
    .then(decoded => { req.firebaseUser = decoded; next(); })
    .catch(() => res.status(401).json({ error: 'invalid id token' }));
}

// Current user
app.get('/api/users/me', async (req, res) => {
  const bearer = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (bearer && firebaseEnabled) {
    try {
      const decoded = await admin.auth().verifyIdToken(bearer);
      return res.json({ name: decoded.name || null, email: decoded.email || null, uid: decoded.uid });
    } catch (_) {}
  }
  const user = getUserFromToken(req);
  if (!user) return res.status(401).json({ error: 'unauthorized' });
  res.json({ name: user.name, email: user.email });
});

// Complaint routes - Using Firestore Database
app.post('/api/complaints', maybeUpload, async (req, res) => {
  try {
    // Get user from Firebase token
    const bearer = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
    let userId = null;
    let userEmail = null;
    
    if (bearer && firebaseEnabled) {
      try {
        const decoded = await admin.auth().verifyIdToken(bearer);
        userId = decoded.uid;
        userEmail = decoded.email;
      } catch (e) {
        return res.status(401).json({ error: 'Invalid authentication token' });
      }
    } else {
      const user = getUserFromToken(req);
      if (!user) return res.status(401).json({ error: 'unauthorized' });
      userEmail = user.email;
    }
    
    const { title, description, location, category } = req.body || {};
    if (!title || !description) {
      return res.status(400).json({ error: 'title and description are required' });
    }
    
    let { lat, lng } = req.body || {};
    const evidenceUrl = req.file ? `/uploads/${req.file.filename}` : null;
    
    // Create complaint in Firestore
    const complaintData = {
      userId: userId || userEmail,
      title,
      description,
      category: category || 'general',
      location: {
        address: location || 'Not specified',
        lat: lat ? Number(lat) : null,
        lng: lng ? Number(lng) : null
      },
      evidence: evidenceUrl
    };
    
    const complaint = await db.createComplaint(complaintData);
    
    // Create notification for user
    if (userId) {
      await db.createNotification({
        userId,
        type: 'complaint_update',
        title: 'Complaint Submitted',
        message: `Your complaint "${title}" has been submitted successfully.`,
        link: `/track.html?id=${complaint.complaintId}`
      });
    }
    
    res.status(201).json(complaint);
  } catch (error) {
    console.error('Error creating complaint:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/complaints', async (req, res) => {
  try {
    const { mine } = req.query || {};
    
    if (mine) {
      const bearer = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
      if (bearer && firebaseEnabled) {
        try {
          const decoded = await admin.auth().verifyIdToken(bearer);
          const userComplaints = await db.getComplaintsByUser(decoded.uid);
          return res.json(userComplaints);
        } catch (e) {
          return res.status(401).json({ error: 'Invalid token' });
        }
      }
      return res.status(401).json({ error: 'unauthorized' });
    }
    
    // Return all complaints (for admin or public view)
    // Note: In production, you may want to implement pagination
    const allComplaints = []; // Implement getAllComplaints if needed
    res.json(allComplaints);
  } catch (error) {
    console.error('Error fetching complaints:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/complaints/:id', async (req, res) => {
  try {
    const complaintId = req.params.id;
    const complaint = await db.getComplaintById(complaintId);
    
    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found' });
    }
    
    res.json(complaint);
  } catch (error) {
    console.error('Error fetching complaint:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/complaints/:id', async (req, res) => {
  try {
    const complaintId = req.params.id;
    const bearer = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
    
    if (!bearer || !firebaseEnabled) {
      return res.status(401).json({ error: 'unauthorized' });
    }
    
    const decoded = await admin.auth().verifyIdToken(bearer);
    const { status, title, category, description, location } = req.body || {};
    
    // Verify complaint belongs to user (implement ownership check in db.js if needed)
    const complaint = await db.getComplaintById(complaintId);
    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found' });
    }
    
    if (complaint.userId !== decoded.uid) {
      return res.status(403).json({ error: 'Forbidden: Not your complaint' });
    }
    
    // Update complaint with new status or details
    if (status) {
      const message = `Status updated to ${status}`;
      const updated = await db.updateComplaintStatus(complaintId, status, message);
      return res.json(updated);
    }
    
    // For other updates, you'd need to implement updateComplaint in db.js
    res.json({ message: 'Update functionality to be implemented' });
  } catch (error) {
    console.error('Error updating complaint:', error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/complaints/:id', async (req, res) => {
  try {
    const complaintId = req.params.id;
    const bearer = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
    
    if (!bearer || !firebaseEnabled) {
      return res.status(401).json({ error: 'unauthorized' });
    }
    
    const decoded = await admin.auth().verifyIdToken(bearer);
    
    // Verify complaint belongs to user
    const complaint = await db.getComplaintById(complaintId);
    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found' });
    }
    
    if (complaint.userId !== decoded.uid) {
      return res.status(403).json({ error: 'Forbidden: Not your complaint' });
    }
    
    await db.deleteComplaint(complaintId);
    res.json({ message: 'Complaint deleted successfully' });
  } catch (error) {
    console.error('Error deleting complaint:', error);
    res.status(500).json({ error: error.message });
  }
});

// --- New complaint submit route using Cloudinary & geolocation ---
// Accepts multipart (with field name 'evidence') or JSON (no file)
app.post('/api/complaints/submit', memUpload.single('evidence'), async (req, res) => {
  try {
    const user = getUserFromToken(req);
    if (!user) return res.status(401).json({ error: 'unauthorized' });
    
    const { title, description, category, lat, lng, location } = req.body || {};
    if (!title || !description) return res.status(400).json({ error: 'title and description required' });
    let evidenceUrl = null;
    if (req.file && req.file.buffer && cloudinary.config().cloud_name) {
      evidenceUrl = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: 'cityvoice/evidence', resource_type: 'auto' },
          (err, result) => err ? reject(err) : resolve(result.secure_url)
        );
        stream.end(req.file.buffer);
      });
    }
    const complaint = {
      id: complaintId++,
      title,
      description,
      location: location || null,
      category: category || null,
      status: 'Submitted',
      userEmail: user.email,
      createdAt: new Date().toISOString(),
      coords: (lat && lng) ? { lat: Number(lat), lng: Number(lng) } : null,
      evidenceUrl,
    };
    complaints.push(complaint);
    res.status(201).json(complaint);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// --- Admin: update status and notify via FCM ---
app.post('/api/admin/update-status/:complaintId', async (req, res) => {
  try {
    const id = Number(req.params.complaintId);
    const c = complaints.find(x => x.id === id);
    if (!c) return res.status(404).json({ error: 'complaint not found' });
    const { status } = req.body || {};
    if (!status) return res.status(400).json({ error: 'status required' });
    c.status = status;
    // Send FCM if we have token in custom claims
    if (firebaseEnabled && c.userUid) {
      try {
        const userRecord = await admin.auth().getUser(c.userUid);
        const fcmToken = userRecord.customClaims && userRecord.customClaims.fcmToken;
        if (fcmToken) {
          await admin.messaging().send({
            token: fcmToken,
            notification: { title: 'Complaint status updated', body: `${c.title} is now ${status}` },
            data: { complaintId: String(c.id), status },
          });
        }
      } catch (e) {
        console.warn('FCM send failed:', e.message);
      }
    }
    res.json({ ok: true, complaint: c });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ==================== USER PROFILE API ====================

// Get user profile
app.get('/api/users/profile', async (req, res) => {
  try {
    const bearer = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
    if (!bearer || !firebaseEnabled) {
      return res.status(401).json({ error: 'unauthorized' });
    }
    
    const decoded = await admin.auth().verifyIdToken(bearer);
    const user = await db.getUserById(decoded.uid);
    
    if (!user) {
      // Create user profile if it doesn't exist
      const newUser = await db.createUser({
        uid: decoded.uid,
        email: decoded.email,
        firstName: decoded.name || '',
        surname: ''
      });
      return res.json(newUser);
    }
    
    res.json(user);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update user profile
app.put('/api/users/profile', async (req, res) => {
  try {
    const bearer = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
    if (!bearer || !firebaseEnabled) {
      return res.status(401).json({ error: 'unauthorized' });
    }
    
    const decoded = await admin.auth().verifyIdToken(bearer);
    const updates = req.body;
    
    const updatedUser = await db.updateUser(decoded.uid, updates);
    res.json(updatedUser);
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== REPORTS API ====================

// Create a new report
app.post('/api/reports', async (req, res) => {
  try {
    const bearer = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
    if (!bearer || !firebaseEnabled) {
      return res.status(401).json({ error: 'unauthorized' });
    }
    
    const decoded = await admin.auth().verifyIdToken(bearer);
    const reportData = {
      userId: decoded.uid,
      ...req.body
    };
    
    const report = await db.createReport(reportData);
    res.status(201).json(report);
  } catch (error) {
    console.error('Error creating report:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get user's reports
app.get('/api/reports', async (req, res) => {
  try {
    const bearer = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
    if (!bearer || !firebaseEnabled) {
      return res.status(401).json({ error: 'unauthorized' });
    }
    
    const decoded = await admin.auth().verifyIdToken(bearer);
    const reports = await db.getReportsByUser(decoded.uid);
    res.json(reports);
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== COMMUNITY API ====================

// Create a community post
app.post('/api/community/posts', async (req, res) => {
  try {
    const bearer = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
    if (!bearer || !firebaseEnabled) {
      return res.status(401).json({ error: 'unauthorized' });
    }
    
    const decoded = await admin.auth().verifyIdToken(bearer);
    const user = await db.getUserById(decoded.uid);
    
    const postData = {
      userId: decoded.uid,
      userName: user ? `${user.firstName} ${user.surname}`.trim() : decoded.email,
      userAvatar: user?.profilePicture || null,
      ...req.body
    };
    
    const post = await db.createCommunityPost(postData);
    res.status(201).json(post);
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get community posts
app.get('/api/community/posts', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const posts = await db.getCommunityPosts(limit);
    res.json(posts);
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ error: error.message });
  }
});

// Add comment to a post
app.post('/api/community/posts/:postId/comments', async (req, res) => {
  try {
    const bearer = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
    if (!bearer || !firebaseEnabled) {
      return res.status(401).json({ error: 'unauthorized' });
    }
    
    const decoded = await admin.auth().verifyIdToken(bearer);
    const user = await db.getUserById(decoded.uid);
    const { postId } = req.params;
    
    const commentData = {
      postId,
      userId: decoded.uid,
      userName: user ? `${user.firstName} ${user.surname}`.trim() : decoded.email,
      userAvatar: user?.profilePicture || null,
      content: req.body.content
    };
    
    const comment = await db.addComment(commentData);
    res.status(201).json(comment);
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get comments for a post
app.get('/api/community/posts/:postId/comments', async (req, res) => {
  try {
    const { postId } = req.params;
    const comments = await db.getCommentsByPost(postId);
    res.json(comments);
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== NOTIFICATIONS API ====================

// Get user notifications
app.get('/api/notifications', async (req, res) => {
  try {
    const bearer = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
    if (!bearer || !firebaseEnabled) {
      return res.status(401).json({ error: 'unauthorized' });
    }
    
    const decoded = await admin.auth().verifyIdToken(bearer);
    const limit = parseInt(req.query.limit) || 20;
    const notifications = await db.getNotificationsByUser(decoded.uid, limit);
    res.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== ANALYTICS API ====================

// Log analytics event
app.post('/api/analytics', async (req, res) => {
  try {
    const analyticsData = req.body;
    await db.logAnalytics(analyticsData);
    res.json({ success: true });
  } catch (error) {
    console.error('Error logging analytics:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== ADMIN API ====================

// Middleware to check if user is admin
async function requireAdmin(req, res, next) {
  try {
    const bearer = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
    if (!bearer || !firebaseEnabled) {
      return res.status(401).json({ error: 'unauthorized' });
    }
    
    const decoded = await admin.auth().verifyIdToken(bearer);
    const user = await db.getUserById(decoded.uid);
    
    // Check if user has admin role
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    req.adminUser = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid authentication' });
  }
}

// Get all complaints (admin only)
app.get('/api/admin/complaints', requireAdmin, async (req, res) => {
  try {
    // For now, we'll get all complaints
    // In production, implement pagination and filtering in db.js
    const adminDb = admin.firestore();
    const snapshot = await adminDb.collection('complaints')
      .orderBy('createdAt', 'desc')
      .get();
    
    const complaints = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    res.json(complaints);
  } catch (error) {
    console.error('Error fetching all complaints:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete complaint (admin only)
app.delete('/api/admin/complaints/:id', requireAdmin, async (req, res) => {
  try {
    const complaintId = req.params.id;
    await db.deleteComplaint(complaintId);
    res.json({ message: 'Complaint deleted successfully' });
  } catch (error) {
    console.error('Error deleting complaint:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all users (admin only)
app.get('/api/admin/users', requireAdmin, async (req, res) => {
  try {
    const adminDb = admin.firestore();
    const snapshot = await adminDb.collection('users')
      .orderBy('createdAt', 'desc')
      .get();
    
    const users = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update user role (admin only)
app.put('/api/admin/users/:uid/role', requireAdmin, async (req, res) => {
  try {
    const { uid } = req.params;
    const { role } = req.body;
    
    if (!['user', 'admin', 'moderator'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }
    
    const updatedUser = await db.updateUser(uid, { role });
    res.json(updatedUser);
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get dashboard statistics (admin only)
app.get('/api/admin/stats', requireAdmin, async (req, res) => {
  try {
    const adminDb = admin.firestore();
    
    // Get complaint statistics
    const complaintsSnapshot = await adminDb.collection('complaints').get();
    const complaints = complaintsSnapshot.docs.map(doc => doc.data());
    
    const stats = {
      totalComplaints: complaints.length,
      submitted: complaints.filter(c => c.status === 'submitted').length,
      inProgress: complaints.filter(c => c.status === 'in-progress').length,
      underReview: complaints.filter(c => c.status === 'under-review').length,
      resolved: complaints.filter(c => c.status === 'resolved').length,
      byCategory: {},
      recentComplaints: complaints.slice(0, 10)
    };
    
    // Count by category
    complaints.forEach(c => {
      const cat = c.category || 'other';
      stats.byCategory[cat] = (stats.byCategory[cat] || 0) + 1;
    });
    
    res.json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: error.message });
  }
});

// 5. Start the server
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});