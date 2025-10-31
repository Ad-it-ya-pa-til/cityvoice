// 1. Import Express
const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const admin = require('firebase-admin');
const multer = require('multer');
const { v2: cloudinary } = require('cloudinary');
const compression = require('compression');
const helmet = require('helmet');

// 2. Create an instance of an Express app
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Performance & security
app.set('etag', 'strong');
app.use(helmet());
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
try {
  if (!admin.apps.length) {
    let creds = null;
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      creds = JSON.parse(Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT, 'base64').toString('utf8'));
    }
    if (creds) {
      admin.initializeApp({ credential: admin.credential.cert(creds) });
    }
  }
} catch (e) {
  console.warn('Firebase Admin not initialized:', e.message);
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
    if (!admin.apps.length) return res.status(503).json({ error: 'firebase not configured' });
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
app.post('/api/auth/login', async (req, res) => {
  try {
    if (!admin.apps.length) return res.status(503).json({ error: 'firebase not configured' });
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
function authMiddleware(req, res, next) {
  if (!admin.apps.length) return res.status(401).json({ error: 'firebase not configured' });
  const idToken = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!idToken) return res.status(401).json({ error: 'missing id token' });
  admin.auth().verifyIdToken(idToken)
    .then(decoded => { req.firebaseUser = decoded; next(); })
    .catch(() => res.status(401).json({ error: 'invalid id token' }));
}

// Current user
app.get('/api/users/me', async (req, res) => {
  const bearer = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (bearer && admin.apps.length) {
    try {
      const decoded = await admin.auth().verifyIdToken(bearer);
      return res.json({ name: decoded.name || null, email: decoded.email || null, uid: decoded.uid });
    } catch (_) {}
  }
  const user = getUserFromToken(req);
  if (!user) return res.status(401).json({ error: 'unauthorized' });
  res.json({ name: user.name, email: user.email });
});

// Complaint routes
app.post('/api/complaints', maybeUpload, (req, res) => {
  const user = getUserFromToken(req);
  const { title, description, location, category } = req.body || {};
  if (!title || !description) {
    return res.status(400).json({ error: 'title and description are required' });
  }
  let { lat, lng } = req.body || {};
  const coords = (lat && lng) ? { lat: Number(lat), lng: Number(lng) } : null;
  const evidenceUrl = req.file ? `/uploads/${req.file.filename}` : null;
  const complaint = {
    id: complaintId++,
    title,
    description,
    location: location || null,
    category: category || null,
    status: 'open',
    userEmail: user ? user.email : null,
    createdAt: new Date().toISOString(),
    coords,
    evidenceUrl,
  };
  complaints.push(complaint);
  res.status(201).json(complaint);
});

app.get('/api/complaints', async (req, res) => {
  const { mine } = req.query || {};
  if (mine) {
    const bearer = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
    if (bearer && admin.apps.length) {
      try {
        const decoded = await admin.auth().verifyIdToken(bearer);
        const mineList = complaints.filter(c => c.userUid === decoded.uid || c.userEmail === decoded.email);
        return res.json(mineList);
      } catch (_) {}
    }
    const user = getUserFromToken(req);
    if (!user) return res.status(401).json({ error: 'unauthorized' });
    const mineList = complaints.filter(c => c.userEmail === user.email);
    return res.json(mineList);
  }
  res.json(complaints);
});

app.get('/api/complaints/:id', (req, res) => {
  const id = Number(req.params.id);
  const c = complaints.find(x => x.id === id);
  if (!c) return res.status(404).json({ error: 'not found' });
  res.json(c);
});

// --- New complaint submit route using Cloudinary & geolocation ---
// Accepts multipart (with field name 'evidence') or JSON (no file)
app.post('/api/complaints/submit', authMiddleware, memUpload.single('evidence'), async (req, res) => {
  try {
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
      userUid: req.firebaseUser.uid,
      userEmail: req.firebaseUser.email || null,
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
    if (admin.apps.length && c.userUid) {
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

app.put('/api/complaints/:id', (req, res) => {
  const id = Number(req.params.id);
  const c = complaints.find(x => x.id === id);
  if (!c) return res.status(404).json({ error: 'not found' });
  const { status, title, description, location } = req.body || {};
  if (status) c.status = status;
  if (title) c.title = title;
  if (description) c.description = description;
  if (location) c.location = location;
  res.json(c);
});

// 5. Start the server
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});