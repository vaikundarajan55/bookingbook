import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { MotionConfig } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
import { store } from './store/index.js';
import App from './App.jsx';
import ErrorBoundary from './components/ui/ErrorBoundary.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <Provider store={store}>
        <BrowserRouter>
          {/* reducedMotion="user" makes every framer-motion animation respect the OS setting */}
          <MotionConfig reducedMotion="user">
            <App />
            <Toaster position="top-right" toastOptions={{ style: { background: '#0B2A3B', color: '#fff', fontSize: '14px', fontWeight: 600 } }} />
          </MotionConfig>
        </BrowserRouter>
      </Provider>
    </ErrorBoundary>
  </React.StrictMode>,
);
