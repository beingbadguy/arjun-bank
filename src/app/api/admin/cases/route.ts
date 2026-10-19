import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import CaseEntry from "@/lib/models/CaseEntry";
import { extractTokenFromRequest, verifyToken } from "@/lib/auth";

async function requireSuperadmin(request: Request) {
  const token = extractTokenFromRequest(request);
  if (!token) return { error: "Not authenticated", status: 401 };

  const payload = verifyToken(token);
  if (!payload) return { error: "Invalid token", status: 401 };

  if (payload.role !== "superadmin") {
    return {
      error: "Access denied. Only Superadmin has permission to access this locked vault.",
      status: 403,
    };
  }

  return { payload };
}

// Initial seed data from the spreadsheet screenshot
const INITIAL_CASES_SEED = [
  {
    customerId: "CUST-001",
    name: "RAVINDER GAJENGI",
    bankName: "KOTAK MAHINDRA",
    location: "HYDERABAD",
    status: "DISBURSED",
    applicationNo: "PLRG2609191415405866",
    remarks: "disbursed",
    approvedAmount: 1390000,
    appliedAmount: 2000000,
    product: "Personal Loan",
    contactNo: "+91 98490 12345",
    panCard: "ABCPG1234F",
  },
  {
    customerId: "CUST-002",
    name: "VIJAY",
    bankName: "SMFG",
    location: "DELHI",
    status: "LOGIN",
    applicationNo: "43296259",
    remarks: "Physical file will send to today",
    approvedAmount: 0,
    appliedAmount: 1000000,
    product: "Personal Loan",
    contactNo: "+91 98110 54321",
    panCard: "BCDPV5678G",
  },
  {
    customerId: "CUST-003",
    name: "RAJENDRA KUMAR PATTA",
    bankName: "AXIS BANK",
    location: "SHAHDOL",
    status: "LOGIN",
    applicationNo: "MLP000144657342",
    remarks: "SENT",
    approvedAmount: 0,
    appliedAmount: 2000000,
    product: "Personal Loan",
    contactNo: "+91 97520 98765",
    panCard: "CDEPR9012H",
  },
  {
    customerId: "CUST-004",
    name: "SANTU MITRA",
    bankName: "POONAWALA",
    location: "DELHI",
    status: "LOGIN",
    applicationNo: "158202195",
    remarks: "ed NGO/directorship deactivated in the MCA records at the earlie",
    approvedAmount: 0,
    appliedAmount: 2000000,
    product: "Business Loan",
    contactNo: "+91 98101 23456",
    panCard: "DEFPMS345J",
  },
  {
    customerId: "CUST-005",
    name: "N BALAJI",
    bankName: "TATA CAPITAL",
    location: "THIRUVALLUR",
    status: "REJECTED",
    applicationNo: "PL1700880",
    remarks: "DUAL PAN",
    approvedAmount: 0,
    appliedAmount: 2000000,
    product: "Personal Loan",
    contactNo: "+91 94440 67890",
    panCard: "EFGPB7890K",
  },
  {
    customerId: "CUST-006",
    name: "RAMALINGAM MALLUGALLA",
    bankName: "TATA CAPITAL",
    location: "HYDERABAD",
    status: "HOLD",
    applicationNo: "",
    remarks: "Customer wants some time if interested he said will call back",
    approvedAmount: 0,
    appliedAmount: 2000000,
    product: "Personal Loan",
    contactNo: "+91 98480 34567",
    panCard: "FGHPR1234L",
  },
  {
    customerId: "CUST-007",
    name: "RAJENDRA TRYAMBAKRAO TAYADE",
    bankName: "TATA CAPITAL",
    location: "JALGAON",
    status: "REJECTED",
    applicationNo: "",
    remarks: "Case Decline in RCU.",
    approvedAmount: 0,
    appliedAmount: 2000000,
    product: "Personal Loan",
    contactNo: "+91 98220 56789",
    panCard: "GHIPT5678M",
  },
  {
    customerId: "CUST-008",
    name: "CHANDAGADE VIJAY SHRIKANT",
    bankName: "SMFG",
    location: "BANGALORE",
    status: "REJECTED",
    applicationNo: "43497342",
    remarks: "Case is rejected f",
    approvedAmount: 0,
    appliedAmount: 2000000,
    product: "Personal Loan",
    contactNo: "+91 98450 78901",
    panCard: "HIJPC9012N",
  },
  {
    customerId: "CUST-009",
    name: "SATYA PRIYA",
    bankName: "TATA CAPITAL",
    location: "BANGALORE",
    status: "HOLD",
    applicationNo: "",
    remarks: "as per TL HOLD",
    approvedAmount: 0,
    appliedAmount: 2000000,
    product: "Personal Loan",
    contactNo: "+91 98451 23456",
    panCard: "IJKPS3456P",
  },
  {
    customerId: "CUST-010",
    name: "BHASKAR DAS",
    bankName: "ICICI BANK",
    location: "DELHI",
    status: "HOLD",
    applicationNo: "",
    remarks: "SENT",
    approvedAmount: 0,
    appliedAmount: 2000000,
    product: "Personal Loan",
    contactNo: "+91 98111 67890",
    panCard: "JKLPD7890Q",
  },
  {
    customerId: "CUST-011",
    name: "SONAM SHIVHARE",
    bankName: "BAJAJ FINANCE",
    location: "MUMBAI",
    status: "CANCELLED",
    applicationNo: "PL00001737434",
    remarks: "APPROVED",
    approvedAmount: 0,
    appliedAmount: 2000000,
    product: "Personal Loan",
    contactNo: "+91 98200 12345",
    panCard: "KLMPS1234R",
  },
];

// GET /api/admin/cases - list all case entries (Superadmin only)
export async function GET(request: Request) {
  try {
    const authCheck = await requireSuperadmin(request);
    if (authCheck.error) {
      return NextResponse.json(
        { error: authCheck.error },
        { status: authCheck.status }
      );
    }

    await connectToDatabase();

    const count = await CaseEntry.countDocuments();
    if (count === 0) {
      // Seed with spreadsheet data if empty
      await CaseEntry.insertMany(INITIAL_CASES_SEED);
    }

    const cases = await CaseEntry.find().sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      cases,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch case entries" },
      { status: 500 }
    );
  }
}

// POST /api/admin/cases - add a new case entry (Superadmin only)
export async function POST(request: Request) {
  try {
    const authCheck = await requireSuperadmin(request);
    if (authCheck.error) {
      return NextResponse.json(
        { error: authCheck.error },
        { status: authCheck.status }
      );
    }

    const body = await request.json();
    const {
      customerId,
      name,
      bankName,
      location,
      status,
      applicationNo,
      remarks,
      contactNo,
      product,
      panCard,
      appliedAmount,
      approvedAmount,
    } = body;

    if (!name || !bankName || !location) {
      return NextResponse.json(
        { error: "Customer name, bank name, and location are required." },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Auto-generate customerId if not supplied
    let finalCustomerId = customerId;
    if (!finalCustomerId) {
      const count = await CaseEntry.countDocuments();
      finalCustomerId = `CUST-${String(count + 1).padStart(3, "0")}`;
    }

    const newCase = await CaseEntry.create({
      customerId: finalCustomerId.trim().toUpperCase(),
      name: name.trim().toUpperCase(),
      bankName: bankName.trim().toUpperCase(),
      location: location.trim().toUpperCase(),
      status: status || "LOGIN",
      applicationNo: applicationNo ? applicationNo.trim() : "",
      remarks: remarks ? remarks.trim() : "",
      contactNo: contactNo ? contactNo.trim() : "",
      product: product ? product.trim() : "Personal Loan",
      panCard: panCard ? panCard.trim().toUpperCase() : "",
      appliedAmount: Number(appliedAmount) || 0,
      approvedAmount: Number(approvedAmount) || 0,
      lastUpdateDate: new Date(),
      createdBy: authCheck.payload?.email || "superadmin",
    });

    return NextResponse.json(
      {
        success: true,
        message: "Case entry added successfully to locked vault",
        caseItem: newCase,
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to create case entry" },
      { status: 500 }
    );
  }
}
