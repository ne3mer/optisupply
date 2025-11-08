/**
 * Backfill margin_pct for existing suppliers
 * Derives margin from revenue_musd and cost_musd if margin_pct is null
 * 
 * Run with: node scripts/backfill_margin_pct.js
 */

require("dotenv").config();
const mongoose = require("mongoose");
const path = require("path");

// Load environment variables
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const Supplier = require("../src/models/Supplier");

const toNum = (v) => (v === null || v === undefined || v === "" ? null : Number(v));

async function backfillMargins() {
  try {
    // Connect to database
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!mongoUri) {
      console.error("❌ MONGODB_URI not found in environment variables");
      process.exit(1);
    }

    await mongoose.connect(mongoUri);
    console.log("✅ Connected to MongoDB");

    const cursor = Supplier.find({}).cursor();
    let updated = 0;
    let skipped = 0;
    let errors = 0;

    console.log("\n🔄 Processing suppliers...\n");

    for await (const supplier of cursor) {
      try {
        // Skip if margin_pct already exists
        if (supplier.margin_pct != null) {
          skipped++;
          continue;
        }

        // Try to derive from revenue_musd and cost_musd
        const rev = toNum(supplier.revenue_musd) ?? toNum(supplier.revenue);
        const cost = toNum(supplier.cost_musd) ?? toNum(supplier.cost);

        if (rev != null && rev > 0 && cost != null && Number.isFinite(cost) && cost >= 0 && cost <= rev) {
          supplier.margin_pct = 100 * ((rev - cost) / rev);
          await supplier.save();
          updated++;
          
          if (updated % 10 === 0) {
            process.stdout.write(`\r✅ Updated: ${updated}, Skipped: ${skipped}, Errors: ${errors}`);
          }
        } else {
          skipped++;
        }
      } catch (error) {
        errors++;
        console.error(`\n❌ Error processing supplier ${supplier._id}:`, error.message);
      }
    }

    console.log(`\n\n📊 Summary:`);
    console.log(`   ✅ Updated: ${updated}`);
    console.log(`   ⏭️  Skipped: ${skipped}`);
    console.log(`   ❌ Errors: ${errors}`);
    console.log(`\n✅ Backfill complete!`);

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
  backfillMargins();
}

module.exports = { backfillMargins };

