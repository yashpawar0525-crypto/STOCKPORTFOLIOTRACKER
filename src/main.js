import React from 'react';
import ReactDOM from 'react-dom/client';
import './style.css';
import App from './App.jsx';
import { ToastProvider } from './context/ToastContext.jsx';

ReactDOM.createRoot(document.getElementById('app')).render(
  React.createElement(
    React.StrictMode,
    null,
    React.createElement(ToastProvider, null, React.createElement(App))
  )
);
