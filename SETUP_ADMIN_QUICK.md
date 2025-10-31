# 🚀 Quick Admin Setup (Option 2: Simple + JWT Hybrid)

## ✅ **What We Did:**

Your system now has **TWO authentication methods**:

1. **Simple Auth** (for regular users) - Works as before
   - Uses `email:xxx` tokens
   - Routes: `/api/auth/login`, `/api/auth/signup`
   - Pages: `/auth.html`, `/complaint.html`, `/track.html`

2. **JWT Auth** (for admins only) - NEW!
   - Uses secure JWT tokens
   - Routes: `/api/admin/login`, `/api/admin/register`
   - Pages: `/admin-login.html`, `/admin.html`

---

## 🚀 **How to Create Your First Admin**

### **Step 1: Create Admin User**

Run this command:

```bash
node create-admin.js
```

Follow the prompts:
```
👤 Admin Name: Your Name
📧 Admin Email: admin@example.com
🔑 Password: YourSecurePass123
🔑 Confirm Password: YourSecurePass123
```

✅ **Admin user created!**

---

### **Step 2: Login as Admin**

1. **Start your server:**
   ```bash
   node index.js
   ```

2. **Go to admin login page:**
   ```
   http://localhost:3000/admin-login.html
   ```

3. **Login with your admin credentials**

4. **Access admin dashboard:**
   ```
   http://localhost:3000/admin.html
   ```

✅ **You're now an admin!**

---

## 📊 **System Overview**

### **Regular Users (Simple Auth):**
```
Login → /auth.html
  ↓
Submit Complaint → /complaint.html
  ↓
Track Complaints → /track.html
  ↓
Token: "email:user@example.com"
```

### **Admin Users (JWT Auth):**
```
Login → /admin-login.html
  ↓
Admin Dashboard → /admin.html
  ↓
View All Complaints
Manage Users
Analytics
  ↓
Token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## 🔐 **Security Features**

✅ **Password Hashing** - bcrypt (bank-level)
✅ **JWT Tokens** - Industry standard
✅ **Rate Limiting** - 5 attempts per 15 minutes
✅ **Role-Based Access** - Admin/User separation
✅ **Token Expiration** - 7 days
✅ **Secure Storage** - SQLite database

---

## 📁 **Database**

Your users are stored in: `users.db`

**View all users:**
```bash
# Install sqlite3 CLI (optional)
npm install -g sqlite3

# Query users
sqlite3 users.db "SELECT id, email, name, role FROM users;"
```

**Make someone admin manually:**
```bash
sqlite3 users.db "UPDATE users SET role='admin' WHERE email='user@example.com';"
```

---

## 🎯 **What Works Now**

| Feature | Regular Users | Admin Users |
|---------|--------------|-------------|
| **Login** | ✅ `/auth.html` | ✅ `/admin-login.html` |
| **Create Complaints** | ✅ Yes | ✅ Yes |
| **View Own Complaints** | ✅ Yes | ✅ Yes |
| **View ALL Complaints** | ❌ No | ✅ Yes |
| **Delete ANY Complaint** | ❌ No | ✅ Yes |
| **Admin Dashboard** | ❌ No | ✅ Yes |
| **Analytics** | ❌ No | ✅ Yes |
| **User Management** | ❌ No | ✅ Yes |

---

## 🐛 **Troubleshooting**

### **Problem: "Cannot find module './auth/auth'"**

**Solution:**
The auth files are created. Just restart the server:
```bash
node index.js
```

---

### **Problem: Admin login redirects to regular login**

**Cause:** Using wrong login page

**Solution:**
- Regular users: http://localhost:3000/auth.html
- Admin users: http://localhost:3000/admin-login.html

---

### **Problem: "Admin access required" error**

**Cause:** User role is not 'admin'

**Solution:**
```bash
# Check user role
sqlite3 users.db "SELECT email, role FROM users;"

# Update to admin
sqlite3 users.db "UPDATE users SET role='admin' WHERE email='your@email.com';"
```

---

### **Problem: Can't access admin-login.html**

**Cause:** Server not restarted

**Solution:**
```bash
# Stop server (Ctrl+C)
node index.js
```

---

## ✅ **Verification Steps**

### **Test Regular User:**
```
1. Go to http://localhost:3000/auth.html
2. Create account / Login
3. Submit a complaint
4. View in /track.html
✅ Should work as before
```

### **Test Admin User:**
```
1. Go to http://localhost:3000/admin-login.html
2. Login with admin credentials
3. Access /admin.html
4. See all complaints (not just yours)
✅ Should see admin dashboard
```

---

## 📝 **Important Notes**

### **Token Storage:**
- Regular users: `cv_token` = `"email:user@example.com"`
- Admin users: `cv_token` = `"eyJhbGciOiJIUzI1NiIs..."`

Both use the same localStorage key but different formats!

### **API Endpoints:**
```javascript
// Regular user auth
POST /api/auth/signup
POST /api/auth/login

// Admin auth
POST /api/admin/register
POST /api/admin/login
GET /api/admin/me

// Complaints (works for both)
POST /api/complaints
GET /api/complaints
PUT /api/complaints/:id
DELETE /api/complaints/:id

// Admin-only routes
GET /api/admin/complaints
GET /api/admin/stats
DELETE /api/admin/complaints/:id
```

---

## 🎉 **You're All Set!**

### **Next Steps:**
1. ✅ Run `node create-admin.js`
2. ✅ Login at `/admin-login.html`
3. ✅ Access admin dashboard
4. ✅ Start managing your CityVoice platform!

---

## 📚 **Additional Files**

- **`create-admin.js`** - Interactive admin creator
- **`admin-login.html`** - Admin login page
- **`auth/database.js`** - User database
- **`auth/auth.js`** - Authentication logic
- **`auth/middleware.js`** - Route protection

---

**Status:** ✅ **Ready to Use!**  
**Both Auth Systems Active!** 🎉  
**No Firebase Needed!** ✨
