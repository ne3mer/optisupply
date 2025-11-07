# ✅ Switch from Mock Data to Real MongoDB Database

## Current Status
- ✅ MongoDB is **RUNNING** on your system
- ✅ `.env` file created (but blocked from edit, use the command below if needed)
- ✅ `package.json` updated to use real server

## Quick Fix (3 Steps)

### Step 1: Stop Current Server
If you have a server running, **stop it** (Ctrl+C in the terminal)

### Step 2: Seed the Database (First Time Only)
```bash
cd "/Users/nimaafsharfar/Desktop/latest files thesis/code/optisupply/ethicsupply-node-backend"

# Seed the database with real data
npm run seed
```

**This will load**:
- ✅ Real suppliers from `data/suppliers_seed.csv`
- ✅ Settings
- ✅ Recommendations
- ✅ Other sample data

### Step 3: Start the REAL Server
```bash
# Start with MongoDB connection
npm start

# OR for development with auto-reload:
npm run dev
```

**You should see**:
```
Attempting to connect to MongoDB at mongodb://localhost:27017/ethicsupply
MongoDB Connected: localhost
✓ Server running on port 8000
```

### Step 4: Verify Real Data
1. Open: http://localhost:8000/api/suppliers
2. You should see **REAL suppliers** (not "Mock Supplier 1, 2, 3")

## New npm Scripts Available

```bash
npm start          # Run real server with MongoDB
npm run dev        # Run with auto-reload (nodemon)
npm run dev:mock   # Run mock server (old behavior)
npm run seed       # Seed database with real data
npm run start:render # For Render deployment
```

## Create .env File (If Not Created)

If the .env file wasn't created, create it manually:

```bash
cat > "/Users/nimaafsharfar/Desktop/latest files thesis/code/optisupply/ethicsupply-node-backend/.env" << 'EOF'
# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/ethicsupply

# Environment
NODE_ENV=development

# Port
PORT=8000

# Admin Key
ADMIN_API_KEY=admin-dev-key
EOF
```

## Troubleshooting

### Still seeing mock data?
- Make sure you ran `npm run seed`
- Check terminal output for "MongoDB Connected"
- Restart the server: `npm start`

### Connection error?
```bash
# Check if MongoDB is running
brew services list | grep mongodb

# If not running, start it:
brew services start mongodb-community
```

### Database is empty?
```bash
# Re-seed the database
npm run seed
```

## What Changed?

### Before (Mock Data):
- `package.json` used `dev-server.js` and `render.js`
- Both serve **hardcoded mock data**
- No database connection

### After (Real Database):
- `package.json` uses `src/server.js`
- Connects to **MongoDB**
- Reads/writes **real data**

## Summary

```bash
# 1. Seed database (first time only)
cd ethicsupply-node-backend
npm run seed

# 2. Start server
npm start

# 3. Visit
# http://localhost:8000/api/suppliers
```

You're now using **REAL DATA**! 🎉

