# Render Database Connection Setup

## Problem

Your Render backend is not connected to MongoDB because the `MONGODB_URI` environment variable is missing.

## Solution: Add MongoDB Connection String to Render

### Step 1: Get Your MongoDB Connection String

#### Option A: Using Render's Managed Database

**Where to find it:**

1. Go to your **Render Dashboard**: https://dashboard.render.com
2. You'll see a list of all your services. Look for:

   - A service with type **"PostgreSQL"** or **"MongoDB"** (database icon)
   - OR check the **"Databases"** section in the left sidebar
   - The name might be: `optiethic-db`, `optisupply-db`, or similar

3. **If you DON'T see a database service:**

   - You're probably using **MongoDB Atlas** (cloud database) - skip to Option B below
   - OR you need to create a database first (see "Creating a Database" section)

4. **If you DO see a database service:**
   - Click on it to open the database details
   - Go to the **"Info"** tab
   - Look for **"Internal Database URL"** or **"Connection String"**
   - Copy the connection string - it should look like:
     ```
     mongodb://dummy-user:password@dummy-host:27017/optiethic?authSource=admin
     ```

#### Option B: Using MongoDB Atlas (Cloud)

If you're using MongoDB Atlas instead:

1. Go to **MongoDB Atlas**: https://cloud.mongodb.com
2. Click **"Connect"** on your cluster
3. Choose **"Connect your application"**
4. Copy the connection string - it should look like:
   ```
   mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/optiethic?retryWrites=true&w=majority
   ```

### Step 2: Add Environment Variable to Render Service

1. Go to your **Render Dashboard**: https://dashboard.render.com
2. Find your backend service: **optisupply** (the Node.js web service)
3. Click on it to open service settings
4. Go to **"Environment"** tab (or **"Environment Variables"** section)
5. Click **"Add Environment Variable"**
6. Add:
   - **Key**: `MONGODB_URI`
   - **Value**: Paste your MongoDB connection string from Step 1
7. Click **"Save Changes"**

### Step 3: Redeploy

After adding the environment variable:

1. Render will automatically trigger a new deployment
2. Wait for deployment to complete (usually 2-3 minutes)
3. Check the deployment logs - you should see:
   ```
   Attempting to connect to MongoDB...
   Successfully connected to MongoDB
   ```

### Step 4: Verify Connection

1. Visit your API root: `https://optisupply.onrender.com/`
2. You should see:
   ```json
   {
     "status": "running",
     "mode": "production",
     "message": "OptiSupply API running with MongoDB"
   }
   ```
3. If you see `"mode": "fallback"` instead, the connection failed - check the logs

## Troubleshooting

### Still seeing "fallback mode" or mock data?

1. **Check deployment logs**:

   - Go to Render Dashboard → Your Service → "Logs" tab
   - Look for MongoDB connection errors

2. **Common errors**:

   **"MongoNetworkError"** or **"Connection timeout"**

   - Your MongoDB server might not allow connections from Render's IPs
   - **For MongoDB Atlas**: Add `0.0.0.0/0` to IP Whitelist (Network Access)
   - **For Render Database**: Should work automatically, check if database is running

   **"Authentication failed"**

   - Check username/password in connection string
   - Make sure the connection string is correct

   **"MONGODB_URI is not defined"**

   - Environment variable not set correctly
   - Make sure variable name is exactly `MONGODB_URI` (case-sensitive)
   - Redeploy after adding the variable

3. **Test connection string locally**:
   ```bash
   # In your local terminal
   export MONGODB_URI="your-connection-string-here"
   cd ethicsupply-node-backend
   node -e "require('./src/config/database').connectToDatabase().then(() => console.log('✅ Connected!')).catch(e => console.error('❌ Error:', e.message))"
   ```

## Creating a Database on Render (If You Don't Have One)

If you don't see a database service in your Render dashboard:

1. Go to **Render Dashboard**: https://dashboard.render.com
2. Click **"New +"** button (top right)
3. Select **"PostgreSQL"** or **"MongoDB"** (if available)
4. Configure:
   - **Name**: `optisupply-db` (or any name)
   - **Database**: `optiethic` (or `optisupply`)
   - **Plan**: Free (or paid if needed)
5. Click **"Create Database"**
6. Wait for it to provision (2-3 minutes)
7. Once ready, go to the database → **"Info"** tab → Copy **"Internal Database URL"**

## Using Render's Managed Database

If you're using Render's managed MongoDB database:

1. The connection string format is usually:

   ```
   mongodb://[username]:[password]@[host]:[port]/[database]?authSource=admin
   ```

2. You can find it in:

   - Database service → **"Info"** tab → **"Internal Database URL"**

3. **Important**: Use the **Internal Database URL** (not external) for better performance

4. **Where to find the database service:**
   - In Render Dashboard, look in the left sidebar for **"Databases"** section
   - OR look for services with a database icon (🗄️)
   - OR check the main dashboard - databases are listed alongside web services

## Using MongoDB Atlas (Most Common)

**If you're using MongoDB Atlas** (cloud.mongodb.com), this is probably your case:

### Step 1: Get Your Atlas Connection String

1. Go to **MongoDB Atlas**: https://cloud.mongodb.com
2. Sign in to your account
3. Click on your **Cluster** (or create one if you don't have one)
4. Click **"Connect"** button
5. Choose **"Connect your application"**
6. Select **"Node.js"** and version **"5.5 or later"**
7. Copy the connection string - it looks like:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

### Step 2: Customize the Connection String

Replace the placeholders:

- Replace `<username>` with your database username
- Replace `<password>` with your database password
- Add your database name at the end: `/optiethic` or `/optisupply`

**Final format should be:**

```
mongodb+srv://myuser:mypassword@cluster0.xxxxx.mongodb.net/optiethic?retryWrites=true&w=majority
```

### Step 3: Configure Network Access

1. In MongoDB Atlas, go to **"Network Access"** (left sidebar)
2. Click **"Add IP Address"**
3. Click **"Allow Access from Anywhere"** (adds `0.0.0.0/0`)
   - OR add Render's specific IP ranges for better security
4. Click **"Confirm"**

### Step 4: Create Database User (If Needed)

1. Go to **"Database Access"** (left sidebar)
2. Click **"Add New Database User"**
3. Choose **"Password"** authentication
4. Set username and password (save these!)
5. Set user privileges: **"Read and write to any database"**
6. Click **"Add User"**

### Step 5: Use This Connection String in Render

Use the connection string from Step 2 as your `MONGODB_URI` in Render.

## Quick Checklist

- [ ] MongoDB database is running (Render or Atlas)
- [ ] `MONGODB_URI` environment variable is set in Render service
- [ ] Connection string is correct (no typos)
- [ ] Network access is configured (for Atlas)
- [ ] Service has been redeployed after adding environment variable
- [ ] Deployment logs show "Successfully connected to MongoDB"

## After Setup

Once connected, you should:

1. **Seed the database** (if not already done):

   - You can create a one-time script or use MongoDB Compass/Atlas UI
   - Or add a `/api/seed` endpoint for initial setup

2. **Verify data**:

   - Visit `https://optisupply.onrender.com/api/suppliers`
   - Should return real data (not mock data)

3. **Check trace endpoint**:
   - Visit `https://optisupply.onrender.com/api/suppliers/:id/trace`
   - Should work without errors

## Need Help?

If you're still having issues:

1. Check Render deployment logs for specific error messages
2. Verify MongoDB is accessible (test connection string locally)
3. Make sure database user has proper permissions
4. Check network/firewall settings
