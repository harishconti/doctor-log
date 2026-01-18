import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
// Import theme store to initialize theme on app start
import './store/themeStore';

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}
