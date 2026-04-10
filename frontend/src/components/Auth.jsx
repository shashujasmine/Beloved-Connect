import React, { useState } from 'react';
import { motion } from 'framer-motion';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

const Auth = ({ setToken }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      if (isLogin) {
        const formData = new URLSearchParams();
        formData.append('username', username);
        formData.append('password', password);

        const res = await fetch(`${API_URL}/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: formData.toString()
        });

        if (res.ok) {
          const data = await res.json();
          localStorage.setItem('token', data.access_token);
          setToken(data.access_token);
        } else {
          const detail = await res.json();
          setError(detail.detail || 'Login failed');
        }
      } else {
        const res = await fetch(`${API_URL}/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password, name })
        });

        if (res.ok) {
          const formData = new URLSearchParams();
          formData.append('username', username);
          formData.append('password', password);
          const loginRes = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: formData.toString()
          });
          if (loginRes.ok) {
            const data = await loginRes.json();
            localStorage.setItem('token', data.access_token);
            setToken(data.access_token);
          }
        } else {
          const detail = await res.json();
          setError(detail.detail || 'Registration failed');
        }
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh', 
      background: 'var(--bg-primary)', 
      width: '100vw',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div className="bg-blobs">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
      </div>
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        style={{ 
          padding: '3rem', 
          background: 'var(--bg-elevated)', 
          borderRadius: '32px', 
          boxShadow: 'var(--shadow-elevated)', 
          width: '100%', 
          maxWidth: '440px', 
          margin: '20px',
          border: '1px solid var(--border-subtle)',
          position: 'relative',
          backdropFilter: 'blur(20px)'
        }}
      >
        <div style={{
          position: 'absolute',
          top: '-2px',
          left: '10%',
          right: '10%',
          height: '5px',
          background: 'var(--gradient-1)',
          borderRadius: '5px'
        }} />
        
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '72px',
            height: '72px',
            margin: '0 auto 1.5rem',
            background: 'var(--gradient-1)',
            borderRadius: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2rem',
            boxShadow: '0 8px 24px rgba(255, 107, 74, 0.35)'
          }}>
            💕
          </div>
          <h2 style={{ color: 'var(--text-primary)', fontSize: '2.25rem', fontFamily: "'Playfair Display', serif", fontWeight: 600, marginBottom: '0.5rem' }}>
            {isLogin ? 'Welcome Back' : 'Get Started'}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>
            {isLogin ? 'Continue your journey of cherished memories' : 'Begin capturing beautiful moments'}
          </p>
        </div>
        
        {error && (
          <div style={{ 
            color: '#dc2626', 
            background: 'rgba(220, 38, 38, 0.1)', 
            padding: '0.875rem 1rem', 
            borderRadius: '12px', 
            marginBottom: '1.25rem', 
            fontSize: '0.9rem',
            border: '1px solid rgba(220, 38, 38, 0.2)'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {!isLogin && (
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 600 }}>Full Name</label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="input"
                placeholder="Enter your name"
              />
            </div>
          )}
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 600 }}>Username</label>
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="input"
              placeholder="Choose a username"
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 600 }}>Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="input"
              placeholder="••••••••"
            />
          </div>

          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit" 
            className="btn-primary"
            style={{ marginTop: '0.5rem', width: '100%', justifyContent: 'center', padding: '1.1rem' }}
          >
            {isLogin ? 'Sign In' : 'Create Account'}
          </motion.button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '2rem', fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <span 
            onClick={() => { setIsLogin(!isLogin); setError(''); }}
            style={{ color: 'var(--accent-primary)', cursor: 'pointer', fontWeight: 600 }}
          >
            {isLogin ? 'Sign Up' : 'Sign In'}
          </span>
        </div>
      </motion.div>
    </div>
  );
};

export default Auth;