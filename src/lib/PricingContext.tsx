"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { calculatePriceInfo, PriceInfo, CustomerDiscount, CategoryMapping, HidePriceRules } from "@/lib/pricing";
import { DiscountRule } from "@prisma/client";

interface PricingContextType {
    isLoggedIn: boolean;
    customerDiscount: CustomerDiscount | null;
    categoryMappings: CategoryMapping[];
    discountRules: DiscountRule[];
    getPriceInfo: (productPrice: number, productCategory: string | null, availableToSell?: number, productBrand?: string | null) => PriceInfo;
    loading: boolean;
    hidePriceRules: HidePriceRules | null;
    userRole?: string | null;
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
            getPriceInfo: (productPrice: number, productCategory: string | null, availableToSell: number = 0, productBrand: string | null = null) => {
                return calculatePriceInfo(productPrice, productCategory, null, [], availableToSell, [], productBrand, null);
            },
            loading: false,
            hidePriceRules: null,
            userRole: null,
        };
    }
    return context;
}

interface PricingProviderProps {
    children: React.ReactNode;
    initialCustomer: CustomerDiscount | null;
    initialMappings: CategoryMapping[];
    initialDiscountRules?: DiscountRule[];
    initialHidePriceRules?: HidePriceRules | null;
    initialUserRole?: string | null;
}

export function PricingProvider({ children, initialCustomer, initialMappings, initialDiscountRules = [], initialHidePriceRules = null, initialUserRole = null }: PricingProviderProps) {
    const [customerDiscount] = useState<CustomerDiscount | null>(initialCustomer);
    const [categoryMappings] = useState<CategoryMapping[]>(initialMappings);
    const [discountRules] = useState<DiscountRule[]>(initialDiscountRules);
    const [hidePriceRules] = useState<HidePriceRules | null>(initialHidePriceRules);
    const [userRole] = useState<string | null>(initialUserRole);
    const [loading] = useState(false);

    const getPriceInfo = (productPrice: number, productCategory: string | null, availableToSell: number = 0, productBrand: string | null = null): PriceInfo => {
        return calculatePriceInfo(productPrice, productCategory, customerDiscount, categoryMappings, availableToSell, discountRules, productBrand, hidePriceRules);
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
                hidePriceRules,
                userRole,
            }}
        >
            {children}
        </PricingContext.Provider>
    );
}
