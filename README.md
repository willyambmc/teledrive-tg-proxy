# TeleDrive — Panduan Deploy ke Vercel via GitHub (Gratis & Permanen)

## Apa yang akan kamu dapatkan?

Setelah deploy, kamu punya URL permanen seperti:
**`https://teledrive-xxx.vercel.app`**

Yang bisa dibuka dari **HP, laptop, tablet mana pun** — kapan saja, 24/7.
Plus fitur **Sinkronisasi Cloud** otomatis antar perangkat!

---

## Syarat

1. **Akun GitHub** (gratis di github.com)
2. **Akun Vercel** (gratis di vercel.com) — bisa login pakai akun GitHub
3. **Bot Telegram** + **Chat ID** (sudah kamu punya kalau TeleDrive sudah dipakai sebelumnya)

---

## Cara Deploy (5 Menit)

### Langkah 1: Upload ke GitHub

1. Download file `deploy-vercel.zip`, lalu ekstrak
2. Buka **github.com**, login, lalu klik **"New repository"**
3. Isi nama repository, misalnya: `teledrive`
4. Jangan centang apapun (README, .gitignore, dsb) — biarkan kosong
5. Klik **"Create repository"**
6. Di komputer kamu, buka terminal/command prompt di folder hasil ekstrak, lalu:

```bash
# Init git & push ke GitHub
git init
git add -A
git commit -m "TeleDrive siap deploy"
git remote add origin https://github.com/USERNAME-KAMU/teledrive.git
git branch -M main
git push -u origin main
```

> Ganti `USERNAME-KAMU` dengan username GitHub kamu.

### Langkah 2: Deploy ke Vercel

1. Buka **vercel.com**, login (pakai akun GitHub)
2. Klik **"Add New" → "Project"**
3. Pilih repository `teledrive` yang baru dibuat
4. **Framework Preset**: pilih **"Other"**
5. **Root Directory**: biarkan default (`.`)
6. Klik **"Deploy"**
7. Tunggu ±30 detik — selesai!

### Langkah 3: Buka & Pakai

1. Vercel akan kasih URL, misalnya `https://teledrive-abc123.vercel.app`
2. Buka URL itu di browser (HP/laptop)
3. Masukkan **Bot Token** dan **Chat ID** di Pengaturan (ikon gear)
4. Klik **"SIMPAN & UPDATE"**
5. TeleDrive siap dipakai dari device mana pun!

---

## Sinkronisasi Cloud (Otomatis)

Fitur ini sudah built-in di TeleDrive:

- Saat kamu klik **"SIMPAN & UPDATE"**, file `teledrive_backup.json` otomatis diupload ke channel Telegram kamu
- Saat kamu buka TeleDrive di **perangkat lain** dengan bot token + chat ID yang sama, data otomatis ter-download setelah 60 detik
- Setiap ada perubahan data (upload, hapus, rename), backup otomatis diupdate (3 detik setelah perubahan terakhir)
- Ada juga tombol **"Sync Cloud Sekarang"** untuk sync manual kapan saja

**Tidak perlu export/import JSON lagi antar perangkat!**

---

## Cara Update TeleDrive (via GitHub)

Kalau ada versi baru `teledrive.html`:

### Cara 1: Via GitHub Website (Termudah)
1. Buka repo GitHub kamu
2. Klik file `public/teledrive.html`
3. Klik ikon pensil (Edit this file)
4. Hapus semua isi lama, paste kode terbaru
5. Klik **"Commit changes"** → Vercel otomatis redeploy (±30 detik)

### Cara 2: Via Terminal
```bash
cd deploy-vercel
# Timpa file lama
cp /path/teledrive-baru.html public/teledrive.html
# Commit & push
git add -A
git commit -m "Update TeleDrive"
git push
```

Vercel akan **auto-deploy** setiap kali kamu push ke GitHub!

### Cara 3: Via Vercel Dashboard
1. Buka vercel.com/dashboard → pilih project
2. Tab "Deployments" → klik titik tiga di deployment terbaru → "Redeploy"

---

## Custom Domain (Opsional)

Kalau kamu punya domain sendiri (misalnya `drive.contoh.com`):

1. Di dashboard Vercel, buka project → **Settings → Domains**
2. Tambahkan domain kamu
3. Di DNS registrar, tambahkan CNAME record:
   - `drive` → `cname.vercel-dns.com`
4. Tunggu propagasi (±5-30 menit)

---

## Struktur File

```
deploy-vercel/
├── vercel.json              # Konfigurasi routing Vercel
├── package.json             # Info project
├── .gitignore               # File yang diabaikan git
├── api/
│   ├── tg-api.js            # Proxy JSON ke Telegram API (Edge Function)
│   └── tg-upload.js         # Proxy upload file ke Telegram (Edge Function)
└── public/
    ├── teledrive.html       # Aplikasi utama (single-file app, ~10000 baris)
    ├── logo.svg             # Logo
    ├── robots.txt           # SEO robots
    ├── TUTORIAL-DEPLOY.html # Tutorial deploy (bisa diakses via /TUTORIAL-DEPLOY.html)
    └── tutorial-assets/     # Gambar untuk tutorial
```

---

## FAQ

**Q: Gratis berapa lama?**
A: Vercel Hobby plan gratis selamanya dengan batas: 100GB bandwidth/bulan, cukup untuk penggunaan pribadi.

**Q: Apakah data saya aman?**
A: Bot token dan chat ID disimpan di localStorage browser kamu (tidak di server). Data file tetap di Telegram. Backup cloud juga tersimpan di channel Telegram kamu.

**Q: Upload file besar (50MB+) gagal?**
A: Vercel Edge Function punya batas body 4.5MB. Untuk file >4MB, gunakan **Proxy URL** di Pengaturan:
- Deploy proxy terpisah ke Cloudflare Workers / Deno Deploy / Render
- Atau gunakan koneksi langsung (tanpa proxy) jika ISP tidak memblokir Telegram

**Q: Sinkronisasi cloud pakai chat ID yang berbeda bisa?**
A: Saat ini, backup cloud disimpan per-bot (di bot short description). Jika kamu pakai bot token yang sama tapi channel berbeda, backup terakhir yang menang. Untuk multi-channel, gunakan menu Ekspor/Impor JSON manual.

**Q: Bisa deploy ke platform lain?**
A: Bisa! Ada juga `deploy-cloudflare.zip` untuk Cloudflare Pages, atau `deploy/teledrive-server/` untuk Render.com/Railway/Fly.io.