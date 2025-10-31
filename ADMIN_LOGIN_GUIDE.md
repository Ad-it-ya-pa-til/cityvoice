# 🔐 How to Login as Admin - Complete Guide

## 📋 **Current Situation**

Your CityVoice application has **two authentication systems**:

1. **Simple Auth** (Currently Active) - Email/password without Firebase
2. **Firebase Auth** (Not Setup) - Required for admin role system

---

## 🚨 **Important: Admin Access Requires Firebase**

The admin dashboard (`/admin.html`) checks for admin role, which is **only available with Firebase + Firestore**.

**Current Status:**
```
✅ Simple Auth - Working (regular users)
❌ Firebase Auth - Not setup (required for admin)
❌ Admin Role - Not available without Firebase
```

---

## 🎯 **Two Options to Access Admin Dashboard**

---

### **Option 1: Temporary Fix (Development Only) - Quick Access** ⚡

This bypasses authentication temporarily for development.

#### **Step 1: Modify admin.js**

**File:** `public/admin.js`

Find this code (line 24-30):
```javascript
function checkAuth() {
  if (!storage.token) {
    window.location.href = '/auth.html';
    return false;
  }
  return true;
}
```

**Replace with:**
```javascript
function checkAuth() {
  // TEMPORARY: Allow admin access without login
  // TODO: Remove this before production!
  console.warn('🚨 ADMIN AUTH DISABLED - DEVELOPMENT ONLY');
  return true;
  
  /* Original code - restore this later:
  if (!storage.token) {
    window.location.href = '/auth.html';
    return false;
  }
  return true;
  */
}
```

#### **Step 2: Access Admin Dashboard**

```
Go to: http://localhost:3000/admin.html
```

**✅ You can now access the admin dashboard!**

---

### **Option 2: Proper Admin Setup (Production Ready)** 🔥

This sets up proper Firebase authentication with admin roles.

---

## 🔥 **Setting Up Firebase Admin Access**

### **Prerequisites:**
1. Firebase project created
2. Firebase Admin SDK configured (see `FIREBASE_SETUP_GUIDE.md`)
3. `.env` file with Firebase credentials

---

### **Step 1: Setup Firebase (If Not Done)**

```bash
# Follow the complete guide
See: FIREBASE_SETUP_GUIDE.md

# Or use the quick setup script
node setup-firebase.js
```

---

### **Step 2: Create Your First Admin User**

#### **Method A: Via API (Recommended)**

**1. First, create a regular user:**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@cityvoice.com",
    "password": "Admin@123",
    "displayName": "Admin User"
  }'
```

**Response:**
```json
{
  "uid": "abc123xyz...",
  "email": "admin@cityvoice.com",
  "displayName": "Admin User"
}
```

**2. Then, upgrade to admin via Firestore:**

Go to Firebase Console → Firestore Database → Create document:

```
Collection: users
Document ID: abc123xyz... (use the uid from step 1)
Fields:
  - uid: "abc123xyz..."
  - email: "admin@cityvoice.com"
  - firstName: "Admin"
  - surname: "User"
  - role: "admin"          ← IMPORTANT!
  - createdAt: (timestamp)
  - isActive: true
```

---

#### **Method B: Direct Firestore (Firebase Console)**

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Firestore Database**
4. Click **Start collection**
5. Collection ID: `users`
6. Add document:

```javascript
{
  uid: "your-firebase-uid-here",
  email: "admin@cityvoice.com",
  firstName: "Admin",
  surname: "User",
  role: "admin",              // ← This makes you admin!
  createdAt: (current timestamp),
  isActive: true
}
```

---

### **Step 3: Login as Admin**

#### **A. Via Frontend:**

1. Go to http://localhost:3000/auth.html
2. Login with admin credentials:
   - Email: `admin@cityvoice.com`
   - Password: `Admin@123`
3. You'll get a Firebase ID token
4. Go to http://localhost:3000/admin.html

---

#### **B. Get Admin Token Manually:**

If frontend login doesn't work, get token via Firebase SDK:

**Create file:** `get-admin-token.js`

```javascript
const admin = require('firebase-admin');
require('dotenv').config();

// Initialize Firebase Admin
const serviceAccount = JSON.parse(
  Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT, 'base64').toString('utf8')
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

async function createCustomToken() {
  try {
    // Replace with your admin user's UID
    const uid = 'your-admin-uid-here';
    
    const customToken = await admin.auth().createCustomToken(uid);
    console.log('Custom Token:', customToken);
    console.log('\nUse this token to login to admin dashboard');
  } catch (error) {
    console.error('Error:', error);
  }
  process.exit();
}

createCustomToken();
```

**Run:**
```bash
node get-admin-token.js
```

---

### **Step 4: Verify Admin Access**

#### **Test Admin API:**

```bash
# Get your token first (from login or script above)
TOKEN="your-firebase-id-token-here"

# Test admin stats endpoint
curl http://localhost:3000/api/admin/stats \
  -H "Authorization: Bearer $TOKEN"

# Should return dashboard stats (not 403 error)
```

**Expected Response:**
```json
{
  "totalComplaints": 247,
  "submitted": 42,
  "inProgress": 35,
  "resolved": 189,
  "byCategory": {...}
}
```

---

## 🔐 **Admin Role System**

### **User Roles:**
```javascript
{
  role: "user"      // ✅ Default - Can create/view own complaints
  role: "admin"     // ✅ Full access - Can view/edit all complaints
  role: "moderator" // ✅ Limited admin - Can edit but not delete
}
```

### **Admin Privileges:**
- ✅ View all complaints (not just own)
- ✅ Edit any complaint
- ✅ Delete any complaint
- ✅ View user list
- ✅ Change user roles
- ✅ Access analytics dashboard
- ✅ View heatmaps and statistics

---

## 📊 **Admin Dashboard Features**

Once logged in as admin, you can access:

### **1. Dashboard Overview**
```
http://localhost:3000/admin.html#dashboard

- Total complaints count
- Status breakdown
- Recent complaints list
```

### **2. Manage Complaints**
```
http://localhost:3000/admin.html#complaints

- View all complaints (all users)
- Filter by status/category
- Edit any complaint
- Delete complaints
- Search functionality
```

### **3. Analytics**
```
http://localhost:3000/admin.html#analytics

- Heatmap of complaint hotspots
- Charts (status, category, timeline)
- Department performance
- Resolution metrics
```

### **4. User Management**
```
http://localhost:3000/admin.html#users

- View all users
- Change user roles
- Manage permissions
```

---

## 🚀 **Quick Start (Choose One)**

### **For Immediate Access (Development):**

```javascript
// 1. Edit public/admin.js line 24:
function checkAuth() {
  return true; // Skip auth check
}

// 2. Go to: http://localhost:3000/admin.html
// ✅ Works immediately!
```

**⚠️ Remember to remove this before production!**

---

### **For Production Setup:**

```bash
# 1. Setup Firebase
node setup-firebase.js

# 2. Create admin user in Firestore
# (See Step 2 above)

# 3. Login at /auth.html

# 4. Access /admin.html
# ✅ Proper authentication!
```

---

## 🐛 **Troubleshooting**

### **Problem: "Please login to access admin"**

**Cause:** No token in localStorage

**Solution:**
```javascript
// Check in browser console (F12):
localStorage.getItem('cv_token')

// Should show token, if null:
// 1. Login at /auth.html
// 2. Or use temporary bypass (Option 1)
```

---

### **Problem: "Admin access required" (403 error)**

**Cause:** User doesn't have admin role

**Solution:**
```
1. Check Firestore user document
2. Ensure role field = "admin"
3. If field missing, add it manually
4. Logout and login again
```

---

### **Problem: "Firebase not configured"**

**Cause:** Firebase Admin SDK not initialized

**Solution:**
```bash
# Setup Firebase credentials
node setup-firebase.js

# Or manually create .env with:
FIREBASE_SERVICE_ACCOUNT=your_base64_encoded_key

# Restart server
node index.js
```

---

### **Problem: Can access /admin.html but get errors**

**Cause:** Frontend bypassed but backend requires auth

**Solution:**
```
Option A: Setup Firebase properly (recommended)
Option B: Modify backend to accept simple auth for admin routes
```

---

## 📝 **Admin Account Best Practices**

### **Security:**
```
✅ Use strong passwords (12+ characters)
✅ Different email from personal account
✅ Enable 2FA in Firebase (when available)
✅ Limit admin accounts (only trusted users)
✅ Regular password changes
✅ Monitor admin activity logs
```

### **Development vs Production:**
```
Development:
✅ Can use temporary auth bypass
✅ Use test credentials
✅ Single admin account OK

Production:
❌ Never bypass authentication
✅ Use Firebase with proper roles
✅ Multiple admin levels (admin, moderator)
✅ Audit logs for admin actions
✅ Secure credentials in environment variables
```

---

## 🎯 **Summary**

### **Current State:**
- ✅ Simple auth works for regular users
- ❌ Admin role requires Firebase setup
- ⚠️ Admin dashboard exists but needs proper auth

### **To Access Admin Dashboard:**

**Quick (Development):**
```javascript
// Bypass auth in admin.js
return true; // Skip token check
```

**Proper (Production):**
```
1. Setup Firebase
2. Create user with role: "admin" in Firestore
3. Login via /auth.html
4. Access /admin.html
```

---

## 📚 **Related Guides**

- **Firebase Setup:** `FIREBASE_SETUP_GUIDE.md`
- **Database Schema:** `database/schema.js`
- **API Documentation:** Check index.js admin routes

---

## ✅ **Verification Checklist**

- [ ] Firebase Admin SDK initialized
- [ ] Firestore database created
- [ ] Admin user created in Firestore
- [ ] User has `role: "admin"` field
- [ ] Can login via /auth.html
- [ ] Token stored in localStorage
- [ ] Admin dashboard loads without errors
- [ ] Admin API endpoints work (no 403)
- [ ] Can view all complaints (not just own)

---

**Need Help?** Check the troubleshooting section or review the Firebase setup guide!

**Status:** Ready to setup admin access! 🚀
