import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
    const session = await getSession();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const notifications = await db.notification.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" },
        take: 20,
    });

    const unreadCount = await db.notification.count({
        where: { userId: session.user.id, read: false },
    });

    return NextResponse.json({ notifications, unreadCount });
}

export async function PATCH(request: NextRequest) {
    const session = await getSession();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    if (body.markAllRead) {
        await db.notification.updateMany({
            where: { userId: session.user.id, read: false },
            data: { read: true },
        });
    } else if (body.id) {
        await db.notification.update({
            where: { id: body.id },
            data: { read: true },
        });
    }

    return NextResponse.json({ success: true });
}
