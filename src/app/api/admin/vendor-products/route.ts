import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
    try {
        const session = await getSession();
        if (!session || !["SUPER_ADMIN", "ADMIN", "MANAGER"].includes(session.user.role)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const products = await db.product.findMany({
            where: {
                isVendorProduct: true
            },
            include: {
                vendor: {
                    select: {
                        name: true,
                        email: true
                    }
                }
            },
            orderBy: {
                createdAt: "desc"
            }
        });

        return NextResponse.json({ products });
    } catch (error) {
        console.error("Failed to fetch vendor products:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
