import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Heart, Mail } from 'lucide-react';

const SendLoveModal = ({ isOpen, onClose, onSend, initialEmail = '' }) => {
  const [email, setEmail] = useState(initialEmail);
  const [content, setContent] = useState('');
  const [isFocused, setIsFocused] = useState(null);
  const [isSent, setIsSent] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setEmail(initialEmail || '');
    }
  }, [isOpen, initialEmail]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email || !content) return;
    
    onSend({ email, content, type: 'message' });
    
    setEmail('');
    setContent('');
    setIsSent(true);
    setTimeout(() => {
      setIsSent(false);
      onClose();
    }, 1500);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="modal-backdrop" onClick={onClose}>
        <motion.div 
          className="modal-content"
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          onClick={(e) => e.stopPropagation()}
        >
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
          
          <AnimatePresence>
            {isSent ? (
              <motion.div 
                className="sent-animation"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
              >
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.5, repeat: 2 }}
                >
                  <Heart size={48} fill="var(--accent-rose)" />
                </motion.div>
                <h3>Sent with Love</h3>
                <p>Your heart reaches them now</p>
              </motion.div>
            ) : (
              <motion.div>
                <div className="modal-header">
                  <div className="modal-icon">
                    <Heart size={24} />
                  </div>
                  <div>
                    <h2>Send to Beloved</h2>
                    <p>Share your heart across the distance</p>
                  </div>
                </div>
                
                <form onSubmit={handleSubmit}>
                  <div className="form-group">
                    <label htmlFor="email">
                      <Mail size={12} />
                      Their Email Address
                    </label>
                    <input 
                      type="email" 
                      id="email"
                      className="input"
                      placeholder="their@email.com" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onFocus={() => setIsFocused('email')}
                      onBlur={() => setIsFocused(null)}
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="content">
                      <Heart size={12} />
                      Your Message
                    </label>
                    <textarea 
                      id="content"
                      className="input"
                      placeholder="I was just thinking about you..."
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      onFocus={() => setIsFocused('content')}
                      onBlur={() => setIsFocused(null)}
                      required
                    />
                  </div>
                  
                  <motion.button 
                    type="submit" 
                    className="btn-primary send-btn"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Send size={18} />
                    Send with Love
                  </motion.button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default SendLoveModal;
