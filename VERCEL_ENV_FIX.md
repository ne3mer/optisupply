# Vercel Environment Variable Fix

## Problem

The frontend deployed on Vercel (https://optisupply.vercel.app) was unable to fetch settings from the backend API, resulting in:

```
Error fetching settings: Error: Failed to fetch settings
GET https://optisupply.vercel.app/api/settings 404 (Not Found)
```

## Root Cause

The frontend on Vercel doesn't have the correct `VITE_API_URL` environment variable set to point to the backend on Render.

## Solution

### 1. Set Vercel Environment Variable

1. Go to your Vercel dashboard: https://vercel.com/dashboard
2. Select your project: **optisupply**
3. Go to **Settings** → **Environment Variables**
4. Add the following variable:

   ```
   Name:  VITE_API_URL
   Value: https://optisupply.onrender.com/api
   ```

5. Make sure to select **all environments** (Production, Preview, Development)
6. Click **Save**

### 2. Redeploy

After adding the environment variable, you need to redeploy:

1. Go to **Deployments** tab
2. Click the three dots `...` on the latest deployment
3. Click **Redeploy**

OR simply push a new commit to trigger automatic deployment.

### 3. Verify

After redeployment:

1. Visit https://optisupply.vercel.app/settings
2. The page should load successfully
3. Check browser console - no 404 errors should appear
4. Settings page should display all configuration options

## Frontend Fallback

The frontend code in `src/services/api.ts` has a fallback:

```typescript
const API_BASE_URL =
  import.meta.env.VITE_API_URL || "https://optisupply.onrender.com/api";
```

This means if `VITE_API_URL` is not set, it will default to the Render backend URL. However, it's best practice to explicitly set the environment variable in Vercel.

## Settings Page Redesign

The Settings page has been redesigned to show all configuration options on a single page without tabs:

### New Design Features:

- **Single-page layout** - No tabs, everything visible at once
- **Creative visual design** with icons and color-coded sections
- **Quick toggle cards** at the top for common settings (Dark Mode, Industry Bands, Risk Penalty)
- **Slider controls** for ESG weights with real-time sum validation
- **Risk configuration panel** with intuitive input fields
- **Advanced metric weights** section
- **API & Export** section at the bottom

### Sections:

1. **Header** - Shows title, description, and action buttons (Save/Reset)
2. **Quick Settings** - 3 cards with toggle switches for instant access
3. **ESG Weights** - Left panel with sliders for E, S, G weights
4. **Risk Configuration** - Right panel with risk weights, threshold, and lambda
5. **Advanced Metrics** - Grid of environmental metric weights
6. **API & Export** - Configuration and data export options

## Testing

After deployment, test the following:

- ✅ Settings page loads without errors
- ✅ All weight sliders work
- ✅ Toggles switch correctly (Dark Mode, Industry Bands, Risk Penalty)
- ✅ Save button persists changes
- ✅ Reset button restores defaults
- ✅ Weight sum validation shows warnings when needed
- ✅ Risk configuration shows/hides based on Risk Penalty toggle

## Backend Health Check

Verify the backend is running:

- Backend URL: https://optisupply.onrender.com
- Settings endpoint: https://optisupply.onrender.com/api/settings
- Health check: https://optisupply.onrender.com/

All endpoints should return valid JSON responses, not 404 errors.

