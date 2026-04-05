import React from 'react';
import { Phone, MessageCircle, Video } from 'lucide-react';
import { motion } from 'framer-motion';

const QuickReach = ({ onOpenModal }) => {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      className="quick-reach"
      variants={container}
      initial="hidden"
      animate="show"
    >
      <motion.div className="quick-reach-item" variants={item}>
        <div className="quick-reach-tooltip">Voice Call</div>
        <button className="btn-icon">
          <Phone size={20} />
        </button>
      </motion.div>
      
      <motion.div className="quick-reach-item" variants={item}>
        <div className="quick-reach-tooltip">Video Call</div>
        <button className="btn-icon" style={{ background: 'linear-gradient(135deg, var(--secondary-color), #818cf8)', color: 'white' }}>
          <Video size={20} />
        </button>
      </motion.div>
      
      <motion.div className="quick-reach-item" variants={item}>
        <div className="quick-reach-tooltip">Send to Beloved</div>
        <button 
          className="btn-icon" 
          style={{ background: 'linear-gradient(135deg, var(--primary-color), var(--primary-dark))', color: 'white' }}
          onClick={onOpenModal}
        >
          <MessageCircle size={20} />
        </button>
      </motion.div>
    </motion.div>
  );
};

export default QuickReach;
