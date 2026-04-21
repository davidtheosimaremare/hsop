import { getCategoryMenuConfig, getSearchSuggestions, getSiteSetting } from "@/app/actions/settings";
import { getCurrentUserWithCustomer } from "@/app/actions/auth";
import dynamic from "next/dynamic";

const Header = dynamic(() => import("./Header"), { ssr: true });

export default async function SiteHeader() {
    const [user, menuConfig, searchSuggestions, companyDetails] = await Promise.all([
        getCurrentUserWithCustomer(),
        getCategoryMenuConfig() as Promise<any[]>,
        getSearchSuggestions(8),
        getSiteSetting("company_details") as Promise<any>
    ]);

    return <Header 
        user={user as any} 
        userId={user?.id}
        customerImage={user?.customer?.image}
        menuConfig={menuConfig} 
        searchSuggestions={searchSuggestions} 
        companyDetails={companyDetails}
    />;
}
