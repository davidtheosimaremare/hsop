import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const session = await getSession();
        if (!session || !session.user || (session.user.role !== "VENDOR" && session.user.role !== "SUPER_ADMIN")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const product = await db.product.findUnique({
            where: { id },
        });

        if (!product) {
            return NextResponse.json({ error: "Product not found" }, { status: 404 });
        }

        // Ensure vendor only sees their own product (unless super admin)
        if (session.user.role !== "SUPER_ADMIN" && product.vendorId !== session.user.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        return NextResponse.json({ product });
    } catch (error) {
        console.error("Failed to fetch product:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
