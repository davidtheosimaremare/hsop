import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

// GET /api/admin/roles/permissions - Get all permissions for all roles
export async function GET() {
    try {
        const session = await getSession();
        if (!session?.user || session.user.role !== "SUPER_ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get all permissions from database
        const permissions = await db.rolePermission.findMany({
            orderBy: { role: "asc" },
        });

        // Group by role
        const permissionsByRole: Record<string, string[]> = {};
        permissions.forEach((p) => {
            permissionsByRole[p.role] = Array.isArray(p.permissions) ? (p.permissions as string[]) : [];
        });

        return NextResponse.json({ permissions: permissionsByRole });
    } catch (error) {
        console.error("Failed to fetch permissions:", error);
        return NextResponse.json(
            { error: "Failed to fetch permissions" },
            { status: 500 }
        );
    }
}

// POST /api/admin/roles/permissions - Update permissions for a role
export async function POST(request: Request) {
    try {
        const session = await getSession();
        if (!session?.user || session.user.role !== "SUPER_ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { role, permissions } = body;

        if (!role || !Array.isArray(permissions)) {
            return NextResponse.json(
                { error: "Role and permissions are required" },
                { status: 400 }
            );
        }

        // Delete existing permissions for this role
        await db.rolePermission.deleteMany({
            where: { role },
        });

        // Create new permissions
        if (permissions.length > 0) {
            await db.rolePermission.create({
                data: {
                    role,
                    permissions,
                },
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to update permissions:", error);
        return NextResponse.json(
            { error: "Failed to update permissions" },
            { status: 500 }
        );
    }
}
