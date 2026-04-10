import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import QuickReach from './components/QuickReach';
import MemoryCard from './components/MemoryCard';
import NewMemory from './components/NewMemory';
import Notes from './components/Notes';
import BelovedOnes from './components/BelovedOnes';
import SendLoveModal from './components/SendLoveModal';
import Auth from './components/Auth';
import { motion, AnimatePresence } from 'framer-motion';
import { Send } from 'lucide-react';
import './App.css';

const API_URL = import.meta.env.VITE_API_URL || 'https://belovedconnect.up.railway.app/api';
function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [isDark, setIsDark] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeView, setActiveView] = useState('memories');
  const [memories, setMemories] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [prefilledEmail, setPrefilledEmail] = useState('');

  // Expose a global way to open the modal with an email
  useEffect(() => {
    window.openSendLoveModal = (email) => {
      setPrefilledEmail(email);
      setIsModalOpen(true);
    };
    return () => delete window.openSendLoveModal;
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  useEffect(() => {
    if (token) {
      fetch(`${API_URL}/memories`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
        .then(r => r.json())
        .then(data => {
          if (Array.isArray(data)) setMemories(data);
          else if (data.detail === "Could not validate credentials") handleLogout();
        })
        .catch(err => console.error('Fetch memories failed:', err));
    }
  }, [token]);

  useEffect(() => {
    if (token && activeView === 'invitations') {
      fetch(`${API_URL}/invitations`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
        .then(r => r.json())
        .then(data => {
          if (Array.isArray(data)) setInvitations(data);
        })
        .catch(err => console.error('Fetch invitations failed:', err));
    }
  }, [activeView, token]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
  };

  const handleAddMemory = async (newMemory) => {
    try {
      const res = await fetch(`${API_URL}/memories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newMemory),
      });
      if (res.ok) {
        const added = await res.json();
        setMemories(prev => [added, ...prev]);
      } else {
        const errTxt = await res.text();
        alert('Failed to add memory: ' + errTxt);
      }
    } catch (err) {
      alert('Error adding memory: ' + err.message);
    }
  };

  const handleSendLove = async (data) => {
    try {
      const res = await fetch(`${API_URL}/invitations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const result = await res.json();
        setInvitations(prev => [result.data, ...prev]);
        alert('Your invitation has been sent!');
      } else {
        alert('Failed to send invitation');
      }
    } catch (err) {
      alert('Error sending invitation.');
    }
  };

  const pageVariants = {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 },
  };

  if (!token) {
    return <Auth setToken={setToken} />;
  }

  return (
    <div className={`app-container ${isDark ? 'dark' : ''}`}>
      <div className="bg-blobs">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
        <div className="blob blob-3"></div>
      </div>
      <Navbar isDark={isDark} toggleTheme={() => setIsDark(d => !d)} onMenuOpen={() => setIsSidebarOpen(true)}>
        <button onClick={handleLogout} className="btn-cancel" style={{ marginLeft: '1rem', padding: '0.4rem 0.8rem' }}>Logout</button>
      </Navbar>
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} activeView={activeView} onNavigate={setActiveView} />

      <main className="main-content">
        <AnimatePresence mode="wait">
          {activeView === 'memories' && (
            <motion.div key="memories" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.35 }}>
              <section className="hero">
                <motion.h1 className="hero-title" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
                  Keep Your Loved Ones <span>Closer</span>
                </motion.h1>
                <motion.p className="hero-subtitle" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.15 }}>
                  A dedicated space to store fleeting moments and thoughts that remind you of the special people in your life.
                </motion.p>
              </section>
              <section className="container">
                <NewMemory onAddMemory={handleAddMemory} />
                <div className="page-header">
                  <h2>Recent Memories</h2>
                  <span className="page-meta">{memories.length} entries</span>
                </div>
                <div className="memories-grid">
                  {memories.map((m, i) => <MemoryCard key={m.id} memory={m} index={i} />)}
                  {memories.length === 0 && (
                    <div className="empty-state">
                      <div className="empty-state-icon">💌</div>
                      <p>No memories yet. Capture your first moment of love.</p>
                    </div>
                  )}
                </div>
              </section>
            </motion.div>
          )}

          {activeView === 'notes' && (
            <motion.div key="notes" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.35 }}>
              <Notes />
            </motion.div>
          )}

          {activeView === 'beloved' && (
            <motion.div key="beloved" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.35 }}>
              <BelovedOnes />
            </motion.div>
          )}

          {activeView === 'invitations' && (
            <motion.div key="invitations" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.35 }}>
              <div className="container notes-page">
                <h2 className="section-title">Sent Invitations</h2>
                <p className="section-subtitle">All the messages and songs you have sent to your beloved ones.</p>
                <div className="memories-grid" style={{ marginTop: '2rem' }}>
                  {invitations.map((inv, i) => (
                    <motion.div key={inv.id} className="memory-card glass" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                      <span className="memory-date">{inv.date}</span>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <span style={{ background: 'var(--primary-color)', color: 'white', borderRadius: '20px', padding: '2px 10px', fontSize: '0.75rem', fontWeight: 600 }}>
                          💬 Message
                        </span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>to {inv.email}</span>
                      </div>
                      <p className="memory-content">{inv.content}</p>
                      <span style={{ fontSize: '0.8rem', color: inv.status === 'accepted' ? '#34d399' : inv.status === 'rejected' ? '#f87171' : 'var(--text-muted)', fontWeight: 600 }}>
                        ● {inv.status?.toUpperCase()}
                      </span>
                    </motion.div>
                  ))}
                  {invitations.length === 0 && (
                    <div className="empty-state">
                      <div className="empty-state-icon">💕</div>
                      <p>No invitations sent yet. Use the button below to reach out with love.</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <QuickReach onOpenModal={() => { setPrefilledEmail(''); setIsModalOpen(true); }} />
      <SendLoveModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSend={handleSendLove}
        initialEmail={prefilledEmail}
      />
    </div>
  );
}

export default App;
