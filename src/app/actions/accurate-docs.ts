"use server";

import { fetchAllAccurateHSQ, fetchAllAccurateHSO, fetchAllAccurateDO, fetchAccurateSODetail, type AccurateDocument } from "@/lib/accurate";

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
