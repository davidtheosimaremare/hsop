"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addSearchSuggestion, deleteSearchSuggestion } from "@/app/actions/settings";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface SearchSettingActionsProps {
    id?: string;
    action: "create" | "delete";
}

export function SearchSettingActions({ id, action }: SearchSettingActionsProps) {
    const [term, setTerm] = useState("");
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const handleCreate = () => {
        if (!term) return;
        startTransition(async () => {
            const res = await addSearchSuggestion(term);
            if (res.success) {
                setTerm("");
                router.refresh(); // Refresh without full reload
            } else {
                alert("Gagal menambahkan kata kunci.");
            }
        });
    };

    const handleDelete = () => {
        if (!id) return;
        if (!confirm("Hapus kata kunci ini?")) return;
        startTransition(async () => {
            const res = await deleteSearchSuggestion(id);
            if (res.success) {
                router.refresh();
            } else {
                alert("Gagal menghapus kata kunci.");
            }
        });
    };

    if (action === "create") {
        return (
            <div className="flex gap-2">
                <Input
                    placeholder="Contoh: Lampu LED"
                    value={term}
                    onChange={(e) => setTerm(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                />
                <Button onClick={handleCreate} disabled={isPending || !term}>
                    {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                </Button>
            </div>
        );
    }

    if (action === "delete") {
        return (
            <Button variant="ghost" size="icon" onClick={handleDelete} disabled={isPending} className="text-red-500 hover:text-red-700 hover:bg-red-50">
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            </Button>
        );
    }

    return null;
}
