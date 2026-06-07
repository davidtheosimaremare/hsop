import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sendTestEmail } from "@/lib/mail";
import { hasPermission } from "@/lib/rbac";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        // Only super admin or developer can test email
        if (!hasPermission(session.user.role, "developer:view")) {
            return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
        }

        const body = await req.json();
        const { email } = body;

        if (!email || !email.includes("@")) {
            return NextResponse.json({ success: false, error: "Invalid email address" }, { status: 400 });
        }

        const result = await sendTestEmail(email);

        if (result.success) {
            return NextResponse.json({ success: true, message: "Test email sent successfully" });
        } else {
            return NextResponse.json({ success: false, error: result.error }, { status: 500 });
        }
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
