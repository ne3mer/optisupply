# OptiSupply

> Ethical supply chain intelligence platform — evaluate, monitor, and optimise supplier networks across ESG dimensions.

[![Frontend](https://img.shields.io/badge/frontend-Vercel-black)](https://optisupply.vercel.app)
[![Backend](https://img.shields.io/badge/backend-DigitalOcean-0080FF)](https://octopus-app-j6min.ondigitalocean.app/api/health-check)

---

## Architecture

| Layer    | Technology                          | Deployment                        | URL                                       |
|----------|-------------------------------------|-----------------------------------|-------------------------------------------|
| Frontend | React 18 · TypeScript · Vite        | Vercel                            | https://optisupply.vercel.app             |
| Backend  | Node.js · Express · Mongoose        | DigitalOcean App Platform (Docker)| https://octopus-app-j6min.ondigitalocean.app |
| Database | MongoDB Atlas                       | Cloud (M0 free tier cluster)      | `cluster0.pf5lru1.mongodb.net/optisupply` |

---

## Repository Structure

```
optisupply/
├── ethicsupply-frontend/       # React/TypeScript SPA
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   ├── pages/              # Route-level page components
│   │   ├── services/           # API client + data fetching
│   │   └── store/              # Recoil state atoms
│   ├── .env.production         # Non-secret VITE_ vars (committed)
│   └── build.sh                # Production build script
│
├── ethicsupply-node-backend/   # Express REST API
│   ├── routes/                 # API route handlers
│   ├── models/                 # Mongoose data models
│   ├── services/               # Business logic + ML scoring
│   └── start.js                # Production entry point
│
├── docs/                       # Documentation + reference data
├── tools/                      # ESG report generation utilities (Python/JS)
│
├── Dockerfile                  # Backend Docker image (used by DigitalOcean)
├── .do/app.yaml                # DigitalOcean App Platform spec
├── render.yaml                 # Render deployment spec (frontend only)
└── package.json                # Monorepo workspace root
```

---

## Local Development

### Prerequisites

- Node.js 20+
- A MongoDB Atlas connection string (or local MongoDB)

### 1. Backend

```bash
cd ethicsupply-node-backend
npm install
```

Create `ethicsupply-node-backend/.env`:

```env
NODE_ENV=development
PORT=8080
MONGODB_URI=mongodb://localhost:27017/optisupply
JWT_SECRET=change-me-in-dev
CORS_ALLOWED_ORIGINS=http://localhost:5173
```

```bash
node start.js          # → http://localhost:8080
```

### 2. Frontend

```bash
cd ethicsupply-frontend
npm install
```

Create `ethicsupply-frontend/.env`:

```env
VITE_API_URL=http://localhost:8080/api
```

```bash
npm run dev            # → http://localhost:5173
```

---

## Deployment

### Backend — DigitalOcean App Platform

Deploys automatically on every push to `main` via `.do/app.yaml`.

The `Dockerfile` at the repo root builds the backend image.

**Secrets managed in the DO dashboard (never committed):**

| Variable      | Description                           |
|---------------|---------------------------------------|
| `MONGODB_URI` | MongoDB Atlas connection string       |
| `JWT_SECRET`  | JWT signing secret                    |

**Non-secret env vars in `.do/app.yaml`:**

| Variable               | Description                          |
|------------------------|--------------------------------------|
| `NODE_ENV`             | `production`                         |
| `PORT`                 | `8080`                               |
| `CORS_ALLOWED_ORIGINS` | Comma-separated list of allowed origins |

### Frontend — Vercel

Deploys automatically on every push to `main`.

**Env var set in Vercel dashboard:**

| Variable       | Value                                               |
|----------------|-----------------------------------------------------|
| `VITE_API_URL` | `https://octopus-app-j6min.ondigitalocean.app/api`  |

The committed `ethicsupply-frontend/.env.production` also sets `VITE_API_URL` as a fallback during `vite build`.

---

## API Reference

| Method | Endpoint                  | Description                     |
|--------|---------------------------|---------------------------------|
| GET    | `/api/health-check`       | Service health status           |
| GET    | `/api/suppliers`          | List all suppliers               |
| POST   | `/api/suppliers`          | Create a new supplier            |
| GET    | `/api/suppliers/:id`      | Get supplier details             |
| POST   | `/api/suppliers/evaluate` | Run ESG evaluation               |
| GET    | `/api/dashboard`          | Aggregate dashboard metrics      |
| GET    | `/api/recommendations`    | AI-generated recommendations     |

---

## Tech Stack

**Frontend** — React 18, TypeScript, Vite, Tailwind CSS, Radix UI, Recharts, React Flow, React Router, Recoil

**Backend** — Node.js, Express, Mongoose, JWT, bcrypt, Helmet, CORS

**Infrastructure** — DigitalOcean App Platform, Vercel, MongoDB Atlas, Docker, GitHub Actions (auto-deploy)

---

## License

MIT
