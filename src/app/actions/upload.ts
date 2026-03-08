"use server";

import path, { join } from "path";
import { writeFile, mkdir } from "fs/promises";
import { v4 as uuidv4 } from "uuid";

// Helper to avoid Turbopack static analysis of the public folder
const getSafePath = (...parts: string[]) => {
    return path.join(process.cwd(), ...parts);
};

export async function uploadFile(formData: FormData, skipUuid: boolean = false) {
    console.log("Starting uploadFile action...");
    const file = formData.get("file") as File;
    if (!file) {
        console.error("No file found in formData");
        return { success: false, error: "No file uploaded" };
    }

    console.log(`File received: ${file.name}, size: ${file.size}, type: ${file.type}`);

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create unique filename
    const uniqueName = skipUuid
        ? file.name.replace(/\s+/g, "_")
        : `${uuidv4()}-${file.name.replace(/\s+/g, "_")}`;

    // Organize by Year/Month to avoid massive folders
    const date = new Date();
    const year = date.getFullYear().toString();
    const month = (date.getMonth() + 1).toString().padStart(2, "0");

    const uploadDir = getSafePath("public", "uploads", year, month);

    console.log(`Target directory: ${uploadDir}`);

    try {
        await mkdir(uploadDir, { recursive: true });
        const filePath = getSafePath("public", "uploads", year, month, uniqueName);
        console.log(`Writing file to: ${filePath}`);
        await writeFile(filePath, buffer);

        const publicUrl = `/uploads/${year}/${month}/${uniqueName}`;
        console.log(`[Upload] Success! Accessible at: ${publicUrl}`);
        console.log(`[Upload] Local System Path: ${filePath}`);
        return { success: true, url: publicUrl, filename: file.name };
    } catch (error) {
        console.error("Upload error (fs/promises):", error);
        return { success: false, error: "Failed to save file: " + (error as Error).message };
    }
}

export async function saveImageFromUrl(url: string, prefix: string = "import") {
    try {
        // 1. Fetch the image
        const response = await fetch(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            },
            redirect: 'follow'
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // 2. Determine filename
        // Try to get extension from URL or content-type
        let extension = path.extname(url).split('?')[0]; // remove query params
        if (!extension || extension === ".") {
            const contentType = response.headers.get("content-type");
            if (contentType === "image/jpeg") extension = ".jpg";
            else if (contentType === "image/png") extension = ".png";
            else if (contentType === "image/webp") extension = ".webp";
            else if (contentType === "image/gif") extension = ".gif";
            else extension = ".jpg"; // fallback
        }

        const uniqueName = `${prefix}-${uuidv4()}${extension}`;

        // 3. Prepare Directory
        const date = new Date();
        const year = date.getFullYear().toString();
        const month = (date.getMonth() + 1).toString().padStart(2, "0");

        const uploadDir = getSafePath("public", "uploads", year, month);

        // 4. Save File
        await mkdir(uploadDir, { recursive: true });
        const filePath = getSafePath("public", "uploads", year, month, uniqueName);
        await writeFile(filePath, buffer);

        const publicUrl = `/uploads/${year}/${month}/${uniqueName}`;
        console.log(`[Import] Success! Accessible at: ${publicUrl}`);
        console.log(`[Import] Local System Path: ${filePath}`);
        return { success: true, url: publicUrl };
    } catch (error) {
        console.error("saveImageFromUrl error:", error);
        return { success: false, error: (error as Error).message };
    }
}

export async function deleteFile(relativeUrl: string) {
    // Basic security: don't allow deleting outside of uploads
    if (!relativeUrl.startsWith("/uploads/")) {
        return { success: false, error: "Invalid file path" };
    }

    try {
        const { unlink } = require("fs/promises");
        const filePath = getSafePath("public", ...relativeUrl.split("/").filter(Boolean));
        await unlink(filePath);
        return { success: true };
    } catch (error) {
        console.error("Error deleting file:", error);
        return { success: false, error: (error as Error).message };
    }
}
