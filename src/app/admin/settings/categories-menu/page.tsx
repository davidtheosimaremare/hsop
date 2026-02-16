"use client";

import { useEffect, useState } from "react";
import {
    getCategoryMenuConfig,
    updateCategoryMenuConfig,
    getAllCategories
} from "@/app/actions/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Save, LayoutGrid, Zap, GripVertical, Pencil, Trash2, ChevronUp, ChevronDown } from "lucide-react";
import { MenuItem, SubCategory, DBCategory } from "./types";

export default function CategoriesMenuPage() {
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [dbCategories, setDbCategories] = useState<DBCategory[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [editingAlias, setEditingAlias] = useState<string | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [config, categories] = await Promise.all([
                getCategoryMenuConfig(),
                getAllCategories()
            ]);

            if (Array.isArray(config)) {
                setMenuItems(config as unknown as MenuItem[]);
            } else {
                setMenuItems([]);
            }

            setDbCategories(categories);

            if (config && Array.isArray(config) && config.length > 0) {
                const firstItem = (config as unknown as MenuItem[])[0];
                setSelectedCategory(firstItem.id);
            }
        } catch (error) {
            console.error("Failed to load data", error);
            alert("Gagal memuat data menu.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const result = await updateCategoryMenuConfig(menuItems);
            if (result.success) {
                alert("Pengaturan menu tersimpan!");
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error("Failed to save", error);
            alert("Gagal menyimpan pengaturan.");
        } finally {
            setIsSaving(false);
        }
    };

    // --- Main Menu Operations ---
    const addCategoryFromDB = (category: DBCategory) => {
        const newItem: MenuItem = {
            id: crypto.randomUUID(),
            name: category.name,
            alias: category.name, // Default alias = original name
            icon: "zap",
            categoryId: category.id,
            subcategories: []
        };

        const children = dbCategories.filter(c => c.parentId === category.id);
        if (children.length > 0) {
            newItem.subcategories = children.map(c => ({
                id: crypto.randomUUID(),
                name: c.name,
                alias: c.name, // Default alias
                count: 0,
                link: `/kategori/${c.name.toLowerCase().replace(/\s+/g, '-')}`
            }));
        }

        setMenuItems([...menuItems, newItem]);
        setSelectedCategory(newItem.id);
    };

    const removeCategory = (id: string) => {
        const newItems = menuItems.filter(item => item.id !== id);
        setMenuItems(newItems);
        if (selectedCategory === id) {
            setSelectedCategory(newItems[0]?.id || null);
        }
    };

    const moveMainCategory = (index: number, direction: 'up' | 'down') => {
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= menuItems.length) return;

        const newItems = [...menuItems];
        [newItems[index], newItems[newIndex]] = [newItems[newIndex], newItems[index]];
        setMenuItems(newItems);
    };

    const updateMainCategoryAlias = (id: string, alias: string) => {
        setMenuItems(menuItems.map(item =>
            item.id === id ? { ...item, alias } : item
        ));
    };

    // --- Subcategory Operations ---
    const moveSubCategory = (menuId: string, subIndex: number, direction: 'up' | 'down') => {
        const newIndex = direction === 'up' ? subIndex - 1 : subIndex + 1;

        setMenuItems(menuItems.map(item => {
            if (item.id !== menuId) return item;
            if (newIndex < 0 || newIndex >= item.subcategories.length) return item;

            const newSubs = [...item.subcategories];
            [newSubs[subIndex], newSubs[newIndex]] = [newSubs[newIndex], newSubs[subIndex]];
            return { ...item, subcategories: newSubs };
        }));
    };

    const updateSubCategoryAlias = (menuId: string, subId: string, alias: string) => {
        setMenuItems(menuItems.map(item => {
            if (item.id !== menuId) return item;
            return {
                ...item,
                subcategories: item.subcategories.map(sub =>
                    sub.id === subId ? { ...sub, alias } : sub
                )
            };
        }));
    };

    const removeSubCategory = (menuId: string, subId: string) => {
        setMenuItems(menuItems.map(item => {
            if (item.id !== menuId) return item;
            return {
                ...item,
                subcategories: item.subcategories.filter(sub => sub.id !== subId)
            };
        }));
    };

    const selectedMenuItem = menuItems.find(item => item.id === selectedCategory);
    const availableCategories = dbCategories.filter(cat =>
        cat.parentId === null &&
        !menuItems.some(item => item.categoryId === cat.id)
    );

    if (isLoading) return <div className="p-8">Loading...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Pengaturan Menu Kategori</h1>
                    <p className="text-muted-foreground">Kelola kategori, urutan, dan alias nama yang tampil di website.</p>
                </div>
                <Button onClick={handleSave} disabled={isSaving} className="bg-red-600 hover:bg-red-700">
                    {isSaving ? <>Loading...</> : <><Save className="w-4 h-4 mr-2" />Simpan Perubahan</>}
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Sidebar: Category List with Reorder */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-lg border overflow-hidden">
                        <div className="p-4 border-b bg-gray-50">
                            <h3 className="font-semibold text-sm text-gray-700 uppercase tracking-wider">
                                Kategori Produk
                            </h3>
                        </div>
                        <div className="divide-y">
                            {menuItems.map((item, index) => (
                                <div
                                    key={item.id}
                                    className={`flex items-center gap-2 transition-colors ${selectedCategory === item.id
                                        ? 'bg-red-600 text-white'
                                        : 'hover:bg-gray-50 text-gray-700'
                                        }`}
                                >
                                    {/* Reorder Buttons */}
                                    <div className="flex flex-col border-r py-1 px-1">
                                        <button
                                            onClick={() => moveMainCategory(index, 'up')}
                                            disabled={index === 0}
                                            className={`p-0.5 rounded ${index === 0 ? 'opacity-30' : 'hover:bg-black/10'}`}
                                        >
                                            <ChevronUp className="w-3 h-3" />
                                        </button>
                                        <button
                                            onClick={() => moveMainCategory(index, 'down')}
                                            disabled={index === menuItems.length - 1}
                                            className={`p-0.5 rounded ${index === menuItems.length - 1 ? 'opacity-30' : 'hover:bg-black/10'}`}
                                        >
                                            <ChevronDown className="w-3 h-3" />
                                        </button>
                                    </div>

                                    <button
                                        onClick={() => setSelectedCategory(item.id)}
                                        className="flex-1 text-left py-3 pr-3 flex items-center gap-2"
                                    >
                                        <Zap className="w-4 h-4 flex-shrink-0" />
                                        <span className="flex-1 font-medium text-sm truncate">
                                            {item.alias || item.name}
                                        </span>
                                        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </button>
                                </div>
                            ))}

                            {availableCategories.length > 0 && (
                                <button
                                    onClick={() => setSelectedCategory('_add_new')}
                                    className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-colors ${selectedCategory === '_add_new'
                                        ? 'bg-red-600 text-white'
                                        : 'hover:bg-gray-50 text-red-600'
                                        }`}
                                >
                                    <LayoutGrid className="w-4 h-4 flex-shrink-0" />
                                    <span className="flex-1 font-medium text-sm">+ Tambah Kategori</span>
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="lg:col-span-3">
                    {selectedCategory === '_add_new' ? (
                        <div className="bg-white rounded-lg border p-6">
                            <h2 className="text-xl font-bold mb-4">Kategori Tersedia</h2>
                            <p className="text-sm text-gray-600 mb-4">
                                Pilih kategori dari daftar di bawah untuk menambahkannya ke menu.
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {availableCategories.map((cat) => (
                                    <button
                                        key={cat.id}
                                        onClick={() => addCategoryFromDB(cat)}
                                        className="p-4 border-2 border-dashed rounded-lg hover:border-red-600 hover:bg-red-50 transition-colors text-left"
                                    >
                                        <div className="flex items-center gap-3">
                                            <Zap className="w-5 h-5 text-red-600" />
                                            <div>
                                                <p className="font-semibold">{cat.name}</p>
                                                <p className="text-xs text-gray-500">
                                                    {dbCategories.filter(c => c.parentId === cat.id).length} sub-kategori
                                                </p>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : selectedMenuItem ? (
                        <div className="bg-white rounded-lg border">
                            {/* Header with Alias Edit */}
                            <div className="p-6 border-b">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <Zap className="w-6 h-6 text-red-600" />
                                        <div>
                                            <p className="text-xs text-gray-500">Nama Asli: {selectedMenuItem.name}</p>
                                            <div className="flex items-center gap-2">
                                                {editingAlias === selectedMenuItem.id ? (
                                                    <Input
                                                        value={selectedMenuItem.alias || selectedMenuItem.name}
                                                        onChange={(e) => updateMainCategoryAlias(selectedMenuItem.id, e.target.value)}
                                                        onBlur={() => setEditingAlias(null)}
                                                        onKeyDown={(e) => e.key === 'Enter' && setEditingAlias(null)}
                                                        className="h-8 text-lg font-bold w-64"
                                                        autoFocus
                                                    />
                                                ) : (
                                                    <>
                                                        <h2 className="text-2xl font-bold">{selectedMenuItem.alias || selectedMenuItem.name}</h2>
                                                        <button
                                                            onClick={() => setEditingAlias(selectedMenuItem.id)}
                                                            className="p-1 hover:bg-gray-100 rounded"
                                                        >
                                                            <Pencil className="w-4 h-4 text-gray-400" />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => removeCategory(selectedMenuItem.id)}
                                        className="text-red-600 border-red-600 hover:bg-red-50"
                                    >
                                        <Trash2 className="w-4 h-4 mr-1" />
                                        Hapus
                                    </Button>
                                </div>
                            </div>

                            {/* Subcategories with Reorder & Alias */}
                            <div className="p-6">
                                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-4">Sub Kategori</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {selectedMenuItem.subcategories.map((sub, subIndex) => (
                                        <div
                                            key={sub.id}
                                            className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border hover:border-gray-300 transition-colors"
                                        >
                                            {/* Reorder */}
                                            <div className="flex flex-col gap-0.5">
                                                <button
                                                    onClick={() => moveSubCategory(selectedMenuItem.id, subIndex, 'up')}
                                                    disabled={subIndex === 0}
                                                    className={`p-0.5 rounded ${subIndex === 0 ? 'opacity-30' : 'hover:bg-gray-200'}`}
                                                >
                                                    <ChevronUp className="w-3 h-3 text-gray-500" />
                                                </button>
                                                <button
                                                    onClick={() => moveSubCategory(selectedMenuItem.id, subIndex, 'down')}
                                                    disabled={subIndex === selectedMenuItem.subcategories.length - 1}
                                                    className={`p-0.5 rounded ${subIndex === selectedMenuItem.subcategories.length - 1 ? 'opacity-30' : 'hover:bg-gray-200'}`}
                                                >
                                                    <ChevronDown className="w-3 h-3 text-gray-500" />
                                                </button>
                                            </div>

                                            <GripVertical className="w-4 h-4 text-gray-300" />

                                            {/* Original Name */}
                                            <div className="flex-1">
                                                <p className="text-xs text-gray-400">{sub.name}</p>
                                                <Input
                                                    value={sub.alias || sub.name}
                                                    onChange={(e) => updateSubCategoryAlias(selectedMenuItem.id, sub.id, e.target.value)}
                                                    className="h-7 text-sm mt-1"
                                                    placeholder="Alias untuk website"
                                                />
                                            </div>

                                            {/* Count */}
                                            <span className="text-gray-400 text-sm w-12 text-right">{sub.count || 0}</span>

                                            {/* Delete */}
                                            <button
                                                onClick={() => removeSubCategory(selectedMenuItem.id, sub.id)}
                                                className="p-1 hover:bg-red-100 rounded text-gray-400 hover:text-red-600"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}

                                    {selectedMenuItem.subcategories.length === 0 && (
                                        <p className="text-center text-gray-400 py-8">Tidak ada sub-kategori</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white rounded-lg border p-12 text-center text-gray-400">
                            <LayoutGrid className="w-16 h-16 mx-auto mb-4 opacity-20" />
                            <p>Pilih kategori dari sidebar atau tambahkan kategori baru</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
