import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock, SortAsc, SortDesc, User, Heart,
  FileText, Filter, RefreshCw, ChevronDown, X
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

// ── helpers ──────────────────────────────────────────────────────────────────

function formatDateTime(raw) {
  if (!raw) return '';
  const d = new Date(raw);
  if (isNaN(d)) return raw; // already a formatted string like "Apr 07, 2026"
  return d.toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

function groupByDate(items) {
  const groups = {};
  items.forEach(item => {
    const d = new Date(item.created_at);
    const key = isNaN(d)
      ? (item.date || 'Undated')
      : d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
  });
  return Object.entries(groups);
}

// ── sub-components ────────────────────────────────────────────────────────────

const KindBadge = ({ kind, category }) => {
  if (kind === 'memory') {
    return (
      <span className="tl-badge tl-badge-memory">
        <Heart size={11} /> Memory
      </span>
    );
  }
  const cat = category || 'me';
  const catLabel = cat === 'beloved' ? '💌 Beloved' : cat === 'me' ? '🙋 Personal' : '💼 Work';
  return (
    <span className="tl-badge tl-badge-note">
      <FileText size={11} /> {catLabel}
    </span>
  );
};

const TimelineCard = ({ item, index }) => (
  <motion.div
    className="tl-card glass"
    initial={{ opacity: 0, x: -24 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: 24 }}
    transition={{ duration: 0.35, delay: index * 0.05 }}
  >
    {/* Left accent bar */}
    <div className={`tl-card-bar ${item.kind === 'memory' ? 'bar-memory' : 'bar-note'}`} />

    <div className="tl-card-body">
      <div className="tl-card-meta">
        <KindBadge kind={item.kind} category={item.category} />
        <span className="tl-card-time">
          <Clock size={11} />
          {formatDateTime(item.created_at) || item.date}
        </span>
      </div>

      <h3 className="tl-card-title">{item.title}</h3>
      <p className="tl-card-content">{item.content}</p>

      {item.shared_with && (
        <div className="tl-card-shared">
          <User size={12} />
          <span>Shared with {item.shared_with}</span>
        </div>
      )}
    </div>
  </motion.div>
);

const DateGroup = ({ date, items }) => (
  <div className="tl-group">
    {/* Date marker on the spine */}
    <div className="tl-date-marker">
      <div className="tl-date-dot" />
      <div className="tl-date-label">{date}</div>
    </div>

    <div className="tl-cards-stack">
      {items.map((item, i) => (
        <div className="tl-entry" key={`${item.kind}-${item.id}`}>
          {/* Dot on spine for each card */}
          <div className="tl-entry-dot" />
          <TimelineCard item={item} index={i} />
        </div>
      ))}
    </div>
  </div>
);

// ── main component ────────────────────────────────────────────────────────────

const MemoryTimeline = ({ token }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState('desc');
  const [personFilter, setPersonFilter] = useState('');
  const [personInput, setPersonInput] = useState('');
  const [belovedList, setBelovedList] = useState([]);
  const [filterOpen, setFilterOpen] = useState(false);
  const [error, setError] = useState('');

  const fetchTimeline = useCallback(() => {
    setLoading(true);
    setError('');
    const params = new URLSearchParams({ sort });
    if (personFilter) params.set('person', personFilter);

    fetch(`${API_URL}/timeline?${params}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => {
        if (!r.ok) throw new Error(`Server returned ${r.status}`);
        return r.json();
      })
      .then(data => {
        setItems(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [token, sort, personFilter]);

  // Fetch beloved for the person filter dropdown
  useEffect(() => {
    fetch(`${API_URL}/beloved`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setBelovedList(data); })
      .catch(() => {});
  }, [token]);

  useEffect(() => { fetchTimeline(); }, [fetchTimeline]);

  const applyPerson = () => {
    setPersonFilter(personInput.trim());
    setFilterOpen(false);
  };

  const clearFilter = () => {
    setPersonInput('');
    setPersonFilter('');
  };

  const groups = groupByDate(items);

  return (
    <div className="container tl-page">
      {/* ── Header ── */}
      <div className="tl-header">
        <div>
          <h1 className="section-title">Memory Timeline</h1>
          <p className="section-subtitle">
            Your memories and notes, woven together in time.
          </p>
        </div>

        <div className="tl-actions">
          {/* Sort toggle */}
          <button
            className={`tl-action-btn ${sort === 'desc' ? 'active' : ''}`}
            onClick={() => setSort(s => s === 'desc' ? 'asc' : 'desc')}
            title={sort === 'desc' ? 'Newest first' : 'Oldest first'}
          >
            {sort === 'desc' ? <SortDesc size={17} /> : <SortAsc size={17} />}
            <span>{sort === 'desc' ? 'Newest' : 'Oldest'}</span>
          </button>

          {/* Filter by person */}
          <div className="tl-filter-wrap">
            <button
              className={`tl-action-btn ${personFilter ? 'active' : ''}`}
              onClick={() => setFilterOpen(o => !o)}
            >
              <Filter size={17} />
              <span>{personFilter ? `Filter: ${personFilter}` : 'Filter'}</span>
              {personFilter
                ? <X size={14} onClick={e => { e.stopPropagation(); clearFilter(); }} />
                : <ChevronDown size={14} />}
            </button>

            <AnimatePresence>
              {filterOpen && (
                <motion.div
                  className="tl-filter-dropdown glass"
                  initial={{ opacity: 0, y: -8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.97 }}
                  transition={{ duration: 0.2 }}
                >
                  <p className="tl-filter-label">Filter by person (email / username)</p>
                  <input
                    className="input"
                    placeholder="e.g. jasmine@example.com"
                    value={personInput}
                    onChange={e => setPersonInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && applyPerson()}
                    style={{ marginBottom: '0.75rem' }}
                  />

                  {belovedList.length > 0 && (
                    <div className="tl-beloved-pills">
                      {belovedList.map(b => (
                        <button
                          key={b.id}
                          className="tl-pill"
                          onClick={() => { setPersonInput(b.email || b.name); }}
                        >
                          {b.name}
                        </button>
                      ))}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                    <button className="btn-primary" style={{ flex: 1, justifyContent: 'center', padding: '0.6rem' }} onClick={applyPerson}>
                      Apply
                    </button>
                    <button className="btn-cancel" onClick={() => setFilterOpen(false)}>
                      Cancel
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Refresh */}
          <button className="tl-action-btn" onClick={fetchTimeline} title="Refresh">
            <RefreshCw size={17} />
          </button>
        </div>
      </div>

      {/* ── Stats bar ── */}
      <div className="tl-stats">
        <span className="page-meta">{items.length} entries</span>
        {personFilter && (
          <span className="page-meta" style={{ background: 'rgba(255,107,74,0.12)', color: 'var(--accent-primary)' }}>
            Showing shared with "{personFilter}"
          </span>
        )}
      </div>

      {/* ── Error ── */}
      {error && (
        <div style={{ color: '#dc2626', background: 'rgba(220,38,38,0.08)', padding: '1rem 1.25rem', borderRadius: 12, marginBottom: '1.5rem', border: '1px solid rgba(220,38,38,0.2)' }}>
          ⚠️ {error}
        </div>
      )}

      {/* ── Loading skeleton ── */}
      {loading && (
        <div className="tl-skeleton-wrap">
          {[1, 2, 3].map(i => (
            <div key={i} className="tl-skeleton">
              <div className="tl-sk-dot" />
              <div className="tl-sk-card">
                <div className="tl-sk-line short" />
                <div className="tl-sk-line" />
                <div className="tl-sk-line" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Timeline ── */}
      {!loading && items.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">🕰️</div>
          <p>No memories or notes found yet.<br />Create one to see your timeline!</p>
        </div>
      )}

      {!loading && items.length > 0 && (
        <div className="tl-spine">
          <div className="tl-line" />
          <AnimatePresence>
            {groups.map(([date, grpItems]) => (
              <DateGroup key={date} date={date} items={grpItems} />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default MemoryTimeline;
