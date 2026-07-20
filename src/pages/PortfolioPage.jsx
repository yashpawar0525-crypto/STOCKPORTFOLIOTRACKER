import { useEffect, useState } from 'react';
import api from '../api';

const PortfolioPage = () => {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ company: '', symbol: '', quantity: '', buyPrice: '' });

  const loadPortfolio = async () => {
    const response = await api.get('/dashboard/portfolio');
    setItems(response.data);
  };

  useEffect(() => {
    loadPortfolio();
  }, []);

  const handleChange = (event) => {
    setForm({ ...form, [event.target.name]: event.target.value });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    await api.post('/dashboard/portfolio', {
      ...form,
      quantity: Number(form.quantity),
      buyPrice: Number(form.buyPrice),
    });
    setForm({ company: '', symbol: '', quantity: '', buyPrice: '' });
    loadPortfolio();
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="stack-form">
        <input name="company" placeholder="Company" required value={form.company} onChange={handleChange} />
        <input name="symbol" placeholder="Symbol" required value={form.symbol} onChange={handleChange} />
        <input name="quantity" type="number" placeholder="Quantity" required value={form.quantity} onChange={handleChange} />
        <input name="buyPrice" type="number" step="0.01" placeholder="Buy Price" required value={form.buyPrice} onChange={handleChange} />
        <button className="primary-btn" type="submit">Add Holding</button>
      </form>
      <div className="stats-grid" style={{ marginTop: '16px' }}>
        {items.map((item) => (
          <div className="card" key={item._id}>
            <strong>{item.company}</strong>
            <p>{item.symbol} • Qty {item.quantity} • Buy ₹{item.buyPrice}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PortfolioPage;
