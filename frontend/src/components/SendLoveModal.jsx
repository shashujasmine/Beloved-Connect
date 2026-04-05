import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Music, MessageSquare } from 'lucide-react';

const SendLoveModal = ({ isOpen, onClose, onSend }) => {
  const [mobile, setMobile] = useState('');
  const [type, setType] = useState('message'); // 'message' or 'song'
  const [content, setContent] = useState('');
  
  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!mobile || !content) return;
    
    onSend({ mobile, type, content });
    
    // Reset state after sending
    setMobile('');
    setContent('');
    setType('message');
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="modal-backdrop" onClick={onClose}>
        <motion.div 
          className="modal-content glass"
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          onClick={(e) => e.stopPropagation()}
        >
          <button className="close-btn btn-icon" style={{ position: 'absolute', top: '1rem', right: '1rem', width: '36px', height: '36px' }} onClick={onClose}>
            <X size={18} />
          </button>
          
          <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Send size={24} color="var(--primary-color)" />
            Send to Beloved
          </h2>
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Their Mobile Number</label>
              <input 
                type="tel" 
                className="form-control" 
                placeholder="+1 234 567 8900" 
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                required
              />
            </div>
            
            <div className="form-group">
              <label>What would you like to pass on?</label>
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                <button 
                  type="button"
                  onClick={() => setType('message')}
                  style={{ 
                    flex: 1, 
                    padding: '0.75rem', 
                    borderRadius: '12px',
                    border: `2px solid ${type === 'message' ? 'var(--primary-color)' : 'var(--glass-border)'}`,
                    background: type === 'message' ? 'var(--glass-bg)' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    color: type === 'message' ? 'var(--primary-dark)' : 'var(--text-main)',
                    fontWeight: 600
                  }}
                >
                  <MessageSquare size={18} /> A Message
                </button>
                <button 
                  type="button"
                  onClick={() => setType('song')}
                  style={{ 
                    flex: 1, 
                    padding: '0.75rem', 
                    borderRadius: '12px',
                    border: `2px solid ${type === 'song' ? 'var(--secondary-color)' : 'var(--glass-border)'}`,
                    background: type === 'song' ? 'var(--glass-bg)' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    color: type === 'song' ? 'var(--secondary-color)' : 'var(--text-main)',
                    fontWeight: 600
                  }}
                >
                  <Music size={18} /> A Song
                </button>
              </div>
            </div>
            
            <div className="form-group">
              <label>{type === 'message' ? 'Your Message' : 'Song Name & Artist'}</label>
              {type === 'message' ? (
                <textarea 
                  className="form-control" 
                  placeholder="I was just thinking about you..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  required
                ></textarea>
              ) : (
                <input 
                  type="text"
                  className="form-control" 
                  placeholder="e.g., Perfect by Ed Sheeran"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  required
                />
              )}
            </div>
            
            <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              <Send size={18} /> Send Invitation
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default SendLoveModal;
