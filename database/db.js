/**
 * Database Helper Functions for CityVoice
 * Provides CRUD operations for all Firestore collections
 */

const admin = require('firebase-admin');
const { COLLECTIONS } = require('./schema');

// Get Firestore instance
const getDb = () => {
  if (!admin.apps.length) {
    throw new Error('Firebase Admin not initialized');
  }
  return admin.firestore();
};

// ==================== USERS COLLECTION ====================

/**
 * Create or update user profile
 */
async function createUser(userData) {
  const db = getDb();
  const userRef = db.collection(COLLECTIONS.USERS).doc(userData.uid);
  
  const user = {
    ...userData,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    role: userData.role || 'user',
    isActive: true
  };
  
  await userRef.set(user, { merge: true });
  return user;
}

/**
 * Get user by UID
 */
async function getUserById(uid) {
  const db = getDb();
  const userDoc = await db.collection(COLLECTIONS.USERS).doc(uid).get();
  
  if (!userDoc.exists) {
    return null;
  }
  
  return { id: userDoc.id, ...userDoc.data() };
}

/**
 * Update user profile
 */
async function updateUser(uid, updates) {
  const db = getDb();
  const userRef = db.collection(COLLECTIONS.USERS).doc(uid);
  
  const updateData = {
    ...updates,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  };
  
  await userRef.update(updateData);
  return await getUserById(uid);
}

// ==================== COMPLAINTS COLLECTION ====================

/**
 * Create a new complaint
 */
async function createComplaint(complaintData) {
  const db = getDb();
  const complaintsRef = db.collection(COLLECTIONS.COMPLAINTS);
  
  // Generate complaint ID
  const year = new Date().getFullYear();
  const count = await complaintsRef.where('complaintId', '>=', `CV-${year}-`)
    .where('complaintId', '<', `CV-${year + 1}-`).get();
  const complaintId = `CV-${year}-${String(count.size + 1).padStart(3, '0')}`;
  
  const complaint = {
    complaintId,
    ...complaintData,
    status: complaintData.status || 'submitted',
    priority: complaintData.priority || 'medium',
    upvotes: 0,
    views: 0,
    timeline: [{
      status: 'submitted',
      message: 'Complaint submitted',
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    }],
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  };
  
  const docRef = await complaintsRef.add(complaint);
  return { id: docRef.id, ...complaint };
}

/**
 * Get complaint by ID
 */
async function getComplaintById(complaintId) {
  const db = getDb();
  const snapshot = await db.collection(COLLECTIONS.COMPLAINTS)
    .where('complaintId', '==', complaintId)
    .limit(1)
    .get();
  
  if (snapshot.empty) {
    return null;
  }
  
  const doc = snapshot.docs[0];
  return { id: doc.id, ...doc.data() };
}

/**
 * Get complaints by user
 */
async function getComplaintsByUser(userId) {
  const db = getDb();
  const snapshot = await db.collection(COLLECTIONS.COMPLAINTS)
    .where('userId', '==', userId)
    .orderBy('createdAt', 'desc')
    .get();
  
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

/**
 * Update complaint status
 */
async function updateComplaintStatus(complaintId, status, message) {
  const db = getDb();
  const snapshot = await db.collection(COLLECTIONS.COMPLAINTS)
    .where('complaintId', '==', complaintId)
    .limit(1)
    .get();
  
  if (snapshot.empty) {
    throw new Error('Complaint not found');
  }
  
  const docRef = snapshot.docs[0].ref;
  const currentData = snapshot.docs[0].data();
  
  const timelineEntry = {
    status,
    message,
    timestamp: admin.firestore.FieldValue.serverTimestamp()
  };
  
  await docRef.update({
    status,
    timeline: admin.firestore.FieldValue.arrayUnion(timelineEntry),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    ...(status === 'resolved' ? { resolvedAt: admin.firestore.FieldValue.serverTimestamp() } : {})
  });
  
  return await getComplaintById(complaintId);
}

/**
 * Delete complaint
 */
async function deleteComplaint(complaintId) {
  const db = getDb();
  const snapshot = await db.collection(COLLECTIONS.COMPLAINTS)
    .where('complaintId', '==', complaintId)
    .limit(1)
    .get();
  
  if (snapshot.empty) {
    throw new Error('Complaint not found');
  }
  
  await snapshot.docs[0].ref.delete();
  return { success: true };
}

/**
 * Get all complaints (admin function)
 */
async function getAllComplaints(limit = 100, offset = 0) {
  const db = getDb();
  const snapshot = await db.collection(COLLECTIONS.COMPLAINTS)
    .orderBy('createdAt', 'desc')
    .limit(limit)
    .offset(offset)
    .get();
  
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// ==================== REPORTS COLLECTION ====================

/**
 * Create a new report
 */
async function createReport(reportData) {
  const db = getDb();
  const reportsRef = db.collection(COLLECTIONS.REPORTS);
  
  const reportId = `REP-${Date.now()}`;
  
  const report = {
    reportId,
    ...reportData,
    status: 'pending',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  };
  
  const docRef = await reportsRef.add(report);
  return { id: docRef.id, ...report };
}

/**
 * Get reports by user
 */
async function getReportsByUser(userId) {
  const db = getDb();
  const snapshot = await db.collection(COLLECTIONS.REPORTS)
    .where('userId', '==', userId)
    .orderBy('createdAt', 'desc')
    .get();
  
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// ==================== COMMUNITY POSTS COLLECTION ====================

/**
 * Create a new community post
 */
async function createCommunityPost(postData) {
  const db = getDb();
  const postsRef = db.collection(COLLECTIONS.COMMUNITY_POSTS);
  
  const postId = `POST-${Date.now()}`;
  
  const post = {
    postId,
    ...postData,
    likes: 0,
    commentsCount: 0,
    views: 0,
    isPinned: false,
    isLocked: false,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  };
  
  const docRef = await postsRef.add(post);
  return { id: docRef.id, ...post };
}

/**
 * Get all community posts
 */
async function getCommunityPosts(limit = 50) {
  const db = getDb();
  const snapshot = await db.collection(COLLECTIONS.COMMUNITY_POSTS)
    .orderBy('createdAt', 'desc')
    .limit(limit)
    .get();
  
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

/**
 * Add comment to a post
 */
async function addComment(commentData) {
  const db = getDb();
  const commentsRef = db.collection(COLLECTIONS.COMMUNITY_COMMENTS);
  
  const commentId = `COMMENT-${Date.now()}`;
  
  const comment = {
    commentId,
    ...commentData,
    likes: 0,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  };
  
  await commentsRef.add(comment);
  
  // Increment comment count on post
  const postSnapshot = await db.collection(COLLECTIONS.COMMUNITY_POSTS)
    .where('postId', '==', commentData.postId)
    .limit(1)
    .get();
  
  if (!postSnapshot.empty) {
    await postSnapshot.docs[0].ref.update({
      commentsCount: admin.firestore.FieldValue.increment(1)
    });
  }
  
  return comment;
}

/**
 * Get comments for a post
 */
async function getCommentsByPost(postId) {
  const db = getDb();
  const snapshot = await db.collection(COLLECTIONS.COMMUNITY_COMMENTS)
    .where('postId', '==', postId)
    .orderBy('createdAt', 'asc')
    .get();
  
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// ==================== NOTIFICATIONS COLLECTION ====================

/**
 * Create notification
 */
async function createNotification(notificationData) {
  const db = getDb();
  const notificationsRef = db.collection(COLLECTIONS.NOTIFICATIONS);
  
  const notification = {
    notificationId: `NOTIF-${Date.now()}`,
    ...notificationData,
    isRead: false,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  };
  
  await notificationsRef.add(notification);
  return notification;
}

/**
 * Get notifications for user
 */
async function getNotificationsByUser(userId, limit = 20) {
  const db = getDb();
  const snapshot = await db.collection(COLLECTIONS.NOTIFICATIONS)
    .where('userId', '==', userId)
    .orderBy('createdAt', 'desc')
    .limit(limit)
    .get();
  
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// ==================== ANALYTICS COLLECTION ====================

/**
 * Log analytics event
 */
async function logAnalytics(analyticsData) {
  const db = getDb();
  const analyticsRef = db.collection(COLLECTIONS.ANALYTICS);
  
  const event = {
    analyticsId: `ANALYTICS-${Date.now()}`,
    ...analyticsData,
    timestamp: admin.firestore.FieldValue.serverTimestamp()
  };
  
  await analyticsRef.add(event);
  return event;
}

module.exports = {
  // Users
  createUser,
  getUserById,
  updateUser,
  
  // Complaints
  createComplaint,
  getComplaintById,
  getComplaintsByUser,
  updateComplaintStatus,
  deleteComplaint,
  getAllComplaints,
  
  // Reports
  createReport,
  getReportsByUser,
  
  // Community
  createCommunityPost,
  getCommunityPosts,
  addComment,
  getCommentsByPost,
  
  // Notifications
  createNotification,
  getNotificationsByUser,
  
  // Analytics
  logAnalytics
};
