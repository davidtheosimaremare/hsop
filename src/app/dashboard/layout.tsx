import SiteHeader from "@/components/layout/SiteHeader";
import Footer from "@/components/layout/Footer";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";

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

    // Fetch customer data for user type display (only if customerId exists)
    let customerType: string = "RETAIL";
    let customerImage: string | null = null;
    let companyName: string | null = null;
    if (session.user.customerId) {
        const customer = await db.customer.findUnique({
            where: { id: session.user.customerId },
            select: { type: true, image: true, name: true, company: true }
        });
        customerType = customer?.type || "RETAIL";
        customerImage = customer?.image || null;
        // Company name: prefer 'company' field, fallback to customer 'name' if it looks like company
        companyName = customer?.company || customer?.name || null;
    }

    const userWithCustomer = {
        ...session.user,
        customerType,
        customerImage,
        companyName
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <SiteHeader />

            <main className="flex-1">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex flex-col lg:flex-row gap-6">
                        <DashboardSidebar user={userWithCustomer} />

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
