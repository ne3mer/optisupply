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
    // Print connection info (with password masked)
    console.log(
      `Attempting to connect to MongoDB at ${MONGODB_URI.replace(
        /mongodb\+srv:\/\/([^:]+):[^@]+@/,
        "mongodb+srv://$1:***@"
      )}`
    );

    // Print diagnostic information
    console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
    console.log(
      `Process running as: ${process.getuid ? process.getuid() : "N/A"}`
    );
    console.log(`Connection options: ${JSON.stringify(options)}`);

    // Connect with a slightly longer timeout for Vercel's serverless environment
    const conn = await mongoose.connect(MONGODB_URI, {
      ...options,
      serverSelectionTimeoutMS:
        process.env.NODE_ENV === "production" ? 10000 : 5000,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    console.error(`Error name: ${error.name}`);
    console.error(`Error code: ${error.code || "N/A"}`);
    console.error(`Error codeName: ${error.codeName || "N/A"}`);

    if (error.name === "MongoNetworkError") {
      console.error(
        "This is a network connectivity issue. Check IP access lists and network connectivity."
      );
    } else if (error.name === "MongoServerSelectionError") {
      console.error(
        "Server selection failed. The MongoDB server may be down or unreachable."
      );
    } else if (error.message.includes("authentication")) {
      console.error(
        "This appears to be an authentication error. Check your username and password."
      );
    } else if (error.message.includes("timed out")) {
      console.error(
        "Connection attempt timed out. Check network latency or firewall settings."
      );
    }

    console.error(
      `Connection error details: ${JSON.stringify(error, null, 2)}`
    );

    // Instead of exiting the process, throw the error to allow fallback
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
