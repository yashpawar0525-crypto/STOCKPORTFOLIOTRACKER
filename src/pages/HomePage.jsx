import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const HomePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="home-page">
      {/* Nav */}
      <nav className="home-nav">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 34, height: 34,
              background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
              borderRadius: 9,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16,
            }}
          >🚀</div>
          <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 20, fontWeight: 700 }}>
            Investa
          </span>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          {user ? (
            <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>
              Go to Dashboard →
            </button>
          ) : (
            <>
              <Link to="/login">
                <button className="btn btn-secondary">Log In</button>
              </Link>
              <Link to="/signup">
                <button className="btn btn-primary">Get Started</button>
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero */}
      <section className="home-hero">
        <div className="home-badge">
          <span>📈</span> Real-time Yahoo Finance Data
        </div>
        <h1>
          Invest Smarter.<br />
          Track <span>Everything.</span>
        </h1>
        <p>
          Monitor your portfolio in real-time, track watchlists with live prices,
          analyze asset allocation, and make confident buy/sell decisions — all in one beautiful dashboard.
        </p>
        <div className="home-btns">
          <Link to="/signup">
            <button className="btn btn-primary" style={{ fontSize: 15, padding: '13px 28px' }}>
              Start for Free →
            </button>
          </Link>
          <Link to="/login">
            <button className="btn btn-secondary" style={{ fontSize: 15, padding: '13px 28px' }}>
              Sign In
            </button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <div className="home-features">
        <div className="feature-card">
          <div className="feature-icon">📊</div>
          <h3>Live Price Charts</h3>
          <p>Visualize stock price movements with interactive intraday and historical charts powered by Yahoo Finance.</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">👁️</div>
          <h3>Smart Watchlist</h3>
          <p>Track your favorite stocks with real-time prices and instant change indicators. Add and remove with one click.</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">💼</div>
          <h3>Portfolio P&amp;L</h3>
          <p>Track your holdings with live profit &amp; loss calculations. Know exactly how your investments are performing.</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">🔍</div>
          <h3>Stock Search</h3>
          <p>Search any stock or ETF from the top bar. Get instant results from Yahoo Finance with exchange information.</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">🥧</div>
          <h3>Asset Allocation</h3>
          <p>Visualize your portfolio diversification with a beautiful donut chart showing allocation by ticker.</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">⚡</div>
          <h3>Buy &amp; Sell</h3>
          <p>Execute paper trades directly from the dashboard. Update your portfolio holdings with real market prices.</p>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
