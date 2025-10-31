# 🚀 Install JWT Authentication (No Firebase!)

## ✅ **Safe & Secure Authentication System**

This replaces Firebase with industry-standard JWT + bcrypt authentication.

---

## 📦 **Step 1: Install Required Packages**

```bash
npm install jsonwebtoken bcryptjs better-sqlite3 express-rate-limit
```

**What each does:**
- `jsonwebtoken` - Secure token generation
- `bcryptjs` - Password hashing (industry standard)
- `better-sqlite3` - Fast local database
- `express-rate-limit` - Prevent brute force attacks

---

## 🔑 **Step 2: Generate JWT Secret**

**Option A: Automatic (Recommended)**

Create `generate-secret.js`:
```javascript
console.log(require('crypto').randomBytes(64).toString('hex'));
```

Run:
```bash
node generate-secret.js
```

Copy the output.

**Option B: Online**
Go to: https://generate-secret.vercel.app/64

---

## 📝 **Step 3: Update .env File**

Create or update `.env`:

```env
# Server
PORT=3000

# JWT Authentication
JWT_SECRET=paste_your_generated_secret_here
JWT_EXPIRE=7d

# Optional: Cloudinary (if using image uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

**⚠️ IMPORTANT:** Keep `JWT_SECRET` secret! Never commit to Git!

---

## 🔧 **Step 4: Update index.js**

Add these lines at the top of `index.js` (after other requires):

```javascript
// JWT Authentication (replaces Firebase)
const Auth = require('./auth/auth');
const { requireAuth, requireAdmin, optionalAuth } = require('./auth/middleware');
const rateLimit = require('express-rate-limit');

// Rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  message: { error: 'Too many attempts, please try again later' }
});
```

**Replace the old auth routes** (around line 142-163) with:

```javascript
// ==================== JWT AUTH ROUTES ====================

// Register
app.post('/api/auth/signup', authLimiter, async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const result = await Auth.register(email, password, name);
    
    if (result.success) {
      res.status(201).json({
        user: result.user,
        token: result.token
      });
    } else {
      res.status(400).json({ error: result.error });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Login
app.post('/api/auth/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await Auth.login(email, password);
    
    if (result.success) {
      res.json({
        user: result.user,
        token: result.token
      });
    } else {
      res.status(401).json({ error: result.error });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get current user
app.get('/api/users/me', requireAuth, (req, res) => {
  res.json(req.user);
});
```

**Update complaint routes** to use new middleware:

```javascript
// Create complaint (protected)
app.post('/api/complaints', requireAuth, maybeUpload, async (req, res) => {
  try {
    const { title, description, location, category, lat, lng } = req.body;
    
    if (!title || !description) {
      return res.status(400).json({ error: 'Title and description required' });
    }

    const complaint = {
      id: complaintId++,
      title,
      description,
      location: location || 'Not specified',
      category: category || 'general',
      status: 'submitted',
      userEmail: req.user.email,
      userId: req.user.id,
      createdAt: new Date().toISOString(),
      coords: (lat && lng) ? { lat: Number(lat), lng: Number(lng) } : null,
      evidenceUrl: req.file ? `/uploads/${req.file.filename}` : null,
    };
    
    complaints.push(complaint);
    res.status(201).json(complaint);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get my complaints
app.get('/api/complaints', requireAuth, (req, res) => {
  const { mine } = req.query;
  
  if (mine) {
    const userComplaints = complaints.filter(c => c.userId === req.user.id);
    return res.json(userComplaints);
  }
  
  // Return all (for admin or public)
  res.json(complaints);
});

// Update complaint
app.put('/api/complaints/:id', requireAuth, async (req, res) => {
  try {
    const complaintId = parseInt(req.params.id);
    const complaint = complaints.find(c => c.id === complaintId);
    
    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found' });
    }
    
    // Check ownership
    if (complaint.userId !== req.user.id && !Auth.isAdmin(req.user)) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    // Update fields
    const { title, category, description, location, status } = req.body;
    if (title) complaint.title = title;
    if (category) complaint.category = category;
    if (description) complaint.description = description;
    if (location) complaint.location = location;
    if (status) complaint.status = status;
    
    res.json(complaint);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete complaint
app.delete('/api/complaints/:id', requireAuth, async (req, res) => {
  try {
    const complaintId = parseInt(req.params.id);
    const index = complaints.findIndex(c => c.id === complaintId);
    
    if (index === -1) {
      return res.status(404).json({ error: 'Complaint not found' });
    }
    
    // Check ownership
    if (complaints[index].userId !== req.user.id && !Auth.isAdmin(req.user)) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    complaints.splice(index, 1);
    res.json({ message: 'Complaint deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== ADMIN ROUTES ====================

// Admin: Get all complaints
app.get('/api/admin/complaints', requireAdmin, (req, res) => {
  res.json(complaints);
});

// Admin: Get statistics
app.get('/api/admin/stats', requireAdmin, (req, res) => {
  const stats = {
    totalComplaints: complaints.length,
    submitted: complaints.filter(c => c.status === 'submitted').length,
    inProgress: complaints.filter(c => c.status === 'in-progress').length,
    underReview: complaints.filter(c => c.status === 'under-review').length,
    resolved: complaints.filter(c => c.status === 'resolved').length,
    byCategory: {},
    recentComplaints: complaints.slice(-10).reverse()
  };
  
  complaints.forEach(c => {
    const cat = c.category || 'other';
    stats.byCategory[cat] = (stats.byCategory[cat] || 0) + 1;
  });
  
  res.json(stats);
});

// Admin: Delete any complaint
app.delete('/api/admin/complaints/:id', requireAdmin, (req, res) => {
  const complaintId = parseInt(req.params.id);
  const index = complaints.findIndex(c => c.id === complaintId);
  
  if (index === -1) {
    return res.status(404).json({ error: 'Complaint not found' });
  }
  
  complaints.splice(index, 1);
  res.json({ message: 'Complaint deleted successfully' });
});
```

---

## 👤 **Step 5: Create First Admin User**

```bash
node create-admin.js
```

Follow the prompts:
```
👤 Admin Name: Admin User
📧 Admin Email: admin@cityvoice.com
🔑 Password: YourSecurePassword123
🔑 Confirm Password: YourSecurePassword123
```

**✅ Admin user created!**

---

## 🚀 **Step 6: Start Server**

```bash
node index.js
```

You should see:
```
Server is running at http://localhost:3000
```

---

## ✅ **Step 7: Test Authentication**

### **Test Registration:**
```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "test123"
  }'
```

**Expected Response:**
```json
{
  "user": {
    "id": 2,
    "email": "test@example.com",
    "name": "Test User",
    "role": "user"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### **Test Login:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@cityvoice.com",
    "password": "YourSecurePassword123"
  }'
```

---

## 🎯 **Step 8: Update Frontend (Optional)**

The frontend (`auth.html`, `complaint.html`, etc.) already works!

**Token is stored as:** `cv_token` in localStorage

**API calls use:** `x-auth-token` header

**No changes needed!** ✅

---

## 🔒 **Security Features**

✅ **Password Hashing** - bcrypt with salt
✅ **JWT Tokens** - Signed with secret key
✅ **Token Expiration** - 7 days default
✅ **Rate Limiting** - 5 attempts per 15 minutes
✅ **SQL Injection Protected** - Parameterized queries
✅ **Role-Based Access** - Admin/User roles
✅ **Secure Headers** - Helmet.js already installed

---

## 📊 **Database Location**

Your users are stored in: `users.db` (SQLite file)

**View database:**
```bash
npm install -g sqlite3
sqlite3 users.db "SELECT * FROM users;"
```

---

## 🐛 **Troubleshooting**

### **Problem: "Cannot find module 'better-sqlite3'"**
```bash
npm install better-sqlite3
```

### **Problem: "JWT_SECRET not found"**
Check `.env` file exists and has `JWT_SECRET=...`

### **Problem: "User already exists"**
Email is already registered. Use different email or delete `users.db`

### **Problem: "Admin access required"**
User role is not 'admin'. Run `create-admin.js` again or update database:
```bash
sqlite3 users.db "UPDATE users SET role='admin' WHERE email='your@email.com';"
```

---

## 🎉 **You're Done!**

### **What You Have:**
✅ Secure JWT authentication
✅ Password hashing with bcrypt
✅ Admin role system
✅ Rate limiting
✅ SQLite database
✅ No Firebase needed!

### **Login to Admin:**
1. Go to: http://localhost:3000/auth.html
2. Login with admin credentials
3. Access: http://localhost:3000/admin.html

---

## 📚 **Next Steps**

### **Production Deployment:**
1. Use PostgreSQL instead of SQLite
2. Add email verification
3. Add password reset functionality
4. Add 2FA (Two-Factor Authentication)
5. Use environment-specific secrets
6. Enable HTTPS

---

**Status:** ✅ **Ready to Use!**  
**No Firebase Required!** 🎉
