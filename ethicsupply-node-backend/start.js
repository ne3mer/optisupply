#!/usr/bin/env node

const PORT = Number(process.env.PORT) || 8080;

console.log(`Starting OptiSupply server on port ${PORT}...`);

const startServer = require('./src/server.js');

startServer()
  .then((app) => {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`API accessible at http://localhost:${PORT}/api`);
    });
  })
  .catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
