import mongoose from "mongoose";
import User from "./models/User";
import Company from "./models/Company";
import PinCode from "./models/PinCode";
import { hashPassword } from "./auth";

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/arjun_loan_ops";

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
  seeded: boolean;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

let cached: MongooseCache = global.mongooseCache || {
  conn: null,
  promise: null,
  seeded: false,
};

if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

export async function connectToDatabase(): Promise<typeof mongoose> {
  if (cached.conn) {
    if (!cached.seeded) {
      await seedInitialData();
      cached.seeded = true;
    }
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((m) => {
      return m;
    });
  }

  try {
    cached.conn = await cached.promise;
    if (!cached.seeded) {
      await seedInitialData();
      cached.seeded = true;
    }
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export async function seedInitialData() {
  try {
    // 1. Ensure Superadmin exists
    const adminEmail = (
      process.env.DEFAULT_ADMIN_EMAIL || "superadmin@arjungrewal.online"
    ).toLowerCase();
    const existingAdmin = await User.findOne({
      $or: [{ email: adminEmail }, { role: "superadmin" }],
    });

    if (!existingAdmin) {
      const defaultPassword =
        process.env.DEFAULT_ADMIN_PASSWORD || "SuperAdmin@2026";
      const hashedPassword = await hashPassword(defaultPassword);
      await User.create({
        name: process.env.DEFAULT_ADMIN_NAME || "Arjun Grewal",
        email: adminEmail,
        password: hashedPassword,
        role: "superadmin",
        status: "active",
        createdBy: "system_bootstrap",
      });
      console.log(`[Seed] Initial superadmin created: ${adminEmail}`);
    }

    // 2. Ensure Sample Companies exist
    const companyCount = await Company.countDocuments();
    if (companyCount === 0) {
      const sampleCompanies = [
        {
          name: "Tata Consultancy Services Ltd (TCS)",
          industry: "Information Technology",
          category: "Super Cat A",
          minSalary: 25000,
          remarks: "Preferred corporate. Zero processing fee offers available.",
          lenderCategories: [
            { lender: "HDFC Bank", category: "Super A", multiplier: 24, maxLoan: 5000000 },
            { lender: "ICICI Bank", category: "Diamond", multiplier: 22, maxLoan: 5000000 },
            { lender: "Axis Bank", category: "Elite Cat A", multiplier: 20, maxLoan: 4000000 },
            { lender: "Kotak Mahindra Bank", category: "Cat A", multiplier: 21, maxLoan: 4500000 },
            { lender: "Bajaj Finserv", category: "Top Tier", multiplier: 25, maxLoan: 4000000 },
            { lender: "Tata Capital", category: "Group Company", multiplier: 26, maxLoan: 5000000 },
          ],
        },
        {
          name: "Infosys Limited",
          industry: "Information Technology",
          category: "Super Cat A",
          minSalary: 25000,
          remarks: "Special ROI discount of 0.25% across private lenders.",
          lenderCategories: [
            { lender: "HDFC Bank", category: "Super A", multiplier: 24, maxLoan: 5000000 },
            { lender: "ICICI Bank", category: "Diamond", multiplier: 22, maxLoan: 5000000 },
            { lender: "Axis Bank", category: "Elite Cat A", multiplier: 20, maxLoan: 4000000 },
            { lender: "Kotak Mahindra Bank", category: "Cat A", multiplier: 20, maxLoan: 4000000 },
            { lender: "Bajaj Finserv", category: "Top Tier", multiplier: 24, maxLoan: 3500000 },
            { lender: "Tata Capital", category: "Prime", multiplier: 22, maxLoan: 4000000 },
          ],
        },
        {
          name: "Wipro Technologies Ltd",
          industry: "IT & Consulting",
          category: "Cat A",
          minSalary: 28000,
          remarks: "Approved for express digital sanction.",
          lenderCategories: [
            { lender: "HDFC Bank", category: "Cat A", multiplier: 20, maxLoan: 4000000 },
            { lender: "ICICI Bank", category: "Platinum", multiplier: 20, maxLoan: 4000000 },
            { lender: "Axis Bank", category: "Cat A", multiplier: 18, maxLoan: 3500000 },
            { lender: "Kotak Mahindra Bank", category: "Cat A", multiplier: 19, maxLoan: 3500000 },
            { lender: "Bajaj Finserv", category: "Cat A", multiplier: 20, maxLoan: 3500000 },
          ],
        },
        {
          name: "Reliance Industries Limited (RIL)",
          industry: "Conglomerate / Energy & Telecom",
          category: "Super Cat A",
          minSalary: 30000,
          remarks: "Includes Jio, Retail, and Petrochem divisions.",
          lenderCategories: [
            { lender: "HDFC Bank", category: "Super A", multiplier: 24, maxLoan: 5000000 },
            { lender: "ICICI Bank", category: "Diamond", multiplier: 24, maxLoan: 5000000 },
            { lender: "Axis Bank", category: "Elite Cat A", multiplier: 22, maxLoan: 5000000 },
            { lender: "Kotak Mahindra Bank", category: "Cat A", multiplier: 22, maxLoan: 4500000 },
            { lender: "Tata Capital", category: "Prime", multiplier: 24, maxLoan: 5000000 },
          ],
        },
        {
          name: "HCL Technologies Ltd",
          industry: "Information Technology",
          category: "Cat A",
          minSalary: 25000,
          remarks: "Standard Cat A documentation, 3 months salary slip.",
          lenderCategories: [
            { lender: "HDFC Bank", category: "Cat A", multiplier: 20, maxLoan: 3500000 },
            { lender: "ICICI Bank", category: "Platinum", multiplier: 19, maxLoan: 3500000 },
            { lender: "Axis Bank", category: "Cat A", multiplier: 18, maxLoan: 3000000 },
            { lender: "Bajaj Finserv", category: "Cat A", multiplier: 20, maxLoan: 3000000 },
          ],
        },
        {
          name: "Deloitte Touche Tohmatsu India LLP",
          industry: "Auditing & Financial Advisory",
          category: "Super Cat A",
          minSalary: 35000,
          remarks: "Top multinational professional firm listing.",
          lenderCategories: [
            { lender: "HDFC Bank", category: "Super A", multiplier: 24, maxLoan: 5000000 },
            { lender: "ICICI Bank", category: "Diamond", multiplier: 24, maxLoan: 5000000 },
            { lender: "Axis Bank", category: "Elite Cat A", multiplier: 22, maxLoan: 4500000 },
            { lender: "Kotak Mahindra Bank", category: "Super A", multiplier: 24, maxLoan: 5000000 },
          ],
        },
        {
          name: "Larsen & Toubro Ltd (L&T)",
          industry: "Engineering & Construction",
          category: "Cat A",
          minSalary: 30000,
          remarks: "Valid across L&T Infotech, Mindtree, and Core EPC.",
          lenderCategories: [
            { lender: "HDFC Bank", category: "Cat A", multiplier: 21, maxLoan: 4000000 },
            { lender: "ICICI Bank", category: "Diamond", multiplier: 22, maxLoan: 4000000 },
            { lender: "Axis Bank", category: "Cat A", multiplier: 20, maxLoan: 3500000 },
            { lender: "Tata Capital", category: "Prime", multiplier: 22, maxLoan: 4000000 },
          ],
        },
        {
          name: "Apollo Hospitals Enterprise Ltd",
          industry: "Healthcare & Pharmaceuticals",
          category: "Cat B",
          minSalary: 25000,
          remarks: "Medical professionals qualify for specialized doctor loan programs.",
          lenderCategories: [
            { lender: "HDFC Bank", category: "Cat B", multiplier: 18, maxLoan: 2500000 },
            { lender: "ICICI Bank", category: "Gold", multiplier: 18, maxLoan: 2500000 },
            { lender: "Bajaj Finserv", category: "Cat B", multiplier: 19, maxLoan: 2500000 },
          ],
        },
        {
          name: "Zomato Ltd (Eternal)",
          industry: "Internet & Food Tech",
          category: "Cat B",
          minSalary: 30000,
          remarks: "Listed tech startup policy applies. 6 months bank statement.",
          lenderCategories: [
            { lender: "HDFC Bank", category: "Cat B", multiplier: 18, maxLoan: 2500000 },
            { lender: "ICICI Bank", category: "Gold", multiplier: 18, maxLoan: 2500000 },
            { lender: "Kotak Mahindra Bank", category: "Cat B", multiplier: 17, maxLoan: 2000000 },
            { lender: "Axis Bank", category: "Cat B", multiplier: 16, maxLoan: 2000000 },
          ],
        },
      ];
      await Company.insertMany(sampleCompanies);
      console.log(`[Seed] Seeded ${sampleCompanies.length} companies`);
    }

    // 3. Ensure Sample PIN Codes exist
    const pinCount = await PinCode.countDocuments();
    if (pinCount === 0) {
      const samplePinCodes = [
        {
          pincode: "110001",
          area: "Connaught Place, Barakhamba",
          city: "New Delhi",
          state: "Delhi",
          lenders: [
            { lender: "HDFC Bank", isServiceable: true, branchName: "K.G. Marg", products: ["Personal Loan", "Home Loan", "Business Loan", "LAP"], tatDays: 2 },
            { lender: "ICICI Bank", isServiceable: true, branchName: "Connaught Circus", products: ["Personal Loan", "Home Loan", "LAP"], tatDays: 2 },
            { lender: "Axis Bank", isServiceable: true, branchName: "Statesman House", products: ["Personal Loan", "Home Loan", "Business Loan"], tatDays: 3 },
            { lender: "Kotak Mahindra Bank", isServiceable: true, branchName: "Janpath", products: ["Personal Loan", "Home Loan"], tatDays: 2 },
            { lender: "Bajaj Finserv", isServiceable: true, branchName: "Delhi Central", products: ["Personal Loan", "Doctor Loan"], tatDays: 1 },
            { lender: "Tata Capital", isServiceable: true, branchName: "Central Delhi Hub", products: ["Personal Loan", "Home Loan", "Business Loan"], tatDays: 2 },
          ],
        },
        {
          pincode: "400001",
          area: "Fort, Nariman Point, Colaba",
          city: "Mumbai",
          state: "Maharashtra",
          lenders: [
            { lender: "HDFC Bank", isServiceable: true, branchName: "Fort Branch", products: ["Personal Loan", "Home Loan", "Business Loan", "LAP"], tatDays: 2 },
            { lender: "ICICI Bank", isServiceable: true, branchName: "Nariman Point", products: ["Personal Loan", "Home Loan", "LAP"], tatDays: 2 },
            { lender: "Axis Bank", isServiceable: true, branchName: "Flora Fountain", products: ["Personal Loan", "Home Loan", "Business Loan"], tatDays: 2 },
            { lender: "Kotak Mahindra Bank", isServiceable: true, branchName: "Bakhtawar Nariman Point", products: ["Personal Loan", "Home Loan", "LAP"], tatDays: 2 },
            { lender: "Bajaj Finserv", isServiceable: true, branchName: "Mumbai South Hub", products: ["Personal Loan", "Business Loan"], tatDays: 1 },
          ],
        },
        {
          pincode: "560001",
          area: "MG Road, Brigade Road, Ashok Nagar",
          city: "Bengaluru",
          state: "Karnataka",
          lenders: [
            { lender: "HDFC Bank", isServiceable: true, branchName: "Richmond Road", products: ["Personal Loan", "Home Loan", "Business Loan"], tatDays: 2 },
            { lender: "ICICI Bank", isServiceable: true, branchName: "MG Road", products: ["Personal Loan", "Home Loan", "LAP"], tatDays: 2 },
            { lender: "Axis Bank", isServiceable: true, branchName: "Residency Road", products: ["Personal Loan", "Home Loan"], tatDays: 3 },
            { lender: "Kotak Mahindra Bank", isServiceable: true, branchName: "Lavelle Road", products: ["Personal Loan", "Home Loan", "LAP"], tatDays: 2 },
            { lender: "Tata Capital", isServiceable: true, branchName: "Cunningham Road", products: ["Personal Loan", "Home Loan"], tatDays: 2 },
          ],
        },
        {
          pincode: "500081",
          area: "Madhapur, Hitech City",
          city: "Hyderabad",
          state: "Telangana",
          lenders: [
            { lender: "HDFC Bank", isServiceable: true, branchName: "Hitech City Hub", products: ["Personal Loan", "Home Loan", "Business Loan"], tatDays: 2 },
            { lender: "ICICI Bank", isServiceable: true, branchName: "Cyber Gateway", products: ["Personal Loan", "Home Loan", "LAP"], tatDays: 2 },
            { lender: "Axis Bank", isServiceable: true, branchName: "Madhapur Main", products: ["Personal Loan", "Home Loan"], tatDays: 2 },
            { lender: "Bajaj Finserv", isServiceable: true, branchName: "Cyberabad", products: ["Personal Loan", "Business Loan"], tatDays: 1 },
          ],
        },
        {
          pincode: "411001",
          area: "Pune Station, Camp, Bund Garden",
          city: "Pune",
          state: "Maharashtra",
          lenders: [
            { lender: "HDFC Bank", isServiceable: true, branchName: "Camp Pune", products: ["Personal Loan", "Home Loan", "LAP"], tatDays: 2 },
            { lender: "ICICI Bank", isServiceable: true, branchName: "Bund Garden Road", products: ["Personal Loan", "Home Loan"], tatDays: 2 },
            { lender: "Axis Bank", isServiceable: true, branchName: "MG Road Camp", products: ["Personal Loan", "Home Loan", "Business Loan"], tatDays: 3 },
          ],
        },
        {
          pincode: "600017",
          area: "T. Nagar, Thyagaraya Nagar",
          city: "Chennai",
          state: "Tamil Nadu",
          lenders: [
            { lender: "HDFC Bank", isServiceable: true, branchName: "T Nagar South Boag", products: ["Personal Loan", "Home Loan", "LAP"], tatDays: 2 },
            { lender: "ICICI Bank", isServiceable: true, branchName: "Pondy Bazaar", products: ["Personal Loan", "Home Loan"], tatDays: 2 },
            { lender: "Axis Bank", isServiceable: true, branchName: "Usman Road", products: ["Personal Loan", "Home Loan", "Business Loan"], tatDays: 3 },
          ],
        },
      ];
      await PinCode.insertMany(samplePinCodes);
      console.log(`[Seed] Seeded ${samplePinCodes.length} PIN codes`);
    }
  } catch (err) {
    console.error("[Seed] Error seeding data:", err);
  }
}
