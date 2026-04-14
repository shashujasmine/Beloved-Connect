import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Check, Calendar, Heart, Activity } from 'lucide-react';
import '../styles/ReminderNotifications.css';

const ReminderNotifications = ({ token, API_URL }) => {
  const [reminders, setReminders] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Fetch reminders on component mount and periodically
  useEffect(() => {
    if (!token) return;
    
    fetchReminders();
    
    // Check for new reminders every 5 minutes
    const interval = setInterval(() => {
      fetchReminders();
      generateNewReminders();
    }, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [token]);

  const fetchReminders = async () => {
    try {
      const response = await fetch(`${API_URL}/reminders`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch reminders');
      
      const data = await response.json();
      setReminders(data);
      
      // Count unread reminders
      const unread = data.filter(r => r.is_read === 0).length;
      setUnreadCount(unread);
    } catch (err) {
      console.error('Error fetching reminders:', err);
    }
  };

  const generateNewReminders = async () => {
    try {
      await fetch(`${API_URL}/reminders/generate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Re-fetch after generation
      fetchReminders();
    } catch (err) {
      console.error('Error generating reminders:', err);
    }
  };

  const dismissReminder = async (reminderId) => {
    try {
      await fetch(`${API_URL}/reminders/${reminderId}/dismiss`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      setReminders(reminders.filter(r => r.id !== reminderId));
      setUnreadCount(Math.max(0, unreadCount - 1));
    } catch (err) {
      console.error('Error dismissing reminder:', err);
    }
  };

  const markAsRead = async (reminderId) => {
    try {
      await fetch(`${API_URL}/reminders/${reminderId}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      setReminders(reminders.map(r => 
        r.id === reminderId ? { ...r, is_read: 1 } : r
      ));
      setUnreadCount(Math.max(0, unreadCount - 1));
    } catch (err) {
      console.error('Error marking reminder as read:', err);
    }
  };

  const getReminderIcon = (reminderType) => {
    switch (reminderType) {
      case 'memory_anniversary':
        return <Calendar className="w-5 h-5" />;
      case 'no_contact':
        return <Heart className="w-5 h-5" />;
      case 'contact_pattern':
        return <Activity className="w-5 h-5" />;
      default:
        return <Bell className="w-5 h-5" />;
    }
  };

  const getReminderColor = (reminderType) => {
    switch (reminderType) {
      case 'memory_anniversary':
        return 'reminder-memory';
      case 'no_contact':
        return 'reminder-contact';
      case 'contact_pattern':
        return 'reminder-pattern';
      default:
        return 'reminder-default';
    }
  };

  return (
    <div className="reminder-notifications">
      {/* Bell Icon with Badge */}
      <motion.button
        className="reminder-bell"
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        aria-label="View reminders"
      >
        <Bell size={24} />
        {unreadCount > 0 && (
          <motion.span
            className="reminder-badge"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
          >
            {unreadCount}
          </motion.span>
        )}
      </motion.button>

      {/* Reminder Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="reminder-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
            />

            {/* Panel */}
            <motion.div
              className="reminder-panel"
              initial={{ opacity: 0, y: -10, x: 20 }}
              animate={{ opacity: 1, y: 0, x: 0 }}
              exit={{ opacity: 0, y: -10, x: 20 }}
              transition={{ duration: 0.2 }}
            >
              <div className="reminder-header">
                <h2>Reminders</h2>
                <motion.button
                  onClick={() => setIsOpen(false)}
                  whileHover={{ rotate: 90 }}
                  whileTap={{ scale: 0.8 }}
                >
                  <X size={20} />
                </motion.button>
              </div>

              <div className="reminder-list">
                {reminders.length === 0 ? (
                  <div className="reminder-empty">
                    <Bell size={32} opacity={0.3} />
                    <p>No reminders right now</p>
                    <small>Your beloved ones are all caught up!</small>
                  </div>
                ) : (
                  <AnimatePresence>
                    {reminders.map((reminder) => (
                      <motion.div
                        key={reminder.id}
                        className={`reminder-item ${getReminderColor(reminder.reminder_type)} ${
                          reminder.is_read === 1 ? 'read' : 'unread'
                        }`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className="reminder-type">
                          {getReminderIcon(reminder.reminder_type)}
                        </div>

                        <div className="reminder-content">
                          <p className="reminder-message">{reminder.message}</p>
                          {reminder.beloved_name && (
                            <small className="reminder-person">
                              About {reminder.beloved_name}
                            </small>
                          )}
                        </div>

                        <div className="reminder-actions">
                          {reminder.is_read === 0 && (
                            <motion.button
                              className="action-btn read-btn"
                              onClick={() => markAsRead(reminder.id)}
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.95 }}
                              title="Mark as read"
                            >
                              <Check size={16} />
                            </motion.button>
                          )}
                          <motion.button
                            className="action-btn dismiss-btn"
                            onClick={() => dismissReminder(reminder.id)}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            title="Dismiss"
                          >
                            <X size={16} />
                          </motion.button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}
              </div>

              <div className="reminder-footer">
                <small>Last updated: {new Date().toLocaleTimeString()}</small>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ReminderNotifications;
