/**
 * Run S4 Fairness/Ablation Scenario
 * Usage: node bin/run-s4.js --normalization off
 */

const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const args = process.argv.slice(2);
const normalizationIndex = args.indexOf('--normalization');
const normalization = normalizationIndex !== -1 && args[normalizationIndex + 1] 
  ? args[normalizationIndex + 1] 
  : 'off';

const API_URL = process.env.API_URL || 'http://localhost:5000';

const runS4 = async () => {
  try {
    console.log(`\n🔬 Running S4 Fairness/Ablation Scenario`);
    console.log(`   Normalization: ${normalization}`);
    
    const response = await fetch(`${API_URL}/api/scenarios/s4`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ normalization })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API error: ${response.status} - ${error}`);
    }

    const result = await response.json();
    
    console.log('\n📊 Results:');
    console.log(`   Disparity (D): ${result.D?.toFixed(4)}`);
    console.log(`   Kendall's Tau: ${result.tau?.toFixed(4)}`);
    console.log(`   Rankings CSV: ${result.ranksCsvUrl || 'N/A'}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error running S4 scenario:', error.message);
    process.exit(1);
  }
};

if (require.main === module) {
  runS4();
}

module.exports = runS4;

