# Admin Dashboard Setup Guide

## Overview
The CityVoice Admin Dashboard provides a comprehensive interface for managing complaints, users, and viewing analytics.

## Features

### ✅ Implemented Features:
- **Dashboard Overview** - View statistics and recent complaints
- **Complaints Management** - View, filter, search, update, and delete complaints
- **Status Updates** - Change complaint status (Submitted, In Progress, Under Review, Resolved)
- **Search & Filter** - Search by ID, name, keyword; filter by status and category
- **Pagination** - Navigate through complaints efficiently
- **Responsive Design** - Works on desktop, tablet, and mobile
- **Dark Mode** - Full dark mode support
- **Real-time Data** - Connected to Firebase Firestore

### 🔜 Coming Soon:
- User Management
- Reports Management
- Analytics Dashboard
- Settings Page

## Access Requirements

### 1. **Create an Admin Account**

The admin dashboard requires a user account with the `admin` role. Here's how to set one up:

#### Option A: Using Firebase Console (Recommended)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Firestore Database**
4. Go to the `users` collection
5. Find your user document (or create a new one)
6. Add/Update the `role` field to `"admin"`

Example user document:
```json
{
  "uid": "your-firebase-uid",
  "email": "admin@example.com",
  "firstName": "Admin",
  "surname": "User",
  "role": "admin",
  "isActive": true,
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

#### Option B: Using API (Development Only)

For development purposes, you can manually create an admin user:

```javascript
// In your browser console or a script
const createAdminUser = async () => {
  const response = await fetch('/api/users/profile', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer YOUR_ID_TOKEN'
    },
    body: JSON.stringify({
      role: 'admin'
    })
  });
  
  const result = await response.json();
  console.log('Admin user created:', result);
};
```

### 2. **Login Process**

1. Go to your CityVoice application
2. Login with your admin account credentials
3. Navigate to `/admin.html` or click on admin link if available
4. The system will verify your admin role automatically

### 3. **Security Notes**

⚠️ **Important Security Considerations:**

- Only users with `role: "admin"` can access admin endpoints
- All admin API calls require Firebase authentication token
- Admin routes are protected with `requireAdmin` middleware
- Never hardcode admin credentials in your code
- Regularly review admin user list
- Use Firebase security rules to restrict database access

## Using the Admin Dashboard

### Dashboard Page

The dashboard shows:
- **Total Complaints** - Overall count
- **Pending** - Complaints with "submitted" status
- **In Progress** - Active complaints
- **Resolved** - Completed complaints
- **Recent Complaints** - Latest 5 complaints

### Complaints Management

#### View All Complaints
1. Click **Complaints** in the sidebar
2. All complaints are displayed in a table
3. Columns: ID, User, Title, Category, Location, Status, Date, Actions

#### Search Complaints
- Type in the search box to find complaints by:
  - Complaint ID (e.g., CV-2025-001)
  - User name
  - Keywords in title or description

#### Filter Complaints
- **By Status**: Select from dropdown (All, Submitted, In Progress, Under Review, Resolved)
- **By Category**: Select category (All, Road, Water, Electricity, Waste, Other)
- Filters can be combined with search

#### View Complaint Details
1. Click **View** button on any complaint
2. Modal opens with full details:
   - Complaint ID
   - User information
   - Title and description
   - Category and location
   - Evidence (if available)
   - Current status
   - Submission date

#### Update Complaint Status
1. Open complaint details (click View)
2. Select new status from dropdown
3. Click **Save Changes**
4. Confirmation toast appears

#### Delete Complaint
1. Click **Delete** button on complaint row, OR
2. Open complaint details and click **Delete** in modal
3. Confirm deletion in popup
4. Complaint is permanently removed

#### Pagination
- Navigate using **Previous** and **Next** buttons
- Shows 10 complaints per page
- Page info displays current page and total pages

### Keyboard Shortcuts
- **Enter** in search box - Execute search
- **ESC** - Close modal (if implemented)

## API Endpoints Used

### Admin Endpoints (Require Admin Role)
- `GET /api/admin/complaints` - Get all complaints
- `DELETE /api/admin/complaints/:id` - Delete complaint
- `GET /api/admin/users` - Get all users
- `PUT /api/admin/users/:uid/role` - Update user role
- `GET /api/admin/stats` - Get dashboard statistics

### Regular Endpoints (Available to Admins)
- `GET /api/complaints/:id` - Get complaint details
- `PUT /api/complaints/:id` - Update complaint status

## Troubleshooting

### Can't Access Admin Dashboard
- **Error: "unauthorized"**
  - Make sure you're logged in
  - Check that your token is valid
  
- **Error: "Admin access required"**
  - Verify your user has `role: "admin"` in Firestore
  - Log out and log back in to refresh your session

### Complaints Not Loading
- Check browser console for errors
- Verify Firebase is properly configured
- Ensure Firestore has `complaints` collection
- Check network tab for API response

### Can't Update Complaint
- Verify you have admin role
- Check that complaint ID is valid
- Ensure Firebase connection is active

### UI Issues
- Hard refresh: `Ctrl + Shift + R` (Windows) or `Cmd + Shift + R` (Mac)
- Clear browser cache
- Try in incognito/private mode
- Check browser console for JavaScript errors

## Customization

### Changing Items Per Page
In `admin.js`, modify:
```javascript
const state = {
  itemsPerPage: 10  // Change this number
};
```

### Adding More Filters
Edit `handleFilterChange()` in `admin.js` and add filter UI in `admin.html`

### Custom Status Colors
In `admin.css`, modify status badge colors:
```css
.status-badge.your-status {
  background: #your-bg-color;
  color: #your-text-color;
}
```

### Layout Modifications
- Edit `admin.css` for styling changes
- Modify `admin.html` for structure changes
- Update `admin.js` for functionality changes

## Performance Tips

1. **Pagination** - Already implemented (10 items per page)
2. **Lazy Loading** - Consider implementing virtual scrolling for large datasets
3. **Caching** - Implement local state caching to reduce API calls
4. **Indexing** - Create Firestore indexes for frequently queried fields

## Future Enhancements

Planned features:
- [ ] Bulk actions (select multiple complaints)
- [ ] Export to CSV/PDF
- [ ] Advanced analytics charts
- [ ] Real-time updates (WebSocket/Firestore listeners)
- [ ] User management interface
- [ ] Role-based permissions (Moderator role)
- [ ] Email notifications to users
- [ ] Complaint assignment to specific admins
- [ ] Activity log/audit trail

## Support

For issues or questions:
1. Check browser console for error messages
2. Review Firebase Console for database issues
3. Check server logs for API errors
4. Refer to the main README.md for general setup

## Security Best Practices

1. **Never expose admin credentials**
2. **Use environment variables for sensitive data**
3. **Regularly update Firebase security rules**
4. **Monitor admin access logs**
5. **Implement rate limiting on admin endpoints**
6. **Use HTTPS in production**
7. **Enable two-factor authentication for admin accounts**
8. **Regularly backup your Firestore database**

---

**Admin Dashboard Version:** 1.0  
**Last Updated:** November 2025  
**Compatible with:** CityVoice v1.0+
