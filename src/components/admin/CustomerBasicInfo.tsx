
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, Mail, Phone, Upload, Briefcase, MapPin, Building2, UserCircle2, Power, ShieldCheck, Plus } from "lucide-react";
import { toast } from "sonner";
import { updateCustomerAvatarAction } from "@/app/actions/customer";
import { uploadFile } from "@/app/actions/upload";
import { useRouter } from "next/navigation";
import { CustomerAddressManager } from "./CustomerAddressManager";
import { ImageCropper } from "@/components/ui/image-cropper";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface CustomerBasicInfoProps {
    customer: {
        id: string;
        email: string | null;
        phone: string | null;
        address: string | null;
        businessCategory: string | null;
        type: string;
        addresses: any[];
        name: string;
        company: string | null;
        companyEmail?: string | null;
        companyPhone?: string | null;
        image: string | null;
        users?: any[];
    };
}

export function CustomerBasicInfo({ customer }: CustomerBasicInfoProps) {
    const [isUploading, setIsUploading] = useState(false);
    const [cropDialogOpen, setCropDialogOpen] = useState(false);
    const [selectedImageSrc, setSelectedImageSrc] = useState<string | null>(null);
    const router = useRouter();

    const initial = customer.name ? customer.name.charAt(0).toUpperCase() : "?";

    function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.addEventListener("load", () => {
            setSelectedImageSrc(reader.result?.toString() || null);
            setCropDialogOpen(true);
        });
        reader.readAsDataURL(file);
        e.target.value = "";
    }

    async function handleCropComplete(blob: Blob) {
        setIsUploading(true);
        setCropDialogOpen(false);
        const formData = new FormData();
        const file = new File([blob], "avatar.jpg", { type: "image/jpeg" });
        formData.append("file", file);

        try {
            const uploadRes = await uploadFile(formData, false, "assets");
            if (!uploadRes.success || !uploadRes.url) throw new Error(uploadRes.error || "Upload failed");
            const updateRes = await updateCustomerAvatarAction(customer.id, uploadRes.url);
            if (updateRes.error) throw new Error(updateRes.error);
            router.refresh();
        } catch (error: any) {
            console.error("Avatar Upload Error:", error);
        } finally {
            setIsUploading(false);
            setSelectedImageSrc(null);
        }
    }

    const infoRow = (icon: any, label: string, value: string | null, accent = false) => (
        <div className="flex items-center gap-3">
            <div className={cn(
                "w-7 h-7 rounded-lg flex items-center justify-center shrink-0",
                accent ? "bg-blue-50 text-blue-500" : "bg-gray-50 text-gray-400"
            )}>
                {icon}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none">{label}</p>
                <p className="text-xs font-bold text-gray-900 truncate mt-0.5">{value || "-"}</p>
            </div>
        </div>
    );

    return (
        <div className="space-y-4">
            <ImageCropper
                open={cropDialogOpen}
                onOpenChange={setCropDialogOpen}
                imageSrc={selectedImageSrc}
                onCropComplete={handleCropComplete}
                aspect={1}
            />

            <Card className="border border-gray-100 shadow-sm rounded-2xl overflow-hidden bg-white pt-0">
                {/* Profile Header */}
                <CardHeader className="p-5 bg-gray-100 border-b border-gray-200 flex flex-row items-center space-y-0">
                    <div className="flex items-center gap-4">
                        {/* Avatar */}
                        <div className="relative shrink-0">
                            <div className="w-16 h-16 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center text-2xl font-black text-gray-200 overflow-hidden group">
                                {customer.image ? (
                                    <img src={customer.image} alt={customer.name} className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-gray-200 italic">{initial}</span>
                                )}
                                {isUploading && (
                                    <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                                        <div className="w-5 h-5 border-2 border-red-500/20 border-t-red-600 rounded-full animate-spin" />
                                    </div>
                                )}
                            </div>
                            <label
                                htmlFor="avatar-upload-base"
                                className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-lg shadow-md flex items-center justify-center cursor-pointer border border-gray-100 hover:bg-red-50 transition-colors z-10"
                            >
                                <Upload className="w-3 h-3 text-red-600" />
                                <input id="avatar-upload-base" type="file" accept="image/*" className="hidden" onChange={handleFileSelect} disabled={isUploading} />
                            </label>
                        </div>
                        {/* Name & Type */}
                        <div className="flex-1 min-w-0">
                            <h2 className="text-base font-black text-gray-900 tracking-tight uppercase leading-tight truncate">
                                {customer.type === "BISNIS" && customer.company ? customer.company : customer.name}
                            </h2>
                            <div className="flex items-center gap-1.5 mt-1">
                                <Badge variant="outline" className={cn(
                                    "text-[9px] font-black border-none rounded-md px-2 py-0.5 uppercase",
                                    customer.type === "RESELLER" ? "bg-purple-600 text-white" :
                                        customer.type === "BISNIS" ? "bg-blue-600 text-white" :
                                            "bg-gray-900 text-white"
                                )}>
                                    {customer.type === "RESELLER" ? "RESELLER" :
                                        customer.type === "BISNIS" ? "PERUSAHAAN" :
                                            customer.type === "GeneralCustomer" ? "GENERAL" : "RETAIL"}
                                </Badge>
                            </div>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="px-5 pb-5 space-y-4">
                    {/* Identity Info */}
                    <div className="space-y-2">
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.15em] pl-1">Informasi {customer.type === "BISNIS" ? "PT" : "Pelanggan"}</p>
                        <div className={cn(
                            "rounded-xl p-4 space-y-3",
                            customer.type === "BISNIS" ? "bg-blue-50/40 border border-blue-100/50" : "bg-gray-50/50 border border-gray-100"
                        )}>
                            {customer.type === "BISNIS" ? (
                                <>
                                    {infoRow(<Building2 className="w-3.5 h-3.5" />, "Nama Perusahaan", customer.company, true)}
                                    {infoRow(<Mail className="w-3.5 h-3.5" />, "Email Kantor", customer.companyEmail || null, true)}
                                    {infoRow(<Phone className="w-3.5 h-3.5" />, "Telepon Kantor", customer.companyPhone || null, true)}
                                </>
                            ) : (
                                <>
                                    {infoRow(<UserCircle2 className="w-3.5 h-3.5" />, "Nama Pelanggan", customer.name)}
                                    {infoRow(<Mail className="w-3.5 h-3.5" />, "Email", customer.email)}
                                    {infoRow(<Phone className="w-3.5 h-3.5" />, "Telepon", customer.phone)}
                                    {customer.type === "RESELLER" && infoRow(<Briefcase className="w-3.5 h-3.5" />, "Kategori Reseller", customer.businessCategory)}
                                </>
                            )}
                        </div>
                    </div>

                    {/* Address Manager */}
                    <div className="border-t border-gray-100 pt-4">
                        <CustomerAddressManager
                            customerId={customer.id}
                            addresses={customer.addresses}
                            picName={customer.name}
                            picPhone={customer.phone}
                        />
                    </div>

                    {/* Security Control for non-BISNIS */}
                    {customer.type !== "BISNIS" && (
                        <div className="border-t border-gray-100 pt-4">
                            <div className="flex items-center gap-3 p-3 bg-red-50/40 rounded-xl border border-red-100/50">
                                <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center text-red-600 shrink-0">
                                    <Power className="w-3.5 h-3.5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[10px] font-black text-red-700 uppercase tracking-widest leading-none">Kontrol Keamanan</p>
                                    <p className="text-[9px] text-red-500 font-bold mt-0.5">Cabut izin akses login</p>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="border-red-200 bg-white text-red-600 hover:bg-red-600 hover:text-white rounded-lg h-8 px-3 font-black text-[9px] tracking-widest transition-all shrink-0"
                                    onClick={() => {
                                        toast("Membuka Manajemen Status Akses...", {
                                            icon: <ShieldCheck className="w-4 h-4 text-red-600" />
                                        });
                                    }}
                                >
                                    <Lock className="w-3 h-3 mr-1" /> Non-Aktif
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

const Lock = ({ className }: { className?: string }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
)
