"use client";

import { useState, useTransition, useRef } from "react";
import { Button } from "@/components/ui/button";
import { updateSiteSetting, updateCategory } from "@/app/actions/settings";
import { uploadFile } from "@/app/actions/upload";
import {
    Loader2, Plus, ArrowLeft, ArrowRight, Save,
    Image as ImageIcon, Upload, X, Pencil
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import Image from "next/image";

interface Category {
    id: string;
    name: string;
    image: string | null;
}

interface GridItem {
    id: string;
    customName?: string;
}

interface GridCategoryManagerProps {
    allCategories: Category[];
    initialGridItems: GridItem[];
}

export function GridCategoryManager({ allCategories, initialGridItems }: GridCategoryManagerProps) {
    const [selectedItems, setSelectedItems] = useState<GridItem[]>(initialGridItems);
    const [selectedToAdd, setSelectedToAdd] = useState<string>("");
    const [isSaving, startTransition] = useTransition();
    const [uploadingId, setUploadingId] = useState<string | null>(null);
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [activeUploadId, setActiveUploadId] = useState<string | null>(null);

    const handleAdd = () => {
        if (!selectedToAdd) return;
        if (selectedItems.some(i => i.id === selectedToAdd)) {
            alert("Kategori sudah ada di list.");
            return;
        }
        setSelectedItems([...selectedItems, { id: selectedToAdd }]);
        setSelectedToAdd("");
    };

    const handleRemove = (id: string) => {
        setSelectedItems(selectedItems.filter((item) => item.id !== id));
    };

    const handleMove = (index: number, direction: 'left' | 'right') => {
        const newItems = [...selectedItems];
        if (direction === 'left' && index > 0) {
            [newItems[index], newItems[index - 1]] = [newItems[index - 1], newItems[index]];
        } else if (direction === 'right' && index < newItems.length - 1) {
            [newItems[index], newItems[index + 1]] = [newItems[index + 1], newItems[index]];
        }
        setSelectedItems(newItems);
    };

    const handleNameChange = (id: string, newName: string) => {
        setSelectedItems(selectedItems.map(item =>
            item.id === id ? { ...item, customName: newName } : item
        ));
    };

    const handleSave = () => {
        startTransition(async () => {
            // Save as array of objects {id, customName}
            const res = await updateSiteSetting("homepage_grid_categories", selectedItems);
            if (res.success) {
                alert("Berhasil menyimpan pengaturan Grid Kategori.");
                router.refresh();
            } else {
                alert("Gagal menyimpan.");
            }
        });
    };

    const triggerUpload = (categoryId: string) => {
        setActiveUploadId(categoryId);
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !activeUploadId) return;

        // Validation: Max 5MB
        if (file.size > 5 * 1024 * 1024) {
            alert("File size too large (Max 5MB)");
            if (fileInputRef.current) fileInputRef.current.value = "";
            return;
        }

        setUploadingId(activeUploadId);
        const formData = new FormData();
        formData.append("file", file);

        try {
            const uploadRes = await uploadFile(formData);
            if (uploadRes.success && uploadRes.url) {
                const updateRes = await updateCategory(activeUploadId, { image: uploadRes.url });
                if (updateRes.success) {
                    router.refresh();
                } else {
                    alert(`Gagal update kategori image: ${updateRes.error || "Unknown error"}`);
                }
            } else {
                alert(`Gagal upload file: ${uploadRes.error}`);
            }
        } catch (err: any) {
            console.error("Upload error encountered:", err);
            alert(`Error uploading file: ${err.message || String(err)}`);
        } finally {
            setUploadingId(null);
            if (fileInputRef.current) fileInputRef.current.value = "";
            setActiveUploadId(null);
        }
    };

    // Helper to get category details
    const getCategory = (id: string) => {
        return allCategories.find((c) => c.id === id);
    };

    // Filter available categories (not already selected)
    const availableCategories = allCategories.filter((c) => !selectedItems.some(i => i.id === c.id));

    return (
        <div className="space-y-6">
            {/* Hidden File Input */}
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
            />

            {/* Top Bar: Add Category */}
            <div className="flex gap-4 items-end bg-gray-50 p-4 rounded-lg border">
                <div className="space-y-2 flex-1">
                    <label className="text-sm font-medium">Tambah Kategori ke Grid</label>
                    <Select value={selectedToAdd} onValueChange={setSelectedToAdd}>
                        <SelectTrigger className="bg-white">
                            <SelectValue placeholder="Pilih Kategori..." />
                        </SelectTrigger>
                        <SelectContent>
                            {availableCategories.map((c) => (
                                <SelectItem key={c.id} value={c.id}>
                                    {c.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <Button onClick={handleAdd} disabled={!selectedToAdd} className="bg-red-600 hover:bg-red-700 text-white">
                    <Plus className="w-4 h-4 mr-2" />
                    Tambah
                </Button>
            </div>

            {/* Grid Visualization */}
            <div>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-semibold text-gray-700">Preview Layout Grid ({selectedItems.length} item)</h3>
                    <Button onClick={handleSave} disabled={isSaving || selectedItems.length === 0} className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
                        {isSaving ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Menyimpan...
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4 mr-2" />
                                Simpan Perubahan
                            </>
                        )}
                    </Button>
                </div>

                {selectedItems.length === 0 ? (
                    <div className="p-10 text-center border-2 border-dashed border-gray-200 rounded-xl bg-gray-50 text-gray-400">
                        Belum ada kategori yang dipilih. Tambahkan kategori di atas.
                    </div>
                ) : (
                    <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
                        {selectedItems.map((item, index) => {
                            const cat = getCategory(item.id);
                            if (!cat) return null;
                            const isUploading = uploadingId === item.id;
                            const hasImage = cat.image && (cat.image.startsWith("/") || cat.image.startsWith("http"));

                            return (
                                <Card key={item.id} className="relative group overflow-hidden border hover:border-blue-300 transition-colors">
                                    <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                        <Button
                                            size="icon"
                                            variant="destructive"
                                            className="h-6 w-6 rounded-full shadow-md"
                                            onClick={() => handleRemove(item.id)}
                                        >
                                            <X className="w-3 h-3" />
                                        </Button>
                                    </div>

                                    <CardContent className="p-4 flex flex-col items-center">
                                        <div
                                            className="w-full aspect-square mb-3 bg-white rounded-xl flex items-center justify-center relative overflow-hidden cursor-pointer group/img border border-gray-100 shadow-sm"
                                            onClick={() => triggerUpload(item.id)}
                                        >
                                            {isUploading ? (
                                                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                                            ) : hasImage ? (
                                                <Image
                                                    src={cat.image!}
                                                    alt={cat.name}
                                                    fill
                                                    className="object-contain"
                                                />
                                            ) : (
                                                <ImageIcon className="w-10 h-10 text-gray-300" />
                                            )}

                                            {/* Hover Overlay */}
                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity">
                                                <Upload className="w-8 h-8 text-white" />
                                            </div>
                                        </div>

                                        {/* Name Editing */}
                                        <div className="w-full">
                                            <Input
                                                className="h-7 text-xs text-center px-1 font-semibold border-transparent hover:border-gray-200 focus:border-blue-500 bg-transparent"
                                                placeholder={cat.name}
                                                value={item.customName || ""}
                                                onChange={(e) => handleNameChange(item.id, e.target.value)}
                                            />
                                            {/* Fallback display if empty is handled by placeholder, but visually users might want to see cat.name if custom is empty. */}
                                            {/* The Input placeholder shows original name if empty, good. */}
                                            <p className="text-[10px] text-center text-gray-400 mt-1 truncate">
                                                {cat.name}
                                            </p>
                                        </div>

                                        {/* Ordering Controls */}
                                        <div className="flex gap-1 mt-3 opacity-20 group-hover:opacity-100 transition-opacity">
                                            <Button
                                                size="icon"
                                                variant="outline"
                                                className="h-6 w-6"
                                                onClick={() => handleMove(index, 'left')}
                                                disabled={index === 0}
                                            >
                                                <ArrowLeft className="h-3 w-3" />
                                            </Button>
                                            <Button
                                                size="icon"
                                                variant="outline"
                                                className="h-6 w-6"
                                                onClick={() => handleMove(index, 'right')}
                                                disabled={index === selectedItems.length - 1}
                                            >
                                                <ArrowRight className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
