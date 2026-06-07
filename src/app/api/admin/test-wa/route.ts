import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { sendTestWhatsApp } from "@/lib/fontee";
import { hasPermission } from "@/lib/rbac";

export async function POST(req: Request) {
    try {
        const session = await getSession();
        if (!session?.user) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        // Only super admin or developer can test WA
        if (!hasPermission(session.user.role, "developer:view")) {
            return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
        }

        const body = await req.json();
        const { phone } = body;

        if (!phone || phone.length < 8) {
            return NextResponse.json({ success: false, error: "Nomor handphone tidak valid" }, { status: 400 });
        }

        const result = await sendTestWhatsApp(phone);

        if (result.success) {
            return NextResponse.json({ success: true, message: "Pesan WhatsApp test berhasil dikirim" });
        } else {
            return NextResponse.json({ success: false, error: result.error }, { status: 500 });
        }
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
