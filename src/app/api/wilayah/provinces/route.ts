import { NextResponse } from "next/server";

export async function GET() {
    try {
        const res = await fetch(
            "https://emsifa.github.io/api-wilayah-indonesia/api/provinces.json",
            { next: { revalidate: 86400 } } // cache 24 jam
        );
        if (!res.ok) throw new Error("upstream error");
        const data = await res.json();
        return NextResponse.json(data);
    } catch {
        return NextResponse.json({ error: "Gagal memuat data provinsi" }, { status: 500 });
    }
}
