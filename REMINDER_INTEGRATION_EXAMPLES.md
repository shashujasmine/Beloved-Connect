# Reminder System: Integration Examples

This file contains code snippets for integrating the reminder system into your frontend components.

## Quick Reference

### Activity Types
```
'message'           - Sent a love message/invitation
'call'              - Had a phone call
'visit'             - In-person visit
'memory_created'    - Created a memory (auto-logged)
'note_shared'       - Shared a note (auto-logged)
'invitation_sent'   - Sent invitation (auto-logged)
```

---

## Frontend Integration Examples

### 1. Manual Activity Logging

#### After Sending a Message

```jsx
// In SendLoveModal.jsx or similar component

const handleSendMessage = async (message, belovedEmail) => {
  try {
    // Send the message
    const result = await sendInvitation(message, belovedEmail);
    
    // Log the activity
    const belovedId = await getBelovedIdByEmail(belovedEmail);
    if (belovedId) {
      logActivity('message', belovedId, `Sent message: ${message.substring(0, 50)}...`);
    }
    
    showNotification('Message sent with love! ❤️');
  } catch (error) {
    console.error('Error:', error);
  }
};

// Helper function: Log activity
const logActivity = async (activityType, belovedId, details = '') => {
  const token = localStorage.getItem('token');
  try {
    const response = await fetch(`${API_URL}/activity/log`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        activity_type: activityType,
        beloved_id: belovedId,
        details: details
      })
    });
    
    if (!response.ok) {
      throw new Error('Failed to log activity');
    }
    
    // Refresh reminders after logging
    window.dispatchEvent(new Event('activityLogged'));
  } catch (error) {
    console.error('Error logging activity:', error);
  }
};

// Helper function: Get beloved ID by email
const getBelovedIdByEmail = async (email) => {
  const token = localStorage.getItem('token');
  try {
    const response = await fetch(`${API_URL}/beloved`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const beloved = await response.json();
    const person = beloved.find(p => p.email === email);
    return person?.id;
  } catch (error) {
    console.error('Error getting beloved ID:', error);
  }
};
```

#### After a Phone Call

```jsx
// In a hypothetical Call/Contact component

const handleCallLogged = (belovedId, duration) => {
  const details = `Called for ${duration} minutes`;
  logActivity('call', belovedId, details);
};
```

#### After an In-Person Visit

```jsx
// After user records a visit

const handleRecordVisit = async (belovedId, notes) => {
  const details = `Visited: ${notes || 'Spent quality time together'}`;
  await logActivity('visit', belovedId, details);
  
  // Optionally, create a memory or note
  console.log('Visit logged! Consider creating a memory about this moment.');
};
```

---

### 2. Enhanced Beloved Ones Component

Add a quick action button to log activities:

```jsx
// In BelovedOnes.jsx - Add to beloved card

const [showActivityMenu, setShowActivityMenu] = useState(null);

// Add button to beloved card:
<motion.button
  className="activity-quick-log"
  onClick={() => setShowActivityMenu(person.id)}
  title="Log activity"
>
  <Plus size={16} />
</motion.button>

// Add activity menu:
{showActivityMenu === person.id && (
  <motion.div className="activity-menu">
    <button onClick={() => {
      logActivity('message', person.id, 'Sent message');
      setShowActivityMenu(null);
    }}>
      Message 💌
    </button>
    <button onClick={() => {
      logActivity('call', person.id, 'Phone call');
      setShowActivityMenu(null);
    }}>
      Call 📞
    </button>
    <button onClick={() => {
      logActivity('visit', person.id, 'In-person visit');
      setShowActivityMenu(null);
    }}>
      Visit 🤗
    </button>
  </motion.div>
)}
```

---

### 3. Reminder Statistics Dashboard

```jsx
// New component: ReminderStats.jsx

import React, { useState, useEffect } from 'react';

const ReminderStats = ({ token, API_URL }) => {
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_URL}/stats/activity`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) throw new Error('Failed to fetch stats');
      
      const data = await response.json();
      setStats(data.stats);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching stats:', error);
      setLoading(false);
    }
  };

  const activityEmojis = {
    'message': '💌',
    'call': '📞',
    'visit': '🤗',
    'memory_created': '📸',
    'note_shared': '📝',
    'invitation_sent': '💝'
  };

  return (
    <div className="reminder-stats">
      <h3>Your Activity Overview</h3>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="stats-grid">
          {stats.map((stat, i) => (
            <div key={i} className="stat-card">
              <div className="stat-emoji">
                {activityEmojis[stat.activity_type] || '💭'}
              </div>
              <div className="stat-content">
                <p className="stat-type">{stat.activity_type}</p>
                <p className="stat-count">{stat.total_activities} times</p>
                {stat.last_activity && (
                  <small>Last: {new Date(stat.last_activity).toLocaleDateString()}</small>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReminderStats;
```

---

### 4. Global Activity Listener

```jsx
// Add to App.jsx

useEffect(() => {
  // Listen for activity logging events
  const handleActivityLogged = () => {
    // Refresh reminders
    if (window.refreshReminders) {
      window.refreshReminders();
    }
  };

  window.addEventListener('activityLogged', handleActivityLogged);
  
  return () => {
    window.removeEventListener('activityLogged', handleActivityLogged);
  };
}, []);

// In ReminderNotifications.jsx, expose refresh function:
useEffect(() => {
  window.refreshReminders = fetchReminders; // Expose for external use
  
  return () => {
    delete window.refreshReminders;
  };
}, []);
```

---

## Backend Integration Examples

### 1. Custom Reminder Generation on Schedule

```python
# Add to main.py - Run reminders generation on a schedule

import asyncio
from fastapi.background import BackgroundTasks

# Background task to generate reminders periodically
async def generate_reminders_background():
    """Generate reminders for all users periodically"""
    conn = get_db_connection()
    users = conn.execute("SELECT id FROM users").fetchall()
    conn.close()
    
    for user in users:
        user_id = user['id']
        try:
            ReminderSystem.generate_reminders(user_id)
        except Exception as e:
            print(f"Error generating reminders for user {user_id}: {e}")

# Schedule this to run every hour (you'd need APScheduler)
# For now, it runs on-demand via the API endpoint
```

### 2. Extend Activity Types

```python
# In reminder_system.py - Add new activity types

class ActivityTypes:
    MESSAGE = 'message'
    CALL = 'call'
    VISIT = 'visit'
    BIRTHDAY_GREETING = 'birthday_greeting'
    ANNIVERSARY_MESSAGE = 'anniversary_message'
    PHOTO_SHARED = 'photo_shared'
    VIDEO_CALL = 'video_call'
    MEETING = 'meeting'
    
    ALL = [MESSAGE, CALL, VISIT, BIRTHDAY_GREETING, ANNIVERSARY_MESSAGE, 
           PHOTO_SHARED, VIDEO_CALL, MEETING]

# Use it:
ReminderSystem.log_activity(
    user_id=1,
    beloved_id=2,
    activity_type=ActivityTypes.VIDEO_CALL,
    details="30-minute video call"
)
```

### 3. Custom Reminder Messages

```python
# In reminder_system.py - Customize messages

REMINDER_TEMPLATES = {
    'no_contact_short': "You haven't contacted {name} in {days} days! 💌",
    'no_contact_medium': "Time to catch up with {name}? It's been {days} days. 📞",
    'no_contact_long': "{name} ({relation}) might miss hearing from you—it's been {days} days! 💝",
    'memory_anniversary': "🎂 Remembering {memory_title} with {name} from {years} year(s) ago!",
    'contact_pattern': "You've had less contact with {name} recently. Reconnect? 💫"
}

def generate_custom_reminder(template_key, **kwargs):
    """Generate reminder using custom template"""
    template = REMINDER_TEMPLATES.get(template_key, "Reach out to someone today! 💕")
    return template.format(**kwargs)

# Usage:
message = generate_custom_reminder(
    'no_contact_short',
    name='Sarah',
    days=10
)
```

### 4. Analyze Contact Trends

```python
# New method in ReminderSystem (reminder_system.py)

@staticmethod
def get_contact_trends(user_id: int, days: int = 30) -> Dict:
    """Analyze contact trends over time"""
    conn = get_db_connection()
    
    # Get activities for the period
    query = """
        SELECT DATE(timestamp) as date, COUNT(*) as count
        FROM activity_log
        WHERE user_id = ? AND timestamp > datetime('now', '-' || ? || ' days')
        GROUP BY DATE(timestamp)
        ORDER BY date ASC
    """
    
    trends = conn.execute(query, (user_id, days)).fetchall()
    conn.close()
    
    return {
        'period_days': days,
        'total_activities': sum(t['count'] for t in trends),
        'average_per_day': sum(t['count'] for t in trends) / days if days > 0 else 0,
        'daily_data': [dict(t) for t in trends]
    }

# Use it:
trends = ReminderSystem.get_contact_trends(user_id=1, days=30)
# Returns: {
#   'period_days': 30,
#   'total_activities': 25,
#   'average_per_day': 0.83,
#   'daily_data': [{'date': '2026-04-01', 'count': 2}, ...]
# }
```

---

## Frontend Event Dispatching

### Centralized Activity Logger Utility

```javascript
// utils/activityLogger.js

export const ActivityLogger = {
  API_URL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api',
  
  async log(activityType, belovedId, details = '') {
    const token = localStorage.getItem('token');
    
    try {
      const response = await fetch(`${this.API_URL}/activity/log`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          activity_type: activityType,
          beloved_id: belovedId,
          details: details
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      // Dispatch event for listeners
      window.dispatchEvent(new CustomEvent('activity:logged', {
        detail: { activityType, belovedId, details }
      }));
      
      return await response.json();
    } catch (error) {
      console.error('Activity logging failed:', error);
      throw error;
    }
  },
  
  message: (belovedId, details) => ActivityLogger.log('message', belovedId, details),
  call: (belovedId, details) => ActivityLogger.log('call', belovedId, details),
  visit: (belovedId, details) => ActivityLogger.log('visit', belovedId, details),
};

// Usage:
import { ActivityLogger } from './utils/activityLogger';

// In any component:
await ActivityLogger.message(5, 'Sent a love letter');
await ActivityLogger.call(3, '45 minute call');
await ActivityLogger.visit(7, 'Sunday dinner');
```

---

## CSS Enhancement Examples

### Activity Quick Log Menu

```css
.activity-quick-log {
  background: none;
  border: none;
  cursor: pointer;
  padding: 6px;
  border-radius: 6px;
  color: var(--accent-primary);
  opacity: 0;
  transition: all 0.2s ease;
}

.beloved-card:hover .activity-quick-log {
  opacity: 1;
  background: rgba(190, 18, 60, 0.1);
}

.activity-menu {
  position: absolute;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  padding: 8px;
  z-index: 100;
  min-width: 150px;
}

.dark .activity-menu {
  background: #2a2a2a;
}

.activity-menu button {
  width: 100%;
  padding: 10px;
  border: none;
  background: none;
  cursor: pointer;
  text-align: left;
  border-radius: 6px;
  font-size: 14px;
  transition: background 0.2s;
}

.activity-menu button:hover {
  background: rgba(190, 18, 60, 0.1);
}
```

---

## Testing Examples

### Test Activity Logging

```javascript
// In browser console

// Test 1: Log a message
fetch('http://localhost:8000/api/activity/log', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    activity_type: 'message',
    beloved_id: 1,
    details: 'Test message'
  })
}).then(r => r.json()).then(console.log);

// Test 2: Get reminders
fetch('http://localhost:8000/api/reminders', {
  headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
}).then(r => r.json()).then(console.log);
```

---

This guide provides the foundation for extending and customizing the reminder system. Adapt these examples to your specific needs!
