"use server";

import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { v4 as uuidv4 } from "uuid";

export async function uploadFile(formData: FormData) {
    const file = formData.get("file") as File;
    if (!file) {
        return { success: false, error: "No file uploaded" };
    }

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

    try {
        await mkdir(uploadDir, { recursive: true });
        const filePath = join(uploadDir, uniqueName);
        await writeFile(filePath, buffer);

        const publicUrl = `${relativeDir}/${uniqueName}`;
        return { success: true, url: publicUrl, filename: file.name };
    } catch (error) {
        console.error("Upload error:", error);
        return { success: false, error: "Failed to save file" };
    }
}
