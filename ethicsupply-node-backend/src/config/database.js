const mongoose = require("mongoose");

// MongoDB connection string - from environment variable or use local development URL
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/ethicsupply";

// Configure Mongoose options
const options = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  autoIndex: process.env.NODE_ENV !== "production", // Don't build indexes in production
  maxPoolSize: 10, // Maintain up to 10 socket connections
  serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
  socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
  family: 4, // Use IPv4, skip trying IPv6
};

/**
 * Connect to MongoDB
 * @returns {Promise} Mongoose connection instance
 */
async function connectToDatabase() {
  try {
    const conn = await mongoose.connect(MONGODB_URI, options);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Close the database connection
 * @returns {Promise} Result of closing the connection
 */
async function closeConnection() {
  return mongoose.connection.close();
}

module.exports = {
  connectToDatabase,
  closeConnection,
  connection: mongoose.connection,
};
