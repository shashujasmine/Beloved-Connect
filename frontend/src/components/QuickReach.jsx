import React from 'react';
import { Phone, Video, Heart } from 'lucide-react';
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
        <div className="quick-reach-tooltip">Send Love</div>
        <motion.button 
          className="quick-btn love-btn"
          onClick={onOpenModal}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <Heart size={22} fill="#fff" color="#fff" />
        </motion.button>
      </motion.div>
    </motion.div>
  );
};

export default QuickReach;
