import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, FileText, User, Heart, Trash2, PenLine } from 'lucide-react';

const API_URL = 'http://127.0.0.1:8000/api';

const CATEGORIES = [
  { id: 'me', label: 'About Me', icon: User, color: 'var(--accent-burgundy)' },
  { id: 'beloved', label: 'About Them', icon: Heart, color: 'var(--accent-burgundy)' },
  { id: 'shared', label: 'Our Story', icon: FileText, color: 'var(--accent-burgundy)' },
];

const Notes = () => {
  const [notes, setNotes] = useState([]);
  const [activeCategory, setActiveCategory] = useState('me');
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isFocused, setIsFocused] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch(`${API_URL}/notes`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setNotes(Array.isArray(data) ? data : []))
      .catch(err => console.error('Failed to fetch notes:', err));
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    console.log('Sending note:', { title, content, category: activeCategory });
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/notes`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title, content, category: activeCategory }),
      });
      console.log('Response status:', res.status);
      if (res.ok) {
        const newNote = await res.json();
        console.log('Note added successfully:', newNote);
        setNotes([newNote, ...notes]);
        setTitle('');
        setContent('');
        setIsAdding(false);
      } else {
        const errTxt = await res.text();
        console.error('Failed to add note:', errTxt);
        alert('Failed to add note: ' + errTxt);
      }
    } catch (err) {
      console.error('Error adding note:', err);
      alert('Error adding note: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/notes/${id}`, { 
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
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
        <h2 className="section-title">Notes & Details</h2>
        <p className="section-subtitle">Your private space to capture thoughts about yourself, your beloved, and your journey together.</p>

        {/* Category Tabs */}
        <div className="notes-tabs">
          {CATEGORIES.map(cat => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                className={`notes-tab ${activeCategory === cat.id ? 'active' : ''}`}
                onClick={() => setActiveCategory(cat.id)}
              >
                <Icon size={16} />
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Add Note toggle */}
        <AnimatePresence mode="wait">
          {!isAdding ? (
            <motion.button
              className="btn-primary add-note-btn"
              onClick={() => setIsAdding(true)}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
            >
              <Plus size={18} />
              Add Note to "{activeCat?.label}"
            </motion.button>
          ) : (
            <motion.div
              className="note-form"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div className="form-header">
                <div className="form-icon">
                  <PenLine size={20} />
                </div>
                <div>
                  <h3>Add a Note</h3>
                  <p>Capture your thoughts with love</p>
                </div>
              </div>
              
              <form onSubmit={handleAdd}>
                <div className="form-group">
                  <label htmlFor="note-title">
                    <PenLine size={12} />
                    Note Title
                  </label>
                  <input 
                    type="text" 
                    id="note-title"
                    className="input"
                    placeholder="e.g., Her favourite things..." 
                    value={title} 
                    onChange={e => setTitle(e.target.value)}
                    onFocus={() => setIsFocused('title')}
                    onBlur={() => setIsFocused(null)}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="note-content">
                    <PenLine size={12} />
                    Details
                  </label>
                  <textarea 
                    id="note-content"
                    className="input"
                    placeholder="Write anything you want to remember..." 
                    value={content} 
                    onChange={e => setContent(e.target.value)}
                    onFocus={() => setIsFocused('content')}
                    onBlur={() => setIsFocused(null)}
                  />
                </div>
                <div className="form-actions">
                  <motion.button 
                    type="submit" 
                    className="btn-primary"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Plus size={16} />
                    Save Note
                  </motion.button>
                  <button 
                    type="button" 
                    className="btn-cancel"
                    onClick={() => setIsAdding(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Notes Grid */}
        <div className="memories-grid">
          {filtered.map((note, i) => (
            <motion.div
              key={note.id}
              className="memory-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              whileHover={{ y: -4 }}
            >
              <div className="note-header">
                <div>
                  <span className="memory-date">{note.date}</span>
                  <h3 className="memory-title">{note.title}</h3>
                </div>
                <button
                  className="delete-btn"
                  onClick={() => handleDelete(note.id)}
                  title="Delete note"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <p className="memory-content">{note.content}</p>
            </motion.div>
          ))}
          {filtered.length === 0 && (
            <div className="empty-state">
              <div className="empty-state-icon">📝</div>
              <p>No notes yet in "{activeCat?.label}".<br/>Add one above to capture your thoughts.</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default Notes;
