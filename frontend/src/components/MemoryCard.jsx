import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, Edit2, Sparkles } from 'lucide-react';

const MemoryCard = ({ memory, index }) => {
  const [isLiked, setIsLiked] = useState(false);
  const [showHeart, setShowHeart] = useState(false);

  const handleLike = () => {
    setIsLiked(!isLiked);
    if (!isLiked) {
      setShowHeart(true);
      setTimeout(() => setShowHeart(false), 800);
    }
  };

  return (
    <motion.div
      className="memory-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ y: -6 }}
    >
      <motion.div 
        className="memory-card-glow"
        initial={{ opacity: 0 }}
        whileHover={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      />
      
      <span className="memory-date">{memory.date}</span>
      <h3 className="memory-title">{memory.title}</h3>
      <p className="memory-content">{memory.content}</p>
      {memory.shared_with && (
        <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--primary-color)', fontWeight: '600' }}>
          Shared with: {memory.shared_with}
        </div>
      )}

      <div className="memory-actions">
        <motion.button 
          className={`action-btn ${isLiked ? 'liked' : ''}`}
          onClick={handleLike}
          whileTap={{ scale: 0.85 }}
        >
          <motion.span
            animate={isLiked ? { scale: [1, 1.3, 1] } : {}}
            transition={{ duration: 0.3 }}
          >
            <Heart 
              size={18} 
              fill={isLiked ? "currentColor" : "none"}
            />
          </motion.span>
          {isLiked && (
            <motion.span 
              className="floating-heart"
              initial={{ opacity: 1, y: 0 }}
              animate={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.8 }}
            >
              <Sparkles size={14} />
            </motion.span>
          )}
        </motion.button>
        
        <button className="action-btn">
          <Edit2 size={18} />
        </button>
      </div>

      {showHeart && (
        <motion.div 
          className="heart-burst"
          initial={{ scale: 0, opacity: 1 }}
          animate={{ scale: 1.5, opacity: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Sparkles size={24} />
        </motion.div>
      )}
    </motion.div>
  );
};

export default MemoryCard;
