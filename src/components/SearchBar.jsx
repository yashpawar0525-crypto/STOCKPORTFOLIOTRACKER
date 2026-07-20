import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { yahooSearch } from '../api';

const SearchIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const SearchBar = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef(null);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setOpen(false);
      return;
    }
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await yahooSearch(query);
        const filtered = (data.quotes || []).filter(
          (q) => q.quoteType === 'EQUITY' || q.quoteType === 'ETF'
        );
        setResults(filtered.slice(0, 7));
        setOpen(true);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 350);

    return () => clearTimeout(timerRef.current);
  }, [query]);

  const handleSelect = (symbol) => {
    setQuery('');
    setOpen(false);
    navigate(`/dashboard/stock/${symbol}`);
  };

  const handleBlur = () => {
    // Delay to allow click on result
    setTimeout(() => setOpen(false), 180);
  };

  return (
    <div className="topbar-search">
      <span className="topbar-search-icon">
        <SearchIcon />
      </span>
      <input
        ref={inputRef}
        type="text"
        className="topbar-search-input"
        placeholder="Search..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => results.length > 0 && setOpen(true)}
        onBlur={handleBlur}
      />
      {open && results.length > 0 && (
        <div className="search-dropdown">
          {results.map((r) => (
            <div
              key={r.symbol}
              className="search-result-item"
              onMouseDown={() => handleSelect(r.symbol)}
            >
              <span className="search-result-symbol">{r.symbol}</span>
              <span className="search-result-name">{r.shortname}</span>
              <span className="search-result-exchange">{r.exchange}</span>
            </div>
          ))}
        </div>
      )}
      {loading && open && (
        <div className="search-dropdown" style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: 13 }}>
          Searching…
        </div>
      )}
    </div>
  );
};

export default SearchBar;
