# MongoDB Atlas Network Access Fix

## ✅ Good News!

Your `MONGODB_URI` is already configured in Render:

```
mongodb+srv://ne3mer:912A3060859n@cluster0.pf5lrul.mongodb.net/optisupply?retryWrites=true&w=majority
```

## ❌ The Problem

MongoDB Atlas is likely **blocking connections from Render** because your IP address isn't whitelisted.

## 🔧 Solution: Allow Network Access in MongoDB Atlas

### Step 1: Go to MongoDB Atlas

1. Visit: https://cloud.mongodb.com
2. Sign in with your account
3. Select your cluster: **cluster0.pf5lrul**

### Step 2: Configure Network Access

1. In the left sidebar, click **"Network Access"** (or **"IP Access List"**)
2. You'll see a list of allowed IP addresses
3. Click **"Add IP Address"** button (top right)

### Step 3: Allow All IPs (Easiest for Development)

1. In the popup, click **"Allow Access from Anywhere"**
   - This adds `0.0.0.0/0` to your whitelist
   - ⚠️ **Note**: This allows all IPs (less secure, but works for development)
2. Click **"Confirm"**

### Step 4: Wait for Changes

- Network access changes take **1-2 minutes** to propagate
- You'll see a status indicator showing the change is in progress

### Step 5: Verify Connection

1. Go back to Render Dashboard
2. Check your service logs (Monitor → Logs)
3. You should see:
   ```
   Attempting to connect to MongoDB...
   Successfully connected to MongoDB
   ```

## 🔒 More Secure Option (Optional)

If you want better security, you can add Render's specific IP ranges instead of allowing all IPs:

1. In Network Access, click **"Add IP Address"**
2. Enter Render's IP ranges (check Render documentation for current IPs)
3. Or use: `0.0.0.0/0` for development (less secure but works)

## 🧪 Test the Connection

After allowing network access, test it:

1. **Check Render Logs:**

   - Go to Render Dashboard → Your Service → "Logs"
   - Look for MongoDB connection messages

2. **Test API Endpoint:**

   - Visit: `https://optisupply.onrender.com/`
   - Should show: `"mode": "production"` (not "fallback")

3. **Test Suppliers Endpoint:**
   - Visit: `https://optisupply.onrender.com/api/suppliers`
   - Should return real data (not mock data)

## 🐛 Common Errors & Fixes

### Error: "MongoNetworkError" or "Connection timeout"

- **Cause**: IP not whitelisted
- **Fix**: Add `0.0.0.0/0` to Network Access (see Step 3 above)

### Error: "Authentication failed"

- **Cause**: Wrong username/password
- **Fix**:
  1. Go to MongoDB Atlas → "Database Access"
  2. Check your username: `ne3mer`
  3. If password is wrong, reset it and update `MONGODB_URI` in Render

### Error: "Server selection timed out"

- **Cause**: Network access not configured OR database user doesn't exist
- **Fix**:
  1. Check Network Access (Step 2-3)
  2. Check Database Access → Make sure user `ne3mer` exists

## 📋 Quick Checklist

- [x] `MONGODB_URI` is set in Render ✅ (You have this!)
- [ ] Network Access allows `0.0.0.0/0` in MongoDB Atlas
- [ ] Database user `ne3mer` exists in MongoDB Atlas
- [ ] User has "Read and write to any database" permissions
- [ ] Render service has been redeployed (auto after env var changes)
- [ ] Logs show "Successfully connected to MongoDB"

## 🎯 Most Likely Issue

**99% chance**: Network Access is blocking Render. Follow **Step 2-3** above to fix it!

## Need Help?

If you're still having issues after allowing network access:

1. **Check Render Logs** for specific error messages
2. **Verify Database User** exists in MongoDB Atlas → Database Access
3. **Test Connection String** locally to make sure it works
