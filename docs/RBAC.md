# Role-Based Access Control (RBAC) Documentation

## Overview

Sistem RBAC (Role-Based Access Control) telah diimplementasikan untuk mengontrol akses ke berbagai halaman dan fitur di admin panel berdasarkan role pengguna.

## Roles

Terdapat 5 role yang tersedia:

### 1. SUPER_ADMIN
- **Label**: Super Admin
- **Deskripsi**: Akses penuh ke semua fitur dan pengaturan
- **Color**: Purple
- **Permissions**: Semua permissions tersedia

### 2. ADMIN
- **Label**: Admin
- **Deskripsi**: Akses hampir semua fitur kecuali user management dan developer settings
- **Color**: Red
- **Permissions**: Hampir semua, kecuali `users:create`, `users:edit`, `users:delete`, `webhooks:view`

### 3. MANAGER
- **Label**: Manager
- **Deskripsi**: Dapat mengelola produk, order, dan customer (tanpa hapus)
- **Color**: Blue
- **Permissions**: View dan create/edit untuk produk, order, customer, sales

### 4. STAFF
- **Label**: Staff
- **Deskripsi**: Akses terbatas untuk operasional harian
- **Color**: Green
- **Permissions**: View mostly, dengan kemampuan create untuk sales orders dan quotations

### 5. VIEWER
- **Label**: Viewer
- **Deskripsi**: Hanya bisa melihat data (read-only)
- **Color**: Gray
- **Permissions**: View only untuk data dasar

## File Structure

```
src/
├── lib/
│   ├── rbac.ts              # Konfigurasi roles dan permissions
│   └── auth.ts              # Authentication utilities
├── components/
│   └── auth/
│       └── CanAccess.tsx    # Components untuk conditional rendering
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   └── me/
│   │   │       └── route.ts # API endpoint untuk get current user
│   │   └── admin/
│   │       └── users/
│   │           ├── route.ts
│   │           └── [id]/
│   │               └── route.ts
│   └── admin/
│       ├── users/
│       │   └── page.tsx     # Updated user management page
│       └── unauthorized/
│           └── page.tsx     # Halaman untuk akses ditolak
└── middleware.ts            # Role-based route protection
```

## Permissions List

### Dashboard
- `dashboard:view` - View dashboard

### Products
- `products:view` - View products
- `products:create` - Create new products
- `products:edit` - Edit products
- `products:delete` - Delete products

### Categories
- `categories:view` - View categories
- `categories:manage` - Manage categories

### Orders
- `orders:view` - View orders
- `orders:edit` - Edit orders
- `orders:delete` - Delete orders

### Customers
- `customers:view` - View customers
- `customers:create` - Create customers
- `customers:edit` - Edit customers
- `customers:delete` - Delete customers

### Sales
- `sales_orders:view` - View sales orders
- `sales_orders:create` - Create sales orders
- `sales_orders:edit` - Edit sales orders
- `sales_orders:delete` - Delete sales orders
- `quotations:view` - View quotations
- `quotations:create` - Create quotations
- `quotations:edit` - Edit quotations
- `quotations:delete` - Delete quotations
- `invoices:view` - View invoices
- `deliveries:view` - View deliveries

### Content
- `news:view` - View news
- `news:create` - Create news
- `news:edit` - Edit news
- `news:delete` - Delete news
- `pages:view` - View pages
- `pages:create` - Create pages
- `pages:edit` - Edit pages
- `pages:delete` - Delete pages

### Settings
- `settings:view` - View settings
- `settings:edit` - Edit settings
- `banners:manage` - Manage banners
- `categories_menu:manage` - Manage categories menu
- `discounts:manage` - Manage discounts
- `portfolio:manage` - Manage portfolio
- `sections:manage` - Manage sections
- `cta:manage` - Manage home CTA
- `grid_categories:manage` - Manage grid categories
- `search:manage` - Manage search settings
- `format_file:manage` - Manage format file
- `footer:manage` - Manage footer

### Users
- `users:view` - View users
- `users:create` - Create users
- `users:edit` - Edit users
- `users:delete` - Delete users

### Developer
- `webhooks:view` - View webhooks
- `developer:view` - View developer settings

## Usage

### 1. Protecting Routes (Server-side)

Middleware otomatis melindungi semua route `/admin/*` berdasarkan role permissions yang didefinisikan di `rbac.ts`.

### 2. Conditional Rendering (Client-side)

#### Using `CanAccess` Component

```tsx
import { CanAccess } from "@/components/auth/CanAccess";

// Show button only if user has permission
<CanAccess permission="products:create">
  <Button>Tambah Produk</Button>
</CanAccess>

// Show if user has ANY of the permissions
<CanAccess permission={["products:edit", "products:delete"]} mode="any">
  <ActionsMenu />
</CanAccess>
```

#### Using `CanAccessRole` Component

```tsx
import { CanAccessRole } from "@/components/auth/CanAccess";

// Show only for SUPER_ADMIN
<CanAccessRole roles="SUPER_ADMIN">
  <DeleteButton />
</CanAccessRole>

// Show for multiple roles
<CanAccessRole roles={["SUPER_ADMIN", "ADMIN"]}>
  <AdminPanel />
</CanAccessRole>
```

#### Using `useAuth` Hook

```tsx
import { useAuth } from "@/components/auth/CanAccess";

function MyComponent() {
  const { user, hasPermission, hasAnyPermission, hasAllPermissions, isRole } = useAuth();

  if (hasPermission("products:create")) {
    return <Button>Create Product</Button>;
  }

  return null;
}
```

### 3. API Routes

API endpoints juga memvalidasi permissions:

```ts
// Example: /api/admin/users/route.ts
export async function POST(request: Request) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check specific permission
  if (!["SUPER_ADMIN", "ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // ... rest of the code
}
```

## Adding New Permissions

1. Tambahkan permission baru ke type `Permission` di `src/lib/rbac.ts`:
```ts
export type Permission = 
  | "existing:permission"
  | "new:permission"; // Add here
```

2. Assign permission ke roles di `rolePermissions`:
```ts
export const rolePermissions: Record<UserRole, Permission[]> = {
  SUPER_ADMIN: [..., "new:permission"],
  ADMIN: [..., "new:permission"],
  // ...
};
```

3. Map route ke permission di `routePermissions`:
```ts
export const routePermissions: Record<string, Permission[]> = {
  "/admin/new-page": ["new:permission"],
  // ...
};
```

## Adding New Roles

1. Tambahkan role baru ke enum di `prisma/schema.prisma`:
```prisma
enum UserRole {
  SUPER_ADMIN
  ADMIN
  MANAGER
  STAFF
  VIEWER
  NEW_ROLE // Add here
}
```

2. Run Prisma migration:
```bash
npx prisma migrate dev --name add_new_role
npx prisma generate
```

3. Tambahkan permissions untuk role baru di `src/lib/rbac.ts`:
```ts
export const rolePermissions: Record<UserRole, Permission[]> = {
  // ...
  NEW_ROLE: ["permission:1", "permission:2"],
};
```

4. Tambahkan role info:
```ts
export const roleInfo: Record<UserRole, { label: string; description: string; color: string }> = {
  // ...
  NEW_ROLE: {
    label: "New Role",
    description: "Description here",
    color: "bg-blue-100 text-blue-700",
  },
};
```

## Migration Existing Users

Untuk mengupdate existing users ke role system baru:

```sql
-- Update all ADMIN users to SUPER_ADMIN
UPDATE "User" SET role = 'SUPER_ADMIN' WHERE role = 'ADMIN';

-- Or create a default migration
UPDATE "User" SET role = 'STAFF' WHERE role = 'ADMIN';
```

## Testing

1. Login dengan user yang memiliki role berbeda
2. Verifikasi sidebar hanya menampilkan menu yang sesuai
3. Coba akses route yang tidak diizinkan (harus redirect ke `/admin/unauthorized`)
4. Test conditional rendering dengan `CanAccess` component

## Security Notes

- Selalu validasi permissions di server-side (API routes, server components)
- Client-side checks (`CanAccess`) hanya untuk UX, bukan security
- Middleware melindungi dari akses route langsung
- Session JWT harus disimpan dengan aman (httpOnly cookie)
