import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Phone, Mail, Trash2, Heart, User } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

const BelovedOnes = () => {
  const [people, setPeople] = useState([]);
  const [isAdding, setIsAdding] = useState(false);
  const [form, setForm] = useState({ name: '', relation: '', mobile: '', email: '', notes: '' });
  const [isFocused, setIsFocused] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch(`${API_URL}/beloved`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setPeople(Array.isArray(data) ? data : []))
      .catch(err => console.error('Failed to fetch beloved ones:', err));
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/beloved`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        const newPerson = await res.json();
        setPeople([newPerson, ...people]);
        setForm({ name: '', relation: '', mobile: '', email: '', notes: '' });
        setIsAdding(false);
      }
    } catch (err) {
      console.error('Error adding person:', err);
    }
  };

  const handleDelete = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/beloved/${id}`, { 
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setPeople(people.filter(p => p.id !== id));
    } catch (err) {
      console.error('Error deleting:', err);
    }
  };

  return (
    <div className="container notes-page">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="section-title">Beloved Ones</h2>
        <p className="section-subtitle">The souls who make your heart fuller</p>

        {!isAdding ? (
          <motion.button
            className="btn-primary add-btn"
            onClick={() => setIsAdding(true)}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
          >
            <Plus size={18} />
            Add Someone Special
          </motion.button>
        ) : (
          <motion.div
            className="beloved-form"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="form-header">
              <div className="form-icon">
                <Heart size={20} />
              </div>
              <div>
                <h3>Add to Your Heart</h3>
                <p>Store the details of someone precious</p>
              </div>
            </div>
            
            <form onSubmit={handleAdd}>
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="name">
                    <User size={12} />
                    Full Name
                  </label>
                  <input 
                    type="text" 
                    id="name"
                    name="name" 
                    className="input"
                    placeholder="e.g., Sarah" 
                    value={form.name} 
                    onChange={handleChange}
                    onFocus={() => setIsFocused('name')}
                    onBlur={() => setIsFocused(null)}
                    required 
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="relation">
                    <Heart size={12} />
                    Relation
                  </label>
                  <input 
                    type="text" 
                    id="relation"
                    name="relation" 
                    className="input"
                    placeholder="e.g., Partner, Best friend..." 
                    value={form.relation} 
                    onChange={handleChange}
                    onFocus={() => setIsFocused('relation')}
                    onBlur={() => setIsFocused(null)}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="mobile">
                    <Phone size={12} />
                    Mobile Number
                  </label>
                  <input 
                    type="tel" 
                    id="mobile"
                    name="mobile" 
                    className="input"
                    placeholder="+1 234 567 8900" 
                    value={form.mobile} 
                    onChange={handleChange}
                    onFocus={() => setIsFocused('mobile')}
                    onBlur={() => setIsFocused(null)}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="email">
                    <Mail size={12} />
                    Email
                  </label>
                  <input 
                    type="email" 
                    id="email"
                    name="email" 
                    className="input"
                    placeholder="their@email.com" 
                    value={form.email} 
                    onChange={handleChange}
                    onFocus={() => setIsFocused('email')}
                    onBlur={() => setIsFocused(null)}
                  />
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="notes">
                  <Heart size={12} />
                  Personal Notes
                </label>
                <textarea 
                  name="notes" 
                  id="notes"
                  className="input"
                  placeholder="Their favourite things, what makes them smile..." 
                  value={form.notes} 
                  onChange={handleChange}
                  onFocus={() => setIsFocused('notes')}
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
                  <Heart size={16} />
                  Save to Heart
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

        <AnimatePresence mode="wait">
          <div className="beloved-grid">
            {people.map((person, i) => (
              <motion.div
                key={person.id}
                className="beloved-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                whileHover={{ y: -4 }}
              >
                <div className="beloved-avatar">
                  {person.name.charAt(0).toUpperCase()}
                </div>
                <div className="beloved-info">
                  <div className="beloved-header">
                    <h3 className="beloved-name">{person.name}</h3>
                    <button 
                      className="delete-btn" 
                      onClick={() => handleDelete(person.id)}
                      title="Remove from beloved"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  {person.relation && <span className="beloved-relation">{person.relation}</span>}
                    <div className="beloved-contact">
                    {person.mobile && (
                      <span 
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 500 }}
                      >
                        <Phone size={13} /> {person.mobile}
                      </span>
                    )}
                    {person.email && (
                      <span 
                        onClick={() => {
                          if (window.openSendLoveModal) {
                            window.openSendLoveModal(person.email);
                          }
                        }}
                        style={{ cursor: 'pointer', color: 'var(--accent-warm)', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 500 }}
                        className="contact-link"
                      >
                        <Mail size={13} /> {person.email}
                      </span>
                    )}
                  </div>
                  {person.notes && <p className="beloved-notes">{person.notes}</p>}
                </div>
              </motion.div>
            ))}
            {people.length === 0 && isAdding === false && (
              <div className="empty-state">
                <div className="empty-state-icon">💕</div>
                <p>No beloved ones added yet.<br/>Add someone who holds a piece of your heart.</p>
              </div>
            )}
          </div>
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default BelovedOnes;
