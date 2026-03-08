import { getCategoryMenuConfig, getSearchSuggestions, getSiteSetting } from "@/app/actions/settings";
import { getCurrentUserWithCustomer } from "@/app/actions/auth";
import dynamic from "next/dynamic";

const Header = dynamic(() => import("./Header"), { ssr: true });

export default async function SiteHeader() {
    const user = await getCurrentUserWithCustomer();
    const menuConfig = (await getCategoryMenuConfig()) as any[];
    const searchSuggestions = await getSearchSuggestions(8);
    const companyDetails = await getSiteSetting("company_details") as any;

    return <Header 
        user={user} 
        userId={user?.id}
        customerImage={user?.image}
        menuConfig={menuConfig} 
        searchSuggestions={searchSuggestions} 
        companyDetails={companyDetails}
    />;
}
