// DB connection with pool limits to prevent exhaustion
import { PrismaClient } from "@prisma/client";

declare global {
    var prisma: PrismaClient | undefined;
}

function createPrismaClient() {
    // Append connection pool parameters to DATABASE_URL if not already present
    let url = process.env.DATABASE_URL || "";
    
    // Add pool limits if not already configured in the URL
    if (!url.includes("connection_limit")) {
        const separator = url.includes("?") ? "&" : "?";
        url = `${url}${separator}connection_limit=10&pool_timeout=10`;
    }

    return new PrismaClient({
        datasources: {
            db: { url },
        },
        log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
    });
}

// ALWAYS use singleton pattern (including production)
// This prevents creating multiple PrismaClient instances on hot-reloads
// and during concurrent server-side renders
const db = globalThis.prisma || createPrismaClient();

if (!globalThis.prisma) {
    globalThis.prisma = db;
}

export { db };


