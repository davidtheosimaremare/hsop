import SiteHeader from "@/components/layout/SiteHeader";
import Footer from "@/components/layout/Footer";
import { getSession } from "@/lib/auth";
import CartPage from "./page";

export default async function CartLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await getSession();
    const user = session?.user ? {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name || undefined
    } : null;

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <SiteHeader />
            <main className="flex-1">
                <CartPage user={user} />
            </main>
            <Footer />
        </div>
    );
}
