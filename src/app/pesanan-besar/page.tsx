import SiteHeader from "@/components/layout/SiteHeader";
import Footer from "@/components/layout/Footer";
import BulkOrderClient from "@/components/bulk-order/BulkOrderClient";
import { getCustomerPricingData } from "@/app/actions/customer-pricing";
import { PricingProvider } from "@/lib/PricingContext";

export default async function BulkOrderPage() {
    const pricingData = await getCustomerPricingData();

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <SiteHeader />
            <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Bulk Order</h1>
                    <p className="text-gray-600">
                        Pesan produk dalam jumlah besar dengan mudah melalui impor Excel atau pencarian SKU.
                    </p>
                </div>

                <div className="w-full">
                    <PricingProvider
                        initialCustomer={pricingData.customer}
                        initialMappings={pricingData.categoryMappings}
                        initialDiscountRules={pricingData.discountRules}
                    >
                        <BulkOrderClient />
                    </PricingProvider>
                </div>
            </main>
            <Footer />
        </div>
    );
}
