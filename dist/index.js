"use strict";
// index.ts – Logika Halaman Dashboard Admin (index.html)
// Sesuai Spesifikasi Soal Praktikum Modul 3:
// 1. Auth Guard & Role Guard: Redirect ke login.html jika belum login atau bukan admin/moderator.
// 2. Navigation Bar: Menampilkan nama pengguna aktif, role, serta tombol Logout.
// 3. Manajemen Jenis Antrian (CRUD & Aturan Validasi):
//    - Input Kode (1 huruf kapital) & Nama Layanan.
//    - Validasi anti duplikasi Kode & Nama (case-insensitive).
//    - Fitur Aktifkan/Nonaktifkan jenis antrian (Toggle Status).
//    - Fitur Hapus jenis antrian.
//    - Fitur Reset Antrian (mengosongkan antrian aktif dan mengembalikan urutan nomor tiket ke awal).
// 4. Penerbitan Tiket Manual:
//    - Dropdown jenis antrian (hanya yang aktif).
//    - Tingkat Prioritas: Normal, Lansia, Disabilitas, VIP.
//    - Format nomor tiket 3-digit per kode (contoh: A-001, B-012).
(() => {
    var _a;
    // =========================================================================
    // 1. AUTH GUARD & ROLE GUARD
    // =========================================================================
    const storedToken = localStorage.getItem('authToken');
    const storedRole = localStorage.getItem('authRole');
    const storedFirstName = localStorage.getItem('authFirstName') || 'Pengguna';
    if (!storedToken || !storedRole || (storedRole !== 'admin' && storedRole !== 'moderator')) {
        // Redirect paksa jika belum login atau bukan admin/moderator
        window.location.href = 'login.html';
        return;
    }
    // =========================================================================
    // 2. RENDER NAVBAR & USER INFO
    // =========================================================================
    function renderNavbar() {
        var _a;
        const navUserInfo = document.getElementById('navUserInfo');
        if (!navUserInfo)
            return;
        // Format role: admin -> Admin, moderator -> Moderator
        const roleCapitalized = storedRole
            ? storedRole.charAt(0).toUpperCase() + storedRole.slice(1)
            : 'User';
        navUserInfo.innerHTML = `
      <div class="user-profile">
        <span class="user-greeting">Halo, <strong>${storedFirstName}</strong></span>
        <span class="badge-role">${roleCapitalized}</span>
        <button type="button" id="navLogoutBtn" class="btn-logout-nav" title="Keluar dari sesi">Keluar</button>
      </div>
    `;
        (_a = document.getElementById('navLogoutBtn')) === null || _a === void 0 ? void 0 : _a.addEventListener('click', handleLogout);
    }
    function handleLogout() {
        if (confirm('Apakah Anda yakin ingin keluar?')) {
            localStorage.removeItem('authToken');
            localStorage.removeItem('authRole');
            localStorage.removeItem('authFirstName');
            window.location.href = 'login.html';
        }
    }
    // Pasang handler tombol logout di header halaman
    (_a = document.getElementById('logoutBtn')) === null || _a === void 0 ? void 0 : _a.addEventListener('click', handleLogout);
    // =========================================================================
    // 3. INISIALISASI DATA LOCAL STORAGE
    // =========================================================================
    // Default jenis antrian sesuai mockup image2 jika localStorage masih kosong
    const defaultJenisAntrian = [
        { kode: 'A', nama: 'UMUM-1', status: 'active' },
        { kode: 'B', nama: 'UMUM-2', status: 'active' },
        { kode: 'C', nama: 'UMUM-3', status: 'active' },
        { kode: 'G', nama: 'GIGI', status: 'active' },
        { kode: 'F', nama: 'FARMASI', status: 'active' },
        { kode: 'P', nama: 'PSIKOLOG', status: 'active' }
    ];
    // Default tiket contoh sesuai mockup image2 jika antrianTiket masih kosong
    const defaultTiket = [
        { nomor: 'A-001', kode: 'A', nama: 'UMUM-1', prioritas: 'normal', status: 'Dipanggil', waktu: '08:00' },
        { nomor: 'B-004', kode: 'B', nama: 'UMUM-2', prioritas: 'disabilitas', status: 'Menunggu', waktu: '08:15' },
        { nomor: 'B-003', kode: 'B', nama: 'UMUM-2', prioritas: 'disabilitas', status: 'Menunggu', waktu: '08:12' },
        { nomor: 'B-002', kode: 'B', nama: 'UMUM-2', prioritas: 'normal', status: 'Menunggu', waktu: '08:10' },
        { nomor: 'B-001', kode: 'B', nama: 'UMUM-2', prioritas: 'normal', status: 'Menunggu', waktu: '08:05' },
        { nomor: 'C-001', kode: 'C', nama: 'UMUM-3', prioritas: 'normal', status: 'Menunggu', waktu: '08:20' },
        { nomor: 'G-003', kode: 'G', nama: 'GIGI', prioritas: 'lansia', status: 'Dipanggil', waktu: '08:25' },
        { nomor: 'G-002', kode: 'G', nama: 'GIGI', prioritas: 'normal', status: 'Menunggu', waktu: '08:18' },
        { nomor: 'G-001', kode: 'G', nama: 'GIGI', prioritas: 'normal', status: 'Menunggu', waktu: '08:02' },
        { nomor: 'F-001', kode: 'F', nama: 'FARMASI', prioritas: 'normal', status: 'Dipanggil', waktu: '08:30' }
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
    function saveJenisAntrian(data) {
        localStorage.setItem('jenisAntrian', JSON.stringify(data));
    }
    function getAntrianTiket() {
        const raw = localStorage.getItem('antrianTiket');
        if (raw === null) {
            localStorage.setItem('antrianTiket', JSON.stringify(defaultTiket));
            return [...defaultTiket];
        }
        try {
            return JSON.parse(raw);
        }
        catch (_a) {
            return [];
        }
    }
    function saveAntrianTiket(data) {
        localStorage.setItem('antrianTiket', JSON.stringify(data));
    }
    // =========================================================================
    // 4. RENDER DAFTAR JENIS ANTRIAN
    // =========================================================================
    function renderJenisAntrian() {
        const container = document.getElementById('daftarJenis');
        if (!container)
            return;
        const jenisList = getJenisAntrian();
        const tiketList = getAntrianTiket();
        if (jenisList.length === 0) {
            container.innerHTML = `
        <div class="empty-state">
          <p>Belum ada jenis antrian. Tambahkan jenis antrian di atas.</p>
        </div>
      `;
            populateDropdownJenis();
            return;
        }
        container.innerHTML = '';
        jenisList.forEach((item) => {
            // Hitung jumlah tiket yang sedang antri (status Menunggu)
            const countMenunggu = tiketList.filter((t) => t.kode === item.kode && t.status === 'Menunggu').length;
            const isAktif = item.status === 'active';
            const itemEl = document.createElement('div');
            itemEl.className = `jenis-item ${isAktif ? '' : 'is-inactive'}`;
            itemEl.innerHTML = `
        <div class="jenis-info">
          <div class="jenis-header-line">
            <span class="jenis-name">${escapeHtml(item.nama)} (${escapeHtml(item.kode)})</span>
            ${!isAktif ? '<span class="status-badge-inactive">Non-Aktif</span>' : ''}
          </div>
          <span class="jenis-count">${countMenunggu} menunggu</span>
        </div>
        <div class="jenis-actions">
          <button 
            type="button" 
            class="btn-toggle-status ${isAktif ? 'btn-nonaktifkan' : 'btn-aktifkan'}" 
            data-kode="${escapeHtml(item.kode)}"
            title="${isAktif ? 'Nonaktifkan layanan antrian ini' : 'Aktifkan kembali layanan ini'}"
          >
            ${isAktif ? 'Nonaktifkan' : 'Aktifkan'}
          </button>
          <button 
            type="button" 
            class="btn-hapus-jenis" 
            data-kode="${escapeHtml(item.kode)}"
            title="Hapus jenis antrian"
          >
            Hapus
          </button>
        </div>
      `;
            container.appendChild(itemEl);
        });
        // Pasang Event Listeners untuk Toggle Status
        container.querySelectorAll('.btn-toggle-status').forEach((btn) => {
            btn.addEventListener('click', () => {
                const kode = btn.getAttribute('data-kode');
                if (!kode)
                    return;
                toggleStatusJenis(kode);
            });
        });
        // Pasang Event Listeners untuk Hapus
        container.querySelectorAll('.btn-hapus-jenis').forEach((btn) => {
            btn.addEventListener('click', () => {
                const kode = btn.getAttribute('data-kode');
                if (!kode)
                    return;
                hapusJenisAntrian(kode);
            });
        });
        // Sinkronkan pilihan jenis di form tiket
        populateDropdownJenis();
    }
    // Toggle status Aktif / Non-Aktif
    function toggleStatusJenis(kode) {
        const list = getJenisAntrian();
        const item = list.find((j) => j.kode === kode);
        if (!item)
            return;
        item.status = item.status === 'active' ? 'inactive' : 'active';
        saveJenisAntrian(list);
        renderJenisAntrian();
        renderMonitorTiket();
    }
    // Hapus Jenis Antrian
    function hapusJenisAntrian(kode) {
        const list = getJenisAntrian();
        const item = list.find((j) => j.kode === kode);
        if (!item)
            return;
        if (confirm(`Yakin ingin menghapus jenis antrian "${item.nama} (${item.kode})"?`)) {
            const updated = list.filter((j) => j.kode !== kode);
            saveJenisAntrian(updated);
            renderJenisAntrian();
            renderMonitorTiket();
        }
    }
    // =========================================================================
    // 5. VALIDASI & FORM TAMBAH JENIS ANTRIAN
    // =========================================================================
    const formKode = document.getElementById('formKode');
    const kodeInput = document.getElementById('kodeBaru');
    const namaInput = document.getElementById('namaBaru');
    const alertJenis = document.getElementById('alertJenis');
    formKode === null || formKode === void 0 ? void 0 : formKode.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!kodeInput || !namaInput)
            return;
        const kodeVal = kodeInput.value.trim().toUpperCase();
        const namaVal = namaInput.value.trim();
        // 1. Validasi Kode: Harus 1 huruf kapital (A-Z)
        if (!/^[A-Z]$/.test(kodeVal)) {
            showFeedback(alertJenis, 'Kode harus berupa 1 huruf kapital (A-Z)!', 'error');
            kodeInput.focus();
            return;
        }
        // 2. Validasi Nama: Tidak boleh kosong
        if (!namaVal) {
            showFeedback(alertJenis, 'Nama jenis antrian wajib diisi!', 'error');
            namaInput.focus();
            return;
        }
        const currentList = getJenisAntrian();
        // 3. Validasi Anti Duplikasi KODE
        const kodeDuplikat = currentList.some((item) => item.kode === kodeVal);
        if (kodeDuplikat) {
            showFeedback(alertJenis, `Kode "${kodeVal}" sudah digunakan! Harap gunakan huruf lain.`, 'error');
            kodeInput.focus();
            return;
        }
        // 4. Validasi Anti Duplikasi NAMA (Case-Insensitive)
        const namaDuplikat = currentList.some((item) => item.nama.trim().toLowerCase() === namaVal.toLowerCase());
        if (namaDuplikat) {
            showFeedback(alertJenis, `Nama layanan "${namaVal}" sudah ada! (Pengecekan tidak membedakan huruf besar/kecil)`, 'error');
            namaInput.focus();
            return;
        }
        // Tambah jenis antrian baru dengan status default 'active'
        currentList.push({
            kode: kodeVal,
            nama: namaVal,
            status: 'active'
        });
        saveJenisAntrian(currentList);
        // Reset input dan beri pesan sukses
        formKode.reset();
        showFeedback(alertJenis, `Jenis antrian "${namaVal} (${kodeVal})" berhasil ditambahkan.`, 'success');
        renderJenisAntrian();
        renderMonitorTiket();
    });
    // =========================================================================
    // 6. POPULATE DROPDOWN JENIS TIKET (HANYA YANG AKTIF)
    // =========================================================================
    function populateDropdownJenis() {
        const select = document.getElementById('jenisTiket');
        const btnTerbit = document.getElementById('btnTerbitkanTiket');
        if (!select)
            return;
        const jenisList = getJenisAntrian();
        // Filter hanya jenis yang berstatus 'active'
        const jenisAktif = jenisList.filter((j) => j.status === 'active');
        select.innerHTML = '';
        if (jenisAktif.length === 0) {
            select.innerHTML = '<option value="">-- Tidak ada jenis aktif --</option>';
            select.disabled = true;
            if (btnTerbit)
                btnTerbit.disabled = true;
            return;
        }
        select.disabled = false;
        if (btnTerbit)
            btnTerbit.disabled = false;
        const defaultOpt = document.createElement('option');
        defaultOpt.value = '';
        defaultOpt.textContent = 'Pilih jenis antrian';
        select.appendChild(defaultOpt);
        jenisAktif.forEach((item) => {
            const opt = document.createElement('option');
            opt.value = item.kode;
            opt.textContent = `${item.nama} (${item.kode})`;
            select.appendChild(opt);
        });
    }
    // =========================================================================
    // 7. PENERBITAN TIKET MANUAL
    // =========================================================================
    const formTiket = document.getElementById('formTiket');
    const jenisTiketSelect = document.getElementById('jenisTiket');
    const prioritasSelect = document.getElementById('prioritasTiket');
    const alertTiket = document.getElementById('alertTiket');
    formTiket === null || formTiket === void 0 ? void 0 : formTiket.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!jenisTiketSelect || !prioritasSelect)
            return;
        const selectedKode = jenisTiketSelect.value;
        if (!selectedKode) {
            showFeedback(alertTiket, 'Silakan pilih jenis antrian terlebih dahulu!', 'error');
            return;
        }
        const prioritasVal = prioritasSelect.value;
        const currentJenis = getJenisAntrian().find((j) => j.kode === selectedKode);
        if (!currentJenis || currentJenis.status !== 'active') {
            showFeedback(alertTiket, 'Jenis antrian yang dipilih tidak aktif!', 'error');
            return;
        }
        const currentTiketList = getAntrianTiket();
        // Hitung nomor urut berikutnya dengan format 3-Digit (contoh: A-001, A-002)
        // Cari nomor tiket tertinggi untuk kode ini
        const tiketKodeSama = currentTiketList.filter((t) => t.kode === selectedKode);
        let maxNomor = 0;
        tiketKodeSama.forEach((t) => {
            const parts = t.nomor.split('-');
            if (parts.length === 2) {
                const num = parseInt(parts[1], 10);
                if (!isNaN(num) && num > maxNomor) {
                    maxNomor = num;
                }
            }
        });
        const nextNumber = maxNomor + 1;
        const nomorFormatted = `${selectedKode}-${String(nextNumber).padStart(3, '0')}`;
        const waktuSekarang = new Date().toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit'
        });
        const tiketBaru = {
            nomor: nomorFormatted,
            kode: selectedKode,
            nama: currentJenis.nama,
            prioritas: prioritasVal,
            status: 'Menunggu',
            waktu: waktuSekarang
        };
        currentTiketList.push(tiketBaru);
        saveAntrianTiket(currentTiketList);
        showFeedback(alertTiket, `Tiket ${nomorFormatted} (${currentJenis.nama} - ${capitalize(prioritasVal)}) berhasil diterbitkan!`, 'success');
        // Reset dropdown pilihan
        jenisTiketSelect.value = '';
        prioritasSelect.value = 'normal';
        // Perbarui tampilan
        renderJenisAntrian();
        renderMonitorTiket();
    });
    // =========================================================================
    // 8. RENDER MONITOR TIKET ANTRIAN (KOLOM KANAN DASHBOARD)
    // =========================================================================
    function renderMonitorTiket() {
        const container = document.getElementById('daftarAntrianTiket');
        if (!container)
            return;
        const jenisList = getJenisAntrian();
        const tiketList = getAntrianTiket();
        if (jenisList.length === 0) {
            container.innerHTML = `
        <div class="empty-state">
          <p>Belum ada jenis antrian terdaftar.</p>
        </div>
      `;
            return;
        }
        container.innerHTML = '';
        // Kelompokkan tiket per jenis antrian (seperti pada image2 mockup)
        jenisList.forEach((jenis) => {
            const groupEl = document.createElement('div');
            groupEl.className = 'tiket-group';
            // Header kelompok jenis (misal "UMUM 1", "UMUM-2", "GIGI")
            const groupHeader = document.createElement('div');
            groupHeader.className = 'tiket-group-header';
            groupHeader.textContent = jenis.nama.toUpperCase();
            groupEl.appendChild(groupHeader);
            // Ambil tiket yang aktif untuk jenis ini (yang belum 'Selesai')
            const tiketJenis = tiketList.filter((t) => t.kode === jenis.kode && t.status !== 'Selesai');
            if (tiketJenis.length === 0) {
                const emptyRow = document.createElement('div');
                emptyRow.className = 'tiket-empty-row';
                emptyRow.textContent = 'Tidak ada antrian aktif';
                groupEl.appendChild(emptyRow);
            }
            else {
                const rowsContainer = document.createElement('div');
                rowsContainer.className = 'tiket-rows-container';
                tiketJenis.forEach((tiket) => {
                    const rowEl = document.createElement('div');
                    rowEl.className = `tiket-row ${tiket.status === 'Dipanggil' ? 'is-called' : ''}`;
                    const isDipanggil = tiket.status === 'Dipanggil';
                    rowEl.innerHTML = `
            <div class="tiket-left">
              <span class="tiket-nomor">${escapeHtml(tiket.nomor)}</span>
              <span class="badge-prioritas prioritas-${tiket.prioritas}">${capitalize(tiket.prioritas)}</span>
              <span class="badge-status status-${tiket.status.toLowerCase()}">${tiket.status}</span>
            </div>
            <div class="tiket-right">
              ${isDipanggil
                        ? `<button type="button" class="btn-action-selesai" data-nomor="${tiket.nomor}">Selesai</button>`
                        : `
                    <button type="button" class="btn-action-panggil" data-nomor="${tiket.nomor}">Panggil</button>
                    <button type="button" class="btn-action-lewati" data-nomor="${tiket.nomor}">Lewati</button>
                  `}
            </div>
          `;
                    rowsContainer.appendChild(rowEl);
                });
                groupEl.appendChild(rowsContainer);
            }
            container.appendChild(groupEl);
        });
        // Pasang Event Listener Tombol Panggil
        container.querySelectorAll('.btn-action-panggil').forEach((btn) => {
            btn.addEventListener('click', () => {
                const nomor = btn.getAttribute('data-nomor');
                if (!nomor)
                    return;
                ubahStatusTiket(nomor, 'Dipanggil');
            });
        });
        // Pasang Event Listener Tombol Selesai
        container.querySelectorAll('.btn-action-selesai').forEach((btn) => {
            btn.addEventListener('click', () => {
                const nomor = btn.getAttribute('data-nomor');
                if (!nomor)
                    return;
                ubahStatusTiket(nomor, 'Selesai');
            });
        });
        // Pasang Event Listener Tombol Lewati
        container.querySelectorAll('.btn-action-lewati').forEach((btn) => {
            btn.addEventListener('click', () => {
                const nomor = btn.getAttribute('data-nomor');
                if (!nomor)
                    return;
                ubahStatusTiket(nomor, 'Dilewati');
            });
        });
    }
    // Mengubah status tiket dalam antrian
    function ubahStatusTiket(nomor, statusBaru) {
        const tiketList = getAntrianTiket();
        const target = tiketList.find((t) => t.nomor === nomor);
        if (!target)
            return;
        // Jika dipanggil, ubah tiket lain di jenis yang sama yang sebelumnya Dipanggil menjadi Selesai
        if (statusBaru === 'Dipanggil') {
            tiketList.forEach((t) => {
                if (t.kode === target.kode && t.nomor !== target.nomor && t.status === 'Dipanggil') {
                    t.status = 'Selesai';
                }
            });
        }
        target.status = statusBaru;
        saveAntrianTiket(tiketList);
        renderJenisAntrian();
        renderMonitorTiket();
    }
    // =========================================================================
    // 9. FITUR RESET ANTRIAN
    // =========================================================================
    // Mengosongkan seluruh antrian aktif dan mengembalikan urutan nomor tiket ke awal
    const resetBtn = document.getElementById('resetAntrianBtn');
    resetBtn === null || resetBtn === void 0 ? void 0 : resetBtn.addEventListener('click', () => {
        const konfirmasi = confirm('Apakah Anda yakin ingin me-reset seluruh antrian?\n\n' +
            'Tindakan ini akan mengosongkan antrian aktif dan penomoran tiket akan dimulai kembali dari awal (001).');
        if (konfirmasi) {
            saveAntrianTiket([]);
            renderJenisAntrian();
            renderMonitorTiket();
            alert('Seluruh antrian berhasil di-reset. Penomoran tiket kembali ke nomor awal.');
        }
    });
    // =========================================================================
    // 10. HELPER UTILITIES
    // =========================================================================
    function showFeedback(container, message, type) {
        if (!container)
            return;
        container.textContent = message;
        container.className = `alert-box alert-${type}`;
        container.classList.remove('hidden');
        // Sembunyikan otomatis setelah 4 detik
        setTimeout(() => {
            container.classList.add('hidden');
            container.textContent = '';
        }, 4000);
    }
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
    // 11. INITIAL RENDER
    // =========================================================================
    renderNavbar();
    renderJenisAntrian();
    renderMonitorTiket();
})();
