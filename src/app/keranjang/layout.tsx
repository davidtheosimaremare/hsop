import SiteHeader from "@/components/layout/SiteHeader";
import Footer from "@/components/layout/Footer";
import { getSession } from "@/lib/auth";
import CartPage from "./page";

export default async function CartLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <SiteHeader />
            <main className="flex-1">
                {children}
            </main>
            <Footer />
        </div>
    );
}
