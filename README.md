# OptiEthic - Ethical Supply Chain Management

A full-stack application for managing and analyzing ethical supply chains.

## Project Structure

- **ethicsupply-frontend**: React frontend built with Vite, TypeScript, and Tailwind CSS
- **ethicsupply-node-backend**: Node.js/Express REST API backed by MongoDB

## Deployment Guide (Render + MongoDB Atlas)

### 1) Set Up Accounts

1. Sign up at [Render.com](https://render.com) and [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Connect this GitHub repository to Render

### 2) Deploy Backend API (Render Web Service)

1. In Render, click **New > Web Service**
2. Select this repository
3. Configure:
   - **Name**: `optiethic-backend`
   - **Runtime**: `Node`
   - **Root Directory**: `ethicsupply-node-backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm run start:render` (or `npm start`)
4. Add environment variables:
   - `NODE_ENV=production`
   - `PORT=8000`
   - `MONGODB_URI=<your-atlas-connection-string>`
   - `CORS_ALLOWED_ORIGINS=https://your-frontend-domain.onrender.com`
   - `JWT_SECRET=<strong-random-secret>`

### 3) Deploy Frontend (Render Static Site)

1. In Render, click **New > Static Site**
2. Select this repository
3. Configure:
   - **Name**: `optiethic-frontend`
   - **Root Directory**: `ethicsupply-frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
4. Add environment variable:
   - `VITE_API_URL=https://your-backend-domain.onrender.com/api`
5. Add rewrite rule for SPA routing:
   - Source: `/*`
   - Destination: `/index.html`
   - Type: `Rewrite`

### 4) Verify Deployment

1. Wait for both services to finish deployment
2. Open the frontend URL
3. Confirm frontend requests succeed against `/api/health-check` and other endpoints

## Local Development

### Backend Setup

```bash
cd ethicsupply-node-backend
npm install
npm run dev
```

The backend runs on `http://localhost:8000` by default.

Create `ethicsupply-node-backend/.env` with:

```bash
NODE_ENV=development
PORT=8000
MONGODB_URI=mongodb://localhost:27017/ethicsupply
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174,http://127.0.0.1:5174
JWT_SECRET=change-me-in-production
```

### Frontend Setup

```bash
cd ethicsupply-frontend
npm install
npm run dev
```

Set `ethicsupply-frontend/.env`:

```bash
VITE_API_URL=http://localhost:8000/api
```

## Features

- Dashboard metrics for supplier ethical performance
- Supplier evaluation and scoring workflows
- Supplier list, detail views, and analytics pages
- Recommendations and scenario analysis tools
- Supply chain graph and geo-risk views

## Tech Stack

### Backend

- Node.js + Express
- MongoDB + Mongoose
- Authentication/security with JWT, bcrypt, CORS, Helmet
- Built-in ML helpers for scoring and analytics

### Frontend

- React 18 + TypeScript + Vite
- Tailwind CSS + Radix UI
- Recharts, React Flow, Three.js ecosystem
- React Router + Recoil

## Example API Endpoints

- `GET /api/health-check`: API health check
- `GET /api/suppliers`: List suppliers
- `POST /api/suppliers`: Create supplier
- `POST /api/suppliers/evaluate`: Evaluate supplier
- `GET /api/dashboard`: Dashboard data

## License

MIT License
