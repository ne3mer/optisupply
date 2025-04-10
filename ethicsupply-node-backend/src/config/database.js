const mongoose = require("mongoose");

// MongoDB connection string - from environment variable or use local development URL
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/ethicsupply";

// Configure Mongoose options (removing deprecated options)
const options = {
  // These options are no longer needed in Mongoose 6+
  // useNewUrlParser: true,
  // useUnifiedTopology: true,
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
    console.log(
      `Attempting to connect to MongoDB at ${MONGODB_URI.replace(
        /mongodb\+srv:\/\/([^:]+):[^@]+@/,
        "mongodb+srv://$1:***@"
      )}`
    );
    const conn = await mongoose.connect(MONGODB_URI, options);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    console.error(
      `Connection error details: ${JSON.stringify(error, null, 2)}`
    );

    // Instead of exiting the process, throw the error to allow fallback
    // This allows our fallback mechanism to catch the error and provide mock data
    throw new Error(`Failed to connect to MongoDB: ${error.message}`);
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
