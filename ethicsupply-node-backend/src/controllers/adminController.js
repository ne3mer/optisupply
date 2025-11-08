/**
 * Admin Controller
 * Handles administrative operations like bulk recompute
 */

const db = require("../models");
// Import calculateSupplierScores from supplierController (must be at top)
const { calculateSupplierScores } = require('./supplierController');

/**
 * Recompute all supplier scores
 * POST /api/admin/recompute-all
 * Query params: seed (optional, for testing)
 * Headers: Authorization: Bearer $ADMIN_TOKEN (optional, can be enabled)
 * 
 * Idempotent: Running twice produces the same results (no double-penalty)
 */
exports.recomputeAllSuppliers = async (req, res) => {
  try {
    const { seed } = req.query;
    
    // Optional: require authentication in production
    // Uncomment to enable:
    // const authHeader = req.headers['authorization'];
    // const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    // if (!token || token !== process.env.ADMIN_TOKEN) {
    //   return res.status(401).json({ error: 'Unauthorized' });
    // }

    const suppliers = await db.Supplier.find({});
    const results = {
      total: suppliers.length,
      successful: 0,
      failed: 0,
      errors: [],
    };

    console.log(`[admin] Starting bulk recompute for ${suppliers.length} suppliers${seed ? ` (seed: ${seed})` : ''}`);

    for (const supplier of suppliers) {
      try {
        // Recalculate scores with current settings
        // This is idempotent: recompute pillars → composite → penalty → finalScore
        // No double-penalty because we always compute from raw supplier data
        const scores = await calculateSupplierScores(supplier.toObject());

        // Update supplier with new scores
        // Using $set ensures idempotency: same input → same output
        await db.Supplier.updateOne(
          { _id: supplier._id },
          {
            $set: {
              ethical_score: scores.ethical_score,
              environmental_score: scores.environmental_score,
              social_score: scores.social_score,
              governance_score: scores.governance_score,
              risk_level: scores.risk_level,
              risk_factor: scores.risk_factor,
              risk_penalty: scores.risk_penalty,
              completeness_ratio: scores.completeness_ratio,
              composite_score: scores.composite_score,
              finalScore: scores.finalScore ?? scores.ethical_score, // Final Score (post-penalty, NOT capped at 50)
              updatedAt: new Date(),
            },
          }
        );

        results.successful++;
      } catch (error) {
        results.failed++;
        results.errors.push({
          supplierId: supplier._id,
          name: supplier.name,
          error: error.message,
        });
        console.error(`[admin] Error recomputing supplier ${supplier._id}:`, error.message);
      }
    }

    console.log(`[admin] Bulk recompute complete: ${results.successful} successful, ${results.failed} failed`);

    res.status(200).json({
      message: 'Bulk recompute completed',
      idempotent: true, // Indicates running twice produces same results
      results,
    });
  } catch (error) {
    console.error('Error in bulk recompute:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Delete all suppliers
 * POST /api/admin/delete-all-suppliers
 * WARNING: This permanently deletes ALL suppliers!
 */
exports.deleteAllSuppliers = async (req, res) => {
  try {
    // Optional: require authentication in production
    // Uncomment to enable:
    // const authHeader = req.headers['authorization'];
    // const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    // if (!token || token !== process.env.ADMIN_TOKEN) {
    //   return res.status(401).json({ error: 'Unauthorized' });
    // }

    const count = await db.Supplier.countDocuments();
    
    if (count === 0) {
      return res.status(200).json({
        message: 'No suppliers to delete. Database is already empty.',
        deletedCount: 0,
      });
    }

    const result = await db.Supplier.deleteMany({});

    console.log(`[admin] Deleted ${result.deletedCount} suppliers`);

    res.status(200).json({
      message: `Successfully deleted ${result.deletedCount} suppliers`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error('Error deleting all suppliers:', error);
    res.status(500).json({ error: error.message });
  }
};

