import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import DashboardLayout from './pages/DashboardLayout';
import DashboardOverviewPage from './pages/DashboardOverviewPage';
import PortfolioPage from './pages/PortfolioPage';
import WatchlistPage from './pages/WatchlistPage';
import AnalyticsPage from './pages/AnalyticsPage';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return <p>Loading...</p>;
  return user ? children : <Navigate to="/login" replace />;
};

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardOverviewPage />} />
          <Route path="portfolio" element={<PortfolioPage />} />
          <Route path="watchlist" element={<WatchlistPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

const AppWrapper = () => (
  <AuthProvider>
    <App />
  </AuthProvider>
);

export default AppWrapper;
