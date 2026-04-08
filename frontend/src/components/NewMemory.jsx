import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Sparkles, PenLine } from 'lucide-react';

const NewMemory = ({ onAddMemory }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isFocused, setIsFocused] = useState(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

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
    setIsSubmitted(true);
    setTimeout(() => setIsSubmitted(false), 2000);
  };

  return (
    <motion.div
      className="new-memory-form"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      <div className="form-header">
        <div className="form-icon">
          <PenLine size={20} />
        </div>
        <div>
          <h2>Record a New Memory</h2>
          <p>Capture a moment, capture their essence</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <motion.div
          className={`form-group ${isFocused === 'title' ? 'focused' : ''}`}
          animate={{ scale: isFocused === 'title' ? 1.01 : 1 }}
          transition={{ duration: 0.2 }}
        >
          <label htmlFor="title">
            <Heart size={12} />
            What reminded you of them?
          </label>
          <input
            type="text"
            id="title"
            className="input"
            placeholder="A song, their favorite coffee, a shared laugh..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onFocus={() => setIsFocused('title')}
            onBlur={() => setIsFocused(null)}
          />
          <motion.span
            className="input-accent"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: isFocused === 'title' ? 1 : 0 }}
            transition={{ duration: 0.3 }}
          />
        </motion.div>

        <motion.div
          className={`form-group ${isFocused === 'content' ? 'focused' : ''}`}
          animate={{ scale: isFocused === 'content' ? 1.01 : 1 }}
          transition={{ duration: 0.2 }}
        >
          <label htmlFor="content">
            <Sparkles size={12} />
            Your thoughts or message
          </label>
          <textarea
            id="content"
            className="input"
            placeholder="Write down your feelings, what you want to tell them..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onFocus={() => setIsFocused('content')}
            onBlur={() => setIsFocused(null)}
          />
          <motion.span
            className="input-accent"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: isFocused === 'content' ? 1 : 0 }}
            transition={{ duration: 0.3 }}
          />
        </motion.div>

        <div className="form-actions">
          <motion.button
            type="submit"
            className="btn-primary"
            disabled={!title.trim() || !content.trim()}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Heart size={16} fill="currentColor" />
            Save Memory
          </motion.button>
        </div>
      </form>

      <AnimatePresence>
        {isSubmitted && (
          <motion.div
            className="submit-success"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Sparkles size={16} />
            Memory saved with love
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default NewMemory;
