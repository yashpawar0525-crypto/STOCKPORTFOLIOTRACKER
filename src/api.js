import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Yahoo Finance helpers ──────────────────────────────────────────────────
export const yahooSearch = (query) =>
  api.get(`/yahoo/search?q=${encodeURIComponent(query)}`).then((r) => r.data);

export const yahooQuote = (symbol) =>
  api.get(`/yahoo/quote?symbol=${encodeURIComponent(symbol)}`).then((r) => r.data);

export const yahooQuotes = (symbols) =>
  api.get(`/yahoo/quotes?symbols=${encodeURIComponent(symbols.join(','))}`).then((r) => r.data);

export const yahooChart = (symbol, range = '1d', interval = '5m') =>
  api
    .get(`/yahoo/chart?symbol=${encodeURIComponent(symbol)}&range=${range}&interval=${interval}`)
    .then((r) => r.data);

export default api;
