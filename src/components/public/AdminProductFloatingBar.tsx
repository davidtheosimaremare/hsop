"use client";

import { useState, useTransition, useEffect } from "react";
import { Eye, EyeOff, Loader2, Pencil, ShieldAlert, X } from "lucide-react";
import { useAuth } from "@/components/auth/CanAccess";
import { toggleProductVisibility } from "@/app/actions/product";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import Link from "next/link";

interface AdminProductFloatingBarProps {
    productId: string;
    productSku: string;
    isVisible: boolean;
}

export default function AdminProductFloatingBar({
    productId,
    productSku,
    isVisible,
}: AdminProductFloatingBarProps) {
    const { user, isLoading } = useAuth();
    const [currentlyVisible, setCurrentlyVisible] = useState(isVisible);
    const [isPending, startTransition] = useTransition();
    const [alertOpen, setAlertOpen] = useState(false);
    const [dismissed, setDismissed] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Only show for ADMIN or SUPER_ADMIN
    const isAdmin = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";

    if (!mounted || isLoading || !isAdmin || dismissed) return null;

    const handleConfirm = () => {
        startTransition(async () => {
            await toggleProductVisibility(productId, !currentlyVisible);
            setCurrentlyVisible((v) => !v);
            setAlertOpen(false);
        });
    };

    return (
        <>
            {/* Floating Bar */}
            <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
                {/* Label badge */}
                <div className="flex items-center gap-1.5 bg-gray-900/80 backdrop-blur-sm text-white text-[11px] font-medium px-3 py-1 rounded-full">
                    <ShieldAlert className="w-3 h-3 text-yellow-400" />
                    Mode Admin
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-2 bg-white border border-gray-200 shadow-2xl rounded-2xl px-3 py-2.5">
                    {/* Visibility Toggle */}
                    <button
                        onClick={() => setAlertOpen(true)}
                        disabled={isPending}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all disabled:opacity-50 ${currentlyVisible
                                ? "bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"
                                : "bg-green-50 text-green-700 hover:bg-green-100 border border-green-200"
                            }`}
                    >
                        {isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : currentlyVisible ? (
                            <EyeOff className="w-4 h-4" />
                        ) : (
                            <Eye className="w-4 h-4" />
                        )}
                        {isPending
                            ? "Memproses..."
                            : currentlyVisible
                                ? "Sembunyikan Produk"
                                : "Tampilkan Produk"}
                    </button>

                    {/* Divider */}
                    <div className="w-px h-6 bg-gray-200" />

                    {/* Edit Link */}
                    <Link
                        href={`/admin/products/${productId}`}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200 transition-all"
                    >
                        <Pencil className="w-4 h-4" />
                        Edit Produk
                    </Link>

                    {/* Dismiss */}
                    <button
                        onClick={() => setDismissed(true)}
                        className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                        title="Tutup"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Visibility status indicator */}
                <div className={`flex items-center gap-1.5 text-[11px] font-medium px-3 py-1 rounded-full ${currentlyVisible
                        ? "bg-green-50 text-green-700 border border-green-200"
                        : "bg-red-50 text-red-600 border border-red-200"
                    }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${currentlyVisible ? "bg-green-500" : "bg-red-500"}`} />
                    {currentlyVisible ? "Produk Ditampilkan" : "Produk Disembunyikan"}
                </div>
            </div>

            {/* Alert Dialog */}
            <AlertDialog open={alertOpen} onOpenChange={setAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {currentlyVisible ? "Sembunyikan Produk ini?" : "Tampilkan Produk ini?"}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {currentlyVisible
                                ? `Produk "${productSku}" akan disembunyikan dari hasil pencarian dan halaman depan website. Pengunjung tidak akan bisa melihat produk ini.`
                                : `Produk "${productSku}" akan ditampilkan kembali di website dan dapat dilihat oleh pengunjung.`}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isPending}>Batal</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault();
                                handleConfirm();
                            }}
                            disabled={isPending}
                            className={currentlyVisible ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}
                        >
                            {isPending
                                ? "Memproses..."
                                : currentlyVisible
                                    ? "Ya, Sembunyikan"
                                    : "Ya, Tampilkan"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
