const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const pages = [
    {
        title: "Tentang Kami",
        slug: "tentang-kami",
        content: `
      <h2>Tentang Hokiindo</h2>
      <p>Selamat datang di Hokiindo, mitra terpercaya Anda untuk solusi elektrikal dan pencahayaan berkualitas tinggi. Sejak didirikan, kami telah berkomitmen untuk menjadi jembatan antara teknologi mutakhir dan kebutuhan industri di Indonesia.</p>
      
      <p>Sebagai distributor resmi <strong>Siemens Electrical</strong>, kami menyediakan rangkaian lengkap produk Low Voltage, Control Products, dan Automation yang dirancang untuk efisiensi dan keamanan maksimal. Selain itu, kami juga menghadirkan solusi <strong>Portable Lighting</strong> yang inovatif untuk berbagai kebutuhan operasional dan darurat.</p>

      <img src="https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=2069&auto=format&fit=crop" alt="Kantor Hokiindo" style="width: 100%; border-radius: 12px; margin: 30px 0; box-shadow: 0 4px 12px rgba(0,0,0,0.1);" />

      <h3>Visi Kami</h3>
      <p>Menjadi perusahaan distribusi elektrikal terdepan di Indonesia yang dikenal karena keandalan produk, keunggulan layanan, dan integritas bisnis.</p>

      <h3>Misi Kami</h3>
      <ul>
        <li>Menyediakan produk elektrikal asli dan bergaransi resmi.</li>
        <li>Memberikan solusi teknis yang tepat guna bagi setiap pelanggan.</li>
        <li>Membangun hubungan jangka panjang yang saling menguntungkan dengan mitra bisnis.</li>
        <li>Terus berinovasi dalam layanan logistik dan digital untuk kemudahan pelanggan.</li>
      </ul>

      <h3>Nilai Inti (Core Values)</h3>
      <p>Kami berpegang teguh pada nilai-nilai <strong>HOKI</strong>:</p>
      <ul>
        <li><strong>H</strong>onest (Jujur dalam setiap transaksi)</li>
        <li><strong>O</strong>ptimistic (Selalu optimis dalam menghadapi tantangan)</li>
        <li><strong>K</strong>nowledgeable (Menguasai pengetahuan produk secara mendalam)</li>
        <li><strong>I</strong>nnovative (Selalu mencari cara baru untuk melayani lebih baik)</li>
      </ul>
    `,
        metaTitle: "Tentang Kami - Hokiindo Distributor Siemens Resmi",
        metaDescription: "Profil lengkap Hokiindo, distributor resmi Siemens Electrical dan Portable Lighting di Indonesia. Cek visi, misi, dan nilai kami.",
        isPublished: true,
    },
    {
        title: "Hubungi Kami",
        slug: "hubungi-kami",
        content: `
      <h2>Kami Siap Membantu Anda</h2>
      <p>Apakah Anda memiliki pertanyaan tentang spesifikasi produk, ketersediaan stok, atau butuh penawaran harga untuk proyek? Tim kami siap melayani Anda.</p>

      <div style="background-color: #f9fafb; padding: 24px; border-radius: 12px; border: 1px solid #e5e7eb; margin: 24px 0;">
        <h3 style="margin-top: 0;">Kantor Pusat</h3>
        <p><strong>PT Hokiindo Sinergi</strong><br>
        Jl. Boulevard Raya Blok QJ 5 No. 12<br>
        Kelapa Gading, Jakarta Utara<br>
        DKI Jakarta, 14240</p>
      </div>

      <img src="https://images.unsplash.com/photo-1516387938699-a93567ec168e?q=80&w=2071&auto=format&fit=crop" alt="Customer Support" style="width: 100%; border-radius: 12px; margin: 20px 0;" />

      <h3>Saluran Komunikasi</h3>
      <ul>
        <li><strong>Telepon:</strong> (021) 4585-1234 (Hunting)</li>
        <li><strong>WhatsApp Sales:</strong> <a href="#" style="color: #dc2626; text-decoration: none;">0812-9876-5432</a> (Fast Response)</li>
        <li><strong>Email Penawaran:</strong> sales@hokiindo.com</li>
        <li><strong>Email Umum:</strong> info@hokiindo.com</li>
      </ul>

      <h3>Jam Operasional</h3>
      <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
        <tr style="border-bottom: 1px solid #eee;">
          <td style="padding: 12px 0;">Senin - Jumat</td>
          <td style="padding: 12px 0; font-weight: bold;">08:30 - 17:00 WIB</td>
        </tr>
        <tr style="border-bottom: 1px solid #eee;">
          <td style="padding: 12px 0;">Sabtu</td>
          <td style="padding: 12px 0; font-weight: bold;">08:30 - 14:00 WIB</td>
        </tr>
        <tr>
          <td style="padding: 12px 0;">Minggu & Libur Nasional</td>
          <td style="padding: 12px 0; font-weight: bold; color: #dc2626;">Tutup</td>
        </tr>
      </table>
    `,
        isPublished: true,
    },
    {
        title: "Karir",
        slug: "karir",
        content: `
      <h2>Bangun Karir Impian Bersama Hokiindo</h2>
      <p>Di Hokiindo, kami percaya bahwa sumber daya manusia adalah aset terbesar perusahaan. Kami menciptakan lingkungan kerja yang dinamis, kolaboratif, dan mendukung pertumbuhan profesional setiap individu.</p>

      <img src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=2070&auto=format&fit=crop" alt="Tim Hokiindo" style="width: 100%; border-radius: 12px; margin: 24px 0;" />

      <h3>Mengapa Bekerja di Hokiindo?</h3>
      <ul>
        <li><strong>Peluang Berkembang:</strong> Program pelatihan dan mentoring reguler.</li>
        <li><strong>Kesejahteraan:</strong> Gaji kompetitif, tunjangan kesehatan, dan bonus kinerja.</li>
        <li><strong>Budaya Kerja:</strong> Lingkungan yang positif, inklusif, dan menghargai ide-ide baru.</li>
      </ul>

      <h3>Lowongan Tersedia</h3>
      <p>Saat ini kami sedang membuka kesempatan untuk posisi berikut:</p>

      <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 16px;">
        <h4 style="margin-top: 0; color: #dc2626;">1. Sales Engineer (Industrial)</h4>
        <p><strong>Deskripsi:</strong> Bertanggung jawab mencari klien industri baru dan memelihara hubungan dengan klien eksisting.</p>
        <p><strong>Kualifikasi:</strong> Min. S1 Teknik Elektro/Mesin, pengalaman 2 tahun di bidang sales B2B.</p>
      </div>

      <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 16px;">
        <h4 style="margin-top: 0; color: #dc2626;">2. Digital Marketing Specialist</h4>
        <p><strong>Deskripsi:</strong> Mengelola kampanye digital, SEO, dan media sosial perusahaan.</p>
        <p><strong>Kualifikasi:</strong> Min. D3 semua jurusan, menguasai Meta Ads & Google Ads.</p>
      </div>

      <p>Tertarik untuk bergabung? Kirimkan CV dan Surat Lamaran terbaru Anda ke <strong>recruitment@hokiindo.com</strong> dengan subjek "Lamaran - [Posisi yang Dilamar]".</p>
    `,
        isPublished: true,
    },
    {
        title: "FAQ",
        slug: "faq",
        content: `
      <h2>Frequently Asked Questions</h2>
      <p>Berikut adalah kumpulam pertanyaan yang sering diajukan oleh pelanggan kami. Jika Anda tidak menemukan jawaban yang Anda cari, silakan hubungi layanan pelanggan kami.</p>

      <h3>Produk & Keaslian</h3>
      <details style="margin-bottom: 12px; background: #f9fafb; padding: 12px; border-radius: 8px;">
        <summary style="font-weight: bold; cursor: pointer;">Apakah semua produk di Hokiindo original?</summary>
        <p style="margin-top: 10px;">Ya, 100%. Kami adalah distributor resmi (Authorized Distributor) untuk Siemens dan brand lain yang kami jual. Semua produk dilengkapi dengan dokumen keaslian dan garansi resmi.</p>
      </details>
      <details style="margin-bottom: 12px; background: #f9fafb; padding: 12px; border-radius: 8px;">
        <summary style="font-weight: bold; cursor: pointer;">Apakah tersedia Datasheet dan Sertifikat produk?</summary>
        <p style="margin-top: 10px;">Tentu. Anda dapat mengunduh datasheet langsung di halaman produk, atau meminta sertifikat (COO/COM) kepada tim sales kami setelah pembelian.</p>
      </details>

      <h3>Pemesanan & Pembayaran</h3>
      <details style="margin-bottom: 12px; background: #f9fafb; padding: 12px; border-radius: 8px;">
        <summary style="font-weight: bold; cursor: pointer;">Bagaimana cara meminta Faktur Pajak?</summary>
        <p style="margin-top: 10px;">Saat melakukan checkout atau pemesanan via sales, mohon lampirkan NPWP perusahaan Anda. Faktur pajak akan kami kirimkan via email setelah pesanan selesai diproses.</p>
      </details>
      <details style="margin-bottom: 12px; background: #f9fafb; padding: 12px; border-radius: 8px;">
        <summary style="font-weight: bold; cursor: pointer;">Metode pembayaran apa saja yang tersedia?</summary>
        <p style="margin-top: 10px;">Kami menerima pembayaran via Transfer Bank (BCA, Mandiri) dan Kartu Kredit (via Tokopedia/Shopee store kami untuk retail). Untuk perusahaan, tersedia opsi TOP (Term of Payment) setelah melalui proses verifikasi.</p>
      </details>

      <h3>Pengiriman</h3>
      <details style="margin-bottom: 12px; background: #f9fafb; padding: 12px; border-radius: 8px;">
        <summary style="font-weight: bold; cursor: pointer;">Berapa lama waktu pengiriman?</summary>
        <p style="margin-top: 10px;">Untuk barang Ready Stock: 1-3 hari kerja (Jabodetabek) dan 3-7 hari kerja (Luar Kota). Untuk barang Indent: estimasi waktu akan diinformasikan di penawaran harga (biasanya 4-8 minggu).</p>
      </details>
    `,
        isPublished: true,
    },
    {
        title: "Kemitraan",
        slug: "kemitraan",
        content: `
      <h2>Peluang Kemitraan Strategis</h2>
      <p>Hokiindo membuka pintu kolaborasi bagi berbagai pihak, mulai dari kontraktor, panel builder, hingga brand prinsipal yang ingin memperluas jangkauan pasar mereka di Indonesia.</p>

      <img src="https://images.unsplash.com/photo-1556761175-5973dc0f32e7?q=80&w=2664&auto=format&fit=crop" alt="Partnership" style="width: 100%; border-radius: 12px; margin: 24px 0;" />

      <h3>Program Mitra Hokiindo</h3>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 30px 0;">
        <div style="background: white; border: 1px solid #eee; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
          <h4 style="color: #dc2626; margin-top: 0;">Untuk Kontraktor & Installer</h4>
          <p>Dapatkan harga spesial proyek dan dukungan teknis prioritas untuk setiap proyek yang Anda kerjakan.</p>
        </div>
        <div style="background: white; border: 1px solid #eee; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
          <h4 style="color: #dc2626; margin-top: 0;">Untuk Reseller / Toko Listrik</h4>
          <p>Daftar harga grosir khusus dan jaminan ketersediaan stok untuk mendukung perputaran bisnis retail Anda.</p>
        </div>
      </div>

      <h3>Menjadi Supplier Kami?</h3>
      <p>Jika Anda adalah prinsipal atau importir produk elektrikal berkualitas dan ingin produk Anda didistribusikan oleh Hokiindo, kami sangat antusias untuk berdiskusi.</p>

      <p>Silakan kirimkan proposal kemitraan Anda ke <strong>partnership@hokiindo.com</strong> atau hubungi Business Development kami di 0811-XXXX-XXXX.</p>
    `,
        isPublished: true,
    },
    {
        title: "Syarat dan Ketentuan",
        slug: "syarat-dan-ketentuan",
        content: `
      <h2>Syarat dan Ketentuan Layanan</h2>
      <p>Terima kasih telah mengunjungi Hokiindo.com. Harap membaca syarat dan ketentuan ini dengan saksama sebelum menggunakan layanan kami atau melakukan transaksi pembelian.</p>

      <h3>1. Definisi</h3>
      <p>"Kami" mengacu pada PT Hokiindo Sinergi. "Anda" mengacu pada pengguna situs atau pembeli produk.</p>

      <h3>2. Informasi Produk & Harga</h3>
      <ul>
        <li>Kami berusaha menampilkan informasi produk, spesifikasi, dan gambar seakurat mungkin. Namun, perbedaan visual mungkin terjadi karena pencahayaan foto atau layar monitor.</li>
        <li>Harga yang tercantum dapat berubah sewaktu-waktu tanpa pemberitahuan sebelumnya mengikuti kurs mata uang asing atau kebijakan prinsipal.</li>
        <li>Harga belum termasuk PPN 11% kecuali dinyatakan lain.</li>
      </ul>

      <h3>3. Pemesanan & Pembayaran</h3>
      <ul>
        <li>Pemesanan dianggap sah setelah kami menerima pembayaran (untuk customer cash) atau PO resmi (untuk customer kredit).</li>
        <li>Pembayaran wajib dilakukan ke rekening resmi perusahaan atas nama <strong>PT Hokiindo Sinergi</strong>. Kami tidak bertanggung jawab atas transfer ke rekening pribadi oknum.</li>
      </ul>

      <h3>4. Pengiriman & Klaim</h3>
      <ul>
        <li>Risiko pengiriman beralih ke pembeli setelah barang diserahkan ke pihak ekspedisi.</li>
        <li>Wajib melakukan video unboxing saat menerima paket. Klaim kekurangan atau kerusakan fisik tidak akan dilayani tanpa bukti video unboxing.</li>
        <li>Klaim garansi fungsi mengikuti kebijakan masing-masing brand prinsipal (Siemens, dll).</li>
      </ul>

      <p><em>Terakhir diperbarui: 15 Februari 2026</em></p>
    `,
        isPublished: true,
    },
    {
        title: "Kebijakan Privasi",
        slug: "kebijakan-privasi",
        content: `
      <h2>Kebijakan Privasi (Privacy Policy)</h2>
      <p>PT Hokiindo Sinergi berkomitmen untuk melindungi dan menghormati privasi data pribadi Anda. Kebijakan ini menjelaskan dasar pengumpulan, penggunaan, dan pemrosesan data pribadi Anda oleh kami.</p>

      <h3>Data yang Kami Kumpulkan</h3>
      <p>Informasi yang mungkin kami kumpulkan dari Anda meliputi:</p>
      <ul>
        <li><strong>Identitas:</strong> Nama lengkap, jabatan, nama perusahaan.</li>
        <li><strong>Kontak:</strong> Alamat email, nomor telepon/WhatsApp, alamat pengiriman.</li>
        <li><strong>Transaksi:</strong> Detail produk yang dibeli, riwayat pesanan, dan informasi pembayaran.</li>
      </ul>

      <h3>Bagaimana Kami Menggunakan Data Anda</h3>
      <p>Data Anda digunakan untuk:</p>
      <ol>
        <li>Memproses dan mengirimkan pesanan Anda.</li>
        <li>Mengirimkan faktur pajak dan dokumen tagihan.</li>
        <li>Menghubungi Anda terkait status pesanan atau kendala teknis.</li>
        <li>Mengirimkan newsletter promo (hanya jika Anda mendaftar atau menyetujui).</li>
      </ol>

      <h3>Keamanan Data</h3>
      <p>Kami menerapkan langkah-langkah keamanan teknis untuk melindungi data Anda dari akses yang tidak sah. Database kami disimpan di server yang aman dan terenkripsi.</p>

      <h3>Cookie</h3>
      <p>Website kami menggunakan cookie untuk meningkatkan pengalaman pengguna, seperti mengingat keranjang belanja Anda dan preferensi bahasa.</p>

      <p>Jika Anda memiliki pertanyaan tentang penggunaan data Anda, silakan hubungi <strong>privacy@hokiindo.com</strong>.</p>
    `,
        isPublished: true,
    },
    {
        title: "Daftar Member Exclusive",
        slug: "daftar-member-exclusive",
        content: `
      <h2>Bergabunglah Sebagai Member Exclusive</h2>
      <p>Tingkatkan keuntungan bisnis Anda dengan bergabung dalam program Membership Hokiindo. Program ini dirancang khusus untuk kontraktor, panel builder, dan reseller yang membutuhkan dukungan lebih.</p>

      <img src="https://images.unsplash.com/photo-1559526324-4b87b5e36e44?q=80&w=2071&auto=format&fit=crop" alt="VIP Service" style="width: 100%; border-radius: 12px; margin: 24px 0;" />

      <h3>Keuntungan Menjadi Member</h3>
      <div style="background: #fff1f2; border: 1px solid #fecaca; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <ul style="margin: 0; padding-left: 20px;">
          <li style="margin-bottom: 10px;"><strong>Diskon Bertingkat:</strong> Dapatkan diskon tambahan berdasarkan volume pembelian tahunan.</li>
          <li style="margin-bottom: 10px;"><strong>Prioritas Stok:</strong> Akses prioritas untuk produk-produk fast-moving yang stoknya terbatas.</li>
          <li><strong>Pembayaran Fleksibel:</strong> Fasilitas Term of Payment (TOP) 30 hingga 60 hari (setelah lolos survei analis kredit).</li>
        </ul>
      </div>

      <h3>Syarat Pendaftaran</h3>
      <ul>
        <li>Hanya untuk Badan Usaha (PT/CV).</li>
        <li>Melampirkan dokumen legalitas perusahaan (NIB, NPWP, SPPKP).</li>
        <li>Minimum transaksi pertama Rp 10.000.000,-</li>
      </ul>

      <h3>Formulir Pendaftaran</h3>
      <p>Untuk mengajukan keanggotaan, silakan unduh formulir di bawah ini dan kirimkan kembali ke email kami atau hubungi tim sales kami.</p>
      
      <p>
        <a href="#" style="background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">Download Formulir Member</a>
      </p>

      <p style="margin-top: 20px; font-size: 0.9em; color: #666;">*Tim kami akan memproses pengajuan Anda dalam waktu 3x24 jam kerja.</p>
    `,
        isPublished: true,
    },
];

async function main() {
    console.log(`Start seeding ${pages.length} pages...`);

    for (const page of pages) {
        const existingPage = await prisma.page.findUnique({
            where: { slug: page.slug },
        });

        if (existingPage) {
            console.log(`Updating existing page: ${page.title}`);
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
            console.log(`Creating new page: ${page.title}`);
            await prisma.page.create({
                data: page,
            });
        }
    }

    console.log('Seeding finished.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
