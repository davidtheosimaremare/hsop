"use client";

import { useState, useEffect } from "react";
import { X, Mail, Phone, Loader2, CheckCircle, MapPin, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { submitCartQuotation, saveQuotationToDb } from "@/app/actions/cart";
import { useCart } from "@/lib/useCart";
import Image from "next/image";

interface GuestCheckoutModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    user?: any;
    refreshUser?: () => Promise<void>;
}

export default function GuestCheckoutModal({ isOpen, onClose, onSuccess, user, refreshUser }: GuestCheckoutModalProps) {
    const { items, totalPrice, clearCart } = useCart();
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [isSuccess, setIsSuccess] = useState(false);
    const [showLoginCta, setShowLoginCta] = useState(true);

    // Structured Address State
    const [recipientName, setRecipientName] = useState("");
    const [recipientPhone, setRecipientPhone] = useState("");
    const [street, setStreet] = useState("");
    const [province, setProvince] = useState({ id: "", name: "" });
    const [city, setCity] = useState({ id: "", name: "" });
    const [district, setDistrict] = useState({ id: "", name: "" });
    const [postalCode, setPostalCode] = useState("");
    const [saveAddress, setSaveAddress] = useState(true);

    const handleUseMyInfo = () => {
        if (user) {
            setRecipientName(user.name || "");
            setRecipientPhone(user.phone || "");
        }
    };

    // Regions Data State
    const [provinces, setProvinces] = useState<any[]>([]);
    const [cities, setCities] = useState<any[]>([]);
    const [districts, setDistricts] = useState<any[]>([]);
    const [isLoadingRegions, setIsLoadingRegions] = useState(false);

    const formatPrice = (price: number) => new Intl.NumberFormat("id-ID").format(Math.round(price));

    // Fetch Provinces
    useEffect(() => {
        if (!isOpen) return;
        const fetchProvinces = async () => {
            try {
                const res = await fetch("https://www.emsifa.com/api-wilayah-indonesia/api/provinces.json");
                const data = await res.json();
                setProvinces(data);
            } catch (err) {
                console.error("Failed to fetch provinces", err);
            }
        };
        fetchProvinces();
    }, [isOpen]);

    // Fetch Cities
    useEffect(() => {
        if (!province.id) {
            setCities([]);
            setCity({ id: "", name: "" });
            return;
        }
        const fetchCities = async () => {
            setIsLoadingRegions(true);
            try {
                const res = await fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${province.id}.json`);
                const data = await res.json();
                setCities(data);
            } catch (err) {
                console.error("Failed to fetch cities", err);
            } finally {
                setIsLoadingRegions(false);
            }
        };
        fetchCities();
    }, [province.id]);

    // Fetch Districts
    useEffect(() => {
        if (!city.id) {
            setDistricts([]);
            setDistrict({ id: "", name: "" });
            return;
        }
        const fetchDistricts = async () => {
            setIsLoadingRegions(true);
            try {
                const res = await fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/districts/${city.id}.json`);
                const data = await res.json();
                setDistricts(data);
            } catch (err) {
                console.error("Failed to fetch districts", err);
            } finally {
                setIsLoadingRegions(false);
            }
        };
        fetchDistricts();
    }, [city.id]);


    const isFormValid = user
        ? (recipientName.trim() && recipientPhone.trim() && street.trim().length >= 5 && province.id && city.id && district.id && postalCode.trim().length >= 5)
        : (email.indexOf("@") > 0 && phone.length >= 8 && recipientName.trim() && recipientPhone.trim() && street.trim().length >= 5 && province.id && city.id && district.id && postalCode.trim().length >= 5);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isFormValid) return;

        setError("");
        setIsSubmitting(true);

        const cartItems = items.map(item => {
            let readyStock = 0;
            let indent = 0;

            if (item.availableToSell > 0) {
                if (item.quantity <= item.availableToSell) {
                    readyStock = item.quantity;
                } else {
                    readyStock = item.availableToSell;
                    indent = item.quantity - item.availableToSell;
                }
            } else {
                indent = item.quantity;
            }

            return {
                sku: item.sku,
                name: item.name,
                brand: item.brand,
                price: item.price,
                quantity: item.quantity,
                readyStock,
                indent,
                originalPrice: item.originalPrice,
                discountStr: item.discountStr
            };
        });

        const fullAddress = `${street}, ${district.name}, ${city.name}, ${province.name}, ${postalCode} (UP: ${recipientName} - ${recipientPhone})`.replace(/, ,/g, ',').trim();

        let result;
        if (user) {
            result = await saveQuotationToDb(cartItems, totalPrice, 'PENDING', undefined, undefined, fullAddress);

            // If saveAddress is true, we should save it to CustomerAddress via action if possible
            if (saveAddress && result.success) {
                const { addUserAddress } = await import("@/app/actions/address");
                const fd = new FormData();
                fd.append("address", fullAddress);
                fd.append("label", "Alamat Checkout");
                fd.append("recipient", recipientName);
                fd.append("phone", recipientPhone);
                // The backend handles isPrimary boolean from strings parsing like "on" or we can omit it if it's false default

                await addUserAddress(fd);
            }
        } else {
            result = await submitCartQuotation(email, phone, cartItems, totalPrice, fullAddress);
        }

        setIsSubmitting(false);

        if (result.success) {
            setIsSuccess(true);
            setTimeout(() => {
                clearCart();
                if (refreshUser) refreshUser();
                onSuccess();
                onClose();
            }, 2000);
        } else {
            setError(result.error || "Terjadi kesalahan");
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="bg-red-600 text-white px-5 py-3 flex items-center justify-between">
                    <h2 className="text-lg font-bold">Request for Quotation</h2>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {isSuccess ? (
                    <div className="p-8 text-center">
                        <CheckCircle className="w-14 h-14 text-green-500 mx-auto mb-3" />
                        <h3 className="text-lg font-bold text-gray-900 mb-1">Permintaan Terkirim!</h3>
                        <p className="text-sm text-gray-600">
                            Tim sales kami akan menghubungi Anda segera.
                        </p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="flex flex-col max-h-[calc(90vh-52px)]">
                        <div className="p-5 overflow-y-auto space-y-4 flex-1">
                            {/* Cart Items Summary */}
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <h3 className="text-sm font-semibold text-gray-900">Produk ({items.length})</h3>
                                    <span className="font-bold text-red-600">Rp {formatPrice(totalPrice)}</span>
                                </div>
                                <div className="space-y-1.5 max-h-32 overflow-y-auto bg-gray-50 rounded-lg p-2">
                                    {items.map((item) => (
                                        <div key={item.id} className="flex items-center gap-2 text-xs">
                                            <div className="w-8 h-8 bg-white rounded flex-shrink-0 relative overflow-hidden border">
                                                {item.image ? (
                                                    <Image src={item.image} alt={item.name} fill className="object-contain p-0.5" />
                                                ) : (
                                                    <div className="w-full h-full bg-gray-200" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-gray-900 line-clamp-1">{item.name}</p>
                                            </div>
                                            <span className="text-gray-500">{item.quantity}x</span>
                                            <span className="font-medium text-gray-900">Rp {formatPrice(item.price * item.quantity)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-4">
                                {!user && (
                                    <div className="space-y-3">
                                        <h3 className="text-sm font-semibold text-gray-900">Informasi Kontak</h3>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="relative">
                                                <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                <input
                                                    type="email"
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                    placeholder="Email *"
                                                    required
                                                    className="w-full pl-8 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                                                />
                                            </div>
                                            <div className="relative">
                                                <Phone className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                <input
                                                    type="tel"
                                                    value={phone}
                                                    onChange={(e) => setPhone(e.target.value)}
                                                    placeholder="No. HP *"
                                                    required
                                                    className="w-full pl-8 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-3">
                                    <div className="flex items-center justify-between mb-1">
                                        <h3 className="text-sm font-semibold text-gray-900">Alamat Pengiriman</h3>
                                        {user && (
                                            <button
                                                type="button"
                                                onClick={handleUseMyInfo}
                                                className="text-[10px] font-bold text-red-600 hover:text-red-700 bg-red-50 px-2 py-1 rounded border border-red-100 transition-colors"
                                            >
                                                Gunakan data saya
                                            </button>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <input
                                            type="text"
                                            value={recipientName}
                                            onChange={(e) => setRecipientName(e.target.value)}
                                            placeholder="Nama Penerima *"
                                            required
                                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none h-9"
                                        />
                                        <input
                                            type="tel"
                                            value={recipientPhone}
                                            onChange={(e) => setRecipientPhone(e.target.value)}
                                            placeholder="No. HP Penerima *"
                                            required
                                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none h-9"
                                        />
                                    </div>

                                    <div className="relative">
                                        <textarea
                                            value={street}
                                            onChange={(e) => setStreet(e.target.value)}
                                            placeholder="Masukan alamat lengkap Jl, Gedung, Rumah atau dll. *"
                                            required
                                            rows={2}
                                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none resize-none"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="relative">
                                            <select
                                                value={province.id}
                                                onChange={(e) => {
                                                    const selected = provinces.find(p => p.id === e.target.value);
                                                    setProvince(selected ? { id: selected.id, name: selected.name } : { id: "", name: "" });
                                                }}
                                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none appearance-none bg-white pr-8 text-xs h-9"
                                                required
                                            >
                                                <option value="">Provinsi *</option>
                                                {provinces.map(p => (
                                                    <option key={p.id} value={p.id}>{p.name}</option>
                                                ))}
                                            </select>
                                            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                        </div>

                                        <div className="relative">
                                            <select
                                                value={city.id}
                                                onChange={(e) => {
                                                    const selected = cities.find(c => c.id === e.target.value);
                                                    setCity(selected ? { id: selected.id, name: selected.name } : { id: "", name: "" });
                                                }}
                                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none appearance-none bg-white pr-8 text-xs h-9 disabled:bg-gray-50"
                                                required
                                                disabled={!province.id || isLoadingRegions}
                                            >
                                                <option value="">Kabupaten/Kota *</option>
                                                {cities.map(c => (
                                                    <option key={c.id} value={c.id}>{c.name}</option>
                                                ))}
                                            </select>
                                            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="relative">
                                            <select
                                                value={district.id}
                                                onChange={(e) => {
                                                    const selected = districts.find(d => d.id === e.target.value);
                                                    setDistrict(selected ? { id: selected.id, name: selected.name } : { id: "", name: "" });
                                                }}
                                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none appearance-none bg-white pr-8 text-xs h-9 disabled:bg-gray-50"
                                                required
                                                disabled={!city.id || isLoadingRegions}
                                            >
                                                <option value="">Kecamatan *</option>
                                                {districts.map(d => (
                                                    <option key={d.id} value={d.id}>{d.name}</option>
                                                ))}
                                            </select>
                                            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                        </div>

                                        <div className="relative">
                                            <input
                                                type="text"
                                                value={postalCode}
                                                onChange={(e) => setPostalCode(e.target.value)}
                                                placeholder="Kode Pos *"
                                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none h-9"
                                                required
                                            />
                                        </div>
                                    </div>

                                    {user && (
                                        <div className="flex items-center gap-2 pt-1 border-t border-gray-100 mt-2">
                                            <input
                                                type="checkbox"
                                                id="saveAddress"
                                                checked={saveAddress}
                                                onChange={(e) => setSaveAddress(e.target.checked)}
                                                className="w-4 h-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                                            />
                                            <label htmlFor="saveAddress" className="text-[10px] text-gray-600 cursor-pointer select-none">
                                                Simpan alamat untuk memudahkan transaksi berikutnya
                                            </label>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {error && (
                                <div className="p-2 bg-red-50 border border-red-200 rounded-lg text-red-600 text-xs">
                                    {error}
                                </div>
                            )}

                            <p className="text-[11px] text-gray-500">
                                Harga belum termasuk ongkos kirim. Tim sales akan menghubungi Anda secepatnya.
                            </p>

                            {/* Login/Register CTA - Dismissable - Only for Guests */}
                            {showLoginCta && !user && (
                                <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-lg p-3 border border-red-100 relative">
                                    <button
                                        type="button"
                                        onClick={() => setShowLoginCta(false)}
                                        className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                    <p className="text-xs font-medium text-gray-800 mb-1 pr-4">
                                        💡 Ingin transaksi tersimpan otomatis?
                                    </p>
                                    <p className="text-[11px] text-gray-600 mb-2">
                                        Daftar untuk tidak perlu isi data berulang & dapatkan <span className="font-semibold text-red-600">diskon spesial</span>!
                                    </p>
                                    <div className="flex gap-2">
                                        <a
                                            href="/masuk"
                                            className="flex-1 text-center py-1.5 text-xs font-medium text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
                                        >
                                            Masuk
                                        </a>
                                        <a
                                            href="/daftar"
                                            className="flex-1 text-center py-1.5 text-xs font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                                        >
                                            Daftar Sekarang
                                        </a>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="px-5 py-3 bg-gray-50 border-t flex gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={onClose}
                                className="flex-1 h-9 text-sm"
                            >
                                Batal
                            </Button>
                            <Button
                                type="submit"
                                disabled={isSubmitting || !isFormValid}
                                className="flex-1 h-9 text-sm bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
                                        Mengirim...
                                    </>
                                ) : (
                                    "Kirim Permintaan"
                                )}
                            </Button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
