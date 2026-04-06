import React from 'react';
import { Heart, Sun, Moon, Menu } from 'lucide-react';
import { motion } from 'framer-motion';

const Navbar = ({ toggleTheme, isDark, onMenuOpen }) => {
  return (
    <nav className="navbar">
      <div className="container nav-container">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {/* Hamburger Menu - top left */}
          <motion.button
            className="btn-icon"
            aria-label="Open menu"
            onClick={onMenuOpen}
            whileTap={{ scale: 0.9 }}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Menu size={20} />
          </motion.button>

          <motion.div
            className="nav-logo"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Heart fill="var(--primary-color)" color="var(--primary-color)" />
            Beloved Connect
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <button className="btn-icon" onClick={toggleTheme} aria-label="Toggle Theme">
            {isDark ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </motion.div>
      </div>
    </nav>
  );
};

export default Navbar;