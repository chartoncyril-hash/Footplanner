import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { globalCSS } from './styles/styles';

// Injection unique du CSS global
const styleEl = document.createElement('style');
styleEl.textContent = globalCSS + `
  /* Fond sombre forcé partout (au cas où) */
  html, body, #root {
    background: #050810 !important;
    color: #f1f5f9;
    margin: 0;
    padding: 0;
    min-height: 100vh;
  }
  body * {
    color: inherit;
  }
`;
document.head.appendChild(styleEl);

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);