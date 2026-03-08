"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { UserRole, Permission, allPermissions } from "@/lib/rbac";

interface AuthContextType {
    user: {
        id: string;
        email: string;
        name?: string;
        phone?: string;
        role: UserRole;
        address?: string;
    } | null;
    isLoading: boolean;
    permissions: string[];
    hasPermission: (permission: Permission) => boolean;
    hasAnyPermission: (permissions: Permission[]) => boolean;
    hasAllPermissions: (permissions: Permission[]) => boolean;
    isRole: (roles: UserRole[]) => boolean;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<AuthContextType["user"]>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [permissions, setPermissions] = useState<string[]>([]);

    const fetchUser = async () => {
        setIsLoading(true);
        try {
            const [userRes, permRes] = await Promise.all([
                fetch("/api/auth/me"),
                fetch("/api/admin/roles/permissions").catch(() => null)
            ]);

            if (userRes.ok) {
                const userData = await userRes.json();
                setUser(userData.user);

                // Load permissions for this user's role
                if (permRes?.ok) {
                    const permData = await permRes.json() as { permissions: Record<string, string[]> };
                    const { rolePermissions } = await import("@/lib/rbac");
                    const userRole = userData.user.role as UserRole;
                    const rolePerms = (permData.permissions[userRole] || rolePermissions[userRole] || []) as string[];
                    setPermissions(rolePerms);
                } else {
                    // Fallback to hardcoded defaults if API fails
                    const { rolePermissions } = await import("@/lib/rbac");
                    const userRole = userData.user.role as UserRole;
                    const rolePerms = (rolePermissions[userRole] || []) as string[];
                    setPermissions(rolePerms);
                }
            } else {
                setUser(null);
            }
        } catch (error) {
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchUser();
    }, []);

    const checkPermission = (permission: Permission) => {
        if (!user) return false;
        // SUPER_ADMIN always has all permissions
        if (user.role === "SUPER_ADMIN") return true;
        return permissions.includes(permission);
    };

    const checkAnyPermission = (permissionsToCheck: Permission[]) => {
        if (!user) return false;
        if (user.role === "SUPER_ADMIN") return true;
        return permissionsToCheck.some(permission => permissions.includes(permission));
    };

    const checkAllPermissions = (permissionsToCheck: Permission[]) => {
        if (!user) return false;
        if (user.role === "SUPER_ADMIN") return true;
        return permissionsToCheck.every(permission => permissions.includes(permission));
    };

    const checkRole = (roles: UserRole[]) => {
        if (!user) return false;
        return roles.includes(user.role);
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                isLoading,
                permissions,
                hasPermission: checkPermission,
                hasAnyPermission: checkAnyPermission,
                hasAllPermissions: checkAllPermissions,
                isRole: checkRole,
                refreshUser: fetchUser,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}

interface CanAccessProps {
    permission: Permission | Permission[];
    mode?: "all" | "any";
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

export function CanAccess({
    permission,
    mode = "all",
    children,
    fallback = null,
}: CanAccessProps) {
    const { hasPermission: checkPerm, hasAnyPermission, hasAllPermissions, isLoading } = useAuth();

    if (isLoading) {
        return null;
    }

    const permissions = Array.isArray(permission) ? permission : [permission];
    const canAccess = mode === "all"
        ? hasAllPermissions(permissions)
        : hasAnyPermission(permissions);

    return canAccess ? <>{children}</> : <>{fallback}</>;
}

interface CanAccessRoleProps {
    roles: UserRole | UserRole[];
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

export function CanAccessRole({
    roles,
    children,
    fallback = null,
}: CanAccessRoleProps) {
    const { isRole, isLoading } = useAuth();

    if (isLoading) {
        return null;
    }

    const roleList = Array.isArray(roles) ? roles : [roles];
    const canAccess = isRole(roleList);

    return canAccess ? <>{children}</> : <>{fallback}</>;
}
