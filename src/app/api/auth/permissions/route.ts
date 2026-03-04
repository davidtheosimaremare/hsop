import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { rolePermissions, allPermissions, type UserRole } from "@/lib/rbac";

/**
 * GET /api/auth/permissions
 *
 * Returns the permission list for the currently authenticated user.
 * - SUPER_ADMIN → all permissions
 * - Other admin roles → permissions from DB (rolePermission table) when
 *   available, otherwise falls back to the hardcoded rolePermissions config.
 * - CUSTOMER / unauthenticated → empty / 401
 */
export async function GET() {
    try {
        const session = await getSession();

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const role = session.user.role as UserRole;

        // SUPER_ADMIN always gets everything
        if (role === "SUPER_ADMIN") {
            return NextResponse.json({ permissions: allPermissions });
        }

        // CUSTOMER has no admin permissions
        if (role === "CUSTOMER") {
            return NextResponse.json({ permissions: [] });
        }

        // Try to load permissions from database first
        try {
            const { db } = await import("@/lib/db");
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const dbPerms = await (db as any).rolePermission?.findMany({
                where: { role },
                select: { permission: true },
            });

            if (Array.isArray(dbPerms) && dbPerms.length > 0) {
                return NextResponse.json({
                    permissions: dbPerms.map((p: { permission: string }) => p.permission),
                });
            }
        } catch {
            // DB table does not exist yet — fall through to hardcoded config
        }

        // Fallback: use hardcoded rolePermissions config
        const fallbackPerms = rolePermissions[role] ?? [];
        return NextResponse.json({ permissions: fallbackPerms });
    } catch (error) {
        console.error("Failed to fetch user permissions:", error);
        return NextResponse.json(
            { error: "Failed to fetch permissions" },
            { status: 500 }
        );
    }
}
