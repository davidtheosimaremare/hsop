"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { 
    Save, 
    RotateCcw, 
    ShieldCheck, 
    Users, 
    Package, 
    ShoppingCart, 
    FileText, 
    Settings, 
    TrendingUp,
    ShieldAlert,
    CheckSquare,
    Square,
    Loader2,
    Lock
} from "lucide-react";
import { UserRole, roleInfo, allPermissions, permissionCategories, type Permission } from "@/lib/rbac";
import { cn } from "@/lib/utils";

const roles: UserRole[] = ["SUPER_ADMIN", "ADMIN", "MANAGER", "STAFF", "VIEWER"];

export default function RolesPermissionsPage() {
    const [selectedRole, setSelectedRole] = useState<UserRole>("ADMIN");
    const [permissions, setPermissions] = useState<Record<string, string[]>>({});
    const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchPermissions();
    }, []);

    async function fetchPermissions() {
        try {
            const response = await fetch("/api/admin/roles/permissions");
            if (response.ok) {
                const data = await response.json();
                setPermissions(data.permissions);
                if (Object.keys(data.permissions).length === 0) {
                    const defaultPermissions: Record<string, string[]> = {};
                    roles.forEach(role => { defaultPermissions[role] = []; });
                    setPermissions(defaultPermissions);
                }
            }
        } catch (error) {
            console.error("Failed to fetch permissions:", error);
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        if (permissions[selectedRole]) {
            setSelectedPermissions(permissions[selectedRole]);
        }
    }, [selectedRole, permissions]);

    async function savePermissions() {
        setIsSaving(true);
        try {
            const response = await fetch("/api/admin/roles/permissions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    role: selectedRole,
                    permissions: selectedPermissions,
                }),
            });

            if (response.ok) {
                toast.success(`Akses ${roleInfo[selectedRole].label} berhasil disimpan`);
                fetchPermissions();
            } else {
                toast.error("Gagal menyimpan perubahan");
            }
        } catch (error) {
            toast.error("Terjadi kesalahan sistem");
        } finally {
            setIsSaving(false);
        }
    }

    function togglePermission(permission: string) {
        if (selectedRole === "SUPER_ADMIN") return; // Super admin has everything
        setSelectedPermissions(prev =>
            prev.includes(permission)
                ? prev.filter(p => p !== permission)
                : [...prev, permission]
        );
    }

    function toggleCategory(categoryId: string) {
        if (selectedRole === "SUPER_ADMIN") return;
        const categoryPerms = allPermissions.filter(p => p.startsWith(categoryId)) as Permission[];
        const allSelected = categoryPerms.every(p => selectedPermissions.includes(p));

        if (allSelected) {
            setSelectedPermissions(prev => prev.filter(p => !categoryPerms.includes(p as Permission)));
        } else {
            setSelectedPermissions(prev => [...prev, ...categoryPerms.filter(p => !prev.includes(p))]);
        }
    }

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-red-600" />
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Memuat Hak Akses...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-10">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <ShieldAlert className="w-7 h-7 text-red-600" />
                        Hak Akses & Peran
                    </h1>
                    <p className="text-sm text-slate-500 font-medium ml-10">Kustomisasi tingkat izin untuk setiap grup pengguna sistem.</p>
                </div>
                
                <Button 
                    onClick={savePermissions} 
                    disabled={isSaving || selectedRole === "SUPER_ADMIN"}
                    className="h-12 px-8 bg-red-600 hover:bg-red-700 text-white font-black rounded-2xl shadow-lg shadow-red-500/20 transition-all gap-2 shrink-0"
                >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    SIMPAN AKSES {roleInfo[selectedRole].label.toUpperCase()}
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Left Sidebar: Role Selector */}
                <div className="lg:col-span-4 space-y-4 lg:sticky lg:top-24">
                    <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
                        <CardHeader className="bg-slate-50/80 border-b border-slate-100 p-6">
                            <CardTitle className="text-xs font-black text-slate-400 uppercase tracking-widest">Pilih Role</CardTitle>
                        </CardHeader>
                        <CardContent className="p-3 space-y-1">
                            {roles.map((role) => {
                                const info = roleInfo[role];
                                const isActive = selectedRole === role;
                                return (
                                    <button
                                        key={role}
                                        onClick={() => setSelectedRole(role)}
                                        className={cn(
                                            "w-full flex items-center gap-4 p-4 rounded-2xl transition-all group text-left",
                                            isActive 
                                                ? "bg-red-50 ring-1 ring-red-100" 
                                                : "hover:bg-slate-50"
                                        )}
                                    >
                                        <div className={cn(
                                            "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110",
                                            isActive ? "bg-red-600 text-white shadow-md shadow-red-200" : "bg-slate-100 text-slate-400"
                                        )}>
                                            <ShieldCheck className="w-5 h-5" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className={cn("text-sm font-black uppercase tracking-tight", isActive ? "text-red-700" : "text-slate-700")}>
                                                {info.label}
                                            </p>
                                            <p className="text-[10px] font-bold text-slate-400 truncate uppercase mt-0.5">{info.description}</p>
                                        </div>
                                    </button>
                                );
                            })}
                        </CardContent>
                    </Card>

                    {/* Stats Card */}
                    <div className="bg-slate-900 rounded-[2rem] p-6 text-white relative overflow-hidden shadow-xl">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                        <div className="relative z-10 space-y-1">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Status Izin Aktif</p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-4xl font-black text-white">{selectedPermissions.length}</span>
                                <span className="text-xs font-bold text-slate-500 uppercase">dari {allPermissions.length}</span>
                            </div>
                            <div className="pt-4 flex flex-col gap-2">
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => setSelectedPermissions(allPermissions)}
                                    disabled={selectedRole === "SUPER_ADMIN"}
                                    className="border-white/10 bg-white/5 hover:bg-white/10 text-white font-bold text-[10px] uppercase rounded-xl h-9"
                                >
                                    Pilih Semua
                                </Button>
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => setSelectedPermissions([])}
                                    disabled={selectedRole === "SUPER_ADMIN"}
                                    className="text-slate-400 hover:text-white font-bold text-[10px] uppercase h-9"
                                >
                                    Hapus Semua
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Compact Permissions Matrix */}
                <div className="lg:col-span-8 space-y-6">
                    {selectedRole === "SUPER_ADMIN" ? (
                        <Card className="border-none shadow-sm rounded-3xl bg-blue-50 border-2 border-blue-100 overflow-hidden">
                            <CardContent className="p-10 flex flex-col items-center text-center gap-4">
                                <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600">
                                    <Lock className="w-8 h-8" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-blue-900 uppercase tracking-tight">Super Admin Restricted</h3>
                                    <p className="text-sm font-bold text-blue-700/70 max-w-sm mt-1">
                                        Role ini memiliki akses penuh ke seluruh fitur sistem secara default dan tidak dapat dimodifikasi demi keamanan aplikasi.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        permissionCategories.map((category) => {
                            const categoryPerms = allPermissions.filter(p => p.startsWith(category.id));
                            const selectedInCategory = categoryPerms.filter(p => selectedPermissions.includes(p));
                            const allSelected = categoryPerms.length > 0 && categoryPerms.every(p => selectedPermissions.includes(p));
                            const isPartial = selectedInCategory.length > 0 && !allSelected;

                            return (
                                <Card key={category.id} className="border-none shadow-sm rounded-3xl overflow-hidden bg-white group hover:ring-1 hover:ring-slate-200 transition-all">
                                    <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-5 px-6">
                                        <div className="flex items-center gap-4">
                                            <Checkbox
                                                checked={allSelected}
                                                onCheckedChange={() => toggleCategory(category.id)}
                                                className="w-5 h-5 rounded-lg data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600 shrink-0"
                                            />
                                            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-slate-400 group-hover:text-red-500 transition-colors shadow-sm">
                                                {category.icon}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <CardTitle className="text-sm font-black text-slate-800 uppercase tracking-tight">{category.label}</CardTitle>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase truncate">{category.description}</p>
                                            </div>
                                            <Badge variant="outline" className={cn(
                                                "rounded-lg px-2 py-0.5 text-[9px] font-black uppercase border-none",
                                                allSelected ? "bg-emerald-500 text-white" : isPartial ? "bg-amber-500 text-white" : "bg-slate-100 text-slate-400"
                                            )}>
                                                {selectedInCategory.length} / {categoryPerms.length}
                                            </Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-4 px-6">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-x-6 gap-y-2">
                                            {categoryPerms.map((permission) => {
                                                const isActive = selectedPermissions.includes(permission);
                                                return (
                                                    <div
                                                        key={permission}
                                                        onClick={() => togglePermission(permission)}
                                                        className={cn(
                                                            "flex items-center gap-3 p-2 rounded-xl cursor-pointer transition-colors group/item",
                                                            isActive ? "bg-red-50/30" : "hover:bg-slate-50"
                                                        )}
                                                    >
                                                        <Checkbox
                                                            checked={isActive}
                                                            className="w-4 h-4 rounded-md data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600"
                                                        />
                                                        <span className={cn(
                                                            "text-[11px] font-black uppercase tracking-wider",
                                                            isActive ? "text-red-700" : "text-slate-500 group-hover/item:text-slate-700"
                                                        )}>
                                                            {permission.split(":")[1].replace(/_/g, " ")}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}

function Badge({ children, className, variant = "default" }: { children: React.ReactNode, className?: string, variant?: string }) {
    return (
        <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", className)}>
            {children}
        </span>
    );
}
