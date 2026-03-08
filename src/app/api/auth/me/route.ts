import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export async function GET() {
    try {
        const session = await getSession();

        if (!session?.user) {
            return NextResponse.json(
                { error: "Not authenticated" },
                { status: 401 }
            );
        }

        const { db } = await import("@/lib/db");
        const user = await db.user.findUnique({
            where: { id: session.user.id },
            select: {
                id: true,
                email: true,
                role: true,
                name: true,
                phone: true,
                address: true,
                customerId: true,
                customer: {
                    select: {
                        address: true,
                        addresses: {
                            where: { isPrimary: true },
                            take: 1
                        }
                    }
                }
            },
        });

        if (!user) {
            console.log("API Auth Me: User not found in DB for ID:", session.user.id);
            return NextResponse.json(
                { error: "User not found" },
                { status: 401 }
            );
        }

        // Determine best address to return
        let finalAddress = user.address;
        if (!finalAddress) {
            if (user.customer?.addresses?.[0]) {
                const primary = user.customer.addresses[0];
                finalAddress = `${primary.label ? `[${primary.label}] ` : ""}${primary.address}${primary.recipient ? ` - UP: ${primary.recipient}` : ""}${primary.phone ? ` (${primary.phone})` : ""}`;
            } else if (user.customer?.address) {
                finalAddress = user.customer.address;
            }
        }

        return NextResponse.json({
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                name: user.name,
                phone: user.phone,
                address: user.customer?.address || user.address,
                customerId: user.customerId
            },
        });
    } catch (error) {
        return NextResponse.json(
            { error: "Failed to get session" },
            { status: 500 }
        );
    }
}
