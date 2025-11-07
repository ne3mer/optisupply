/**
 * Seed script for generating 50 synthetic suppliers across 4 industries
 * with realistic ESG data ranges
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Import Supplier model
const Supplier = require('../src/models/Supplier');

// Industries to seed
const industries = ['Manufacturing', 'Technology', 'Textiles & Apparel', 'Food & Beverage'];

// Countries for diversity
const countries = [
  'United States', 'China', 'India', 'Germany', 'United Kingdom',
  'France', 'Japan', 'South Korea', 'Brazil', 'Mexico', 'Vietnam', 'Bangladesh'
];

// Helper: Generate random number in range
const random = (min, max) => {
  return Math.random() * (max - min) + min;
};

// Helper: Generate random integer
const randomInt = (min, max) => {
  return Math.floor(random(min, max + 1));
};

// Helper: Generate realistic company name
const generateCompanyName = (industry, index) => {
  const prefixes = ['Global', 'Eco', 'Sustainable', 'Advanced', 'Premium', 'Elite', 'Prime', 'Apex'];
  const suffixes = ['Industries', 'Solutions', 'Group', 'Corp', 'Ltd', 'Inc', 'Enterprises', 'Systems'];
  const prefix = prefixes[index % prefixes.length];
  const suffix = suffixes[index % suffixes.length];
  return `${prefix} ${industry.split(' ')[0]} ${suffix}`;
};

// Generate supplier data based on industry
const generateSupplier = (industry, index) => {
  // Base ranges vary by industry
  const ranges = {
    'Manufacturing': {
      co2: [15, 50],
      wage: [0.6, 0.95],
      humanRights: [0.5, 0.95],
      waste: [0.6, 0.9],
      energy: [0.5, 0.9],
      renewable: [20, 80],
      water: [20000, 100000],
      diversity: [0.4, 0.9],
      safety: [0.6, 0.95],
      transparency: [0.5, 0.9],
      corruption: [0.1, 0.5],
      board: [0.3, 0.85],
      ethics: [0.5, 0.95],
      compliance: [0.6, 0.9],
      quality: [0.7, 0.95],
      supplierDiv: [0.4, 0.85],
      traceability: [0.5, 0.9],
      geoRisk: [0.2, 0.7],
      climateRisk: [0.2, 0.6],
      laborRisk: [0.1, 0.5],
    },
    'Technology': {
      co2: [10, 40],
      wage: [0.7, 0.95],
      humanRights: [0.6, 0.9],
      waste: [0.7, 0.95],
      energy: [0.6, 0.95],
      renewable: [30, 90],
      water: [10000, 50000],
      diversity: [0.5, 0.9],
      safety: [0.7, 0.95],
      transparency: [0.6, 0.9],
      corruption: [0.1, 0.4],
      board: [0.4, 0.9],
      ethics: [0.6, 0.95],
      compliance: [0.7, 0.95],
      quality: [0.8, 0.98],
      supplierDiv: [0.5, 0.9],
      traceability: [0.6, 0.95],
      geoRisk: [0.2, 0.6],
      climateRisk: [0.15, 0.5],
      laborRisk: [0.1, 0.4],
    },
    'Textiles & Apparel': {
      co2: [20, 60],
      wage: [0.4, 0.8],
      humanRights: [0.3, 0.85],
      waste: [0.4, 0.8],
      energy: [0.4, 0.85],
      renewable: [10, 60],
      water: [30000, 150000],
      diversity: [0.3, 0.8],
      safety: [0.5, 0.9],
      transparency: [0.4, 0.8],
      corruption: [0.2, 0.6],
      board: [0.2, 0.75],
      ethics: [0.4, 0.85],
      compliance: [0.5, 0.85],
      quality: [0.6, 0.9],
      supplierDiv: [0.3, 0.8],
      traceability: [0.4, 0.85],
      geoRisk: [0.3, 0.8],
      climateRisk: [0.25, 0.7],
      laborRisk: [0.2, 0.6],
    },
    'Food & Beverage': {
      co2: [12, 45],
      wage: [0.5, 0.9],
      humanRights: [0.5, 0.9],
      waste: [0.5, 0.9],
      energy: [0.5, 0.9],
      renewable: [15, 70],
      water: [25000, 120000],
      diversity: [0.4, 0.85],
      safety: [0.6, 0.95],
      transparency: [0.5, 0.9],
      corruption: [0.15, 0.5],
      board: [0.3, 0.8],
      ethics: [0.5, 0.9],
      compliance: [0.6, 0.9],
      quality: [0.7, 0.95],
      supplierDiv: [0.4, 0.85],
      traceability: [0.5, 0.9],
      geoRisk: [0.2, 0.65],
      climateRisk: [0.2, 0.6],
      laborRisk: [0.15, 0.5],
    },
  };

  const r = ranges[industry] || ranges['Manufacturing'];
  const country = countries[randomInt(0, countries.length - 1)];

  return {
    name: generateCompanyName(industry, index),
    country,
    industry,
    co2_emissions: random(r.co2[0], r.co2[1]),
    delivery_efficiency: random(0.6, 0.95),
    wage_fairness: random(r.wage[0], r.wage[1]),
    human_rights_index: random(r.humanRights[0], r.humanRights[1]),
    waste_management_score: random(r.waste[0], r.waste[1]),
    community_engagement: random(0.4, 0.9),
    energy_efficiency: random(r.energy[0], r.energy[1]),
    water_usage: randomInt(r.water[0], r.water[1]),
    renewable_energy_percent: randomInt(r.renewable[0], r.renewable[1]),
    pollution_control: random(r.waste[0], r.waste[1]),
    diversity_inclusion_score: random(r.diversity[0], r.diversity[1]),
    worker_safety: random(r.safety[0], r.safety[1]),
    transparency_score: random(r.transparency[0], r.transparency[1]),
    corruption_risk: random(r.corruption[0], r.corruption[1]),
    board_diversity: random(r.board[0], r.board[1]),
    ethics_program: random(r.ethics[0], r.ethics[1]),
    compliance_systems: random(r.compliance[0], r.compliance[1]),
    quality_control_score: random(r.quality[0], r.quality[1]),
    supplier_diversity: random(r.supplierDiv[0], r.supplierDiv[1]),
    traceability: random(r.traceability[0], r.traceability[1]),
    geopolitical_risk: random(r.geoRisk[0], r.geoRisk[1]),
    climate_risk: random(r.climateRisk[0], r.climateRisk[1]),
    labor_dispute_risk: random(r.laborRisk[0], r.laborRisk[1]),
  };
};

// Connect to database
const connectToDatabase = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI environment variable is not defined');
    }

    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ MongoDB connected');
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error);
    process.exit(1);
  }
};

// Main seeding function
const seedSuppliers = async () => {
  try {
    await connectToDatabase();

    // Clear existing suppliers (optional - comment out to keep existing)
    const existingCount = await Supplier.countDocuments();
    if (existingCount > 0) {
      console.log(`⚠️  Found ${existingCount} existing suppliers. Clearing...`);
      await Supplier.deleteMany({});
      console.log('✅ Cleared existing suppliers');
    }

    // Generate 50 suppliers (distributed across industries)
    const suppliersPerIndustry = Math.ceil(50 / industries.length);
    const suppliers = [];

    industries.forEach((industry, industryIndex) => {
      for (let i = 0; i < suppliersPerIndustry && suppliers.length < 50; i++) {
        const index = industryIndex * suppliersPerIndustry + i;
        suppliers.push(generateSupplier(industry, index));
      }
    });

    // Insert suppliers
    console.log(`\n📦 Inserting ${suppliers.length} suppliers...`);
    const result = await Supplier.insertMany(suppliers);
    console.log(`✅ Successfully created ${result.length} suppliers`);

    // Show distribution
    const distribution = {};
    industries.forEach(industry => {
      distribution[industry] = suppliers.filter(s => s.industry === industry).length;
    });

    console.log('\n📊 Distribution by industry:');
    Object.entries(distribution).forEach(([industry, count]) => {
      console.log(`   ${industry}: ${count} suppliers`);
    });

    console.log('\n✅ Seeding complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding suppliers:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
};

// Run if called directly
if (require.main === module) {
  seedSuppliers();
}

module.exports = seedSuppliers;

