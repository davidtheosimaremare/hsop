"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, Mail, Phone, Users, Upload } from "lucide-react";
import { updateCustomerAvatarAction } from "@/app/actions/customer";
import { uploadFile } from "@/app/actions/upload";
import { useRouter } from "next/navigation";
import { CustomerAddressManager } from "./CustomerAddressManager";

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
        image: string | null;
    };
}
import { ImageCropper } from "@/components/ui/image-cropper";

export function CustomerBasicInfo({ customer }: CustomerBasicInfoProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    // Cropper State
    const [cropDialogOpen, setCropDialogOpen] = useState(false);
    const [selectedImageSrc, setSelectedImageSrc] = useState<string | null>(null);

    const router = useRouter();

    // Deterministic color based on name
    const colors = [
        "bg-red-500", "bg-orange-500", "bg-amber-500", "bg-yellow-500", "bg-lime-500",
        "bg-green-500", "bg-emerald-500", "bg-teal-500", "bg-cyan-500", "bg-sky-500",
        "bg-blue-500", "bg-indigo-500", "bg-violet-500", "bg-purple-500", "bg-fuchsia-500",
        "bg-pink-500", "bg-rose-500"
    ];
    const initial = customer.name ? customer.name.charAt(0).toUpperCase() : "?";
    const charCode = customer.name ? customer.name.charCodeAt(0) : 0;
    const colorClass = colors[charCode % colors.length];

    function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        // Read file as Data URL for Cropper
        const reader = new FileReader();
        reader.addEventListener("load", () => {
            setSelectedImageSrc(reader.result?.toString() || null);
            setCropDialogOpen(true);
        });
        reader.readAsDataURL(file);

        // Reset input value so same file can be selected again if needed
        e.target.value = "";
    }

    async function handleCropComplete(blob: Blob) {
        setIsUploading(true);
        setCropDialogOpen(false); // Close dialog immediately or keep open? Usually close.

        const formData = new FormData();
        // Convert blob to file
        const file = new File([blob], "avatar.jpg", { type: "image/jpeg" });
        formData.append("file", file);

        try {
            // 1. Upload File
            const uploadRes = await uploadFile(formData);
            if (!uploadRes.success || !uploadRes.url) {
                throw new Error(uploadRes.error || "Upload failed");
            }

            // 2. Update Customer Record
            const updateRes = await updateCustomerAvatarAction(customer.id, uploadRes.url);
            if (updateRes.error) {
                throw new Error(updateRes.error);
            }

            router.refresh();
        } catch (error: any) {
            console.error("Avatar Upload Error:", error);
            alert(`Gagal upload: ${error.message}`);
        } finally {
            setIsUploading(false);
            setSelectedImageSrc(null);
        }
    }

    return (
        <>
            <ImageCropper
                open={cropDialogOpen}
                onOpenChange={setCropDialogOpen}
                imageSrc={selectedImageSrc}
                onCropComplete={handleCropComplete}
                aspect={1}
            />

            <Card>
                <CardHeader className="pb-4">
                    <CardTitle className="flex items-center justify-between gap-2 text-base font-semibold">
                        <div className="flex items-center gap-2">
                            <User className="h-5 w-5" /> Informasi Dasar
                        </div>
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Avatar Section */}
                    <div className="flex flex-col items-center justify-center gap-3">
                        <div className="relative group">
                            <div className={`h-24 w-24 rounded-full flex items-center justify-center text-3xl font-bold text-white overflow-hidden border-4 border-white shadow-sm ${!customer.image ? colorClass : ""}`}>
                                {customer.image ? (
                                    <img
                                        src={customer.image}
                                        alt={customer.name || "Avatar"}
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <span>{initial}</span>
                                )}
                            </div>

                            {/* Upload Overlay/Button */}
                            <label
                                htmlFor="avatar-upload"
                                className="absolute bottom-0 right-0 p-1.5 bg-white rounded-full shadow-md border border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors"
                                title="Ubah Foto"
                            >
                                <Upload className="h-4 w-4 text-gray-600" />
                                <input
                                    id="avatar-upload"
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleFileSelect}
                                    disabled={isUploading}
                                />
                            </label>
                            {isUploading && (
                                <div className="absolute inset-0 bg-black/20 rounded-full flex items-center justify-center">
                                    <span className="animate-spin text-white">⌛</span>
                                </div>
                            )}
                        </div>
                        <div className="text-center">
                            <h3 className="font-semibold text-lg text-gray-900">{customer.name}</h3>
                            <p className="text-sm text-gray-500">{customer.company || "Personal"}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-2 text-sm border-t pt-4">
                        <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                            <div className="flex items-center gap-2 text-gray-500">
                                <Mail className="h-4 w-4" /> Email
                            </div>
                            <p className="font-medium text-gray-900">{customer.email || "-"}</p>
                        </div>
                        <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                            <div className="flex items-center gap-2 text-gray-500">
                                <Phone className="h-4 w-4" /> Telepon
                            </div>
                            <p className="font-medium text-gray-900">{customer.phone || "-"}</p>
                        </div>

                        {(customer.type === "BISNIS" || customer.type === "B2B") && (
                            <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                                <div className="flex items-center gap-2 text-gray-500">
                                    <Users className="h-4 w-4" /> Kategori
                                </div>
                                <p className="font-medium text-gray-900">{customer.businessCategory || "-"}</p>
                            </div>
                        )}
                    </div>

                    <CustomerAddressManager
                        customerId={customer.id}
                        addresses={customer.addresses}
                    />
                </CardContent>
            </Card>
        </>
    );
}
