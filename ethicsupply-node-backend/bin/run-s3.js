/**
 * Run S3 Missingness Scenario
 * Usage: node bin/run-s3.js --missingPct 5 --imputation industryMean
 */

const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const args = process.argv.slice(2);
const missingPctIndex = args.indexOf('--missingPct');
const missingPct = missingPctIndex !== -1 && args[missingPctIndex + 1] 
  ? parseInt(args[missingPctIndex + 1], 10) 
  : 5;

const imputationIndex = args.indexOf('--imputation');
const imputation = imputationIndex !== -1 && args[imputationIndex + 1] 
  ? args[imputationIndex + 1] 
  : 'industryMean';

const kIndex = args.indexOf('--k');
const k = kIndex !== -1 && args[kIndex + 1] 
  ? parseInt(args[kIndex + 1], 10) 
  : undefined;

const API_URL = process.env.API_URL || 'http://localhost:5000';

const runS3 = async () => {
  try {
    console.log(`\n🔬 Running S3 Missingness Scenario`);
    console.log(`   Missing %: ${missingPct}`);
    console.log(`   Imputation: ${imputation}`);
    if (k) console.log(`   K: ${k}`);
    
    const body = {
      missingPct,
      imputation
    };
    if (k) body.k = k;
    
    const response = await fetch(`${API_URL}/api/scenarios/s3`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API error: ${response.status} - ${error}`);
    }

    const result = await response.json();
    
    console.log('\n📊 Results:');
    console.log(`   Top-3 Preservation: ${result.top3PreservationPct?.toFixed(2)}%`);
    console.log(`   MAE: ${result.mae?.toFixed(4)}`);
    console.log(`   Rankings CSV: ${result.ranksCsvUrl || 'N/A'}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error running S3 scenario:', error.message);
    process.exit(1);
  }
};

if (require.main === module) {
  runS3();
}

module.exports = runS3;

