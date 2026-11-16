# TanyaBali — Website informasi wisata dengan chatbot hybrid

## Fitur pada versi pengembangan
- Redesign homepage responsif dengan identitas visual hijau/cream.
- Registrasi dan login menggunakan bcryptjs.
- Session pengguna untuk melindungi halaman chatbot dan pengelolaan data.
- Chatbot hybrid: pencarian informasi dari tabel `produk`, kemudian AI API (jika `OPENAI_API_KEY` tersedia) menyusun jawaban berdasarkan hasil database.
- Pengelolaan data destinasi, pura, dan kuliner.

## Teknologi database
Repository awal memakai PostgreSQL (`pg`). Versi ini mempertahankan PostgreSQL agar database lama tidak perlu langsung dimigrasikan. Pencarian kata kunci memakai `ILIKE`-style `LOWER(...) LIKE`. PRD menyebut MySQL Fulltext Search Boolean Mode; fitur tersebut **belum diterapkan** karena sintaks dan driver MySQL tidak kompatibel dengan PostgreSQL. Migrasi database perlu diputuskan terpisah.

## Cara menjalankan
1. Install Node.js LTS dan PostgreSQL.
2. Jalankan `npm install`.
3. Salin `.env.example` menjadi `.env`, lalu isi konfigurasi PostgreSQL dan `SESSION_SECRET`.
4. Buat database bernama sesuai `DB_NAME`.
5. Jalankan isi `sql/schema.sql` pada database tersebut melalui pgAdmin atau psql.
6. (Opsional) Isi `OPENAI_API_KEY` agar chatbot memakai AI API. Tanpa key, chatbot tetap dapat menjawab dari database dengan fallback berbasis data.
7. Jalankan `npm run dev`, lalu buka `http://localhost:3000`.

## Catatan keamanan sebelum deployment
- Ganti `SESSION_SECRET` dengan nilai acak yang panjang.
- Jangan commit `.env` atau API key.
- Gunakan HTTPS di production.
- Ganti session MemoryStore bawaan express-session dengan session store persisten (misalnya PostgreSQL store) sebelum deployment.
- Batasi pengelolaan data wisata ke role admin sebelum digunakan publik; saat ini route CRUD hanya mensyaratkan pengguna login.
- Verifikasi seluruh data harga, lokasi, dan deskripsi sebelum ditampilkan ke wisatawan.

## Batasan Context-Based AI TanyaBali

Chatbot menerapkan pembatasan domain sebelum memanggil AI:
- Pertanyaan harus berkaitan dengan informasi pariwisata Bali (destinasi, pura, kuliner, wilayah, tiket, lokasi, fasilitas, dan informasi terkait).
- Pertanyaan di luar domain ditolak dengan respons sopan.
- AI hanya dipanggil jika pencarian menemukan record yang relevan di database `produk`.
- Context AI dibentuk dari hasil database; AI dilarang menggunakan pengetahuan luar atau mengarang detail yang tidak tersedia.
- Instruksi dari pengguna tidak dapat mengganti System Instruction. Riwayat percakapan dari browser tidak dipakai sebagai sumber instruksi/fakta.
- Jika database tidak menemukan data, aplikasi mengembalikan pesan bahwa informasi belum tersedia dan tidak meminta AI mengarang jawaban.

Catatan: pembatasan domain berbasis kata kunci merupakan lapisan validasi awal. Daftar istilah pada `services/chatbotService.js` dapat ditambah sesuai kategori dan kosakata yang benar-benar digunakan dalam data TanyaBali.
