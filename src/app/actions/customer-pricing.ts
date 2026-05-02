"use server";

import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { memoryCache } from "@/lib/cache";

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

        }

        // Get category mappings (cached - rarely changes)
        const mappings = await memoryCache.getOrFetch('category-mappings', () =>
            db.categoryMapping.findMany({
                select: {
                    id: true,
                    categoryName: true,
                    discountType: true,
                    createdAt: true,
                    updatedAt: true,
                },
            }),
            600 // 10 minutes
        );

        // Get discount rules (cached - rarely changes)
        const discountRules = await memoryCache.getOrFetch('discount-rules', () =>
            db.discountRule.findMany(),
            600 // 10 minutes
        );


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


/**
 * Get pricing data for a specific customer (BY ID)
 * Used by admin to calculate discount for a specific customer
 */
export async function getCustomerPricingDataById(customerId: string): Promise<CustomerPricingData> {
    try {
        const customerData = await db.customer.findUnique({
            where: { id: customerId },
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
        });

        const customer = customerData ? {
            discount1: customerData.discount1 || 0,
            discount2: customerData.discount2 || 0,
            discountLP: customerData.discountLP || "0",
            discountLPIndent: customerData.discountLPIndent || "0",
            discountCP: customerData.discountCP || "0",
            discountCPIndent: customerData.discountCPIndent || "0",
            discountLighting: customerData.discountLighting || "0",
            discountLightingIndent: customerData.discountLightingIndent || "0",
        } : null;

        // Get category mappings
        const mappings = await db.categoryMapping.findMany();

        // Get discount rules
        const discountRules = await db.discountRule.findMany();

        return {
            customer,
            categoryMappings: mappings,
            discountRules,
        };
    } catch (error) {
        console.error("Failed to get customer pricing data by ID:", error);
        return {
            customer: null,
            categoryMappings: [],
            discountRules: [],
        };
    }
}
