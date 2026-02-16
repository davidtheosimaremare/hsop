
import { db } from "@/lib/db";

async function main() {
    const defaultFooterConfig = {
        contacts: {
            whatsapp: "+62 812 6222 0021",
            call_center: "(021) 385 7057",
            email: "sales@hokiindo.com",
            address: "Jl. Cideng Timur No. 66\nPetojo Selatan, Jakarta Pusat",
        },
        socials: {
            instagram: "",
            facebook: "",
            linkedin: "",
            tiktok: "",
        },
        links: {
            umum: [
                { name: "Berita Juragan", href: "#" },
                { name: "Tentang Kami", href: "#" },
                { name: "Hubungi Kami", href: "#" },
                { name: "Karir", href: "#" },
            ],
            informasi: [
                { name: "FAQ", href: "#" },
                { name: "Kemitraan", href: "#" },
                { name: "Brand Terdaftar", href: "#" },
            ],
            ketentuan: [
                { name: "Syarat & Ketentuan", href: "#" },
                { name: "Kebijakan Privasi", href: "#" },
            ],
        },
    };

    console.log("Restoring default footer settings...");
    try {
        await db.siteSetting.upsert({
            where: { key: "footer_config" },
            update: { value: defaultFooterConfig },
            create: { key: "footer_config", value: defaultFooterConfig },
        });
        console.log("Restore successful!");
    } catch (e) {
        console.error("Restore failed:", e);
    }
}

main();
