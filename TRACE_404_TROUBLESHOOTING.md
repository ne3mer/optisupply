# Trace Endpoint 404 Troubleshooting

## Problem
Getting 404 error when accessing `/api/suppliers/:id/trace?latest=true`

## Quick Checks

### 1. Verify Render Has Latest Code

1. Go to **Render Dashboard** → Your Service → **"Events"** tab
2. Check the **latest deployment** - should show your recent commits
3. If deployment is old, click **"Manual Deploy"** → **"Deploy latest commit"**

### 2. Check Render Logs

1. Go to **Render Dashboard** → Your Service → **"Logs"** tab
2. Look for:
   - `[Trace] Request received for supplierId: ...` (if route is hit)
   - `404` errors (if route isn't found)
   - Route registration messages

### 3. Test the Route Directly

Try accessing the endpoint directly in your browser or with curl:

```bash
# Test with a known supplier ID
curl "https://optisupply.onrender.com/api/suppliers/68d1fed1234567890123456/trace?latest=true"

# Or test with a numeric ID
curl "https://optisupply.onrender.com/api/suppliers/1/trace?latest=true"
```

### 4. Verify Route Registration

Check if the route is registered by visiting:
```
https://optisupply.onrender.com/api/
```

Look for `trace: "/api/suppliers/:id/trace"` in the endpoints list.

## Common Issues

### Issue 1: Route Not Deployed
**Symptom**: Route works locally but not on Render
**Fix**: 
- Check Render deployment logs
- Manually trigger redeploy
- Verify `src/routes/api.js` has the trace routes

### Issue 2: Route Ordering
**Symptom**: Route exists but returns wrong response
**Fix**: 
- Ensure trace routes come BEFORE `/suppliers/:id` route
- Check `src/routes/api.js` lines 85-86 should be before line 93

### Issue 3: MongoDB Not Connected
**Symptom**: Route hits but returns error
**Fix**:
- Check MongoDB connection in Render logs
- Verify `MONGODB_URI` environment variable is set
- Check MongoDB Atlas Network Access

### Issue 4: Supplier ID Format
**Symptom**: Route works but supplier not found
**Fix**:
- The controller handles both MongoDB ObjectId and numeric IDs
- Check if supplier exists in database
- Verify supplier ID format matches what's in database

## Debug Steps

1. **Check Route Registration**:
   ```bash
   curl https://optisupply.onrender.com/api/
   ```
   Should list `trace: "/api/suppliers/:id/trace"`

2. **Check Render Logs**:
   - Look for `[Trace] Request received` messages
   - Check for any error messages
   - Verify MongoDB connection status

3. **Test with Different ID Format**:
   - Try MongoDB ObjectId: `68d1fed1234567890123456`
   - Try numeric ID: `1`, `2`, `3`
   - Check which format your suppliers use

4. **Verify Database Connection**:
   - Check if `/api/suppliers` returns data
   - If it returns mock data, MongoDB isn't connected
   - Fix MongoDB connection first (see MONGODB_ATLAS_NETWORK_FIX.md)

## Expected Behavior

When working correctly:
1. Request: `GET /api/suppliers/68d1fed.../trace?latest=true`
2. Route matches: `/suppliers/:supplierId/trace`
3. Controller logs: `[Trace] Request received for supplierId: 68d1fed...`
4. Response: `200 OK` with trace data OR `404` if no trace exists

## Still Not Working?

1. **Check Render Deployment Status**:
   - Is the latest commit deployed?
   - Are there any build errors?
   - Is the service running?

2. **Check Route File**:
   - Verify `src/routes/api.js` has trace routes (lines 85-86)
   - Ensure routes are in correct order

3. **Check Controller**:
   - Verify `src/controllers/transparencyController.js` exists
   - Check if `getCalculationTrace` function is exported

4. **Manual Test**:
   - Try accessing the route with a simple curl command
   - Check response headers and status code

