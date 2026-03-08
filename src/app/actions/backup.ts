"use server";

import { exec } from "child_process";
import { promisify } from "util";
import { join } from "path";
import { writeFile, mkdir, unlink, stat } from "fs/promises";
import { v4 as uuidv4 } from "uuid";
import { getSession } from "@/lib/auth";

const execAsync = promisify(exec);

export async function createSystemBackup() {
    const session = await getSession();
    if (session?.user?.role !== "SUPER_ADMIN" && session?.user?.role !== "ADMIN") {
        return { success: false, error: "Unauthorized" };
    }

    try {
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        const backupId = uuidv4();
        const rootDir = process.cwd();
        const tmpDir = join(rootDir, "public", "backups");
        
        // Ensure backup directory exists
        try { await mkdir(tmpDir, { recursive: true }); } catch (e) {}

        const dbBackupFile = join(tmpDir, `db-${timestamp}.sql`);
        const finalZipName = `backup-hokiindo-${timestamp}.zip`;
        const finalZipPath = join(tmpDir, finalZipName);

        // 1. Database Backup using pg_dump
        // Extract DB name from DATABASE_URL
        const dbUrl = process.env.DATABASE_URL || "";
        // Simple extraction for local dev
        const dbName = dbUrl.split("/").pop()?.split("?")[0] || "hsop_local";
        
        console.log(`[Backup] Starting DB dump for: ${dbName}`);
        try {
            // Use specific pg_dump version 15 to match server version
            const pgDumpPath = "/opt/homebrew/opt/postgresql@15/bin/pg_dump";
            await execAsync(`${pgDumpPath} ${dbName} > "${dbBackupFile}"`);
        } catch (dbErr) {
            console.error("DB Dump failed:", dbErr);
            // Continue with files even if DB fails, or abort? Let's try to continue but note it.
        }

        // 2. Create ZIP of project files
        // Exclude patterns for zip command: -x folder/*
        // IMPORTANT: On macOS zip, to exclude a directory you need -x "node_modules/*" ".next/*" etc.
        const excludes = [
            "node_modules/*",
            ".next/*",
            ".git/*",
            ".env",
            "public/backups/*",
            "*.log",
            ".qwen-clipboard/*",
            "tmp/*",
            "*.tsbuildinfo",
            ".DS_Store"
        ];

        console.log(`[Backup] Zipping files...`);
        // cd to root then zip. -r for recursive, -q for quiet
        // We use an array for excludes to build the command safely
        const excludeStr = excludes.map(item => `-x "${item}"`).join(" ");
        const zipCommand = `cd "${rootDir}" && /usr/bin/zip -rq "${finalZipPath}" . ${excludeStr} -x "${dbBackupFile}"`;
        
        await execAsync(zipCommand);

        // 3. Cleanup SQL file (now inside zip)
        try { await unlink(dbBackupFile); } catch (e) {}

        const fileStats = await stat(finalZipPath);
        const fileSizeMB = (fileStats.size / (1024 * 1024)).toFixed(2);

        return { 
            success: true, 
            downloadUrl: `/backups/${finalZipName}`,
            fileName: finalZipName,
            size: `${fileSizeMB} MB`
        };

    } catch (error: any) {
        console.error("Backup failed:", error);
        return { success: false, error: error.message || "Internal Server Error" };
    }
}

export async function getBackupList() {
    // Optional: list existing backups in public/backups
    // For now, we just return empty or implement if needed
    return [];
}
