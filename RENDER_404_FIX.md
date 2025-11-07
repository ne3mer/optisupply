# Render 404 Errors - Root Cause & Fix

## Problem

Getting 404 errors on Render deployment:
- `GET https://optisupply.onrender.com/api/settings 404 (Not Found)`
- `GET https://optisupply.onrender.com/api/bands 404 (Not Found)`
- `GET https://optisupply.onrender.com/api/dataset/meta 404 (Not Found)`

## Root Cause Analysis

### Investigation Steps

1. **Initial assumption**: Routes not registered correctly in `render.js`
   - ❌ Routes WERE registered correctly in `render.js` (lines 73-81)
   - ❌ Mock fallbacks WERE implemented in `render.js`
   - ❌ Controllers WERE made resilient to database errors

2. **The actual problem**: **Wrong entry point!**
   - `package.json` had: `"start": "node src/server.js"`
   - Render runs `npm start` by default
   - All our fixes were in `render.js`, but Render was running `src/server.js`!

## The Fix

### Changed Files

**`ethicsupply-node-backend/package.json`**:
```json
{
  "main": "render.js",  // Changed from "src/server.js"
  "scripts": {
    "start": "node render.js",  // Changed from "node src/server.js"
    "dev": "nodemon dev-server.js",
    "test": "jest --runInBand"
  }
}
```

### Why This Fixes It

1. **Render deployment flow**:
   - Render clones the repo
   - Runs `npm install`
   - Runs `npm start` (unless configured otherwise)

2. **Before the fix**:
   ```
   npm start → node src/server.js
   ❌ src/server.js doesn't have early route registration
   ❌ src/server.js doesn't have mock fallbacks
   ❌ src/server.js doesn't have resilient controllers
   ```

3. **After the fix**:
   ```
   npm start → node render.js
   ✅ render.js has early route registration (lines 73-81)
   ✅ render.js has mock fallbacks (setupMockRoutes function)
   ✅ render.js has resilient error handling
   ```

## What render.js Does

### 1. Early Route Registration (Before MongoDB)
```javascript
// Lines 66-81: Always register critical routes early
const settingsController = require("./src/controllers/settingsController");
const bandsController = require("./src/controllers/bandsController");
const datasetController = require("./src/controllers/datasetController");

app.get("/api/settings", settingsController.getSettings);
app.put("/api/settings", settingsController.updateSettings);
app.post("/api/settings/reset", settingsController.resetSettings);
app.get("/api/bands", bandsController.getBands);
app.get("/api/dataset/meta", datasetController.getDatasetMeta);
```

### 2. Resilient Controllers
- `settingsController.getSettings()` returns default settings if DB unavailable
- `bandsController.getBands()` returns mock data if DB unavailable
- `datasetController.getDatasetMeta()` returns mock metadata if DB unavailable

### 3. Mock Fallbacks
If MongoDB connection fails:
```javascript
function setupMockRoutes(app) {
  // Provides complete mock API endpoints
  // Ensures app works even without database
}
```

## Testing

### Before Fix
```bash
curl https://optisupply.onrender.com/api/settings
# 404 Not Found
```

### After Fix (expected)
```bash
curl https://optisupply.onrender.com/api/settings
# 200 OK with settings data (either from DB or defaults)
```

## Lessons Learned

1. **Always check the entry point**: 
   - What file is actually being executed?
   - Is it the one you modified?

2. **package.json is critical**:
   - The `start` script determines what runs in production
   - Don't assume the entry point without checking

3. **Verify deployment flow**:
   - How does the platform (Render/Vercel/etc.) start the app?
   - Does it use `npm start`, direct file execution, or custom command?

## Related Files

- `/ethicsupply-node-backend/render.js` - The correct entry point (NOW USED)
- `/ethicsupply-node-backend/src/server.js` - Local dev entry point (no longer used by Render)
- `/ethicsupply-node-backend/package.json` - Deployment configuration

## Deployment Status

- **Commit**: `fix: Change start script to use render.js instead of server.js`
- **Expected Result**: Render will redeploy automatically and use the correct entry point
- **ETA**: 2-3 minutes for Render to detect changes and redeploy

