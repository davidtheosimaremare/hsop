import { db } from "@/lib/db";

async function main() {
    const setting = await db.siteSetting.findUnique({
        where: { key: "footer_config" },
    });
    console.log("Footer Config in DB:", JSON.stringify(setting, null, 2));
}

main();
