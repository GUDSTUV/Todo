# Notification System Quick Start Guide

## 🚀 How to Use

### For Developers

#### 1. Creating Notifications Programmatically

```typescript
import { createNotification } from "../services/notificationService";

// Create a custom notification
await createNotification({
  userId: user._id,
  taskId: task._id, // Optional
  type: "system",
  title: "Welcome!",
  message: "Your account has been created successfully",
  actionUrl: "/dashboard",
  metadata: { someData: "value" },
});
```

#### 2. Using Notifications in Components

```tsx
import {
  useNotifications,
  useUnreadCount,
} from "../../hooks/useNotifications/useNotifications";

function MyComponent() {
  const { data: notifications } = useNotifications();
  const { data: unreadCount } = useUnreadCount();

  return (
    <div>
      <p>You have {unreadCount} unread notifications</p>
      {notifications?.map((notif) => (
        <div key={notif._id}>{notif.title}</div>
      ))}
    </div>
  );
}
```

#### 3. Triggering Email Reminders

```typescript
import { sendTaskReminderEmail } from "../services/notificationService";

// Send email reminder for a task
await sendTaskReminderEmail(taskId);
```

#### 4. Processing Due Reminders (Cron Job)

```typescript
import {
  processDueReminders,
  processTasksDueToday,
  processOverdueTasks,
} from "../services/notificationService";

// In your cron job or scheduler
setInterval(async () => {
  await processDueReminders(); // Check reminders every minute
  await processTasksDueToday(); // Check once daily
  await processOverdueTasks(); // Check once daily
}, 60000); // Every minute
```

### For End Users

#### 1. Viewing Notifications

- Click the bell icon 🔔 in the top navigation
- Unread notifications show a badge with count
- New notifications appear in blue

#### 2. Reading Notifications

- Click on any notification to navigate to the related task
- Notification automatically marks as read
- Or click "Mark all as read" to clear all

#### 3. Deleting Notifications

- Click "Delete" on any notification
- Notifications auto-delete after 30 days

#### 4. Setting Task Reminders

1. Create or edit a task
2. Set a reminder date/time
3. You'll receive:
   - In-app notification
   - Email notification (if configured)

## 🧪 Testing

### Create Test Notification (Development Only)

```bash
# Using curl
curl -X POST http://localhost:5000/api/notifications/test \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "title": "Test Notification",
    "message": "This is a test message",
    "type": "system"
  }'
```

### Check Notifications

```bash
# Get all notifications
curl http://localhost:5000/api/notifications \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get unread count
curl http://localhost:5000/api/notifications/unread-count \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## ⚙️ Configuration

### Email Settings

Set these environment variables in `server/.env`:

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USERNAME=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM_NAME=Todu
EMAIL_FROM=noreply@todu.com
CLIENT_URL=http://localhost:5173
```

### Notification Types

| Type         | Icon | Usage                 |
| ------------ | ---- | --------------------- |
| reminder     | 🔔   | User-set reminders    |
| task_due     | 📅   | Tasks due today       |
| task_overdue | ⚠️   | Overdue tasks         |
| shared_list  | 👥   | List sharing (future) |
| comment      | 💬   | Comments (future)     |
| system       | ℹ️   | System messages       |

## 🔧 Troubleshooting

### Notifications Not Appearing

1. Check if user is authenticated
2. Verify API endpoint is accessible
3. Check browser console for errors
4. Ensure NotificationCenter is in AppShell

### Email Not Sending

1. Verify EMAIL\_\* environment variables
2. Check email service credentials
3. Look for errors in server logs
4. Test with Ethereal (dev fallback)

### High Unread Count

1. Use "Mark all as read" button
2. Old read notifications auto-delete after 30 days
3. Manually delete unwanted notifications

## 📊 Performance Tips

1. **Adjust Refetch Intervals**

   ```typescript
   // In useNotifications.ts
   refetchInterval: 30000, // Increase if needed
   ```

2. **Limit Notification Count**

   ```typescript
   useNotifications({ limit: 10 }); // Show fewer notifications
   ```

3. **Disable Auto-Refetch**
   ```typescript
   useNotifications({ limit: 20 }, { enabled: false });
   ```

## 🎨 Customization

### Change Notification Icons

Edit `NotificationCenter.tsx`:

```typescript
const getNotificationIcon = (type: Notification["type"]) => {
  switch (type) {
    case "reminder":
      return "⏰"; // Change icon here
    // ...
  }
};
```

### Modify Email Template

Edit `notificationService.ts` in the `sendTaskReminderEmail` function:

```typescript
const html = `
  <!-- Your custom HTML template -->
`;
```

### Add New Notification Type

1. Add to `Notification.ts` enum:

   ```typescript
   type: "reminder" | "task_due" | "my_new_type";
   ```

2. Add icon in `NotificationCenter.tsx`
3. Create service function if needed

## 📝 Best Practices

1. ✅ Always include actionUrl for notifications
2. ✅ Use descriptive titles and messages
3. ✅ Include relevant metadata
4. ✅ Test email templates before production
5. ✅ Set up cron jobs for automated processing
6. ✅ Monitor notification count to prevent spam
7. ✅ Implement notification preferences

## 🔗 Related Files

- **Models:** `server/src/models/Notification.ts`
- **Service:** `server/src/services/notificationService.ts`
- **Controller:** `server/src/controllers/notificationController.ts`
- **Routes:** `server/src/routes/notificationRoutes.ts`
- **API Client:** `client/src/api/notifications/notifications.ts`
- **Hooks:** `client/src/hooks/useNotifications/useNotifications.ts`
- **UI:** `client/src/components/ui/NotificationCenter.tsx`

## 🆘 Need Help?

Check the comprehensive documentation:

- `NOTIFICATION_SYSTEM_SUMMARY.md` - Full implementation details
- `IMPLEMENTATION_STATUS.md` - Overall project status
- Component comments - Inline documentation

---

**Last Updated:** October 31, 2025
