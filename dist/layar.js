"use strict";
// layar.ts – Logika Halaman Layar Antrian (layar.html)
// Sesuai Spesifikasi Soal Praktikum Modul 3:
// 1. Auth Guard (Catatan Revisi 13 Okt 2026): Halaman layar.html bersifat protected
//    apabila pengguna belum login (mengecek authToken di localStorage). Jika belum login, redirect ke login.html.
// 2. Tampilan Real-time & Polling Otomatis:
//    - Mengolah pembaharuan data secara otomatis (polling interval 2.5 detik) tanpa reload halaman.
//    - Sinkronisasi instan antar-tab melalui event listener 'storage'.
// 3. Panel Layar (Sesuai Mockup image4.png):
//    - Kartu informasi untuk setiap jenis antrian aktif.
//    - Menampilkan nomor antrian yang sedang berstatus 'Dipanggil'.
//    - Menampilkan status jika belum ada nomor dipanggil ("Belum ada nomor dipanggil").
//    - Menampilkan jumlah tiket yang tersisa dalam antrean ("X tiket menunggu").
// 4. Fitur Layar Penuh (Fullscreen API):
//    - Tombol toggle Layar Penuh menggunakan JavaScript Fullscreen API.
// 5. Fitur Nilai Tambahan (Bonus Rubrik):
//    - Notifikasi suara (Chime audio tingtong.mp3) & Panggilan suara otomatis (Web Speech API).
(() => {
    // =========================================================================
    // 1. AUTH GUARD (PROTECTED PAGE - CATATAN REVISI)
    // =========================================================================
    const authToken = localStorage.getItem('authToken');
    const authRole = localStorage.getItem('authRole') || 'user';
    const authFirstName = localStorage.getItem('authFirstName') || 'Pengguna';
    if (!authToken) {
        // Sesuai Catatan Revisi: seluruh halaman termasuk layar.html wajib login terlebih dahulu
        window.location.href = 'login.html';
        return;
    }
    // =========================================================================
    // 2. STATE & AUDIO TRACKING
    // =========================================================================
    // Menyimpan nomor tiket yang terakhir kali dipanggil per kode antrian
    // agar suara/chime hanya berbunyi saat ada panggilan nomor baru
    const lastCalledMap = new Map();
    let isInitialLoad = true;
    let isAudioEnabled = true;
    const chimeAudio = document.getElementById('chimeAudio');
    const audioToggleBtn = document.getElementById('audioToggleBtn');
    const audioIcon = document.getElementById('audioIcon');
    const audioLabel = document.getElementById('audioLabel');
    const fullscreenBtn = document.getElementById('fullscreenBtn');
    const lastUpdatedEl = document.getElementById('lastUpdated');
    const layarGrid = document.getElementById('layarGrid');
    const userSessionArea = document.getElementById('userSessionArea');
    // =========================================================================
    // 3. RENDER USER SESSION / NAVBAR LINK
    // =========================================================================
    function renderUserSession() {
        var _a;
        if (!userSessionArea)
            return;
        const roleFormatted = authRole.charAt(0).toUpperCase() + authRole.slice(1);
        const isAdmin = authRole === 'admin' || authRole === 'moderator';
        userSessionArea.innerHTML = `
      <div class="user-session-info">
        <span class="user-name-label">Halo, <strong>${escapeHtml(authFirstName)}</strong> (${escapeHtml(roleFormatted)})</span>
        ${isAdmin ? '<a href="index.html" class="btn-pill-link">Dashboard</a>' : ''}
        <button type="button" id="layarLogoutBtn" class="btn-pill-logout" title="Keluar dari sesi">Keluar</button>
      </div>
    `;
        (_a = document.getElementById('layarLogoutBtn')) === null || _a === void 0 ? void 0 : _a.addEventListener('click', () => {
            if (confirm('Apakah Anda yakin ingin keluar?')) {
                localStorage.removeItem('authToken');
                localStorage.removeItem('authRole');
                localStorage.removeItem('authFirstName');
                window.location.href = 'login.html';
            }
        });
    }
    // =========================================================================
    // 4. DATA RETRIEVAL DARI LOCAL STORAGE
    // =========================================================================
    const defaultJenisAntrian = [
        { kode: 'A', nama: 'UMUM-1', status: 'active' },
        { kode: 'B', nama: 'UMUM-2', status: 'active' },
        { kode: 'C', nama: 'UMUM-3', status: 'active' },
        { kode: 'G', nama: 'GIGI', status: 'active' },
        { kode: 'F', nama: 'FARMASI', status: 'active' },
        { kode: 'P', nama: 'PSIKOLOG', status: 'active' }
    ];
    function getJenisAntrian() {
        const raw = localStorage.getItem('jenisAntrian');
        if (!raw) {
            localStorage.setItem('jenisAntrian', JSON.stringify(defaultJenisAntrian));
            return [...defaultJenisAntrian];
        }
        try {
            return JSON.parse(raw);
        }
        catch (_a) {
            return [];
        }
    }
    function getAntrianTiket() {
        const raw = localStorage.getItem('antrianTiket');
        if (!raw)
            return [];
        try {
            return JSON.parse(raw);
        }
        catch (_a) {
            return [];
        }
    }
    // =========================================================================
    // 5. FITUR SUARA PANGGILAN ANTRIAN (AUDIO CHIME & SPEECH SYNTHESIS)
    // =========================================================================
    function playCallSound(nomorTiket, namaLayanan) {
        if (!isAudioEnabled)
            return;
        // 1. Putar chime / nada bel panggilan jika elemen audio tersedia
        if (chimeAudio) {
            chimeAudio.currentTime = 0;
            chimeAudio.play().catch(() => {
                // Abaikan jika browser memblokir autoplay sebelum user berinteraksi
            });
        }
        // 2. Panggilan suara manusia menggunakan Web Speech API (Text-To-Speech)
        if ('speechSynthesis' in window) {
            // Jeda 800ms agar bunyi tingtong terdengar terlebih dahulu
            setTimeout(() => {
                window.speechSynthesis.cancel(); // Batalkan antrian suara sebelumnya jika ada
                const textToSpeak = `Nomor antrian, ${nomorTiket.replace('-', ' ')}, silakan menuju ${namaLayanan}`;
                const utterance = new SpeechSynthesisUtterance(textToSpeak);
                utterance.lang = 'id-ID';
                utterance.rate = 0.9; // Kecepatan bicara santun dan jelas
                utterance.pitch = 1.0;
                window.speechSynthesis.speak(utterance);
            }, 800);
        }
    }
    // Toggle Aktif / Nonaktif Suara
    audioToggleBtn === null || audioToggleBtn === void 0 ? void 0 : audioToggleBtn.addEventListener('click', () => {
        isAudioEnabled = !isAudioEnabled;
        if (audioIcon) {
            audioIcon.textContent = isAudioEnabled ? '🔊' : '🔇';
        }
        if (audioLabel) {
            audioLabel.textContent = isAudioEnabled ? 'Suara Aktif' : 'Suara Mati';
        }
        audioToggleBtn.classList.toggle('is-muted', !isAudioEnabled);
        // Tes suara sekali jika diaktifkan agar browser mendaftarkan izin user interaction
        if (isAudioEnabled && chimeAudio) {
            chimeAudio.currentTime = 0;
            chimeAudio.play().catch(() => { });
        }
    });
    // =========================================================================
    // 6. FITUR FULLSCREEN TOGGLE (JAVASCRIPT FULLSCREEN API)
    // =========================================================================
    function toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch((err) => {
                console.warn('Gagal masuk mode layar penuh:', err);
            });
        }
        else {
            if (document.exitFullscreen) {
                document.exitFullscreen().catch((err) => {
                    console.warn('Gagal keluar mode layar penuh:', err);
                });
            }
        }
    }
    fullscreenBtn === null || fullscreenBtn === void 0 ? void 0 : fullscreenBtn.addEventListener('click', toggleFullscreen);
    // Pantau perubahan status fullscreen untuk update label tombol
    document.addEventListener('fullscreenchange', () => {
        if (!fullscreenBtn)
            return;
        if (document.fullscreenElement) {
            fullscreenBtn.textContent = 'Keluar Layar Penuh';
            fullscreenBtn.classList.add('btn-fullscreen-active');
        }
        else {
            fullscreenBtn.textContent = 'Layar Penuh';
            fullscreenBtn.classList.remove('btn-fullscreen-active');
        }
    });
    // =========================================================================
    // 7. RENDER PANEL LAYAR ANTRIAN (REAL-TIME UPDATE)
    // =========================================================================
    function renderLayar() {
        if (!layarGrid)
            return;
        // Perbarui penunjuk waktu "Diperbarui HH.mm.ss"
        const now = new Date();
        const timeFormatted = now.toTimeString().split(' ')[0].replace(/:/g, '.');
        if (lastUpdatedEl) {
            lastUpdatedEl.textContent = timeFormatted;
        }
        const jenisList = getJenisAntrian();
        const tiketList = getAntrianTiket();
        // Saring hanya jenis antrian yang berstatus 'active'
        const jenisAktif = jenisList.filter((j) => j.status === 'active');
        if (jenisAktif.length === 0) {
            layarGrid.innerHTML = `
        <div class="layar-empty-state">
          <h2>Belum ada jenis antrian aktif</h2>
          <p>Silakan aktifkan atau buat jenis antrian baru melalui Dashboard Admin.</p>
        </div>
      `;
            return;
        }
        layarGrid.innerHTML = '';
        jenisAktif.forEach((jenis) => {
            // 1. Cari tiket dengan status 'Dipanggil' untuk jenis layanan ini
            // Ambil tiket yang berstatus 'Dipanggil'
            const tiketDipanggil = tiketList.filter((t) => t.kode === jenis.kode && t.status === 'Dipanggil');
            // Ambil tiket yang sedang aktif dipanggil (jika ada lebih dari 1, ambil yang terbaru/terakhir)
            const currentCall = tiketDipanggil.length > 0 ? tiketDipanggil[tiketDipanggil.length - 1] : null;
            // 2. Hitung jumlah tiket yang masih mengantre (status 'Menunggu')
            const countMenunggu = tiketList.filter((t) => t.kode === jenis.kode && t.status === 'Menunggu').length;
            // 3. Deteksi apakah ada nomor tiket baru yang dipanggil
            const prevNomor = lastCalledMap.get(jenis.kode) || '';
            const currentNomor = currentCall ? currentCall.nomor : '';
            const isNewCall = !isInitialLoad && currentCall !== null && currentNomor !== prevNomor;
            // Simpan state terkini
            lastCalledMap.set(jenis.kode, currentNomor);
            // Jalankan suara notifikasi jika ada panggilan baru
            if (isNewCall && currentCall) {
                playCallSound(currentCall.nomor, jenis.nama);
            }
            // 4. Render elemen kartu antrian (Sesuai Mockup image4.png)
            const card = document.createElement('article');
            card.className = `layar-card ${currentCall ? 'has-called' : 'no-called'} ${isNewCall ? 'is-calling' : ''}`;
            card.innerHTML = `
        <header class="layar-card-header">
          <span class="layar-card-nama">${escapeHtml(jenis.nama)}</span>
          <span class="layar-card-kode">${escapeHtml(jenis.kode)}</span>
        </header>

        <div class="layar-card-body">
          ${currentCall
                ? `
                <div class="badge-dipanggil">
                  <span class="badge-dipanggil-dot">●</span>
                  <span>DIPANGGIL</span>
                </div>
                <div class="nomor-dipanggil">${escapeHtml(currentCall.nomor)}</div>
                <div class="prioritas-badge prioritas-${escapeHtml(currentCall.prioritas)}">
                  ${capitalize(currentCall.prioritas)}
                </div>
              `
                : `
                <div class="empty-dipanggil-content">
                  <p class="empty-dipanggil-title">Belum ada nomor dipanggil</p>
                  <p class="empty-dipanggil-desc">Nomor akan muncul setelah operator memanggil tiket.</p>
                </div>
              `}
        </div>

        <footer class="layar-card-footer">
          <span class="tiket-menunggu-info">${countMenunggu} tiket menunggu</span>
        </footer>
      `;
            layarGrid.appendChild(card);
        });
        isInitialLoad = false;
    }
    // =========================================================================
    // 8. HELPER UTILITIES
    // =========================================================================
    function capitalize(str) {
        if (!str)
            return '';
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    // =========================================================================
    // 9. EVENT LISTENERS & REAL-TIME POLLING
    // =========================================================================
    // Render awal saat halaman dimuat
    renderUserSession();
    renderLayar();
    // Polling interval 2.5 detik (sesuai spesifikasi: 2-3 detik)
    setInterval(renderLayar, 2500);
    // Event listener 'storage' agar update dari tab lain (Admin / Operator) langsung ter-render tanpa jeda
    window.addEventListener('storage', (e) => {
        if (e.key === 'antrianTiket' || e.key === 'jenisAntrian' || e.key === 'authToken') {
            renderLayar();
        }
    });
})();
