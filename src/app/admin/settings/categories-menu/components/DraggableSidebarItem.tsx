"use client";

import { useDraggable } from "@dnd-kit/core";
import { DBCategory } from "../types";
import { GripVertical, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DraggableSidebarItemProps {
    category: DBCategory;
    onAdd: () => void;
}

export function DraggableSidebarItem({ category, onAdd }: DraggableSidebarItemProps) {
    const { attributes, listeners, setNodeRef, transform } = useDraggable({
        id: `sidebar-${category.id}`,
        data: {
            type: "SidebarItem",
            category: category
        }
    });

    // Provide simplified style for the drag preview or just CSS check
    // If we want the item to visually move out of the sidebar during drag
    const style = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    } : undefined;

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="flex items-center justify-between p-3 mb-2 bg-white rounded-md border text-sm shadow-sm cursor-grab active:cursor-grabbing hover:border-red-200"
            {...listeners}
            {...attributes}
        >
            <div className="flex items-center gap-2 overflow-hidden">
                <GripVertical className="w-4 h-4 text-gray-300 flex-shrink-0" />
                <span className="truncate" title={category.name}>{category.name}</span>
            </div>

            {/* Button to click-to-add if drag is annoying */}
            <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 ml-2"
                onClick={(e) => {
                    e.stopPropagation(); // Prevent drag start
                    onAdd();
                }}
            >
                <Plus className="w-3 h-3 text-red-600" />
            </Button>
        </div>
    );
}
