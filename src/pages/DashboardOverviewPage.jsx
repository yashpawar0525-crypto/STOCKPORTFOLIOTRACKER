import { useEffect, useState } from 'react';
import api from '../api';

const DashboardOverviewPage = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get('/dashboard/overview')
      .then((response) => setData(response.data))
      .catch(() => setData(null));
  }, []);

  if (!data) {
    return <p>Loading overview...</p>;
  }

  return (
    <div className="stats-grid">
      <div className="stat-card">
        <h4>Total Invested</h4>
        <p>₹{data.overview.totalInvested.toFixed(2)}</p>
      </div>
      <div className="stat-card">
        <h4>Current Value</h4>
        <p>₹{data.overview.currentValue.toFixed(2)}</p>
      </div>
      <div className="stat-card">
        <h4>Gain/Loss</h4>
        <p>₹{data.overview.gain.toFixed(2)} ({data.overview.gainPercent}%)</p>
      </div>
      <div className="stat-card">
        <h4>Watchlist Items</h4>
        <p>{data.overview.watchlistCount}</p>
      </div>
    </div>
  );
};

export default DashboardOverviewPage;
