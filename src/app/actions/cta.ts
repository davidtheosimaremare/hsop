"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function getHomeCTAs() {
    try {
        const ctas = await db.homeCTA.findMany({
            orderBy: { position: "asc" }
        });
        return ctas;
    } catch (error) {
        console.error("Failed to fetch Home CTAs:", error);
        return [];
    }
}

export async function updateHomeCTA(position: string, data: any) {
    try {
        const existing = await db.homeCTA.findUnique({
            where: { position }
        });

        if (existing) {
            await db.homeCTA.update({
                where: { position },
                data: {
                    title: data.title,
                    subtitle: data.subtitle,
                    image: data.image,
                    primaryButtonText: data.primaryButtonText,
                    primaryButtonLink: data.primaryButtonLink,
                    secondaryButtonText: data.secondaryButtonText,
                    secondaryButtonLink: data.secondaryButtonLink,
                    isVisible: data.isVisible ?? true,
                }
            });
        } else {
            // Create if not exists (seed logic)
            await db.homeCTA.create({
                data: {
                    position,
                    title: data.title,
                    subtitle: data.subtitle,
                    image: data.image,
                    primaryButtonText: data.primaryButtonText,
                    primaryButtonLink: data.primaryButtonLink,
                    secondaryButtonText: data.secondaryButtonText,
                    secondaryButtonLink: data.secondaryButtonLink,
                    isVisible: true,
                }
            });
        }

        revalidatePath("/");
        revalidatePath("/admin/settings/cta"); // Assuming admin path
        return { success: true };
    } catch (error: any) {
        console.error("Failed to update Home CTA:", error);
        return { success: false, error: error.message };
    }
}
