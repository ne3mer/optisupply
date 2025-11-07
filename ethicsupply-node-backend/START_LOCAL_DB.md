# Starting OptiSupply with MongoDB (Local Development)

## Problem
You're seeing mock/demo data instead of real database data because `dev-server.js` only serves mock data.

## Solution

### Step 1: Start MongoDB

Open a **new terminal** and run:

```bash
# Start MongoDB (runs in foreground)
mongod --dbpath ~/data/db

# OR if you installed via Homebrew:
brew services start mongodb-community
```

**Note**: If the `~/data/db` directory doesn't exist, create it first:
```bash
mkdir -p ~/data/db
```

### Step 2: Verify MongoDB is Running

```bash
# Check if MongoDB is running
pgrep -l mongod

# OR test connection
mongosh
# You should see: "Connected to: mongodb://127.0.0.1:27017"
# Type "exit" to quit
```

### Step 3: Use the REAL Server

Instead of `dev-server.js`, use `src/server.js`:

```bash
cd ethicsupply-node-backend

# Use the real server (reads from MongoDB)
npm start

# OR for development with auto-reload:
npm run dev
```

**Important**: Make sure to update `package.json` if needed:
```json
{
  "scripts": {
    "start": "node src/server.js",
    "dev": "nodemon src/server.js"
  }
}
```

### Step 4: Seed the Database with Real Data

In another terminal (while server is running):

```bash
cd ethicsupply-node-backend

# Seed all data
node src/scripts/seedDatabase.js

# OR use the npm script (if available)
npm run seed
```

This will populate your database with:
- ✅ Suppliers (from CSV data)
- ✅ Settings
- ✅ Recommendations
- ✅ Risks
- ✅ Other sample data

### Step 5: Verify Real Data is Loaded

1. Go to http://localhost:8000/api/suppliers
2. You should see **real supplier data** (not "Mock Supplier 1, 2, 3")

## What's the Difference?

### `dev-server.js` (Mock Data - ❌ Don't use)
- Returns hardcoded mock data
- No database connection
- Good for testing frontend without MongoDB
- **This is what you were using!**

### `src/server.js` (Real Database - ✅ Use this)
- Connects to MongoDB
- Reads/writes real data
- Supports all features
- **This is what you should use!**

## Troubleshooting

### MongoDB won't start
```bash
# Check if MongoDB is installed
mongod --version

# If not installed (macOS with Homebrew):
brew install mongodb-community

# Start MongoDB service
brew services start mongodb-community
```

### "Connection refused" error
- MongoDB is not running
- Run: `brew services start mongodb-community`
- OR: `mongod --dbpath ~/data/db` in a separate terminal

### "Auth failed" error
- Check your MONGODB_URI in `.env`
- For local dev, use: `mongodb://localhost:27017/ethicsupply`
- No username/password needed for local

### Still seeing mock data
- Make sure you're running `npm start` (not `node dev-server.js`)
- Check the terminal output - should say "MongoDB Connected"
- Verify you seeded the database

## Quick Start Commands

```bash
# Terminal 1: Start MongoDB
brew services start mongodb-community

# Terminal 2: Start the server
cd ethicsupply-node-backend
npm start

# Terminal 3: Seed database (first time only)
cd ethicsupply-node-backend
node src/scripts/seedDatabase.js

# Terminal 4: Start frontend
cd ethicsupply-frontend
npm run dev
```

## Environment Variables (.env file created)

The `.env` file has been created with:
```
MONGODB_URI=mongodb://localhost:27017/ethicsupply
NODE_ENV=development
PORT=8000
```

You're all set! 🚀

