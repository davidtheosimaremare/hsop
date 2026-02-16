"use server";

import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

import { DiscountRule } from "@prisma/client";

export interface CustomerPricingData {
    customer: {
        discount1: number;
        discount2: number;
        discountLP: string;
        discountLPIndent?: string;
        discountCP: string;
        discountCPIndent?: string;
        discountLighting: string;
        discountLightingIndent?: string;
    } | null;
    categoryMappings: {
        id: string;
        categoryName: string;
        discountType: string;
        createdAt: Date;
        updatedAt: Date;
    }[];
    discountRules: DiscountRule[];
}

/**
 * Get pricing data for the current logged-in customer
 * Returns customer discount settings and category mappings
 */
export async function getCustomerPricingData(): Promise<CustomerPricingData> {
    try {
        // Get current session
        const session = await getSession();
        console.log("[PRICING] Session User ID:", session?.user?.id);

        let customer = null;

        if (session?.user?.id) {
            // Fetch user and related customer data
            const userWithCustomer = await db.user.findUnique({
                where: { id: session.user.id },
                select: {
                    customer: {
                        select: {
                            discount1: true,
                            discount2: true,
                            discountLP: true,
                            discountLPIndent: true,
                            discountCP: true,
                            discountCPIndent: true,
                            discountLighting: true,
                            discountLightingIndent: true,
                        }
                    }
                }
            });

            console.log("[PRICING] User Customer Data:", userWithCustomer?.customer);

            if (userWithCustomer?.customer) {
                const customerData = userWithCustomer.customer;
                customer = {
                    discount1: customerData.discount1 || 0,
                    discount2: customerData.discount2 || 0,
                    discountLP: customerData.discountLP || "0",
                    discountLPIndent: customerData.discountLPIndent || "0",
                    discountCP: customerData.discountCP || "0",
                    discountCPIndent: customerData.discountCPIndent || "0",
                    discountLighting: customerData.discountLighting || "0",
                    discountLightingIndent: customerData.discountLightingIndent || "0",
                };
            }
        } else {
            console.log("[PRICING] No user in session");
        }

        // Get category mappings (always fetch, needed for checking)
        const mappings = await db.categoryMapping.findMany({
            select: {
                id: true,
                categoryName: true,
                discountType: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        // Get discount rules
        const discountRules = await db.discountRule.findMany();

        console.log("[PRICING] Category mappings count:", mappings.length);
        console.log("[PRICING] Discount rules count:", discountRules.length);

        return {
            customer,
            categoryMappings: mappings,
            discountRules,
        };
    } catch (error) {
        console.error("Failed to get customer pricing data:", error);
        return {
            customer: null,
            categoryMappings: [],
            discountRules: [],
        };
    }
}

