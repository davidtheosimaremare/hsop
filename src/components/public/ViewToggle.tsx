"use client";

import { useState, useEffect } from "react";
import { LayoutGrid, List } from "lucide-react";
import Cookies from "js-cookie";

export type ViewMode = "grid" | "list";

const VIEW_MODE_COOKIE = "hsop-product-view";

export function useViewMode(): [ViewMode, (mode: ViewMode) => void] {
    const [viewMode, setViewMode] = useState<ViewMode>("grid");

    useEffect(() => {
        const saved = Cookies.get(VIEW_MODE_COOKIE) as ViewMode;
        if (saved === "grid" || saved === "list") {
            setViewMode(saved);
        }
    }, []);

    const setMode = (mode: ViewMode) => {
        setViewMode(mode);
        Cookies.set(VIEW_MODE_COOKIE, mode, { expires: 365 });
    };

    return [viewMode, setMode];
}

interface ViewToggleProps {
    viewMode: ViewMode;
    onViewChange: (mode: ViewMode) => void;
}

export default function ViewToggle({ viewMode, onViewChange }: ViewToggleProps) {
    return (
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            <button
                onClick={() => onViewChange("grid")}
                className={`p-1.5 rounded-md transition-colors ${viewMode === "grid"
                        ? "bg-white text-red-600 shadow-sm"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                title="Grid View"
            >
                <LayoutGrid className="w-4 h-4" />
            </button>
            <button
                onClick={() => onViewChange("list")}
                className={`p-1.5 rounded-md transition-colors ${viewMode === "list"
                        ? "bg-white text-red-600 shadow-sm"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                title="List View"
            >
                <List className="w-4 h-4" />
            </button>
        </div>
    );
}
