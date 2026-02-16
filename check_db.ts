import { db } from "./src/lib/db";

async function checkSettings() {
    try {
        const menuConfig = await db.siteSetting.findUnique({
            where: { key: "category_menu_config" },
        });
        console.log("Menu Config value:", JSON.stringify(menuConfig, null, 2));
    } catch (error) {
        console.error("Error:", error);
    }
}

checkSettings();
