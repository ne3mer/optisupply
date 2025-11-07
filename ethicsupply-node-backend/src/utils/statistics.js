/**
 * Statistical utilities for scenario analysis
 * Includes Kendall's tau, MAE, MAPE, and disparity calculations
 */

/**
 * Calculate Kendall's Tau correlation coefficient
 * Measures rank correlation between two rankings
 * Returns value between -1 (perfect disagreement) and 1 (perfect agreement)
 * 
 * @param {Array<{id: string, rank: number}>} rankings1 - First ranking
 * @param {Array<{id: string, rank: number}>} rankings2 - Second ranking
 * @returns {number} Kendall's tau coefficient
 */
function kendallTau(rankings1, rankings2) {
  // Create maps for quick lookup
  const map1 = new Map(rankings1.map(r => [r.id, r.rank]));
  const map2 = new Map(rankings2.map(r => [r.id, r.rank]));

  // Get common IDs
  const commonIds = rankings1
    .map(r => r.id)
    .filter(id => map2.has(id));

  const n = commonIds.length;
  if (n < 2) return 0;

  // Count concordant and discordant pairs
  let concordant = 0;
  let discordant = 0;

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const id1 = commonIds[i];
      const id2 = commonIds[j];

      const rank1_i = map1.get(id1);
      const rank1_j = map1.get(id2);
      const rank2_i = map2.get(id1);
      const rank2_j = map2.get(id2);

      const diff1 = rank1_i - rank1_j;
      const diff2 = rank2_i - rank2_j;

      if ((diff1 > 0 && diff2 > 0) || (diff1 < 0 && diff2 < 0)) {
        concordant++;
      } else if ((diff1 > 0 && diff2 < 0) || (diff1 < 0 && diff2 > 0)) {
        discordant++;
      }
      // If diff1 === 0 or diff2 === 0, it's a tie (neither concordant nor discordant)
    }
  }

  const denominator = n * (n - 1) / 2;
  return denominator > 0 ? (concordant - discordant) / denominator : 0;
}

/**
 * Calculate Mean Absolute Error (MAE)
 * Exact implementation as specified
 * @param {Array<number>} a - Actual values
 * @param {Array<number>} b - Predicted values
 * @returns {number} MAE value
 */
function meanAbsoluteError(a, b) {
  if (a.length !== b.length || a.length === 0) {
    return 0;
  }
  return a.reduce((s, _, i) => s + Math.abs(a[i] - b[i]), 0) / a.length;
}

/**
 * Calculate Mean Absolute Percentage Error (MAPE)
 * Exact implementation as specified
 * @param {Array<number>} a - Actual values
 * @param {Array<number>} b - Predicted values
 * @returns {number} MAPE value (as percentage)
 */
function meanAbsolutePercentageError(a, b) {
  if (a.length !== b.length || a.length === 0) {
    return 0;
  }
  return 100 * a.reduce((s, _, i) => s + Math.abs(a[i] - b[i]) / (a[i] || 1), 0) / a.length;
}

/**
 * Calculate rank shift statistics
 * @param {Array<{id: string, rank: number}>} rankings1 - First ranking
 * @param {Array<{id: string, rank: number}>} rankings2 - Second ranking
 * @returns {{meanShift: number, maxShift: number, shifts: Array}}
 */
function calculateRankShifts(rankings1, rankings2) {
  const map1 = new Map(rankings1.map(r => [r.id, r.rank]));
  const map2 = new Map(rankings2.map(r => [r.id, r.rank]));

  const shifts = [];
  for (const [id, rank1] of map1) {
    if (map2.has(id)) {
      const rank2 = map2.get(id);
      const shift = Math.abs(rank1 - rank2);
      shifts.push({ id, rank1, rank2, shift });
    }
  }

  if (shifts.length === 0) {
    return { meanShift: 0, maxShift: 0, shifts: [] };
  }

  const meanShift = shifts.reduce((sum, s) => sum + s.shift, 0) / shifts.length;
  const maxShift = Math.max(...shifts.map(s => s.shift));

  return { meanShift, maxShift, shifts };
}

/**
 * Calculate disparity (D) metric for fairness analysis
 * Exact implementation as specified: measures difference in mean ranks between industries
 * 
 * @param {Array<{rank: number, industry: string}>} ranks - Ranks with industry labels
 * @returns {number} Disparity D value
 */
function calculateDisparity(ranks) {
  const by = new Map();
  ranks.forEach(r => {
    if (!by.has(r.industry)) {
      by.set(r.industry, []);
    }
    by.get(r.industry).push(r.rank);
  });

  const overall = ranks.reduce((s, r) => s + r.rank, 0) / ranks.length;
  const K = by.size;

  if (K === 0) return 0;

  return Array.from(by.values()).reduce((s, arr) => {
    const industryMean = arr.reduce((x, y) => x + y, 0) / arr.length;
    return s + Math.abs(industryMean - overall);
  }, 0) / K;
}

/**
 * Calculate top-k preservation percentage
 * Measures how many of the top-k items remain in top-k after perturbation
 * 
 * @param {Array<{id: string}>} originalTop - Original top-k items
 * @param {Array<{id: string}>} newTop - New top-k items
 * @returns {number} Preservation percentage (0-100)
 */
function topKPreservation(originalTop, newTop) {
  const originalIds = new Set(originalTop.map(item => item.id));
  const preserved = newTop.filter(item => originalIds.has(item.id)).length;
  
  return originalTop.length > 0 ? (preserved / originalTop.length) * 100 : 0;
}

/**
 * Perform K-Nearest Neighbors imputation
 * @param {Array<Object>} data - Array of data points with features
 * @param {number} targetIndex - Index of point to impute
 * @param {string} targetFeature - Feature to impute
 * @param {Array<string>} featureNames - Feature names to use for distance calculation
 * @param {number} k - Number of neighbors
 * @returns {number} Imputed value
 */
function knnImpute(data, targetIndex, targetFeature, featureNames, k = 5) {
  const target = data[targetIndex];
  
  // Calculate distances to all other points with non-missing target feature
  const distances = data
    .map((point, idx) => {
      if (idx === targetIndex || point[targetFeature] === null || point[targetFeature] === undefined) {
        return null;
      }
      
      // Calculate Euclidean distance using available features
      let sumSquares = 0;
      let count = 0;
      
      for (const feature of featureNames) {
        if (feature === targetFeature) continue;
        const v1 = target[feature];
        const v2 = point[feature];
        if (v1 !== null && v1 !== undefined && v2 !== null && v2 !== undefined) {
          sumSquares += (v1 - v2) ** 2;
          count++;
        }
      }
      
      return {
        idx,
        distance: count > 0 ? Math.sqrt(sumSquares / count) : Infinity,
        value: point[targetFeature],
      };
    })
    .filter(d => d !== null)
    .sort((a, b) => a.distance - b.distance);

  // Get k nearest neighbors
  const neighbors = distances.slice(0, k);
  
  if (neighbors.length === 0) {
    // Fallback to mean of all available values
    const values = data
      .map(p => p[targetFeature])
      .filter(v => v !== null && v !== undefined);
    return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
  }

  // Return mean of neighbors' values
  return neighbors.reduce((sum, n) => sum + n.value, 0) / neighbors.length;
}

module.exports = {
  kendallTau,
  meanAbsoluteError,
  meanAbsolutePercentageError,
  calculateRankShifts,
  calculateDisparity,
  topKPreservation,
  knnImpute,
};

