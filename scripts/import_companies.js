/**
 * High-Performance Company Master Ingestion Script
 * Source: company_master.tsv (Master Corporate Dataset)
 * Extracts 762,389 lender category rows and groups them into ~343,169 unique company documents in MongoDB.
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const mongoose = require('mongoose');
// Native .env parser
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf-8').split(/\r?\n/);
    for (const line of lines) {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        let key = match[1];
        let value = (match[2] || '').trim().replace(/^['"](.*)['"]$/, '$1');
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    }
  }
}
loadEnv();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/arjun_loan_ops';
const LOCAL_TSV_PATH = path.join(__dirname, '..', 'company_master.tsv');

// Normalized lender name mapping
const LENDER_NAME_MAP = {
  'TATA CAPITAL': 'Tata Capital',
  'KOTAK BANK': 'Kotak Mahindra Bank',
  'AXIS FINANCE': 'Axis Finance',
  'POONAWALA': 'Poonawalla Fincorp',
  'ICICI BANK': 'ICICI Bank',
  'INDUSIND': 'IndusInd Bank',
  'AXIS BANK': 'Axis Bank',
  'idfc bank': 'IDFC FIRST Bank',
  'IDFC BANK': 'IDFC FIRST Bank',
  'PIRAMAL': 'Piramal Finance',
};

// Calculate multiplier and loan cap from category string
function deriveCategoryMetrics(cat) {
  const c = (cat || '').toUpperCase();
  if (c.includes('SUPER') || c.includes('DIAMOND') || c.includes('ELITE')) {
    return { multiplier: 24, maxLoan: 5000000 };
  }
  if (c.includes('CAT A') || c.includes('CATEGORY A') || c.includes('PLATINUM') || c.includes('GOVERNMENT') || c.includes('TATA GROUP') || c.includes('CATGA')) {
    return { multiplier: 22, maxLoan: 4500000 };
  }
  if (c.includes('CAT B') || c.includes('CATEGORY B') || c.includes('GOLD') || c.includes('CATGB')) {
    return { multiplier: 20, maxLoan: 4000000 };
  }
  if (c.includes('CAT C') || c.includes('CATEGORY C') || c.includes('SILVER') || c.includes('CATGC')) {
    return { multiplier: 18, maxLoan: 3000000 };
  }
  if (c.includes('CAT D') || c.includes('CATEGORY D') || c.includes('OPEN MARKET') || c.includes('CSC D') || c.includes('CATGD')) {
    return { multiplier: 15, maxLoan: 2000000 };
  }
  if (c.includes('DELIST') || c.includes('NEGATIVE')) {
    return { multiplier: 0, maxLoan: 0 };
  }
  return { multiplier: 18, maxLoan: 3000000 };
}

// Derive overall corporate tier badge
function deriveOverallTier(lenderCategories) {
  const combined = lenderCategories.map(l => (l.category || '').toUpperCase()).join(' ');
  if (combined.includes('SUPER') || combined.includes('DIAMOND') || combined.includes('ELITE')) {
    return 'Super Cat A';
  }
  if (combined.includes('CAT A') || combined.includes('CATEGORY A') || combined.includes('PLATINUM') || combined.includes('GOVERNMENT') || combined.includes('TATA GROUP') || combined.includes('CATGA')) {
    return 'Cat A';
  }
  if (combined.includes('CAT B') || combined.includes('CATEGORY B') || combined.includes('GOLD') || combined.includes('CATGB')) {
    return 'Cat B';
  }
  if (combined.includes('CAT C') || combined.includes('CATEGORY C') || combined.includes('SILVER') || combined.includes('CATGC')) {
    return 'Cat C';
  }
  if (combined.includes('DELIST') && !combined.includes('CAT')) {
    return 'Delist';
  }
  return 'Cat B';
}

// Derive industry guess from company name keywords
function deriveIndustry(name) {
  const n = name.toUpperCase();
  if (n.includes('TECH') || n.includes('INFOSYS') || n.includes('SOFTWARE') || n.includes('SYSTEMS') || n.includes('SOLUTIONS') || n.includes('DIGITAL')) {
    return 'Information Technology & Software';
  }
  if (n.includes('HOSPITAL') || n.includes('MEDICAL') || n.includes('HEALTH') || n.includes('PHARMA') || n.includes('CLINIC') || n.includes('CARE')) {
    return 'Healthcare & Pharmaceuticals';
  }
  if (n.includes('FINANCE') || n.includes('BANK') || n.includes('CAPITAL') || n.includes('SECURITIES') || n.includes('WEALTH')) {
    return 'Financial Services & Banking';
  }
  if (n.includes('MOTORS') || n.includes('AUTO') || n.includes('ENGINEERING') || n.includes('STEEL') || n.includes('INDUSTRIES') || n.includes('MANUFACTURING')) {
    return 'Manufacturing & Engineering';
  }
  if (n.includes('LOGISTICS') || n.includes('TRANSPORT') || n.includes('CARGO') || n.includes('EXPRESS') || n.includes('SUPPLY CHAIN')) {
    return 'Logistics & Supply Chain';
  }
  if (n.includes('INFRA') || n.includes('BUILD') || n.includes('DEVELOPERS') || n.includes('PROJECTS') || n.includes('PROPERTIES') || n.includes('ESTATE')) {
    return 'Infrastructure & Real Estate';
  }
  if (n.includes('EDUCATION') || n.includes('SCHOOL') || n.includes('COLLEGE') || n.includes('UNIVERSITY') || n.includes('ACADEMY')) {
    return 'Education & Training';
  }
  if (n.includes('RETAIL') || n.includes('FOOD') || n.includes('FASHION') || n.includes('BEVERAGES') || n.includes('CONSUMER')) {
    return 'Retail & Consumer Goods';
  }
  return 'Corporate Enterprise';
}

async function run() {
  const startTime = Date.now();
  console.log(`[Import] Connecting to MongoDB at ${MONGODB_URI.replace(/:[^:@]+@/, ':***@')}...`);
  await mongoose.connect(MONGODB_URI);
  console.log('[Import] MongoDB connected successfully.');

  const db = mongoose.connection.db;
  const companiesCollection = db.collection('companies');

  // Verify TSV file exists
  if (!fs.existsSync(LOCAL_TSV_PATH)) {
    console.error(`[Import] TSV file not found at: ${LOCAL_TSV_PATH}`);
    process.exit(1);
  }

  console.log(`[Import] Reading TSV file from ${LOCAL_TSV_PATH}...`);
  const fileStream = fs.createReadStream(LOCAL_TSV_PATH);
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  const companyMap = new Map();
  let lineCount = 0;

  for await (const line of rl) {
    lineCount++;
    if (!line.trim()) continue;
    const parts = line.split('\t');
    if (parts.length < 3) continue;

    const rawName = parts[0].trim();
    const rawLender = parts[1].trim();
    const rawCat = parts[2].trim();

    if (!rawName) continue;

    const normalizedKey = rawName.toUpperCase();
    const cleanLender = LENDER_NAME_MAP[rawLender] || rawLender;
    const metrics = deriveCategoryMetrics(rawCat);

    if (!companyMap.has(normalizedKey)) {
      companyMap.set(normalizedKey, {
        name: rawName,
        nameNormalized: normalizedKey,
        lenders: [],
      });
    }

    const entry = companyMap.get(normalizedKey);
    // Avoid duplicate lender entries for the same company
    if (!entry.lenders.some(l => l.lender === cleanLender)) {
      entry.lenders.push({
        lender: cleanLender,
        category: rawCat,
        multiplier: metrics.multiplier,
        maxLoan: metrics.maxLoan,
      });
    }

    if (lineCount % 200000 === 0) {
      console.log(`[Import] Parsed ${lineCount.toLocaleString()} lines... (Aggregated ${companyMap.size.toLocaleString()} unique companies so far)`);
    }
  }

  console.log(`[Import] Finished parsing! Total TSV lines: ${lineCount.toLocaleString()}`);
  console.log(`[Import] Total unique companies to import: ${companyMap.size.toLocaleString()}`);

  // Build documents list
  const documents = [];
  const now = new Date();
  for (const item of companyMap.values()) {
    const overallCategory = deriveOverallTier(item.lenders);
    const industry = deriveIndustry(item.name);
    documents.push({
      name: item.name,
      nameNormalized: item.nameNormalized,
      industry: industry,
      category: overallCategory,
      lenderCategories: item.lenders,
      minSalary: 25000,
      remarks: `Listed across ${item.lenders.length} partner lender matrices.`,
      createdAt: now,
      updatedAt: now,
    });
  }

  // Free memory from map
  companyMap.clear();

  console.log(`[Import] Clearing old companies collection...`);
  await companiesCollection.deleteMany({});
  console.log(`[Import] Old collection cleared.`);

  // Drop old indexes except _id to speed up insert
  try {
    const indexes = await companiesCollection.indexes();
    for (const idx of indexes) {
      if (idx.name !== '_id_') {
        await companiesCollection.dropIndex(idx.name);
      }
    }
    console.log('[Import] Dropped existing indexes for fast bulk insertion.');
  } catch (err) {
    console.warn('[Import] Note dropping indexes:', err.message);
  }

  const BATCH_SIZE = 5000;
  const CONCURRENCY = 4;
  const totalDocs = documents.length;
  let insertedSoFar = 0;

  console.log(`[Import] Starting parallel bulk insert (${totalDocs.toLocaleString()} documents, batch size: ${BATCH_SIZE}, concurrency: ${CONCURRENCY})...`);

  // Split into chunks of BATCH_SIZE
  const chunks = [];
  for (let i = 0; i < totalDocs; i += BATCH_SIZE) {
    chunks.push(documents.slice(i, i + BATCH_SIZE));
  }

  // Process in concurrent pools
  for (let i = 0; i < chunks.length; i += CONCURRENCY) {
    const activePool = chunks.slice(i, i + CONCURRENCY);
    await Promise.all(
      activePool.map(async (chunk) => {
        await companiesCollection.insertMany(chunk, { ordered: false });
        insertedSoFar += chunk.length;
      })
    );
    const pct = ((insertedSoFar / totalDocs) * 100).toFixed(1);
    const elapsedSec = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`[Import] Progress: ${insertedSoFar.toLocaleString()} / ${totalDocs.toLocaleString()} (${pct}%) in ${elapsedSec}s`);
  }

  console.log(`[Import] All ${insertedSoFar.toLocaleString()} documents successfully inserted!`);

  // Create High-Performance Indexes
  console.log('[Import] Building high-performance MongoDB indexes...');
  await companiesCollection.createIndex({ name: 1 }, { background: true });
  await companiesCollection.createIndex({ nameNormalized: 1 }, { background: true });
  await companiesCollection.createIndex({ category: 1 }, { background: true });
  await companiesCollection.createIndex({ 'lenderCategories.lender': 1 }, { background: true });
  await companiesCollection.createIndex({ name: 'text' }, { background: true });
  console.log('[Import] Indexes created successfully.');

  const totalTimeSec = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`[Import] COMPLETE! Synchronized ${insertedSoFar.toLocaleString()} companies into MongoDB in ${totalTimeSec}s.`);

  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error('[Import] FATAL ERROR:', err);
  process.exit(1);
});
