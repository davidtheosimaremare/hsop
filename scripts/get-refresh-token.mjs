/**
 * Script untuk mendapatkan Google OAuth2 Refresh Token
 * Digunakan untuk Google Indexing API
 *
 * Cara pakai:
 * node scripts/get-refresh-token.mjs
 */

import { createServer } from "http";
import { URL } from "url";

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "YOUR_CLIENT_ID_HERE";
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "YOUR_CLIENT_SECRET_HERE";
const REDIRECT_URI = "http://localhost:3333/callback";

const SCOPES = [
  "https://www.googleapis.com/auth/indexing",
  "https://www.googleapis.com/auth/webmasters",
].join(" ");

// Generate URL otorisasi
const authUrl =
  `https://accounts.google.com/o/oauth2/v2/auth?` +
  `client_id=${encodeURIComponent(CLIENT_ID)}&` +
  `redirect_uri=${encodeURIComponent(REDIRECT_URI)}&` +
  `response_type=code&` +
  `scope=${encodeURIComponent(SCOPES)}&` +
  `access_type=offline&` +
  `prompt=consent`;

console.log("\n========================================");
console.log("  Google OAuth2 Refresh Token Generator ");
console.log("========================================\n");
console.log("1. Buka URL berikut di browser Anda:\n");
console.log(authUrl);
console.log("\n2. Login dengan akun Google pemilik Search Console Anda");
console.log("3. Klik 'Allow/Izinkan'");
console.log("4. Tunggu... token akan otomatis muncul di sini\n");

// Buka browser otomatis (macOS)
const { exec } = await import("child_process");
exec(`open "${authUrl}"`);

// Jalankan server lokal untuk menangkap callback
const server = createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost:3333");

  if (url.pathname !== "/callback") {
    res.end("Not found");
    return;
  }

  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");

  if (error) {
    console.error("❌ Error:", error);
    res.end(`<h1>Error: ${error}</h1>`);
    server.close();
    return;
  }

  if (!code) {
    res.end("<h1>Tidak ada kode otorisasi</h1>");
    server.close();
    return;
  }

  // Tukar code dengan refresh token
  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
        grant_type: "authorization_code",
      }),
    });

    const tokens = await tokenRes.json();

    if (tokens.error) {
      console.error("❌ Error mendapatkan token:", tokens.error_description);
      res.end(`<h1>Error: ${tokens.error_description}</h1>`);
      server.close();
      return;
    }

    console.log("\n✅ BERHASIL! Simpan nilai berikut ke .env Anda:\n");
    console.log("─────────────────────────────────────────");
    console.log(`GOOGLE_CLIENT_ID=${CLIENT_ID}`);
    console.log(`GOOGLE_CLIENT_SECRET=${CLIENT_SECRET}`);
    console.log(`GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}`);
    console.log("─────────────────────────────────────────\n");

    res.end(`
      <html>
        <body style="font-family:sans-serif;padding:40px;background:#0f0f0f;color:#fff">
          <h1 style="color:#4ade80">✅ Berhasil!</h1>
          <p>Refresh Token sudah muncul di terminal Anda. Tutup tab ini.</p>
          <pre style="background:#1a1a1a;padding:20px;border-radius:8px;word-break:break-all">
GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}
          </pre>
        </body>
      </html>
    `);
    server.close();
  } catch (err) {
    console.error("❌ Error:", err.message);
    res.end(`<h1>Error: ${err.message}</h1>`);
    server.close();
  }
});

server.listen(3333, () => {
  console.log("⏳ Menunggu otorisasi... (server berjalan di port 3333)\n");
});
