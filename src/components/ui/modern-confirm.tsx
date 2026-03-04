"use client";

import * as React from "react";
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
import { AlertTriangle, Loader2, Info, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModernConfirmProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description: string;
    onConfirm: () => void;
    isLoading?: boolean;
    confirmText?: string;
    cancelText?: string;
    variant?: "destructive" | "default" | "success";
}

export function ModernConfirm({
    open,
    onOpenChange,
    title,
    description,
    onConfirm,
    isLoading = false,
    confirmText = "Ya, Lanjutkan",
    cancelText = "Batal",
    variant = "destructive"
}: ModernConfirmProps) {
    const iconMap = {
        destructive: <AlertTriangle className="w-6 h-6 text-red-600" />,
        default: <Info className="w-6 h-6 text-blue-600" />,
        success: <CheckCircle2 className="w-6 h-6 text-emerald-600" />,
    };

    const bgMap = {
        destructive: "bg-red-50",
        default: "bg-blue-50",
        success: "bg-emerald-50",
    };

    const buttonMap = {
        destructive: "bg-red-600 hover:bg-red-700 shadow-red-100",
        default: "bg-blue-600 hover:bg-blue-700 shadow-blue-100",
        success: "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100",
    };

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent className="max-w-md rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden bg-white">
                <div className="p-8">
                    <AlertDialogHeader>
                        <div className="flex items-center gap-4 mb-6">
                            <div className={cn("w-14 h-14 rounded-3xl flex items-center justify-center shrink-0 shadow-sm", bgMap[variant])}>
                                {iconMap[variant]}
                            </div>
                            <div className="space-y-1">
                                <AlertDialogTitle className="text-xl font-black uppercase italic tracking-tight text-gray-900 leading-none">
                                    {title}
                                </AlertDialogTitle>
                                <div className="h-1 w-12 bg-red-600 rounded-full" />
                            </div>
                        </div>
                        <AlertDialogDescription className="text-sm font-bold text-gray-500 italic leading-relaxed pl-1">
                            {description}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-10 gap-3 sm:flex-row-reverse">
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault();
                                onConfirm();
                            }}
                            disabled={isLoading}
                            className={cn(
                                "flex-1 rounded-2xl font-black h-14 shadow-2xl transition-all hover:scale-[1.02] active:scale-95 border-none text-white text-xs tracking-widest uppercase",
                                buttonMap[variant]
                            )}
                        >
                            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : confirmText}
                        </AlertDialogAction>
                        <AlertDialogCancel
                            disabled={isLoading}
                            className="flex-1 rounded-2xl font-black h-14 border-2 border-gray-100 text-gray-400 hover:bg-gray-50 hover:text-gray-900 transition-all active:scale-95 text-xs tracking-widest uppercase"
                        >
                            {cancelText}
                        </AlertDialogCancel>
                    </AlertDialogFooter>
                </div>
            </AlertDialogContent>
        </AlertDialog>
    );
}
