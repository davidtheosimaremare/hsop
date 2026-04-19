"use server";

import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";

async function getVendorUser() {
    const session = await getSession();
    if (!session || !session.user || (session.user.role !== "VENDOR" && session.user.role !== "SUPER_ADMIN")) {
        throw new Error("Unauthorized");
    }
    return session.user;
}

export async function getVendorProductsAction() {
    try {
        const user = await getVendorUser();
        const products = await db.product.findMany({
            where: {
                vendorId: user.id,
                isVendorProduct: true,
            },
            orderBy: {
                createdAt: "desc",
            },
        });
        return { success: true, products };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function getVendorCategoriesAction() {
    try {
        await getVendorUser(); // Auth check
        const categories = await db.vendorCategory.findMany({
            orderBy: { name: "asc" },
        });
        return { success: true, categories };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

async function ensureVendorCategory(categoryName: string) {
    if (!categoryName) return null;
    
    const existing = await db.vendorCategory.findUnique({
        where: { name: categoryName }
    });
    
    if (existing) return existing;
    
    return await db.vendorCategory.create({
        data: { name: categoryName }
    });
}

export async function createVendorProductAction(data: any) {
    try {
        const user = await getVendorUser();
        
        if (data.category) {
            await ensureVendorCategory(data.category);
        }

        const product = await db.product.create({
            data: {
                ...data,
                vendorId: user.id,
                isVendorProduct: true,
                status: "PENDING",
                isVisible: false,
                sku: data.sku, 
            },
        });

        revalidatePath("/vendor/products");
        return { success: true, product };
    } catch (error: any) {
        console.error("Failed to create vendor product:", error);
        return { success: false, error: error.message };
    }
}

export async function updateVendorProductAction(id: string, data: any) {
    try {
        const user = await getVendorUser();
        
        const existing = await db.product.findUnique({
            where: { id },
        });

        if (!existing || existing.vendorId !== user.id) {
            throw new Error("Unauthorized or product not found");
        }

        if (data.category) {
            await ensureVendorCategory(data.category);
        }

        const product = await db.product.update({
            where: { id },
            data: {
                ...data,
                status: "PENDING", 
            },
        });

        revalidatePath("/vendor/products");
        revalidatePath(`/vendor/products/${id}/edit`);
        return { success: true, product };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function deleteVendorProductAction(id: string) {
    try {
        const user = await getVendorUser();
        
        const existing = await db.product.findUnique({
            where: { id },
        });

        if (!existing || existing.vendorId !== user.id) {
            throw new Error("Unauthorized");
        }

        await db.product.delete({
            where: { id },
        });

        revalidatePath("/vendor/products");
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function bulkImportVendorProductsAction(products: any[]) {
    try {
        const user = await getVendorUser();
        
        // Dynamically import required modules for image fetching
        const { uploadBufferToMinio } = await import("@/lib/s3");
        const { v4: uuidv4 } = await import("uuid");

        const createdProducts = await Promise.all(
            products.map(async (p) => {
                if (p.category) {
                    await ensureVendorCategory(p.category);
                }

                let finalImageUrl = null;

                // Process external image link if provided and valid URL
                if (p.externalImageUrl && (p.externalImageUrl.startsWith("http://") || p.externalImageUrl.startsWith("https://"))) {
                    try {
                        const response = await fetch(p.externalImageUrl);
                        if (response.ok) {
                            const contentType = response.headers.get("content-type") || "image/jpeg";
                            const arrayBuffer = await response.arrayBuffer();
                            const buffer = Buffer.from(arrayBuffer);
                            
                            const ext = contentType.split("/")[1]?.split("+")[0] || "jpg";
                            const fileName = `${uuidv4()}.${ext}`;
                            
                            finalImageUrl = await uploadBufferToMinio(buffer, fileName, contentType, "products");
                        }
                    } catch (fetchError) {
                        console.error(`Failed to fetch image from ${p.externalImageUrl}:`, fetchError);
                        // Continue creation even if image fails
                    }
                }
                
                // Handle duplicate SKUs: update if owned by same vendor, or create new if not exists
                // Note: We use findFirst then create/update because upsert requires a unique field like ID or a single unique constraint.
                // Since SKU is unique, we check existence.
                const existingProduct = await db.product.findUnique({
                    where: { sku: p.sku }
                });

                if (existingProduct) {
                    // If SKU exists but belongs to another vendor (or main catalog), we can't overwrite it
                    if (existingProduct.vendorId !== user.id) {
                        console.warn(`SKU ${p.sku} already exists and belongs to another vendor/main catalog. Skipping.`);
                        return null; 
                    }

                    // If it belongs to this vendor, update it
                    return db.product.update({
                        where: { id: existingProduct.id },
                        data: {
                            name: p.name,
                            price: parseFloat(p.price) || 0,
                            description: p.description,
                            category: p.category,
                            brand: p.brand,
                            availableToSell: parseInt(p.stock) || 0,
                            image: finalImageUrl || existingProduct.image,
                            status: "PENDING", // Reset to pending after update
                        }
                    });
                }

                // If doesn't exist, create new
                return db.product.create({
                    data: {
                        name: p.name,
                        sku: p.sku,
                        price: parseFloat(p.price) || 0,
                        description: p.description,
                        category: p.category,
                        brand: p.brand,
                        availableToSell: parseInt(p.stock) || 0,
                        image: finalImageUrl,
                        vendorId: user.id,
                        isVendorProduct: true,
                        status: "PENDING",
                        isVisible: false,
                    },
                });
            })
        );

        const filteredResults = createdProducts.filter(p => p !== null);

        revalidatePath("/vendor/products");
        return { success: true, count: filteredResults.length };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

// Admin Actions for Vendor Products
export async function adminApproveProductAction(id: string) {
    try {
        const session = await getSession();
        if (!session || !["SUPER_ADMIN", "ADMIN", "MANAGER"].includes(session.user.role)) {
            throw new Error("Unauthorized");
        }

        await db.product.update({
            where: { id },
            data: {
                status: "APPROVED",
                isVisible: true,
            },
        });

        revalidatePath("/admin/vendor-products");
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function adminRejectProductAction(id: string, reason: string) {
    try {
        const session = await getSession();
        if (!session || !["SUPER_ADMIN", "ADMIN", "MANAGER"].includes(session.user.role)) {
            throw new Error("Unauthorized");
        }

        await db.product.update({
            where: { id },
            data: {
                status: "REJECTED",
                isVisible: false,
                description: {
                    // Append rejection reason to description or use a separate field?
                    // Let's just update the status for now.
                } as any
            },
        });

        revalidatePath("/admin/vendor-products");
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
