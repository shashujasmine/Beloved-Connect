import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { PlusCircle, Phone, Mail, User, Trash2, Heart } from 'lucide-react';

const API_URL = 'http://127.0.0.1:8000/api';

const BelovedOnes = () => {
  const [people, setPeople] = useState([]);
  const [isAdding, setIsAdding] = useState(false);
  const [form, setForm] = useState({ name: '', relation: '', mobile: '', email: '', notes: '' });

  useEffect(() => {
    fetch(`${API_URL}/beloved`)
      .then(res => res.json())
      .then(data => setPeople(data))
      .catch(err => console.error('Failed to fetch beloved ones:', err));
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    try {
      const res = await fetch(`${API_URL}/beloved`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
      const res = await fetch(`${API_URL}/beloved/${id}`, { method: 'DELETE' });
      if (res.ok) setPeople(people.filter(p => p.id !== id));
    } catch (err) {
      console.error('Error deleting:', err);
    }
  };

  return (
    <div className="container notes-page">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="section-title">Beloved Ones</h2>
        <p className="section-subtitle">Store the details of the people who matter most to you.</p>

        {!isAdding ? (
          <motion.button
            className="btn-primary"
            onClick={() => setIsAdding(true)}
            whileHover={{ scale: 1.03 }}
            style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <PlusCircle size={18} /> Add a Beloved One
          </motion.button>
        ) : (
          <motion.div
            className="glass note-form"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            style={{ marginBottom: '2rem' }}
          >
            <form onSubmit={handleAdd}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Full Name *</label>
                  <input type="text" name="name" className="form-control" placeholder="e.g., Sarah" value={form.name} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label>Relation</label>
                  <input type="text" name="relation" className="form-control" placeholder="e.g., Partner, Best friend..." value={form.relation} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>Mobile Number</label>
                  <input type="tel" name="mobile" className="form-control" placeholder="+1 234 567 8900" value={form.mobile} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input type="email" name="email" className="form-control" placeholder="their@email.com" value={form.email} onChange={handleChange} />
                </div>
              </div>
              <div className="form-group">
                <label>Personal Notes about them</label>
                <textarea name="notes" className="form-control" placeholder="Their favourite things, special dates, what makes them smile..." value={form.notes} onChange={handleChange} />
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="submit" className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Heart size={16} /> Save Person
                </button>
                <button type="button" onClick={() => setIsAdding(false)} style={{ color: 'var(--text-muted)', padding: '0.5rem 1rem' }}>
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        )}

        <div className="beloved-grid">
          {people.map((person, i) => (
            <motion.div
              key={person.id}
              className="beloved-card glass"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <div className="beloved-avatar">
                {person.name.charAt(0).toUpperCase()}
              </div>
              <div className="beloved-info">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ marginBottom: '0.2rem', fontSize: '1.2rem' }}>{person.name}</h3>
                    {person.relation && <span className="beloved-relation">{person.relation}</span>}
                  </div>
                  <button className="btn-icon" style={{ width: 30, height: 30, color: '#f87171', flexShrink: 0 }} onClick={() => handleDelete(person.id)}>
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className="beloved-contact">
                  {person.mobile && <span><Phone size={13} /> {person.mobile}</span>}
                  {person.email && <span><Mail size={13} /> {person.email}</span>}
                </div>
                {person.notes && <p className="memory-content" style={{ marginTop: '0.75rem' }}>{person.notes}</p>}
              </div>
            </motion.div>
          ))}
          {people.length === 0 && (
            <p style={{ gridColumn: '1/-1', textAlign: 'center', color: 'var(--text-muted)', padding: '3rem 0' }}>
              No beloved ones added yet. Add someone special ❤️
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default BelovedOnes;
