import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export async function GET() {
    try {
        const session = await getSession();

        if (!session?.user) {
            return NextResponse.json(
                { error: "Not authenticated" },
                { 
                    status: 401,
                    headers: { "Cache-Control": "no-store, must-revalidate" }
                }
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
                customerId: true,
            },
        });

        if (!user) {
            console.log("API Auth Me: User not found in DB for ID:", session.user.id);
            return NextResponse.json(
                { error: "User not found" },
                { 
                    status: 401,
                    headers: { "Cache-Control": "no-store, must-revalidate" }
                }
            );
        }

        return NextResponse.json(
            {
                user: {
                    id: user.id,
                    email: user.email,
                    role: user.role,
                    name: user.name,
                    phone: user.phone,
                    customerId: user.customerId
                },
            },
            {
                headers: { "Cache-Control": "no-store, must-revalidate" }
            }
        );
    } catch (error) {
        return NextResponse.json(
            { error: "Failed to get session" },
            { 
                status: 500,
                headers: { "Cache-Control": "no-store, must-revalidate" }
            }
        );
    }
}
