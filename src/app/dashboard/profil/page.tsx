"use client";

import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getUserProfile } from "@/app/actions/profile";
import {
    Loader2, User, Phone, Mail, Award, CheckCircle2, Store,
    Edit2, X, Save, Upload, AlertCircle
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ImageCropper } from "@/components/ui/image-cropper";
import { useToast, ToastManager } from "@/components/ui/toast";
import {
    updateProfileName,
    updateProfileAvatar,
    requestProfileUpdateOTP,
    verifyProfileUpdateOTP
} from "@/app/actions/profile-update";

export default function ProfilPage() {
    const { toasts, toast, removeToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<any>(null);
    const [isEditing, setIsEditing] = useState<{ [key: string]: boolean }>({
        name: false,
        email: false,
        phone: false
    });
    const [editValues, setEditValues] = useState<{ [key: string]: string }>({});
    const [saving, setSaving] = useState<string | null>(null);

    // OTP Dialog
    const [otpDialogOpen, setOtpDialogOpen] = useState(false);
    const [otpField, setOtpField] = useState<'email' | 'phone'>('email');
    const [otpValue, setOtpValue] = useState('');
    const [otpLoading, setOtpLoading] = useState(false);
    const [otpError, setOtpError] = useState('');
    const [otpSuccess, setOtpSuccess] = useState('');
    const [pendingValue, setPendingValue] = useState('');

    // Avatar upload
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
    const [cropperOpen, setCropperOpen] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const result = await getUserProfile();
                // @ts-ignore
                if (result.success) {
                    // @ts-ignore
                    setProfile(result.user);
                }
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
        );
    }

    if (!profile) {
        return <div className="p-6 text-center text-red-500">Gagal memuat profil.</div>;
    }

    const customerType = profile.customer?.type || "GENERAL";

    const handleEditToggle = (field: string) => {
        if (isEditing[field]) {
            setEditValues({ ...editValues, [field]: '' });
        } else {
            setEditValues({ ...editValues, [field]: profile[field] || '' });
        }
        setIsEditing({ ...isEditing, [field]: !isEditing[field] });
    };

    const handleSaveName = async () => {
        setSaving('name');
        try {
            const result = await updateProfileName(editValues.name);
            // @ts-ignore
            if (result.success) {
                setProfile({ ...profile, name: editValues.name });
                setIsEditing({ ...isEditing, name: false });
                toast.success("Nama berhasil disimpan");
            } else {
                // @ts-ignore
                toast.error(result.error || "Gagal menyimpan nama");
            }
        } catch (error) {
            console.error(error);
            toast.error("Terjadi kesalahan");
        } finally {
            setSaving(null);
        }
    };

    const handleRequestEmailPhoneUpdate = async (field: 'email' | 'phone') => {
        const newValue = editValues[field];

        if (!newValue) {
            toast.error("Field tidak boleh kosong");
            return;
        }

        // Basic validation
        if (field === 'email' && !newValue.includes('@')) {
            toast.error("Format email tidak valid");
            return;
        }

        if (field === 'phone' && newValue.length < 10) {
            toast.error("Nomor handphone tidak valid");
            return;
        }

        setSaving(field);
        try {
            const result = await requestProfileUpdateOTP(field, newValue);
            // @ts-ignore
            if (result.success) {
                setPendingValue(newValue);
                setOtpField(field);
                setOtpDialogOpen(true);
                setOtpError('');
                setOtpSuccess('');
                setOtpValue('');
                toast.success("Kode OTP telah dikirim");
            } else {
                // @ts-ignore
                toast.error(result.error || "Gagal mengirim OTP");
            }
        } catch (error) {
            console.error(error);
            toast.error("Terjadi kesalahan");
        } finally {
            setSaving(null);
        }
    };

    const handleVerifyOTP = async () => {
        setOtpLoading(true);
        try {
            const result = await verifyProfileUpdateOTP(otpValue);
            // @ts-ignore
            if (result.success) {
                setOtpSuccess(result.message);
                // Update profile
                if (otpField === 'email') {
                    setProfile({ ...profile, email: pendingValue });
                } else {
                    setProfile({ ...profile, phone: pendingValue });
                }
                setIsEditing({ ...isEditing, [otpField]: false });
                setTimeout(() => {
                    setOtpDialogOpen(false);
                }, 1500);
            } else {
                // @ts-ignore
                setOtpError(result.error || "OTP tidak valid");
            }
        } catch (error) {
            console.error(error);
            setOtpError("Terjadi kesalahan");
        } finally {
            setOtpLoading(false);
        }
    };

    const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            toast.error("Silakan pilih file gambar");
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            toast.error("Ukuran gambar tidak boleh lebih dari 5MB");
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            setSelectedImage(e.target?.result as string);
            setCropperOpen(true);
        };
        reader.readAsDataURL(file);
    };

    const handleCropComplete = async (blob: Blob) => {
        setIsUploadingAvatar(true);
        try {
            // Convert blob to base64
            const reader = new FileReader();
            reader.onloadend = async () => {
                const base64String = reader.result as string;

                // For now, we'll store the base64 directly
                // In production, you should upload to a storage service
                const result = await updateProfileAvatar(base64String);
                // @ts-ignore
                if (result.success) {
                    setProfile({
                        ...profile,
                        customer: { ...profile.customer, image: base64String }
                    });
                    toast.success("Avatar berhasil diubah");
                } else {
                    // @ts-ignore
                    toast.error(result.error || "Gagal upload avatar");
                }
                setIsUploadingAvatar(false);
            };
            reader.readAsDataURL(blob);
        } catch (error) {
            console.error(error);
            toast.error("Terjadi kesalahan saat upload avatar");
            setIsUploadingAvatar(false);
        }
    };

    const getAvatarUrl = () => {
        if (profile.customer?.image) {
            // If it's a base64 string
            if (profile.customer.image.startsWith('data:')) {
                return profile.customer.image;
            }
            // Otherwise assume it's a URL
            return profile.customer.image;
        }
        return null;
    };

    return (
        <div className="space-y-6">
            {/* Toast Notifications */}
            <ToastManager toasts={toasts} removeToast={removeToast} />

            {/* Avatar Section */}
            <Card className="border-gray-200">
                <CardContent className="p-6">
                    <div className="flex items-center gap-6">
                        <div className="relative">
                            <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 border-2 border-gray-200">
                                {getAvatarUrl() ? (
                                    <img
                                        src={getAvatarUrl()}
                                        alt="Avatar"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                                        <User className="w-12 h-12" />
                                    </div>
                                )}
                            </div>
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="absolute bottom-0 right-0 w-8 h-8 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center transition-colors shadow-md"
                                title="Ubah Avatar"
                            >
                                {isUploadingAvatar ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Upload className="w-4 h-4" />
                                )}
                            </button>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900">Foto Profil</h3>
                            <p className="text-sm text-gray-500 mt-1">
                                Klik ikon upload untuk mengubah foto profil
                            </p>
                            <p className="text-xs text-gray-400 mt-2">
                                Format: JPG, PNG (Max 5MB)
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarSelect}
                className="hidden"
            />

            {/* Image Cropper Dialog */}
            <ImageCropper
                imageSrc={selectedImage}
                open={cropperOpen}
                onOpenChange={setCropperOpen}
                onCropComplete={handleCropComplete}
                aspect={1}
            />

            {/* Profile Information */}
            <Card className="border-gray-200">
                <div className="p-6 border-b border-gray-100">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold text-gray-900">
                            Profil Pengguna
                        </h2>
                        <Badge variant="outline" className={`
                            text-sm px-3 py-1 font-semibold uppercase tracking-wide
                            ${customerType === "CORPORATE" ? "bg-blue-100 text-blue-700 border-blue-200" : ""}
                            ${customerType === "RETAIL" ? "bg-purple-100 text-purple-700 border-purple-200" : ""}
                            ${customerType === "GENERAL" ? "bg-gray-100 text-gray-700 border-gray-200" : ""}
                        `}>
                            {customerType === "CORPORATE" ? "PERUSAHAAN" : customerType === "RETAIL" ? "RETAIL / MITRA JUAL" : "GENERAL CUSTOMER"}
                        </Badge>
                    </div>
                </div>

                <CardContent className="p-6 space-y-6">
                    {/* Name */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                                <User className="w-4 h-4" /> Nama Lengkap
                            </Label>
                            {isEditing.name ? (
                                <div className="flex gap-2">
                                    <Input
                                        value={editValues.name || ''}
                                        onChange={(e) => setEditValues({ ...editValues, name: e.target.value })}
                                        className="flex-1"
                                        placeholder="Masukkan nama lengkap"
                                    />
                                    <Button
                                        size="sm"
                                        onClick={handleSaveName}
                                        disabled={saving === 'name'}
                                    >
                                        {saving === 'name' ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <Save className="w-4 h-4" />
                                        )}
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleEditToggle('name')}
                                    >
                                        <X className="w-4 h-4" />
                                    </Button>
                                </div>
                            ) : (
                                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                                    <span className="font-medium text-gray-900">{profile.name || "-"}</span>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => handleEditToggle('name')}
                                        className="h-8 w-8 p-0"
                                    >
                                        <Edit2 className="w-4 h-4 text-gray-400" />
                                    </Button>
                                </div>
                            )}
                        </div>

                        {/* Email */}
                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                                <Mail className="w-4 h-4" /> Email
                            </Label>
                            {isEditing.email ? (
                                <div className="flex gap-2">
                                    <Input
                                        value={editValues.email || profile.email || ''}
                                        onChange={(e) => setEditValues({ ...editValues, email: e.target.value })}
                                        className="flex-1"
                                        type="email"
                                        placeholder="Masukkan email"
                                    />
                                    <Button
                                        size="sm"
                                        onClick={() => handleRequestEmailPhoneUpdate('email')}
                                        disabled={saving === 'email'}
                                    >
                                        {saving === 'email' ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <CheckCircle2 className="w-4 h-4" />
                                        )}
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleEditToggle('email')}
                                    >
                                        <X className="w-4 h-4" />
                                    </Button>
                                </div>
                            ) : (
                                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                                    <span className="font-medium text-gray-900">{profile.email}</span>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => handleEditToggle('email')}
                                        className="h-8 w-8 p-0"
                                    >
                                        <Edit2 className="w-4 h-4 text-gray-400" />
                                    </Button>
                                </div>
                            )}
                        </div>

                        {/* Phone */}
                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                                <Phone className="w-4 h-4" /> No. Handphone
                            </Label>
                            {isEditing.phone ? (
                                <div className="flex gap-2">
                                    <Input
                                        value={editValues.phone || profile.phone || ''}
                                        onChange={(e) => setEditValues({ ...editValues, phone: e.target.value })}
                                        className="flex-1"
                                        type="tel"
                                        placeholder="Masukkan nomor handphone"
                                    />
                                    <Button
                                        size="sm"
                                        onClick={() => handleRequestEmailPhoneUpdate('phone')}
                                        disabled={saving === 'phone'}
                                    >
                                        {saving === 'phone' ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <CheckCircle2 className="w-4 h-4" />
                                        )}
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleEditToggle('phone')}
                                    >
                                        <X className="w-4 h-4" />
                                    </Button>
                                </div>
                            ) : (
                                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                                    <span className="font-medium text-gray-900">{profile.phone || "-"}</span>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => handleEditToggle('phone')}
                                        className="h-8 w-8 p-0"
                                    >
                                        <Edit2 className="w-4 h-4 text-gray-400" />
                                    </Button>
                                </div>
                            )}
                        </div>

                        {/* Customer Type - Read Only */}
                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                                <Award className="w-4 h-4" /> Tipe Customer
                            </Label>
                            <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 font-medium text-gray-900">
                                {customerType}
                            </div>
                        </div>
                    </div>

                    {/* Company */}
                    {profile.customer?.company && (
                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                                <Store className="w-4 h-4" /> Perusahaan
                            </Label>
                            <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 font-medium text-gray-900">
                                {profile.customer.company}
                            </div>
                        </div>
                    )}

                    {/* Address Summary with Link */}
                    <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-500">Alamat Terdaftar</Label>
                        <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                            {profile.customer?.address || profile.customer?.city ? (
                                <div className="space-y-1">
                                    <p className="font-medium text-gray-900">{profile.customer?.address || "-"}</p>
                                    <p className="text-sm text-gray-600">
                                        {[
                                            profile.customer?.city,
                                            profile.customer?.district,
                                            profile.customer?.province,
                                            profile.customer?.postalCode
                                        ].filter(Boolean).join(', ') || '-'}
                                    </p>
                                </div>
                            ) : (
                                <p className="text-gray-400 text-sm">Belum ada alamat terdaftar</p>
                            )}
                        </div>
                        <Link href="/dashboard/alamat">
                            <Button variant="outline" size="sm" className="w-full sm:w-auto mt-2">
                                <Edit2 className="w-4 h-4 mr-2" />
                                Lihat & Kelola Alamat Terdaftar
                            </Button>
                        </Link>
                    </div>
                </CardContent>
            </Card>

            {/* OTP Verification Dialog */}
            <Dialog open={otpDialogOpen} onOpenChange={setOtpDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Verifikasi {otpField === 'email' ? 'Email' : 'Nomor Handphone'}</DialogTitle>
                    </DialogHeader>

                    {otpSuccess && (
                        <Alert className="bg-green-50 border-green-200 text-green-700">
                            <CheckCircle2 className="h-4 w-4" />
                            <AlertDescription>{otpSuccess}</AlertDescription>
                        </Alert>
                    )}

                    {otpError && (
                        <Alert className="bg-red-50 border-red-200 text-red-700">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{otpError}</AlertDescription>
                        </Alert>
                    )}

                    <div className="space-y-4 py-4">
                        <p className="text-sm text-gray-600">
                            Kode OTP telah dikirim ke {otpField === 'email' ? 'email baru Anda' : 'nomor handphone baru Anda'}.
                            Masukkan kode untuk melanjutkan perubahan.
                        </p>
                        <div className="space-y-2">
                            <Label htmlFor="otp">Kode OTP</Label>
                            <Input
                                id="otp"
                                value={otpValue}
                                onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                placeholder="Masukkan 6 digit kode"
                                className="text-center text-lg tracking-widest"
                                maxLength={6}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setOtpDialogOpen(false)}
                            disabled={otpLoading}
                        >
                            Batal
                        </Button>
                        <Button
                            onClick={handleVerifyOTP}
                            disabled={otpLoading || otpValue.length !== 6}
                        >
                            {otpLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Verifikasi
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
