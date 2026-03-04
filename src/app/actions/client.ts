"use server";

import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export interface UserClientData {
    name: string;
    company?: string;
    email?: string;
    phone?: string;
    address?: string;
}

export async function getUserClients() {
    const session = await getSession();
    if (!session?.user) {
        return { success: false, error: "Unauthorized" };
    }

    try {
        const clients = await db.userClient.findMany({
            where: { userId: session.user.id },
            orderBy: { name: 'asc' },
        });
        return { success: true, data: clients };
    } catch (error) {
        console.error("Error fetching clients:", error);
        return { success: false, error: "Failed to fetch clients" };
    }
}

export async function createUserClient(data: UserClientData) {
    const session = await getSession();
    if (!session?.user) {
        return { success: false, error: "Unauthorized" };
    }

    if (!data.name) {
        return { success: false, error: "Name is required" };
    }

    try {
        const client = await db.userClient.create({
            data: {
                userId: session.user.id,
                ...data,
            },
        });
        revalidatePath('/keranjang');
        return { success: true, data: client };
    } catch (error) {
        console.error("Error creating client:", error);
        return { success: false, error: "Failed to create client" };
    }
}
