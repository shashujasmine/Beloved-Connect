# AI-Based Reminder System for Beloved Connect

## Overview

The AI-based reminder system analyzes user activity and automatically generates intelligent reminders to help you stay connected with your loved ones. It tracks interactions, remembers special dates, and suggests actions to strengthen your relationships.

## Features

### 1. **No Contact Reminders**
- Tracks days since last contact with each beloved one
- Suggests reaching out when contact duration exceeds threshold (default: 7 days)
- Smart messages that adapt based on time since contact:
  - **Less than 2 weeks**: "You haven't contacted your loved one in X days. Consider reaching out! 💌"
  - **2-4 weeks**: "Time for a catch-up? 📞"
  - **1-2 months**: "Your beloved one might miss hearing from you 💝"
  - **2+ months**: "It's been a while... time to reconnect? 💭"

### 2. **Memory Anniversary Reminders**
- Detects anniversaries of memories created with beloved ones
- Reminds you a few days before and after the anniversary
- Example: "🎂 Anniversary of memory with Mom: 'Summer vacation 1995'"

### 3. **Contact Pattern Analysis**
- Analyzes contact frequency over the past 30 days
- Alerts when contact patterns shift or decrease
- Helps identify relationship trends and nudge users to be more consistent

### 4. **Activity Tracking**
Automatically logs these activities:
- **message**: Sending love messages/invitations
- **call**: Phone calls (when tracked)
- **visit**: In-person visits
- **memory_created**: When you create a memory
- **note_shared**: When you share a note
- **invitation_sent**: When you send an invitation

## System Architecture

### Backend Components

#### Database Schema

**activity_log table:**
```sql
CREATE TABLE activity_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    beloved_id INTEGER,
    activity_type TEXT,        -- 'message', 'call', 'visit', etc.
    timestamp TIMESTAMP,
    details TEXT,
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(beloved_id) REFERENCES beloved(id)
)
```

**reminders table:**
```sql
CREATE TABLE reminders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    beloved_id INTEGER,
    reminder_type TEXT,         -- 'no_contact', 'memory_anniversary', 'contact_pattern'
    message TEXT,
    created_at TIMESTAMP,
    due_date TIMESTAMP,
    is_read INTEGER,            -- 0 = unread, 1 = read
    is_dismissed INTEGER,       -- 0 = active, 1 = dismissed
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(beloved_id) REFERENCES beloved(id)
)
```

**beloved table (updated):**
- Added `last_contact TIMESTAMP` field to track most recent interaction

#### Reminder System Module (`reminder_system.py`)

**Key Methods:**

1. **`ReminderSystem.log_activity()`**
   - Records interactions with beloved ones
   - Automatically updates `beloved.last_contact` timestamp

2. **`ReminderSystem.generate_reminders()`**
   - Analyzes all beloved ones for the user
   - Generates reminders based on three criteria
   - Stores reminders in database (avoiding duplicates)
   - Returns list of generated reminders

3. **`ReminderSystem.get_pending_reminders()`**
   - Retrieves all unread, non-dismissed reminders
   - Includes beloved one information

4. **`ReminderSystem.mark_reminder_read()`**
   - Mark reminder as read (won't affect pending status)

5. **`ReminderSystem.dismiss_reminder()`**
   - Dismiss reminder (removes from pending list)

6. **`ReminderSystem.get_last_contact()`**
   - Returns datetime of last contact with a beloved one

7. **`ReminderSystem.get_days_since_contact()`**
   - Calculates days since last interaction

### API Endpoints

#### Activity Logging
```
POST /api/activity/log
Body: {
    "activity_type": "message",
    "beloved_id": 1,
    "details": "Optional details"
}
```

#### Reminder Management
```
GET /api/reminders                    # Get pending reminders
POST /api/reminders/generate          # Generate new reminders
PUT /api/reminders/{id}/read          # Mark as read
PUT /api/reminders/{id}/dismiss       # Dismiss reminder
```

#### Statistics & Information
```
GET /api/stats/activity               # Get activity statistics
GET /api/stats/activity?beloved_id=1  # Stats for specific person
GET /api/beloved/{id}/last-contact    # Get last contact info
```

### Frontend Components

#### ReminderNotifications.jsx

**Features:**
- Bell icon with unread count badge
- Sliding panel with reminder list
- Color-coded reminders based on type:
  - 💗 No Contact: Pink/Rose
  - 📅 Memory Anniversary: Orange
  - 💫 Contact Pattern: Blue
- Mark as read / Dismiss actions
- Auto-refresh every 5 minutes
- Dark mode support

**Props:**
```jsx
<ReminderNotifications 
  token={token}              // JWT token
  API_URL={API_URL}          // API base URL
/>
```

#### BelovedOnes.jsx (Enhanced)

**New Feature:**
- Displays last contact timestamp on each beloved one card
- Shows friendly time format ("2 weeks ago", "Never contacted", etc.)
- Clock icon with highlight to draw attention

## Configuration

Threshold values in `reminder_system.py`:

```python
class ReminderSystem:
    NO_CONTACT_THRESHOLD = 7         # Days before suggesting contact
    MEMORY_ANNIVERSARY_THRESHOLD = 365  # Check yearly milestones
    CHECK_FREQUENCY = 1                # Days between checks
```

## Usage Guide

### For End Users

1. **Add Beloved Ones**
   - Navigate to "Beloved Ones" section
   - Add names, relations, emails, and notes

2. **Monitor Reminders**
   - Click the bell icon in the navbar
   - View all pending reminders
   - Read or dismiss as needed

3. **Send Love**
   - Create memories and share them
   - Send invitation messages
   - Share notes with loved ones

4. **Check Activity**
   - Last contact time displays on each beloved one's card
   - Automatic reminders prompt you when it's been too long

### For Developers

1. **Log Manual Activities**
   ```javascript
   // When user manually logs contact
   fetch('/api/activity/log', {
       method: 'POST',
       headers: {'Authorization': `Bearer ${token}`},
       body: JSON.stringify({
           activity_type: 'call',
           beloved_id: 5,
           details: 'Called for 30 minutes'
       })
   })
   ```

2. **Generate Reminders on Demand**
   ```javascript
   fetch('/api/reminders/generate', {
       method: 'POST',
       headers: {'Authorization': `Bearer ${token}`}
   })
   ```

3. **Personalize Reminders**
   - Edit thresholds in `reminder_system.py`
   - Customize reminder messages in `_generate_no_contact_reminder()` method

## Notification Flow

```
User Activity → Activity Logged → Last Contact Updated
           ↓
    Reminder Generation Process Runs
           ↓
    Analyze each beloved one:
    - Days since contact
    - Memory anniversaries
    - Contact patterns
           ↓
    Generate reminders (if applicable)
           ↓
    Store in database (avoid duplicates)
           ↓
    Frontend fetches pending reminders
           ↓
    Display in notification bell
           ↓
    User can read/dismiss
```

## Best Practices

1. **Regular Reminders Check**
   - Users should check reminders regularly
   - Frontend auto-refreshes every 5 minutes

2. **Logging Important Interactions**
   - When manually tracking interactions, use the activity log API
   - Example: Phone calls, visits, important conversations

3. **Customization**
   - Adjust thresholds based on user preferences
   - Consider adding user settings for reminder frequency

4. **Privacy**
   - All reminders are per-user
   - Activity logs include timestamps and details
   - Dismissed reminders can still be queried if needed

## Future Enhancements

1. **Email Notifications**
   - Optional daily/weekly reminder emails
   - Digest of pending reminders

2. **Smart Goals**
   - Set contact frequency goals per person
   - Achievement badges

3. **Predictive Reminders**
   - ML-based pattern detection
   - Optimal contact time suggestions

4. **Integration**
   - Calendar sync for birthdays/anniversaries
   - Voice reminders through app

5. **Customizable Themes**
   - Color code by relationship type
   - Custom reminder templates

## Troubleshooting

**Reminders not showing:**
- Verify `POST /api/reminders/generate` is called
- Check that beloved ones have email addresses
- Ensure user has created at least one interaction

**Last contact showing "Never contacted":**
- Add the first activity via `/api/activity/log`
- Or create a memory/send invitation (automatically logged)

**Reminders not updating:**
- Check browser console for errors
- Verify token is valid
- Ensure API_URL is correct

## API Response Examples

### Get Pending Reminders
```json
[
  {
    "id": 1,
    "user_id": 1,
    "beloved_id": 5,
    "reminder_type": "no_contact",
    "message": "You haven't contacted your mother in 10 days. Consider reaching out to mom! 💌",
    "beloved_name": "Mom",
    "relation": "Mother",
    "created_at": "2026-04-14T10:30:00",
    "is_read": 0,
    "is_dismissed": 0
  },
  {
    "id": 2,
    "user_id": 1,
    "beloved_id": 3,
    "reminder_type": "memory_anniversary",
    "message": "🎂 Anniversary of memory with Sarah: 'Our trip to Paris'",
    "beloved_name": "Sarah",
    "created_at": "2026-04-14T09:00:00",
    "is_read": 0,
    "is_dismissed": 0
  }
]
```

### Get Last Contact Info
```json
{
  "id": 5,
  "name": "Mom",
  "last_contact": "2026-04-07T14:30:00",
  "days_since": 7
}
```

---

**Created:** April 14, 2026  
**Version:** 1.0  
**Status:** Production Ready
