# Cetak Biru Infrastruktur Serverless: TanStack Start + Cloudflare (D1, R2, & Edge Guard)

Dokumen ini merupakan panduan teknis lengkap untuk membangun, mengamankan, dan mengelola infrastruktur aplikasi *fullstack serverless* menggunakan **TanStack Start**, **Drizzle ORM**, **Cloudflare D1**, dan **Cloudflare R2** dengan strategi **Zero-Cost Protection (Circuit Breaker 95%)**.

## 1. Arsitektur Sistem & Alur Data

Infrastruktur dibagi menjadi dua jalur utama agar aplikasi utama dan distribusi aset media berjalan optimal tanpa memboroskan kuota gratis:

1. **Aplikasi Utama (`claimguard.setyawannn.site`):**

   * Dijalankan di atas **Cloudflare Pages / Workers** menggunakan **TanStack Start**.

   * **Optimasi & Kompresi Client-Side:** Sebelum file dikirim melalui jaringan ke server/R2/D1, browser pengguna wajib mengompresi gambar ke format modern (**AVIF / WebP**) dengan ukuran sekecil mungkin namun tetap tajam secara visual.

   * Komunikasi database melalui `createServerFn` yang dibungkus oleh **Drizzle ORM** dan **D1 Quota Guard** (pelindung kuota harian 95%).

   * Unggahan file (*upload* / operasi Class A R2) dilakukan dari backend aplikasi utama setelah memvalidasi sisa kuota bulanan di D1.

2. **CDN Gateway Worker (`cdn.claimguard.setyawannn.site`):**

   * **Cloudflare Worker mandiri** yang terikat langsung pada domain `cdn.claimguard.setyawannn.site`.

   * Bucket R2 dibiarkan **100% Private** (tanpa `r2.dev` dan tanpa Custom Domain langsung di pengaturan R2).

   * Setiap akses langsung (*plain URL*) ke `https://cdn.claimguard.setyawannn.site/<uuid>.webp` dicegat oleh Worker ini untuk memeriksa **Cloudflare Edge Cache** dan kuota **Class B** di D1 sebelum mengambil objek dari R2. Jika kuota menyentuh 95%, Worker otomatis menyajikan gambar *placeholder/fallback*.

```
[Pengunjung / Browser]
       │
       ├──► [Client-Side Compressor] (Resize + Convert ke WebP/AVIF < 150 KB, tetap jernih)
       │         │
       │         ▼
       ├──► https://claimguard.setyawannn.site (TanStack Start App)
       │         │
       │         ├──► [D1 Quota Guard (95%)] ──► Cloudflare D1 (SQLite)
       │         └──► [R2 Upload Controller] ──► Private R2 Bucket (Class A)
       │
       └──► https://cdn.claimguard.setyawannn.site/<file>.webp (CDN Gateway Worker)
                 │
                 ├──► 1. Cek Edge Cache (caches.default) ──► Hit (0 Kuota D1 & R2)
                 ├──► 2. Cek Kuota Class B di D1 (< 95%) ──► Jika >= 95%: Return Fallback
                 └──► 3. Ambil dari Private R2 Bucket ──► Simpan ke Edge Cache


```

## 2. Rincian Kuota Free Tier & Batas Aman (95% Threshold)

Seluruh mekanisme *circuit breaker* di kode aplikasi dikalibrasi pada ambang batas **95%** agar tersisa ruang cadangan 5% untuk *maintenance* dan menghindari pemblokiran mendadak atau tagihan tak terduga.

| Layanan | Metrik | Batas Resmi Free Tier | Batas Circuit Breaker (95%) | Jadwal Reset | 
| ----- | ----- | ----- | ----- | ----- | 
| **Cloudflare D1** | Rows Read | 5.000.000 / hari | **4.750.000 / hari** | 00:00 UTC (07:00 WIB) | 
| **Cloudflare D1** | Rows Written | 100.000 / hari | **95.000 / hari** | 00:00 UTC (07:00 WIB) | 
| **Cloudflare D1** | Total Storage | 5 GB (maks. 500 MB/DB) | **4,75 GB** (475 MB/DB) | Permanen | 
| **Cloudflare R2** | Storage (Standard) | 10 GB / bulan | **9,5 GB** | Bulanan | 
| **Cloudflare R2** | Class A (Write/List) | 1.000.000 / bulan | **950.000 / bulan** | Tanggal 1 setiap bulan | 
| **Cloudflare R2** | Class B (Read/Head) | 10.000.000 / bulan | **9.500.000 / bulan** | Tanggal 1 setiap bulan | 
| **Workers KV** | Reads / Writes | 100k read / 1k write / hari | Sinkronisasi per 10 detik | 00:00 UTC (07:00 WIB) | 

### Aturan Penting Terkait Kuota:

* **Wajib Tipe Standard pada R2:** Pastikan bucket R2 menggunakan kelas **Standard**. Jangan pernah menggunakan *Infrequent Access* karena tidak memiliki kuota gratis.

* **Operasi Gratis di R2:** `DELETE` (`env.R2.delete()`) tidak dihitung sebagai Class A maupun Class B. Saat menghapus file, cukup kurangi `total_bytes` di D1.

* **Hindari `R2.list()`:** Operasi `list()` memakan kuota Class A. Selalu simpan daftar metadata file (nama key, ukuran byte, tipe MIME) di tabel D1.

## 3. Strategi Optimasi & Kompresi File (Sangat Kecil Namun Tetap Jernih)

Karena batas CPU Cloudflare Workers Free hanya **10 ms per request**, proses kompresi gambar **tidak boleh dilakukan di server/Worker**, melainkan wajib dilakukan di **sisi client (browser pengguna)** sebelum file dikirim ke `createServerFn` / R2 / D1.

### Prinsip Kompresi "Perceptually Lossless" (Tajam di Mata, Ukuran Mini):

1. **Format Wajib `WebP` (atau `AVIF`):**

   * Foto kamera ponsel modern (JPEG/HEIC 4000×3000 px) biasanya berukuran **3 MB – 8 MB**.

   * Dengan mengonversinya ke **WebP** dan mengubah dimensi ke batas baca manusia, ukurannya menyusut hingga **60 KB – 150 KB** (hemat **95%+** kapasitas R2, sehingga kuota 9,5 GB mampu menampung **60.000 hingga 150.000 gambar**!).

2. **Batas Resolusi Optimal (`maxWidthOrHeight`):**

   * **Bukti Klaim / Dokumen / Struk (perlu teks terbaca jelas):** Maksimal sisi terpanjang **1600px** dengan kualitas `0.80` (80%). Teks kecil pada struk atau nomor seri tetap tajam tanpa pecah.

   * **Foto Produk / Dokumentasi Umum:** Maksimal sisi terpanjang **1280px** dengan kualitas `0.75` (75%).

   * **Avatar / Thumbnail:** Maksimal **400px** dengan kualitas `0.75`.

3. **Penghapusan Metadata EXIF:**

   * Menggambar ulang gambar lewat HTML5 `<canvas>` / `OffscreenCanvas` otomatis membuang metadata berat (lokasi GPS, profil warna kamera, thumbnail tersembunyi) tanpa mengurangi kualitas piksel visual.

4. **Validasi Keras di Server (`createServerFn`):**

   * Backend tetap wajib menolak file mentah yang belum terkompresi (misalnya menolak file di atas **500 KB** atau format non-WebP/AVIF) agar kuota penyimpanan tidak bocor akibat pengguna yang mem-bypass frontend.

### Contoh Utilitas Kompresi Client-Side (`src/utils/image-compressor.ts`)

Menggunakan library ringan **`browser-image-compression`** (berjalan di Web Worker browser sehingga UI React tidak *lag*):

```
import imageCompression from "browser-image-compression";

export type CompressionPreset = "document" | "photo" | "avatar";

const PRESETS: Record<
  CompressionPreset,
  { maxSizeMB: number; maxWidthOrHeight: number; initialQuality: number }
> = {
  // Dokumen/struk: resolusi 1600px & kualitas 80% agar tulisan kecil tetap sangat tajam
  document: {
    maxSizeMB: 0.25, // Target maksimal 250 KB
    maxWidthOrHeight: 1600,
    initialQuality: 0.8,
  },
  // Foto umum: resolusi 1280px & kualitas 75% (sangat jernih di layar HP/Desktop)
  photo: {
    maxSizeMB: 0.15, // Target maksimal 150 KB
    maxWidthOrHeight: 1280,
    initialQuality: 0.75,
  },
  // Avatar/profil: resolusi 400px & kualitas 75%
  avatar: {
    maxSizeMB: 0.05, // Target maksimal 50 KB
    maxWidthOrHeight: 400,
    initialQuality: 0.75,
  },
};

export async function compressImageBeforeUpload(
  file: File,
  preset: CompressionPreset = "photo"
): Promise<File> {
  // Pastikan hanya file gambar yang diproses
  if (!file.type.startsWith("image/")) {
    throw new Error("File harus berupa gambar.");
  }

  const config = PRESETS[preset];

  const compressedBlob = await imageCompression(file, {
    maxSizeMB: config.maxSizeMB,
    maxWidthOrHeight: config.maxWidthOrHeight,
    initialQuality: config.initialQuality,
    useWebWorker: true, // Tidak memblokir main thread UI
    fileType: "image/webp", // Konversi paksa ke WebP untuk rasio ukuran/kualitas terbaik
    alwaysKeepResolution: false,
  });

  // Bungkus kembali menjadi objek File dengan ekstensi .webp
  const cleanName = file.name.replace(/\.[^/.]+$/, "") + ".webp";
  return new File([compressedBlob], cleanName, {
    type: "image/webp",
    lastModified: Date.now(),
  });
}

```

## 4. Skema Database Drizzle ORM (`src/db/schema.ts`)

Skema dirancang menggunakan tipe SQL standar agar mudah bermigrasi ke PostgreSQL atau MySQL di masa depan.

```
import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";

// 1. Tabel Pelacakan Kuota Bulanan R2 Storage
export const storageUsage = sqliteTable("storage_usage", {
  month: text("month").primaryKey(), // Format: "YYYY-MM" (misal: "2026-11")
  classA: integer("class_a").notNull().default(0),
  classB: integer("class_b").notNull().default(0),
  totalBytes: integer("total_bytes").notNull().default(0),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

// 2. Tabel Katalog File Media (Pengganti R2.list)
export const mediaFiles = sqliteTable(
  "media_files",
  {
    id: text("id").primaryKey(), // UUID v4
    objectKey: text("object_key").notNull().unique(), // Contoh: "uploads/9b1deb4d.webp"
    mimeType: text("mime_type").notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    uploadedBy: text("uploaded_by").notNull(),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  },
  (table) => [
    // Index wajib agar query pencarian tidak melakukan full table scan
    index("idx_media_uploaded_by").on(table.uploadedBy),
  ]
);

```

## 5. Implementasi D1 Quota Guard (`src/db/d1-guard.ts`)

Pembungkus (`Proxy`) untuk objek `D1Database` yang membaca metrik eksak `meta.rows_read` dan `meta.rows_written` dari setiap respons D1, menyimpannya di memori *isolate* serta **Workers KV**, dan memutus koneksi saat menyentuh 95%.

```
const MAX_READS_95 = 4_750_000;
const MAX_WRITES_95 = 95_000;

let localReads = 0;
let localWrites = 0;
let lastSyncTime = 0;

function getTodayKey() {
  const dateStr = new Date().toISOString().split("T")[0]; // Reset mengikuti 00:00 UTC
  return `d1_usage:${dateStr}`;
}

export function createGuardedD1(db: D1Database, kv: KVNamespace): D1Database {
  const key = getTodayKey();

  const checkAndRecord = async (
    executeFn: () => Promise<any>,
    isWriteIntent = false
  ) => {
    const now = Date.now();

    // Sinkronisasi dari KV setiap 10 detik untuk menghemat limit write KV (1.000/hari)
    if (now - lastSyncTime > 10_000) {
      const stored = await kv.get<{ reads: number; writes: number }>(key, "json");
      if (stored) {
        localReads = Math.max(localReads, stored.reads);
        localWrites = Math.max(localWrites, stored.writes);
      }
      lastSyncTime = now;
    }

    // Circuit Breaker: Putus sebelum mengeksekusi query ke D1
    if (localReads >= MAX_READS_95 || (isWriteIntent && localWrites >= MAX_WRITES_95)) {
      throw new Error("D1_QUOTA_GUARD: Batas harian 95% tercapai. Koneksi diputus.");
    }

    const result = await executeFn();

    // Hitung baris yang baru saja dipindai/ditulis dari metadata D1
    const meta = Array.isArray(result)
      ? result.reduce(
          (acc, r) => ({
            reads: acc.reads + (r.meta?.rows_read || 0),
            writes: acc.writes + (r.meta?.rows_written || 0),
          }),
          { reads: 0, writes: 0 }
        )
      : {
          reads: result?.meta?.rows_read || 0,
          writes: result?.meta?.rows_written || 0,
        };

    localReads += meta.reads;
    localWrites += meta.writes;

    // Update KV segera jika mendekati limit atau lonjakan besar
    if (
      localReads >= MAX_READS_95 ||
      localWrites >= MAX_WRITES_95 ||
      meta.reads > 2500 ||
      meta.writes > 250
    ) {
      await kv.put(
        key,
        JSON.stringify({ reads: localReads, writes: localWrites }),
        { expirationTtl: 86400 }
      );
    }

    return result;
  };

  return new Proxy(db, {
    get(target, prop, receiver) {
      if (prop === "batch") {
        return (statements: D1PreparedStatement[]) =>
          checkAndRecord(() => target.batch(statements), true);
      }
      if (prop === "prepare") {
        return (query: string) => {
          const stmt = target.prepare(query);
          const isWrite = /^\s*(INSERT|UPDATE|DELETE|CREATE|ALTER|DROP)/i.test(query);

          return new Proxy(stmt, {
            get(sTarget, sProp) {
              if (["all", "run", "first", "raw"].includes(String(sProp))) {
                return (...args: any[]) =>
                  checkAndRecord(() => (sTarget as any)[sProp](...args), isWrite);
              }
              return Reflect.get(sTarget, sProp);
            },
          });
        };
      }
      return Reflect.get(target, prop, receiver);
    },
  });
}

```

## 6. Implementasi Storage Controller (Upload Class A di TanStack Start)

Gunakan fungsi ini di dalam `createServerFn` saat pengguna mengunggah file. Controller ini juga memvalidasi batas ukuran maksimal file terkompresi (maks. 500 KB) agar file mentah berukuran besar tidak lolos masuk ke R2 maupun D1.

```
import { eq, sql } from "drizzle-orm";
import { storageUsage, mediaFiles } from "./schema";
import type { DrizzleD1Database } from "drizzle-orm/d1";

const MAX_BYTES_95 = 9.5 * 1024 * 1024 * 1024; // 9.5 GB
const MAX_CLASS_A_95 = 950_000;
const MAX_SINGLE_FILE_BYTES = 500 * 1024; // Batas keras 500 KB per file terkompresi

export async function uploadToR2Safe(params: {
  db: DrizzleD1Database;
  r2: R2Bucket;
  fileBuffer: ArrayBuffer;
  mimeType: string;
  userId: string;
}) {
  const { db, r2, fileBuffer, mimeType, userId } = params;
  const monthKey = new Date().toISOString().slice(0, 7);
  const fileSize = fileBuffer.byteLength;

  // 1. Validasi ukuran & format hasil kompresi client-side
  if (fileSize > MAX_SINGLE_FILE_BYTES) {
    throw new Error("FILE_TOO_LARGE: Gambar harus dikompresi di bawah 500 KB sebelum dikirim.");
  }
  if (!["image/webp", "image/avif"].includes(mimeType)) {
    throw new Error("INVALID_FORMAT: Hanya format gambar teroptimasi (WebP/AVIF) yang diizinkan.");
  }

  // 2. Ambil atau inisialisasi catatan kuota bulan ini
  await db
    .insert(storageUsage)
    .values({ month: monthKey, classA: 0, classB: 0, totalBytes: 0, updatedAt: new Date() })
    .onConflictDoNothing();

  const [usage] = await db
    .select()
    .from(storageUsage)
    .where(eq(storageUsage.month, monthKey));

  // 3. Cek batas Storage & Class A (95%)
  if (usage.totalBytes + fileSize >= MAX_BYTES_95 || usage.classA >= MAX_CLASS_A_95) {
    throw new Error("R2_QUOTA_GUARD: Kapasitas penyimpanan atau operasi upload bulanan mencapai 95%.");
  }

  // 4. Upload ke Private R2 Bucket menggunakan UUID acak
  const fileId = crypto.randomUUID();
  const ext = mimeType.split("/")[1] || "webp";
  const objectKey = `uploads/${fileId}.${ext}`;

  await r2.put(objectKey, fileBuffer, {
    httpMetadata: { contentType: mimeType },
  });

  // 5. Catat metadata file & tambah counter Class A + totalBytes secara atomik (db.batch)
  await db.batch([
    db.insert(mediaFiles).values({
      id: fileId,
      objectKey,
      mimeType,
      sizeBytes: fileSize,
      uploadedBy: userId,
      createdAt: new Date(),
    }),
    db
      .update(storageUsage)
      .set({
        classA: sql`${storageUsage.classA} + 1`,
        totalBytes: sql`${storageUsage.totalBytes} + ${fileSize}`,
        updatedAt: new Date(),
      })
      .where(eq(storageUsage.month, monthKey)),
  ]);

  return {
    id: fileId,
    url: `https://cdn.claimguard.setyawannn.site/${objectKey}`,
  };
}

```

## 7. Implementasi CDN Gateway Worker (`cdn.claimguard.setyawannn.site`)

Worker mandiri ini melayani akses gambar *plain URL* dari `cdn.claimguard.setyawannn.site` 24 jam penuh meskipun aplikasi utama sedang *maintenance*.

```
// cdn-gateway/src/index.ts
export interface Env {
  DB: D1Database;
  R2_BUCKET: R2Bucket;
}

const FALLBACK_IMAGE_URL = "https://claimguard.setyawannn.site/assets/placeholder.webp";
const MAX_CLASS_B_95 = 9_500_000;

// Buffer di memori untuk mencegah pemborosan kuota write D1 saat trafik gambar tinggi
let pendingReads = 0;
let lastFlush = 0;

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    if (request.method !== "GET" && request.method !== "HEAD") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    const url = new URL(request.url);
    const key = decodeURIComponent(url.pathname.slice(1));
    if (!key) return serveFallback();

    // 1. Cek Cloudflare Edge Cache terlebih dahulu (0 hit R2, 0 hit D1)
    const cache = caches.default;
    const cachedResponse = await cache.match(request);
    if (cachedResponse) return cachedResponse;

    // 2. Cek kuota Class B bulan ini di D1
    const monthKey = new Date().toISOString().slice(0, 7);
    let currentClassB = pendingReads;

    try {
      const row = await env.DB.prepare(
        "SELECT class_b FROM storage_usage WHERE month = ?"
      )
        .bind(monthKey)
        .first<{ class_b: number }>();
      currentClassB += row?.class_b || 0;
    } catch {
      // Jika D1 sendiri sudah menyentuh limit/error, langsung alihkan ke fallback
      return serveFallback();
    }

    // 3. Circuit Breaker Class B (95%)
    if (currentClassB >= MAX_CLASS_B_95) {
      return serveFallback();
    }

    // 4. Ambil file dari Private R2 Bucket
    const object = await env.R2_BUCKET.get(key);
    if (!object) {
      return serveFallback();
    }

    // 5. Buffered Update ke D1 (tulis setiap kelipatan 25 read atau 15 detik)
    pendingReads += 1;
    const now = Date.now();
    if (pendingReads >= 25 || now - lastFlush > 15_000) {
      const increment = pendingReads;
      pendingReads = 0;
      lastFlush = now;

      ctx.waitUntil(
        env.DB.prepare(
          `INSERT INTO storage_usage (month, class_a, class_b, total_bytes, updated_at)
           VALUES (?, 0, ?, 0, ?)
           ON CONFLICT(month) DO UPDATE SET class_b = class_b + ?, updated_at = ?`
        )
          .bind(monthKey, increment, Date.now(), increment, Date.now())
          .run()
      );
    }

    // 6. Kirim gambar & simpan di Edge Cache selama 1 tahun
    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set("etag", object.httpEtag);
    headers.set("Cache-Control", "public, max-age=31536000, immutable");
    headers.set("Access-Control-Allow-Origin", "*");

    const response = new Response(object.body, { headers });
    ctx.waitUntil(cache.put(request, response.clone()));

    return response;
  },
};

async function serveFallback(): Promise<Response> {
  const res = await fetch(FALLBACK_IMAGE_URL);
  return new Response(res.body, {
    status: 200,
    headers: {
      "Content-Type": res.headers.get("Content-Type") || "image/webp",
      // Wajib no-store agar gambar asli otomatis muncul kembali saat kuota bulan baru di-reset
      "Cache-Control": "no-store, max-age=0",
      "X-Storage-Fallback": "true",
    },
  });
}

```

## 8. Konfigurasi `wrangler.toml`

### A. Untuk CDN Gateway Worker (`cdn-gateway/wrangler.toml`)

```
name = "claimguard-cdn-gateway"
main = "src/index.ts"
compatibility_date = "2026-11-01"

# Menghubungkan custom domain langsung ke Worker (bukan ke R2)
routes = [
  { pattern = "cdn.claimguard.setyawannn.site", custom_domain = true }
]

[[d1_databases]]
binding = "DB"
database_name = "claimguard-db"
database_id = "<ISI_DENGAN_ID_DATABASE_D1_KAMU>"

[[r2_buckets]]
binding = "R2_BUCKET"
bucket_name = "claimguard-private-media"

```

### B. Untuk Aplikasi Utama TanStack Start (`wrangler.toml`)

Pastikan binding `DB` dan `R2_BUCKET` menggunakan nama database dan bucket yang sama, ditambah binding `USAGE_KV` untuk D1 Guard:

```
[[d1_databases]]
binding = "DB"
database_name = "claimguard-db"
database_id = "<ISI_DENGAN_ID_DATABASE_D1_KAMU>"

[[r2_buckets]]
binding = "R2_BUCKET"
bucket_name = "claimguard-private-media"

[[kv_namespaces]]
binding = "USAGE_KV"
id = "<ISI_DENGAN_ID_KV_NAMESPACE_KAMU>"

```

## 9. Checklist Persiapan & Verifikasi Kelancaran Sistem

Lakukan langkah-langkah berikut secara berurutan sebelum meluncurkan aplikasi ke publik:

### Tahap 1: Konfigurasi Dashboard Cloudflare

* \[ \] **Verifikasi Paket Akun:** Pastikan akun berada pada paket **Workers Free** (hard cap, tanpa tagihan *pay-as-you-go*).

* \[ \] **Kunci Akses Publik R2:** Buka dashboard R2 $\rightarrow$ pilih bucket `claimguard-private-media` $\rightarrow$ tab **Settings** $\rightarrow$ pastikan bagian **Public Access (`r2.dev`)** berstatus **Disabled** dan **Custom Domains** kosong.

* \[ \] **Sediakan Aset Fallback:** Pastikan file `placeholder.webp` sudah tersedia dan dapat diakses publik di aplikasi utama (`https://claimguard.setyawannn.site/assets/placeholder.webp`) tanpa melewati CDN Gateway Worker (agar tidak terjadi *infinite loop* saat fallback dipanggil).

* \[ \] **Jalankan Migrasi Drizzle:** Jalankan `npx drizzle-kit generate` dan `npx wrangler d1 migrations apply claimguard-db --remote` untuk membuat tabel `storage_usage` dan `media_files`.

### Tahap 2: Pengujian Optimasi Gambar & Fungsional

* \[ \] **Uji Kualitas & Ukuran Kompresi:** Pilih foto kamera resolusi tinggi (misal 4 MB) di form unggah aplikasi, jalankan `compressImageBeforeUpload(file, "document")`, dan pastikan hasil akhirnya berformat `.webp` di bawah 250 KB namun teks/detail kecil pada gambar tetap tajam terbaca mata.

* \[ \] **Uji Penolakan File Mentah:** Coba kirim file > 500 KB langsung ke endpoint server tanpa kompresi, dan pastikan `uploadToR2Safe` menolak dengan pesan `FILE_TOO_LARGE` sebelum menyentuh R2 atau D1.

* \[ \] **Uji Akses Normal & Edge Cache:** Buka URL `https://cdn.claimguard.setyawannn.site/uploads/<uuid>.webp` di tab browser baru, lalu *refresh*. Pastikan *Response Headers* memunculkan `cf-cache-status: HIT` (0 kuota R2 & D1).

* \[ \] **Simulasi Limit 95% Class B (R2 Read):**

  1. Buka D1 Console dan jalankan: `UPDATE storage_usage SET class_b = 9500001 WHERE month = '2026-11';`

  2. Buka URL gambar baru (yang belum pernah di-cache CDN) di browser.

  3. Pastikan browser menampilkan gambar *placeholder* dan pada *Response Headers* muncul `X-Storage-Fallback: true` serta `Cache-Control: no-store`.

  4. Kembalikan nilai `class_b` ke angka semula setelah pengujian selesai.

* \[ \] **Simulasi Limit 95% D1 Reads/Writes:**

  1. Ubah sementara konstanta `MAX_READS_95 = 5` di lingkungan *staging/dev*.

  2. Lakukan beberapa kali *refresh* halaman di aplikasi TanStack Start.

  3. Pastikan aplikasi melempar pesan error `D1_QUOTA_GUARD` secara instan dan angka pemakaian di dashboard Cloudflare D1 berhenti bertambah.

### Tahap 3: Pemantauan Berkala & Migrasi Masa Depan

* \[ \] **Optimasi Query:** Selalu gunakan `.limit()` pada query daftar data dan pasang `index()` pada setiap kolom yang sering dipakai di klausa `WHERE` Drizzle.

* \[ \] **Rencana Migrasi ke PostgreSQL / MySQL:** Jika suatu hari kapasitas melebihi batas gratis dan kamu memutuskan pindah ke PostgreSQL (Neon/Supabase) atau MySQL, cukup ubah impor tabel di `src/db/schema.ts` dari `drizzle-orm/sqlite-core` ke `drizzle-orm/pg-core` atau `drizzle-orm/mysql-core`, ganti driver koneksi di `getDb()`, dan jalankan ulang migrasi tanpa perlu mengubah logika komponen React di TanStack Start.