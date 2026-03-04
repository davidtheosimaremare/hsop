"use server";

import { db } from "@/lib/db";
import { unstable_noStore as noStore } from "next/cache";

export async function getDashboardStats() {
    noStore();
    try {
        const [
            totalCustomers,
            totalProducts,
            totalQuotations,
            recentQuotations,
            recentCustomers,
            revenueData
        ] = await Promise.all([
            db.customer.count(),
            db.product.count(),
            db.salesQuotation.count(),
            db.salesQuotation.findMany({
                take: 5,
                orderBy: { createdAt: 'desc' },
                include: {
                    user: {
                        select: { name: true, email: true }
                    }
                }
            }),
            db.customer.findMany({
                take: 5,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    createdAt: true,
                    image: true
                }
            }),
            db.salesQuotation.aggregate({
                where: {
                    status: { in: ['CONFIRMED', 'COMPLETED', 'SHIPPED'] }
                },
                _sum: {
                    totalAmount: true
                }
            })
        ]);

        return {
            totalCustomers,
            totalProducts,
            totalQuotations,
            recentQuotations,
            recentCustomers,
            totalRevenue: revenueData._sum.totalAmount || 0,
            success: true
        };
    } catch (error) {
        console.error("Failed to fetch dashboard stats:", error);
        return { success: false, error: "Failed to fetch dashboard statistics" };
    }
}

// Dummy data generator for GA4 Chart View
export async function getGA4DummyData(period: "weekly" | "monthly" = "weekly") {
    const { subDays, format } = await import("date-fns");
    // Artificial delay to simulate API fetch
    await new Promise(resolve => setTimeout(resolve, 800));

    const data = [];
    if (period === "weekly") {
        for (let i = 6; i >= 0; i--) {
            const date = subDays(new Date(), i);
            data.push({
                name: format(date, "EEE"),
                visitors: Math.floor(Math.random() * 500) + 100,
                pageviews: Math.floor(Math.random() * 1500) + 300,
            });
        }
    } else {
        // Month view (sample 4 weeks)
        data.push({ name: "Week 1", visitors: 3200, pageviews: 9500 });
        data.push({ name: "Week 2", visitors: 4100, pageviews: 12200 });
        data.push({ name: "Week 3", visitors: 3800, pageviews: 10800 });
        data.push({ name: "Week 4", visitors: 4500, pageviews: 14000 });
    }

    return { success: true, data };
}
