/**
 * Run S1 Utility Scenario
 * Usage: node bin/run-s1.js --margin 10
 */

const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Parse command line arguments
const args = process.argv.slice(2);
const marginIndex = args.indexOf('--margin');
const margin = marginIndex !== -1 && args[marginIndex + 1] 
  ? parseFloat(args[marginIndex + 1]) 
  : 10;

const API_URL = process.env.API_URL || 'http://localhost:5000';

const runS1 = async () => {
  try {
    console.log(`\n🔬 Running S1 Utility Scenario with marginMin: ${margin}%`);
    
    const response = await fetch(`${API_URL}/api/scenarios/s1`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        constraint: { marginMin: margin }
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API error: ${response.status} - ${error}`);
    }

    const result = await response.json();
    
    console.log('\n📊 Results:');
    console.log(`   Delta Objective: ${result.deltaObjectivePct?.toFixed(2)}%`);
    console.log(`   Rankings CSV: ${result.ranksCsvUrl || 'N/A'}`);
    
    if (result.ranksCsvUrl) {
      console.log(`\n✅ Download rankings: ${API_URL}${result.ranksCsvUrl}`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error running S1 scenario:', error.message);
    process.exit(1);
  }
};

if (require.main === module) {
  runS1();
}

module.exports = runS1;

