import { getSession } from "@/lib/auth";
import { getCategoryMenuConfig, getSearchSuggestions } from "@/app/actions/settings";
import Header from "./Header";

export default async function SiteHeader() {
    const session = await getSession();
    const user = session?.user || null;
    const menuConfig = (await getCategoryMenuConfig()) as any[];
    const searchSuggestions = await getSearchSuggestions(8);

    return <Header user={user} menuConfig={menuConfig} searchSuggestions={searchSuggestions} />;
}
