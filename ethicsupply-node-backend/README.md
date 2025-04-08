# EthicSupply Node.js Backend

This is the Node.js/MongoDB backend for the EthicSupply platform, which provides ethical scoring and evaluation of suppliers based on various environmental, social, and governance factors.

## Features

- RESTful API for managing suppliers and their ethical data
- Machine learning model for calculating ethical scores
- Dashboard with analytics and visualizations
- Supply chain graph for visualizing supplier relationships
- Media sentiment analysis
- Controversy tracking
- ESG report management

## Tech Stack

- Node.js
- Express
- MongoDB with Mongoose
- Machine learning capabilities

## Prerequisites

- Node.js (v18.0.0 or higher)
- MongoDB (local or cloud instance)

## Installation

1. Clone the repository
2. Install dependencies:

```bash
cd ethicsupply-node-backend
npm install
```

3. Create a `.env` file in the root directory with the following variables:

```
NODE_ENV=development
PORT=8000
MONGODB_URI=mongodb://localhost:27017/ethicsupply
CORS_ALLOWED_ORIGINS=http://localhost:5174,http://127.0.0.1:5174
```

## Running the Application

### Development Mode

```bash
npm run dev
```

This will start the server in development mode with hot-reloading enabled.

### Production Mode

```bash
npm start
```

## Seeding the Database

To populate the database with sample data:

```bash
node src/utils/seedDatabase.js
```

This will create sample suppliers, media sentiments, ESG reports, and controversies.

## API Endpoints

### Base URL

```
http://localhost:8000/api
```

### Available Endpoints

- `GET /api` - API root with endpoint information
- `GET /api/health` - Health check
- `GET /api/suppliers` - Get all suppliers
- `POST /api/suppliers` - Create a new supplier
- `GET /api/suppliers/:id` - Get a supplier by ID
- `PUT /api/suppliers/:id` - Update a supplier
- `DELETE /api/suppliers/:id` - Delete a supplier
- `GET /api/dashboard` - Get dashboard data
- `GET /api/supply-chain-graph` - Get supply chain graph data
- `GET /api/suppliers/:supplierId/evaluate` - Evaluate a supplier

## Machine Learning Model

The backend includes a machine learning model for calculating ethical scores based on supplier data and external information. The model can be found in `src/ml/EthicalScoringModel.js`.

## Docker Support

To run the application using Docker:

```bash
docker build -t ethicsupply-backend .
docker run -p 8000:8000 -e MONGODB_URI=mongodb://your-mongo-server:27017/ethicsupply ethicsupply-backend
```

## Testing

```bash
npm test
```

## License

MIT
