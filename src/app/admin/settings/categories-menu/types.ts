export interface SubCategory {
    id: string;
    name: string;
    alias?: string; // Display name override for website
    count?: number;
    link?: string;
}

export interface MenuItem {
    id: string;
    name: string;
    alias?: string; // Display name override for website
    icon: string;
    categoryId?: string;
    subcategories: SubCategory[];
}

export interface DBCategory {
    id: string;
    name: string;
    parentId: string | null;
}
