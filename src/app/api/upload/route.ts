import { NextRequest, NextResponse } from "next/server";
import { uploadFile } from "@/app/actions/upload";

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const folder = req.nextUrl.searchParams.get("folder") || "assets";
        
        // Pass to the existing action logic
        const res = await uploadFile(formData, false, folder as any);
        
        return NextResponse.json(res);
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
