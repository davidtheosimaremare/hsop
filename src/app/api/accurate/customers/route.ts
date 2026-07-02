import { NextRequest, NextResponse } from "next/server";
import { searchAccurateCustomers } from "@/lib/accurate";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const query = searchParams.get("q") || "";

        if (query.trim().length < 2) {
            return NextResponse.json([]);
        }

        const results = await searchAccurateCustomers(query);
        const mapped = results.map((c) => ({
            id: c.id,
            accurateId: c.id,
            name: c.name,
            company: c.name,
            accurateCustomerCode: c.no,
            address: c.billAddress?.street || (c.contactInfo as { address?: string })?.address || "",
            phone: c.contactInfo?.mobilePhone || c.contactInfo?.businessPhone || "",
        }));

        return NextResponse.json(mapped);
    } catch (err) {
        console.error("Customer search API error:", err);
        return NextResponse.json({ error: "Failed to search customers" }, { status: 500 });
    }
}
