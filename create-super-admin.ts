/**
 * Script untuk membuat user SUPER_ADMIN pertama
 * Usage: npx ts-node create-super-admin.ts
 */

import { db } from "./src/lib/db";
import { hash } from "bcryptjs";

async function createSuperAdmin() {
    const email = "admin@hokiindo.co.id";
    const password = "admin123";
    const name = "Super Admin";

    try {
        // Check if user already exists
        const existingUser = await db.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            console.log("✅ Super admin already exists!");
            console.log("Email:", email);
            console.log("Role:", existingUser.role);
            return;
        }

        // Create super admin
        const hashedPassword = await hash(password, 10);

        const user = await db.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
                role: "SUPER_ADMIN",
                isVerified: true,
                isActive: true,
            },
        });

        console.log("✅ Super admin created successfully!");
        console.log("Email:", email);
        console.log("Password:", password);
        console.log("User ID:", user.id);
        console.log("\n⚠️  Please change the password after first login!");

    } catch (error) {
        console.error("❌ Error creating super admin:", error);
        process.exit(1);
    } finally {
        await db.$disconnect();
    }
}

createSuperAdmin();
