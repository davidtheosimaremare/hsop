import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { Users, Building2, UserPlus, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function ManageTeamPage() {
    const session = await getSession();

    if (!session?.user?.email) {
        redirect("/masuk");
    }

    // Fetch User and Customer Data
    const user = await db.user.findUnique({
        where: { email: session.user.email },
        include: { customer: true }
    });

    if (!user) {
        redirect("/masuk");
    }

    const isCompany = user.customer?.type === "BISNIS";
    const customer = user.customer;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Kelola Tim</h1>
                    <p className="text-gray-500">Atur akses dan anggota tim Anda.</p>
                </div>
                {/* Action Button */}
                {isCompany ? (
                    <Button className="bg-red-600 hover:bg-red-700 text-white gap-2">
                        <UserPlus className="w-4 h-4" />
                        Tambah Anggota
                    </Button>
                ) : (
                    <Link href="/dashboard/settings">
                        <Button variant="outline" className="gap-2 border-red-600 text-red-600 hover:bg-red-50">
                            <Building2 className="w-4 h-4" />
                            Ubah ke Akun Perusahaan
                        </Button>
                    </Link>
                )}
            </div>

            {/* Content */}
            {!isCompany ? (
                // Personal Account View (Upgrade CTA)
                <div className="bg-white rounded-xl border border-gray-200 p-8 text-center max-w-2xl mx-auto mt-8">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Users className="w-8 h-8 text-red-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                        Kolaborasi Lebih Mudah dengan Akun Perusahaan
                    </h3>
                    <p className="text-gray-500 mb-8 max-w-md mx-auto">
                        Fitur manajemen tim hanya tersedia untuk akun perusahaan.
                        Upgrade akun Anda sekarang untuk menambahkan anggota tim, mengatur akses, dan berbagi project.
                    </p>

                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-left max-w-lg mx-auto mb-8">
                        <div className="flex gap-3">
                            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                            <div className="space-y-1">
                                <p className="text-sm font-semibold text-blue-900">Manfaat Akun Perusahaan:</p>
                                <ul className="text-sm text-blue-800 list-disc ml-4 space-y-0.5">
                                    <li>Multi-login (Satu akun untuk banyak user)</li>
                                    <li>Pengaturan peran & akses (Admin, Purchasing, Finance)</li>
                                    <li>Sharing keranjang & invoice</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <Link href="/dashboard/settings">
                        <Button className="bg-red-600 hover:bg-red-700 text-white px-8 h-11 text-base">
                            Ubah menjadi Akun Perusahaan
                        </Button>
                    </Link>
                </div>
            ) : (
                // Company Account View (Team List - Mock)
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <div className="p-6 border-b border-gray-100">
                        <h3 className="font-semibold text-gray-900">Daftar Anggota Tim ({customer?.name || "Perusahaan"})</h3>
                    </div>

                    {/* Table Header */}
                    <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        <div className="col-span-5">Nama & Email</div>
                        <div className="col-span-3">Role</div>
                        <div className="col-span-2">Status</div>
                        <div className="col-span-2 text-right">Aksi</div>
                    </div>

                    {/* Mock Item */}
                    <div className="divide-y divide-gray-100">
                        <div className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-gray-50 transition-colors">
                            <div className="col-span-5">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center text-teal-600 font-bold">
                                        {user?.name?.charAt(0) || "U"}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">{user?.name || "Member"}</p>
                                        <p className="text-xs text-gray-500">{user?.email}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="col-span-3">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                    Owner / Admin
                                </span>
                            </div>
                            <div className="col-span-2">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    Aktif
                                </span>
                            </div>
                            <div className="col-span-2 text-right">
                                <Button variant="ghost" size="sm" className="text-gray-400 hover:text-gray-600" disabled>
                                    Kelola
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Empty State / More info */}
                    <div className="p-8 text-center border-t border-gray-100">
                        <p className="text-sm text-gray-500">
                            Fitur manajemen user lengkap akan segera hadir.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
