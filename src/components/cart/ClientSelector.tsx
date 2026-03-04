"use client";

import { useState, useEffect } from "react";
import { Plus, Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getUserClients, createUserClient, UserClientData } from "@/app/actions/client";

interface Client {
    id: string;
    name: string;
    company?: string | null;
}

interface ClientSelectorProps {
    onSelect: (clientId: string | undefined) => void;
    selectedClientId?: string;
}

export default function ClientSelector({ onSelect, selectedClientId }: ClientSelectorProps) {
    const [clients, setClients] = useState<Client[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // New client form state
    const [newClient, setNewClient] = useState<UserClientData>({
        name: "",
        company: "",
        email: "",
        phone: "",
        address: ""
    });

    useEffect(() => {
        loadClients();
    }, []);

    const loadClients = async () => {
        setIsLoading(true);
        const res = await getUserClients();
        if (res.success && res.data) {
            setClients(res.data);
        }
        setIsLoading(false);
    };

    const handleCreateClient = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        const res = await createUserClient(newClient);

        setIsSubmitting(false);

        if (res.success && res.data) {
            setClients(prev => [...prev, res.data!].sort((a, b) => a.name.localeCompare(b.name)));
            onSelect(res.data.id);
            setIsDialogOpen(false);
            setNewClient({ name: "", company: "", email: "", phone: "", address: "" });
        } else {
            alert(res.error || "Gagal membuat customer");
        }
    };

    if (isLoading) {
        return <div className="h-10 w-full animate-pulse bg-gray-100 rounded-md" />;
    }

    return (
        <div className="space-y-2">
            <Label>Pilih Customer (Opsional)</Label>
            <div className="flex gap-2">
                <Select
                    value={selectedClientId || "none"}
                    onValueChange={(val) => onSelect(val === "none" ? undefined : val)}
                >
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder="Pilih customer..." />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="none">-- Tidak Ada / Diri Sendiri --</SelectItem>
                        {clients.map((client) => (
                            <SelectItem key={client.id} value={client.id}>
                                {client.name} {client.company ? `(${client.company})` : ""}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button variant="outline" size="icon" title="Tambah Customer Baru">
                            <Plus className="h-4 w-4" />
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Tambah Customer Baru</DialogTitle>
                            <DialogDescription>
                                Masukkan data customer untuk disimpan dalam daftar Anda.
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleCreateClient} className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Nama Customer *</Label>
                                <Input
                                    id="name"
                                    value={newClient.name}
                                    onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                                    placeholder="Nama lengkap"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="company">Perusahaan</Label>
                                <Input
                                    id="company"
                                    value={newClient.company || ""}
                                    onChange={(e) => setNewClient({ ...newClient, company: e.target.value })}
                                    placeholder="PT..."
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={newClient.email || ""}
                                        onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                                        placeholder="email@example.com"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone">No. HP</Label>
                                    <Input
                                        id="phone"
                                        value={newClient.phone || ""}
                                        onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
                                        placeholder="08..."
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="address">Alamat</Label>
                                <Input
                                    id="address"
                                    value={newClient.address || ""}
                                    onChange={(e) => setNewClient({ ...newClient, address: e.target.value })}
                                    placeholder="Alamat lengkap"
                                />
                            </div>

                            <DialogFooter>
                                <Button type="submit" disabled={isSubmitting}>
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Menyimpan...
                                        </>
                                    ) : (
                                        "Simpan Customer"
                                    )}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
            <p className="text-xs text-gray-500">
                Pilih customer untuk menyimpan estimasi penawaran atas nama mereka.
            </p>
        </div>
    );
}
