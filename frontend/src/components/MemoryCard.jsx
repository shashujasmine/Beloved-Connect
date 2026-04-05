import React from 'react';
import { motion } from 'framer-motion';
import { Heart, Edit2 } from 'lucide-react';

const MemoryCard = ({ memory, index }) => {
  return (
    <motion.div 
      className="memory-card glass"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      <span className="memory-date">{memory.date}</span>
      <h3 className="memory-title">{memory.title}</h3>
      <p className="memory-content">{memory.content}</p>
      
      <div className="memory-actions">
        <button className="btn-icon" style={{ width: '36px', height: '36px', background: 'transparent', border: 'none' }}>
          <Heart size={18} />
        </button>
        <button className="btn-icon" style={{ width: '36px', height: '36px', background: 'transparent', border: 'none' }}>
          <Edit2 size={18} />
        </button>
      </div>
    </motion.div>
  );
};

export default MemoryCard;
