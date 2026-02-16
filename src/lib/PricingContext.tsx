"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { calculatePriceInfo, PriceInfo, CustomerDiscount, CategoryMapping } from "@/lib/pricing";
import { DiscountRule } from "@prisma/client";

interface PricingContextType {
    isLoggedIn: boolean;
    customerDiscount: CustomerDiscount | null;
    categoryMappings: CategoryMapping[];
    discountRules: DiscountRule[];
    getPriceInfo: (productPrice: number, productCategory: string | null, availableToSell?: number) => PriceInfo;
    loading: boolean;
}

const PricingContext = createContext<PricingContextType | null>(null);

export function usePricing() {
    const context = useContext(PricingContext);
    if (!context) {
        // Return default pricing context for non-provider usage
        return {
            isLoggedIn: false,
            customerDiscount: null,
            categoryMappings: [],
            discountRules: [],
            getPriceInfo: (productPrice: number, productCategory: string | null, availableToSell: number = 0) => {
                return calculatePriceInfo(productPrice, productCategory, null, [], availableToSell, []);
            },
            loading: false,
        };
    }
    return context;
}

interface PricingProviderProps {
    children: React.ReactNode;
    initialCustomer: CustomerDiscount | null;
    initialMappings: CategoryMapping[];
    initialDiscountRules?: DiscountRule[];
}

export function PricingProvider({ children, initialCustomer, initialMappings, initialDiscountRules = [] }: PricingProviderProps) {
    const [customerDiscount] = useState<CustomerDiscount | null>(initialCustomer);
    const [categoryMappings] = useState<CategoryMapping[]>(initialMappings);
    const [discountRules] = useState<DiscountRule[]>(initialDiscountRules);
    const [loading] = useState(false);

    const getPriceInfo = (productPrice: number, productCategory: string | null, availableToSell: number = 0): PriceInfo => {
        return calculatePriceInfo(productPrice, productCategory, customerDiscount, categoryMappings, availableToSell, discountRules);
    };

    return (
        <PricingContext.Provider
            value={{
                isLoggedIn: !!customerDiscount,
                customerDiscount,
                categoryMappings,
                discountRules,
                getPriceInfo,
                loading,
            }}
        >
            {children}
        </PricingContext.Provider>
    );
}
