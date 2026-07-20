import { useEffect, useRef } from 'react';

const PALETTE = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
  '#8b5cf6', '#06b6d4', '#f97316', '#ec4899',
];

/**
 * Props:
 *  items  – [{ label, value }]
 *  size   – canvas size (default 160)
 *  total  – display value in center
 *  label  – display label below total
 */
const DonutChart = ({ items = [], size = 160, total, label = 'Total Investment' }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current || items.length === 0) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const cx = size / 2;
    const cy = size / 2;
    const outerR = size / 2 - 6;
    const innerR = size / 2 - 30;

    const totalVal = items.reduce((s, i) => s + i.value, 0);
    if (totalVal === 0) return;

    let startAngle = -Math.PI / 2;

    items.forEach((item, idx) => {
      const slice = (item.value / totalVal) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, outerR, startAngle, startAngle + slice);
      ctx.closePath();
      ctx.fillStyle = PALETTE[idx % PALETTE.length];
      ctx.fill();

      // Gap
      ctx.save();
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, outerR + 2, startAngle - 0.01, startAngle + 0.01);
      ctx.closePath();
      ctx.fillStyle = 'black';
      ctx.fill();
      ctx.restore();

      startAngle += slice;
    });

    // Donut hole
    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(cx, cy, innerR, 0, Math.PI * 2);
    ctx.fillStyle = 'black';
    ctx.fill();
    ctx.restore();
  }, [items, size]);

  return (
    <div className="donut-wrapper">
      <div className="donut-canvas-wrap">
        <canvas
          ref={canvasRef}
          style={{ width: size, height: size }}
        />
        <div className="donut-center">
          <span className="donut-center-amount">
            {total != null ? (typeof total === 'number' ? `$${total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : total) : ''}
          </span>
          <span className="donut-center-label">{label}</span>
        </div>
      </div>
      <div className="donut-legend">
        {items.map((item, idx) => (
          <div key={item.label} className="donut-legend-item">
            <div
              className="donut-legend-dot"
              style={{ background: PALETTE[idx % PALETTE.length] }}
            />
            {item.label}
          </div>
        ))}
      </div>
    </div>
  );
};

export default DonutChart;
