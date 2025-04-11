#!/bin/bash

# Print Node.js version for debugging
echo "Using Node.js version:"
node -v

# Install dependencies
npm install

# Run build
npm run build

# Verify dist directory exists
if [ -d "dist" ]; then
  echo "Build successful! dist directory created."
  ls -la dist
else
  echo "Build failed! dist directory does not exist."
  exit 1
fi 