import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
    const session = await getSession();
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const q = request.nextUrl.searchParams.get("q")?.trim();
    if (!q || q.length < 2) {
        return NextResponse.json({ results: [] });
    }

    const results: {
        type: string;
        title: string;
        subtitle: string;
        href: string;
        icon: string;
    }[] = [];

    // Search quotations
    const quotations = await db.salesQuotation.findMany({
        where: {
            OR: [
                { quotationNo: { contains: q, mode: "insensitive" } },
                { accurateHsqNo: { contains: q, mode: "insensitive" } },
                { accurateHsoNo: { contains: q, mode: "insensitive" } },
                { clientName: { contains: q, mode: "insensitive" } },
                { email: { contains: q, mode: "insensitive" } },
            ],
        },
        take: 5,
        orderBy: { createdAt: "desc" },
        select: {
            quotationNo: true,
            accurateHsoNo: true,
            clientName: true,
            email: true,
            status: true,
            totalAmount: true,
        },
    });

    for (const sq of quotations) {
        const isOrder = sq.status === "OFFERED" || sq.status === "COMPLETED";
        results.push({
            type: isOrder ? "order" : "quotation",
            title: sq.accurateHsoNo || sq.quotationNo,
            subtitle: `${sq.clientName || sq.email || "-"} · ${sq.status}`,
            href: `/admin/sales/quotations/${sq.quotationNo.replace(/\//g, "-")}${isOrder ? "?from=orders" : ""}`,
            icon: isOrder ? "cart" : "file",
        });
    }

    // Search products
    const products = await db.product.findMany({
        where: {
            OR: [
                { sku: { contains: q, mode: "insensitive" } },
                { name: { contains: q, mode: "insensitive" } },
            ],
        },
        take: 5,
        orderBy: { name: "asc" },
        select: {
            id: true,
            sku: true,
            name: true,
            brand: true,
        },
    });

    for (const p of products) {
        results.push({
            type: "product",
            title: p.name,
            subtitle: `${p.sku}${p.brand ? ` · ${p.brand}` : ""}`,
            href: `/admin/products/${p.id}`,
            icon: "package",
        });
    }

    // Search customers
    const customers = await db.customer.findMany({
        where: {
            OR: [
                { name: { contains: q, mode: "insensitive" } },
                { email: { contains: q, mode: "insensitive" } },
                { phone: { contains: q, mode: "insensitive" } },
            ],
        },
        take: 5,
        orderBy: { name: "asc" },
        select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            type: true,
        },
    });

    for (const c of customers) {
        results.push({
            type: "customer",
            title: c.name || c.email || "No Name",
            subtitle: `${c.email || c.phone || "-"} · ${c.type || "Customer"}`,
            href: `/admin/customers/${c.id}`,
            icon: "user",
        });
    }

    return NextResponse.json({ results });
}
