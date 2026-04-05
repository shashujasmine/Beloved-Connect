import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { PlusCircle, FileText, User, Heart, Trash2 } from 'lucide-react';

const API_URL = 'http://127.0.0.1:8000/api';

const CATEGORIES = [
  { id: 'me', label: 'About Me', icon: User, color: 'var(--secondary-color)' },
  { id: 'beloved', label: 'About Them', icon: Heart, color: 'var(--primary-color)' },
  { id: 'shared', label: 'Our Story', icon: FileText, color: '#34d399' },
];

const Notes = () => {
  const [notes, setNotes] = useState([]);
  const [activeCategory, setActiveCategory] = useState('me');
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  useEffect(() => {
    fetch(`${API_URL}/notes`)
      .then(res => res.json())
      .then(data => setNotes(data))
      .catch(err => console.error('Failed to fetch notes:', err));
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    try {
      const res = await fetch(`${API_URL}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content, category: activeCategory }),
      });
      if (res.ok) {
        const newNote = await res.json();
        setNotes([newNote, ...notes]);
        setTitle('');
        setContent('');
        setIsAdding(false);
      }
    } catch (err) {
      console.error('Error adding note:', err);
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`${API_URL}/notes/${id}`, { method: 'DELETE' });
      if (res.ok) setNotes(notes.filter(n => n.id !== id));
    } catch (err) {
      console.error('Error deleting note:', err);
    }
  };

  const filtered = notes.filter(n => n.category === activeCategory);
  const activeCat = CATEGORIES.find(c => c.id === activeCategory);

  return (
    <div className="container notes-page">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="section-title">Notes &amp; Details</h2>
        <p className="section-subtitle">Your private space to capture thoughts about yourself, your beloved, and your journey together.</p>

        {/* Category Tabs */}
        <div className="notes-tabs">
          {CATEGORIES.map(cat => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                className={`notes-tab ${activeCategory === cat.id ? 'active' : ''}`}
                style={{ '--tab-color': cat.color }}
                onClick={() => setActiveCategory(cat.id)}
              >
                <Icon size={16} />
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Add Note toggle */}
        {!isAdding ? (
          <motion.button
            className="btn-primary add-note-btn"
            onClick={() => setIsAdding(true)}
            whileHover={{ scale: 1.03 }}
            style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <PlusCircle size={18} />
            Add Note to "{activeCat?.label}"
          </motion.button>
        ) : (
          <motion.div
            className="glass note-form"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
          >
            <form onSubmit={handleAdd}>
              <div className="form-group">
                <label>Note Title</label>
                <input type="text" className="form-control" placeholder="e.g., Her favourite things..." value={title} onChange={e => setTitle(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Details</label>
                <textarea className="form-control" placeholder="Write anything..." value={content} onChange={e => setContent(e.target.value)} />
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="submit" className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <PlusCircle size={16} /> Save Note
                </button>
                <button type="button" onClick={() => setIsAdding(false)} style={{ color: 'var(--text-muted)', padding: '0.5rem 1rem' }}>
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {/* Notes Grid */}
        <div className="memories-grid">
          {filtered.map((note, i) => (
            <motion.div
              key={note.id}
              className="memory-card glass"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <span className="memory-date">{note.date}</span>
                  <h3 className="memory-title">{note.title}</h3>
                </div>
                <button
                  className="btn-icon"
                  style={{ width: 32, height: 32, flexShrink: 0, color: '#f87171' }}
                  onClick={() => handleDelete(note.id)}
                >
                  <Trash2 size={15} />
                </button>
              </div>
              <p className="memory-content">{note.content}</p>
            </motion.div>
          ))}
          {filtered.length === 0 && (
            <p style={{ gridColumn: '1/-1', textAlign: 'center', color: 'var(--text-muted)', padding: '3rem 0' }}>
              No notes yet in "{activeCat?.label}". Add one above ✨
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default Notes;
