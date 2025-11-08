/**
 * Delete all suppliers from the database
 * 
 * Run with: node scripts/delete-all-suppliers.js
 * 
 * WARNING: This will permanently delete ALL suppliers!
 */

require("dotenv").config();
const mongoose = require("mongoose");
const path = require("path");

// Load environment variables
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const Supplier = require("../src/models/Supplier");

async function deleteAllSuppliers() {
  try {
    // Connect to database
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!mongoUri) {
      console.error("❌ MONGODB_URI not found in environment variables");
      process.exit(1);
    }

    await mongoose.connect(mongoUri);
    console.log("✅ Connected to MongoDB");

    // Count existing suppliers
    const count = await Supplier.countDocuments();
    console.log(`\n📊 Found ${count} suppliers in database`);

    if (count === 0) {
      console.log("✅ No suppliers to delete. Database is already empty.");
      await mongoose.disconnect();
      process.exit(0);
    }

    // Delete all suppliers
    console.log("\n🗑️  Deleting all suppliers...");
    const result = await Supplier.deleteMany({});
    
    console.log(`\n✅ Successfully deleted ${result.deletedCount} suppliers`);
    console.log("✅ Database cleared and ready for new suppliers!");

    process.exit(0);
  } catch (error) {
    console.error("❌ Fatal error:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
  }
}

// Run if called directly
if (require.main === module) {
  deleteAllSuppliers();
}

module.exports = { deleteAllSuppliers };

