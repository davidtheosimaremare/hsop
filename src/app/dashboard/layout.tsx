import SiteHeader from "@/components/layout/SiteHeader";
import Footer from "@/components/layout/Footer";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await getSession();

    // Protect Dashboard Routes
    if (!session) {
        redirect("/masuk");
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <SiteHeader />

            <main className="flex-1">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex flex-col lg:flex-row gap-6">
                        <DashboardSidebar user={session.user} />

                        <div className="flex-1">
                            {children}
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
