import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { yahooQuotes, yahooSearch } from '../api';
import { useToast } from '../context/ToastContext';

const fmt = (n, d = 2) =>
  Number(n).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });

// ── Search inline for adding holding ──────────────────────────────────────
const SymbolSearch = ({ onSelect }) => {
  const [q, setQ] = useState('');
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const timerRef = { current: null };

  const search = (val) => {
    setQ(val);
    clearTimeout(timerRef.current);
    if (!val.trim()) { setResults([]); setOpen(false); return; }
    timerRef.current = setTimeout(async () => {
      try {
        const data = await yahooSearch(val);
        const filtered = (data.quotes || []).filter(
          (r) => r.quoteType === 'EQUITY' || r.quoteType === 'ETF'
        );
        setResults(filtered.slice(0, 6));
        setOpen(true);
      } catch {}
    }, 300);
  };

  const select = (item) => {
    setQ(item.symbol);
    setOpen(false);
    onSelect(item);
  };

  return (
    <div style={{ position: 'relative', flex: '1 1 160px' }}>
      <input
        className="form-input"
        placeholder="Search symbol (e.g. AAPL)"
        value={q}
        onChange={(e) => search(e.target.value)}
        onBlur={() => setTimeout(() => setOpen(false), 180)}
        style={{ padding: '9px 12px' }}
      />
      {open && results.length > 0 && (
        <div className="search-dropdown" style={{ top: 'calc(100% + 4px)' }}>
          {results.map((r) => (
            <div
              key={r.symbol}
              className="search-result-item"
              onMouseDown={() => select(r)}
            >
              <span className="search-result-symbol">{r.symbol}</span>
              <span className="search-result-name">{r.shortname}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Edit Modal ─────────────────────────────────────────────────────────────
const EditModal = ({ item, onClose, onSave }) => {
  const [qty, setQty] = useState(item.quantity);
  const [price, setPrice] = useState(item.buyPrice);

  const handleSave = () => onSave(item._id, qty, price);

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <h3>Edit — {item.symbol}</h3>
        <div className="modal-form">
          <div className="form-group">
            <label>Quantity</label>
            <input
              className="form-input"
              type="number"
              min="1"
              value={qty}
              onChange={(e) => setQty(Number(e.target.value))}
            />
          </div>
          <div className="form-group">
            <label>Buy Price ($)</label>
            <input
              className="form-input"
              type="number"
              step="0.01"
              min="0"
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
            />
          </div>
          <div className="modal-actions">
            <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSave}>
              Save Changes
            </button>
            <button className="btn btn-secondary" style={{ flex: 1 }} onClick={onClose}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── PortfolioPage ──────────────────────────────────────────────────────────
const PortfolioPage = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const [items, setItems] = useState([]);
  const [liveQuotes, setLiveQuotes] = useState({});
  const [form, setForm] = useState({ symbol: '', company: '', quantity: '', buyPrice: '' });
  const [editItem, setEditItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const loadPortfolio = useCallback(async () => {
    try {
      const r = await api.get('/dashboard/portfolio');
      setItems(r.data);
      if (r.data.length > 0) {
        const symbols = r.data.map((i) => i.symbol);
        const quotes = await yahooQuotes(symbols);
        const map = {};
        quotes.forEach((q) => { map[q.symbol] = q; });
        setLiveQuotes(map);
      }
    } catch {
      toast('Failed to load portfolio', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadPortfolio(); }, [loadPortfolio]);

  const handleSymbolSelect = (item) => {
    setForm((f) => ({
      ...f,
      symbol: item.symbol,
      company: item.shortname || item.symbol,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.symbol || !form.quantity || !form.buyPrice) {
      toast('Please fill in all fields', 'error');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/dashboard/portfolio', {
        ...form,
        quantity: Number(form.quantity),
        buyPrice: Number(form.buyPrice),
      });
      setForm({ symbol: '', company: '', quantity: '', buyPrice: '' });
      toast(`${form.symbol} added to portfolio!`, 'success');
      loadPortfolio();
    } catch (err) {
      toast(err.response?.data?.message || 'Failed to add holding', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, symbol) => {
    try {
      await api.delete(`/dashboard/portfolio/${id}`);
      setItems((prev) => prev.filter((i) => i._id !== id));
      toast(`${symbol} removed from portfolio`, 'success');
    } catch {
      toast('Failed to remove holding', 'error');
    }
  };

  const handleSaveEdit = async (id, quantity, buyPrice) => {
    try {
      const r = await api.put(`/dashboard/portfolio/${id}`, { quantity, buyPrice });
      setItems((prev) => prev.map((i) => (i._id === id ? r.data : i)));
      setEditItem(null);
      toast('Portfolio updated', 'success');
    } catch {
      toast('Failed to update holding', 'error');
    }
  };

  // Enrich with live prices
  const enriched = items.map((item) => {
    const q = liveQuotes[item.symbol];
    const currentPrice = q?.regularMarketPrice ?? item.buyPrice;
    const currentValue = currentPrice * item.quantity;
    const costBasis = item.buyPrice * item.quantity;
    const pnl = currentValue - costBasis;
    const pnlPct = costBasis ? (pnl / costBasis) * 100 : 0;
    return { ...item, currentPrice, currentValue, pnl, pnlPct };
  });

  const totalInvested = items.reduce((s, i) => s + i.buyPrice * i.quantity, 0);
  const totalCurrent = enriched.reduce((s, i) => s + i.currentValue, 0);
  const totalPnl = totalCurrent - totalInvested;

  return (
    <>
      {/* Summary row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {[
          { label: 'Total Invested', value: `$${fmt(totalInvested)}`, color: 'var(--text)' },
          { label: 'Current Value', value: `$${fmt(totalCurrent)}`, color: 'var(--text)' },
          { label: 'Total P&L', value: `${totalPnl >= 0 ? '+' : ''}$${fmt(Math.abs(totalPnl))}`, color: totalPnl >= 0 ? 'var(--green)' : 'var(--red)' },
        ].map((s) => (
          <div key={s.label} className="card" style={{ padding: '16px 20px' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, fontFamily: "'Outfit', sans-serif", color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Add holding form */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Add New Holding</span>
        </div>
        <form onSubmit={handleSubmit} className="portfolio-add-form">
          <SymbolSearch onSelect={handleSymbolSelect} />
          <input
            className="form-input"
            placeholder="Company name"
            value={form.company}
            onChange={(e) => setForm({ ...form, company: e.target.value })}
            style={{ padding: '9px 12px', flex: '1 1 140px' }}
          />
          <input
            className="form-input"
            type="number"
            min="1"
            placeholder="Quantity"
            value={form.quantity}
            onChange={(e) => setForm({ ...form, quantity: e.target.value })}
            style={{ padding: '9px 12px', flex: '0 1 100px' }}
          />
          <input
            className="form-input"
            type="number"
            step="0.01"
            min="0"
            placeholder="Buy Price ($)"
            value={form.buyPrice}
            onChange={(e) => setForm({ ...form, buyPrice: e.target.value })}
            style={{ padding: '9px 12px', flex: '0 1 120px' }}
          />
          <button
            className="btn btn-primary"
            type="submit"
            disabled={submitting}
            style={{ alignSelf: 'stretch', flexShrink: 0 }}
          >
            {submitting ? <span className="spinner" /> : '+ Add'}
          </button>
        </form>
      </div>

      {/* Portfolio table */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">My Holdings</span>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {items.length} position{items.length !== 1 ? 's' : ''}
          </span>
        </div>

        {loading ? (
          <div className="loading-screen">
            <span className="spinner" /> Loading portfolio…
          </div>
        ) : items.length === 0 ? (
          <div className="card-body" style={{ color: 'var(--text-muted)', fontSize: 13 }}>
            No holdings yet. Add your first stock above.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>SYMBOL</th>
                  <th>COMPANY</th>
                  <th>SHARES</th>
                  <th>BUY PRICE</th>
                  <th>CURRENT PRICE</th>
                  <th>CURRENT VALUE</th>
                  <th>P&amp;L</th>
                  <th>CHANGE %</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {enriched.map((item) => (
                  <tr key={item._id}>
                    <td
                      className="sym"
                      style={{ cursor: 'pointer', color: 'var(--blue)' }}
                      onClick={() => navigate(`/dashboard/stock/${item.symbol}`)}
                    >
                      {item.symbol}
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{item.company}</td>
                    <td>{item.quantity}</td>
                    <td className="price">${fmt(item.buyPrice)}</td>
                    <td className="price">${fmt(item.currentPrice)}</td>
                    <td className="price">${fmt(item.currentValue)}</td>
                    <td className={item.pnl >= 0 ? 'positive' : 'negative'}>
                      {item.pnl >= 0 ? '+' : ''}${fmt(Math.abs(item.pnl))}
                    </td>
                    <td className={item.pnlPct >= 0 ? 'positive' : 'negative'}>
                      {item.pnlPct >= 0 ? '+' : ''}{fmt(item.pnlPct)}%
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => setEditItem(item)}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-sm"
                          style={{ background: 'var(--red-dim)', color: 'var(--red)', border: '1px solid rgba(239,68,68,0.3)' }}
                          onClick={() => handleDelete(item._id, item.symbol)}
                        >
                          ✕
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editItem && (
        <EditModal
          item={editItem}
          onClose={() => setEditItem(null)}
          onSave={handleSaveEdit}
        />
      )}
    </>
  );
};

export default PortfolioPage;
