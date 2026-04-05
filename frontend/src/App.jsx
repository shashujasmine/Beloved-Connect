import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import QuickReach from './components/QuickReach';
import MemoryCard from './components/MemoryCard';
import NewMemory from './components/NewMemory';
import Notes from './components/Notes';
import BelovedOnes from './components/BelovedOnes';
import SendLoveModal from './components/SendLoveModal';
import { motion, AnimatePresence } from 'framer-motion';
import { Send } from 'lucide-react';
import './App.css';

const API_URL = 'http://127.0.0.1:8000/api';

function App() {
  const [isDark, setIsDark] = useState(() =>
    window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
  );
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeView, setActiveView] = useState('memories');
  const [memories, setMemories] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  useEffect(() => {
    fetch(`${API_URL}/memories`)
      .then(r => r.json()).then(setMemories)
      .catch(err => console.error('Fetch memories failed:', err));
  }, []);

  useEffect(() => {
    if (activeView === 'invitations') {
      fetch(`${API_URL}/invitations`)
        .then(r => r.json()).then(setInvitations)
        .catch(err => console.error('Fetch invitations failed:', err));
    }
  }, [activeView]);

  const handleAddMemory = async (newMemory) => {
    try {
      const res = await fetch(`${API_URL}/memories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMemory),
      });
      if (res.ok) {
        const added = await res.json();
        setMemories(prev => [added, ...prev]);
      }
    } catch (err) { console.error('Error adding memory:', err); }
  };

  const handleSendLove = async (data) => {
    try {
      const res = await fetch(`${API_URL}/invitations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) alert('Your invitation has been sent!');
      else alert('Failed to send invitation');
    } catch (err) { alert('Error sending invitation.'); }
  };

  const pageVariants = {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 },
  };

  return (
    <div className={`app-container ${isDark ? 'dark' : ''}`}>
      <Navbar isDark={isDark} toggleTheme={() => setIsDark(d => !d)} onMenuOpen={() => setIsSidebarOpen(true)} />
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} activeView={activeView} onNavigate={setActiveView} />

      <main className="main-content">
        <AnimatePresence mode="wait">
          {activeView === 'memories' && (
            <motion.div key="memories" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.35 }}>
              <section className="hero">
                <motion.h1 className="hero-title" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
                  Keep Your Loved Ones <span>Closer</span>
                </motion.h1>
                <motion.p className="hero-subtitle" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}>
                  A dedicated space to store those fleeting moments, thoughts, and memories that remind you of the special people in your life.
                </motion.p>
              </section>
              <section className="container">
                <NewMemory onAddMemory={handleAddMemory} />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.5rem', fontWeight: 600 }}>Your Recent Memories</h2>
                  <span style={{ color: 'var(--text-muted)' }}>{memories.length} entries</span>
                </div>
                <div className="memories-grid">
                  {memories.map((m, i) => <MemoryCard key={m.id} memory={m} index={i} />)}
                  {memories.length === 0 && (
                    <p style={{ gridColumn: '1/-1', textAlign: 'center', color: 'var(--text-muted)', paddingTop: '2rem' }}>
                      No memories yet. Start by adding one above.
                    </p>
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
                        <span style={{ background: inv.type === 'song' ? 'var(--secondary-color)' : 'var(--primary-color)', color:'white', borderRadius:'20px', padding:'2px 10px', fontSize:'0.75rem', fontWeight:600 }}>
                          {inv.type === 'song' ? '🎵 Song' : '💬 Message'}
                        </span>
                        <span style={{ fontSize:'0.8rem', color:'var(--text-muted)' }}>to {inv.mobile}</span>
                      </div>
                      <p className="memory-content">{inv.content}</p>
                      <span style={{ fontSize:'0.8rem', color: inv.status === 'accepted' ? '#34d399' : inv.status === 'rejected' ? '#f87171' : 'var(--text-muted)', fontWeight:600 }}>
                        ● {inv.status?.toUpperCase()}
                      </span>
                    </motion.div>
                  ))}
                  {invitations.length === 0 && (
                    <p style={{ gridColumn:'1/-1', textAlign:'center', color:'var(--text-muted)', padding:'3rem 0' }}>
                      No invitations sent yet. Use the <Send size={14} style={{verticalAlign:'middle'}}/> button to reach out ❤️
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <QuickReach onOpenModal={() => setIsModalOpen(true)} />
      <SendLoveModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSend={handleSendLove} />
    </div>
  );
}

export default App;
