import { NextResponse } from 'next/server';
import { getAccurateCustomerDetail } from '@/lib/accurate';
import { db } from '@/lib/db';

export async function GET() {
    const customer = await db.customer.findFirst({
        where: { accurateId: { not: null } }
    });
    if (!customer) return NextResponse.json({ error: "no cust found" });
    const acc = await getAccurateCustomerDetail(Number(customer.accurateId));
    return NextResponse.json(acc);
}
