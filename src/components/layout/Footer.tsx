import Link from "next/link";
import Image from "next/image";
import { Phone, Mail, MapPin, Instagram, Facebook, Linkedin } from "lucide-react";
import { getSiteSetting } from "@/app/actions/settings";

const defaultFooterConfig = {
    contacts: {
        whatsapp: "+62 812 6222 0021",
        call_center: "(021) 385 7057",
        email: "sales@hokiindo.com",
        address: "Jl. Cideng Timur No. 66\nPetojo Selatan, Jakarta Pusat",
    },
    socials: {
        instagram: "",
        facebook: "",
        linkedin: "",
        tiktok: "",
    },
    links: {
        umum: [
            { name: "Berita Juragan", href: "#" },
            { name: "Tentang Kami", href: "#" },
            { name: "Hubungi Kami", href: "#" },
            { name: "Karir", href: "#" },
        ],
        informasi: [
            { name: "FAQ", href: "#" },
            { name: "Kemitraan", href: "#" },
            { name: "Brand Terdaftar", href: "#" },
        ],
        ketentuan: [
            { name: "Syarat & Ketentuan", href: "#" },
            { name: "Kebijakan Privasi", href: "#" },
        ],
    },
};

export default async function Footer() {
    let config = defaultFooterConfig;
    try {
        const settings = await getSiteSetting("footer_config");
        if (settings && typeof settings === 'object') {
            config = { ...defaultFooterConfig, ...settings };
        }
    } catch (e) {
        console.error("Failed to load footer settings:", e);
    }

    return (
        <footer className="w-full bg-white border-t border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-12">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8">
                    {/* Contact Info */}
                    <div className="lg:col-span-2">
                        {/* Logo */}
                        <Image
                            src="/logo.png"
                            alt="Hokiindo Logo"
                            width={140}
                            height={45}
                            className="h-10 w-auto object-contain mb-6"
                        />

                        {/* Contact Details */}
                        <div className="space-y-4">
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 bg-teal-50 rounded-full flex items-center justify-center flex-shrink-0">
                                    <svg className="w-4 h-4 text-teal-600" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Whatsapp</p>
                                    <p className="text-sm font-medium text-gray-900">{config.contacts.whatsapp}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 bg-teal-50 rounded-full flex items-center justify-center flex-shrink-0">
                                    <Phone className="w-4 h-4 text-teal-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Call Center</p>
                                    <p className="text-sm font-medium text-gray-900">{config.contacts.call_center}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 bg-teal-50 rounded-full flex items-center justify-center flex-shrink-0">
                                    <Mail className="w-4 h-4 text-teal-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Email</p>
                                    <p className="text-sm font-medium text-gray-900">{config.contacts.email}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 bg-teal-50 rounded-full flex items-center justify-center flex-shrink-0">
                                    <MapPin className="w-4 h-4 text-teal-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Alamat</p>
                                    <p className="text-sm font-medium text-gray-900 whitespace-pre-line">
                                        {config.contacts.address}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Umum */}
                    <div>
                        <h4 className="font-semibold text-gray-900 mb-4">Umum</h4>
                        <ul className="space-y-2.5">
                            {config.links.umum.map((link: any, idx: number) => (
                                <li key={idx}>
                                    <Link href={link.href} className="text-sm text-gray-600 hover:text-teal-600 transition-colors">
                                        {link.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Informasi */}
                    <div>
                        <h4 className="font-semibold text-gray-900 mb-4">Informasi</h4>
                        <ul className="space-y-2.5">
                            {config.links.informasi.map((link: any, idx: number) => (
                                <li key={idx}>
                                    <Link href={link.href} className="text-sm text-gray-600 hover:text-teal-600 transition-colors">
                                        {link.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Ketentuan */}
                    <div>
                        <h4 className="font-semibold text-gray-900 mb-4">Ketentuan</h4>
                        <ul className="space-y-2.5">
                            {config.links.ketentuan.map((link: any, idx: number) => (
                                <li key={idx}>
                                    <Link href={link.href} className="text-sm text-gray-600 hover:text-teal-600 transition-colors">
                                        {link.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Social Links */}
                    <div>
                        <h4 className="font-semibold text-gray-900 mb-4">Ikuti Kami di</h4>
                        <div className="flex items-center gap-3">
                            {config.socials.instagram && (
                                <a href={config.socials.instagram} target="_blank" rel="noopener noreferrer" className="w-9 h-9 border border-gray-300 rounded-full flex items-center justify-center hover:border-teal-600 hover:text-teal-600 transition-colors">
                                    <Instagram className="w-4 h-4" />
                                </a>
                            )}
                            {config.socials.facebook && (
                                <a href={config.socials.facebook} target="_blank" rel="noopener noreferrer" className="w-9 h-9 border border-gray-300 rounded-full flex items-center justify-center hover:border-teal-600 hover:text-teal-600 transition-colors">
                                    <Facebook className="w-4 h-4" />
                                </a>
                            )}
                            {config.socials.linkedin && (
                                <a href={config.socials.linkedin} target="_blank" rel="noopener noreferrer" className="w-9 h-9 border border-gray-300 rounded-full flex items-center justify-center hover:border-teal-600 hover:text-teal-600 transition-colors">
                                    <Linkedin className="w-4 h-4" />
                                </a>
                            )}
                            {config.socials.tiktok && (
                                <a href={config.socials.tiktok} target="_blank" rel="noopener noreferrer" className="w-9 h-9 border border-gray-300 rounded-full flex items-center justify-center hover:border-teal-600 hover:text-teal-600 transition-colors">
                                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
                                    </svg>
                                </a>
                            )}
                        </div>

                        <div className="mt-8">
                            <h4 className="font-semibold text-gray-900 mb-4">Authorized Distributor</h4>
                            <Image
                                src="/siemens-auth.png"
                                alt="Siemens Authorized Distributor"
                                width={150}
                                height={80}
                                className="object-contain"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Copyright */}
            <div className="border-t border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <p className="text-center text-sm text-gray-500">
                        © 2026 PT. Hokiindo Raya. All Rights Reserved
                    </p>
                </div>
            </div>
        </footer>
    );
}
