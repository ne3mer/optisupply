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
 */
exports.recomputeAllSuppliers = async (req, res) => {
  try {
    const { seed } = req.query;
    
    // Optional: require authentication in production
    // const apiKey = req.headers['x-api-key'];
    // if (apiKey !== process.env.ADMIN_API_KEY) {
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
        const scores = await calculateSupplierScores(supplier.toObject());

        // Update supplier with new scores
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
              finalScore: scores.finalScore ?? scores.ethical_score,
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
      results,
    });
  } catch (error) {
    console.error('Error in bulk recompute:', error);
    res.status(500).json({ error: error.message });
  }
};

