#!/usr/bin/env node

/**
 * Smart start script that chooses the right entry point:
 * - On Render (RENDER env var set): use render.js
 * - Local development: use src/server.js
 */

if (process.env.RENDER || process.env.NODE_ENV === 'production') {
  // Render deployment - use render.js which handles MongoDB + fallback
  console.log('Starting Render deployment server (render.js)...');
  require('./render.js');
} else {
  // Local development - use src/server.js
  console.log('Starting local development server (src/server.js)...');
  require('./src/server.js');
}

