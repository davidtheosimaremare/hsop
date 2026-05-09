export const dynamic = "force-dynamic";
import CartPageClient from "./CartPageClient";
import { getCustomerPricingData } from "@/app/actions/customer-pricing";

export default async function CartPage() {
    const pricingData = await getCustomerPricingData();
    return <CartPageClient pricingData={pricingData} />;
}
