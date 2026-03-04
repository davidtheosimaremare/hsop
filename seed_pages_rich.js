const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const pages = [
    {
        title: "Tentang Kami",
        slug: "tentang-kami",
        content: `
      <h2>Solusi Elektrikal Terpercaya Sejak 2010</h2>
      <p><strong>PT Hokiindo Sinergi</strong> hadir sebagai jawaban atas kebutuhan industri Indonesia akan produk elektrikal berkualitas tinggi dan handal. Sebagai Authorized Distributor resmi, kami menjembatani teknologi global dari <strong>Siemens</strong> dengan kebutuhan lokal, memastikan setiap proyek Anda berjalan dengan efisiensi maksimal.</p>
      
      <img src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop" alt="Gedung Modern" />

      <blockquote>
        "Kami tidak hanya menjual produk. Kami memberikan ketenangan pikiran melalui jaminan keaslian, dukungan teknis, dan layanan purna jual yang responsif."
      </blockquote>

      <h3>Mengapa Dunia Industri Memilih Kami?</h3>
      <ul>
        <li><strong>Keaslian Terjamin:</strong> Sertifikat of Origin (COO) dan garansi resmi untuk setiap komponen.</li>
        <li><strong>Stok Komprehensif:</strong> Gudang seluas 1000m² yang siap memenuhi kebutuhan mendesak Anda.</li>
        <li><strong>Ahli Teknis:</strong> Tim engineer bersertifikasi yang siap membantu dari konsultasi hingga troubleshooting.</li>
      </ul>

      <img src="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=2070&auto=format&fit=crop" alt="Engineer Working" />

      <h3>Jejak Langkah Kami</h3>
      <p>Dari memasok panel kecil untuk pabrik tekstil lokal hingga menjadi mitra strategis untuk proyek infrastruktur nasional, perjalanan Hokiindo adalah cerita tentang konsistensi dan integritas. Kami telah melayani lebih dari 500+ klien korporat di seluruh nusantara. Kami percaya bahwa kesuksesan klien adalah kesuksesan kami juga.</p>

      <h3>Mitra Resmi</h3>
      <p>Kami bangga menjadi distributor resmi untuk:</p>
      <ul>
        <li><strong>Siemens:</strong> Low Voltage, Automation, Drive Technology.</li>
        <li><strong>Portable Lighting:</strong> Solusi penerangan area berbahaya dan industrial.</li>
      </ul>
    `,
        metaTitle: "Tentang Hokiindo - Distributor Resmi Siemens Indonesia",
        metaDescription: "Mengenal PT Hokiindo Sinergi, partner terpercaya solusi elektrikal dan otomatisasi industri di Indonesia.",
        isPublished: true,
    },
    {
        title: "Hubungi Kami",
        slug: "hubungi-kami",
        content: `
      <h2>Terhubung dengan Tim Hokiindo</h2>
      <p>Jangan ragu untuk mendiskusikan kebutuhan proyek Anda. Tim ahli kami siap memberikan rekomendasi produk terbaik dan penawaran harga yang kompetitif.</p>

      <img src="https://images.unsplash.com/photo-1423666639041-f14d70fa363d?q=80&w=2079&auto=format&fit=crop" alt="Customer Service Team" />

      <h3>Kantor Pusat & Showroom</h3>
      <p>
        <strong>PT Hokiindo Sinergi</strong><br>
        Gedung Hokiindo Tower, Lt. 3<br>
        Jl. Boulevard Raya Blok QJ 5 No. 12<br>
        Kelapa Gading, Jakarta Utara 14240<br>
        Indonesia
      </p>

      <h3>Layanan Pelanggan</h3>
      <p>Tim kami tersedia Senin - Sabtu untuk menjawab pertanyaan Anda.</p>
      <ul>
        <li><strong>Telepon & Fax:</strong> (021) 4585-0000</li>
        <li><strong>WhatsApp Bisnis:</strong> 0812-9999-8888 (24 Jam untuk pesan teks)</li>
        <li><strong>Email Penawaran:</strong> sales@hokiindo.com</li>
        <li><strong>Email Karir:</strong> hr@hokiindo.com</li>
      </ul>

      <h3>Peta Lokasi</h3>
      <p>Kunjungi showroom kami untuk melihat demo unit produk terbaru.</p>
      <img src="https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=2074&auto=format&fit=crop" alt="Map Location Illusion" />
      <p><em>(Klik untuk membuka di Google Maps)</em></p>
    `,
        isPublished: true,
    },
    {
        title: "Karir",
        slug: "karir",
        content: `
      <h2>Tumbuh Bersama Hokiindo</h2>
      <p>Kami percaya bahwa inovasi lahir dari kolaborasi. Di Hokiindo, kami menciptakan lingkungan kerja yang inklusif, menantang, dan menghargai setiap ide brilian.</p>

      <img src="https://images.unsplash.com/photo-1521737711867-e3b97375f902?q=80&w=1974&auto=format&fit=crop" alt="Team Brainstorming" />

      <h3>Budaya Kami</h3>
      <p>Kami bekerja dengan prinsip <strong>"Customer First, Employee Happiness"</strong>. Kami memastikan setiap karyawan mendapatkan:</p>
      <ul>
        <li><strong>Work-Life Balance:</strong> Jam kerja fleksibel untuk peran tertentu.</li>
        <li><strong>Pengembangan Diri:</strong> Budget pelatihan tahunan dan akses ke kursus profesional.</li>
        <li><strong>Kesehatan:</strong> Asuransi kesehatan swasta untuk karyawan dan keluarga inti.</li>
      </ul>

      <h3>Posisi Terbuka</h3>
      
      <h4>1. Technical Sales Engineer</h4>
      <p>Bertanggung jawab untuk memberikan solusi teknis kepada klien dan mencapai target penjualan wilayah. Membutuhkan latar belakang Teknik Elektro.</p>

      <h4>2. Supply Chain Specialist</h4>
      <p>Mengelola pengadaan dan inventaris untuk memastikan ketersediaan stok yang optimal. Membutuhkan pengalaman di logistik/impor.</p>

      <h4>3. Digital Content Creator</h4>
      <p>Membuat konten edukatif dan promosi untuk media sosial dan website. Kreativitas tanpa batas sangat dinantikan.</p>

      <hr />
      
      <p><strong>Siap bergabung?</strong> Kirimkan portfolio dan CV terbaik Anda ke <strong>recruitment@hokiindo.com</strong>. Hanya kandidat terpilih yang akan kami hubungi.</p>
    `,
        isPublished: true,
    },
    {
        title: "FAQ",
        slug: "faq",
        content: `
      <h2>Pusat Bantuan & Pertanyaan Umum</h2>
      <p>Temukan jawaban cepat untuk pertanyaan-pertanyaan yang sering diajukan oleh pelanggan kami.</p>

      <h3>Tentang Produk</h3>
      
      <h4>Apakah produk Siemens yang dijual asli?</h4>
      <p>Ya, sangat asli. Kami menjamin 100% keaslian produk. Sebagai distributor resmi, kami mendapatkan suplai langsung dari prinsipal tanpa perantara pihak ketiga yang tidak jelas. Sertifikat OF ORIGIN tersedia by request.</p>
      
      <h4>Apakah ada garansi?</h4>
      <p>Tentu. Semua produk industrial kami dilindungi garansi pabrik standar selama 12 bulan untuk cacat produksi. Tim teknis kami juga siap memfasilitasi proses klaim garansi Anda.</p>

      <h3>Pemesanan & Pengiriman</h3>

      <h4>Berapa lama waktu pengiriman untuk barang indent?</h4>
      <p>Waktu pengiriman indent bervariasi antara 4 hingga 12 minggu tergantung jenis produk dan negara asal pabrik (Jerman, China, atau lokal). Tim sales kami akan memberikan estimasi waktu yang transparan di awal penawaran.</p>

      <h4>Bisakah mengirim ke luar pulau Jawa?</h4>
      <p>Bisa. Kami bekerja sama dengan berbagai ekspedisi darat, laut, dan udara terpercaya untuk memastikan barang sampai dengan aman ke seluruh pelosok Indonesia, dari Aceh hingga Papua.</p>

      <h3>Pembayaran & Pajak</h3>

      <h4>Apakah harga sudah termasuk PPN?</h4>
      <p>Harga yang tertera di website umumnya <strong>belum termasuk PPN 11%</strong>, kecuali dinyatakan lain. Faktur pajak akan diterbitkan untuk setiap transaksi perusahaan.</p>

      <img src="https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?q=80&w=2070&auto=format&fit=crop" alt="Faktur dan Dokumen" />
    `,
        isPublished: true,
    },
    {
        title: "Kemitraan",
        slug: "kemitraan",
        content: `
      <h2>Kolaborasi untuk Kesuksesan Bersama</h2>
      <p>Di era industri 4.0, tidak ada perusahaan yang bisa berdiri sendiri. Hokiindo membuka pintu kolaborasi strategis untuk memperluas ekosistem bisnis elektrikal di Indonesia.</p>

      <img src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?q=80&w=2070&auto=format&fit=crop" alt="Handshake Partnership" />

      <h3>Program Reseller & Sistem Integrator</h3>
      <p>Kami mengundang toko elektrikal, panel builder, dan sistem integrator untuk bergabung dalam jaringan mitra kami.</p>
      <ul>
        <li><strong>Harga Kompetitif:</strong> Dapatkan struktur diskon khusus mitra.</li>
        <li><strong>Dukungan Proyek:</strong> Pendampingan teknis dan proteksi harga untuk proyek tender.</li>
        <li><strong>Marketing Kit:</strong> Brosur, katalog, dan materi promosi siap pakai.</li>
      </ul>

      <h3>Menjadi Supplier</h3>
      <p>Anda memiliki produk inovatif yang relevan dengan pasar kami? Mari berdiskusi. Kami memiliki jaringan distribusi yang matang dan basis pelanggan loyal yang siap menerima produk berkualitas.</p>
      
      <blockquote>
        "Sinergi adalah kunci pertumbuhan eksponensial. Mari tumbuh bersama Hokiindo."
      </blockquote>

      <p>Hubungi Direktur Pengembangan Bisnis kami di <strong>partnership@hokiindo.com</strong>.</p>
    `,
        isPublished: true,
    },
    {
        title: "Syarat dan Ketentuan",
        slug: "syarat-dan-ketentuan",
        content: `
      <h2>Syarat dan Ketentuan Transaksi</h2>
      <p>Harap membaca syarat dan ketentuan ini dengan seksama sebelum melakukan transaksi. Dokumen ini mengatur hubungan hukum antara PT Hokiindo Sinergi (Penjual) dan Anda (Pembeli).</p>

      <h3>1. Definisi</h3>
      <p>Dalam syarat dan ketentuan ini, "Produk" berarti barang elektrikal dan komponen lain yang dijual oleh Hokiindo. "Hari Kerja" berarti Senin sampai Jumat, tidak termasuk hari libur nasional.</p>

      <h3>2. Harga dan Pembayaran</h3>
      <p>Semua harga dalam mata uang Rupiah (IDR). Kami berhak mengubah harga sewaktu-waktu tanpa pemberitahuan jika terjadi fluktuasi kurs mata uang asing yang signifikan. Pembayaran dianggap lunas setelah dana efektif masuk ke rekening bank perusahaan kami.</p>

      <h3>3. Pembatalan dan Pengembalian</h3>
      <p>Pesanan yang sudah diproses (PO diterima) tidak dapat dibatalkan sepihak oleh Pembeli. Pengembalian barang (retur) hanya diterima jika:</p>
      <ul>
        <li>Barang yang diterima tidak sesuai dengan spesifikasi PO.</li>
        <li>Terdapat cacat produksi saat barang diterima (DOA - Dead on Arrival).</li>
        <li>Segel dan kemasan masih utuh (untuk kasus salah beli, subject to approval).</li>
      </ul>

      <h3>4. Force Majeure</h3>
      <p>Kami dibebaskan dari tanggung jawab keterlambatan pengiriman yang disebabkan oleh kejadian di luar kendali kami, seperti bencana alam, huru-hara, kebijakan pemerintah, atau keterlambatan dari pihak ekspedisi/prinsipal.</p>
    `,
        isPublished: true,
    },
    {
        title: "Kebijakan Privasi",
        slug: "kebijakan-privasi",
        content: `
      <h2>Komitmen Kami terhadap Privasi Anda</h2>
      <p>Privasi Anda adalah prioritas kami. Kebijakan ini menjelaskan bagaimana PT Hokiindo Sinergi mengelola data pribadi yang Anda percayakan kepada kami.</p>

      <img src="https://images.unsplash.com/photo-1563986768609-322da13575f3?q=80&w=1470&auto=format&fit=crop" alt="Privacy Security" />

      <h3>Pengumpulan Data</h3>
      <p>Kami mengumpulkan data hanya yang diperlukan untuk proses bisnis, meliputi:</p>
      <ul>
        <li>Nama dan identitas perusahaan.</li>
        <li>Alamat pengiriman dan penagihan.</li>
        <li>Nomor kontak dan email untuk korespondensi.</li>
        <li>NPWP untuk keperluan perpajakan.</li>
      </ul>

      <h3>Penggunaan Data</h3>
      <p>Kami <strong>TIDAK PERNAH</strong> menjual atau menyewakan data Anda kepada pihak ketiga manapun untuk tujuan pemasaran. Data Anda digunakan eksklusif untuk:</p>
      <ul>
        <li>Memproses pesanan dan pengiriman.</li>
        <li>Layanan purna jual dan klaim garansi.</li>
        <li>Informasi pembaruan produk penting (jika Anda berlangganan).</li>
      </ul>

      <h3>Keamanan Informasi</h3>
      <p>Kami menggunakan standar enkripsi industri (SSL) untuk melindungi transmisi data di website kami. Server kami dilindungi firewall berlapis untuk mencegah akses tidak sah.</p>
    `,
        isPublished: true,
    },
    {
        title: "Daftar Member Exclusive",
        slug: "daftar-member-exclusive",
        content: `
      <h2>Program Keanggotaan Premium</h2>
      <p>Maksimalkan keuntungan bisnis Anda dengan bergabung dalam lingkaran eksklusif Hokiindo. Program ini didesain khusus untuk memberikan nilai tambah bagi pelanggan setia kami.</p>

      <img src="https://images.unsplash.com/photo-1577962917302-cd874c4e31d2?q=80&w=1932&auto=format&fit=crop" alt="Premium Member Card" />

      <h3>Benefit Gold Member</h3>
      <ul>
        <li><strong>Extra Diskon 5%:</strong> Tambahan potongan harga di atas diskon reguler.</li>
        <li><strong>Free Ongkir:</strong> Gratis pengiriman se-Jabodetabek tanpa minimum order.</li>
        <li><strong>Prioritas Antrian:</strong> Pesanan Anda akan diproses di jalur ekspres gudang kami.</li>
        <li><strong>Hadiah Tahunan:</strong> Merchandise eksklusif dan bingkisan hari raya.</li>
      </ul>

      <h3>Benefit Platinum Member</h3>
      <p>Semua benefit Gold, ditambah:</p>
      <ul>
        <li><strong>Credit Term 30 Hari:</strong> Fasilitas pembayaran tempo (syarat & ketentuan berlaku).</li>
        <li><strong>Dedicated Account Manager:</strong> Satu kontak person khusus untuk menangani semua kebutuhan Anda.</li>
        <li><strong>Undangan Event:</strong> Akses ke seminar teknologi Siemens dan gathering tahunan.</li>
      </ul>

      <h3>Cara Bergabung</h3>
      <p>Keanggotaan bersifat <strong>Undangan</strong> atau <strong>Pengajuan</strong>. Jika total transaksi tahunan Anda mencapai Rp 500.000.000, Anda otomatis memenuhi syarat untuk Gold Member.</p>
      <p>Untuk pengajuan manual, hubungi tim sales kami untuk evaluasi profil bisnis Anda.</p>
    `,
        isPublished: true,
    },
];

async function main() {
    console.log(`Start seeding ${pages.length} rich pages...`);

    for (const page of pages) {
        const existingPage = await prisma.page.findUnique({
            where: { slug: page.slug },
        });

        if (existingPage) {
            console.log(`Updating rich content for: ${page.title}`);
            await prisma.page.update({
                where: { slug: page.slug },
                data: {
                    title: page.title,
                    content: page.content,
                    metaTitle: page.metaTitle,
                    metaDescription: page.metaDescription,
                    isPublished: page.isPublished
                },
            });
        } else {
            console.log(`Creating rich content for: ${page.title}`);
            await prisma.page.create({
                data: page,
            });
        }
    }

    console.log('Rich seeding finished.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
