/**
 * Role-Based Access Control (RBAC) Configuration
 * 
 * Defines roles, permissions, and which routes each role can access.
 */

export type UserRole = "SUPER_ADMIN" | "ADMIN" | "MANAGER" | "STAFF" | "VIEWER" | "CUSTOMER";

export type Permission =
  | "dashboard:view"
  | "products:view"
  | "products:create"
  | "products:edit"
  | "products:delete"
  | "categories:view"
  | "categories:manage"
  | "orders:view"
  | "orders:edit"
  | "orders:delete"
  | "customers:view"
  | "customers:create"
  | "customers:edit"
  | "customers:delete"
  | "sales_orders:view"
  | "sales_orders:create"
  | "sales_orders:edit"
  | "sales_orders:delete"
  | "quotations:view"
  | "quotations:create"
  | "quotations:edit"
  | "quotations:delete"
  | "invoices:view"
  | "deliveries:view"
  | "returns:view"
  | "returns:edit"
  | "news:view"
  | "news:create"
  | "news:edit"
  | "news:delete"
  | "pages:view"
  | "pages:create"
  | "pages:edit"
  | "pages:delete"
  | "settings:view"
  | "settings:edit"
  | "users:view"
  | "users:create"
  | "users:edit"
  | "users:delete"
  | "webhooks:view"
  | "upgrades:view"
  | "banners:manage"
  | "categories_menu:manage"
  | "discounts:manage"
  | "portfolio:manage"
  | "sections:manage"
  | "cta:manage"
  | "grid_categories:manage"
  | "search:manage"
  | "format_file:manage"
  | "footer:manage"
  | "developer:view";

// Define permissions for each role
export const rolePermissions: Record<UserRole, Permission[]> = {
  SUPER_ADMIN: [
    // Full access to everything
    "dashboard:view",
    "products:view", "products:create", "products:edit", "products:delete",
    "categories:view", "categories:manage",
    "orders:view", "orders:edit", "orders:delete",
    "customers:view", "customers:create", "customers:edit", "customers:delete",
    "sales_orders:view", "sales_orders:create", "sales_orders:edit", "sales_orders:delete",
    "quotations:view", "quotations:create", "quotations:edit", "quotations:delete",
    "invoices:view",
    "deliveries:view",
    "returns:view", "returns:edit",
    "news:view", "news:create", "news:edit", "news:delete",
    "pages:view", "pages:create", "pages:edit", "pages:delete",
    "settings:view", "settings:edit",
    "users:view", "users:create", "users:edit", "users:delete",
    "webhooks:view",
    "upgrades:view",
    "banners:manage",
    "categories_menu:manage",
    "discounts:manage",
    "portfolio:manage",
    "sections:manage",
    "cta:manage",
    "grid_categories:manage",
    "search:manage",
    "format_file:manage",
    "footer:manage",
    "developer:view",
  ],
  ADMIN: [
    // Almost full access, but cannot manage users or developer settings
    "dashboard:view",
    "products:view", "products:create", "products:edit", "products:delete",
    "categories:view", "categories:manage",
    "orders:view", "orders:edit", "orders:delete",
    "customers:view", "customers:create", "customers:edit", "customers:delete",
    "sales_orders:view", "sales_orders:create", "sales_orders:edit", "sales_orders:delete",
    "quotations:view", "quotations:create", "quotations:edit", "quotations:delete",
    "invoices:view",
    "deliveries:view",
    "returns:view", "returns:edit",
    "news:view", "news:create", "news:edit", "news:delete",
    "pages:view", "pages:create", "pages:edit", "pages:delete",
    "settings:view", "settings:edit",
    "users:view", // Can view but not create/edit/delete
    "upgrades:view",
    "banners:manage",
    "categories_menu:manage",
    "discounts:manage",
    "portfolio:manage",
    "sections:manage",
    "cta:manage",
    "grid_categories:manage",
    "search:manage",
    "format_file:manage",
    "footer:manage",
    // No access to: webhooks, users:manage, developer
  ],
  MANAGER: [
    // Can manage products, orders, customers, sales
    "dashboard:view",
    "products:view", "products:create", "products:edit", // No delete
    "categories:view",
    "orders:view", "orders:edit", // No delete
    "customers:view", "customers:create", "customers:edit", // No delete
    "sales_orders:view", "sales_orders:create", "sales_orders:edit", // No delete
    "quotations:view", "quotations:create", "quotations:edit", // No delete
    "invoices:view",
    "deliveries:view",
    "returns:view", "returns:edit",
    "news:view",
    "pages:view",
    "settings:view", // View only
    "upgrades:view",
    // No access to: users, webhooks, developer, settings:edit, banners, etc.
  ],
  STAFF: [
    // Limited access - view and basic operations
    "dashboard:view",
    "products:view",
    "categories:view",
    "orders:view",
    "customers:view",
    "sales_orders:view", "sales_orders:create",
    "quotations:view", "quotations:create",
    "invoices:view",
    "deliveries:view",
    "returns:view",
    "news:view",
    "pages:view",
    "upgrades:view",
    // View only for most things
  ],
  VIEWER: [
    // Read-only access to basic data
    "dashboard:view",
    "products:view",
    "categories:view",
    "orders:view",
    "customers:view",
    "sales_orders:view",
    "quotations:view",
    "invoices:view",
    "deliveries:view",
    "returns:view",
    // View only, no create/edit/delete
  ],
  CUSTOMER: [
    // Customer role - no admin access
  ],
};

// Map routes to required permissions
export const routePermissions: Record<string, Permission[]> = {
  "/admin": ["dashboard:view"],
  "/admin/products": ["products:view"],
  "/admin/products/new": ["products:create"],
  "/admin/products/[id]/edit": ["products:edit"],
  "/admin/products/categories": ["categories:manage"],
  "/admin/products/default-discounts": ["discounts:manage"],
  "/admin/orders": ["orders:view"],
  "/admin/orders/[id]": ["orders:view"],
  "/admin/customers": ["customers:view"],
  "/admin/customers/new": ["customers:create"],
  "/admin/customers/[id]/edit": ["customers:edit"],
  "/admin/customers/[id]": ["customers:view"],
  // Sales & Orders
  "/admin/sales/quotations": ["quotations:view"],
  "/admin/sales/quotations/new": ["quotations:create"],
  "/admin/sales/quotations/[id]": ["quotations:view"],
  "/admin/sales/orders": ["sales_orders:view"],
  "/admin/sales/orders/new": ["sales_orders:create"],
  "/admin/sales/orders/[id]": ["sales_orders:view"],
  "/admin/sales/returns": ["returns:view"],
  "/admin/sales/returns/[id]": ["returns:view"],
  // Fulfillment
  "/admin/fulfillment/deliveries": ["deliveries:view"],
  "/admin/fulfillment/deliveries/[id]": ["deliveries:view"],
  // Finance
  "/admin/finance/invoices": ["invoices:view"],
  "/admin/finance/invoices/[id]": ["invoices:view"],
  // Legacy routes (keep for backward compat)
  "/admin/sales/deliveries": ["deliveries:view"],
  "/admin/sales/invoices": ["invoices:view"],
  // Content
  "/admin/news": ["news:view"],
  "/admin/news/new": ["news:create"],
  "/admin/news/[id]/edit": ["news:edit"],
  "/admin/pages": ["pages:view"],
  "/admin/pages/new": ["pages:create"],
  "/admin/pages/[id]/edit": ["pages:edit"],
  // Settings
  "/admin/settings": ["settings:view"],
  "/admin/settings/banners": ["banners:manage"],
  "/admin/settings/categories": ["categories:manage"],
  "/admin/settings/categories-menu": ["categories_menu:manage"],
  "/admin/settings/discounts": ["discounts:manage"],
  "/admin/settings/portfolio": ["portfolio:manage"],
  "/admin/settings/sections": ["sections:manage"],
  "/admin/settings/cta": ["cta:manage"],
  "/admin/settings/grid-categories": ["grid_categories:manage"],
  "/admin/settings/search": ["search:manage"],
  "/admin/settings/format-file": ["format_file:manage"],
  "/admin/settings/footer": ["footer:manage"],
  // Users & Dev
  "/admin/users": ["users:view"],
  "/admin/developer/webhooks": ["webhooks:view"],
  "/admin/upgrades": ["upgrades:view"],
};

/**
 * Check if a role has a specific permission
 * This now checks database first, then falls back to default permissions
 */
export async function hasPermission(role: UserRole, permission: Permission): Promise<boolean> {
  // For SUPER_ADMIN, always return true
  if (role === "SUPER_ADMIN") return true;

  // Try to check from database first
  try {
    const { db } = await import("@/lib/db");
    const dbPermission = await db.rolePermission.findUnique({
      where: { role },
    });

    if (dbPermission !== null) {
      const perms = Array.isArray(dbPermission.permissions) ? (dbPermission.permissions as string[]) : [];
      if (perms.includes(permission)) {
        return true;
      }
    }
  } catch (error) {
    // If database check fails, fall through to default permissions
    console.warn("Failed to check permission from DB, using defaults:", error);
  }

  // Fallback to default permissions from config
  return rolePermissions[role]?.includes(permission) ?? false;
}

/**
 * Check if a role has any of the specified permissions
 */
export async function hasAnyPermission(role: UserRole, permissions: Permission[]): Promise<boolean> {
  for (const permission of permissions) {
    if (await hasPermission(role, permission)) {
      return true;
    }
  }
  return false;
}

/**
 * Check if a role has all of the specified permissions
 */
export async function hasAllPermissions(role: UserRole, permissions: Permission[]): Promise<boolean> {
  for (const permission of permissions) {
    if (!(await hasPermission(role, permission))) {
      return false;
    }
  }
  return true;
}

/**
 * Check if a role can access a specific route
 * Note: This is for server-side/middleware use with default permissions only
 * For client-side, use the AuthContext permissions
 */
export function canAccessRoute(role: UserRole, pathname: string): boolean {
  // SUPER_ADMIN can access everything
  if (role === "SUPER_ADMIN") return true;

  // Normalize pathname - remove query params and trailing slashes
  const normalizedPath = pathname.split("?")[0].replace(/\/$/, "");

  // Find matching route pattern
  for (const [route, requiredPermissions] of Object.entries(routePermissions)) {
    // Handle dynamic routes like /admin/products/[id]
    const routePattern = route.replace(/\[([^\]]+)\]/g, "[^/]+");
    const regex = new RegExp(`^${routePattern}$`);

    if (regex.test(normalizedPath)) {
      // Check if role has all required permissions (using default config)
      return requiredPermissions.every(permission =>
        rolePermissions[role]?.includes(permission as Permission) ?? false
      );
    }
  }

  // Default: if route not defined, allow access (can be changed to deny)
  return true;
}

/**
 * Get all routes accessible by a role
 */
export function getAccessibleRoutes(role: UserRole): string[] {
  // SUPER_ADMIN can access everything
  if (role === "SUPER_ADMIN") {
    return Object.keys(routePermissions);
  }

  const accessibleRoutes: string[] = [];

  for (const [route, permissions] of Object.entries(routePermissions)) {
    // Check if role has all required permissions (using default config)
    const hasAll = permissions.every(permission =>
      rolePermissions[role]?.includes(permission as Permission) ?? false
    );
    if (hasAll) {
      accessibleRoutes.push(route);
    }
  }

  return accessibleRoutes;
}

/**
 * Get sidebar menu items with their required permissions.
 *
 * Structure:
 *  - Dashboard
 *  - [Sales & Orders]   Penawaran / Pesanan / Retur
 *  - [Fulfillment]      Pengiriman
 *  - [Finance]          Faktur & Pembayaran
 *  - [Master Data]      Pelanggan / Upgrade
 *  - Produk
 *  - Content
 *  - Settings
 *  - Users
 *  - Developer
 */
export const sidebarMenuItems = [
  // ── Dashboard ───────────────────────────────────────────────────────────
  {
    title: "Dashboard",
    href: "/admin",
    icon: "LayoutDashboard",
    requiredPermission: "dashboard:view",
  },

  // ── Pelanggan ─────────────────────────────────────────────────────────────
  {
    title: "Pelanggan",
    href: "/admin/customers",
    icon: "Users",
    requiredPermission: "customers:view",
    children: [
      { title: "Database Pelanggan", href: "/admin/customers", icon: "Users", requiredPermission: "customers:view" },
      { title: "Upgrade Akun", href: "/admin/upgrades", icon: "ArrowUpCircle", requiredPermission: "upgrades:view" },
    ],
  },

  // ── Produk ───────────────────────────────────────────────────────────────
  {
    title: "Produk",
    href: "/admin/products",
    icon: "Package",
    requiredPermission: "products:view",
    children: [
      { title: "Daftar Produk", href: "/admin/products", icon: "ShoppingBag", requiredPermission: "products:view" },
      { title: "Sembunyikan Kategori", href: "/admin/products/hidden-categories", icon: "ListTree", requiredPermission: "categories:manage" },
      { title: "Pemetaan Kategori", href: "/admin/products/categories", icon: "ListTree", requiredPermission: "categories:manage" },
      { title: "Diskon Default", href: "/admin/products/default-discounts", icon: "BadgePercent", requiredPermission: "discounts:manage" },
    ],
  },

  // ── Penjualan ─────────────────────────────────────────────────────────────
  {
    title: "Penjualan",
    href: "/admin/sales/quotations",
    icon: "FileCheck",
    requiredPermission: "quotations:view",
    children: [
      { title: "Penawaran", href: "/admin/sales/quotations", icon: "FileCheck", badgeKey: "pendingQuotations", requiredPermission: "quotations:view" },
      { title: "Pesanan", href: "/admin/orders", icon: "ClipboardList", requiredPermission: "orders:view" },
      { title: "Pembayaran", href: "/admin/sales/payments", icon: "Receipt", requiredPermission: "invoices:view" },
      { title: "Retur", href: "/admin/sales/returns", icon: "Package", requiredPermission: "returns:view" },
    ],
  },

  // ── Konten ──────────────────────────────────────────────────────────────
  {
    title: "Konten",
    href: "/admin/news",
    icon: "Newspaper",
    requiredPermission: "news:view",
    children: [
      { title: "Berita", href: "/admin/news", icon: "Newspaper", requiredPermission: "news:view" },
      { title: "Halaman", href: "/admin/pages", icon: "FileText", requiredPermission: "pages:view" },
    ],
  },

  // ═══ SECTION DIVIDER: Tampilan ═══
  { title: "__divider__", href: "__tampilan__", icon: "", label: "Tampilan" },

  // ── Tampilan ────────────────────────────────────────────────────────────
  {
    title: "Tampilan",
    href: "/admin/settings/banners",
    icon: "LayoutTemplate",
    requiredPermission: "settings:view",
    children: [
      { title: "Banner Slide", href: "/admin/settings/banners", icon: "ImageIcon", requiredPermission: "banners:manage" },
      { title: "Kategori Utama", href: "/admin/settings/categories", icon: "ListTree", requiredPermission: "categories:manage" },
      { title: "Kategori Dropdown", href: "/admin/settings/categories-menu", icon: "ListTree", requiredPermission: "categories_menu:manage" },
      { title: "Home CTA", href: "/admin/settings/cta", icon: "LayoutTemplate", requiredPermission: "cta:manage" },
      { title: "Grid Kategori", href: "/admin/settings/grid-categories", icon: "LayoutDashboard", requiredPermission: "grid_categories:manage" },
      { title: "Saran Pencarian", href: "/admin/settings/search", icon: "Search", requiredPermission: "search:manage" },
      { title: "Portfolio", href: "/admin/settings/portfolio", icon: "Briefcase", requiredPermission: "portfolio:manage" },
      { title: "Footer", href: "/admin/settings/footer", icon: "LayoutTemplate", requiredPermission: "footer:manage" },
    ],
  },

  // ═══ SECTION DIVIDER: Pengaturan ═══
  { title: "__divider__", href: "__pengaturan__", icon: "", label: "Pengaturan" },

  // ── Pengaturan ──────────────────────────────────────────────────────────
  {
    title: "Pengaturan",
    href: "/admin/settings",
    icon: "Settings",
    requiredPermission: "settings:view",
    children: [
      { title: "Profil Perusahaan", href: "/admin/settings/company", icon: "Briefcase", requiredPermission: "settings:edit" },
      { title: "Tampilan Email", href: "/admin/settings/email-template", icon: "FileText", requiredPermission: "settings:edit" },
      { title: "Notifikasi", href: "/admin/settings", icon: "Bell", requiredPermission: "settings:view" },
    ],
  },

  // ── Pengguna ────────────────────────────────────────────────────────────
  {
    title: "Pengguna",
    href: "/admin/users",
    icon: "ShieldCheck",
    requiredPermission: "users:view",
    children: [
      { title: "Hak Akses & Peran", href: "/admin/settings/roles", icon: "ShieldCheck", requiredPermission: "settings:edit" },
      { title: "Kelola Admin", href: "/admin/users", icon: "UserPlus", requiredPermission: "users:view" },
    ],
  },

  // ═══ SECTION DIVIDER: Developer ═══
  { title: "__divider__", href: "__developer__", icon: "", label: "Developer" },

  // ── Developer ───────────────────────────────────────────────────────────
  {
    title: "Developer",
    href: "/admin/developer/webhooks",
    icon: "Webhook",
    requiredPermission: "developer:view",
    children: [
      { title: "Webhook Simulator", href: "/admin/developer/webhooks", icon: "Webhook", requiredPermission: "webhooks:view" },
      { title: "Backup Data", href: "/admin/developer/backup", icon: "Activity", requiredPermission: "developer:view" },
    ],
  },
];


/**
 * Get filtered sidebar menu items based on role
 */
export function getSidebarMenuForRole(role: UserRole) {
  return sidebarMenuItems.filter(item =>
    hasPermission(role, item.requiredPermission as Permission)
  ).map(item => {
    if (item.children) {
      return {
        ...item,
        children: item.children.filter(child =>
          hasPermission(role, child.requiredPermission as Permission)
        ),
      };
    }
    return item;
  });
}

/**
 * Role display names and descriptions
 */
export const roleInfo: Record<UserRole, { label: string; description: string; color: string }> = {
  SUPER_ADMIN: {
    label: "Super Admin",
    description: "Akses penuh ke semua fitur dan pengaturan",
    color: "bg-purple-100 text-purple-700",
  },
  ADMIN: {
    label: "Admin",
    description: "Akses hampir semua fitur kecuali user management dan developer",
    color: "bg-red-100 text-red-700",
  },
  MANAGER: {
    label: "Manager",
    description: "Dapat mengelola produk, order, dan customer (tanpa hapus)",
    color: "bg-blue-100 text-blue-700",
  },
  STAFF: {
    label: "Staff",
    description: "Akses terbatas untuk operasional harian",
    color: "bg-green-100 text-green-700",
  },
  VIEWER: {
    label: "Viewer",
    description: "Hanya bisa melihat data (read-only)",
    color: "bg-gray-100 text-gray-600",
  },
  CUSTOMER: {
    label: "Customer",
    description: "User customer yang daftar di frontend",
    color: "bg-orange-100 text-orange-700",
  },
};

/**
 * List of all permissions (for UI)
 */
export const allPermissions: Permission[] = [
  "dashboard:view",
  "products:view", "products:create", "products:edit", "products:delete",
  "categories:view", "categories:manage",
  "orders:view", "orders:edit", "orders:delete",
  "customers:view", "customers:create", "customers:edit", "customers:delete",
  "sales_orders:view", "sales_orders:create", "sales_orders:edit", "sales_orders:delete",
  "quotations:view", "quotations:create", "quotations:edit", "quotations:delete",
  "invoices:view",
  "deliveries:view",
  "returns:view", "returns:edit",
  "news:view", "news:create", "news:edit", "news:delete",
  "pages:view", "pages:create", "pages:edit", "pages:delete",
  "settings:view", "settings:edit",
  "users:view", "users:create", "users:edit", "users:delete",
  "webhooks:view",
  "upgrades:view",
  "banners:manage",
  "categories_menu:manage",
  "discounts:manage",
  "portfolio:manage",
  "sections:manage",
  "cta:manage",
  "grid_categories:manage",
  "search:manage",
  "format_file:manage",
  "footer:manage",
  "developer:view",
];

/**
 * Permission categories for UI grouping
 */
export const permissionCategories = [
  {
    id: "dashboard",
    label: "Dashboard",
    description: "Akses ke dashboard utama",
    icon: "📊",
  },
  {
    id: "products",
    label: "Produk",
    description: "Manajemen produk dan kategori",
    icon: "📦",
  },
  {
    id: "categories",
    label: "Kategori",
    description: "Manajemen kategori produk",
    icon: "🏷️",
  },
  {
    id: "orders",
    label: "Pesanan",
    description: "Manajemen pesanan customer",
    icon: "🛒",
  },
  {
    id: "customers",
    label: "Customer",
    description: "Manajemen data customer",
    icon: "👥",
  },
  {
    id: "sales_orders",
    label: "Sales Orders",
    description: "Manajemen sales orders",
    icon: "📋",
  },
  {
    id: "quotations",
    label: "Quotations",
    description: "Manajemen penawaran",
    icon: "📝",
  },
  {
    id: "invoices",
    label: "Invoices",
    description: "Faktur dan pembayaran",
    icon: "📄",
  },
  {
    id: "deliveries",
    label: "Deliveries",
    description: "Pengiriman barang",
    icon: "🚚",
  },
  {
    id: "news",
    label: "News",
    description: "Berita dan pengumuman",
    icon: "📰",
  },
  {
    id: "pages",
    label: "Pages",
    description: "Halaman statis",
    icon: "📄",
  },
  {
    id: "settings",
    label: "Settings",
    description: "Pengaturan umum",
    icon: "⚙️",
  },
  {
    id: "users",
    label: "Users",
    description: "Manajemen user admin",
    icon: "👤",
  },
  {
    id: "webhooks",
    label: "Webhooks",
    description: "Integrasi webhook",
    icon: "🔗",
  },
  {
    id: "upgrades",
    label: "Upgrades",
    description: "Permintaan upgrade akun",
    icon: "⬆️",
  },
  {
    id: "banners",
    label: "Banners",
    description: "Banner homepage",
    icon: "🖼️",
  },
  {
    id: "categories_menu",
    label: "Categories Menu",
    description: "Menu kategori",
    icon: "📑",
  },
  {
    id: "discounts",
    label: "Discounts",
    description: "Aturan diskon",
    icon: "💰",
  },
  {
    id: "portfolio",
    label: "Portfolio",
    description: "Portfolio client",
    icon: "💼",
  },
  {
    id: "sections",
    label: "Sections",
    description: "Section homepage",
    icon: "📐",
  },
  {
    id: "cta",
    label: "Home CTA",
    description: "Call-to-action homepage",
    icon: "📢",
  },
  {
    id: "grid_categories",
    label: "Grid Categories",
    description: "Grid kategori",
    icon: "🔲",
  },
  {
    id: "search",
    label: "Search",
    description: "Pengaturan pencarian",
    icon: "🔍",
  },
  {
    id: "format_file",
    label: "Format File",
    description: "Format file download",
    icon: "📁",
  },
  {
    id: "footer",
    label: "Footer",
    description: "Footer website",
    icon: "🦶",
  },
  {
    id: "developer",
    label: "Developer",
    description: "Developer tools",
    icon: "👨‍💻",
  },
];
