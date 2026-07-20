import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { yahooQuotes } from '../api';
import StockChart from '../components/StockChart';
import DonutChart from '../components/DonutChart';
import { useToast } from '../context/ToastContext';

// ─── helpers ────────────────────────────────────────────────────────────────
const fmt = (n, d = 2) =>
  Number(n).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });

const pct = (n) => (n >= 0 ? `+${fmt(n)}%` : `${fmt(n)}%`);

// ─── DashboardOverviewPage ───────────────────────────────────────────────────
const DashboardOverviewPage = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const [watchlist, setWatchlist] = useState([]);
  const [portfolio, setPortfolio] = useState([]);
  const [liveWatchlist, setLiveWatchlist] = useState({});  // symbol → quote
  const [livePortfolio, setLivePortfolio] = useState({});  // symbol → quote
  const [selectedSymbol, setSelectedSymbol] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);
  const refreshRef = useRef(null);

  // ── Load watchlist + portfolio from DB ──────────────────────────────────
  const loadData = useCallback(async () => {
    try {
      const r = await api.get('/dashboard/overview');
      const wl = r.data.watchlist || [];
      const pf = r.data.portfolio || [];
      setWatchlist(wl);
      setPortfolio(pf);

      if (wl.length > 0) {
        if (!selectedSymbol) setSelectedSymbol(wl[0].symbol);
        fetchLiveWatchlist(wl.map((w) => w.symbol));
      }
      if (pf.length > 0) {
        fetchLivePortfolio(pf.map((p) => p.symbol));
      }
    } catch (err) {
      toast('Failed to load dashboard data', 'error');
    } finally {
      setLoading(false);
    }
  }, []); // eslint-disable-line

  const fetchLiveWatchlist = async (symbols) => {
    if (!symbols.length) return;
    try {
      const quotes = await yahooQuotes(symbols);
      const map = {};
      quotes.forEach((q) => { map[q.symbol] = q; });
      setLiveWatchlist(map);
    } catch {}
  };

  const fetchLivePortfolio = async (symbols) => {
    if (!symbols.length) return;
    try {
      const quotes = await yahooQuotes(symbols);
      const map = {};
      quotes.forEach((q) => { map[q.symbol] = q; });
      setLivePortfolio(map);
    } catch {}
  };

  useEffect(() => {
    loadData();
    // Refresh live prices every 60s
    refreshRef.current = setInterval(() => {
      if (watchlist.length) fetchLiveWatchlist(watchlist.map((w) => w.symbol));
      if (portfolio.length) fetchLivePortfolio(portfolio.map((p) => p.symbol));
    }, 60000);
    return () => clearInterval(refreshRef.current);
  }, []); // eslint-disable-line

  // ── Remove from watchlist ────────────────────────────────────────────────
  const removeFromWatchlist = async (id, symbol) => {
    try {
      await api.delete(`/dashboard/watchlist/${id}`);
      setWatchlist((prev) => prev.filter((w) => w._id !== id));
      toast(`${symbol} removed from watchlist`, 'success');
      if (selectedSymbol === symbol && watchlist.length > 1) {
        const next = watchlist.find((w) => w.symbol !== symbol);
        if (next) setSelectedSymbol(next.symbol);
      }
    } catch {
      toast('Failed to remove from watchlist', 'error');
    }
  };

  // ── Portfolio calculations ────────────────────────────────────────────────
  const enrichedPortfolio = portfolio.map((item) => {
    const q = livePortfolio[item.symbol];
    const currentPrice = q?.regularMarketPrice ?? item.buyPrice;
    const currentValue = currentPrice * item.quantity;
    const costBasis = item.buyPrice * item.quantity;
    const pnl = currentValue - costBasis;
    const pnlPct = costBasis ? (pnl / costBasis) * 100 : 0;
    return { ...item, currentPrice, currentValue, pnl, pnlPct };
  });

  const totalCurrentValue = enrichedPortfolio.reduce((s, i) => s + i.currentValue, 0);
  const donutItems = enrichedPortfolio.map((i) => ({ label: i.symbol, value: i.currentValue }));

  if (loading) {
    return (
      <div className="loading-screen">
        <span className="spinner" /> Loading dashboard…
      </div>
    );
  }

  return (
    <div className="overview-grid">
      {/* ── 1. Watchlist ── */}
      <div className="card overview-watchlist">
        <div className="card-header">
          <span className="card-title">Your WatchList :</span>
        </div>
        {watchlist.length === 0 ? (
          <div className="card-body" style={{ color: 'var(--text-muted)', fontSize: 13 }}>
            No watchlist items. Search for a stock to add one.
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>NAME</th>
                <th>PRICE</th>
                <th>CHANGE</th>
                <th>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {watchlist.map((item) => {
                const q = liveWatchlist[item.symbol];
                const price = q?.regularMarketPrice;
                const change = q?.regularMarketChange;
                const changePct = q?.regularMarketChangePercent;
                const isUp = (change ?? 0) >= 0;
                return (
                  <tr
                    key={item._id}
                    onClick={() => setSelectedSymbol(item.symbol)}
                    style={{ cursor: 'pointer', outline: selectedSymbol === item.symbol ? '2px solid var(--blue)' : 'none', outlineOffset: -2 }}
                  >
                    <td className="sym">{item.symbol}</td>
                    <td className="price">{price != null ? fmt(price) : '—'}</td>
                    <td className={isUp ? 'positive' : 'negative'}>
                      {change != null ? `${isUp ? '+' : ''}${fmt(change)} (${pct(changePct)})` : '—'}
                    </td>
                    <td>
                      <button
                        className="btn btn-ghost btn-sm"
                        style={{ color: 'var(--blue)' }}
                        onClick={(e) => { e.stopPropagation(); removeFromWatchlist(item._id, item.symbol); }}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ── 2. Chart ── */}
      <div className="card overview-chart">
        {selectedSymbol ? (
          <>
            <div className="chart-header">
              <span
                className="chart-symbol"
                style={{ cursor: 'pointer' }}
                onClick={() => navigate(`/dashboard/stock/${selectedSymbol}`)}
                title="View stock detail"
              >
                {selectedSymbol}
              </span>
              {liveWatchlist[selectedSymbol] && (
                <>
                  <span className={`chart-change ${(liveWatchlist[selectedSymbol].regularMarketChange ?? 0) >= 0 ? 'up' : 'down'}`}>
                    {pct(liveWatchlist[selectedSymbol].regularMarketChangePercent)}
                  </span>
                </>
              )}
            </div>
            <StockChart
              symbol={selectedSymbol}
              height={220}
              showRanges={false}
              onData={(d) => setChartData(d)}
            />
          </>
        ) : (
          <div className="card-body" style={{ color: 'var(--text-muted)', fontSize: 13 }}>
            Select a watchlist stock to see its chart.
          </div>
        )}
      </div>

      {/* ── 3. Portfolio Overview ── */}
      <div className="card overview-portfolio">
        <div className="card-header">
          <span className="card-title">Portfolio Overview :</span>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => navigate('/dashboard/portfolio')}
          >
            + Add Holding
          </button>
        </div>
        {portfolio.length === 0 ? (
          <div className="card-body" style={{ color: 'var(--text-muted)', fontSize: 13 }}>
            No portfolio holdings yet.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>STOCK NAME</th>
                  <th>SHARE AMOUNT</th>
                  <th>PRICE</th>
                  <th>CHANGE</th>
                  <th>CURRENT VALUE</th>
                  <th>PERCENT CHANGE</th>
                  <th>EDIT</th>
                </tr>
              </thead>
              <tbody>
                {enrichedPortfolio.map((item) => {
                  const q = livePortfolio[item.symbol];
                  const change = q?.regularMarketChange;
                  return (
                    <tr key={item._id}>
                      <td className="sym">{item.symbol}</td>
                      <td>{item.quantity}</td>
                      <td className="price">{fmt(item.buyPrice)}</td>
                      <td>{change != null ? fmt(change) : '—'}</td>
                      <td className="price">{fmt(item.currentValue)}</td>
                      <td className={item.pnlPct >= 0 ? 'positive' : 'negative'}>
                        {pct(item.pnlPct)}
                      </td>
                      <td>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => navigate(`/dashboard/stock/${item.symbol}`)}
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── 4. Asset Allocation ── */}
      <div className="card overview-allocation">
        <div className="card-header">
          <span className="card-title">Assets Allocation</span>
        </div>
        {donutItems.length === 0 ? (
          <div className="card-body" style={{ color: 'var(--text-muted)', fontSize: 13 }}>
            Add portfolio holdings to see allocation.
          </div>
        ) : (
          <DonutChart
            items={donutItems}
            size={180}
            total={totalCurrentValue}
            label="Total Investment"
          />
        )}
      </div>
    </div>
  );
};

export default DashboardOverviewPage;
