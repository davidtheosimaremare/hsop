"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Loader2,
    Bell,
    CheckCheck,
    Trash2,
    Eye,
    ChevronLeft,
    ChevronRight,
    Package,
    User,
    Award,
    FileText,
    AlertCircle,
    CheckCircle,
    Info
} from "lucide-react";
import {
    markAllNotificationsAsRead,
    deleteNotification,
    clearNotifications
} from "@/app/actions/notification";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { toast } from "sonner";
import Link from "next/link";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { ModernConfirm } from "@/components/ui/modern-confirm";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { useNotifications } from "@/hooks/useNotifications";
import { useAuth } from "@/components/auth/CanAccess";

const typeConfig: Record<string, { icon: any; bg: string; color: string; label: string; defaultLink: string }> = {
    INFO: { icon: Info, bg: "bg-blue-100", color: "text-blue-600", label: "Info", defaultLink: "/dashboard/notifikasi" },
    SUCCESS: { icon: CheckCircle, bg: "bg-green-100", color: "text-green-600", label: "Sukses", defaultLink: "/dashboard/notifikasi" },
    WARNING: { icon: AlertCircle, bg: "bg-yellow-100", color: "text-yellow-600", label: "Peringatan", defaultLink: "/dashboard/notifikasi" },
    ERROR: { icon: AlertCircle, bg: "bg-red-100", color: "text-red-600", label: "Error", defaultLink: "/dashboard/notifikasi" },
    UPGRADE: { icon: Award, bg: "bg-purple-100", color: "text-purple-600", label: "Upgrade", defaultLink: "/dashboard/upgrade" },
    ORDER: { icon: Package, bg: "bg-indigo-100", color: "text-indigo-600", label: "Pesanan", defaultLink: "/dashboard/transaksi" },
    QUOTATION: { icon: FileText, bg: "bg-orange-100", color: "text-orange-600", label: "Penawaran", defaultLink: "/dashboard/transaksi" },
    PROFILE: { icon: User, bg: "bg-gray-100", color: "text-gray-600", label: "Profil", defaultLink: "/dashboard/profil" }
};

export default function NotificationsPage() {
    const { user } = useAuth();
    const [selectedNotification, setSelectedNotification] = useState<any>(null);
    const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id: string | null }>({ open: false, id: null });
    const [clearDialog, setClearDialog] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 15;

    const {
        notifications,
        unreadCount,
        isLoading,
        total,
        refresh,
        markAsRead,
        markAllAsRead
    } = useNotifications(user?.id);

    const handleMarkAllAsRead = async () => {
        await markAllAsRead();
        toast.success("Semua notifikasi ditandai sudah dibaca");
    };

    const handleDelete = async (id: string) => {
        setIsDeleting(true);
        const result = await deleteNotification(id);
        if (result.success) {
            toast.success("Notifikasi dihapus");
            refresh();
        } else {
            toast.error(result.error || "Gagal menghapus notifikasi");
        }
        setIsDeleting(false);
        setDeleteDialog({ open: false, id: null });
    };

    const handleClearAll = async () => {
        setIsDeleting(true);
        const result = await clearNotifications();
        if (result.success) {
            toast.success("Semua notifikasi telah dibersihkan");
            refresh();
        } else {
            toast.error(result.error || "Gagal membersihkan notifikasi");
        }
        setIsDeleting(false);
        setClearDialog(false);
    };

    // Pagination
    const totalPages = Math.ceil(total / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const currentPageNotifications = notifications.slice(startIndex, endIndex);

    const unreadOnPage = currentPageNotifications.filter(n => !n.read).length;

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-32 gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-red-500" />
                <p className="text-sm text-gray-400">Memuat notifikasi...</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Notifikasi</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        {total} notifikasi • {unreadCount} belum dibaca
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {total > 0 && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setClearDialog(true)}
                            className="gap-2 text-xs h-8 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-100"
                        >
                            <Trash2 className="w-4 h-4" />
                            Bersihkan
                        </Button>
                    )}
                    {unreadCount > 0 && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleMarkAllAsRead}
                            className="gap-2 text-xs h-8"
                        >
                            <CheckCheck className="w-4 h-4" />
                            Tandai Semua Dibaca
                        </Button>
                    )}
                </div>
            </div>

            {/* Table */}
            <Card className="border-gray-200">
                <CardContent className="p-0">
                    {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                                <Bell className="w-8 h-8 text-gray-200" />
                            </div>
                            <p className="text-gray-500 font-medium">Belum ada notifikasi</p>
                            <p className="text-gray-400 text-sm">Semua pembaruan akan muncul di sini</p>
                        </div>
                    ) : (
                        <>
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-gray-50/50 border-gray-200">
                                        <TableHead className="w-10"></TableHead>
                                        <TableHead className="w-10"></TableHead>
                                        <TableHead className="font-semibold">Notifikasi</TableHead>
                                        <TableHead className="w-[200px] font-semibold">Tanggal</TableHead>
                                        <TableHead className="w-[100px] font-semibold">Status</TableHead>
                                        <TableHead className="w-[80px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {currentPageNotifications.map((notif) => (
                                        <NotificationRow
                                            key={notif.id}
                                            notification={notif}
                                            onClick={() => {
                                                setSelectedNotification(notif);
                                                if (!notif.read) markAsRead(notif.id);
                                            }}
                                            onDelete={(id) => setDeleteDialog({ open: true, id })}
                                        />
                                    ))}
                                </TableBody>
                            </Table>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
                                    <div className="text-xs text-gray-500">
                                        Menampilkan {startIndex + 1}-{Math.min(endIndex, total)} dari {total} notifikasi
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                            disabled={currentPage === 1}
                                            className="h-8"
                                        >
                                            <ChevronLeft className="w-4 h-4" />
                                        </Button>
                                        <span className="text-sm text-gray-600">
                                            Halaman {currentPage} dari {totalPages}
                                        </span>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                            disabled={currentPage === totalPages}
                                            className="h-8"
                                        >
                                            <ChevronRight className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Detail Dialog */}
            {selectedNotification && (
                <Dialog open={!!selectedNotification} onOpenChange={(open) => !open && setSelectedNotification(null)}>
                    <DialogContent className="max-w-lg">
                        <DialogHeader>
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2.5 rounded-xl ${typeConfig[selectedNotification.type]?.bg || "bg-gray-100"}`}>
                                        {(() => {
                                            const IconComponent = typeConfig[selectedNotification.type]?.icon || Info;
                                            return <IconComponent className={`w-5 h-5 ${typeConfig[selectedNotification.type]?.color || "text-gray-600"}`} />;
                                        })()}
                                    </div>
                                    <div>
                                        <DialogTitle className="text-lg">{selectedNotification.title}</DialogTitle>
                                        <p className="text-xs text-gray-500 mt-1">
                                            {format(new Date(selectedNotification.createdAt), "dd MMMM yyyy, HH:mm", { locale: idLocale })}
                                        </p>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => setSelectedNotification(null)}
                                >
                                    <Eye className="w-4 h-4" />
                                </Button>
                            </div>
                        </DialogHeader>

                        <div className="py-4">
                            <p className="text-sm text-gray-700 leading-relaxed">
                                {selectedNotification.message}
                            </p>

                            {selectedNotification.link && (
                                <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                                    <Link
                                        href={selectedNotification.link}
                                        className="flex items-center justify-between text-sm text-blue-700 hover:text-blue-800"
                                    >
                                        <span className="font-medium">Lihat detail</span>
                                        <ChevronRight className="w-4 h-4" />
                                    </Link>
                                </div>
                            )}
                        </div>

                        <DialogFooter className="gap-2 sm:gap-0">
                            <Button
                                variant="outline"
                                onClick={() => setDeleteDialog({ open: true, id: selectedNotification.id })}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Hapus
                            </Button>
                            {!selectedNotification.read && (
                                <Button
                                    onClick={() => {
                                        markAsRead(selectedNotification.id);
                                        setSelectedNotification({ ...selectedNotification, read: true });
                                    }}
                                    className="bg-blue-600 hover:bg-blue-700"
                                >
                                    <CheckCheck className="w-4 h-4 mr-2" />
                                    Tandai Dibaca
                                </Button>
                            )}
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}

            {/* Delete Confirmation */}
            <ModernConfirm
                open={deleteDialog.open}
                onOpenChange={(open) => setDeleteDialog({ open, id: null })}
                title="Hapus Notifikasi?"
                description="Apakah Anda yakin ingin menghapus notifikasi ini? Tindakan ini tidak dapat dibatalkan."
                onConfirm={() => deleteDialog.id && handleDelete(deleteDialog.id)}
                isLoading={isDeleting}
                confirmText="Ya, Hapus"
            />

            <ModernConfirm
                open={clearDialog}
                onOpenChange={setClearDialog}
                title="Bersihkan Semua Notifikasi?"
                description="Tindakan ini akan menghapus seluruh daftar notifikasi Anda secara permanen. Lanjutkan?"
                onConfirm={handleClearAll}
                isLoading={isDeleting}
                confirmText="Ya, Bersihkan Semua"
                variant="destructive"
            />
        </div>
    );
}

// Compact Table Row Component
function NotificationRow({
    notification,
    onClick,
    onDelete
}: {
    notification: any;
    onClick: () => void;
    onDelete: (id: string) => void;
}) {
    const config = typeConfig[notification.type] || typeConfig.INFO;
    const IconComponent = config.icon;
    const link = notification.link || config.defaultLink;

    return (
        <TableRow
            className={`cursor-pointer hover:bg-gray-50 transition-colors group ${!notification.read ? "bg-blue-50/50" : ""}`}
            onClick={() => {
                onClick();
                // Navigate to link
                window.location.href = link;
            }}
        >
            <TableCell className="py-3">
                <div className={`w-2 h-2 rounded-full ${!notification.read ? "bg-blue-500" : "bg-transparent"}`} />
            </TableCell>
            <TableCell className="py-3">
                <div className={`p-1.5 rounded-lg ${config.bg}`}>
                    <IconComponent className={`w-4 h-4 ${config.color}`} />
                </div>
            </TableCell>
            <TableCell className="py-3">
                <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium ${!notification.read ? "text-gray-900" : "text-gray-700"}`}>
                        {notification.title}
                    </span>
                    <Badge variant="outline" className={`text-[10px] h-5 ${config.bg} ${config.color} border-0 font-bold`}>
                        {config.label}
                    </Badge>
                </div>
                <p className="text-xs text-gray-500 mt-0.5 line-clamp-1 max-w-[400px]">
                    {notification.message}
                </p>
            </TableCell>
            <TableCell className="py-3">
                <span className="text-xs text-gray-500">
                    {format(new Date(notification.createdAt), "dd MMM yyyy, HH:mm", { locale: idLocale })}
                </span>
            </TableCell>
            <TableCell className="py-3">
                <Badge variant="outline" className={`text-[10px] h-5 ${!notification.read ? "bg-blue-100 text-blue-700 border-blue-200" : "bg-gray-100 text-gray-600 border-gray-200"}`}>
                    {!notification.read ? "Baru" : "Dibaca"}
                </Badge>
            </TableCell>
            <TableCell className="py-3">
                <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-gray-400 hover:text-red-600 hover:bg-red-50"
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete(notification.id);
                        }}
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                </div>
            </TableCell>
        </TableRow>
    );
}
