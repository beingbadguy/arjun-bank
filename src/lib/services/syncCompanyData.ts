import fs from "fs";
import path from "path";
import https from "https";
import readline from "readline";
import mongoose from "mongoose";
import Company from "../models/Company";
import { connectToDatabase } from "../db";

export const LOCAL_COMPANY_TSV_PATH = "company_master.tsv";
export const DEFAULT_COMPANY_TSV_URL = process.env.COMPANY_TSV_URL || "";

const LENDER_NAME_MAP: Record<string, string> = {
  "TATA CAPITAL": "Tata Capital",
  "KOTAK BANK": "Kotak Mahindra Bank",
  "AXIS FINANCE": "Axis Finance",
  "POONAWALA": "Poonawalla Fincorp",
  "ICICI BANK": "ICICI Bank",
  "INDUSIND": "IndusInd Bank",
  "AXIS BANK": "Axis Bank",
  "idfc bank": "IDFC FIRST Bank",
  "IDFC BANK": "IDFC FIRST Bank",
  "PIRAMAL": "Piramal Finance",
};

function deriveCategoryMetrics(cat: string) {
  const c = (cat || "").toUpperCase();
  if (c.includes("SUPER") || c.includes("DIAMOND") || c.includes("ELITE")) {
    return { multiplier: 24, maxLoan: 5000000 };
  }
  if (
    c.includes("CAT A") ||
    c.includes("CATEGORY A") ||
    c.includes("PLATINUM") ||
    c.includes("GOVERNMENT") ||
    c.includes("TATA GROUP") ||
    c.includes("CATGA")
  ) {
    return { multiplier: 22, maxLoan: 4500000 };
  }
  if (
    c.includes("CAT B") ||
    c.includes("CATEGORY B") ||
    c.includes("GOLD") ||
    c.includes("CATGB")
  ) {
    return { multiplier: 20, maxLoan: 4000000 };
  }
  if (
    c.includes("CAT C") ||
    c.includes("CATEGORY C") ||
    c.includes("SILVER") ||
    c.includes("CATGC")
  ) {
    return { multiplier: 18, maxLoan: 3000000 };
  }
  if (
    c.includes("CAT D") ||
    c.includes("CATEGORY D") ||
    c.includes("OPEN MARKET") ||
    c.includes("CSC D") ||
    c.includes("CATGD")
  ) {
    return { multiplier: 15, maxLoan: 2000000 };
  }
  if (c.includes("DELIST") || c.includes("NEGATIVE")) {
    return { multiplier: 0, maxLoan: 0 };
  }
  return { multiplier: 18, maxLoan: 3000000 };
}

function deriveOverallTier(lenderCategories: { lender: string; category: string }[]) {
  const combined = lenderCategories.map((l) => (l.category || "").toUpperCase()).join(" ");
  if (combined.includes("SUPER") || combined.includes("DIAMOND") || combined.includes("ELITE")) {
    return "Super Cat A";
  }
  if (
    combined.includes("CAT A") ||
    combined.includes("CATEGORY A") ||
    combined.includes("PLATINUM") ||
    combined.includes("GOVERNMENT") ||
    combined.includes("TATA GROUP") ||
    combined.includes("CATGA")
  ) {
    return "Cat A";
  }
  if (
    combined.includes("CAT B") ||
    combined.includes("CATEGORY B") ||
    combined.includes("GOLD") ||
    combined.includes("CATGB")
  ) {
    return "Cat B";
  }
  if (
    combined.includes("CAT C") ||
    combined.includes("CATEGORY C") ||
    combined.includes("SILVER") ||
    combined.includes("CATGC")
  ) {
    return "Cat C";
  }
  if (combined.includes("DELIST") && !combined.includes("CAT")) {
    return "Delist";
  }
  return "Cat B";
}

function deriveIndustry(name: string) {
  const n = name.toUpperCase();
  if (
    n.includes("TECH") ||
    n.includes("INFOSYS") ||
    n.includes("SOFTWARE") ||
    n.includes("SYSTEMS") ||
    n.includes("SOLUTIONS") ||
    n.includes("DIGITAL")
  ) {
    return "Information Technology & Software";
  }
  if (
    n.includes("HOSPITAL") ||
    n.includes("MEDICAL") ||
    n.includes("HEALTH") ||
    n.includes("PHARMA") ||
    n.includes("CLINIC") ||
    n.includes("CARE")
  ) {
    return "Healthcare & Pharmaceuticals";
  }
  if (
    n.includes("FINANCE") ||
    n.includes("BANK") ||
    n.includes("CAPITAL") ||
    n.includes("SECURITIES") ||
    n.includes("WEALTH")
  ) {
    return "Financial Services & Banking";
  }
  if (
    n.includes("MOTORS") ||
    n.includes("AUTO") ||
    n.includes("ENGINEERING") ||
    n.includes("STEEL") ||
    n.includes("INDUSTRIES") ||
    n.includes("MANUFACTURING")
  ) {
    return "Manufacturing & Engineering";
  }
  if (
    n.includes("LOGISTICS") ||
    n.includes("TRANSPORT") ||
    n.includes("CARGO") ||
    n.includes("EXPRESS") ||
    n.includes("SUPPLY CHAIN")
  ) {
    return "Logistics & Supply Chain";
  }
  if (
    n.includes("INFRA") ||
    n.includes("BUILD") ||
    n.includes("DEVELOPERS") ||
    n.includes("PROJECTS") ||
    n.includes("PROPERTIES") ||
    n.includes("ESTATE")
  ) {
    return "Infrastructure & Real Estate";
  }
  if (
    n.includes("EDUCATION") ||
    n.includes("SCHOOL") ||
    n.includes("COLLEGE") ||
    n.includes("UNIVERSITY") ||
    n.includes("ACADEMY")
  ) {
    return "Education & Training";
  }
  if (
    n.includes("RETAIL") ||
    n.includes("FOOD") ||
    n.includes("FASHION") ||
    n.includes("BEVERAGES") ||
    n.includes("CONSUMER")
  ) {
    return "Retail & Consumer Goods";
  }
  return "Corporate Enterprise";
}

export async function syncCompanyDataFromTsv(tsvUrlOrPath = "") {
  const startTime = Date.now();
  await connectToDatabase();

  const effectiveUrlOrPath = tsvUrlOrPath || process.env.COMPANY_TSV_URL || LOCAL_COMPANY_TSV_PATH;
  let targetFilePath = path.resolve(process.cwd(), LOCAL_COMPANY_TSV_PATH);

  // If a remote URL is provided, download to local cache first
  if (effectiveUrlOrPath.startsWith("http://") || effectiveUrlOrPath.startsWith("https://")) {
    console.log(`[Company Sync] Fetching remote TSV master dataset...`);
    targetFilePath = path.resolve(process.cwd(), "company_download_temp.tsv");
    await new Promise<void>((resolve, reject) => {
      const fileStream = fs.createWriteStream(targetFilePath);
      https
        .get(effectiveUrlOrPath, (res) => {
          if (res.statusCode !== 200) {
            reject(new Error(`Failed to download TSV: HTTP ${res.statusCode}`));
            return;
          }
          res.pipe(fileStream);
          fileStream.on("finish", () => {
            fileStream.close();
            resolve();
          });
        })
        .on("error", (err) => {
          fs.unlink(targetFilePath, () => {});
          reject(err);
        });
    });
  }

  if (!fs.existsSync(targetFilePath)) {
    throw new Error(`Master company TSV file not found at ${targetFilePath}`);
  }

  console.log(`[Company Sync] Processing TSV stream from ${targetFilePath}...`);
  const fileStream = fs.createReadStream(targetFilePath);
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  const companyMap = new Map<
    string,
    {
      name: string;
      nameNormalized: string;
      lenders: { lender: string; category: string; multiplier: number; maxLoan: number }[];
    }
  >();

  let totalLines = 0;

  for await (const line of rl) {
    totalLines++;
    if (!line.trim()) continue;
    const parts = line.split("\t");
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

    const entry = companyMap.get(normalizedKey)!;
    if (!entry.lenders.some((l) => l.lender === cleanLender)) {
      entry.lenders.push({
        lender: cleanLender,
        category: rawCat,
        multiplier: metrics.multiplier,
        maxLoan: metrics.maxLoan,
      });
    }
  }

  const documents: any[] = [];
  const now = new Date();
  for (const item of companyMap.values()) {
    const overallCategory = deriveOverallTier(item.lenders);
    const industry = deriveIndustry(item.name);
    documents.push({
      name: item.name,
      nameNormalized: item.nameNormalized,
      industry,
      category: overallCategory,
      lenderCategories: item.lenders,
      minSalary: 25000,
      remarks: `Listed across ${item.lenders.length} partner lender matrices.`,
      createdAt: now,
      updatedAt: now,
    });
  }

  companyMap.clear();

  const companiesCollection = Company.collection;
  await companiesCollection.deleteMany({});

  const BATCH_SIZE = 5000;
  const CONCURRENCY = 4;
  const totalDocs = documents.length;
  let inserted = 0;

  const chunks: any[][] = [];
  for (let i = 0; i < totalDocs; i += BATCH_SIZE) {
    chunks.push(documents.slice(i, i + BATCH_SIZE));
  }

  for (let i = 0; i < chunks.length; i += CONCURRENCY) {
    const pool = chunks.slice(i, i + CONCURRENCY);
    await Promise.all(
      pool.map(async (chunk) => {
        await companiesCollection.insertMany(chunk, { ordered: false });
        inserted += chunk.length;
      })
    );
  }

  // Ensure Indexes
  await companiesCollection.createIndex({ name: 1 }, { background: true });
  await companiesCollection.createIndex({ nameNormalized: 1 }, { background: true });
  await companiesCollection.createIndex({ category: 1 }, { background: true });
  await companiesCollection.createIndex({ "lenderCategories.lender": 1 }, { background: true });
  await companiesCollection.createIndex({ name: "text" }, { background: true });

  const durationMs = Date.now() - startTime;

  return {
    success: true,
    totalRows: totalLines,
    totalCompanies: inserted,
    durationMs,
    message: `Extracted ${totalLines.toLocaleString()} rows and synchronized ${inserted.toLocaleString()} companies into MongoDB in ${(durationMs / 1000).toFixed(1)}s`,
  };
}
