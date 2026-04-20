"use server";

import { v4 as uuidv4 } from "uuid";
import { uploadBufferToMinio } from "@/lib/s3";

export type UploadFolder = "products" | "assets" | "files";

export async function uploadFile(
    formData: FormData,
    skipUuid: boolean = false,
    folder: UploadFolder = "files"
) {
    console.log("Starting uploadFile action (MinIO)...");
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

    try {
        const publicUrl = await uploadBufferToMinio(buffer, uniqueName, file.type, folder);
        console.log(`[Upload] Success! Accessible at: ${publicUrl}`);
        return { success: true, url: publicUrl, filename: file.name };
    } catch (error) {
        console.error("Upload error (MinIO):", error);
        return { success: false, error: "Failed to save file: " + (error as Error).message };
    }
}

export async function saveImageFromUrl(url: string, prefix: string = "import", folder: UploadFolder = "products") {
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
        // Try to extract extension, or fallback to general image extension based on content-type
        const urlObj = new URL(url);
        const pathParts = urlObj.pathname.split('/');
        const lastPart = pathParts[pathParts.length - 1];
        let extension = lastPart.includes('.') ? `.${lastPart.split('.').pop()}` : '';

        let contentType = response.headers.get("content-type") || "application/octet-stream";

        if (!extension || extension === ".") {
            if (contentType === "image/jpeg") extension = ".jpg";
            else if (contentType === "image/png") extension = ".png";
            else if (contentType === "image/webp") extension = ".webp";
            else if (contentType === "image/gif") extension = ".gif";
            else extension = ".jpg"; // fallback
        }

        const uniqueName = `${prefix}-${uuidv4()}${extension}`;

        const publicUrl = await uploadBufferToMinio(buffer, uniqueName, contentType, folder);

        console.log(`[Import] Success! Accessible at: ${publicUrl}`);
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
    const uniqueName = `news-${timestamp}-${cleanName}`;

    try {
        const publicUrl = await uploadBufferToMinio(buffer, uniqueName, file.type, "assets");
        return { success: true, url: publicUrl };
    } catch (error) {
        console.error("News image upload error:", error);
        return { success: false, error: "Failed to save file" };
    }
}

export async function uploadCroppedNewsImage(base64Data: string, filename: string = "news-image.jpg") {
    try {
        // Remove base64 prefix if present
        const match = base64Data.match(/^data:(image\/\w+);base64,/);
        const mimeType = match ? match[1] : "image/jpeg";
        const base64Content = base64Data.replace(/^data:image\/\w+;base64,/, "");
        const buffer = Buffer.from(base64Content, "base64");

        // Create unique filename with timestamp
        const timestamp = Date.now();
        const ext = filename.split(".").pop() || "jpg";
        const uniqueName = `news-${timestamp}-cropped.${ext}`;

        const publicUrl = await uploadBufferToMinio(buffer, uniqueName, mimeType, "assets");

        return { success: true, url: publicUrl };
    } catch (error) {
        console.error("Cropped image upload error:", error);
        return { success: false, error: "Failed to save cropped image" };
    }
}

export async function uploadCroppedImage(base64Data: string, filename: string = "image.jpg", folder: UploadFolder = "products") {
    try {
        const match = base64Data.match(/^data:(image\/\w+);base64,/);
        const mimeType = match ? match[1] : "image/jpeg";
        const base64Content = base64Data.replace(/^data:image\/\w+;base64,/, "");
        const buffer = Buffer.from(base64Content, "base64");

        const timestamp = Date.now();
        const ext = filename.split(".").pop() || "jpg";
        const uniqueName = `${folder}-${timestamp}-cropped.${ext}`;

        const publicUrl = await uploadBufferToMinio(buffer, uniqueName, mimeType, folder);

        return { success: true, url: publicUrl };
    } catch (error) {
        console.error("Cropped image upload error:", error);
        return { success: false, error: "Failed to save cropped image" };
    }
}
