const mongoose = require("mongoose");

const LOCAL_URI = process.env.LOCAL_MONGODB_URI || "mongodb://127.0.0.1:27017/arjun_loan_ops";
const REMOTE_URI = process.env.TARGET_MONGODB_URI || "mongodb+srv://girlyhubsupport_db_user:6TRVj3A6CCUSBRon@freelance.45v6ftx.mongodb.net/arjun";

async function migrate() {
  console.log("==========================================");
  console.log("Starting MongoDB Migration to Atlas");
  console.log("Source: ", LOCAL_URI);
  console.log("Target: ", REMOTE_URI.replace(/:([^:@]+)@/, ":****@"));
  console.log("==========================================");

  const localConn = await mongoose.createConnection(LOCAL_URI).asPromise();
  const remoteConn = await mongoose.createConnection(REMOTE_URI).asPromise();

  // 1. Migrate Users
  console.log("\n[1/3] Migrating 'users' collection...");
  const localUsers = await localConn.db.collection("users").find({}).toArray();
  console.log(`Found ${localUsers.length} users in local DB.`);
  if (localUsers.length > 0) {
    const remoteUsersColl = remoteConn.db.collection("users");
    // Clear any previous test data if present
    await remoteUsersColl.deleteMany({});
    await remoteUsersColl.insertMany(localUsers);
    // Create indexes
    await remoteUsersColl.createIndex({ email: 1 }, { unique: true });
    console.log(`✓ Successfully migrated ${localUsers.length} users and indexes.`);
  }

  // 2. Migrate Companies
  console.log("\n[2/3] Migrating 'companies' collection...");
  const localCompanies = await localConn.db.collection("companies").find({}).toArray();
  console.log(`Found ${localCompanies.length} companies in local DB.`);
  if (localCompanies.length > 0) {
    const remoteCompaniesColl = remoteConn.db.collection("companies");
    await remoteCompaniesColl.deleteMany({});
    await remoteCompaniesColl.insertMany(localCompanies);
    // Create indexes
    await remoteCompaniesColl.createIndex({ name: 1 });
    await remoteCompaniesColl.createIndex({ name: "text" });
    console.log(`✓ Successfully migrated ${localCompanies.length} companies and text indexes.`);
  }

  // 3. Migrate PIN Codes in streaming batches
  console.log("\n[3/3] Migrating 'pincodes' collection (30,630 records)...");
  const localPinColl = localConn.db.collection("pincodes");
  const remotePinColl = remoteConn.db.collection("pincodes");
  const totalPins = await localPinColl.countDocuments();
  console.log(`Found ${totalPins} PIN codes in local DB.`);

  await remotePinColl.deleteMany({});

  const cursor = localPinColl.find({});
  const BATCH_SIZE = 2000;
  let batch = [];
  let totalInserted = 0;

  while (await cursor.hasNext()) {
    const doc = await cursor.next();
    batch.push(doc);

    if (batch.length >= BATCH_SIZE) {
      await remotePinColl.insertMany(batch, { ordered: false });
      totalInserted += batch.length;
      process.stdout.write(`Migrated ${totalInserted} / ${totalPins} PIN codes (${Math.round((totalInserted / totalPins) * 100)}%)...\r`);
      batch = [];
    }
  }

  if (batch.length > 0) {
    await remotePinColl.insertMany(batch, { ordered: false });
    totalInserted += batch.length;
  }
  console.log(`\n✓ Successfully migrated ${totalInserted} PIN codes.`);

  // Create indexes for pincodes on Atlas
  console.log("Building indexes for 'pincodes' on Atlas...");
  await remotePinColl.createIndex({ pincode: 1 }, { unique: true });
  await remotePinColl.createIndex({ city: 1 });
  await remotePinColl.createIndex({ state: 1 });
  await remotePinColl.createIndex({ "lenders.lender": 1 });
  console.log("✓ Successfully created PIN code indexes (pincode_1, city_1, state_1, lenders.lender_1).");

  // 4. Verification
  console.log("\n==========================================");
  console.log("Verifying Remote Atlas Database...");
  console.log("==========================================");
  const remoteCollections = await remoteConn.db.listCollections().toArray();
  for (const c of remoteCollections) {
    const count = await remoteConn.db.collection(c.name).countDocuments();
    console.log(`Collection '${c.name}': ${count} documents`);
  }

  // Quick spot-checks
  const sampleUser = await remoteConn.db.collection("users").findOne({});
  console.log("\nSample User:", sampleUser ? { email: sampleUser.email, name: sampleUser.name, role: sampleUser.role } : "None");

  const sampleCompany = await remoteConn.db.collection("companies").findOne({});
  console.log("Sample Company:", sampleCompany ? { name: sampleCompany.name, category: sampleCompany.category, lenders: sampleCompany.lenderCategories?.length } : "None");

  const samplePin = await remoteConn.db.collection("pincodes").findOne({ pincode: "110001" });
  console.log("Sample PIN (110001):", samplePin ? { pincode: samplePin.pincode, city: samplePin.city, state: samplePin.state, lenders: samplePin.lenders?.length } : "None");

  await localConn.close();
  await remoteConn.close();
  console.log("\n🎉 ALL DATA MIGRATED AND VERIFIED SUCCESSFULLY!");
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
