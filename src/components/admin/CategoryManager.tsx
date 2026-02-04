"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { syncCategoriesFromProducts, updateCategory } from "@/app/actions/settings";
import { Loader2, RefreshCw, ChevronRight, ChevronDown, Folder, GripVertical } from "lucide-react";
import { useRouter } from "next/navigation";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Category {
    id: string;
    name: string;
    parentId: string | null;
    isVisible: boolean;
    order: number;
    children: Category[];
}

interface CategoryManagerProps {
    initialCategories: any[]; // Using any to avoid strict type mismatch for now, should match DB type
}

export function CategoryManager({ initialCategories }: CategoryManagerProps) {
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    // Transform flat list (if any) or use hierarchical data
    // Prisma `include: { children: true }` gives us one level deep, 
    // but building a full recursive tree might be needed if depth > 1.
    // For simplicity, let's assume we handle Parent-Child logic via Select Parent.

    const handleSync = () => {
        startTransition(async () => {
            const res = await syncCategoriesFromProducts();
            if (res.success) {
                alert(`Berhasil sinkronisasi! Menambahkan ${res.count} kategori baru.`);
                router.refresh();
            } else {
                alert("Gagal sinkronisasi.");
            }
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-end">
                <Button onClick={handleSync} disabled={isPending} variant="outline" className="gap-2">
                    {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                    Sync dari Produk
                </Button>
            </div>

            <div className="border rounded-md divide-y">
                {initialCategories.filter(c => !c.parentId).map((cat) => (
                    <CategoryItem key={cat.id} category={cat} allCategories={initialCategories} />
                ))}
            </div>
        </div>
    );
}

function CategoryItem({ category, allCategories, depth = 0 }: { category: Category; allCategories: Category[]; depth?: number }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState(category.name);
    const [parentId, setParentId] = useState<string | null>(category.parentId);
    const [isVisible, setIsVisible] = useState(category.isVisible);
    const [order, setOrder] = useState(category.order);

    const [isSaving, startTransition] = useTransition();
    const router = useRouter();

    const hasChildren = category.children && category.children.length > 0;

    const handleSave = () => {
        startTransition(async () => {
            const res = await updateCategory(category.id, {
                name,
                parentId: parentId === "root" ? null : parentId,
                isVisible,
                order: Number(order)
            });
            if (res.success) {
                setIsEditing(false);
                router.refresh();
            } else {
                alert("Gagal update kategori");
            }
        });
    };

    return (
        <div className="bg-white">
            <div className="flex items-center gap-2 p-3 hover:bg-gray-50">
                <div style={{ marginLeft: `${depth * 20}px` }} className="flex items-center gap-2 grow">
                    {hasChildren ? (
                        <button onClick={() => setIsExpanded(!isExpanded)} className="text-gray-400 hover:text-gray-600">
                            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </button>
                    ) : (
                        <span className="w-4" /> // Spacer
                    )}

                    <Folder className={`h-4 w-4 ${category.isVisible ? "text-blue-500" : "text-gray-300"}`} />

                    {isEditing ? (
                        <Input className="h-8 max-w-[200px]" value={name} onChange={(e) => setName(e.target.value)} />
                    ) : (
                        <span className={`font-medium ${!category.isVisible && "text-gray-400"}`}>{category.name}</span>
                    )}

                    {!isEditing && (
                        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                            Order: {category.order}
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    {isEditing ? (
                        <>
                            {/* Parent Selector */}
                            <Select value={parentId || "root"} onValueChange={(v) => setParentId(v === "root" ? null : v)}>
                                <SelectTrigger className="w-[180px] h-8">
                                    <SelectValue placeholder="Pilih Induk" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="root">-- Root (Induk) --</SelectItem>
                                    {allCategories.filter(c => c.id !== category.id).map((c) => (
                                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Input
                                type="number"
                                className="h-8 w-16"
                                value={order}
                                onChange={(e) => setOrder(Number(e.target.value))}
                                placeholder="Urutan"
                            />

                            <Switch checked={isVisible} onCheckedChange={setIsVisible} />

                            <Button size="sm" onClick={handleSave} disabled={isSaving}>Simpan</Button>
                            <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>Batal</Button>
                        </>
                    ) : (
                        <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>Edit</Button>
                    )}
                </div>
            </div>

            {/* Render Children Recursively */}
            {isExpanded && hasChildren && (
                <div className="border-t border-gray-100">
                    {category.children
                        .sort((a, b) => a.order - b.order)
                        .map((child) => (
                            <CategoryItem
                                key={child.id}
                                category={child}
                                allCategories={allCategories}
                                depth={depth + 1}
                            />
                        ))}
                </div>
            )}
        </div>
    );
}
