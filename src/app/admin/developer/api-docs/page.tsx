"use client";

import { useState } from "react";
import {
  Code2, Copy, Check, ChevronDown, ChevronRight,
  Lock, Key, Smartphone, ShoppingBag, Tag, LayoutList,
  FileText, Send, Zap, Shield, Bell
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────
interface Endpoint {
  method: "GET" | "POST" | "PUT" | "DELETE";
  path: string;
  description: string;
  auth: "api-key" | "api-key+jwt";
  requestBody?: object;
  response: object;
  params?: { name: string; type: string; required: boolean; description: string }[];
}

interface Section {
  id: string;
  icon: React.ReactNode;
  title: string;
  color: string;
  bgColor: string;
  endpoints: Endpoint[];
}

// ─── Data ────────────────────────────────────────────────────────────────────
const BASE_URL = typeof window !== "undefined"
  ? `${window.location.protocol}//${window.location.host}`
  : "https://yourdomain.com";

const API_SECTIONS: Section[] = [
  {
    id: "auth",
    icon: <Shield className="w-5 h-5" />,
    title: "Autentikasi",
    color: "text-violet-600",
    bgColor: "bg-violet-50 border-violet-200",
    endpoints: [
      {
        method: "POST",
        path: "/api/mobile/auth/google",
        description: "Login atau Daftar menggunakan Google Sign-In. Menerima idToken dari client dan merespon dengan JWT token mobile.",
        auth: "api-key",
        requestBody: { idToken: "eyJhbGciOiJSU..." },
        response: { success: true, token: "<jwt_token>", user: { id: "...", name: "Budi", email: "budi@gmail.com", role: "CUSTOMER" } },
      },
      {
        method: "POST",
        path: "/api/mobile/auth/phone/request",
        description: "Meminta pengiriman kode OTP via WhatsApp. Sistem akan membuat akun dummy jika nomor belum terdaftar.",
        auth: "api-key",
        requestBody: { phone: "08123456789" },
        response: { success: true, message: "OTP berhasil dikirim ke WhatsApp Anda.", phone: "628123456789" },
      },
      {
        method: "POST",
        path: "/api/mobile/auth/phone/verify",
        description: "Memverifikasi kode OTP. Mengembalikan JWT token dan indikator apakah profil perlu dilengkapi (needsOnboarding).",
        auth: "api-key",
        requestBody: { phone: "08123456789", otp: "123456" },
        response: { success: true, token: "<jwt_token>", user: { id: "...", phone: "628123456789" }, needsOnboarding: true },
      },
      {
        method: "POST",
        path: "/api/mobile/auth/onboarding",
        description: "Melengkapi profil pengguna (setelah login dengan HP/Google). Menyinkronkan data ke Accurate dan memperbarui token.",
        auth: "api-key+jwt",
        requestBody: { isCompany: "false", name: "Budi", address: "Jakarta", phone: "08123456789" },
        response: { success: true, token: "<new_jwt_token>", user: { id: "...", customerId: "CO-0001" } },
      },
      {
        method: "POST",
        path: "/api/mobile/auth/register",
        description: "Daftarkan akun baru. Mengembalikan JWT token untuk digunakan di request selanjutnya.",
        auth: "api-key",
        requestBody: { name: "Budi Santoso", email: "budi@example.com", password: "password123", phone: "08123456789", company: "PT. Contoh" },
        response: { success: true, token: "<jwt_token>", user: { id: "...", name: "Budi Santoso", email: "budi@example.com", role: "CUSTOMER" } },
      },
      {
        method: "POST",
        path: "/api/mobile/auth/login",
        description: "Login dengan email dan password. Mendapatkan JWT token yang berlaku 30 hari.",
        auth: "api-key",
        requestBody: { email: "budi@example.com", password: "password123" },
        response: { success: true, token: "<jwt_token>", user: { id: "...", name: "Budi Santoso", customer: { discountCP: "10+5" } } },
      },
      {
        method: "GET",
        path: "/api/mobile/auth/me",
        description: "Mendapatkan profil user yang sedang login berdasarkan JWT token.",
        auth: "api-key+jwt",
        response: { success: true, user: { id: "...", name: "Budi Santoso", email: "budi@example.com", customer: { discountCP: "10+5", discountLP: "0" } } },
      },
    ],
  },
  {
    id: "products",
    icon: <ShoppingBag className="w-5 h-5" />,
    title: "Produk",
    color: "text-blue-600",
    bgColor: "bg-blue-50 border-blue-200",
    endpoints: [
      {
        method: "GET",
        path: "/api/mobile/products",
        description: "Daftar semua produk yang tersedia. Mendukung pencarian, filter, dan pagination.",
        auth: "api-key",
        params: [
          { name: "search", type: "string", required: false, description: "Cari berdasarkan nama atau SKU" },
          { name: "category", type: "string", required: false, description: "Filter berdasarkan nama kategori" },
          { name: "brand", type: "string", required: false, description: "Filter berdasarkan nama brand" },
          { name: "stockStatus", type: "\"all\" | \"ready\" | \"indent\"", required: false, description: "Filter status stok (default: all)" },
          { name: "page", type: "number", required: false, description: "Nomor halaman (default: 1)" },
          { name: "limit", type: "number", required: false, description: "Jumlah per halaman (default: 20, max: 50)" },
        ],
        response: { success: true, products: [{ id: "...", sku: "3RV2011-0JA10", name: "SIEMENS Motor Starter", price: 1500000, availableToSell: 5 }], pagination: { page: 1, limit: 20, total: 250, totalPages: 13 } },
      },
      {
        method: "GET",
        path: "/api/mobile/products/:sku",
        description: "Detail lengkap satu produk berdasarkan SKU, termasuk gambar slider, spesifikasi teknis, dan datasheet.",
        auth: "api-key",
        response: { success: true, product: { id: "...", sku: "3RV2011-0JA10", name: "SIEMENS Motor Starter", price: 1500000, sliderImages: ["url1", "url2"], specifications: { "Rated Current": "0.1 A", "Voltage": "690V" }, datasheet: "https://..." } },
      },
    ],
  },
  {
    id: "catalog",
    icon: <LayoutList className="w-5 h-5" />,
    title: "Kategori & Brand",
    color: "text-emerald-600",
    bgColor: "bg-emerald-50 border-emerald-200",
    endpoints: [
      {
        method: "GET",
        path: "/api/mobile/categories",
        description: "Struktur pohon kategori untuk navigasi filter di aplikasi mobile.",
        auth: "api-key",
        response: { success: true, categories: [{ id: "...", name: "Low Voltage", alias: "LP", children: [{ id: "...", name: "Circuit Breakers" }] }] },
      },
      {
        method: "GET",
        path: "/api/mobile/brands",
        description: "Daftar semua brand produk yang aktif.",
        auth: "api-key",
        response: { success: true, brands: [{ id: "...", name: "SIEMENS", alias: "Siemens" }, { id: "...", name: "G-COMIN" }] },
      },
    ],
  },
  {
    id: "estimations",
    icon: <FileText className="w-5 h-5" />,
    title: "Estimasi",
    color: "text-amber-600",
    bgColor: "bg-amber-50 border-amber-200",
    endpoints: [
      {
        method: "POST",
        path: "/api/mobile/estimations",
        description: "Simpan keranjang belanja mobile sebagai draft estimasi. Muncul di dashboard pengguna.",
        auth: "api-key+jwt",
        requestBody: {
          notes: "Proyek Gedung A",
          items: [
            { sku: "3RV2011-0JA10", name: "SIEMENS Motor Starter", brand: "SIEMENS", quantity: 2, price: 1500000, stockStatus: "READY" }
          ]
        },
        response: { success: true, message: "Estimasi berhasil disimpan!", estimation: { id: "...", quotationNo: "MOB-260607-0001", totalAmount: 3000000 } },
      },
      {
        method: "GET",
        path: "/api/mobile/estimations",
        description: "Daftar semua estimasi milik user yang sedang login.",
        auth: "api-key+jwt",
        params: [
          { name: "page", type: "number", required: false, description: "Nomor halaman" },
          { name: "limit", type: "number", required: false, description: "Jumlah per halaman (max: 20)" },
        ],
        response: { success: true, estimations: [{ id: "...", quotationNo: "MOB-260607-0001", status: "DRAFT", totalAmount: 3000000, items: [] }], pagination: { page: 1, total: 5 } },
      },
    ],
  },
  {
    id: "requests",
    icon: <Send className="w-5 h-5" />,
    title: "Permintaan (RFQ)",
    color: "text-red-600",
    bgColor: "bg-red-50 border-red-200",
    endpoints: [
      {
        method: "POST",
        path: "/api/mobile/requests",
        description: "Kirim permintaan penawaran harga (RFQ) resmi. Tim sales akan merespons secepatnya.",
        auth: "api-key+jwt",
        requestBody: {
          notes: "Butuh untuk proyek bulan depan",
          shippingAddress: "Jl. Contoh No. 1, Jakarta",
          items: [
            { sku: "3RV2011-0JA10", name: "SIEMENS Motor Starter", brand: "SIEMENS", quantity: 5, price: 1500000, stockStatus: "READY" }
          ]
        },
        response: { success: true, message: "Permintaan penawaran #RFQ-260607-0001 berhasil dikirim!", request: { id: "...", quotationNo: "RFQ-260607-0001", totalAmount: 7500000, status: "PENDING" } },
      },
      {
        method: "GET",
        path: "/api/mobile/requests",
        description: "Riwayat semua permintaan (RFQ/transaksi) milik user yang sedang login.",
        auth: "api-key+jwt",
        params: [
          { name: "page", type: "number", required: false, description: "Nomor halaman" },
        ],
        response: { success: true, requests: [{ id: "...", quotationNo: "RFQ-260607-0001", status: "OFFERED", totalAmount: 7500000 }], pagination: { page: 1, total: 3 } },
      },
    ],
  },
];

// ─── Components ───────────────────────────────────────────────────────────────
const METHOD_COLORS: Record<string, string> = {
  GET: "bg-emerald-100 text-emerald-700 border border-emerald-200",
  POST: "bg-blue-100 text-blue-700 border border-blue-200",
  PUT: "bg-amber-100 text-amber-700 border border-amber-200",
  DELETE: "bg-red-100 text-red-700 border border-red-200",
};

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={copy} className="p-1.5 rounded-lg hover:bg-slate-200 transition-colors text-slate-400 hover:text-slate-700">
      {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

function CodeBlock({ code, language = "json" }: { code: string; language?: string }) {
  return (
    <div className="relative bg-slate-900 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 bg-slate-800 border-b border-slate-700">
        <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">{language}</span>
        <CopyButton text={code} />
      </div>
      <pre className="p-4 text-[12px] font-mono text-slate-300 overflow-x-auto leading-relaxed whitespace-pre-wrap">
        {code}
      </pre>
    </div>
  );
}

function EndpointCard({ endpoint }: { endpoint: Endpoint }) {
  const [open, setOpen] = useState(false);
  const isJwt = endpoint.auth === "api-key+jwt";
  const curlCommand = buildCurl(endpoint);

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-slate-50/70 transition-colors"
      >
        <span className={`text-[11px] font-black px-2.5 py-1 rounded-lg font-mono tracking-wider ${METHOD_COLORS[endpoint.method]}`}>
          {endpoint.method}
        </span>
        <code className="text-sm font-mono text-slate-700 font-semibold flex-1">{endpoint.path}</code>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${isJwt ? "bg-violet-50 text-violet-600 border border-violet-200" : "bg-slate-100 text-slate-500"}`}>
            {isJwt ? <><Lock className="w-3 h-3" /> Auth<Lock className="w-3 h-3" /></> : <><Key className="w-3 h-3" /> API Key</>}
          </span>
          {open ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
        </div>
      </button>

      {open && (
        <div className="border-t border-slate-100 p-5 space-y-5 bg-slate-50/30">
          {/* Description */}
          <p className="text-sm text-slate-600 leading-relaxed">{endpoint.description}</p>

          {/* Headers */}
          <div>
            <p className="text-[11px] font-black uppercase tracking-wider text-slate-400 mb-2">Headers Wajib</p>
            <div className="font-mono text-xs space-y-1">
              <div className="flex gap-2 bg-slate-100 px-3 py-1.5 rounded-lg">
                <span className="text-amber-600 font-bold">x-api-key:</span>
                <span className="text-slate-600">{"{MOBILE_API_KEY}"}</span>
              </div>
              {isJwt && (
                <div className="flex gap-2 bg-slate-100 px-3 py-1.5 rounded-lg">
                  <span className="text-violet-600 font-bold">Authorization:</span>
                  <span className="text-slate-600">Bearer {"{jwt_token}"}</span>
                </div>
              )}
            </div>
          </div>

          {/* Query Params */}
          {endpoint.params && endpoint.params.length > 0 && (
            <div>
              <p className="text-[11px] font-black uppercase tracking-wider text-slate-400 mb-2">Query Parameters</p>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-left">
                      <th className="px-3 py-2 rounded-l-lg font-bold text-slate-500">Parameter</th>
                      <th className="px-3 py-2 font-bold text-slate-500">Tipe</th>
                      <th className="px-3 py-2 font-bold text-slate-500">Wajib</th>
                      <th className="px-3 py-2 rounded-r-lg font-bold text-slate-500">Deskripsi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {endpoint.params.map(p => (
                      <tr key={p.name} className="hover:bg-slate-50">
                        <td className="px-3 py-2 font-mono text-blue-600 font-semibold">{p.name}</td>
                        <td className="px-3 py-2 font-mono text-amber-600">{p.type}</td>
                        <td className="px-3 py-2">{p.required ? <span className="text-red-500 font-bold">Ya</span> : <span className="text-slate-400">Tidak</span>}</td>
                        <td className="px-3 py-2 text-slate-600">{p.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Request Body */}
          {endpoint.requestBody && (
            <div>
              <p className="text-[11px] font-black uppercase tracking-wider text-slate-400 mb-2">Request Body (JSON)</p>
              <CodeBlock code={JSON.stringify(endpoint.requestBody, null, 2)} />
            </div>
          )}

          {/* Response */}
          <div>
            <p className="text-[11px] font-black uppercase tracking-wider text-slate-400 mb-2">Contoh Response</p>
            <CodeBlock code={JSON.stringify(endpoint.response, null, 2)} />
          </div>

          {/* cURL */}
          <div>
            <p className="text-[11px] font-black uppercase tracking-wider text-slate-400 mb-2">cURL</p>
            <CodeBlock code={curlCommand} language="bash" />
          </div>
        </div>
      )}
    </div>
  );
}

function buildCurl(endpoint: Endpoint): string {
  const headers = [
    `-H "x-api-key: ${"{MOBILE_API_KEY}"}"`,
    `-H "Content-Type: application/json"`,
    ...(endpoint.auth === "api-key+jwt" ? [`-H "Authorization: Bearer ${"{jwt_token}"}"`] : []),
  ].join(" \\\n  ");

  const body = endpoint.requestBody
    ? `\\\n  -d '${JSON.stringify(endpoint.requestBody, null, 2)}'`
    : "";

  const method = endpoint.method !== "GET" ? `-X ${endpoint.method} ` : "";

  return `curl ${method}${BASE_URL}${endpoint.path} \\\n  ${headers}${body ? " " + body : ""}`;
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function MobileApiDocsPage() {
  const [activeSection, setActiveSection] = useState("auth");

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-[56px] z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-4">
          <div className="w-10 h-10 bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl flex items-center justify-center shadow-sm">
            <Code2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-900 tracking-tight">Mobile API Documentation</h1>
            <p className="text-xs text-slate-500 font-semibold">Dokumentasi REST API untuk integrasi aplikasi mobile HokiShop</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-[11px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full font-bold">v1.0</span>
            <span className="text-[11px] bg-slate-100 text-slate-600 px-3 py-1 rounded-full font-bold">Base URL: /api/mobile</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 flex gap-8">
        {/* Sidebar Nav */}
        <aside className="w-56 flex-shrink-0">
          <div className="sticky top-[120px] space-y-1">
            {/* Auth Info */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4">
              <div className="flex items-center gap-2 text-amber-700 font-bold text-xs mb-2">
                <Key className="w-3.5 h-3.5" /> Keamanan API
              </div>
              <p className="text-[11px] text-amber-600 leading-relaxed">
                Semua endpoint membutuhkan header <code className="bg-amber-100 px-1 rounded">x-api-key</code>. Endpoint berlabel <Lock className="w-2.5 h-2.5 inline" /> juga butuh JWT Bearer Token.
              </p>
            </div>

            {/* FCM Info */}
            <div className="bg-violet-50 border border-violet-200 rounded-xl p-3 mb-4">
              <div className="flex items-center gap-2 text-violet-700 font-bold text-xs mb-2">
                <Bell className="w-3.5 h-3.5" /> Real-time FCM
              </div>
              <p className="text-[11px] text-violet-600 leading-relaxed">
                Subscribe topic <code className="bg-violet-100 px-1 rounded">product_updates</code> di mobile app untuk menerima silent notification saat stok/harga berubah dari Accurate.
              </p>
            </div>

            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-2 mb-2">Navigasi</p>
            {API_SECTIONS.map(section => (
              <button
                key={section.id}
                onClick={() => {
                  setActiveSection(section.id);
                  document.getElementById(section.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all text-left ${activeSection === section.id ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"}`}
              >
                <span className={activeSection === section.id ? "text-white" : section.color}>{section.icon}</span>
                {section.title}
              </button>
            ))}

            {/* FCM Flows */}
            <button
              onClick={() => document.getElementById("fcm")?.scrollIntoView({ behavior: "smooth" })}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all text-left text-slate-600 hover:bg-slate-100"
            >
              <Zap className="w-5 h-5 text-amber-500" />
              FCM Real-time
            </button>
          </div>
        </aside>

        {/* Content */}
        <main className="flex-1 space-y-10 min-w-0">
          {API_SECTIONS.map(section => (
            <section key={section.id} id={section.id}>
              <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border mb-4 ${section.bgColor}`}>
                <span className={section.color}>{section.icon}</span>
                <h2 className={`text-base font-black tracking-tight ${section.color}`}>{section.title}</h2>
                <span className="ml-auto text-[11px] text-slate-400 font-semibold">{section.endpoints.length} endpoint</span>
              </div>
              <div className="space-y-3">
                {section.endpoints.map((ep, i) => (
                  <EndpointCard key={i} endpoint={ep} />
                ))}
              </div>
            </section>
          ))}

          {/* FCM Section */}
          <section id="fcm">
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl border mb-4 bg-amber-50 border-amber-200">
              <Zap className="w-5 h-5 text-amber-600" />
              <h2 className="text-base font-black tracking-tight text-amber-700">FCM Real-time Notifications</h2>
            </div>
            <div className="space-y-4">
              {/* Flow diagram */}
              <div className="bg-white border border-slate-200 rounded-xl p-6">
                <h3 className="font-black text-slate-800 mb-4 text-sm uppercase tracking-wider">Alur Notifikasi Real-time</h3>
                <div className="flex items-stretch gap-0 overflow-x-auto">
                  {[
                    { icon: "🔄", label: "Accurate", sub: "Harga/stok berubah", color: "bg-blue-50 border-blue-200" },
                    { icon: "→", label: "", sub: "", color: "bg-transparent border-transparent" },
                    { icon: "📡", label: "Webhook", sub: "/api/webhooks/accurate", color: "bg-slate-50 border-slate-200" },
                    { icon: "→", label: "", sub: "", color: "bg-transparent border-transparent" },
                    { icon: "💾", label: "Database", sub: "Prisma update", color: "bg-emerald-50 border-emerald-200" },
                    { icon: "→", label: "", sub: "", color: "bg-transparent border-transparent" },
                    { icon: "🔔", label: "FCM", sub: "Silent push", color: "bg-violet-50 border-violet-200" },
                    { icon: "→", label: "", sub: "", color: "bg-transparent border-transparent" },
                    { icon: "📱", label: "Mobile App", sub: "Auto refresh", color: "bg-amber-50 border-amber-200" },
                  ].map((step, i) => (
                    <div key={i} className={`flex flex-col items-center justify-center px-3 py-2 rounded-xl border text-center min-w-fit ${step.color} ${!step.label ? "border-0 px-1" : ""}`}>
                      <span className="text-xl">{step.icon}</span>
                      {step.label && <p className="text-xs font-black text-slate-700 mt-1 whitespace-nowrap">{step.label}</p>}
                      {step.sub && <p className="text-[10px] text-slate-500 whitespace-nowrap">{step.sub}</p>}
                    </div>
                  ))}
                </div>
              </div>

              {/* Topics */}
              <div className="bg-white border border-slate-200 rounded-xl p-6">
                <h3 className="font-black text-slate-800 mb-4 text-sm uppercase tracking-wider">FCM Topics — Subscribe di Mobile App</h3>
                <div className="space-y-3">
                  {[
                    { topic: "product_updates", desc: "Harga atau stok produk berubah. Mobile app harus re-fetch produk yang sedang ditampilkan.", trigger: "ITEM + ITEM_QUANTITY webhook", type: "Silent" },
                    { topic: "all_users", desc: "Broadcast umum ke semua pengguna (promo, pengumuman, dll).", trigger: "Admin manual trigger", type: "Visible" },
                  ].map(t => (
                    <div key={t.topic} className="flex gap-4 p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <code className="text-sm font-mono font-bold text-violet-600 bg-violet-50 px-2.5 py-1 rounded-lg border border-violet-100 h-fit whitespace-nowrap">{t.topic}</code>
                      <div>
                        <p className="text-sm text-slate-700 font-semibold">{t.desc}</p>
                        <p className="text-xs text-slate-400 mt-0.5">Trigger: {t.trigger} · Tipe: <span className={t.type === "Silent" ? "text-blue-500" : "text-amber-500"}>{t.type}</span></p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Flutter code sample */}
              <div className="bg-white border border-slate-200 rounded-xl p-6">
                <h3 className="font-black text-slate-800 mb-4 text-sm uppercase tracking-wider">Contoh Implementasi di Flutter</h3>
                <CodeBlock language="dart" code={`// 1. Subscribe ke topic saat app pertama kali dibuka
await FirebaseMessaging.instance.subscribeToTopic('product_updates');

// 2. Handle background message (silent notification = action REFRESH)
FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);

@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  final action = message.data['action'];
  if (action == 'REFRESH_PRODUCTS') {
    // Invalidate cache produk yang tersimpan di lokal
    await ProductCache.clear();
  }
}

// 3. Handle foreground message
FirebaseMessaging.onMessage.listen((RemoteMessage message) {
  final action = message.data['action'];
  if (action == 'REFRESH_PRODUCTS') {
    // Trigger re-fetch di state management (Riverpod/Bloc/Provider)
    ref.invalidate(productsProvider);
  }
});`} />
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
