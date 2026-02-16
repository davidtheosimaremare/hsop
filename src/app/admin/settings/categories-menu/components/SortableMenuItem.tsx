"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GripVertical, Trash2, Zap, LayoutGrid, ChevronRight, Plus } from "lucide-react";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { DndContext, closestCenter, DragEndEvent } from "@dnd-kit/core";
import { MenuItem, SubCategory, DBCategory } from "@/app/admin/settings/categories-menu/types";
import { SortableSubItem } from "@/app/admin/settings/categories-menu/components/SortableSubItem";

interface SortableMenuItemProps {
    item: MenuItem;
    index: number;
    dbCategories: DBCategory[];
    updateMenuItem: (id: string, field: string, value: any) => void;
    removeMenuItem: (id: string) => void;
    addSubCategory: (id: string) => void;
    removeSubCategory: (menuId: string, subId: string) => void;
    updateSubCategory: (menuId: string, subId: string, field: string, value: any) => void;
    handleSubDragEnd: (event: DragEndEvent, menuId: string) => void;
}

const ICONS = [
    { value: "zap", label: "Zap (Listrik)", icon: Zap },
    { value: "layout-grid", label: "Grid (Control)", icon: LayoutGrid },
    { value: "chevron-right", label: "Chevron (General)", icon: ChevronRight },
];

export function SortableMenuItem({
    item,
    index,
    dbCategories,
    updateMenuItem,
    removeMenuItem,
    addSubCategory,
    removeSubCategory,
    updateSubCategory,
    handleSubDragEnd
}: SortableMenuItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id: item.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div ref={setNodeRef} style={style} className="mb-4">
            <Card className="relative">
                <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 text-gray-400 hover:text-red-600 z-10"
                    onClick={() => removeMenuItem(item.id)}
                >
                    <Trash2 className="w-4 h-4" />
                </Button>
                <CardHeader className="pb-4">
                    <CardTitle className="text-base font-medium flex items-center gap-2">
                        <div {...attributes} {...listeners} className="cursor-grab hover:text-gray-600">
                            <GripVertical className="w-4 h-4 text-gray-300" />
                        </div>
                        Item Menu #{index + 1}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Nama Menu</Label>
                            <Input
                                value={item.name}
                                onChange={(e) => updateMenuItem(item.id, 'name', e.target.value)}
                                placeholder="Contoh: Low Voltage Product"
                                className="bg-white"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Ikon</Label>
                            <Select
                                value={item.icon}
                                onValueChange={(val) => updateMenuItem(item.id, 'icon', val)}
                            >
                                <SelectTrigger className="bg-white">
                                    <SelectValue placeholder="Pilih Ikon" />
                                </SelectTrigger>
                                <SelectContent>
                                    {ICONS.map(icon => (
                                        <SelectItem key={icon.value} value={icon.value}>
                                            <div className="flex items-center gap-2">
                                                <icon.icon className="w-4 h-4" />
                                                {icon.label}
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Hubungkan ke Kategori Database</Label>
                            <Select
                                value={item.categoryId || "none"}
                                onValueChange={(val) => {
                                    const newVal = val === "none" ? undefined : val;
                                    updateMenuItem(item.id, 'categoryId', newVal);
                                    if (newVal && !item.name) {
                                        const cat = dbCategories.find(c => c.id === newVal);
                                        if (cat) updateMenuItem(item.id, 'name', cat.name);
                                    }
                                }}
                            >
                                <SelectTrigger className="bg-white">
                                    <SelectValue placeholder="Pilih Kategori (Opsional)" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">-- Tidak Terhubung --</SelectItem>
                                    {dbCategories.filter(c => !c.parentId).map(cat => (
                                        <SelectItem key={cat.id} value={cat.id}>
                                            {cat.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Subcategories Section */}
                    <div className="bg-gray-50 p-4 rounded-lg space-y-3 border border-gray-100">
                        <div className="flex justify-between items-center mb-2">
                            <Label className="text-xs font-semibold text-gray-500 uppercase">Sub Kategori</Label>
                            <div className="flex gap-2">
                                {item.categoryId && (
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        className="h-7 text-xs"
                                        onClick={() => {
                                            if (!item.categoryId) return;
                                            const children = dbCategories.filter(c => c.parentId === item.categoryId);
                                            const newSubs: SubCategory[] = children.map(c => ({
                                                id: crypto.randomUUID(),
                                                name: c.name,
                                                count: 0,
                                                link: `/kategori/${c.name.toLowerCase().replace(/\s+/g, '-')}`
                                            }));

                                            // Handle duplicate prevention or just append? Append for now as requested.
                                            // Actually, user wants "Import", so likely expecting full list.

                                            // We need to pass this up or handle via props? 
                                            // Ideally the parent state manager handles "import". 
                                            // But here we are deep in component. 
                                            // I'll make a specialized prop for this action or just use updateMenuItem("subcategories", ...)

                                            const newSubcategories = [...item.subcategories, ...newSubs];
                                            updateMenuItem(item.id, 'subcategories', newSubcategories);
                                        }}
                                    >
                                        <Zap className="w-3 h-3 mr-1" />
                                        Import dari DB
                                    </Button>
                                )}
                                <Button variant="outline" size="sm" onClick={() => addSubCategory(item.id)} className="h-7 text-xs bg-white">
                                    <Plus className="w-3 h-3 mr-1" />
                                    Tambah Sub
                                </Button>
                            </div>
                        </div>

                        {item.subcategories.length === 0 && (
                            <p className="text-sm text-gray-400 italic text-center py-2">Belum ada sub kategori</p>
                        )}

                        <DndContext
                            collisionDetection={closestCenter}
                            onDragEnd={(e) => handleSubDragEnd(e, item.id)}
                        >
                            <SortableContext
                                items={item.subcategories.map(s => s.id)}
                                strategy={verticalListSortingStrategy}
                            >
                                <div className="space-y-2">
                                    {item.subcategories.map((sub, subIndex) => (
                                        <SortableSubItem
                                            key={sub.id}
                                            sub={sub}
                                            index={subIndex} // Note: index here is index within subcategories
                                            menuId={item.id}
                                            removeSubCategory={removeSubCategory}
                                            updateSubCategory={updateSubCategory}
                                        />
                                    ))}
                                </div>
                            </SortableContext>
                        </DndContext>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
