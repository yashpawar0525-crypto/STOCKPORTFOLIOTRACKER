import { Link } from 'react-router-dom';

const HomePage = () => {
  return (
    <div className="page">
      <header className="topbar">
        <div>
          <h1>Stock Portfolio Tracker</h1>
          <p>Track your holdings, stay on top of your watchlist, and monitor growth from one place.</p>
        </div>
        <div className="topbar-actions">
          <Link className="secondary-btn" to="/login">Login</Link>
          <Link className="primary-btn" to="/signup">Sign Up</Link>
        </div>
      </header>
      <section className="hero-card">
        <div>
          <h2>Manage your investments with confidence</h2>
          <p>Create a modern dashboard for portfolio insights and watchlist management.</p>
          <Link className="primary-btn" to="/signup">Get Started</Link>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
