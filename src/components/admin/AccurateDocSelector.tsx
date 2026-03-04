"use client";

import { useState, useEffect } from "react";
import { Check, ChevronsUpDown, Search, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { getAccurateDocuments } from "@/app/actions/accurate-docs";
import type { AccurateDocument } from "@/lib/accurate";

interface AccurateDocSelectorProps {
    type: "HSQ" | "HSO" | "DO";
    value?: { id: number; no: string };
    onSelect: (doc: { id: number; no: string } | null) => void;
    disabled?: boolean;
}

export function AccurateDocSelector({ type, value, onSelect, disabled }: AccurateDocSelectorProps) {
    const [open, setOpen] = useState(false);
    const [allDocs, setAllDocs] = useState<AccurateDocument[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        if (open && !loaded) {
            loadAllDocs();
        }
    }, [open]);

    const loadAllDocs = async () => {
        setLoading(true);
        try {
            const results = await getAccurateDocuments(type);
            setAllDocs(results);
            setLoaded(true);
        } catch (error) {
            console.error("Failed to fetch accurate docs", error);
        } finally {
            setLoading(false);
        }
    };

    // Client-side filter
    const filteredDocs = search
        ? allDocs.filter(doc =>
            doc.no?.toLowerCase().includes(search.toLowerCase()) ||
            doc.customer?.name?.toLowerCase().includes(search.toLowerCase()) ||
            doc.date?.includes(search)
        )
        : allDocs;

    return (
        <div className="flex flex-col gap-2">
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className="w-full justify-between"
                        disabled={disabled}
                    >
                        {value?.no ? (
                            <span className="font-mono">{value.no}</span>
                        ) : (
                            <span className="text-gray-400">Pilih {type === "HSQ" ? "HRSQ" : type} dari Accurate...</span>
                        )}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0">
                    <Command shouldFilter={false}>
                        <CommandInput
                            placeholder={`Cari nomor ${type === "HSQ" ? "HRSQ" : type}, nama customer...`}
                            onValueChange={(val) => {
                                setSearch(val);
                            }}
                        />
                        <CommandList>
                            {loading && (
                                <div className="py-6 text-center text-sm text-gray-500">
                                    <Loader2 className="w-4 h-4 animate-spin mx-auto mb-2" />
                                    Memuat data dari Accurate...
                                </div>
                            )}
                            {!loading && filteredDocs.length === 0 && (
                                <CommandEmpty>Tidak ditemukan.</CommandEmpty>
                            )}
                            {!loading && filteredDocs.map((doc) => (
                                <CommandItem
                                    key={doc.id}
                                    value={doc.no}
                                    onSelect={() => {
                                        onSelect({ id: doc.id, no: doc.no });
                                        setOpen(false);
                                    }}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            value?.id === doc.id ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    <div className="flex flex-col">
                                        <span className="font-medium font-mono">{doc.no}</span>
                                        <span className="text-xs text-gray-500">
                                            {doc.date} · {doc.customer?.name} · Rp {doc.totalAmount?.toLocaleString('id-ID')}
                                        </span>
                                    </div>
                                </CommandItem>
                            ))}
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
            {value && (
                <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1.5 rounded-md border border-blue-100 flex items-center gap-2">
                    <Check className="w-3 h-3" />
                    Terhubung: <span className="font-mono font-semibold">{value.no}</span>
                </div>
            )}
        </div>
    );
}
