/**
 * Run S2 Sensitivity Scenario
 * Usage: node bin/run-s2.js --perturbation +10
 */

const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const args = process.argv.slice(2);
const perturbationIndex = args.indexOf('--perturbation');
const perturbation = perturbationIndex !== -1 && args[perturbationIndex + 1] 
  ? args[perturbationIndex + 1] 
  : '+10';

const API_URL = process.env.API_URL || 'http://localhost:5000';

const runS2 = async () => {
  try {
    console.log(`\n🔬 Running S2 Sensitivity Scenario with perturbation: ${perturbation}`);
    
    const response = await fetch(`${API_URL}/api/scenarios/s2`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ perturbation })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API error: ${response.status} - ${error}`);
    }

    const result = await response.json();
    
    console.log('\n📊 Results:');
    console.log(`   Kendall's Tau: ${result.tau?.toFixed(4)}`);
    console.log(`   Mean Rank Shift: ${result.meanRankShift?.toFixed(2)}`);
    console.log(`   Max Rank Shift: ${result.maxRankShift || 'N/A'}`);
    console.log(`   Rankings CSV: ${result.ranksCsvUrl || 'N/A'}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error running S2 scenario:', error.message);
    process.exit(1);
  }
};

if (require.main === module) {
  runS2();
}

module.exports = runS2;

