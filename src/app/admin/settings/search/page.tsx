import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { SearchSettingActions } from "@/components/admin/SearchSettingActions";

export default async function SearchSettingsPage() {
    const suggestions = await db.searchSuggestion.findMany({
        orderBy: { count: 'desc' },
    });

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Pengaturan Pencarian</h1>
                <p className="text-sm text-gray-500">Kelola kata kunci saran pencarian.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Daftar Kata Kunci</CardTitle>
                        <CardDescription>Kata kunci yang akan muncul di saran pencarian.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Kata Kunci</TableHead>
                                    <TableHead className="text-center">Hitungan</TableHead>
                                    <TableHead className="text-right">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {suggestions.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center py-4 text-gray-500">
                                            Belum ada data.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    suggestions.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell className="font-medium">{item.term}</TableCell>
                                            <TableCell className="text-center">{item.count}</TableCell>
                                            <TableCell className="text-right">
                                                <SearchSettingActions id={item.id} action="delete" />
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                <Card className="h-fit">
                    <CardHeader>
                        <CardTitle>Tambah Kata Kunci</CardTitle>
                        <CardDescription>Tambahkan kata kunci baru secara manual.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <SearchSettingActions action="create" />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
