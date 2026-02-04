"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { createClientProject, deleteClientProject } from "@/app/actions/settings";
import { Loader2, Plus, Trash2, MapPin, Building, Image as ImageIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

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
    const [image, setImage] = useState("");

    const [isCreating, startCreate] = useTransition();
    const router = useRouter();

    const handleCreate = () => {
        if (!projectName || !image) {
            alert("Nama proyek dan gambar wajib diisi.");
            return;
        }
        startCreate(async () => {
            const res = await createClientProject({ projectName, clientName, location, image });
            if (res.success) {
                setProjectName("");
                setClientName("");
                setLocation("");
                setImage("");
                router.refresh();
            } else {
                alert("Gagal membuat portfolio.");
            }
        });
    };

    return (
        <div className="space-y-8">
            {/* Form */}
            <div className="bg-gray-50 p-4 rounded-lg border space-y-4">
                <h3 className="font-semibold text-sm text-gray-700">Tambah Portfolio Baru</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                        placeholder="Nama Proyek (Wajib)"
                        value={projectName} onChange={(e) => setProjectName(e.target.value)}
                    />
                    <Input
                        placeholder="Nama Klien / Perusahaan"
                        value={clientName} onChange={(e) => setClientName(e.target.value)}
                    />
                    <Input
                        placeholder="Lokasi (Kota/Daerah)"
                        value={location} onChange={(e) => setLocation(e.target.value)}
                    />
                    <div className="flex gap-2">
                        <Input
                            placeholder="URL Gambar Logo / Foto Proyek (Wajib)"
                            value={image} onChange={(e) => setImage(e.target.value)}
                        />
                    </div>
                </div>
                <div className="flex justify-end">
                    <Button onClick={handleCreate} disabled={isCreating}>
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
        <Card className="overflow-hidden group relative">
            <div className="aspect-video bg-gray-100 relative">
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
