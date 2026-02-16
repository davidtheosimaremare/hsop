"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GripVertical, Trash2 } from "lucide-react";
import { SubCategory } from "@/app/admin/settings/categories-menu/types";

interface SortableSubItemProps {
    sub: SubCategory;
    index: number;
    menuId: string; // To pass back for updates
    removeSubCategory: (menuId: string, subId: string) => void;
    updateSubCategory: (menuId: string, subId: string, field: string, value: any) => void;
}

export function SortableSubItem({
    sub,
    index,
    menuId,
    removeSubCategory,
    updateSubCategory
}: SortableSubItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id: sub.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div ref={setNodeRef} style={style} className="flex gap-2 items-center bg-white p-2 rounded border border-gray-100 shadow-sm">
            <div {...attributes} {...listeners} className="cursor-grab hover:text-gray-600 text-gray-300">
                <GripVertical className="w-4 h-4" />
            </div>
            <div className="grid grid-cols-2 gap-2 flex-1">
                <Input
                    value={sub.name}
                    onChange={(e) => updateSubCategory(menuId, sub.id, 'name', e.target.value)}
                    placeholder="Nama Sub Kategori"
                    className="h-8 text-sm bg-white"
                />
                <Input
                    value={sub.link || ""}
                    onChange={(e) => updateSubCategory(menuId, sub.id, 'link', e.target.value)}
                    placeholder="Link Custom (Opsional)"
                    className="h-8 text-sm bg-white"
                />
            </div>
            <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-gray-400 hover:text-red-600"
                onClick={() => removeSubCategory(menuId, sub.id)}
            >
                <Trash2 className="w-3 h-3" />
            </Button>
        </div>
    );
}
