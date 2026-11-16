const OpenAI = require('openai');
const knowledge = require('../models/knowledgeModel');

let client = null;

const OUT_OF_SCOPE_REPLY =
  'Maaf, saya TanyaBali AI. Saya hanya dapat membantu memberikan informasi seputar tempat wisata, pura, kuliner khas, dan informasi pariwisata Bali.';

// Gerbang awal untuk mencegah AI digunakan sebagai chatbot serbaguna.
const tourismTerms = [
  'bali', 'wisata', 'wisatawan', 'destinasi', 'tempat wisata', 'objek wisata',
  'obyek wisata', 'pantai', 'pura', 'museum', 'air terjun', 'gunung', 'danau',
  'desa wisata', 'kuliner', 'makanan khas', 'masakan', 'oleh oleh', 'oleh-oleh',
  'kabupaten', 'kecamatan', 'ubud', 'denpasar', 'badung', 'gianyar', 'tabanan',
  'buleleng', 'bangli', 'karangasem', 'jembrana', 'klungkung', 'nusa penida',
  'tiket', 'harga', 'biaya masuk', 'alamat', 'lokasi', 'fasilitas', 'jam buka',
  'jam operasional', 'rute', 'jarak', 'penginapan'
];

const unrelatedRequests = [
  /\b(buatkan|bikin|tuliskan|coding|kode program|program|debug|debugging)\b.*\b(game|website|aplikasi|script|program)\b/i,
  /\b(kerjakan|jawabkan)\b.*\b(tugas|ujian|matematika|soal)\b/i,
  /\b(puisi|cerpen|dongeng|pantun|terjemahkan|translate)\b/i
];

function isTourismQuestion(question) {
  const normalized = question.toLowerCase();
  if (unrelatedRequests.some((pattern) => pattern.test(normalized))) return false;
  return tourismTerms.some((term) => normalized.includes(term));
}

function getClient() {
  if (!process.env.OPENAI_API_KEY) return null;
  if (!client) client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return client;
}

function formatPrice(price) {
  const amount = Number(price);
  return Number.isFinite(amount) && amount > 0
    ? `Rp ${amount.toLocaleString('id-ID')}`
    : 'Belum tersedia';
}

exports.reply = async (question) => {
  // 1. Batasi domain pertanyaan (harus seputar pariwisata Bali)
  if (!isTourismQuestion(question)) {
    return { answer: OUT_OF_SCOPE_REPLY, source: 'scope-guard', matches: [] };
  }

  // 2. Cari di database lokal terlebih dahulu
  const matches = await knowledge.search(question);
  const hasDatabaseData = matches.length > 0;

  const contextRecords = hasDatabaseData 
    ? matches.map((item) => ({
        nama: item.name,
        kategori: item.category,
        harga: formatPrice(item.price),
        keterangan: item.description || 'Tidak ada keterangan dalam database'
      }))
    : [];

  const ai = getClient();
  
  // Jika tidak ada API key tapi data database ada
  if (!ai && hasDatabaseData) {
    const list = contextRecords.map((item) =>
      `• ${item.nama} — ${item.kategori} — Harga: ${item.harga}. ${item.keterangan}`
    ).join('\n');
    return {
      answer: `Berikut informasi yang ditemukan di database TanyaBali:\n${list}`,
      source: 'database',
      matches
    };
  }

  // Jika tidak ada API key dan database kosong
  if (!ai && !hasDatabaseData) {
    return { 
      answer: 'Maaf, informasi tersebut belum tersedia dan AI tidak aktif.', 
      source: 'database-empty', 
      matches: [] 
    };
  }

  // 3. System instruction dengan mode Hybrid (Database prioritas, fallback ke pengetahuan umum Bali)
  const systemInstruction = `
Kamu adalah TanyaBali AI, asisten virtual khusus informasi pariwisata, budaya, pura, dan kuliner Bali.

ATURAN MENJAWAB:
1. PRIORITAS UTAMA: Jika terdapat "DATA DATABASE" di bawah ini, gunakan data tersebut sebagai acuan utama untuk menjawab.
2. JIKA DATA DATABASE KOSONG / TIDAK ADA: Kamu diizinkan menggunakan pengetahuan umummu sendiri yang akurat mengenai pariwisata, tempat menarik, pura, atau kuliner di Bali untuk menjawab pertanyaan pengguna dengan ramah dan informatif.
3. Jangan pernah keluar dari topik seputar Bali. Jika pengguna bertanya di luar Bali, tolak dengan sopan.

DATA DATABASE LOKAL:
${hasDatabaseData ? JSON.stringify(contextRecords, null, 2) : "Tidak ada data spesifik yang cocok di database lokal."}
`;

  const completion = await ai.chat.completions.create({
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemInstruction },
      { role: 'user', content: question }
    ],
    temperature: 0.3,
    max_tokens: 450
  });

  // Tentukan label sumber secara dinamis
  const sourceLabel = hasDatabaseData ? 'database + AI' : 'AI (Pengetahuan Umum Bali)';

  return {
    answer: completion.choices[0]?.message?.content?.trim() || 'Maaf, terjadi kesalahan saat memproses jawaban.',
    source: sourceLabel,
    matches
  };
};

exports.isTourismQuestion = isTourismQuestion;