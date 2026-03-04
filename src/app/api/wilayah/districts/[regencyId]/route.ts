import { NextResponse } from "next/server";

export async function GET(
    _req: Request,
    { params }: { params: Promise<{ regencyId: string }> }
) {
    try {
        const { regencyId } = await params;
        const res = await fetch(
            `https://emsifa.github.io/api-wilayah-indonesia/api/districts/${regencyId}.json`,
            { next: { revalidate: 86400 } }
        );
        if (!res.ok) throw new Error("upstream error");
        const data = await res.json();
        return NextResponse.json(data);
    } catch {
        return NextResponse.json({ error: "Gagal memuat data kecamatan" }, { status: 500 });
    }
}
