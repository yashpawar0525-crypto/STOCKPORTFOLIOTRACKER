import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { yahooQuote } from '../api';
import api from '../api';
import StockChart from '../components/StockChart';
import { useToast } from '../context/ToastContext';

const fmt = (n, d = 2) =>
  Number(n).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });

const fmtK = (n) => {
  if (!n && n !== 0) return '—';
  if (Math.abs(n) >= 1e12) return `${(n / 1e12).toFixed(2)}T`;
  if (Math.abs(n) >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (Math.abs(n) >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  return fmt(n);
};

const InfoRow = ({ label, value }) => (
  <div className="info-row">
    <span className="info-label">{label}</span>
    <span className="info-value">{value ?? '—'}</span>
  </div>
);

const StockDetailPage = () => {
  const { symbol } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [quote, setQuote] = useState(null);
  const [chartMeta, setChartMeta] = useState(null);
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [inWatchlist, setInWatchlist] = useState(false);

  const fetchQuote = useCallback(async () => {
    if (!symbol) return;
    setLoading(true);
    try {
      const data = await yahooQuote(symbol);
      setQuote(data);
    } catch (err) {
      toast(`Failed to load ${symbol} data`, 'error');
    } finally {
      setLoading(false);
    }
  }, [symbol]);

  // Check if already in watchlist
  const checkWatchlist = useCallback(async () => {
    try {
      const r = await api.get('/dashboard/watchlist');
      setInWatchlist(r.data.some((w) => w.symbol === symbol?.toUpperCase()));
    } catch {}
  }, [symbol]);

  useEffect(() => {
    fetchQuote();
    checkWatchlist();
  }, [fetchQuote, checkWatchlist]);

  const addToWatchlist = async () => {
    if (!quote) return;
    setActionLoading(true);
    try {
      await api.post('/dashboard/watchlist', {
        company: quote.shortName || symbol,
        symbol: symbol.toUpperCase(),
      });
      setInWatchlist(true);
      toast(`${symbol} added to watchlist!`, 'success');
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to add to watchlist';
      toast(msg, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleBuy = async () => {
    if (!quote || qty <= 0) return;
    setActionLoading(true);
    try {
      await api.post('/dashboard/portfolio', {
        company: quote.shortName || symbol,
        symbol: symbol.toUpperCase(),
        quantity: qty,
        buyPrice: quote.regularMarketPrice,
      });
      toast(`Bought ${qty} share(s) of ${symbol} at $${fmt(quote.regularMarketPrice)}`, 'success');
    } catch (err) {
      toast(err.response?.data?.message || 'Buy failed', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSell = async () => {
    if (!quote || qty <= 0) return;
    setActionLoading(true);
    try {
      // Get portfolio to find the holding
      const r = await api.get('/dashboard/portfolio');
      const holding = r.data.find((h) => h.symbol === symbol?.toUpperCase());
      if (!holding) {
        toast(`You don't own ${symbol}`, 'error');
        setActionLoading(false);
        return;
      }
      const newQty = holding.quantity - qty;
      if (newQty < 0) {
        toast(`You only own ${holding.quantity} share(s)`, 'error');
        setActionLoading(false);
        return;
      }
      if (newQty === 0) {
        await api.delete(`/dashboard/portfolio/${holding._id}`);
        toast(`Sold all shares of ${symbol}`, 'success');
      } else {
        await api.put(`/dashboard/portfolio/${holding._id}`, {
          quantity: newQty,
          buyPrice: holding.buyPrice,
        });
        toast(`Sold ${qty} share(s) of ${symbol}`, 'success');
      }
    } catch (err) {
      toast(err.response?.data?.message || 'Sell failed', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const isUp = (quote?.regularMarketChange ?? 0) >= 0;
  const changePct = quote?.regularMarketChangePercent ?? 0;

  if (loading) {
    return (
      <div className="loading-screen">
        <span className="spinner" /> Loading {symbol}…
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="loading-screen" style={{ color: 'var(--red)' }}>
        Could not load data for {symbol}.{' '}
        <button className="btn btn-ghost" onClick={() => navigate(-1)}>Go back</button>
      </div>
    );
  }

  return (
    <div className="stock-detail-grid">
      {/* ── Left: Chart panel ── */}
      <div className="card">
        <div className="stock-detail-header">
          <div className="stock-detail-prices">
            <span className="stock-current-price">
              Current Price: ${fmt(quote.regularMarketPrice)}
            </span>
            <span className="stock-prev-close">
              Previous Close: ${fmt(quote.regularMarketPreviousClose)}
            </span>
            <span className={`stock-pct-change ${isUp ? 'up' : 'down'}`}>
              {isUp ? '+' : ''}{changePct.toFixed(5)} %
            </span>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Price Chart</div>
        </div>
        <StockChart
          symbol={symbol}
          height={300}
          showRanges
          onData={setChartMeta}
        />
      </div>

      {/* ── Right: Info + Buy/Sell panel ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Add to Watchlist */}
        <button
          className={`btn btn-primary btn-full${inWatchlist ? '' : ''}`}
          style={{ background: inWatchlist ? 'var(--bg4)' : undefined }}
          onClick={addToWatchlist}
          disabled={actionLoading || inWatchlist}
        >
          {inWatchlist ? '✓ In WatchList' : 'Add to WatchList.'}
        </button>

        {/* Stock info */}
        <div className="card stock-info-panel">
          <InfoRow label="Currency" value={quote.currency} />
          <InfoRow label="Symbol" value={quote.symbol} />
          <InfoRow label="Exchangename" value={quote.exchangeName || quote.fullExchangeName} />
          <InfoRow label="Exchangetimezonename" value={quote.exchangeTimezoneName} />
          <InfoRow label="Fiftytwoweekhigh" value={quote.fiftyTwoWeekHigh != null ? fmt(quote.fiftyTwoWeekHigh) : '—'} />
          <InfoRow label="Fiftytwoweeklow" value={quote.fiftyTwoWeekLow != null ? fmt(quote.fiftyTwoWeekLow) : '—'} />
          <InfoRow label="Regularmarketdayhigh" value={quote.regularMarketDayHigh != null ? fmt(quote.regularMarketDayHigh) : '—'} />
          <InfoRow label="Regularmarketdaylow" value={quote.regularMarketDayLow != null ? fmt(quote.regularMarketDayLow) : '—'} />
          <InfoRow label="Chartpreviousclose" value={quote.chartPreviousClose != null ? fmt(quote.chartPreviousClose) : (chartMeta?.chartPreviousClose != null ? fmt(chartMeta.chartPreviousClose) : '—')} />
        </div>

        {/* Buy / Sell */}
        <div className="card buy-sell-panel">
          <div>
            <div className="qty-label">Choose quantity:</div>
            <div className="qty-control">
              <button
                className="qty-btn"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
              >−</button>
              <input
                className="qty-input"
                type="number"
                min="1"
                value={qty}
                onChange={(e) => setQty(Math.max(1, Number(e.target.value)))}
              />
              <button className="qty-btn" onClick={() => setQty((q) => q + 1)}>+</button>
            </div>
          </div>
          <div className="buy-sell-note">Please select quantity to Buy/Sell.</div>
          <div className="buy-sell-btns">
            <button
              className="btn btn-green"
              onClick={handleBuy}
              disabled={actionLoading}
            >
              {actionLoading ? <span className="spinner" /> : 'Buy'}
            </button>
            <button
              className="btn btn-red"
              onClick={handleSell}
              disabled={actionLoading}
            >
              Sell
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockDetailPage;
