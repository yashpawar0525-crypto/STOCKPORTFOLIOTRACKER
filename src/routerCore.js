const routes = {
  '/': { view: 'home' },
  '/login': { view: 'login' },
  '/signup': { view: 'signup' },
  '/dashboard': { view: 'dashboard' },
  '/dashboard/portfolio': { view: 'portfolio' },
  '/dashboard/watchlist': { view: 'watchlist' },
  '/dashboard/analytics': { view: 'analytics' },
};

const getPath = () => window.location.pathname;

const renderView = (root, viewName) => {
  const views = {
    home: renderHomeView,
    login: renderLoginView,
    signup: renderSignupView,
    dashboard: renderDashboardView,
    portfolio: renderPortfolioView,
    watchlist: renderWatchlistView,
    analytics: renderAnalyticsView,
  };

  const render = views[viewName];
  if (render) {
    root.innerHTML = '';
    render(root);
  } else {
    window.location.hash = '#/';
  }
};

const navigateTo = (path) => {
  window.history.pushState({}, '', path);
  const route = routes[path] || routes['/'];
  renderView(document.querySelector('#app'), route.view);
};

const bindEvents = () => {
  window.addEventListener('popstate', () => {
    const route = routes[getPath()] || routes['/'];
    renderView(document.querySelector('#app'), route.view);
  });
};

export const createRouter = (root) => ({
  init() {
    bindEvents();
    const route = routes[getPath()] || routes['/'];
    renderView(root, route.view);
  },
  navigate(path) {
    navigateTo(path);
  },
});

function renderHomeView(root) {
  const html = `
    <div class="page home-page">
      <header class="topbar">
        <div>
          <h1>Stock Portfolio Tracker</h1>
          <p>Monitor your investments with a simple and polished dashboard.</p>
        </div>
        <div class="topbar-actions">
          <button class="secondary-btn" data-route="/login">Login</button>
          <button class="primary-btn" data-route="/signup">Sign Up</button>
        </div>
      </header>
      <section class="hero-card">
        <div>
          <h2>Track your portfolio in one place</h2>
          <p>Create a watchlist, manage holdings, and view your portfolio summary from anywhere.</p>
          <button class="primary-btn" data-route="/signup">Get Started</button>
        </div>
      </section>
    </div>
  `;
  root.innerHTML = html;
  root.querySelectorAll('[data-route]').forEach((btn) => {
    btn.addEventListener('click', () => navigateTo(btn.getAttribute('data-route')));
  });
}

function renderLoginView(root) {
  root.innerHTML = `
    <div class="auth-card">
      <h2>Welcome Back</h2>
      <form id="login-form">
        <input name="email" type="email" placeholder="Email" required />
        <input name="password" type="password" placeholder="Password" required />
        <button class="primary-btn" type="submit">Login</button>
      </form>
      <p class="link-text">Need an account? <a href="/signup" data-route="/signup">Create one</a></p>
    </div>
  `;

  const form = root.querySelector('#login-form');
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const payload = Object.fromEntries(new FormData(form));
    try {
      const response = await window.api.post('/auth/login', payload);
      localStorage.setItem('token', response.data.token);
      window.appState.user = response.data.user;
      navigateTo('/dashboard');
    } catch (error) {
      alert(error.response?.data?.message || 'Login failed');
    }
  });

  root.querySelectorAll('[data-route]').forEach((btn) => {
    btn.addEventListener('click', () => navigateTo(btn.getAttribute('data-route')));
  });
}

function renderSignupView(root) {
  root.innerHTML = `
    <div class="auth-card">
      <h2>Create Your Account</h2>
      <form id="signup-form">
        <input name="name" type="text" placeholder="Full name" required />
        <input name="email" type="email" placeholder="Email" required />
        <input name="password" type="password" placeholder="Password" required />
        <button class="primary-btn" type="submit">Sign Up</button>
      </form>
      <p class="link-text">Already have an account? <a href="/login" data-route="/login">Login</a></p>
    </div>
  `;

  const form = root.querySelector('#signup-form');
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const payload = Object.fromEntries(new FormData(form));
    try {
      const response = await window.api.post('/auth/register', payload);
      localStorage.setItem('token', response.data.token);
      window.appState.user = response.data.user;
      navigateTo('/dashboard');
    } catch (error) {
      alert(error.response?.data?.message || 'Signup failed');
    }
  });

  root.querySelectorAll('[data-route]').forEach((btn) => {
    btn.addEventListener('click', () => navigateTo(btn.getAttribute('data-route')));
  });
}

function renderDashboardView(root) {
  const html = `
    <div class="dashboard-shell">
      <aside class="sidebar">
        <h3>Menu</h3>
        <button class="sidebar-link" data-route="/dashboard">Overview</button>
        <button class="sidebar-link" data-route="/dashboard/portfolio">Portfolio</button>
        <button class="sidebar-link" data-route="/dashboard/watchlist">Watchlist</button>
        <button class="sidebar-link" data-route="/dashboard/analytics">Analytics</button>
        <button class="sidebar-link" data-route="/">Logout</button>
      </aside>
      <main class="dashboard-content">
        <div class="dashboard-header">
          <h2>Dashboard Overview</h2>
          <p>Welcome back, ${window.appState.user?.name || 'investor'}.</p>
        </div>
        <div id="dashboard-area"></div>
      </main>
    </div>
  `;
  root.innerHTML = html;
  root.querySelectorAll('[data-route]').forEach((btn) => {
    if (btn.textContent.trim() === 'Logout') {
      btn.addEventListener('click', () => {
        localStorage.removeItem('token');
        window.appState.user = null;
        navigateTo('/');
      });
    } else {
      btn.addEventListener('click', () => navigateTo(btn.getAttribute('data-route')));
    }
  });
  loadDashboardData();
}

async function loadDashboardData() {
  const area = document.querySelector('#dashboard-area');
  if (!area) return;

  try {
    const response = await window.api.get('/dashboard/overview');
    const data = response.data;
    area.innerHTML = `
      <div class="stats-grid">
        <div class="stat-card">
          <h4>Total Invested</h4>
          <p>$${data.overview.totalInvested.toFixed(2)}</p>
        </div>
        <div class="stat-card">
          <h4>Current Value</h4>
          <p>$${data.overview.currentValue.toFixed(2)}</p>
        </div>
        <div class="stat-card">
          <h4>Gain/Loss</h4>
          <p>${data.overview.gain.toFixed(2)} (${data.overview.gainPercent}%)</p>
        </div>
        <div class="stat-card">
          <h4>Portfolio Items</h4>
          <p>${data.overview.portfolioCount}</p>
        </div>
      </div>
    `;
  } catch (error) {
    area.innerHTML = '<p>Unable to load dashboard data.</p>';
  }
}

function renderPortfolioView(root) {
  const html = `
    <div class="dashboard-shell">
      <aside class="sidebar">
        <h3>Menu</h3>
        <button class="sidebar-link" data-route="/dashboard">Overview</button>
        <button class="sidebar-link" data-route="/dashboard/portfolio">Portfolio</button>
        <button class="sidebar-link" data-route="/dashboard/watchlist">Watchlist</button>
        <button class="sidebar-link" data-route="/dashboard/analytics">Analytics</button>
      </aside>
      <main class="dashboard-content">
        <h2>Portfolio</h2>
        <form id="portfolio-form" class="stack-form">
          <input name="company" placeholder="Company" required />
          <input name="symbol" placeholder="Symbol" required />
          <input name="quantity" type="number" placeholder="Quantity" required />
          <input name="buyPrice" type="number" step="0.01" placeholder="Buy Price" required />
          <button class="primary-btn" type="submit">Add Holding</button>
        </form>
        <div id="portfolio-area"></div>
      </main>
    </div>
  `;
  root.innerHTML = html;
  root.querySelectorAll('[data-route]').forEach((btn) => {
    btn.addEventListener('click', () => navigateTo(btn.getAttribute('data-route')));
  });
  document.querySelector('#portfolio-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const payload = Object.fromEntries(new FormData(event.target));
    try {
      await window.api.post('/dashboard/portfolio', { ...payload, quantity: Number(payload.quantity), buyPrice: Number(payload.buyPrice) });
      event.target.reset();
      loadPortfolioData();
    } catch (error) {
      alert(error.response?.data?.message || 'Unable to add holding');
    }
  });
  loadPortfolioData();
}

async function loadPortfolioData() {
  const area = document.querySelector('#portfolio-area');
  if (!area) return;

  try {
    const response = await window.api.get('/dashboard/portfolio');
    const items = response.data;
    area.innerHTML = items.length ? items.map((item) => `
      <div class="card">
        <strong>${item.company}</strong>
        <p>${item.symbol} • Qty ${item.quantity} • Buy $${item.buyPrice}</p>
      </div>
    `).join('') : '<p>No holdings yet.</p>';
  } catch (error) {
    area.innerHTML = '<p>Unable to load portfolio.</p>';
  }
}

function renderWatchlistView(root) {
  const html = `
    <div class="dashboard-shell">
      <aside class="sidebar">
        <h3>Menu</h3>
        <button class="sidebar-link" data-route="/dashboard">Overview</button>
        <button class="sidebar-link" data-route="/dashboard/portfolio">Portfolio</button>
        <button class="sidebar-link" data-route="/dashboard/watchlist">Watchlist</button>
        <button class="sidebar-link" data-route="/dashboard/analytics">Analytics</button>
      </aside>
      <main class="dashboard-content">
        <h2>Watchlist</h2>
        <form id="watchlist-form" class="stack-form">
          <input name="company" placeholder="Company" required />
          <input name="symbol" placeholder="Symbol" required />
          <button class="primary-btn" type="submit">Add to Watchlist</button>
        </form>
        <div id="watchlist-area"></div>
      </main>
    </div>
  `;
  root.innerHTML = html;
  root.querySelectorAll('[data-route]').forEach((btn) => {
    btn.addEventListener('click', () => navigateTo(btn.getAttribute('data-route')));
  });
  document.querySelector('#watchlist-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const payload = Object.fromEntries(new FormData(event.target));
    try {
      await window.api.post('/dashboard/watchlist', payload);
      event.target.reset();
      loadWatchlistData();
    } catch (error) {
      alert(error.response?.data?.message || 'Unable to add watchlist item');
    }
  });
  loadWatchlistData();
}

async function loadWatchlistData() {
  const area = document.querySelector('#watchlist-area');
  if (!area) return;

  try {
    const response = await window.api.get('/dashboard/watchlist');
    const items = response.data;
    area.innerHTML = items.length ? items.map((item) => `
      <div class="card">
        <strong>${item.company}</strong>
        <p>${item.symbol}</p>
      </div>
    `).join('') : '<p>No watchlist items yet.</p>';
  } catch (error) {
    area.innerHTML = '<p>Unable to load watchlist.</p>';
  }
}

function renderAnalyticsView(root) {
  const html = `
    <div class="dashboard-shell">
      <aside class="sidebar">
        <h3>Menu</h3>
        <button class="sidebar-link" data-route="/dashboard">Overview</button>
        <button class="sidebar-link" data-route="/dashboard/portfolio">Portfolio</button>
        <button class="sidebar-link" data-route="/dashboard/watchlist">Watchlist</button>
        <button class="sidebar-link" data-route="/dashboard/analytics">Analytics</button>
      </aside>
      <main class="dashboard-content">
        <h2>Analytics</h2>
        <p class="card">Your analytics page is ready for future charts and stock insights.</p>
      </main>
    </div>
  `;
  root.innerHTML = html;
  root.querySelectorAll('[data-route]').forEach((btn) => {
    btn.addEventListener('click', () => navigateTo(btn.getAttribute('data-route')));
  });
}
