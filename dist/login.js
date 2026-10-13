"use strict";
// login.ts – Logika Halaman Login (login.html)
// Sesuai Spesifikasi Soal Praktikum Modul 3:
// 1. Form Login: input username & password dengan indikator loading state.
// 2. Autentikasi & Validasi Role: POST ke https://dummyjson.com/auth/login.
//    - Role pengguna ditentukan dari respons server (admin, moderator, atau user).
//    - Apabila role moderator, hak akses disamakan dengan admin.
// 3. Session Storage (Local Storage): token, role, dan firstName disimpan di localStorage.
// 4. Error Handling: pesan visual jika kredensial salah atau koneksi gagal (try...catch).
// 5. Auto Redirect: Admin/Moderator diarahkan ke index.html (Dashboard Admin).
(() => {
    // Jika pengguna sudah login, langsung arahkan sesuai role masing-masing
    const existingRole = localStorage.getItem('authRole');
    const existingToken = localStorage.getItem('authToken');
    if (existingToken) {
        if (existingRole === 'admin' || existingRole === 'moderator') {
            window.location.href = 'index.html';
            return;
        }
        else {
            window.location.href = 'layar.html';
            return;
        }
    }
    const form = document.getElementById('loginForm');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const loginBtn = document.getElementById('loginBtn');
    const errorDiv = document.getElementById('error');
    if (!form || !usernameInput || !passwordInput || !loginBtn || !errorDiv) {
        return;
    }
    // Tombol hanya aktif jika kedua input terisi
    function updateBtnState() {
        if (!usernameInput || !passwordInput || !loginBtn)
            return;
        const hasValues = usernameInput.value.trim() !== '' && passwordInput.value.trim() !== '';
        loginBtn.disabled = !hasValues;
    }
    usernameInput.addEventListener('input', updateBtnState);
    passwordInput.addEventListener('input', updateBtnState);
    // Jalankan pengecekan awal jika browser melakukan autofill
    updateBtnState();
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = usernameInput.value.trim();
        const password = passwordInput.value.trim();
        if (!username || !password) {
            errorDiv.textContent = 'Harap isi username dan password.';
            errorDiv.classList.remove('hidden');
            return;
        }
        // Set Loading State (tombol berubah warna kuning/oranye dan bertuliskan "Memproses...")
        const originalBtnText = loginBtn.textContent || 'Masuk';
        loginBtn.textContent = 'Memproses...';
        loginBtn.classList.add('btn-loading');
        loginBtn.disabled = true;
        errorDiv.classList.add('hidden');
        errorDiv.textContent = '';
        try {
            // 1. Request POST Login ke DummyJSON
            const response = await fetch('https://dummyjson.com/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            if (!response.ok) {
                if (response.status === 400 || response.status === 401) {
                    throw new Error('Username atau password salah.');
                }
                else {
                    throw new Error(`Gagal menghubungi server (${response.status}). Coba lagi nanti.`);
                }
            }
            const data = await response.json(); // Mengembalikan { accessToken/token, id, username, firstName, ... }
            const token = data.accessToken || data.token || '';
            let userRole = (data.role && typeof data.role === 'string')
                ? data.role.toLowerCase()
                : '';
            // DummyJSON endpoint /auth/login terkadang tidak menyertakan field 'role' secara langsung
            // Ambil profile lengkap melalui /auth/me atau /users/:id untuk memastikan role pengguna
            if (!userRole && token) {
                try {
                    const profileRes = await fetch('https://dummyjson.com/auth/me', {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (profileRes.ok) {
                        const profileData = await profileRes.json();
                        if (profileData.role && typeof profileData.role === 'string') {
                            userRole = profileData.role.toLowerCase();
                        }
                    }
                }
                catch (_) {
                    // Abaikan jika endpoint me gagal, lanjutkan fallback berikutnya
                }
            }
            // Fallback kedua: ambil melalui endpoint /users/:id
            if (!userRole && data.id) {
                try {
                    const userRes = await fetch(`https://dummyjson.com/users/${data.id}`);
                    if (userRes.ok) {
                        const userData = await userRes.json();
                        if (userData.role && typeof userData.role === 'string') {
                            userRole = userData.role.toLowerCase();
                        }
                    }
                }
                catch (_) {
                    // Abaikan
                }
            }
            // Jika role tetap tidak terdeteksi, default ke 'user'
            if (!userRole) {
                userRole = 'user';
            }
            // 2. Simpan sesi otentikasi ke Local Storage
            localStorage.setItem('authToken', token);
            localStorage.setItem('authRole', userRole);
            localStorage.setItem('authFirstName', data.firstName || username);
            // 3. Auto-redirect Berdasarkan Role (Sesuai Catatan Revisi & Spesifikasi)
            // - Admin / Moderator: diarahkan ke Dashboard Admin (index.html)
            // - User biasa: diarahkan ke Layar Antrian (layar.html)
            if (userRole === 'admin' || userRole === 'moderator') {
                window.location.href = 'index.html';
            }
            else {
                window.location.href = 'layar.html';
            }
        }
        catch (err) {
            // Tampilkan error visual
            errorDiv.textContent = err.message || 'Terjadi kesalahan saat memproses login.';
            errorDiv.classList.remove('hidden');
            // Kembalikan tombol ke keadaan semula
            loginBtn.textContent = originalBtnText;
            loginBtn.classList.remove('btn-loading');
            loginBtn.disabled = false;
        }
    });
})();
