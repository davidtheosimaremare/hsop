"use server";

import { db } from "@/lib/db";

export async function getProvinces() {
    try {
        // @ts-ignore
        return await db.province.findMany({
            orderBy: { name: "asc" }
        });
    } catch (error) {
        console.error("Failed to fetch provinces:", error);
        return [];
    }
}

export async function getRegencies(provinceId: string) {
    if (!provinceId) return [];
    try {
        // @ts-ignore
        return await db.regency.findMany({
            where: { provinceId },
            orderBy: { name: "asc" }
        });
    } catch (error) {
        console.error(`Failed to fetch regencies for ${provinceId}:`, error);
        return [];
    }
}

export async function getDistricts(regencyId: string) {
    if (!regencyId) return [];
    try {
        // @ts-ignore
        return await db.district.findMany({
            where: { regencyId },
            orderBy: { name: "asc" }
        });
    } catch (error) {
        console.error(`Failed to fetch districts for ${regencyId}:`, error);
        return [];
    }
}
