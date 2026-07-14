# TeleDrive — Deploy ke Vercel via GitHub

## Syarat
1. **Akun GitHub** (gratis di github.com)
2. **Akun Vercel** (gratis di vercel.com) — login pakai akun GitHub

## Cara Deploy (5 Menit)

### Langkah 1: Upload ke GitHub
1. Download file `deploy-vercel.zip`, lalu **ekstrak**
2. Buka **github.com**, login, klik **"New repository"**
3. Isi nama repository, misalnya: `teledrive`
4. Jangan centang apapun — biarkan kosong
5. Klik **"Create repository"**
6. Di terminal, buka folder hasil ekstrak:

```bash
cd teledrive
git init
git add -A
git commit -m "TeleDrive siap deploy"
git remote add origin https://github.com/USERNAME-KAMU/teledrive.git
git branch -M main
git push -u origin main
```

### Langkah 2: Deploy ke Vercel
1. Buka **vercel.com**, login (pakai akun GitHub)
2. Klik **"Add New" → "Project"**
3. Pilih repository `teledrive`
4. **Framework Preset**: otomatis terdeteksi dari vercel.json (jika diminta, pilih **"Other"**)
5. Klik **"Deploy"**
6. Tunggu ±30 detik — selesai!

### Langkah 3: Buka & Pakai
1. Buka URL dari Vercel, misalnya `https://teledrive-abc123.vercel.app`
2. Masukkan **Bot Token**, **Chat ID**, dan **Proxy URL** di Pengaturan
3. Klik **"SIMPAN & UPDATE"**

## Penting: Proxy URL

Karena Vercel tidak menyediakan server proxy bawaan, kamu **WAJIB mengisi Proxy URL** di Pengaturan:

| Proxy | Cara |
|-------|------|
| **Cloudflare Workers** | Isi URL Workers kamu (contoh: `https://tg-proxy.namakamu.workers.dev/`) |
| **Deno Deploy** | Isi URL Deno kamu |
| **Render** | Isi URL Render kamu |
| **proxy.cors.sh** | Klik "Gunakan Proxy Publik" di Pengaturan (hanya GET, upload butuh proxy lain) |

> **Tanpa Proxy URL**, koneksi dari browser ke Telegram akan diblokir (CORS).

## Struktur File

```
deploy-vercel/
├── vercel.json          # Konfigurasi: framework=null, output dari public/
├── package.json
├── .gitignore
├── api/
│   ├── tg-api.js        # Proxy: API JSON Telegram (GET/POST)
│   ├── tg-file.js       # Proxy: Download/Preview file
│   └── tg-upload.js     # Proxy: Upload file ke Telegram
└── public/
    ├── teledrive.html   # Aplikasi utama
    ├── logo.svg
    └── robots.txt
```

## FAQ

**Q: Gratis berapa lama?**
A: Vercel Hobby plan gratis selamanya (100GB bandwidth/bulan).

**Q: Data aman?**
A: Bot token & chat ID disimpan di localStorage browser. File tetap di Telegram.

**Q: Upload file besar gagal?**
A: Gunakan Proxy URL (Cloudflare/Deno/Render) untuk upload file.