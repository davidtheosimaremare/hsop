import Image from "next/image";
import { Phone, Mail, MapPin } from "lucide-react";

const footerLinks = {
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
};

export default function Footer() {
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
                                    <p className="text-sm font-medium text-gray-900">+62 812 6222 0021</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 bg-teal-50 rounded-full flex items-center justify-center flex-shrink-0">
                                    <Phone className="w-4 h-4 text-teal-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Call Center</p>
                                    <p className="text-sm font-medium text-gray-900">(021) 385 7057</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 bg-teal-50 rounded-full flex items-center justify-center flex-shrink-0">
                                    <Mail className="w-4 h-4 text-teal-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Email</p>
                                    <p className="text-sm font-medium text-gray-900">sales@hokiindo.com</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 bg-teal-50 rounded-full flex items-center justify-center flex-shrink-0">
                                    <MapPin className="w-4 h-4 text-teal-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Alamat</p>
                                    <p className="text-sm font-medium text-gray-900">
                                        Jl. Cideng Timur No. 66<br />
                                        Petojo Selatan, Jakarta Pusat
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Umum */}
                    <div>
                        <h4 className="font-semibold text-gray-900 mb-4">Umum</h4>
                        <ul className="space-y-2.5">
                            {footerLinks.umum.map((link) => (
                                <li key={link.name}>
                                    <a href={link.href} className="text-sm text-gray-600 hover:text-teal-600 transition-colors">
                                        {link.name}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Informasi */}
                    <div>
                        <h4 className="font-semibold text-gray-900 mb-4">Informasi</h4>
                        <ul className="space-y-2.5">
                            {footerLinks.informasi.map((link) => (
                                <li key={link.name}>
                                    <a href={link.href} className="text-sm text-gray-600 hover:text-teal-600 transition-colors">
                                        {link.name}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Ketentuan */}
                    <div>
                        <h4 className="font-semibold text-gray-900 mb-4">Ketentuan</h4>
                        <ul className="space-y-2.5">
                            {footerLinks.ketentuan.map((link) => (
                                <li key={link.name}>
                                    <a href={link.href} className="text-sm text-gray-600 hover:text-teal-600 transition-colors">
                                        {link.name}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Social Links */}
                    <div>
                        <h4 className="font-semibold text-gray-900 mb-4">Ikuti Kami di</h4>
                        <div className="flex items-center gap-3">
                            <a href="#" className="w-9 h-9 border border-gray-300 rounded-full flex items-center justify-center hover:border-teal-600 hover:text-teal-600 transition-colors">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                                </svg>
                            </a>
                            <a href="#" className="w-9 h-9 border border-gray-300 rounded-full flex items-center justify-center hover:border-teal-600 hover:text-teal-600 transition-colors">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                                </svg>
                            </a>
                            <a href="#" className="w-9 h-9 border border-gray-300 rounded-full flex items-center justify-center hover:border-teal-600 hover:text-teal-600 transition-colors">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                                </svg>
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            {/* Copyright */}
            <div className="border-t border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <p className="text-center text-sm text-gray-500">
                        © 2026 PT. Hokiindo Perkasa. All Rights Reserved
                    </p>
                </div>
            </div>
        </footer>
    );
}
