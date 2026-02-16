"use client";

import { useState } from "react";
import { ChevronRight, Zap, Box, Wrench, Lightbulb, Cable, Gauge } from "lucide-react";

type CategoryType = "low-voltage" | "control" | "lighting" | "cable" | "panel" | "instrument";

const mainCategories = [
    { id: "low-voltage" as CategoryType, name: "Low Voltage Product Siemens", icon: Zap },
    { id: "control" as CategoryType, name: "Control Product Siemens", icon: Gauge },
    { id: "lighting" as CategoryType, name: "Portable Lighting", icon: Lightbulb },
    { id: "cable" as CategoryType, name: "Cable & Wiring", icon: Cable },
    { id: "panel" as CategoryType, name: "Panel & Enclosure", icon: Box },
    { id: "instrument" as CategoryType, name: "Instrument & Tools", icon: Wrench },
];

const subcategories: Record<CategoryType, Array<{
    name: string;
    items: string[];
}>> = {
    "low-voltage": [
        { name: "Circuit Breaker", items: ["Air Circuit Breaker (ACB)", "MCCB", "MCB", "RCCB", "RCBO"] },
        { name: "Surge Protection", items: ["SPD Type 1", "SPD Type 2", "SPD Type 3", "Combo SPD"] },
        { name: "Fuse & Holder", items: ["HRC Fuse", "Fuse Holder", "Switch Disconnector", "Fuse Link"] },
        { name: "Busbar System", items: ["Busbar Trunking", "Busbar Support", "Busbar Connector", "Shroud"] },
    ],
    "control": [
        { name: "Contactor", items: ["AC Contactor", "DC Contactor", "Capacitor Contactor", "Mini Contactor"] },
        { name: "Motor Starter", items: ["DOL Starter", "Star Delta", "Soft Starter", "VFD"] },
        { name: "Relay", items: ["Thermal Overload Relay", "Timer Relay", "Safety Relay", "Control Relay"] },
        { name: "Push Button", items: ["Push Button", "Selector Switch", "Pilot Lamp", "Emergency Stop"] },
    ],
    "lighting": [
        { name: "Indoor Lighting", items: ["LED Panel", "LED Downlight", "LED Tube", "LED Bulb"] },
        { name: "Outdoor Lighting", items: ["LED Floodlight", "LED Street Light", "LED High Bay", "LED Post Top"] },
        { name: "Emergency Light", items: ["Emergency Exit", "Emergency Downlight", "Central Battery", "Self-Contained"] },
        { name: "Explosion Proof", items: ["Exd Light", "Exd Floodlight", "Exd Pendant", "Hazardous Area"] },
    ],
    "cable": [
        { name: "Power Cable", items: ["NYY", "NYA", "NYM", "N2XSY", "NYFGBY"] },
        { name: "Control Cable", items: ["NYCY", "NYCWY", "Instrumentation", "Multi-core"] },
        { name: "Cable Accessories", items: ["Cable Gland", "Cable Lug", "Heat Shrink", "Cable Tie"] },
        { name: "Cable Tray", items: ["Ladder Tray", "Perforated Tray", "Wire Mesh", "Trunking"] },
    ],
    "panel": [
        { name: "Distribution Board", items: ["Main Panel", "Sub Panel", "DB Box", "Consumer Unit"] },
        { name: "Enclosure", items: ["Metal Enclosure", "Plastic Enclosure", "Stainless Steel", "Floor Standing"] },
        { name: "Accessories", items: ["Din Rail", "Terminal Block", "Cable Duct", "Mounting Plate"] },
        { name: "Cooling", items: ["Panel Fan", "Filter Fan", "Air Conditioner", "Thermostat"] },
    ],
    "instrument": [
        { name: "Measuring", items: ["Multimeter", "Clamp Meter", "Megger", "Earth Tester"] },
        { name: "Hand Tools", items: ["Screwdriver Set", "Plier Set", "Crimping Tool", "Wire Stripper"] },
        { name: "Power Tools", items: ["Drill", "Grinder", "Impact Driver", "Heat Gun"] },
        { name: "Safety Equipment", items: ["Safety Helmet", "Safety Gloves", "Safety Shoes", "Voltage Detector"] },
    ],
};

export default function KategoriPage() {
    const [activeCategory, setActiveCategory] = useState<CategoryType>("low-voltage");

    const currentCategory = mainCategories.find(c => c.id === activeCategory);
    const currentSubcategories = subcategories[activeCategory];

    return (

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {/* Breadcrumb */}
            <nav className="text-sm mb-6">
                <ol className="flex items-center gap-2">
                    <li><a href="/" className="text-gray-500 hover:text-red-600">Beranda</a></li>
                    <li className="text-gray-400">›</li>
                    <li className="text-red-600 font-medium">Daftar Kategori</li>
                </ol>
            </nav>

            <div className="flex flex-col lg:flex-row gap-6">
                {/* Left Sidebar - Main Categories */}
                <aside className="lg:w-48 flex-shrink-0">
                    <div className="bg-white rounded-xl border border-gray-200 p-3">
                        <div className="space-y-1">
                            {mainCategories.map((category) => (
                                <button
                                    key={category.id}
                                    onClick={() => setActiveCategory(category.id)}
                                    className={`w-full flex flex-col items-center text-center p-3 rounded-xl transition-colors ${activeCategory === category.id
                                        ? "bg-red-50 text-red-600 border border-red-200"
                                        : "text-gray-600 hover:bg-gray-50"
                                        }`}
                                >
                                    <category.icon className="w-8 h-8 mb-2" />
                                    <span className="text-xs font-medium leading-tight">{category.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </aside>

                {/* Main Content - Subcategories */}
                <div className="flex-1">
                    {/* Category Title */}
                    <h1 className="text-2xl font-bold text-gray-900 mb-6">
                        {currentCategory?.name}
                    </h1>

                    {/* Subcategories Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {currentSubcategories.map((subcat) => (
                            <div
                                key={subcat.name}
                                className="bg-white rounded-xl border border-gray-200 overflow-hidden"
                            >
                                {/* Subcategory Header */}
                                <a
                                    href="#"
                                    className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors border-b border-gray-100"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                                            <div className="w-6 h-6 bg-gray-200 rounded" />
                                        </div>
                                        <span className="font-semibold text-gray-900">{subcat.name}</span>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-gray-400" />
                                </a>

                                {/* Items Grid */}
                                <div className="p-4">
                                    <div className="grid grid-cols-3 gap-2">
                                        {subcat.items.map((item) => (
                                            <a
                                                key={item}
                                                href={`/pencarian?q=${encodeURIComponent(item)}`}
                                                className="text-sm text-gray-600 hover:text-red-600 transition-colors"
                                            >
                                                {item}
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
