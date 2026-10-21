import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Banker from "@/lib/models/Banker";

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const body = await request.json();

    const bankersList = Array.isArray(body)
      ? body
      : Array.isArray(body?.bankers)
      ? body.bankers
      : [];

    if (!bankersList || bankersList.length === 0) {
      return NextResponse.json(
        { error: "No banker records provided for import." },
        { status: 400 }
      );
    }

    const validRecords: any[] = [];
    const errors: string[] = [];

    for (let i = 0; i < bankersList.length; i++) {
      const b = bankersList[i];
      const name = (b.name || b.smName || "").trim();
      const bankName = (b.bankName || b.bank || "").trim();
      const phone = (b.phone || b.con || "").replace(/^CON[_-]?/i, "").trim();
      const branch = (b.branch || b.location || "Main Branch").trim();
      const city = (b.city || b.location || b.stateName || "All India").trim();
      const designation = (b.designation || "Sales Manager").trim();
      const email = (b.email || b.smEmailId || "").trim();
      const productsHandled =
        Array.isArray(b.productsHandled) && b.productsHandled.length > 0
          ? b.productsHandled
          : ["Personal Loan"];
      const notes = (
        b.notes ||
        (b.stateName ? `State: ${b.stateName}` : "")
      ).trim();

      if (!name) {
        errors.push(`Row ${i + 1}: Name is required`);
        continue;
      }
      if (!bankName) {
        errors.push(`Row ${i + 1}: Bank institution name is required`);
        continue;
      }
      if (!phone && !email) {
        errors.push(`Row ${i + 1} (${name}): At least phone or email is required`);
        continue;
      }

      validRecords.push({
        name,
        bankName,
        designation,
        branch,
        city,
        phone: phone || "Not Provided",
        email,
        productsHandled,
        isVerified: true,
        isDemo: false,
        notes,
      });
    }

    if (validRecords.length === 0) {
      return NextResponse.json(
        {
          error:
            "No valid banker records to import. " +
            (errors.slice(0, 5).join("; ") || ""),
          details: errors,
        },
        { status: 400 }
      );
    }

    // Insert into database
    const inserted = await Banker.insertMany(validRecords, { ordered: false });

    return NextResponse.json({
      success: true,
      message: `Successfully imported ${inserted.length} banker contact(s).`,
      count: inserted.length,
      bankers: inserted,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    console.error("Banker import error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to import bankers into database" },
      { status: 500 }
    );
  }
}
