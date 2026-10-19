/**
 * High-performance PIN Code Master Ingestion Script
 * Source: Local master serviceability dataset
 * Extracts ~187,450 lender serviceability rows and maps them into 30,630 Indian PIN code documents
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const mongoose = require('mongoose');

const TSV_URL = '';
const LOCAL_FILE = path.join(__dirname, '..', 'pin_download.tsv');
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/arjun_loan_ops';

const BANK_MAP = {
  'Bajaj Pincode Master': 'Bajaj Finserv',
  'Axis Pincode List': 'Axis Bank',
  'Fullerton Pincode list': 'Fullerton (SMFG)',
  'IDFC Pincode list': 'IDFC FIRST Bank',
  'Incred': 'InCred Financial',
  'HDFC': 'HDFC Bank',
  'TATA Capital Pincode List': 'Tata Capital',
  'Finnable Pincode List': 'Finnable',
  'INDUSIND PIN CODE': 'IndusInd Bank',
  'ADITYA BIRLA': 'Aditya Birla Capital',
  'axis finance': 'Axis Finance',
  'L & T finance': 'L&T Finance'
};

const BANK_DEFAULT_PRODUCTS = {
  'Bajaj Finserv': ['Personal Loan', 'Business Loan', 'Doctor Loan'],
  'Axis Bank': ['Personal Loan', 'Home Loan', 'Auto Loan', 'LAP'],
  'Fullerton (SMFG)': ['Personal Loan', 'SME Loan', 'Two Wheeler'],
  'IDFC FIRST Bank': ['Personal Loan', 'Consumer Durable', 'LAP'],
  'InCred Financial': ['Personal Loan', 'Education Loan', 'MSME'],
  'HDFC Bank': ['Personal Loan', 'Home Loan', 'Business Loan', 'LAP'],
  'Tata Capital': ['Personal Loan', 'Home Loan', 'Business Loan'],
  'Finnable': ['Instant Personal Loan', 'Salaried PL'],
  'IndusInd Bank': ['Personal Loan', 'Vehicle Loan', 'LAP'],
  'Aditya Birla Capital': ['Personal Loan', 'SME Business Loan', 'LAP'],
  'Axis Finance': ['Loan Against Property', 'Wholesale Lending'],
  'L&T Finance': ['Personal Loan', 'Two Wheeler', 'Farm Equipment', 'LAP']
};

function getStateFromPin(pin) {
  const p2 = parseInt(pin.slice(0, 2), 10);
  if (p2 === 11) return 'Delhi';
  if (p2 >= 12 && p2 <= 13) return 'Haryana';
  if (p2 >= 14 && p2 <= 16) return 'Punjab & Chandigarh';
  if (p2 === 17) return 'Himachal Pradesh';
  if (p2 >= 18 && p2 <= 19) return 'Jammu & Kashmir';
  if (p2 >= 20 && p2 <= 28) return (p2 === 24 || p2 === 26) ? 'Uttarakhand' : 'Uttar Pradesh';
  if (p2 >= 30 && p2 <= 34) return 'Rajasthan';
  if (p2 >= 36 && p2 <= 39) return 'Gujarat';
  if (p2 >= 40 && p2 <= 44) return pin.startsWith('403') ? 'Goa' : 'Maharashtra';
  if (p2 >= 45 && p2 <= 48) return 'Madhya Pradesh';
  if (p2 === 49) return 'Chhattisgarh';
  if (p2 >= 50 && p2 <= 53) return (p2 === 50 || (p2 === 51 && parseInt(pin, 10) < 515000)) ? 'Telangana' : 'Andhra Pradesh';
  if (p2 >= 56 && p2 <= 59) return 'Karnataka';
  if (p2 >= 60 && p2 <= 64) return pin.startsWith('605') ? 'Puducherry' : 'Tamil Nadu';
  if (p2 >= 67 && p2 <= 69) return 'Kerala';
  if (p2 >= 70 && p2 <= 74) return pin.startsWith('744') ? 'Andaman & Nicobar' : 'West Bengal';
  if (p2 >= 75 && p2 <= 77) return 'Odisha';
  if (p2 === 78) return 'Assam';
  if (p2 === 79) return 'North East';
  if (p2 >= 80 && p2 <= 83) return 'Bihar';
  if (p2 >= 84 && p2 <= 85) return 'Bihar & Jharkhand';
  return 'India';
}

function toTitleCase(str) {
  if (!str) return '';
  return str
    .toLowerCase()
    .split(' ')
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

async function getTsvContent() {
  if (fs.existsSync(LOCAL_FILE)) {
    console.log(`Using cached TSV file: ${LOCAL_FILE} (${fs.statSync(LOCAL_FILE).size} bytes)`);
    return fs.readFileSync(LOCAL_FILE, 'utf8');
  }

  console.log(`Downloading fresh TSV from ${TSV_URL}...`);
  return new Promise((resolve, reject) => {
    https.get(TSV_URL, (res) => {
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP error ${res.statusCode}`));
      }
      let raw = '';
      res.on('data', chunk => { raw += chunk; });
      res.on('end', () => {
        fs.writeFileSync(LOCAL_FILE, raw, 'utf8');
        console.log(`Downloaded and cached ${raw.length} bytes.`);
        resolve(raw);
      });
    }).on('error', reject);
  });
}

async function main() {
  const startTime = Date.now();
  console.log('='.repeat(60));
  console.log('  PIN CODE MASTER INGESTION SERVICE');
  console.log('='.repeat(60));

  const tsvData = await getTsvContent();
  const lines = tsvData.split(/\r?\n/).filter(l => l.trim().length > 0);
  console.log(`Total rows to process: ${lines.length}`);

  const pinMap = new Map();
  const bankStats = {};
  const GENERIC_ZONES = new Set(['north', 'south', 'east', 'west', 'central', 'zone']);

  for (let i = 0; i < lines.length; i++) {
    const parts = lines[i].split('\t');
    const pin = (parts[0] || '').trim();
    if (!pin || pin.length !== 6 || !/^\d{6}$/.test(pin)) continue;

    const rawBank = (parts[1] || '').trim();
    const rawCity = (parts[2] || '').trim();
    const rawMarket = (parts[3] || '').trim();

    const lenderName = BANK_MAP[rawBank] || rawBank || 'Other Lender';
    bankStats[lenderName] = (bankStats[lenderName] || 0) + 1;

    let entry = pinMap.get(pin);
    if (!entry) {
      entry = {
        pincode: pin,
        state: getStateFromPin(pin),
        cityFreq: {},
        lenders: new Map()
      };
      pinMap.set(pin, entry);
    }

    if (rawCity && !GENERIC_ZONES.has(rawCity.toLowerCase())) {
      const normalizedCity = rawCity.toUpperCase();
      entry.cityFreq[normalizedCity] = (entry.cityFreq[normalizedCity] || 0) + 1;
    }

    if (!entry.lenders.has(lenderName)) {
      const category = rawMarket || 'Standard';
      const branch = rawCity || 'Regional Office';
      const tat = lenderName.includes('Bajaj') ? 1 : lenderName.includes('HDFC') ? 2 : 3;

      entry.lenders.set(lenderName, {
        lender: lenderName,
        isServiceable: true,
        branchName: branch,
        category: category,
        products: BANK_DEFAULT_PRODUCTS[lenderName] || ['Personal Loan', 'Business Loan', 'LAP'],
        tatDays: tat
      });
    } else {
      const existing = entry.lenders.get(lenderName);
      if (rawMarket && (existing.category === 'Standard' || !existing.category)) {
        existing.category = rawMarket;
      }
      if (rawCity && (existing.branchName === 'Regional Office' || !existing.branchName)) {
        existing.branchName = rawCity;
      }
    }
  }

  console.log(`Aggregated into ${pinMap.size} unique PIN codes across India.`);
  console.log('\nLender representation across dataset:');
  console.table(bankStats);

  // Build MongoDB document list
  const documents = [];
  const stateCounter = {};

  for (const [pin, data] of pinMap.entries()) {
    const sortedCities = Object.entries(data.cityFreq).sort((a, b) => b[1] - a[1]);
    const primaryCity = sortedCities.length > 0 ? toTitleCase(sortedCities[0][0]) : data.state;
    const secondaryCities = sortedCities.slice(1, 3).map(c => toTitleCase(c[0]));
    const area = secondaryCities.length > 0 
      ? `${secondaryCities.join(', ')}, ${primaryCity}` 
      : `${primaryCity} Sector`;

    stateCounter[data.state] = (stateCounter[data.state] || 0) + 1;

    documents.push({
      pincode: pin,
      area: area,
      city: primaryCity,
      state: data.state,
      lenders: Array.from(data.lenders.values()),
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  console.log(`Connecting to MongoDB at ${MONGODB_URI}...`);
  await mongoose.connect(MONGODB_URI);
  console.log('MongoDB connected successfully.');

  const collection = mongoose.connection.collection('pincodes');

  console.log('Dropping old pincodes collection and indexes...');
  try {
    await collection.drop();
  } catch (e) {
    // collection might not exist yet
  }

  console.log(`Inserting ${documents.length} PIN codes in batches of 3,000...`);
  const BATCH_SIZE = 3000;
  for (let i = 0; i < documents.length; i += BATCH_SIZE) {
    const batch = documents.slice(i, i + BATCH_SIZE);
    await collection.insertMany(batch, { ordered: false });
    const percent = Math.min(100, Math.round(((i + batch.length) / documents.length) * 100));
    process.stdout.write(`  [${percent}%] Inserted ${Math.min(i + BATCH_SIZE, documents.length)} / ${documents.length} documents...\r`);
  }

  console.log('\nBuilding search indexes for instant queries...');
  await collection.createIndex({ pincode: 1 }, { unique: true });
  await collection.createIndex({ city: 1 });
  await collection.createIndex({ state: 1 });
  await collection.createIndex({ 'lenders.lender': 1 });

  const totalInDb = await collection.countDocuments();
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log('='.repeat(60));
  console.log(`SUCCESSFULLY INGESTED ${totalInDb} PIN CODES IN ${elapsed}s!`);
  console.log('='.repeat(60));

  await mongoose.disconnect();
}

main().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
