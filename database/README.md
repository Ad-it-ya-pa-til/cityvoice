# CityVoice Database Documentation

## Overview
This application uses **Firebase Firestore** as its database. Each major feature has its own dedicated collection to organize data efficiently.

## Database Structure

### Collections

#### 1. **users** (Profile & Authentication)
**Used by:** `profile.html`, `auth.html`

Stores user profile information and account details.

**Fields:**
- `uid` - Firebase Auth user ID (string)
- `email` - User email address (string)
- `firstName` - User's first name (string)
- `surname` - User's last name (string)
- `phone` - Phone number (string)
- `address` - Street address (string)
- `city` - City name (string)
- `state` - State/Province (string)
- `zipCode` - Postal code (string)
- `profilePicture` - URL to profile image (string)
- `role` - User role: 'user', 'admin', or 'moderator' (string)
- `isActive` - Account status (boolean)
- `createdAt` - Account creation timestamp
- `updatedAt` - Last update timestamp

**API Endpoints:**
- `GET /api/users/profile` - Get current user's profile
- `PUT /api/users/profile` - Update user profile

---

#### 2. **complaints** (Complaints & Tracking)
**Used by:** `complaint.html`, `track.html`

Stores civic complaints submitted by users.

**Fields:**
- `complaintId` - Unique ID (format: CV-YYYY-XXX) (string)
- `userId` - Reference to user UID (string)
- `title` - Complaint title (string)
- `description` - Detailed description (string)
- `category` - Complaint type (string)
- `location` - Object containing:
  - `address` - Location address (string)
  - `lat` - Latitude (number)
  - `lng` - Longitude (number)
  - `city` - City name (string)
  - `state` - State name (string)
- `evidence` - URL to uploaded photo/video (string)
- `status` - Current status: 'submitted', 'in-progress', 'under-review', 'resolved' (string)
- `priority` - Priority level: 'low', 'medium', 'high', 'urgent' (string)
- `timeline` - Array of status updates with timestamps (array)
- `upvotes` - Number of upvotes (number)
- `views` - View count (number)
- `createdAt` - Submission timestamp
- `updatedAt` - Last update timestamp
- `resolvedAt` - Resolution timestamp (if resolved)

**API Endpoints:**
- `POST /api/complaints` - Create new complaint
- `GET /api/complaints` - Get all complaints (with `?mine=true` for user's complaints)
- `GET /api/complaints/:id` - Get specific complaint
- `PUT /api/complaints/:id` - Update complaint status
- `DELETE /api/complaints/:id` - Delete complaint

---

#### 3. **reports** (Report Submission)
**Used by:** `report.html`

Stores detailed reports submitted by users.

**Fields:**
- `reportId` - Unique ID (format: REP-timestamp) (string)
- `userId` - Reference to user UID (string)
- `reportType` - Type: 'incident', 'feedback', 'suggestion', 'complaint' (string)
- `title` - Report title (string)
- `description` - Detailed description (string)
- `category` - Report category (string)
- `location` - Location description (string)
- `attachments` - Array of file URLs (array)
- `status` - Status: 'pending', 'reviewed', 'resolved' (string)
- `createdAt` - Submission timestamp
- `updatedAt` - Last update timestamp

**API Endpoints:**
- `POST /api/reports` - Create new report
- `GET /api/reports` - Get user's reports

---

#### 4. **community_posts** (Community Discussion)
**Used by:** `community.html`

Stores community posts and discussions.

**Fields:**
- `postId` - Unique ID (format: POST-timestamp) (string)
- `userId` - Post author's UID (string)
- `userName` - Author's display name (string)
- `userAvatar` - Author's avatar URL (string)
- `title` - Post title (string)
- `content` - Post content (string)
- `category` - Post category (string)
- `tags` - Array of tags (array)
- `attachments` - Array of image/file URLs (array)
- `likes` - Like count (number)
- `commentsCount` - Number of comments (number)
- `views` - View count (number)
- `isPinned` - Whether post is pinned (boolean)
- `isLocked` - Whether comments are locked (boolean)
- `createdAt` - Post creation timestamp
- `updatedAt` - Last update timestamp

**API Endpoints:**
- `POST /api/community/posts` - Create new post
- `GET /api/community/posts` - Get all posts (with `?limit=N` parameter)

---

#### 5. **community_comments** (Post Comments)
**Used by:** `community.html`

Stores comments on community posts.

**Fields:**
- `commentId` - Unique ID (format: COMMENT-timestamp) (string)
- `postId` - Reference to parent post (string)
- `userId` - Commenter's UID (string)
- `userName` - Commenter's display name (string)
- `userAvatar` - Commenter's avatar URL (string)
- `content` - Comment content (string)
- `likes` - Like count (number)
- `createdAt` - Comment creation timestamp
- `updatedAt` - Last update timestamp

**API Endpoints:**
- `POST /api/community/posts/:postId/comments` - Add comment to post
- `GET /api/community/posts/:postId/comments` - Get all comments for a post

---

#### 6. **notifications** (User Notifications)
**Used by:** All pages

Stores user notifications for various events.

**Fields:**
- `notificationId` - Unique ID (format: NOTIF-timestamp) (string)
- `userId` - Recipient's UID (string)
- `type` - Notification type: 'complaint_update', 'comment', 'like', 'system' (string)
- `title` - Notification title (string)
- `message` - Notification message (string)
- `link` - URL to related content (string)
- `isRead` - Read status (boolean)
- `createdAt` - Creation timestamp

**API Endpoints:**
- `GET /api/notifications` - Get user's notifications (with `?limit=N` parameter)

---

#### 7. **analytics** (Usage Analytics)
**Used by:** Admin dashboard & tracking

Stores analytics and usage data.

**Fields:**
- `analyticsId` - Unique ID (format: ANALYTICS-timestamp) (string)
- `type` - Event type: 'page_view', 'user_action', 'complaint_stats' (string)
- `userId` - User UID (string)
- `page` - Page name (string)
- `action` - Action performed (string)
- `metadata` - Additional data (object)
- `timestamp` - Event timestamp

**API Endpoints:**
- `POST /api/analytics` - Log analytics event

---

## Setup Instructions

### 1. **Firebase Configuration**

Make sure your `.env` file contains:
```env
FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}
```

### 2. **Enable Firestore**

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Firestore Database**
4. Click **Create Database**
5. Choose production mode or test mode
6. Select a region

### 3. **Initialize Collections**

Collections are automatically created when the first document is added. No manual setup required!

### 4. **Firestore Rules** (Production)

Set up security rules in Firebase Console:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own user document
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Users can create complaints, read their own, update/delete their own
    match /complaints/{complaintId} {
      allow create: if request.auth != null;
      allow read: if true; // Public read
      allow update, delete: if request.auth != null && resource.data.userId == request.auth.uid;
    }
    
    // Users can create reports, read their own
    match /reports/{reportId} {
      allow create: if request.auth != null;
      allow read: if request.auth != null && resource.data.userId == request.auth.uid;
    }
    
    // Community posts are public read, auth write
    match /community_posts/{postId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && resource.data.userId == request.auth.uid;
    }
    
    // Community comments
    match /community_comments/{commentId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && resource.data.userId == request.auth.uid;
    }
    
    // Notifications - users can only read their own
    match /notifications/{notificationId} {
      allow read: if request.auth != null && resource.data.userId == request.auth.uid;
      allow write: if false; // Server-side only
    }
    
    // Analytics - server-side only
    match /analytics/{analyticsId} {
      allow read, write: if false; // Server-side only
    }
  }
}
```

## Usage Examples

### Creating a Complaint

```javascript
// From complaint.html frontend
const response = await fetch('/api/complaints', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${idToken}`
  },
  body: JSON.stringify({
    title: 'Broken Street Light',
    description: 'Street light on Main St is not working',
    category: 'electricity',
    location: '123 Main St, Delhi',
    lat: 28.6139,
    lng: 77.2090
  })
});

const complaint = await response.json();
console.log('Complaint ID:', complaint.complaintId);
```

### Getting User's Complaints

```javascript
// From track.html frontend
const response = await fetch('/api/complaints?mine=true', {
  headers: {
    'Authorization': `Bearer ${idToken}`
  }
});

const myComplaints = await response.json();
```

### Updating Profile

```javascript
// From profile.html frontend
const response = await fetch('/api/users/profile', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${idToken}`
  },
  body: JSON.stringify({
    firstName: 'John',
    surname: 'Doe',
    phone: '+91 1234567890',
    city: 'Delhi'
  })
});

const updatedProfile = await response.json();
```

## Database Functions

All database operations are in `/database/db.js`. Key functions:

- **Users:** `createUser()`, `getUserById()`, `updateUser()`
- **Complaints:** `createComplaint()`, `getComplaintById()`, `getComplaintsByUser()`, `updateComplaintStatus()`, `deleteComplaint()`
- **Reports:** `createReport()`, `getReportsByUser()`
- **Community:** `createCommunityPost()`, `getCommunityPosts()`, `addComment()`, `getCommentsByPost()`
- **Notifications:** `createNotification()`, `getNotificationsByUser()`
- **Analytics:** `logAnalytics()`

## Best Practices

1. **Always authenticate requests** - Use Firebase ID tokens
2. **Validate data** - Check required fields before database operations
3. **Handle errors** - Use try-catch blocks and return meaningful error messages
4. **Index fields** - Create Firestore indexes for frequently queried fields
5. **Paginate results** - Use limits for large result sets
6. **Monitor usage** - Check Firestore quotas and costs in Firebase Console

## Maintenance

### Backup
- Enable automated backups in Firebase Console
- Export data regularly for archival

### Monitoring
- Check Firebase Console for errors
- Monitor read/write operations
- Track quota usage

### Optimization
- Create composite indexes for complex queries
- Denormalize data where appropriate
- Use batch operations for multiple writes

---

**Need Help?** Check [Firebase Firestore Documentation](https://firebase.google.com/docs/firestore)
