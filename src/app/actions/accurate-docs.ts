"use server";

import { fetchAllAccurateHSQ, fetchAllAccurateHSO, fetchAllAccurateDO, fetchAccurateSODetail, generateAccurateAuthHeaders, type AccurateDocument } from "@/lib/accurate";

export async function getAccurateDocuments(
    type: "HSQ" | "HSO" | "DO",
    page: number = 1,
    search?: string
): Promise<AccurateDocument[]> {
    try {
        if (type === "HSQ") return await fetchAllAccurateHSQ(); // Fetch ALL SQ docs
        if (type === "HSO") return await fetchAllAccurateHSO();
        if (type === "DO") return await fetchAllAccurateDO();
        return [];
    } catch (error) {
        console.error(`[getAccurateDocuments] Error fetching ${type}:`, error);
        return [];
    }
}

export async function getAccurateSODetail(soId: number) {
    try {
        return await fetchAccurateSODetail(soId);
    } catch (error) {
        console.error("[getAccurateSODetail] Error:", error);
        return null;
    }
}

/**
 * Returns the RAW full Accurate API response for an SO.
 * Used by the developer inspector to discover which fields Accurate exposes
 * (e.g., to find the salesQuotation reference field name).
 * This is READ-ONLY and does not modify anything in Accurate or our database.
 */
export async function inspectAccurateSODetail(soId: number): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
        const host = process.env.ACCURATE_API_HOST || "https://zeus.accurate.id";
        const url = new URL(`${host}/accurate/api/sales-order/detail.do`);
        url.searchParams.append('id', soId.toString());

        const headers = await generateAccurateAuthHeaders();
        if (!headers) {
            return { success: false, error: "Accurate credentials not configured (running in mock mode)" };
        }

        const response = await fetch(url.toString(), {
            method: 'GET',
            headers: headers as HeadersInit,
        });

        const raw = await response.json();
        return { success: true, data: raw };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
