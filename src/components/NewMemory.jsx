import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { PlusCircle } from 'lucide-react';

const NewMemory = ({ onAddMemory }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    
    onAddMemory({
      id: Date.now(),
      title,
      content,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    });
    
    setTitle('');
    setContent('');
  };

  return (
    <motion.div 
      className="new-memory-form glass"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      <h2 style={{ marginBottom: '1.5rem', fontFamily: 'Outfit, sans-serif', fontWeight: 600 }}>Record a New Memory</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="title">What reminded you of them?</label>
          <input 
            type="text" 
            id="title" 
            className="form-control" 
            placeholder="e.g., A song on the radio, their favorite coffee..." 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label htmlFor="content">Your thoughts or message</label>
          <textarea 
            id="content" 
            className="form-control" 
            placeholder="Writedown your feelings or what you want to tell them..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
          ></textarea>
        </div>
        <button type="submit" className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <PlusCircle size={18} />
          Save Memory
        </button>
      </form>
    </motion.div>
  );
};

export default NewMemory;
