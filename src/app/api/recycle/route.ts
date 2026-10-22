import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Banker from "@/lib/models/Banker";
import PinCode from "@/lib/models/PinCode";
import Company from "@/lib/models/Company";
import CaseEntry from "@/lib/models/CaseEntry";

// GET /api/recycle - Fetch all soft-deleted items across sections
// Note: Intentionally unlocked as per requirement: "do not lock the /recycle"
export async function GET(request: Request) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const section = (searchParams.get("section") || "all").toLowerCase();
    const search = (searchParams.get("search") || searchParams.get("q") || "").trim().toLowerCase();

    // 1. Fetch counts
    const [bankersCount, pincodesCount, companiesCount, casesCount] = await Promise.all([
      Banker.countDocuments({ isDeleted: true }),
      PinCode.countDocuments({ isDeleted: true }),
      Company.countDocuments({ isDeleted: true }),
      CaseEntry.countDocuments({ isDeleted: true }),
    ]);

    const counts = {
      bankers: bankersCount,
      pincodes: pincodesCount,
      companies: companiesCount,
      cases: casesCount,
      total: bankersCount + pincodesCount + companiesCount + casesCount,
    };

    // 2. Fetch records according to section
    let bankers: any[] = [];
    let pincodes: any[] = [];
    let companies: any[] = [];
    let cases: any[] = [];

    const fetchBankers = section === "all" || section === "bankers";
    const fetchPincodes = section === "all" || section === "pincodes";
    const fetchCompanies = section === "all" || section === "companies";
    const fetchCases = section === "all" || section === "cases";

    const promises: Promise<any>[] = [];

    if (fetchBankers) {
      promises.push(
        Banker.find({ isDeleted: true })
          .sort({ deletedAt: -1, updatedAt: -1 })
          .lean()
          .then((res) => {
            bankers = res;
          })
      );
    }

    if (fetchPincodes) {
      promises.push(
        PinCode.find({ isDeleted: true })
          .sort({ deletedAt: -1, updatedAt: -1 })
          .lean()
          .then((res) => {
            pincodes = res;
          })
      );
    }

    if (fetchCompanies) {
      promises.push(
        Company.find({ isDeleted: true })
          .sort({ deletedAt: -1, updatedAt: -1 })
          .lean()
          .then((res) => {
            companies = res;
          })
      );
    }

    if (fetchCases) {
      promises.push(
        CaseEntry.find({ isDeleted: true })
          .sort({ deletedAt: -1, updatedAt: -1 })
          .lean()
          .then((res) => {
            cases = res;
          })
      );
    }

    await Promise.all(promises);

    // 3. In-memory filter if search query is provided
    if (search) {
      if (bankers.length > 0) {
        bankers = bankers.filter(
          (b) =>
            b.name?.toLowerCase().includes(search) ||
            b.bankName?.toLowerCase().includes(search) ||
            b.city?.toLowerCase().includes(search) ||
            b.branch?.toLowerCase().includes(search) ||
            b.phone?.toLowerCase().includes(search) ||
            b.designation?.toLowerCase().includes(search) ||
            b.email?.toLowerCase().includes(search)
        );
      }

      if (pincodes.length > 0) {
        pincodes = pincodes.filter(
          (p) =>
            p.pincode?.toLowerCase().includes(search) ||
            p.area?.toLowerCase().includes(search) ||
            p.city?.toLowerCase().includes(search) ||
            p.state?.toLowerCase().includes(search)
        );
      }

      if (companies.length > 0) {
        companies = companies.filter(
          (c) =>
            c.name?.toLowerCase().includes(search) ||
            c.industry?.toLowerCase().includes(search) ||
            c.category?.toLowerCase().includes(search)
        );
      }

      if (cases.length > 0) {
        cases = cases.filter(
          (cs) =>
            cs.name?.toLowerCase().includes(search) ||
            cs.customerId?.toLowerCase().includes(search) ||
            cs.bankName?.toLowerCase().includes(search) ||
            cs.location?.toLowerCase().includes(search) ||
            cs.product?.toLowerCase().includes(search) ||
            cs.applicationNo?.toLowerCase().includes(search)
        );
      }
    }

    return NextResponse.json({
      success: true,
      counts,
      data: {
        bankers,
        pincodes,
        companies,
        cases,
      },
    });
  } catch (error: any) {
    console.error("Recycle Bin API GET error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch recycle bin records" },
      { status: 500 }
    );
  }
}

// POST /api/recycle - Restore item(s) from recycle bin back to active DB
export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const body = await request.json();
    const { action, section, id, all } = body;

    if (action !== "restore") {
      return NextResponse.json(
        { error: "Invalid action. Supported action is 'restore'." },
        { status: 400 }
      );
    }

    if (!section || !["bankers", "pincodes", "companies", "cases"].includes(section.toLowerCase())) {
      return NextResponse.json(
        { error: "Valid section (bankers, pincodes, companies, cases) is required." },
        { status: 400 }
      );
    }

    const sec = section.toLowerCase();
    const restoreFields = {
      isDeleted: false,
      deletedAt: null,
      deletedBy: "",
    };

    if (all) {
      let count = 0;
      if (sec === "bankers") {
        const res = await Banker.updateMany({ isDeleted: true }, { $set: restoreFields });
        count = res.modifiedCount;
      } else if (sec === "pincodes") {
        const res = await PinCode.updateMany({ isDeleted: true }, { $set: restoreFields });
        count = res.modifiedCount;
      } else if (sec === "companies") {
        const res = await Company.updateMany({ isDeleted: true }, { $set: restoreFields });
        count = res.modifiedCount;
      } else if (sec === "cases") {
        const res = await CaseEntry.updateMany({ isDeleted: true }, { $set: restoreFields });
        count = res.modifiedCount;
      }

      return NextResponse.json({
        success: true,
        message: `Successfully restored ${count} item(s) in ${section} back to active database.`,
        restoredCount: count,
      });
    }

    if (!id) {
      return NextResponse.json(
        { error: "Record ID is required for restoration." },
        { status: 400 }
      );
    }

    let restoredDoc: any = null;
    let label = "";

    if (sec === "bankers") {
      restoredDoc = await Banker.findByIdAndUpdate(id, { $set: restoreFields }, { new: true });
      label = restoredDoc ? `Banker "${restoredDoc.name}" (${restoredDoc.bankName})` : "";
    } else if (sec === "pincodes") {
      restoredDoc = await PinCode.findByIdAndUpdate(id, { $set: restoreFields }, { new: true });
      label = restoredDoc ? `PIN Code "${restoredDoc.pincode}" (${restoredDoc.city})` : "";
    } else if (sec === "companies") {
      restoredDoc = await Company.findByIdAndUpdate(id, { $set: restoreFields }, { new: true });
      label = restoredDoc ? `Company "${restoredDoc.name}"` : "";
    } else if (sec === "cases") {
      restoredDoc = await CaseEntry.findByIdAndUpdate(id, { $set: restoreFields }, { new: true });
      label = restoredDoc ? `Case "${restoredDoc.name}" (${restoredDoc.customerId})` : "";
    }

    if (!restoredDoc) {
      return NextResponse.json(
        { error: "Record not found in recycle bin or already restored." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `${label || "Record"} has been restored to the active database.`,
      doc: restoredDoc,
    });
  } catch (error: any) {
    console.error("Recycle Bin API POST error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to restore record" },
      { status: 500 }
    );
  }
}
