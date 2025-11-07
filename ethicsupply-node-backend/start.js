#!/usr/bin/env node

/**
 * Smart start script that chooses the right entry point:
 * - On Render (RENDER env var set) or production: use render.js
 * - Local development: use src/server.js
 */

// Check if we're on Render or in production
const isRender = process.env.RENDER === 'true' || process.env.RENDER === '1';
const isProduction = process.env.NODE_ENV === 'production';

if (isRender || isProduction) {
  // Render deployment - use render.js which handles MongoDB + fallback
  console.log('Starting Render deployment server (render.js)...');
  const renderModule = require('./render.js');
  // Call setupServer to start the server
  if (typeof renderModule.setupServer === 'function') {
    renderModule.setupServer().catch((err) => {
      console.error('Fatal error starting server:', err);
      process.exit(1);
    });
  }
} else {
  // Local development - use src/server.js
  console.log('Starting local development server (src/server.js)...');
  require('./src/server.js');
}

