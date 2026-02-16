import { getHomeCTAs } from "@/app/actions/cta";
import PromoBannersClient from "./PromoBannersClient";

export default async function PromoBanners() {
    const ctas = await getHomeCTAs();

    // Default Fallback Data if DB is empty
    const leftCTA = ctas.find((c: any) => c.position === "LEFT") || {
        title: "Potensi Turun Harga dan Pembayaran Tempo Mencapai 90 Hari Dengan Bisnis",
        subtitle: "1500+ Customer Bisnis Sudah Menikmati Layanan Kami",
        image: null,
        primaryButtonText: "Daftar Sebagai Bisnis",
        primaryButtonLink: "#",
        secondaryButtonText: "Belanja Sekarang",
        secondaryButtonLink: "#",
    };

    const rightCTA = ctas.find((c: any) => c.position === "RIGHT") || {
        title: "Jual Produk ke Seluruh Indonesia dalam Satu Platform",
        subtitle: "Dipercaya 750+ Vendor di Seluruh Indonesia",
        image: null,
        primaryButtonText: "Daftar Sebagai Vendor",
        primaryButtonLink: "#",
        secondaryButtonText: "Pelajari Selengkapnya",
        secondaryButtonLink: "#",
    };

    return <PromoBannersClient leftCTA={leftCTA} rightCTA={rightCTA} />;
}
