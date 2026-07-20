import { useEffect, useState } from 'react';
import api from '../api';

const WatchlistPage = () => {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ company: '', symbol: '' });

  const loadWatchlist = async () => {
    const response = await api.get('/dashboard/watchlist');
    setItems(response.data);
  };

  useEffect(() => {
    loadWatchlist();
  }, []);

  const handleChange = (event) => {
    setForm({ ...form, [event.target.name]: event.target.value });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    await api.post('/dashboard/watchlist', form);
    setForm({ company: '', symbol: '' });
    loadWatchlist();
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="stack-form">
        <input name="company" placeholder="Company" required value={form.company} onChange={handleChange} />
        <input name="symbol" placeholder="Symbol" required value={form.symbol} onChange={handleChange} />
        <button className="primary-btn" type="submit">Add to Watchlist</button>
      </form>
      <div className="stats-grid" style={{ marginTop: '16px' }}>
        {items.map((item) => (
          <div className="card" key={item._id}>
            <strong>{item.company}</strong>
            <p>{item.symbol}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WatchlistPage;
