import { updateSiteSetting } from "@/lib/settings"; // Oops, I need to check where I import this from. The action is in src/app/actions/settings.ts
// But wait, updateSiteSetting IS in src/app/actions/settings.ts.
// The script can't import from @/app/actions/settings if it uses 'use server' (sometimes causes issues in scripts).
// Better to use prisma directly in the script for verification, or use a separate script that mocks the action structure.
// Actually, I can just use prisma directly to simulate what the action does.

import { db } from "@/lib/db";

async function main() {
    const testConfig = {
        contacts: {
            whatsapp: "TEST-WA",
            call_center: "TEST-CALL",
            email: "test@example.com",
            address: "Test Address",
        },
        socials: { instagram: "", facebook: "", linkedin: "", tiktok: "" },
        links: { umum: [], informasi: [], ketentuan: [] },
    };

    console.log("Saving test config...");
    try {
        await db.siteSetting.upsert({
            where: { key: "footer_config" },
            update: { value: testConfig },
            create: { key: "footer_config", value: testConfig },
        });
        console.log("Save successful!");
    } catch (e) {
        console.error("Save failed:", e);
    }

    const saved = await db.siteSetting.findUnique({ where: { key: "footer_config" } });
    console.log("Saved Config:", JSON.stringify(saved, null, 2));
}

main();
