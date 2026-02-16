"use server";

import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { v4 as uuidv4 } from "uuid";
import path from "path";

export async function uploadFile(formData: FormData) {
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
    const uniqueName = `${uuidv4()}-${file.name.replace(/\s+/g, "_")}`;

    // Organize by Year/Month to avoid massive folders
    const date = new Date();
    const year = date.getFullYear().toString();
    const month = (date.getMonth() + 1).toString().padStart(2, "0");

    const relativeDir = `/uploads/${year}/${month}`;
    const uploadDir = join(process.cwd(), "public", relativeDir);

    console.log(`Target directory: ${uploadDir}`);

    try {
        await mkdir(uploadDir, { recursive: true });
        const filePath = join(uploadDir, uniqueName);
        console.log(`Writing file to: ${filePath}`);
        await writeFile(filePath, buffer);

        const publicUrl = `${relativeDir}/${uniqueName}`;
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

        const relativeDir = `/uploads/${year}/${month}`;
        const uploadDir = join(process.cwd(), "public", relativeDir);

        // 4. Save File
        await mkdir(uploadDir, { recursive: true });
        const filePath = join(uploadDir, uniqueName);
        await writeFile(filePath, buffer);

        const publicUrl = `${relativeDir}/${uniqueName}`;
        console.log(`[Import] Success! Accessible at: ${publicUrl}`);
        console.log(`[Import] Local System Path: ${filePath}`);
        return { success: true, url: publicUrl };
    } catch (error: any) {
        console.error(`Error saving image from URL (${url}):`, error);
        return { success: false, error: `Failed to download image: ${error.message}` };
    }
}

export async function uploadNewsImage(formData: FormData) {
    const file = formData.get("file") as File;
    if (!file) {
        return { success: false, error: "No file uploaded" };
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create unique filename with timestamp
    const timestamp = Date.now();
    const cleanName = file.name.replace(/\s+/g, "-").toLowerCase();
    const uniqueName = `${timestamp}-${cleanName}`;

    // Save to /uploads/news folder
    const relativeDir = `/uploads/news`;
    const uploadDir = join(process.cwd(), "public", relativeDir);

    try {
        await mkdir(uploadDir, { recursive: true });
        const filePath = join(uploadDir, uniqueName);
        await writeFile(filePath, buffer);

        const publicUrl = `${relativeDir}/${uniqueName}`;
        return { success: true, url: publicUrl };
    } catch (error) {
        console.error("News image upload error:", error);
        return { success: false, error: "Failed to save file" };
    }
}

export async function uploadCroppedNewsImage(base64Data: string, filename: string = "news-image.jpg") {
    try {
        // Remove base64 prefix if present
        const base64Content = base64Data.replace(/^data:image\/\w+;base64,/, "");
        const buffer = Buffer.from(base64Content, "base64");

        // Create unique filename with timestamp
        const timestamp = Date.now();
        const ext = filename.split(".").pop() || "jpg";
        const uniqueName = `${timestamp}-cropped.${ext}`;

        // Save to /uploads/news folder
        const relativeDir = `/uploads/news`;
        const uploadDir = join(process.cwd(), "public", relativeDir);

        await mkdir(uploadDir, { recursive: true });
        const filePath = join(uploadDir, uniqueName);
        await writeFile(filePath, buffer);

        const publicUrl = `${relativeDir}/${uniqueName}`;
        return { success: true, url: publicUrl };
    } catch (error) {
        console.error("Cropped image upload error:", error);
        return { success: false, error: "Failed to save cropped image" };
    }
}
