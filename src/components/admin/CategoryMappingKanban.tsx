"use client";

import React, { useState, useTransition, useEffect, useRef } from "react";
import {
    DndContext,
    DragOverlay,
    useDraggable,
    useDroppable,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragStartEvent,
    DragEndEvent,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { updateCategoryMapping } from "@/app/actions/category-mapping";
import { Loader2, Plug2, CircuitBoard, Flashlight, Layers, GripVertical } from "lucide-react";

interface CategoryData {
    categoryName: string;
    discountType: string | null;
}

interface CategoryMappingKanbanProps {
    categories: CategoryData[];
}

type Items = { [key: string]: string[] };

const COLUMNS = [
    { id: "unmapped", label: "Belum Dikategorikan", icon: Layers, color: "bg-gray-100 text-gray-700", borderColor: "border-l-gray-400" },
    { id: "LP", label: "Siemens LP", icon: Plug2, color: "bg-yellow-100 text-yellow-700", borderColor: "border-l-yellow-500" },
    { id: "CP", label: "Siemens CP", icon: CircuitBoard, color: "bg-blue-100 text-blue-700", borderColor: "border-l-blue-500" },
    { id: "LIGHTING", label: "Portable Lighting", icon: Flashlight, color: "bg-orange-100 text-orange-700", borderColor: "border-l-orange-500" },
];

export function CategoryMappingKanban({ categories }: CategoryMappingKanbanProps) {
    const [items, setItems] = useState<Items>({
        unmapped: [],
        LP: [],
        CP: [],
        LIGHTING: []
    });

    const [activeId, setActiveId] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    // Populate state from props
    useEffect(() => {
        setItems({
            unmapped: categories.filter(c => !c.discountType).map(c => c.categoryName),
            LP: categories.filter(c => c.discountType === "LP").map(c => c.categoryName),
            CP: categories.filter(c => c.discountType === "CP").map(c => c.categoryName),
            LIGHTING: categories.filter(c => c.discountType === "LIGHTING").map(c => c.categoryName),
        });
    }, [categories]);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor)
    );

    const findContainer = (itemId: string): string | undefined => {
        return Object.keys(items).find((key) => items[key].includes(itemId));
    };

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (!over) {
            setActiveId(null);
            return;
        }

        const itemId = active.id as string;
        const targetContainerId = over.id as string;
        const sourceContainerId = findContainer(itemId);

        // Check if we're dropping on a valid container
        if (!COLUMNS.some(c => c.id === targetContainerId)) {
            setActiveId(null);
            return;
        }

        // If container changed, move item and save to DB
        if (sourceContainerId && targetContainerId !== sourceContainerId) {
            // Move item in local state
            setItems((prev) => ({
                ...prev,
                [sourceContainerId]: prev[sourceContainerId].filter(id => id !== itemId),
                [targetContainerId]: [...prev[targetContainerId], itemId],
            }));

            // Save to DB
            const newType = targetContainerId === "unmapped" ? null : targetContainerId;

            startTransition(async () => {
                await updateCategoryMapping(itemId, newType);
            });
        }

        setActiveId(null);
    };

    const activeItem = activeId ? activeId : null;

    return (
        <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 min-h-[500px]">
                {COLUMNS.map((col) => (
                    <DroppableColumn
                        key={col.id}
                        col={col}
                        items={items[col.id] || []}
                    />
                ))}
            </div>

            <DragOverlay>
                {activeItem ? (
                    <div className="p-3 bg-white border-2 border-blue-500 rounded shadow-xl flex items-center justify-between cursor-grabbing rotate-2 scale-105">
                        <span className="text-sm font-medium">{activeItem}</span>
                        <GripVertical className="h-3 w-3 text-gray-400" />
                    </div>
                ) : null}
            </DragOverlay>

            {isPending && (
                <div className="fixed bottom-4 right-4 bg-black text-white px-4 py-2 rounded-full flex items-center gap-2 shadow-lg z-50">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Menyimpan...</span>
                </div>
            )}
        </DndContext>
    );
}

function DroppableColumn({ col, items }: { col: typeof COLUMNS[0], items: string[] }) {
    const { setNodeRef, isOver } = useDroppable({ id: col.id });

    return (
        <div
            ref={setNodeRef}
            className={`flex flex-col h-full min-h-[400px] rounded-lg border-2 border-l-4 transition-all duration-200 ${col.borderColor} ${isOver
                    ? 'border-blue-500 bg-blue-50 shadow-lg scale-[1.02]'
                    : 'border-gray-200 bg-gray-50'
                }`}
        >
            <div className={`p-3 border-b flex items-center gap-2 font-medium ${col.color} rounded-t-lg`}>
                <col.icon className="h-4 w-4" />
                <span className="text-sm">{col.label}</span>
                <span className="ml-auto bg-white/70 px-2 py-0.5 rounded text-xs font-bold">
                    {items.length}
                </span>
            </div>

            <div className="flex-1 p-2 overflow-y-auto">
                <div className="space-y-2">
                    {items.map((itemId) => (
                        <DraggableItem key={itemId} id={itemId} />
                    ))}
                    {items.length === 0 && (
                        <div className={`text-center py-10 text-xs border-2 border-dashed rounded transition-colors ${isOver ? 'border-blue-400 text-blue-500 bg-blue-100' : 'border-gray-300 text-gray-400 bg-white/50'
                            }`}>
                            {isOver ? '✓ Lepas di sini!' : 'Drop kategori di sini'}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function DraggableItem({ id }: { id: string }) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id });

    const style = {
        transform: CSS.Translate.toString(transform),
        opacity: isDragging ? 0.3 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className="p-3 bg-white border border-gray-200 rounded shadow-sm flex items-center justify-between group cursor-grab active:cursor-grabbing hover:border-blue-300 hover:shadow-md transition-all"
        >
            <span className="text-sm font-medium truncate">{id}</span>
            <GripVertical className="h-3 w-3 text-gray-300 group-hover:text-gray-500" />
        </div>
    );
}
