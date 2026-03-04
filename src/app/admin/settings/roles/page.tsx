"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Save, RotateCcw, ShieldCheck, Users, Package, ShoppingCart, FileText, Settings, TrendingUp } from "lucide-react";
import { UserRole, roleInfo, allPermissions, permissionCategories, type Permission } from "@/lib/rbac";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

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
                // Load default permissions if not exists
                if (Object.keys(data.permissions).length === 0) {
                    // Initialize with default permissions from rbac.ts
                    const defaultPermissions: Record<string, string[]> = {};
                    roles.forEach(role => {
                        defaultPermissions[role] = [];
                    });
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
                toast.success(`Permissions untuk ${roleInfo[selectedRole].label} berhasil disimpan`);
                fetchPermissions();
            } else {
                toast.error("Gagal menyimpan permissions");
            }
        } catch (error) {
            toast.error("Terjadi kesalahan");
        } finally {
            setIsSaving(false);
        }
    }

    function togglePermission(permission: string) {
        setSelectedPermissions(prev =>
            prev.includes(permission)
                ? prev.filter(p => p !== permission)
                : [...prev, permission]
        );
    }

    function toggleCategory(category: string) {
        const categoryPerms = allPermissions.filter(p => p.startsWith(category)) as Permission[];
        const allSelected = categoryPerms.every(p => selectedPermissions.includes(p));

        if (allSelected) {
            // Unselect all in category
            setSelectedPermissions(prev =>
                prev.filter(p => !categoryPerms.includes(p as Permission))
            );
        } else {
            // Select all in category
            setSelectedPermissions(prev => [
                ...prev,
                ...categoryPerms.filter(p => !prev.includes(p)),
            ]);
        }
    }

    function selectAll() {
        setSelectedPermissions(allPermissions);
    }

    function selectNone() {
        setSelectedPermissions([]);
    }

    function resetToDefaults() {
        // This would require storing default permissions somewhere
        toast.info("Fitur reset akan segera tersedia");
    }

    if (isLoading) {
        return <div className="flex items-center justify-center h-64">Loading...</div>;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Role & Permissions</h1>
                    <p className="text-sm text-gray-500">Kelola akses untuk setiap role pengguna</p>
                </div>
                <div className="flex items-center gap-2">
                    <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as UserRole)}>
                        <SelectTrigger className="w-[200px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {roles.map(role => (
                                <SelectItem key={role} value={role}>
                                    {roleInfo[role].label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Role Info Card */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-lg ${roleInfo[selectedRole].color}`}>
                            <ShieldCheck className="h-6 w-6" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-lg">{roleInfo[selectedRole].label}</h3>
                            <p className="text-sm text-gray-500">{roleInfo[selectedRole].description}</p>
                        </div>
                        <div className="ml-auto text-right">
                            <p className="text-2xl font-bold">{selectedPermissions.length}</p>
                            <p className="text-sm text-gray-500">permissions aktif</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Quick Actions */}
            <div className="flex items-center gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={selectAll}
                    className="text-sm"
                >
                    Select All
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={selectNone}
                    className="text-sm"
                >
                    Select None
                </Button>
                <div className="ml-auto flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={resetToDefaults}
                        className="text-sm"
                    >
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Reset
                    </Button>
                    <Button
                        onClick={savePermissions}
                        disabled={isSaving}
                        className="bg-red-600 hover:bg-red-700"
                    >
                        <Save className="h-4 w-4 mr-2" />
                        {isSaving ? "Saving..." : "Save Changes"}
                    </Button>
                </div>
            </div>

            {/* Permissions Matrix */}
            <Card>
                <CardHeader>
                    <CardTitle>Permissions Matrix</CardTitle>
                    <CardDescription>
                        Centang permissions yang ingin diberikan kepada {roleInfo[selectedRole].label}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-6">
                        {permissionCategories.map((category) => {
                            const categoryPerms = allPermissions.filter(p => p.startsWith(category.id));
                            const allSelected = categoryPerms.every(p => selectedPermissions.includes(p));
                            const someSelected = categoryPerms.some(p => selectedPermissions.includes(p));

                            return (
                                <div key={category.id} className="border rounded-lg">
                                    <div className="flex items-center gap-3 p-4 bg-gray-50 border-b">
                                        <Checkbox
                                            checked={allSelected}
                                            onCheckedChange={() => toggleCategory(category.id)}
                                            className="data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600"
                                        />
                                        {category.icon}
                                        <div>
                                            <h4 className="font-semibold text-sm">{category.label}</h4>
                                            <p className="text-xs text-gray-500">{category.description}</p>
                                        </div>
                                        <span className="ml-auto text-xs text-gray-500">
                                            {categoryPerms.filter(p => selectedPermissions.includes(p)).length} / {categoryPerms.length} selected
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 p-4">
                                        {categoryPerms.map((permission) => (
                                            <div
                                                key={permission}
                                                className="flex items-center gap-2 p-2 rounded hover:bg-gray-50 cursor-pointer"
                                                onClick={() => togglePermission(permission)}
                                            >
                                                <Checkbox
                                                    checked={selectedPermissions.includes(permission)}
                                                    className="data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600"
                                                />
                                                <span className="text-sm text-gray-700">
                                                    {permission.split(":")[1]}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
