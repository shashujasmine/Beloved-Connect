"""
AI-based reminder system for tracking beloved ones and suggesting interactions.
"""

from datetime import datetime, timedelta
from db import get_db_connection
from typing import List, Dict, Optional

class ReminderSystem:
    """Manages reminders and activity tracking."""
    
    # Configuration for reminder thresholds (in days)
    NO_CONTACT_THRESHOLD = 7  # Suggest contact after 7 days
    MEMORY_ANNIVERSARY_THRESHOLD = 365  # Remind on memory anniversaries
    CHECK_FREQUENCY = 1  # Check every 1 day
    
    @staticmethod
    def log_activity(user_id: int, beloved_id: int, activity_type: str, details: str = "") -> None:
        """
        Log an interaction with a beloved one.
        
        Activity types: 'message', 'call', 'visit', 'memory_created', 'note_shared', 'invitation_sent'
        """
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute("""
            INSERT INTO activity_log (user_id, beloved_id, activity_type, timestamp, details)
            VALUES (?, ?, ?, datetime('now'), ?)
        """, (user_id, beloved_id, activity_type, details))
        
        # Update last_contact in beloved table
        cur.execute("""
            UPDATE beloved SET last_contact = datetime('now')
            WHERE id = ? AND user_id = ?
        """, (beloved_id, user_id))
        
        conn.commit()
        conn.close()
    
    @staticmethod
    def get_last_contact(beloved_id: int) -> Optional[datetime]:
        """Get the last contact time with a beloved one."""
        conn = get_db_connection()
        result = conn.execute("""
            SELECT last_contact FROM beloved WHERE id = ?
        """, (beloved_id,)).fetchone()
        conn.close()
        
        if result and result['last_contact']:
            return datetime.fromisoformat(result['last_contact'])
        return None
    
    @staticmethod
    def get_days_since_contact(beloved_id: int) -> int:
        """Calculate days since last contact with a beloved one."""
        last_contact = ReminderSystem.get_last_contact(beloved_id)
        if not last_contact:
            return 999  # Large number if no contact ever
        
        delta = datetime.now() - last_contact
        return delta.days
    
    @staticmethod
    def generate_reminders(user_id: int) -> List[Dict]:
        """
        Generate all applicable reminders for a user based on activity analysis.
        Returns a list of reminder objects.
        """
        conn = get_db_connection()
        reminders_generated = []
        
        # Get all beloved ones for this user
        beloved_list = conn.execute("""
            SELECT id, name, relation, last_contact FROM beloved WHERE user_id = ?
        """, (user_id,)).fetchall()
        
        for person in beloved_list:
            try:
                beloved_id = person['id']
                beloved_name = person['name']
                relation = person['relation']
                last_contact = person['last_contact']
                
                # 1. NO CONTACT REMINDER
                if last_contact:
                    # Handle both ISO with T and SQLite space format
                    lc_str = str(last_contact).replace(' ', 'T') if ' ' in str(last_contact) else str(last_contact)
                    try:
                        last_contact_dt = datetime.fromisoformat(lc_str)
                        days_since = (datetime.now() - last_contact_dt).days
                    except (ValueError, TypeError):
                        days_since = 999
                else:
                    days_since = 999
                
                if days_since >= ReminderSystem.NO_CONTACT_THRESHOLD:
                    message = ReminderSystem._generate_no_contact_reminder(
                        beloved_name, relation, days_since
                    )
                    reminders_generated.append({
                        'user_id': user_id,
                        'beloved_id': beloved_id,
                        'reminder_type': 'no_contact',
                        'message': message,
                        'due_date': datetime.now().isoformat()
                    })
                
                # 2. MEMORY ANNIVERSARY REMINDERS
                memory_reminders = ReminderSystem._check_memory_anniversaries(
                    user_id, beloved_id, beloved_name
                )
                reminders_generated.extend(memory_reminders)
                
                # 3. CONTACT PATTERN REMINDERS
                pattern_reminder = ReminderSystem._check_contact_patterns(
                    user_id, beloved_id, beloved_name, relation
                )
                if pattern_reminder:
                    reminders_generated.append(pattern_reminder)
            except Exception as e:
                print(f"Error generating reminders for beloved {person.get('id')}: {e}")
                continue
        
        conn.close()
        
        # Store reminders that don't already exist
        ReminderSystem._store_new_reminders(user_id, reminders_generated)
        
        return reminders_generated
    
    @staticmethod
    def _generate_no_contact_reminder(name: str, relation: str, days: int) -> str:
        """Generate AI-friendly reminder message for lack of contact."""
        if relation:
            relation = relation.lower()
            subject = f"your {relation}"
        else:
            subject = name
        
        if days < 14:
            return f"You haven't contacted {subject} in {days} days. Consider reaching out to {name}! 💌"
        elif days < 30:
            return f"It's been {days} days since you last contacted {subject}. Time for a catch-up? 📞"
        elif days < 60:
            return f"{name} (your {relation}) might miss hearing from you—it's been {days} days! 💝"
        else:
            return f"It's been {days} days! Time to reconnect with {subject}? 💭"
    
    @staticmethod
    def _check_memory_anniversaries(
        user_id: int, beloved_id: int, beloved_name: str
    ) -> List[Dict]:
        """Check for memory anniversaries and generate reminders."""
        conn = get_db_connection()
        reminders = []
        
        # Check memories created with this beloved one
        memories = conn.execute("""
            SELECT id, title, content, created_at FROM memories 
            WHERE user_id = ? AND (shared_with = ? OR id IN (
                SELECT id FROM memories WHERE shared_with = (
                    SELECT email FROM beloved WHERE id = ?
                )
            ))
        """, (user_id, beloved_name, beloved_id)).fetchall()
        
        now = datetime.now()
        
        for memory in memories:
            if memory['created_at']:
                created_dt = datetime.fromisoformat(memory['created_at'])
                # Check for 1-year anniversary
                anniversary_dt = created_dt.replace(year=now.year)
                
                days_until = (anniversary_dt - now).days
                
                # Remind within 3 days before or after anniversary
                if -3 <= days_until <= 3 and days_until != 0:
                    if days_until == 0:
                        msg = f"🎂 Anniversary of memory with {beloved_name}: '{memory['title']}'"
                    elif days_until > 0:
                        msg = f"📅 In {days_until} day(s), it'll be the anniversary of: '{memory['title']}'"
                    else:
                        msg = f"📅 {abs(days_until)} day(s) ago marked the anniversary of: '{memory['title']}'"
                    
                    reminders.append({
                        'user_id': user_id,
                        'beloved_id': beloved_id,
                        'reminder_type': 'memory_anniversary',
                        'message': msg,
                        'due_date': anniversary_dt.isoformat()
                    })
        
        conn.close()
        return reminders
    
    @staticmethod
    def _check_contact_patterns(
        user_id: int, beloved_id: int, beloved_name: str, relation: str
    ) -> Optional[Dict]:
        """Analyze contact patterns and suggest based on frequency."""
        conn = get_db_connection()
        
        # Get contact frequency over last 30 days
        thirty_days_ago = (datetime.now() - timedelta(days=30)).isoformat()
        
        activity_count = conn.execute("""
            SELECT COUNT(*) as count FROM activity_log 
            WHERE user_id = ? AND beloved_id = ? AND timestamp > ?
        """, (user_id, beloved_id, thirty_days_ago)).fetchone()
        
        contact_count = activity_count['count'] if activity_count else 0
        conn.close()
        
        # If no contacts in 30 days compared to historical pattern, remind
        if contact_count == 0:
            return {
                'user_id': user_id,
                'beloved_id': beloved_id,
                'reminder_type': 'contact_pattern',
                'message': f"It seems you've had less contact with {beloved_name} lately. Break the pattern? 💫",
                'due_date': datetime.now().isoformat()
            }
        
        return None
    
    @staticmethod
    def _store_new_reminders(user_id: int, reminders: List[Dict]) -> None:
        """Store new reminders in database, avoiding duplicates."""
        if not reminders:
            return
        
        conn = get_db_connection()
        cur = conn.cursor()
        
        for reminder in reminders:
            # Check if similar reminder already exists
            existing = cur.execute("""
                SELECT id FROM reminders
                WHERE user_id = ? AND beloved_id = ? 
                  AND reminder_type = ? AND is_dismissed = 0
                  AND DATE(created_at) = DATE('now')
            """, (
                reminder['user_id'],
                reminder['beloved_id'],
                reminder['reminder_type']
            )).fetchone()
            
            # Only store if not already created today
            if not existing:
                cur.execute("""
                    INSERT INTO reminders 
                    (user_id, beloved_id, reminder_type, message, due_date, is_read, is_dismissed)
                    VALUES (?, ?, ?, ?, ?, 0, 0)
                """, (
                    reminder['user_id'],
                    reminder['beloved_id'],
                    reminder['reminder_type'],
                    reminder['message'],
                    reminder['due_date']
                ))
        
        conn.commit()
        conn.close()
    
    @staticmethod
    def get_pending_reminders(user_id: int) -> List[Dict]:
        """Get all pending (unread, not dismissed) reminders for a user."""
        conn = get_db_connection()
        
        reminders = conn.execute("""
            SELECT r.*, b.name as beloved_name, b.relation
            FROM reminders r
            LEFT JOIN beloved b ON r.beloved_id = b.id
            WHERE r.user_id = ? AND r.is_dismissed = 0
            ORDER BY r.created_at DESC
        """, (user_id,)).fetchall()
        
        conn.close()
        return [dict(r) for r in reminders]
    
    @staticmethod
    def mark_reminder_read(reminder_id: int, user_id: int) -> bool:
        """Mark a reminder as read."""
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute("""
            UPDATE reminders SET is_read = 1
            WHERE id = ? AND user_id = ?
        """, (reminder_id, user_id))
        
        success = cur.rowcount > 0
        conn.commit()
        conn.close()
        
        return success
    
    @staticmethod
    def dismiss_reminder(reminder_id: int, user_id: int) -> bool:
        """Dismiss a reminder."""
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute("""
            UPDATE reminders SET is_dismissed = 1
            WHERE id = ? AND user_id = ?
        """, (reminder_id, user_id))
        
        success = cur.rowcount > 0
        conn.commit()
        conn.close()
        
        return success
    
    @staticmethod
    def get_activity_stats(user_id: int, beloved_id: Optional[int] = None) -> Dict:
        """Get activity statistics for a user or specific beloved one."""
        conn = get_db_connection()
        
        query = """
            SELECT 
                COUNT(*) as total_activities,
                activity_type,
                MAX(timestamp) as last_activity
            FROM activity_log 
            WHERE user_id = ?
        """
        params = [user_id]
        
        if beloved_id:
            query += " AND beloved_id = ?"
            params.append(beloved_id)
        
        query += " GROUP BY activity_type"
        
        stats = conn.execute(query, params).fetchall()
        conn.close()
        
        return [dict(s) for s in stats]
