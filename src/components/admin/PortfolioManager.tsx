"use client";

import { useState, useTransition, useRef } from "react";
import { Button } from "@/components/ui/button";
import { createClientProject, deleteClientProject } from "@/app/actions/settings";
import { uploadFile } from "@/app/actions/upload";
import { Loader2, Plus, Trash2, MapPin, Building, Image as ImageIcon, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";

interface ClientProject {
    id: string;
    projectName: string;
    clientName: string;
    location: string | null;
    image: string;
    order: number;
}

interface PortfolioManagerProps {
    initialClients: ClientProject[];
}

export function PortfolioManager({ initialClients }: PortfolioManagerProps) {
    const [projectName, setProjectName] = useState("");
    const [clientName, setClientName] = useState("");
    const [location, setLocation] = useState("");
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string>("");

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isCreating, startCreate] = useTransition();
    const router = useRouter();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            const previewUrl = URL.createObjectURL(file);
            setImagePreview(previewUrl);
        }
    };

    const handleCreate = () => {
        if (!projectName || !clientName || !imageFile) {
            alert("Nama proyek, nama PT, dan gambar wajib diisi.");
            return;
        }

        startCreate(async () => {
            try {
                // 1. Upload Image
                const formData = new FormData();
                formData.append("file", imageFile);

                const uploadRes = await uploadFile(formData);
                if (!uploadRes.success || !uploadRes.url) {
                    alert("Gagal mengupload gambar: " + uploadRes.error);
                    return;
                }

                // 2. Create Project
                const res = await createClientProject({
                    projectName,
                    clientName,
                    location,
                    image: uploadRes.url
                });

                if (res.success) {
                    setProjectName("");
                    setClientName("");
                    setLocation("");
                    setImageFile(null);
                    setImagePreview("");
                    if (fileInputRef.current) fileInputRef.current.value = "";
                    router.refresh();
                } else {
                    alert("Gagal membuat portfolio: " + (res.error || "Kesalahan tidak diketahui"));
                }
            } catch (error: any) {
                console.error(error);
                alert("Terjadi kesalahan: " + error.message);
            }
        });
    };

    return (
        <div className="space-y-8">
            {/* Form */}
            <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
                <div className="flex items-center gap-2 border-b border-gray-200 pb-4 mb-4">
                    <Plus className="w-5 h-5 text-red-600" />
                    <h3 className="font-semibold text-gray-900">Tambah Portfolio Baru</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Nama Proyek <span className="text-red-500">*</span></label>
                            <Input
                                placeholder="Contoh: Proyek Apartemen PIK 2"
                                value={projectName} onChange={(e) => setProjectName(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Nama Perusahaan (Klien)</label>
                            <Input
                                placeholder="Contoh: PT. Agung Sedayu Group"
                                value={clientName} onChange={(e) => setClientName(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Lokasi Proyek</label>
                            <Input
                                placeholder="Contoh: Jakarta Utara"
                                value={location} onChange={(e) => setLocation(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <label className="text-sm font-medium text-gray-700">Gambar Proyek <span className="text-red-500">*</span></label>

                        <div
                            className={`border-2 border-dashed rounded-lg p-4 flex flex-col items-center justify-center text-center transition-colors aspect-[3/4] w-full max-w-[240px] relative overflow-hidden ${imagePreview ? 'border-red-200 bg-red-50/10' : 'border-gray-300 hover:border-red-400 hover:bg-gray-50'}`}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            {imagePreview ? (
                                <Image
                                    src={imagePreview}
                                    alt="Preview"
                                    fill
                                    className="object-cover"
                                />
                            ) : (
                                <div className="space-y-4 cursor-pointer">
                                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto text-gray-400">
                                        <Upload className="w-6 h-6" />
                                    </div>
                                    <div className="text-sm text-gray-500">
                                        <span className="font-semibold text-red-600">Klik upload</span>
                                    </div>
                                    <p className="text-xs text-gray-400">Format Portait (3:4)</p>
                                </div>
                            )}
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={handleFileChange}
                            />
                            {imagePreview && (
                                <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                                    <span className="text-white font-medium text-sm flex items-center gap-2">
                                        <ImageIcon className="w-4 h-4" /> Ganti
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex justify-end pt-2 border-t border-gray-100 mt-4">
                    <Button onClick={handleCreate} disabled={isCreating} className="bg-red-600 hover:bg-red-700">
                        {isCreating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                        Simpan Portfolio
                    </Button>
                </div>
            </div>

            {/* List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {initialClients.map((client) => (
                    <PortfolioItem key={client.id} client={client} />
                ))}
            </div>
        </div>
    );
}

function PortfolioItem({ client }: { client: ClientProject }) {
    const [isDeleting, startDelete] = useTransition();
    const router = useRouter();

    const handleDelete = () => {
        if (!confirm("Hapus portfolio ini?")) return;
        startDelete(async () => {
            await deleteClientProject(client.id);
            router.refresh();
        });
    };

    return (
        <Card className="overflow-hidden group relative flex flex-col h-full">
            <div className="aspect-[3/4] bg-gray-100 relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={client.image}
                    alt={client.projectName}
                    className="object-cover w-full h-full"
                    onError={(e) => (e.currentTarget.src = "https://placehold.co/600x400?text=No+Image")}
                />
                <Button
                    size="icon"
                    variant="destructive"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={handleDelete}
                    disabled={isDeleting}
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>
            <CardContent className="p-4 space-y-2">
                <h4 className="font-bold text-gray-900 truncate" title={client.projectName}>{client.projectName}</h4>
                <div className="text-sm text-gray-500 space-y-1">
                    <div className="flex items-center gap-2">
                        <Building className="h-3 w-3" />
                        <span className="truncate">{client.clientName || "-"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <MapPin className="h-3 w-3" />
                        <span className="truncate">{client.location || "-"}</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
