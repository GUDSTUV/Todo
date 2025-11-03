# 🤝 Collaboration Features Guide

## Where to Find Collaboration Features

### 1. **Share Button in List Sidebar**

- **Location**: Left sidebar where your lists are displayed
- **How to access**: Hover over any list that YOU OWN
- **What it looks like**: A small share icon (🔗) appears on the right side when you hover

### 2. **Share List Modal**

When you click the share button, a modal opens with:

- **Email input**: Enter the email address of the user you want to share with
- **Role selector**: Choose between:
  - **Viewer** (Read only) - Can see tasks but can't edit
  - **Editor** (Can edit) - Can create, edit, and delete tasks
- **Collaborators list**: Shows who the list is currently shared with
- **Remove button**: For each collaborator (only owner can remove)

### 3. **Shared List Indicators**

Lists show visual indicators:

- **👥 Icon**: Appears next to list name if it's shared
- **"Shared by [Name]"**: Shows below list name for lists shared with you
- **Owner**: You can only share lists you own (not lists shared with you)

---

## How to Use Collaboration Features

### **Step 1: Create a Test User Account**

1. Open browser to `http://localhost:5173`
2. Register a second user account (e.g., user2@example.com)
3. Log out and log back in with your first account

### **Step 2: Share a List**

1. In the left sidebar, hover over any list you own
2. Click the **share icon** (🔗) that appears
3. Enter the email of the second user: `user2@example.com`
4. Select role: **Editor** or **Viewer**
5. Click **"Share List"** button
6. ✅ The user will appear in the collaborators list

### **Step 3: View Shared List (Other User)**

1. Log out and log in as the second user
2. Go to the dashboard
3. You'll see the shared list in the sidebar with:
   - 👥 Icon next to the list name
   - "Shared by [Owner Name]" below the name
4. Click the list to view tasks

### **Step 4: Test Permissions**

#### **As Editor:**

- ✅ Can view all tasks in the list
- ✅ Can create new tasks
- ✅ Can edit existing tasks
- ✅ Can delete tasks
- ❌ Cannot share the list with others
- ❌ Cannot delete the list itself

#### **As Viewer:**

- ✅ Can view all tasks in the list
- ❌ Cannot create tasks
- ❌ Cannot edit tasks
- ❌ Cannot delete tasks
- ❌ Cannot share the list
- ❌ Cannot delete the list

### **Step 5: Remove Collaborators**

1. As the list owner, click the share button again
2. In the collaborators section, click **"Remove"** next to any user
3. That user will lose access immediately

### **Step 6: Leave a Shared List**

(Future feature - not yet implemented in UI, but backend is ready)

---

## Technical Implementation Details

### Backend API Endpoints

```
POST   /api/lists/:id/share                          - Share list with user
DELETE /api/lists/:id/collaborators/:collaboratorId  - Remove collaborator
POST   /api/lists/:id/leave                          - Leave shared list
GET    /api/lists                                    - Returns owned + shared lists
GET    /api/tasks                                    - Returns tasks from accessible lists
```

### Database Schema

**List Model** (`sharedWith` field):

```javascript
sharedWith: [
  {
    userId: ObjectId, // Reference to User
    role: "viewer" | "editor",
    invitedAt: Date,
  },
];
```

### Frontend Components

1. **`ShareListModal.tsx`** - Main sharing interface
   - Location: `client/src/features/lists/ShareListModal.tsx`
   - Props: `isOpen`, `onClose`, `list`

2. **`ListSidebar.tsx`** - Updated with share buttons and indicators
   - Location: `client/src/features/lists/ListSidebar.tsx`
   - Shows share button on hover (owner only)
   - Displays shared icons and owner info

3. **API Client** - Sharing methods
   - Location: `client/src/api/lists/lists.ts`
   - Methods: `shareList()`, `removeCollaborator()`, `leaveSharedList()`

### Permission System

**Backend validation** (`taskController.ts`):

- `hasListAccess()` - Checks if user owns or is a collaborator
- `canEditList()` - Checks if user is owner or editor role
- Applied to: create, update, delete task operations

---

## Testing Checklist

- [ ] Create 2+ user accounts
- [ ] Share a list with another user as **Editor**
- [ ] Log in as second user and verify they can see the list
- [ ] Create a task in the shared list (should work for editor)
- [ ] Share another list as **Viewer**
- [ ] Try to create a task as viewer (should fail/show error)
- [ ] Remove a collaborator as owner
- [ ] Verify removed user no longer sees the list
- [ ] Test dark mode - all collaboration UI should respect theme

---

## Known Limitations & Future Enhancements

### Current Limitations:

- No real-time notifications when shared
- No "Leave Shared List" button in UI (backend ready)
- No email invitations (requires SMTP setup)
- No bulk sharing (one email at a time)

### Future Enhancements (Optional):

- [ ] Add "Leave List" button for collaborators
- [ ] Send email notifications when list is shared
- [ ] Add real-time notifications in NotificationCenter
- [ ] Allow sharing with multiple users at once
- [ ] Add list activity log (who did what)
- [ ] Show online status of collaborators
- [ ] Add @mentions in task comments

---

## Troubleshooting

**Q: Share button doesn't appear?**

- A: Make sure you OWN the list (not a shared list)
- A: Hover slowly over the list item

**Q: Can't find user by email?**

- A: Make sure the user is registered in the database
- A: Email is case-insensitive but must match exactly

**Q: Getting "Access denied" errors?**

- A: Check if you have proper permissions (Editor vs Viewer)
- A: Verify the list is actually shared with you

**Q: Shared list not appearing?**

- A: Refresh the page
- A: Check if React Query cache needs invalidation

---

## Development Server Status

- ✅ Backend running on: `http://localhost:5000`
- ✅ Frontend running on: `http://localhost:5173`
- 🗄️ Database: MongoDB (check connection in server logs)

**Ready to test!** Open `http://localhost:5173` in your browser.
