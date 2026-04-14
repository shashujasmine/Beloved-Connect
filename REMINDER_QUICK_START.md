# Quick Start: AI Reminder System

## Installation & Setup

### 1. Backend Setup

The reminder system is already integrated into your backend. Ensure your dependencies are installed:

```bash
cd backend
pip install -r requirements.txt
```

### 2. Database Migration

The database schema is automatically created when you run the backend. If you have an existing database, tables will be added:

```bash
# Just run your backend - tables are created automatically
python -m uvicorn main:app --reload
```

### 3. Frontend Integration

The reminder system is already integrated into your frontend. Make sure:

- [x] `ReminderNotifications.jsx` component is created
- [x] CSS file `ReminderNotifications.css` is created
- [x] App.jsx includes the ReminderNotifications component
- [x] Navbar passes required props

## Testing the System

### Test 1: Add a Beloved One

1. Navigate to "Beloved Ones" page
2. Click "Add Someone Special"
3. Fill in the form:
   - Name: "Sarah"
   - Relation: "Sister"
   - Email: "sarah@example.com"
4. Click Add

### Test 2: Verify Last Contact Display

1. After adding, you should see the card with "Never contacted" badge
2. The card shows contact information with a clock icon

### Test 3: Log an Activity

Use curl to log an activity (or implement a UI button):

```bash
# Replace TOKEN with your actual token
curl -X POST http://localhost:8000/api/activity/log \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "activity_type": "message",
    "beloved_id": 1,
    "details": "Sent a love message"
  }'
```

Or use JavaScript:

```javascript
const token = localStorage.getItem('token');
fetch('/api/activity/log', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    activity_type: 'message',
    beloved_id: 1,
    details: 'Sent a love message'
  })
});
```

### Test 4: Generate and View Reminders

1. Click the bell icon in the navbar
2. Click "Generate Reminders" endpoint (or wait 5 minutes for auto-refresh)
3. Check for any pending reminders

To generate manually via API:

```bash
curl -X POST http://localhost:8000/api/reminders/generate \
  -H "Authorization: Bearer TOKEN"
```

### Test 5: Create Automatic Reminders

Option A: **Send an Invitation** (auto-logs activity)
1. Click on a beloved one's email
2. Fill in the invitation modal
3. Send

Option B: **Create a Memory**
1. Go to Memories
2. Create a new memory
3. Share it with a beloved one's email
4. Activity logs automatically

### Test 6: Test No-Contact Reminder

To expedite testing, you can temporarily modify the threshold:

```python
# In reminder_system.py, temporarily change:
NO_CONTACT_THRESHOLD = 0  # Will trigger immediately
```

Then:
1. Log an activity
2. Generate reminders
3. You should see "You haven't contacted X in 0 days..."
4. Change it back to 7

## Key API Endpoints to Test

### 1. Log Activity
```
POST /api/activity/log
Body: {"activity_type": "message", "beloved_id": 1, "details": "..."}
```

### 2. Generate Reminders
```
POST /api/reminders/generate
```

### 3. Get Pending Reminders
```
GET /api/reminders
```

### 4. Mark Reminder as Read
```
PUT /api/reminders/{id}/read
```

### 5. Dismiss Reminder
```
PUT /api/reminders/{id}/dismiss
```

### 6. Get Last Contact Info
```
GET /api/beloved/{beloved_id}/last-contact
```

### 7. Get Activity Stats
```
GET /api/stats/activity
GET /api/stats/activity?beloved_id=1
```

## Troubleshooting

### Reminders Bell Not Showing

**Issue:** Bell icon isn't appearing in navbar

**Solution:**
1. Check browser console for errors
2. Verify `ReminderNotifications` is imported in App.jsx
3. Check that token is being passed correctly
4. Try hard refresh (Ctrl+Shift+R)

### No Reminders Appearing

**Issue:** Bell shows 0 reminders even after adding activities

**Solution:**
1. Verify you've logged activities via `/api/activity/log`
2. Call `/api/reminders/generate` manually
3. Check database: `SELECT * FROM reminders WHERE user_id = YOUR_ID;`
4. Verify `beloved_id` in activity log matches a real beloved one

### Last Contact Not Updating

**Issue:** "Never contacted" persists after logging activities

**Solution:**
1. Verify activity was logged to correct `beloved_id`
2. Check `beloved` table has the person
3. Query: `SELECT last_contact FROM beloved WHERE id = ?;`
4. Manually update if needed: `UPDATE beloved SET last_contact = CURRENT_TIMESTAMP WHERE id = 1;`

### Activities Not Auto-Logging

**Issue:** Creating memories/invitations doesn't log activity

**Solution:**
1. Verify email/name in shared_with matches beloved one's email
2. Check `activity_log` table: `SELECT * FROM activity_log;`
3. Ensure `beloved` person has matching email
4. Manually log via API as workaround

## Development Tips

### Disable Auto-Refresh
For testing without interruption:

```javascript
// In ReminderNotifications.jsx, comment out:
// const interval = setInterval(() => {...}, 5 * 60 * 1000);
```

### Speed Up Testing
Modify thresholds temporarily:

```python
# reminder_system.py
NO_CONTACT_THRESHOLD = 0
MEMORY_ANNIVERSARY_THRESHOLD = 0
```

### Mock Data
Create test data in database:

```sql
-- Add test beloved one
INSERT INTO beloved (user_id, name, relation, email, last_contact)
VALUES (1, 'Test User', 'Friend', 'test@example.com', datetime('now', '-10 days'));

-- Add test activity
INSERT INTO activity_log (user_id, beloved_id, activity_type, timestamp, details)
VALUES (1, 1, 'message', datetime('now'), 'Test activity');

-- Add test reminder
INSERT INTO reminders (user_id, beloved_id, reminder_type, message, created_at, due_date)
VALUES (1, 1, 'no_contact', 'Test reminder message', datetime('now'), datetime('now'));
```

## Performance Notes

- Reminder generation checks all beloved ones: O(n)
- Memory anniversary check is O(n*m) where m = memories per person
- Database queries are indexed on user_id and created_at
- Frontend auto-refresh: every 5 minutes (configurable)

## Next Steps

1. **Test all API endpoints** using the curl commands above
2. **Verify notification display** works across browsers
3. **Test on mobile** to ensure responsive design
4. **Add manual activity logging** UI if desired
5. **Export data** for analytics (optional)

## Support

For issues or questions:
1. Check the [REMINDER_SYSTEM.md](./REMINDER_SYSTEM.md) documentation
2. Review the inline code comments
3. Check browser console for JavaScript errors
4. Check backend logs for API errors

---

**Happy Reminding!** 💕
