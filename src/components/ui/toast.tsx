"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, AlertCircle, X } from "lucide-react";

interface ToastProps {
    message: string;
    type: "success" | "error" | "info";
    onClose: () => void;
}

export function Toast({ message, type, onClose }: ToastProps) {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 5000);
        return () => clearTimeout(timer);
    }, [onClose]);

    const icons = {
        success: <CheckCircle2 className="w-5 h-5 text-green-600" />,
        error: <AlertCircle className="w-5 h-5 text-red-600" />,
        info: <AlertCircle className="w-5 h-5 text-blue-600" />
    };

    const bgColors = {
        success: "bg-green-50 border-green-200",
        error: "bg-red-50 border-red-200",
        info: "bg-blue-50 border-blue-200"
    };

    const textColors = {
        success: "text-green-800",
        error: "text-red-800",
        info: "text-blue-800"
    };

    return (
        <div className={`flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg ${bgColors[type]} animate-in slide-in-from-top-2 fade-in duration-300`}>
            {icons[type]}
            <p className={`text-sm font-medium ${textColors[type]}`}>{message}</p>
            <button
                onClick={onClose}
                className="ml-auto text-gray-400 hover:text-gray-600 transition-colors"
            >
                <X className="w-4 h-4" />
            </button>
        </div>
    );
}

interface ToastManagerProps {
    toasts: { id: string; message: string; type: "success" | "error" | "info" }[];
    removeToast: (id: string) => void;
}

export function ToastManager({ toasts, removeToast }: ToastManagerProps) {
    return (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 w-full max-w-md px-4">
            {toasts.map((toast) => (
                <Toast
                    key={toast.id}
                    message={toast.message}
                    type={toast.type}
                    onClose={() => removeToast(toast.id)}
                />
            ))}
        </div>
    );
}

// Hook untuk menggunakan toast
export function useToast() {
    const [toasts, setToasts] = useState<{ id: string; message: string; type: "success" | "error" | "info" }[]>([]);

    const addToast = (message: string, type: "success" | "error" | "info" = "info") => {
        const id = Math.random().toString(36).substring(7);
        setToasts((prev) => [...prev, { id, message, type }]);
    };

    const removeToast = (id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    };

    const toast = {
        success: (message: string) => addToast(message, "success"),
        error: (message: string) => addToast(message, "error"),
        info: (message: string) => addToast(message, "info"),
    };

    return { toasts, addToast, removeToast, toast };
}
