import { NextRequest, NextResponse } from "next/server";

// Returns the most common postal code for a given district name
export async function GET(req: NextRequest) {
    const district = req.nextUrl.searchParams.get("district");
    if (!district) {
        return NextResponse.json({ error: "district param required" }, { status: 400 });
    }

    try {
        const res = await fetch(
            `https://kodepos.vercel.app/search/?q=${encodeURIComponent(district)}`,
            { next: { revalidate: 86400 } }
        );
        if (!res.ok) throw new Error("upstream error");

        const json = await res.json();
        const data: { code: number }[] = json.data ?? [];

        if (data.length === 0) {
            return NextResponse.json({ postalCode: null });
        }

        // Pick the most frequent code from results
        const freq: Record<number, number> = {};
        for (const item of data) {
            freq[item.code] = (freq[item.code] ?? 0) + 1;
        }
        const topCode = Object.entries(freq).sort((a, b) => b[1] - a[1])[0][0];

        return NextResponse.json({ postalCode: topCode });
    } catch {
        return NextResponse.json({ postalCode: null });
    }
}
