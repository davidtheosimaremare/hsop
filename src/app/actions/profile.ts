"use server";

import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function getUserProfile() {
    const session = await getSession();
    if (!session || !session.user) {
        return { error: "Unauthenticated" };
    }

    try {
        const user = await db.user.findUnique({
            where: { id: session.user.id },
            include: {
                customer: true,
                upgradeRequests: {
                    where: { status: "PENDING" },
                    orderBy: { createdAt: "desc" },
                    take: 1
                }
            }
        });

        if (!user) {
            return { error: "User not found" };
        }

        return {
            success: true,
            user: {
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role,
                customer: user.customer,
                pendingUpgrade: user.upgradeRequests[0] || null
            }
        };

    } catch (error) {
        console.error("Error fetching user profile:", error);
        return { error: "Failed to fetch profile" };
    }
}
