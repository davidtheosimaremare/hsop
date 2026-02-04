"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { createCategorySection, updateCategorySection, deleteCategorySection } from "@/app/actions/settings";
import { Loader2, Plus, GripVertical, Trash2, Edit2, Check, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface Section {
    id: string;
    title: string;
    order: number;
    categoryIds: string[];
    isVisible: boolean;
}

interface Category {
    id: string;
    name: string;
}

interface SectionManagerProps {
    initialSections: Section[];
    categories: Category[];
}

export function SectionManager({ initialSections, categories }: SectionManagerProps) {
    const [newTitle, setNewTitle] = useState("");
    const [isCreating, startCreate] = useTransition();
    const router = useRouter();

    const handleCreate = () => {
        if (!newTitle) return;
        startCreate(async () => {
            const res = await createCategorySection(newTitle);
            if (res.success) {
                setNewTitle("");
                router.refresh();
            } else {
                alert("Gagal membuat section.");
            }
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex gap-2 items-center p-4 bg-gray-50 rounded-lg border">
                <Input
                    placeholder="Judul Section Baru (Misal: Lampu Terlaris)"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                />
                <Button onClick={handleCreate} disabled={isCreating || !newTitle}>
                    {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    Tambah
                </Button>
            </div>

            <div className="space-y-4">
                {initialSections.map((section) => (
                    <SectionItem key={section.id} section={section} categories={categories} />
                ))}
            </div>
        </div>
    );
}

function SectionItem({ section, categories }: { section: Section, categories: Category[] }) {
    const [isEditing, setIsEditing] = useState(false);
    const [title, setTitle] = useState(section.title);
    const [order, setOrder] = useState(section.order);
    const [isVisible, setIsVisible] = useState(section.isVisible);
    const [selectedCats, setSelectedCats] = useState<string[]>(section.categoryIds);

    const [isSaving, startTransition] = useTransition();
    const router = useRouter();

    const handleSave = () => {
        startTransition(async () => {
            const res = await updateCategorySection(section.id, {
                title,
                order: Number(order),
                isVisible,
                categoryIds: selectedCats
            });
            if (res.success) {
                setIsEditing(false);
                router.refresh();
            } else {
                alert("Gagal update section.");
            }
        });
    };

    const handleDelete = () => {
        if (!confirm("Hapus section ini?")) return;
        startTransition(async () => {
            await deleteCategorySection(section.id);
            router.refresh();
        });
    };

    const toggleCategory = (catId: string) => {
        if (selectedCats.includes(catId)) {
            setSelectedCats(selectedCats.filter(id => id !== catId));
        } else {
            setSelectedCats([...selectedCats, catId]);
        }
    };

    return (
        <div className="border rounded-lg p-4 bg-white shadow-sm space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                    <GripVertical className="h-5 w-5 text-gray-400 cursor-grab" />
                    {isEditing ? (
                        <Input value={title} onChange={(e) => setTitle(e.target.value)} className="max-w-xs font-semibold" />
                    ) : (
                        <h3 className="font-semibold text-lg">{section.title}</h3>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {isEditing ? (
                        <>
                            <Input
                                type="number"
                                className="w-16 text-center"
                                value={order}
                                onChange={(e) => setOrder(Number(e.target.value))}
                                placeholder="Urutan"
                            />
                            <Switch checked={isVisible} onCheckedChange={setIsVisible} />
                            <Button size="sm" onClick={handleSave} disabled={isSaving} className="bg-green-600 hover:bg-green-700">
                                <Check className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>
                                <X className="h-4 w-4" />
                            </Button>
                        </>
                    ) : (
                        <>
                            <Badge variant={section.isVisible ? "default" : "secondary"}>
                                {section.isVisible ? "Aktif" : "Sembunyi"}
                            </Badge>
                            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
                                Order: {section.order}
                            </span>
                            <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
                                <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={handleDelete} className="text-red-500">
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </>
                    )}
                </div>
            </div>

            <Separator />

            <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-500">Kategori dalam Section ini:</h4>
                {isEditing ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-40 overflow-y-auto p-2 border rounded bg-gray-50">
                        {categories.map((cat) => (
                            <div
                                key={cat.id}
                                className={`
                                    cursor-pointer px-3 py-1 text-xs rounded border transition-colors
                                    ${selectedCats.includes(cat.id) ? "bg-blue-100 border-blue-500 text-blue-700" : "bg-white border-gray-200 text-gray-600 hover:border-gray-400"}
                                `}
                                onClick={() => toggleCategory(cat.id)}
                            >
                                {cat.name}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-wrap gap-2">
                        {section.categoryIds.length === 0 ? (
                            <span className="text-sm text-gray-400 italic">Belum ada kategori dipilih.</span>
                        ) : (
                            section.categoryIds.map(id => {
                                const cat = categories.find(c => c.id === id);
                                return cat ? (
                                    <Badge key={id} variant="outline" className="bg-gray-50">{cat.name}</Badge>
                                ) : null;
                            })
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
