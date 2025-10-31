/**
 * Database Schema for CityVoice Application
 * Using Firestore Collections - One collection per page/feature
 */

// Collection names
const COLLECTIONS = {
  USERS: 'users',                    // For profile.html & auth.html
  COMPLAINTS: 'complaints',          // For complaint.html & track.html
  REPORTS: 'reports',                // For report.html
  COMMUNITY_POSTS: 'community_posts', // For community.html
  COMMUNITY_COMMENTS: 'community_comments', // For community.html
  NOTIFICATIONS: 'notifications',     // For user notifications
  ANALYTICS: 'analytics'             // For tracking and analytics
};

/**
 * USERS Collection Schema
 * Used by: profile.html, auth.html
 */
const UserSchema = {
  uid: 'string',              // Firebase Auth UID
  email: 'string',
  firstName: 'string',
  surname: 'string',
  phone: 'string',
  address: 'string',
  city: 'string',
  state: 'string',
  zipCode: 'string',
  profilePicture: 'string',   // URL to profile image
  createdAt: 'timestamp',
  updatedAt: 'timestamp',
  role: 'string',             // 'user' | 'admin' | 'moderator'
  isActive: 'boolean'
};

/**
 * COMPLAINTS Collection Schema
 * Used by: complaint.html, track.html
 */
const ComplaintSchema = {
  complaintId: 'string',      // Format: CV-YYYY-XXX
  userId: 'string',           // Reference to user UID
  title: 'string',
  description: 'string',
  category: 'string',         // 'road' | 'water' | 'electricity' | etc.
  location: {
    address: 'string',
    lat: 'number',
    lng: 'number',
    city: 'string',
    state: 'string'
  },
  evidence: 'string',         // URL to uploaded evidence (photo/video)
  status: 'string',           // 'submitted' | 'in-progress' | 'under-review' | 'resolved'
  priority: 'string',         // 'low' | 'medium' | 'high' | 'urgent'
  assignedTo: 'string',       // Admin/Department ID
  timeline: 'array',          // Array of status updates
  upvotes: 'number',
  views: 'number',
  createdAt: 'timestamp',
  updatedAt: 'timestamp',
  resolvedAt: 'timestamp'
};

/**
 * REPORTS Collection Schema
 * Used by: report.html
 */
const ReportSchema = {
  reportId: 'string',
  userId: 'string',
  reportType: 'string',       // 'incident' | 'feedback' | 'suggestion' | 'complaint'
  title: 'string',
  description: 'string',
  category: 'string',
  location: 'string',
  attachments: 'array',       // Array of file URLs
  status: 'string',           // 'pending' | 'reviewed' | 'resolved'
  createdAt: 'timestamp',
  updatedAt: 'timestamp'
};

/**
 * COMMUNITY_POSTS Collection Schema
 * Used by: community.html
 */
const CommunityPostSchema = {
  postId: 'string',
  userId: 'string',
  userName: 'string',
  userAvatar: 'string',
  title: 'string',
  content: 'string',
  category: 'string',
  tags: 'array',              // Array of tag strings
  attachments: 'array',       // Array of image/file URLs
  likes: 'number',
  commentsCount: 'number',
  views: 'number',
  isPinned: 'boolean',
  isLocked: 'boolean',
  createdAt: 'timestamp',
  updatedAt: 'timestamp'
};

/**
 * COMMUNITY_COMMENTS Collection Schema
 * Used by: community.html
 */
const CommunityCommentSchema = {
  commentId: 'string',
  postId: 'string',           // Reference to parent post
  userId: 'string',
  userName: 'string',
  userAvatar: 'string',
  content: 'string',
  likes: 'number',
  createdAt: 'timestamp',
  updatedAt: 'timestamp'
};

/**
 * NOTIFICATIONS Collection Schema
 * Used by: All pages (for user notifications)
 */
const NotificationSchema = {
  notificationId: 'string',
  userId: 'string',
  type: 'string',             // 'complaint_update' | 'comment' | 'like' | 'system'
  title: 'string',
  message: 'string',
  link: 'string',             // URL to related content
  isRead: 'boolean',
  createdAt: 'timestamp'
};

/**
 * ANALYTICS Collection Schema
 * Used by: Admin dashboard & tracking
 */
const AnalyticsSchema = {
  analyticsId: 'string',
  type: 'string',             // 'page_view' | 'user_action' | 'complaint_stats'
  userId: 'string',
  page: 'string',
  action: 'string',
  metadata: 'object',         // Additional data
  timestamp: 'timestamp'
};

module.exports = {
  COLLECTIONS,
  UserSchema,
  ComplaintSchema,
  ReportSchema,
  CommunityPostSchema,
  CommunityCommentSchema,
  NotificationSchema,
  AnalyticsSchema
};
