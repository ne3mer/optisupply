const db = require("../models");
const { scoreSupplierWithBreakdown } = require("../utils/esgScoring");

/**
 * Get calculation trace for a supplier
 * GET /api/suppliers/:supplierId/transparency
 * GET /api/suppliers/:supplierId/trace (new alias)
 */
exports.getCalculationTrace = async (req, res) => {
  try {
    const { supplierId } = req.params;
    const { page = 1, limit = 10, latest = "true" } = req.query;

    if (!db.CalculationTrace) {
      console.warn("CalculationTrace model not available");
      // Fallback: generate trace on-the-fly
      const supplier = await db.Supplier.findById(supplierId);
      if (!supplier) {
        return res.status(404).json({ error: "Supplier not found" });
      }

      const settings = await db.ScoringSettings.getDefault();
      const breakdown = scoreSupplierWithBreakdown(supplier.toObject(), settings);

      // Generate trace structure
      const trace = {
        supplierId: supplier._id,
        supplierName: supplier.name,
        timestamp: new Date(),
        steps: [
          {
            name: "raw",
            description: "Raw metric values from supplier data",
            values: Object.keys(breakdown.normalizedMetrics).reduce((acc, key) => {
              acc[key] = breakdown.normalizedMetrics[key].raw;
              return acc;
            }, {}),
          },
          {
            name: "normalized",
            description: "Industry-band normalized values (0-1 scale)",
            values: Object.keys(breakdown.normalizedMetrics).reduce((acc, key) => {
              acc[key] = breakdown.normalizedMetrics[key].normalized;
              return acc;
            }, {}),
          },
          {
            name: "weighted",
            description: "Weighted aggregation into pillar scores",
            values: breakdown.pillarScores,
          },
          {
            name: "composite",
            description: "Final composite score with risk penalty applied",
            values: {
              baseComposite: breakdown.compositeScore,
              riskPenalty: breakdown.riskPenalty || 0,
              finalScore: breakdown.finalScore,
            },
          },
        ],
        finalScore: breakdown.finalScore,
        pillarScores: breakdown.pillarScores,
      };

      return res.status(200).json({
        trace,
        generated: true,
        message: "Trace generated on-the-fly (not persisted)",
      });
    }

    // If latest=true, return only the most recent trace
    if (latest === "true") {
      const trace = await db.CalculationTrace.getLatestForSupplier(supplierId);
      if (!trace) {
        return res.status(404).json({
          error: "No calculation trace found for this supplier",
        });
      }
      return res.status(200).json({ trace });
    }

    // Paginated traces
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const traces = await db.CalculationTrace.find({ supplierId })
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await db.CalculationTrace.countDocuments({ supplierId });

    res.status(200).json({
      traces,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Error fetching calculation trace:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get traceability metrics
 * GET /api/traceability/metrics
 */
exports.getTraceabilityMetrics = async (req, res) => {
  try {
    if (!db.CalculationTrace) {
      return res.status(200).json({
        traceabilityRate: 0,
        meanStepsCount: 0,
        message: "CalculationTrace model not available",
      });
    }

    const [traceabilityRate, meanStepsCount] = await Promise.all([
      db.CalculationTrace.getTraceabilityRate(),
      db.CalculationTrace.getMeanStepsCount(),
    ]);

    res.status(200).json({
      traceabilityRate: parseFloat(traceabilityRate.toFixed(2)),
      meanStepsCount: parseFloat(meanStepsCount.toFixed(2)),
      totalTraces: await db.CalculationTrace.countDocuments(),
    });
  } catch (error) {
    console.error("Error fetching traceability metrics:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Generate and persist trace for a supplier
 * POST /api/suppliers/:supplierId/trace/generate
 */
exports.generateTrace = async (req, res) => {
  try {
    const { supplierId } = req.params;

    const supplier = await db.Supplier.findById(supplierId);
    if (!supplier) {
      return res.status(404).json({ error: "Supplier not found" });
    }

    const settings = await db.ScoringSettings.getDefault();
    const breakdown = scoreSupplierWithBreakdown(supplier.toObject(), settings);

    if (!db.CalculationTrace) {
      return res.status(503).json({
        error: "CalculationTrace model not available",
      });
    }

    // Create and persist trace
    const trace = await db.CalculationTrace.createFromBreakdown(
      supplier._id,
      supplier.name,
      breakdown,
      settings.toObject ? settings.toObject() : settings
    );

    res.status(201).json({
      message: "Calculation trace generated and persisted",
      trace,
    });
  } catch (error) {
    console.error("Error generating trace:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Batch generate traces for all suppliers
 * POST /api/trace/generate-all
 */
exports.generateAllTraces = async (req, res) => {
  try {
    if (!db.CalculationTrace) {
      return res.status(503).json({
        error: "CalculationTrace model not available",
      });
    }

    const suppliers = await db.Supplier.find({});
    const settings = await db.ScoringSettings.getDefault();

    const results = {
      success: 0,
      failed: 0,
      errors: [],
    };

    for (const supplier of suppliers) {
      try {
        const breakdown = scoreSupplierWithBreakdown(
          supplier.toObject(),
          settings
        );
        await db.CalculationTrace.createFromBreakdown(
          supplier._id,
          supplier.name,
          breakdown,
          settings.toObject ? settings.toObject() : settings
        );
        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push({
          supplierId: supplier._id,
          error: error.message,
        });
      }
    }

    res.status(200).json({
      message: "Batch trace generation completed",
      results,
    });
  } catch (error) {
    console.error("Error in batch trace generation:", error);
    res.status(500).json({ error: error.message });
  }
};
