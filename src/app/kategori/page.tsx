// Category menu data is cached via unstable_cache, no need for force-dynamic

import { getCategoryMenuConfig } from "@/app/actions/settings";
import KategoriClient from "./KategoriClient";

interface SubCategory {
    id: string;
    name: string;
    alias?: string;
    count?: number;
    link?: string;
}

interface MenuItem {
    id: string;
    name: string;
    alias?: string;
    icon: string;
    categoryId?: string;
    subcategories: SubCategory[];
}

export default async function KategoriPage() {
    const rawConfig = await getCategoryMenuConfig();
    const menuItems: MenuItem[] = Array.isArray(rawConfig)
        ? (rawConfig as unknown as MenuItem[])
        : [];

    return <KategoriClient menuItems={menuItems} />;
}
