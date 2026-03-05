import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// Allowed fields that can be updated via this endpoint (whitelist)
const ALLOWED_FIELDS = [
    "adminSoPdfPath",
    "adminDoPdfPath",
    "adminInvoicePdfPath",
    "taxInvoiceUrl",
    "shippingProofPath",
    "paymentProofPath",
    "userPoPath",
];

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { id, field, value } = body;

        if (!id || !field || value === undefined) {
            return NextResponse.json({ success: false, error: "Missing id, field, or value" }, { status: 400 });
        }

        if (!ALLOWED_FIELDS.includes(field)) {
            return NextResponse.json({ success: false, error: `Field '${field}' is not allowed` }, { status: 403 });
        }

        await db.salesQuotation.update({
            where: { id },
            data: { [field]: value },
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("[update-field] Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
