import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CalendarClock, Plus, Send, Mail, User, Gift, Clock,
  Trash2, X, Check, AlertCircle, Repeat, ChevronDown,
  Heart, Sparkles, Calendar, Edit3, Ban
} from 'lucide-react';
import '../styles/ScheduledMessages.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

const OCCASION_PRESETS = [
  { value: '', label: 'Custom', emoji: '✨' },
  { value: 'birthday', label: 'Birthday', emoji: '🎂' },
  { value: 'anniversary', label: 'Anniversary', emoji: '💍' },
  { value: 'valentines', label: "Valentine's Day", emoji: '💕' },
  { value: 'mothers_day', label: "Mother's Day", emoji: '🌸' },
  { value: 'fathers_day', label: "Father's Day", emoji: '👔' },
  { value: 'christmas', label: 'Christmas', emoji: '🎄' },
  { value: 'new_year', label: 'New Year', emoji: '🎆' },
  { value: 'thinking_of_you', label: 'Thinking of You', emoji: '💭' },
  { value: 'get_well', label: 'Get Well Soon', emoji: '🌻' },
];

const RECURRENCE_OPTIONS = [
  { value: 'none', label: 'One-time', icon: '📩' },
  { value: 'yearly', label: 'Every year', icon: '🔄' },
  { value: 'monthly', label: 'Every month', icon: '📅' },
  { value: 'weekly', label: 'Every week', icon: '📆' },
];

const STATUS_CONFIG = {
  scheduled: { label: 'Scheduled', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)', icon: Clock },
  sent: { label: 'Delivered', color: '#10b981', bg: 'rgba(16, 185, 129, 0.12)', icon: Check },
  failed: { label: 'Failed', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.12)', icon: AlertCircle },
  cancelled: { label: 'Cancelled', color: '#8b8496', bg: 'rgba(139, 132, 150, 0.12)', icon: Ban },
};

const ScheduledMessages = () => {
  const [messages, setMessages] = useState([]);
  const [beloved, setBeloved] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    recipient_email: '',
    recipient_name: '',
    subject: '',
    content: '',
    scheduled_date: '',
    scheduled_time: '09:00',
    occasion: '',
    recurrence: 'none',
  });

  useEffect(() => {
    fetchMessages();
    fetchBeloved();
  }, []);

  const fetchMessages = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/scheduled-messages`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to fetch scheduled messages:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchBeloved = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/beloved`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setBeloved(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to fetch beloved:', err);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleBelovedSelect = (person) => {
    setForm({
      ...form,
      recipient_email: person.email || '',
      recipient_name: person.name || '',
    });
  };

  const handleOccasionSelect = (occasion) => {
    setForm({
      ...form,
      occasion: occasion.value,
      subject: occasion.value
        ? `Happy ${occasion.label}! 🎉`
        : form.subject,
      recurrence: occasion.value === 'birthday' || occasion.value === 'anniversary'
        ? 'yearly'
        : form.recurrence,
    });
  };

  const resetForm = () => {
    setForm({
      recipient_email: '',
      recipient_name: '',
      subject: '',
      content: '',
      scheduled_date: '',
      scheduled_time: '09:00',
      occasion: '',
      recurrence: 'none',
    });
    setIsCreating(false);
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.recipient_email || !form.content || !form.scheduled_date) return;

    const token = localStorage.getItem('token');
    const url = editingId
      ? `${API_URL}/scheduled-messages/${editingId}`
      : `${API_URL}/scheduled-messages`;

    try {
      const res = await fetch(url, {
        method: editingId ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        fetchMessages();
        resetForm();
      }
    } catch (err) {
      console.error('Error saving scheduled message:', err);
    }
  };

  const handleEdit = (msg) => {
    setForm({
      recipient_email: msg.recipient_email,
      recipient_name: msg.recipient_name || '',
      subject: msg.subject || '',
      content: msg.content,
      scheduled_date: msg.scheduled_date,
      scheduled_time: msg.scheduled_time || '09:00',
      occasion: msg.occasion || '',
      recurrence: msg.recurrence || 'none',
    });
    setEditingId(msg.id);
    setIsCreating(true);
  };

  const handleCancel = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/scheduled-messages/${id}/cancel`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) fetchMessages();
    } catch (err) {
      console.error('Error cancelling:', err);
    }
  };

  const handleDelete = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/scheduled-messages/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) fetchMessages();
    } catch (err) {
      console.error('Error deleting:', err);
    }
  };

  const filteredMessages = useMemo(() => {
    if (filter === 'all') return messages;
    return messages.filter(m => m.status === filter);
  }, [messages, filter]);

  const stats = useMemo(() => {
    const s = { scheduled: 0, sent: 0, failed: 0, cancelled: 0 };
    messages.forEach(m => { if (s[m.status] !== undefined) s[m.status]++; });
    return s;
  }, [messages]);

  const getDaysUntil = (dateStr) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(dateStr + 'T00:00:00');
    const diff = Math.ceil((target - today) / (1000 * 60 * 60 * 24));
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Tomorrow';
    if (diff < 0) return `${Math.abs(diff)}d overdue`;
    if (diff < 7) return `${diff} days`;
    if (diff < 30) return `${Math.floor(diff / 7)}w ${diff % 7}d`;
    return `${Math.floor(diff / 30)}mo`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getOccasionEmoji = (occ) => {
    const found = OCCASION_PRESETS.find(o => o.value === occ);
    return found ? found.emoji : '✨';
  };

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="container notes-page">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>

        {/* Header */}
        <div className="sm-hero">
          <div className="sm-hero-icon">
            <Sparkles size={28} />
          </div>
          <h2 className="section-title">Scheduled Messages</h2>
          <div style={{ color: '#ef4444', fontSize: '0.9rem', marginBottom: '1rem', fontWeight: 'bold' }}>
             ⚠️ The mail sending option is not working properly this time.
          </div>
          <p className="section-subtitle">
            Plan heartfelt messages for birthdays, anniversaries, and every moment that matters.
            They'll be delivered automatically at just the right time.
          </p>
        </div>

        {/* Stats Row */}
        <div className="sm-stats">
          {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
            const Icon = cfg.icon;
            return (
              <motion.button
                key={key}
                className={`sm-stat-chip ${filter === key ? 'active' : ''}`}
                onClick={() => setFilter(f => f === key ? 'all' : key)}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                style={{ '--chip-color': cfg.color, '--chip-bg': cfg.bg }}
              >
                <Icon size={14} />
                <span className="sm-stat-count">{stats[key]}</span>
                <span className="sm-stat-label">{cfg.label}</span>
              </motion.button>
            );
          })}
        </div>

        {/* Create Button */}
        {!isCreating && (
          <motion.button
            className="btn-primary add-btn sm-create-btn"
            onClick={() => setIsCreating(true)}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
          >
            <Plus size={18} />
            Schedule a Message
          </motion.button>
        )}

        {/* Create/Edit Form */}
        <AnimatePresence>
          {isCreating && (
            <motion.div
              className="sm-form-wrapper"
              initial={{ opacity: 0, y: -20, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -20, height: 0 }}
              transition={{ duration: 0.35 }}
            >
              <div className="sm-form glass">
                <div className="form-header">
                  <div className="form-icon" style={{ background: 'linear-gradient(135deg, #f59e0b, #ff6b4a)' }}>
                    <CalendarClock size={22} />
                  </div>
                  <div>
                    <h3>{editingId ? 'Edit Scheduled Message' : 'Schedule a New Message'}</h3>
                    <p>Choose a date and let love arrive on time</p>
                  </div>
                </div>

                <form onSubmit={handleSubmit}>
                  {/* Beloved Quick-Pick */}
                  {beloved.length > 0 && (
                    <div className="sm-beloved-pick">
                      <label className="sm-pick-label">
                        <Heart size={12} /> Quick pick a beloved one
                      </label>
                      <div className="sm-beloved-pills">
                        {beloved.filter(b => b.email).map(b => (
                          <motion.button
                            key={b.id}
                            type="button"
                            className={`sm-beloved-pill ${form.recipient_email === b.email ? 'active' : ''}`}
                            onClick={() => handleBelovedSelect(b)}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <span className="sm-pill-avatar">{b.name.charAt(0).toUpperCase()}</span>
                            {b.name}
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recipient Fields */}
                  <div className="form-grid">
                    <div className="form-group">
                      <label htmlFor="sm-email"><Mail size={12} /> Recipient Email</label>
                      <input
                        id="sm-email"
                        name="recipient_email"
                        type="email"
                        className="input"
                        placeholder="their@email.com"
                        value={form.recipient_email}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="sm-name"><User size={12} /> Recipient Name</label>
                      <input
                        id="sm-name"
                        name="recipient_name"
                        type="text"
                        className="input"
                        placeholder="Their name (optional)"
                        value={form.recipient_name}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  {/* Occasion Selector */}
                  <div className="sm-occasion-section">
                    <label className="sm-pick-label"><Gift size={12} /> What's the occasion?</label>
                    <div className="sm-occasion-grid">
                      {OCCASION_PRESETS.map(occ => (
                        <motion.button
                          key={occ.value}
                          type="button"
                          className={`sm-occasion-chip ${form.occasion === occ.value ? 'active' : ''}`}
                          onClick={() => handleOccasionSelect(occ)}
                          whileHover={{ scale: 1.06, y: -2 }}
                          whileTap={{ scale: 0.94 }}
                        >
                          <span className="sm-occ-emoji">{occ.emoji}</span>
                          <span>{occ.label}</span>
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  {/* Subject */}
                  <div className="form-group">
                    <label htmlFor="sm-subject"><Sparkles size={12} /> Subject Line</label>
                    <input
                      id="sm-subject"
                      name="subject"
                      type="text"
                      className="input"
                      placeholder="Happy Birthday! 🎉"
                      value={form.subject}
                      onChange={handleChange}
                    />
                  </div>

                  {/* Message Content */}
                  <div className="form-group">
                    <label htmlFor="sm-content"><Heart size={12} /> Your Message</label>
                    <textarea
                      id="sm-content"
                      name="content"
                      className="input"
                      placeholder="Write something heartfelt..."
                      value={form.content}
                      onChange={handleChange}
                      required
                      rows={4}
                    />
                  </div>

                  {/* Date / Time / Recurrence Row */}
                  <div className="sm-schedule-row">
                    <div className="form-group">
                      <label htmlFor="sm-date"><Calendar size={12} /> Delivery Date</label>
                      <input
                        id="sm-date"
                        name="scheduled_date"
                        type="date"
                        className="input sm-date-input"
                        value={form.scheduled_date}
                        onChange={handleChange}
                        min={todayStr}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="sm-time"><Clock size={12} /> Time</label>
                      <input
                        id="sm-time"
                        name="scheduled_time"
                        type="time"
                        className="input sm-time-input"
                        value={form.scheduled_time}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="sm-recurrence"><Repeat size={12} /> Repeat</label>
                      <select
                        id="sm-recurrence"
                        name="recurrence"
                        className="input sm-select"
                        value={form.recurrence}
                        onChange={handleChange}
                      >
                        {RECURRENCE_OPTIONS.map(opt => (
                          <option key={opt.value} value={opt.value}>
                            {opt.icon} {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="form-actions">
                    <motion.button
                      type="submit"
                      className="btn-primary"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <CalendarClock size={16} />
                      {editingId ? 'Update Schedule' : 'Schedule Message'}
                    </motion.button>
                    <button type="button" className="btn-cancel" onClick={resetForm}>
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Messages List */}
        <div className="sm-list">
          <AnimatePresence mode="popLayout">
            {filteredMessages.map((msg, i) => {
              const statusCfg = STATUS_CONFIG[msg.status] || STATUS_CONFIG.scheduled;
              const StatusIcon = statusCfg.icon;
              const isUpcoming = msg.status === 'scheduled';
              return (
                <motion.div
                  key={msg.id}
                  className={`sm-card glass ${msg.status}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.05 }}
                  layout
                >
                  {/* Left accent bar */}
                  <div className="sm-card-bar" style={{ background: statusCfg.color }} />

                  <div className="sm-card-body">
                    {/* Top Meta Row */}
                    <div className="sm-card-meta">
                      <span className="sm-occasion-tag">
                        {getOccasionEmoji(msg.occasion)} {msg.occasion || 'Message'}
                      </span>
                      <span className="sm-status-badge" style={{ color: statusCfg.color, background: statusCfg.bg }}>
                        <StatusIcon size={12} />
                        {statusCfg.label}
                      </span>
                      {msg.recurrence && msg.recurrence !== 'none' && (
                        <span className="sm-recurrence-badge">
                          <Repeat size={11} />
                          {RECURRENCE_OPTIONS.find(r => r.value === msg.recurrence)?.label || msg.recurrence}
                        </span>
                      )}
                    </div>

                    {/* Subject */}
                    {msg.subject && <h4 className="sm-card-subject">{msg.subject}</h4>}

                    {/* Content Preview */}
                    <p className="sm-card-content">{msg.content}</p>

                    {/* Delivery Info */}
                    <div className="sm-card-delivery">
                      <div className="sm-delivery-detail">
                        <Mail size={13} />
                        <span>{msg.recipient_name || msg.recipient_email}</span>
                      </div>
                      <div className="sm-delivery-detail">
                        <Calendar size={13} />
                        <span>{formatDate(msg.scheduled_date)}</span>
                        <span className="sm-time-label">at {msg.scheduled_time || '09:00'}</span>
                      </div>
                      {isUpcoming && (
                        <div className="sm-countdown">
                          <Clock size={13} />
                          <span>{getDaysUntil(msg.scheduled_date)}</span>
                        </div>
                      )}
                      {msg.sent_at && (
                        <div className="sm-delivery-detail sent-info">
                          <Check size={13} />
                          <span>Sent {new Date(msg.sent_at).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>

                    {/* Card Actions */}
                    <div className="sm-card-actions">
                      {isUpcoming && (
                        <>
                          <motion.button
                            className="sm-action-btn edit"
                            onClick={() => handleEdit(msg)}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            title="Edit"
                          >
                            <Edit3 size={15} />
                          </motion.button>
                          <motion.button
                            className="sm-action-btn cancel"
                            onClick={() => handleCancel(msg.id)}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            title="Cancel delivery"
                          >
                            <Ban size={15} />
                          </motion.button>
                        </>
                      )}
                      <motion.button
                        className="sm-action-btn delete"
                        onClick={() => handleDelete(msg.id)}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        title="Delete"
                      >
                        <Trash2 size={15} />
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* Empty State */}
          {!loading && filteredMessages.length === 0 && (
            <motion.div
              className="empty-state sm-empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="sm-empty-illustration">
                <CalendarClock size={56} />
              </div>
              <h3>No {filter !== 'all' ? filter : ''} messages yet</h3>
              <p>
                Schedule your first heartfelt message — a birthday wish, an anniversary surprise,
                or just a little reminder that someone is loved.
              </p>
              {!isCreating && (
                <motion.button
                  className="btn-primary"
                  onClick={() => setIsCreating(true)}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  style={{ marginTop: '1.5rem' }}
                >
                  <Plus size={16} /> Schedule Your First Message
                </motion.button>
              )}
            </motion.div>
          )}

          {/* Loading skeleton */}
          {loading && (
            <div className="sm-skeleton-wrap">
              {[1, 2, 3].map(i => (
                <div key={i} className="sm-skeleton glass">
                  <div className="sm-sk-bar" />
                  <div className="sm-sk-body">
                    <div className="sm-sk-line wide" />
                    <div className="sm-sk-line medium" />
                    <div className="sm-sk-line narrow" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default ScheduledMessages;
