# 🔥 Firebase Admin SDK Setup Guide

## ✅ Step-by-Step Firebase Initialization

---

## **Step 1: Create Firebase Project**

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"** or select existing project
3. Enter project name (e.g., "CityVoice")
4. Enable Google Analytics (optional)
5. Click **"Create project"**

---

## **Step 2: Enable Required Services**

### **A. Enable Authentication**
1. In Firebase Console, go to **Build > Authentication**
2. Click **"Get started"**
3. Go to **"Sign-in method"** tab
4. Enable **Email/Password** authentication
5. Click **"Save"**

### **B. Enable Firestore Database**
1. Go to **Build > Firestore Database**
2. Click **"Create database"**
3. Choose **"Start in production mode"** (we'll add rules later)
4. Select a location (choose closest to your users)
5. Click **"Enable"**

### **C. Set Firestore Security Rules**
1. Go to **Firestore Database > Rules** tab
2. Replace with these rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own user document
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      allow read: if request.auth != null; // Allow reading other users' basic info
    }
    
    // Complaints
    match /complaints/{complaintId} {
      allow read: if request.auth != null; // All authenticated users can read
      allow create: if request.auth != null; // Any authenticated user can create
      allow update, delete: if request.auth != null && 
        (resource.data.userId == request.auth.uid || 
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
    }
    
    // Notifications
    match /notifications/{notificationId} {
      allow read: if request.auth != null && resource.data.userId == request.auth.uid;
      allow write: if false; // Only server can write
    }
    
    // Reports
    match /reports/{reportId} {
      allow read, write: if request.auth != null && resource.data.userId == request.auth.uid;
    }
    
    // Community posts
    match /community/{postId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && 
        (resource.data.userId == request.auth.uid || 
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
    }
    
    // Analytics (server-side only)
    match /analytics/{document=**} {
      allow read, write: if false; // Only server can access
    }
  }
}
```

3. Click **"Publish"**

---

## **Step 3: Download Service Account Key**

1. In Firebase Console, click the **⚙️ gear icon** (Settings)
2. Go to **"Project settings"**
3. Click on **"Service accounts"** tab
4. Click **"Generate new private key"**
5. Confirm by clicking **"Generate key"**
6. A JSON file will be downloaded (e.g., `cityvoice-xxxxx-firebase-adminsdk-xxxxx.json`)
7. **⚠️ IMPORTANT:** Keep this file secure! Don't share it or commit to Git

---

## **Step 4: Encode Service Account to Base64**

### **Option A: Using PowerShell (Windows)**

```powershell
# Navigate to where your service account JSON is
cd C:\Users\YourName\Downloads

# Encode to base64 and copy to clipboard
$json = Get-Content .\serviceAccountKey.json -Raw
$bytes = [System.Text.Encoding]::UTF8.GetBytes($json)
$base64 = [Convert]::ToBase64String($bytes)
$base64 | Set-Clipboard
Write-Host "Base64 encoded key copied to clipboard!"
```

### **Option B: Using Command Prompt (Windows)**

```cmd
certutil -encode serviceAccountKey.json encoded.txt
```
Then open `encoded.txt`, copy everything **except** the first and last lines (header/footer)

### **Option C: Using Online Tool (NOT RECOMMENDED for production)**

1. Go to https://www.base64encode.org/
2. Paste your JSON content
3. Click "Encode"
4. Copy the result

⚠️ **Security Note:** For production, always use local encoding methods

### **Option D: Using Node.js Script**

Create a file called `encode.js`:

```javascript
const fs = require('fs');

// Replace with your service account file path
const serviceAccount = fs.readFileSync('./serviceAccountKey.json', 'utf8');
const base64 = Buffer.from(serviceAccount).toString('base64');

console.log('Base64 Encoded Service Account:');
console.log(base64);
console.log('\nAdd this to your .env file as FIREBASE_SERVICE_ACCOUNT=...');
```

Run it:
```bash
node encode.js
```

---

## **Step 5: Create .env File**

1. In your project root, create a file named `.env`
2. Add the following:

```env
PORT=3000

# Firebase Admin SDK
FIREBASE_SERVICE_ACCOUNT=YOUR_BASE64_ENCODED_STRING_HERE

# Cloudinary (Optional)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

3. Replace `YOUR_BASE64_ENCODED_STRING_HERE` with the base64 string from Step 4
4. Save the file

---

## **Step 6: Add .env to .gitignore**

Make sure your `.gitignore` includes:

```gitignore
# Environment variables
.env
.env.local
.env.*.local

# Firebase
serviceAccountKey.json
*firebase-adminsdk*.json
```

---

## **Step 7: Test Firebase Initialization**

1. **Restart your server:**
   ```bash
   npm start
   # or
   node index.js
   ```

2. **Check console output:**
   - ✅ Success: `Firebase Admin initialized successfully`
   - ❌ Error: `Firebase Admin not initialized: [error message]`

3. **Test with API call:**
   ```bash
   # Open a new terminal and test health endpoint
   curl http://localhost:3000/healthz
   ```

---

## **Step 8: Verify Setup**

### **Create a Test User:**

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testpassword123",
    "displayName": "Test User"
  }'
```

**Expected Response:**
```json
{
  "uid": "some-firebase-uid",
  "email": "test@example.com",
  "displayName": "Test User"
}
```

---

## **🔧 Troubleshooting**

### **Issue: "Firebase Admin not initialized"**

**Possible Causes:**
1. `.env` file not created
2. Base64 encoding incorrect
3. Service account JSON invalid
4. Environment variables not loaded

**Solutions:**
```bash
# 1. Check if .env exists
ls .env  # Linux/Mac
dir .env  # Windows

# 2. Verify dotenv is installed
npm install dotenv

# 3. Check environment variable is loaded
# Add this to index.js temporarily:
console.log('ENV loaded:', process.env.FIREBASE_SERVICE_ACCOUNT ? 'YES' : 'NO');

# 4. Re-encode service account
# Use one of the methods from Step 4

# 5. Verify JSON structure
# Decode base64 to check:
node -e "console.log(Buffer.from('YOUR_BASE64_HERE', 'base64').toString())"
```

### **Issue: "Invalid service account"**

**Check your service account JSON has these fields:**
- `project_id`
- `private_key`
- `client_email`
- `type: "service_account"`

### **Issue: "Permission denied" errors**

**Check Firestore rules:**
1. Go to Firebase Console > Firestore > Rules
2. Ensure rules allow authenticated users
3. Publish updated rules

---

## **📚 Alternative: Simple Setup (Development Only)**

For quick local development, you can use the JSON file directly:

**index.js modification:**

```javascript
// DEVELOPMENT ONLY - DON'T USE IN PRODUCTION
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
```

⚠️ **Never deploy this to production or commit the JSON file!**

---

## **🎯 What Your Code Does**

The Firebase initialization in `index.js` (lines 77-95):

```javascript
let firebaseEnabled = false;
try {
  if (!admin.apps.length) {
    let creds = null;
    
    // Decode base64 service account
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      creds = JSON.parse(
        Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT, 'base64')
          .toString('utf8')
      );
    }
    
    // Verify required fields
    if (creds && creds.project_id && creds.private_key && creds.client_email) {
      admin.initializeApp({ 
        credential: admin.credential.cert(creds) 
      });
      firebaseEnabled = true;
      console.log('Firebase Admin initialized successfully');
    }
  }
} catch (e) {
  console.warn('Firebase Admin not initialized:', e.message);
  firebaseEnabled = false;
}
```

**What it checks:**
1. ✅ No existing Firebase app instance
2. ✅ Service account exists in environment
3. ✅ Service account has required fields
4. ✅ Credentials are valid

---

## **✅ Final Checklist**

- [ ] Firebase project created
- [ ] Authentication enabled (Email/Password)
- [ ] Firestore database created
- [ ] Security rules configured
- [ ] Service account key downloaded
- [ ] Service account encoded to base64
- [ ] `.env` file created with credentials
- [ ] `.env` added to `.gitignore`
- [ ] Server restarted
- [ ] Console shows "Firebase Admin initialized successfully"
- [ ] Test API call successful

---

## **🔐 Security Best Practices**

1. **Never commit credentials:**
   - Add `.env` to `.gitignore`
   - Don't share service account JSON
   - Use environment variables in production

2. **Rotate credentials regularly:**
   - Generate new service account keys periodically
   - Delete old keys from Firebase Console

3. **Use proper Firestore rules:**
   - Don't use test mode in production
   - Implement proper authentication checks
   - Validate data before writing

4. **Monitor usage:**
   - Check Firebase Console for unusual activity
   - Set up budget alerts
   - Review authentication logs

---

## **📞 Need Help?**

If you're still having issues:

1. **Check server logs:** Look for specific error messages
2. **Verify Firebase Console:** Ensure services are enabled
3. **Test credentials:** Use the verification script above
4. **Check dependencies:**
   ```bash
   npm list firebase-admin
   npm list dotenv
   ```

---

**Status:** Ready to initialize Firebase! 🚀
