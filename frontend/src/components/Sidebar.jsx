import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, BookOpen, FileText, Send, Users, Clock } from 'lucide-react';

const menuItems = [
  { id: 'memories', label: 'Memories', icon: Heart },
  { id: 'timeline', label: 'Memory Timeline', icon: Clock },
  { id: 'notes', label: 'My Notes', icon: FileText },
  { id: 'beloved', label: 'Beloved Ones', icon: Users },
  { id: 'invitations', label: 'Sent Invitations', icon: Send },
];


const Sidebar = ({ isOpen, onClose, activeView, onNavigate }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="sidebar-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Sidebar Panel */}
          <motion.aside
            className="sidebar glass"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          >
            <div className="sidebar-header">
              <div className="sidebar-logo">
                <BookOpen size={20} color="var(--primary-color)" />
                <span>Navigation</span>
              </div>
              <button className="btn-icon" style={{ width: 36, height: 36 }} onClick={onClose}>
                <X size={18} />
              </button>
            </div>

            <nav className="sidebar-nav">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <motion.button
                    key={item.id}
                    className={`sidebar-nav-item ${activeView === item.id ? 'active' : ''}`}
                    whileHover={{ x: 4 }}
                    onClick={() => { onNavigate(item.id); onClose(); }}
                  >
                    <Icon size={20} />
                    <span>{item.label}</span>
                  </motion.button>
                );
              })}
            </nav>

            <div className="sidebar-footer">
              <p style={{ fontSize: '0.8rem', opacity: 0.5 }}>Beloved Connect v1.0</p>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};

export default Sidebar; 
