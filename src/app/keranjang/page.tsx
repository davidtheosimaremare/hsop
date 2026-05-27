export const dynamic = "force-dynamic";
import CartPageClient from "./CartPageClient";
import { getCustomerPricingData } from "@/app/actions/customer-pricing";

import { getSiteSetting } from "@/app/actions/settings";

export default async function CartPage() {
    const [pricingData, hidePriceRules] = await Promise.all([
        getCustomerPricingData(),
        getSiteSetting("hide_price_rules")
    ]);
    return <CartPageClient pricingData={pricingData} hidePriceRules={hidePriceRules} />;
}
