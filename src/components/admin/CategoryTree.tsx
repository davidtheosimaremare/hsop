"use client";

import { useState } from "react";
import { ChevronRight, ChevronDown, RefreshCw, Eye, EyeOff, GripVertical, ChevronUp } from "lucide-react";
import { syncCategories, updateCategoryOrder, toggleCategoryVisibility } from "@/app/actions/category";
import { Button } from "@/components/ui/button";

interface CategoryNode {
    id: string;
    name: string;
    isVisible: boolean;
    order: number;
    children: CategoryNode[];
    accurateId?: number;
}

export default function CategoryTree({ initialCategories }: { initialCategories: CategoryNode[] }) {
    const [categories, setCategories] = useState(initialCategories);
    const [isLoading, setIsLoading] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);

    const handleSync = async () => {
        setIsSyncing(true);
        try {
            const result = await syncCategories();
            if (result.success) {
                alert(`Synced ${result.count} categories!`);
                window.location.reload(); // Refresh to get new data
            } else {
                alert("Failed to sync");
            }
        } finally {
            setIsSyncing(false);
        }
    };

    const handleToggleVisibility = async (id: string, current: boolean) => {
        // Optimistic update
        const toggleNode = (nodes: CategoryNode[]): CategoryNode[] => {
            return nodes.map(node => {
                if (node.id === id) return { ...node, isVisible: !current };
                if (node.children) return { ...node, children: toggleNode(node.children) };
                return node;
            });
        };
        setCategories(toggleNode(categories));

        await toggleCategoryVisibility(id, !current);
    };

    const moveItem = async (index: number, direction: 'up' | 'down', siblings: CategoryNode[], parentId: string | null = null) => {
        if (direction === 'up' && index === 0) return;
        if (direction === 'down' && index === siblings.length - 1) return;

        const newIndex = direction === 'up' ? index - 1 : index + 1;

        // Swap locally
        const newSiblings = [...siblings];
        [newSiblings[index], newSiblings[newIndex]] = [newSiblings[newIndex], newSiblings[index]];

        // Re-assign orders
        const updates = newSiblings.map((cat, idx) => ({ id: cat.id, order: idx }));

        // Recursively update state
        const updateChildren = (nodes: CategoryNode[]): CategoryNode[] => {
            // Check if this list matches siblings (by checking ID of first item before swap? No, simpler to rebuild tree)
            // Actually, we need to find the parent and update its children.
            // Simplified: Refresh everything or smarter update.
            // Let's just update the specific list in state.

            // This is complex to update strictly purely without parent ref.
            // Simpler: reload page or fetchTree again.
            // Optimistic update is tricky for tree.
            return nodes; // Placeholder
        };

        // For now, let's just await server update and reload/re-fetch. 
        // Or better, just update server and reload page for simplicity.

        setIsLoading(true);
        await updateCategoryOrder(updates);
        window.location.reload();
    };

    return (
        <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold">Struktur Kategori</h2>
                <Button onClick={handleSync} disabled={isSyncing} variant="outline" size="sm" className="gap-2 h-8">
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                    {isSyncing ? "Syncing..." : "Sync accurate"}
                </Button>
            </div>

            <div className="space-y-1">
                {categories.map((cat, idx) => (
                    <CategoryItem
                        key={cat.id}
                        node={cat}
                        index={idx}
                        siblings={categories}
                        onToggle={handleToggleVisibility}
                        onMove={moveItem}
                        depth={0}
                    />
                ))}
            </div>
        </div>
    );
}

function CategoryItem({
    node,
    index,
    siblings,
    onToggle,
    onMove,
    depth
}: {
    node: CategoryNode,
    index: number,
    siblings: CategoryNode[],
    onToggle: (id: string, val: boolean) => void,
    onMove: (idx: number, dir: 'up' | 'down', list: CategoryNode[]) => void,
    depth: number
}) {
    const [isExpanded, setIsExpanded] = useState(true);

    return (
        <div className="select-none text-sm">
            <div
                className={`flex items-center gap-2 py-1.5 px-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-teal-500 transition-colors ${!node.isVisible ? 'opacity-60' : ''}`}
                style={{ marginLeft: `${depth * 20}px` }}
            >
                <button onClick={() => setIsExpanded(!isExpanded)} className="p-1 hover:bg-gray-200 rounded">
                    {node.children && node.children.length > 0 ? (
                        isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-gray-500" /> : <ChevronRight className="w-3.5 h-3.5 text-gray-500" />
                    ) : <div className="w-3.5 h-3.5" />}
                </button>

                <div className="flex-1 font-medium text-sm">{node.name}</div>

                <div className="flex items-center gap-0.5">
                    <button
                        onClick={() => onMove(index, 'up', siblings)}
                        disabled={index === 0}
                        className="p-1 hover:bg-gray-200 rounded disabled:opacity-20"
                        title="Move Up"
                    >
                        <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                        onClick={() => onMove(index, 'down', siblings)}
                        disabled={index === siblings.length - 1}
                        className="p-1 hover:bg-gray-200 rounded disabled:opacity-20"
                        title="Move Down"
                    >
                        <ChevronDown className="w-3.5 h-3.5" />
                    </button>

                    <div className="w-px h-3 bg-gray-300 mx-1.5"></div>

                    <button
                        onClick={() => onToggle(node.id, node.isVisible)}
                        className={`p-1 rounded ${node.isVisible ? 'text-teal-600 hover:bg-teal-50' : 'text-gray-400 hover:bg-gray-100'}`}
                        title={node.isVisible ? "Visible" : "Hidden"}
                    >
                        {node.isVisible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    </button>
                </div>
            </div>

            {isExpanded && node.children && node.children.length > 0 && (
                <div className="mt-1 space-y-1">
                    {node.children.map((child, idx) => (
                        <CategoryItem
                            key={child.id}
                            node={child}
                            index={idx}
                            siblings={node.children}
                            onToggle={onToggle}
                            onMove={(i, d, l) => onMove(i, d, l)} // Propagate up? No, onMove needs to handle nested lists.
                            // Actually, onMove logic in parent component relied on top-level siblings. 
                            // We need access to child list update logic.
                            // For simplicity in this recursive component, we need a smarter update function or just pass down a specialized handler.
                            // BUT, since we implemented 'reload page' strategy, simply passing the right SIBLINGS array to the handler works!
                            // The handler receives the Specific Siblings array for that level.
                            depth={depth + 1}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
