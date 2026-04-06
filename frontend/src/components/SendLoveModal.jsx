import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Music, MessageSquare, Heart, Search } from 'lucide-react';

const SONG_LIBRARY = [
  { title: "Perfect", artist: "Ed Sheeran" },
  { title: "All of Me", artist: "John Legend" },
  { title: "Can't Help Falling in Love", artist: "Elvis Presley" },
  { title: "A Thousand Years", artist: "Christina Perri" },
  { title: "Say You Won't Let Go", artist: "James Arthur" },
  { title: "Thinking Out Loud", artist: "Ed Sheeran" },
  { title: "Just the Way You Are", artist: "Bruno Mars" },
  { title: "Everything", artist: "Michael Bublé" },
  { title: "Lover", artist: "Taylor Swift" },
  { title: "Adore You", artist: "Harry Styles" },
  { title: "My Girl", artist: "The Temptations" },
  { title: "Isn't She Lovely", artist: "Stevie Wonder" }
];

const SendLoveModal = ({ isOpen, onClose, onSend, initialMobile = '' }) => {
  const [mobile, setMobile] = useState(initialMobile);
  const [type, setType] = useState('message');
  const [content, setContent] = useState('');
  const [isFocused, setIsFocused] = useState(null);
  const [isSent, setIsSent] = useState(false);
  const [songSearch, setSongSearch] = useState('');

  const filteredSongs = SONG_LIBRARY.filter(song => 
    `${song.title} ${song.artist}`.toLowerCase().includes(content.toLowerCase())
  ).slice(0, 5);

  React.useEffect(() => {
    if (isOpen) {
      setMobile(initialMobile || '');
    }
  }, [isOpen, initialMobile]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!mobile || !content) return;
    
    onSend({ mobile, type, content });
    
    setMobile('');
    setContent('');
    setType('message');
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
                    <label htmlFor="mobile">
                      <Heart size={12} />
                      Their Mobile Number
                    </label>
                    <input 
                      type="tel" 
                      id="mobile"
                      className="input"
                      placeholder="+1 234 567 8900" 
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                      onFocus={() => setIsFocused('mobile')}
                      onBlur={() => setIsFocused(null)}
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>
                      <Heart size={12} />
                      What would you like to send?
                    </label>
                    <div className="type-selector">
                      <button 
                        type="button"
                        className={`type-btn ${type === 'message' ? 'active' : ''}`}
                        onClick={() => setType('message')}
                      >
                        <MessageSquare size={18} />
                        <span>A Message</span>
                      </button>
                      <button 
                        type="button"
                        className={`type-btn ${type === 'song' ? 'active' : ''}`}
                        onClick={() => setType('song')}
                      >
                        <Music size={18} />
                        <span>A Song</span>
                      </button>
                    </div>
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="content">
                      <Heart size={12} />
                      {type === 'message' ? 'Your Message' : 'Song Name & Artist'}
                    </label>
                    {type === 'message' ? (
                      <textarea 
                        id="content"
                        className="input"
                        placeholder="I was just thinking about you..."
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        onFocus={() => setIsFocused('content')}
                        onBlur={() => {
                          setTimeout(() => setIsFocused(null), 200);
                        }}
                        required
                      />
                    ) : (
                      <div className="song-search-container">
                        <input 
                          type="text"
                          id="content-song"
                          className="input"
                          placeholder="Search for a song..."
                          value={content}
                          onChange={(e) => setContent(e.target.value)}
                          onFocus={() => setIsFocused('content')}
                          onBlur={() => {
                            setTimeout(() => setIsFocused(null), 200);
                          }}
                          required
                        />
                        <AnimatePresence>
                          {isFocused === 'content' && content.length > 0 && filteredSongs.length > 0 && (
                            <motion.div 
                              className="song-suggestions glass"
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                            >
                              {filteredSongs.map((song, i) => (
                                <div 
                                  key={i} 
                                  className="song-item"
                                  onClick={() => setContent(`${song.title} - ${song.artist}`)}
                                >
                                  <Music size={14} />
                                  <div>
                                    <div className="song-name">{song.title}</div>
                                    <div className="song-artist">{song.artist}</div>
                                  </div>
                                </div>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )}
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
