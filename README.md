# TeleDrive — Panduan Deploy ke Vercel (Gratis & Permanen)

## 🎯 Apa yang akan kamu dapatkan?

Setelah deploy, kamu punya URL permanen seperti:
**`https://teledrive-xxx.vercel.app`**

Yang bisa dibuka dari **HP, laptop, tablet mana pun** — kapan saja, 24/7.

---

## 📋 Syarat

1. **Akun GitHub** (gratis di github.com)
2. **Akun Vercel** (gratis di vercel.com) — bisa login pakai akun GitHub
3. **Bot Telegram** + **Chat ID** (sudah kamu punya kalau TeleDrive sudah dipakai sebelumnya)

---

## 🚀 Cara Deploy (5 Menit)

### Langkah 1: Upload ke GitHub

1. Buka **github.com**, login, lalu klik **"New repository"**
2. Isi nama repository, misalnya: `teledrive`
3. Jangan centang apapun (README, .gitignore, dsb) — biarkan kosong
4. Klik **"Create repository"**
5. Di komputer kamu, buka terminal/command prompt, lalu:

```bash
# Masuk ke folder deploy-vercel
cd deploy-vercel

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
7. Tunggu ±30 detik — selesai! 🎉

### Langkah 3: Buka & Pakai

1. Vercel akan kasih URL, misalnya `https://teledrive-abc123.vercel.app`
2. Buka URL itu di browser (HP/laptop)
3. Masukkan **Bot Token** dan **Chat ID** di Settings
4. TeleDrive siap dipakai dari device mana pun!

---

## 🌐 Custom Domain (Opsional)

Kalau kamu punya domain sendiri (misalnya `drive.contoh.com`):

1. Di dashboard Vercel, buka project → **Settings → Domains**
2. Tambahkan domain kamu
3. Di DNS registrar, tambahkan CNAME record:
   - `drive` → `cname.vercel-dns.com`
4. Tunggu propagasi (±5-30 menit)

---

## 🔄 Cara Update TeleDrive

Kalau ada versi baru `teledrive.html`:

```bash
cd deploy-vercel
# Timpa file lama
cp /path/teledrive.html public/teledrive.html
# Commit & push
git add -A
git commit -m "Update TeleDrive"
git push
```

Vercel akan **auto-deploy** setiap kali kamu push ke GitHub!

---

## 📁 Struktur File

```
deploy-vercel/
├── vercel.json              # Konfigurasi routing Vercel
├── package.json             # Info project
├── .gitignore               # File yang diabaikan git
├── api/
│   ├── tg-api.js            # Proxy JSON ke Telegram API
│   └── tg-upload.js         # Proxy upload file ke Telegram
└── public/
    ├── teledrive.html       # Aplikasi utama (single-file app)
    ├── logo.svg             # Logo
    └── robots.txt           # SEO robots
```

---

## ❓ FAQ

**Q: Gratis berapa lama?**
A: Vercel Hobby plan gratis selamanya dengan batas: 100GB bandwidth/bulan, cukup untuk penggunaan pribadi.

**Q: Apakah data saya aman?**
A: Bot token dan chat ID disimpan di localStorage browser kamu (tidak di server). Data file tetap di Telegram.

**Q: Kenapa preview sandbox tidak bisa dibuka dari device lain?**
A: Preview sandbox hanya berjalan sementara di container development. Untuk akses permanen, perlu deploy ke hosting seperti Vercel.

**Q: Bisa deploy ke platform lain?**
A: Bisa! Folder `deploy/teledrive-server/` berisi server Node.js mandiri yang bisa di-deploy ke Render.com, Railway.app, atau Fly.io.

**Q: Upload file besar (50MB+) gagal?**
A: Vercel Edge Function punya batas body 4.5MB. Untuk file >4MB, gunakan **Proxy URL** di Settings:
- Deploy proxy terpisah: `vercel-proxy-repo/api/[...path].js` ke Vercel lain
- Atau gunakan `deploy/teledrive-server/` di Render/Railway (tanpa batas ukuran)