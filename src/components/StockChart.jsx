import { useEffect, useRef, useState, useCallback } from 'react';
import { yahooChart } from '../api';

const RANGE_OPTIONS = [
  { label: '1D', range: '1d', interval: '5m' },
  { label: '5D', range: '5d', interval: '15m' },
  { label: '1M', range: '1mo', interval: '1d' },
  { label: '3M', range: '3mo', interval: '1d' },
  { label: '6M', range: '6mo', interval: '1wk' },
  { label: '1Y', range: '1y', interval: '1wk' },
];

/**
 * Renders a smooth area chart using Canvas 2D.
 * Props:
 *  symbol      – stock ticker (e.g. 'AAPL')
 *  height      – canvas height in px (default 200)
 *  showRanges  – show range selector tabs (default true)
 *  defaultRange – '1d' | '5d' | '1mo' | ... (default '1d')
 *  onData      – callback(data) fired when chart data loads
 */
const StockChart = ({
  symbol,
  height = 200,
  showRanges = true,
  defaultRange = '1d',
  onData,
}) => {
  const canvasRef = useRef(null);
  const [range, setRange] = useState(defaultRange);
  const [points, setPoints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tooltip, setTooltip] = useState(null);

  const fetchChart = useCallback(async () => {
    if (!symbol) return;
    setLoading(true);
    setError(null);
    try {
      const opt = RANGE_OPTIONS.find((r) => r.range === range) || RANGE_OPTIONS[0];
      const data = await yahooChart(symbol, range, opt.interval);
      setPoints(data.points || []);
      if (onData) onData(data);
    } catch (err) {
      setError('Failed to load chart data');
    } finally {
      setLoading(false);
    }
  }, [symbol, range, onData]);

  useEffect(() => { fetchChart(); }, [fetchChart]);

  useEffect(() => {
    if (!canvasRef.current || points.length < 2) return;
    drawChart(canvasRef.current, points, tooltip);
  }, [points, tooltip]);

  const handleMouseMove = (e) => {
    if (!canvasRef.current || points.length < 2) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const w = rect.width;
    const idx = Math.round(((mx / w) * (points.length - 1)));
    const clamped = Math.max(0, Math.min(points.length - 1, idx));
    setTooltip({ idx: clamped, x: (clamped / (points.length - 1)) * w });
  };

  const handleMouseLeave = () => setTooltip(null);

  return (
    <div className="chart-container">
      {showRanges && (
        <div className="chart-range-tabs">
          {RANGE_OPTIONS.map((opt) => (
            <button
              key={opt.range}
              className={`range-tab${range === opt.range ? ' active' : ''}`}
              onClick={() => setRange(opt.range)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}

      {loading && (
        <div className="chart-loading">
          <span className="spinner" />
          Loading chart…
        </div>
      )}

      {error && !loading && (
        <div className="chart-loading" style={{ color: 'var(--red)' }}>
          {error}
        </div>
      )}

      {!loading && !error && points.length > 1 && (
        <div style={{ position: 'relative', paddingTop: 10, paddingBottom: 4 }}>
          {tooltip && (
            <div
              style={{
                position: 'absolute',
                left: tooltip.x,
                top: 0,
                transform: 'translateX(-50%)',
                background: 'var(--bg4)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                padding: '4px 10px',
                fontSize: 12,
                color: 'var(--text)',
                fontWeight: 600,
                pointerEvents: 'none',
                zIndex: 10,
                whiteSpace: 'nowrap',
              }}
            >
              ${points[tooltip.idx]?.price?.toFixed(2)}
            </div>
          )}
          <canvas
            ref={canvasRef}
            width={900}
            height={height}
            className="chart-canvas"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{ cursor: 'crosshair' }}
          />
        </div>
      )}
    </div>
  );
};

function drawChart(canvas, points, tooltip) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;

  const prices = points.map((p) => p.price);
  const minP = Math.min(...prices);
  const maxP = Math.max(...prices);
  const range = maxP - minP || 1;

  const padLeft = 0;
  const padRight = 0;
  const padTop = 10;
  const padBottom = 10;

  const xScale = (i) => padLeft + (i / (points.length - 1)) * (W - padLeft - padRight);
  const yScale = (v) => padTop + ((maxP - v) / range) * (H - padTop - padBottom);

  ctx.clearRect(0, 0, W, H);

  const isUp = prices[prices.length - 1] >= prices[0];
  const lineColor = isUp ? '#10b981' : '#ef4444';
  const fillStart = isUp ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)';
  const fillEnd = isUp ? 'rgba(16,185,129,0)' : 'rgba(239,68,68,0)';

  // Build path
  ctx.beginPath();
  ctx.moveTo(xScale(0), yScale(prices[0]));
  for (let i = 1; i < points.length; i++) {
    const x0 = xScale(i - 1);
    const y0 = yScale(prices[i - 1]);
    const x1 = xScale(i);
    const y1 = yScale(prices[i]);
    const cx = (x0 + x1) / 2;
    ctx.bezierCurveTo(cx, y0, cx, y1, x1, y1);
  }

  // Fill gradient
  const grad = ctx.createLinearGradient(0, padTop, 0, H);
  grad.addColorStop(0, fillStart);
  grad.addColorStop(1, fillEnd);

  ctx.save();
  ctx.lineTo(xScale(points.length - 1), H);
  ctx.lineTo(xScale(0), H);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.restore();

  // Line
  ctx.beginPath();
  ctx.moveTo(xScale(0), yScale(prices[0]));
  for (let i = 1; i < points.length; i++) {
    const x0 = xScale(i - 1);
    const y0 = yScale(prices[i - 1]);
    const x1 = xScale(i);
    const y1 = yScale(prices[i]);
    const cx = (x0 + x1) / 2;
    ctx.bezierCurveTo(cx, y0, cx, y1, x1, y1);
  }
  ctx.strokeStyle = lineColor;
  ctx.lineWidth = 2.5;
  ctx.lineJoin = 'round';
  ctx.stroke();

  // Tooltip crosshair
  if (tooltip && tooltip.idx >= 0 && tooltip.idx < points.length) {
    const tx = xScale(tooltip.idx);
    const ty = yScale(prices[tooltip.idx]);

    // Vertical line
    ctx.beginPath();
    ctx.moveTo(tx, padTop);
    ctx.lineTo(tx, H - padBottom);
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.stroke();
    ctx.setLineDash([]);

    // Dot
    ctx.beginPath();
    ctx.arc(tx, ty, 5, 0, Math.PI * 2);
    ctx.fillStyle = lineColor;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(tx, ty, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();
  }
}

export default StockChart;
