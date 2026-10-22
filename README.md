# Examsy - Modern Semi-Online Examination Platform (SMP Al-Irsyad)

Aplikasi ujian semi-online terintegrasi dengan proteksi **Universal Kiosk Mode & Anti-Cheat Server-Side** untuk semua platform (Windows, macOS, Android, iOS/iPadOS, Linux Desktop, dan ChromeOS).

---

## 🛡️ Panduan Pengujian Kiosk Mode per Platform

Berikut langkah-langkah untuk memverifikasi fitur Kiosk Mode & Anti-Cheat di setiap perangkat:

### 1. Windows 10/11 (Google Chrome / Microsoft Edge)
- **Tes Refresh:** Mulai ujian. Coba tekan `F5`, `Ctrl+R`, atau tombol refresh browser.
  - *Hasil yang diharapkan:* Navigasi diblokir, muncul overlay merah terkunci, alarm synthesizer berbunyi berulang setiap detik, fullscreen terkunci kembali, dan pelanggaran bertambah +1 di Supabase.
- **Tes Pintasan DevTools & Tab:** Coba tekan `F12`, `Ctrl+Shift+I`, `Ctrl+T`, `Ctrl+W`, atau `Alt+Tab`.
  - *Hasil yang diharapkan:* Tombol diblokir via Keyboard Lock API. Jika window kehilangan fokus >800ms, layar terkunci dan violation dicatat di server.
- **Tes Minimalkan Jendela:** Perkecil jendela browser ke bawah 200px.
  - *Hasil yang diharapkan:* Anomali ukuran jendela terdeteksi → pelanggaran tercatat di server.

### 2. Android 10+ (Google Chrome / WebView)
- **Tes Fullscreen & Navigasi Bar:** Tekan "Mulai Ujian". Layar langsung masuk fullscreen tanpa bilah navigasi OS (`navigationUI: "hide"`).
- **Tes Tarik Status Bar:** Usap/tarik panel notifikasi atau pengaturan cepat dari sisi atas layar (0-35px).
  - *Hasil yang diharapkan:* Zona proteksi atas mendeteksi tarikan, layar langsung terkunci dengan overlay merah, getaran HP `[400, 200, 400, 200, 400]` aktif, dan violation bertambah di server.
- **Tes Beralih Aplikasi / Split-Screen:** Tekan tombol Recent Apps atau ganti ke aplikasi lain.
  - *Hasil yang diharapkan:* Deteksi `visibilitychange` seketika mengunci ujian. Jika kuota pelanggaran habis, akun langsung di-BLOKIR.

### 3. Apple iOS / iPadOS (Safari)
- **Tes Wajib Akses Terpandu (Guided Access):**
  - Pada modal konfirmasi awal, tombol "Aktifkan Kiosk & Mulai Ujian" dalam keadaan non-aktif (disabled) hingga siswa mencentang checkbox *"Saya menyatakan telah mengaktifkan Akses Terpandu"*.
- **Tes Keluar Aplikasi ke Home Screen:**
  - Coba keluar aplikasi ke Home Screen atau switch tab Safari, lalu kembali 5-10 detik kemudian.
  - *Hasil yang diharapkan:* `webkitvisibilitychange` dan `blur` mencatat pelanggaran ke server Supabase. Siswa disambut overlay merah terkunci dengan sisa kuota yang berkurang.

### 4. macOS (Google Chrome / Safari)
- **Tes Pointer Lock:** Saat ujian dimulai pada desktop macOS, kursor dikunci ke tengah halaman (Pointer Lock API) untuk mencegah siswa menggeser mouse ke Dock atau Menu Bar atas.
- **Tes DevTools Buka di Jendela Baru:** Buka DevTools (`Cmd+Option+I` atau via menu).
  - *Hasil yang diharapkan:* Deteksi delta ukuran viewport seketika menangkap DevTools, memicu pelanggaran server-side dan auto-block.

### 5. Linux Desktop & ChromeOS
- **Tes Keyboard Lock:** Tombol `Alt+Tab`, `F1-F12`, `Ctrl+Alt+T` dinonaktifkan.
- **Tes Clipboard:** Blokir teks, klik kanan, dan pintasan `Ctrl+C` / `Ctrl+V` dibatalkan sepenuhnya.

---

## ⚙️ Setup Database Supabase

Untuk mengaktifkan fungsi RPC atomic server-side di Supabase:
1. Buka project Supabase Anda di [https://supabase.com](https://supabase.com).
2. Masuk ke menu **SQL Editor**.
3. Buka file `supabase_rls_setup.sql` di proyek ini, salin seluruh kodenya dan jalankan di SQL Editor.
4. Fungsi `log_violation` dan `should_block_student` akan aktif secara otomatis.
