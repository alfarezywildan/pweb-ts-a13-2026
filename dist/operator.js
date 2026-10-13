"use strict";
(() => {
    // =========================================================================
    // 1. TIPE DATA
    // =========================================================================
    // =========================================================================
    // 2. AUTH GUARD
    // =========================================================================
    const authToken = localStorage.getItem('authToken');
    const authRole = localStorage.getItem('authRole') || 'user';
    const authFirstName = localStorage.getItem('authFirstName') || 'Pengguna';
    /*
      Halaman Operator hanya membutuhkan pengguna sudah login.
  
      Berbeda dengan Dashboard Admin:
      - Dashboard memerlukan role admin / moderator.
      - Operator cukup memerlukan autentikasi.
    */
    if (!authToken) {
        window.location.href = 'login.html';
        return;
    }
    // =========================================================================
    // 3. ELEMEN HTML
    // =========================================================================
    const operatorPanels = document.getElementById('operatorPanels');
    const operatorEmptyState = document.getElementById('operatorEmptyState');
    const alertOperator = document.getElementById('alertOperator');
    const navUserInfo = document.getElementById('navUserInfo');
    const logoutBtn = document.getElementById('logoutBtn');
    // =========================================================================
    // 4. LOCAL STORAGE
    // =========================================================================
    function getJenisAntrian() {
        const raw = localStorage.getItem('jenisAntrian');
        if (!raw) {
            return [];
        }
        try {
            const parsed = JSON.parse(raw);
            if (!Array.isArray(parsed)) {
                return [];
            }
            return parsed;
        }
        catch (_a) {
            return [];
        }
    }
    function getAntrianTiket() {
        const raw = localStorage.getItem('antrianTiket');
        if (!raw) {
            return [];
        }
        try {
            const parsed = JSON.parse(raw);
            if (!Array.isArray(parsed)) {
                return [];
            }
            return parsed;
        }
        catch (_a) {
            return [];
        }
    }
    function saveAntrianTiket(tiketList) {
        localStorage.setItem('antrianTiket', JSON.stringify(tiketList));
    }
    // =========================================================================
    // 5. HELPER
    // =========================================================================
    function escapeHtml(value) {
        return value
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
    function capitalize(value) {
        if (!value) {
            return value;
        }
        return (value.charAt(0).toUpperCase() +
            value.slice(1));
    }
    function getNomorUrut(nomorTiket) {
        /*
          Contoh:
          A-001 -> 1
          B-012 -> 12
        */
        const bagian = nomorTiket.split('-');
        if (bagian.length !== 2) {
            return Number.MAX_SAFE_INTEGER;
        }
        const nomor = Number.parseInt(bagian[1], 10);
        if (Number.isNaN(nomor)) {
            return Number.MAX_SAFE_INTEGER;
        }
        return nomor;
    }
    // =========================================================================
    // 6. PRIORITY QUEUE
    // =========================================================================
    /*
      Pembagian tugas kelompok menetapkan urutan:
  
      VIP
        ↓
      Lansia
        ↓
      Disabilitas
        ↓
      Normal
  
      Semakin kecil nilai bobot, semakin tinggi prioritasnya.
    */
    const PRIORITY_WEIGHT = {
        vip: 1,
        lansia: 2,
        disabilitas: 3,
        normal: 4
    };
    function sortTiketByPriority(tiketList) {
        /*
          Gunakan spread [...tiketList]
          agar array asli tidak berubah saat .sort().
        */
        return [...tiketList].sort((a, b) => {
            const priorityDifference = PRIORITY_WEIGHT[a.prioritas] -
                PRIORITY_WEIGHT[b.prioritas];
            /*
              Jika prioritas berbeda,
              yang bobotnya lebih kecil berada di depan.
            */
            if (priorityDifference !== 0) {
                return priorityDifference;
            }
            /*
              Jika prioritas sama,
              gunakan FIFO.
    
              Nomor tiket yang lebih kecil
              dipanggil terlebih dahulu.
    
              Contoh:
              A-002 VIP
              A-005 VIP
    
              maka A-002 lebih dulu.
            */
            return (getNomorUrut(a.nomor) -
                getNomorUrut(b.nomor));
        });
    }
    // =========================================================================
    // 7. MENCARI TIKET SEDANG DIPANGGIL
    // =========================================================================
    function getCurrentTicket(kode, tiketList) {
        return tiketList.find((tiket) => tiket.kode === kode &&
            tiket.status === 'Dipanggil');
    }
    // =========================================================================
    // 8. MENCARI TIKET BERIKUTNYA
    // =========================================================================
    function getNextTicket(kode, tiketList) {
        const tiketMenunggu = tiketList.filter((tiket) => tiket.kode === kode &&
            tiket.status === 'Menunggu');
        const tiketTerurut = sortTiketByPriority(tiketMenunggu);
        return tiketTerurut[0];
    }
    // =========================================================================
    // 9. FEEDBACK
    // =========================================================================
    function showFeedback(message, type) {
        if (!alertOperator) {
            return;
        }
        alertOperator.textContent = message;
        alertOperator.className =
            `alert-box alert-${type}`;
        alertOperator.classList.remove('hidden');
        window.setTimeout(() => {
            alertOperator.classList.add('hidden');
            alertOperator.textContent = '';
        }, 4000);
    }
    // =========================================================================
    // 10. NAVBAR
    // =========================================================================
    function renderNavbar() {
        if (!navUserInfo) {
            return;
        }
        const roleLabel = capitalize(authRole);
        navUserInfo.innerHTML = `
      <div class="user-profile">

        <span class="user-greeting">
          Halo,
          <strong>
            ${escapeHtml(authFirstName)}
          </strong>
        </span>

        <span class="badge-role">
          ${escapeHtml(roleLabel)}
        </span>

      </div>
    `;
    }
    // =========================================================================
    // 11. LOGOUT
    // =========================================================================
    function handleLogout() {
        const yakinKeluar = window.confirm('Apakah Anda yakin ingin keluar?');
        if (!yakinKeluar) {
            return;
        }
        localStorage.removeItem('authToken');
        localStorage.removeItem('authRole');
        localStorage.removeItem('authFirstName');
        window.location.href =
            'login.html';
    }
    logoutBtn === null || logoutBtn === void 0 ? void 0 : logoutBtn.addEventListener('click', handleLogout);
    // =========================================================================
    // 12. PANGGIL BERIKUTNYA
    // =========================================================================
    function panggilBerikutnya(kode) {
        const tiketList = getAntrianTiket();
        /*
          Cari tiket yang saat ini sedang dipanggil
          pada layanan tersebut.
        */
        const currentTicket = getCurrentTicket(kode, tiketList);
        /*
          Sesuai requirement:
    
          Saat "Panggil Berikutnya" ditekan,
          tiket aktif sebelumnya menjadi Selesai.
        */
        if (currentTicket) {
            currentTicket.status =
                'Selesai';
        }
        /*
          Cari tiket berikutnya dari tiket
          yang berstatus Menunggu.
        */
        const nextTicket = getNextTicket(kode, tiketList);
        /*
          Jika tidak ada tiket lagi yang menunggu,
          simpan perubahan current ticket (jika ada)
          lalu render ulang.
        */
        if (!nextTicket) {
            saveAntrianTiket(tiketList);
            renderOperatorPanels();
            showFeedback(currentTicket
                ? `${currentTicket.nomor} telah selesai. Tidak ada tiket berikutnya.`
                : 'Tidak ada tiket yang sedang menunggu pada layanan ini.', currentTicket
                ? 'success'
                : 'error');
            return;
        }
        /*
          Tiket berikutnya menjadi Dipanggil.
        */
        nextTicket.status =
            'Dipanggil';
        saveAntrianTiket(tiketList);
        renderOperatorPanels();
        showFeedback(`${nextTicket.nomor} sedang dipanggil.`, 'success');
    }
    // =========================================================================
    // 13. SELESAI
    // =========================================================================
    function selesaikanTiket(kode) {
        const tiketList = getAntrianTiket();
        const currentTicket = getCurrentTicket(kode, tiketList);
        if (!currentTicket) {
            showFeedback('Tidak ada tiket yang sedang dipanggil pada layanan ini.', 'error');
            return;
        }
        /*
          Tombol Selesai hanya menutup tiket.
    
          Tidak otomatis memanggil tiket berikutnya.
        */
        currentTicket.status =
            'Selesai';
        saveAntrianTiket(tiketList);
        renderOperatorPanels();
        showFeedback(`${currentTicket.nomor} telah diselesaikan.`, 'success');
    }
    // =========================================================================
    // 14. LEWATI
    // =========================================================================
    function lewatiTiket(kode) {
        const tiketList = getAntrianTiket();
        const currentTicket = getCurrentTicket(kode, tiketList);
        if (!currentTicket) {
            showFeedback('Tidak ada tiket yang sedang dipanggil untuk dilewati.', 'error');
            return;
        }
        /*
          Requirement memperbolehkan tiket yang
          tidak hadir ditandai sebagai Dilewati.
        */
        currentTicket.status =
            'Dilewati';
        saveAntrianTiket(tiketList);
        renderOperatorPanels();
        showFeedback(`${currentTicket.nomor} ditandai sebagai Dilewati.`, 'success');
    }
    // =========================================================================
    // 15. RENDER PANEL OPERATOR
    // =========================================================================
    function renderOperatorPanels() {
        if (!operatorPanels ||
            !operatorEmptyState) {
            return;
        }
        const jenisList = getJenisAntrian();
        const tiketList = getAntrianTiket();
        // Tidak ada jenis antrian sama sekali.
        if (jenisList.length === 0) {
            operatorPanels.innerHTML = '';
            operatorPanels.classList.add('hidden');
            operatorEmptyState.classList.remove('hidden');
            return;
        }
        operatorPanels.classList.remove('hidden');
        operatorEmptyState.classList.add('hidden');
        operatorPanels.innerHTML = '';
        jenisList.forEach((jenis) => {
            const currentTicket = getCurrentTicket(jenis.kode, tiketList);
            const nextTicket = getNextTicket(jenis.kode, tiketList);
            const jumlahMenunggu = tiketList.filter((tiket) => tiket.kode === jenis.kode &&
                tiket.status === 'Menunggu').length;
            const card = document.createElement('section');
            card.className = 'card';
            // -------------------------------------------------------------------
            // Sedang dipanggil
            // -------------------------------------------------------------------
            const currentHtml = currentTicket
                ? `
              <div class="tiket-row is-called">

                <div class="tiket-left">

                  <span class="tiket-nomor">
                    ${escapeHtml(currentTicket.nomor)}
                  </span>

                  <span
                    class="
                      badge-prioritas
                      prioritas-${escapeHtml(currentTicket.prioritas)}
                    "
                  >
                    ${escapeHtml(capitalize(currentTicket.prioritas))}
                  </span>

                </div>

              </div>
            `
                : `
              <div class="tiket-empty-row">
                Belum ada nomor yang sedang dipanggil.
              </div>
            `;
            // -------------------------------------------------------------------
            // Tiket berikutnya
            // -------------------------------------------------------------------
            const nextHtml = nextTicket
                ? `
              <div class="tiket-row">

                <div class="tiket-left">

                  <span class="tiket-nomor">
                    ${escapeHtml(nextTicket.nomor)}
                  </span>

                  <span
                    class="
                      badge-prioritas
                      prioritas-${escapeHtml(nextTicket.prioritas)}
                    "
                  >
                    ${escapeHtml(capitalize(nextTicket.prioritas))}
                  </span>

                </div>

              </div>
            `
                : `
              <div class="tiket-empty-row">
                Tidak ada tiket menunggu.
              </div>
            `;
            // -------------------------------------------------------------------
            // Card HTML
            // -------------------------------------------------------------------
            card.innerHTML = `
          <div
            style="
              display: flex;
              justify-content: space-between;
              align-items: center;
              gap: 1rem;
              margin-bottom: 1.25rem;
            "
          >

            <div>
              <h2
                class="card-title"
                style="margin-bottom: 0.2rem;"
              >
                ${escapeHtml(jenis.nama)}
              </h2>

              <span
                style="
                  font-size: 0.78rem;
                  color: #64748b;
                "
              >
                Kode ${escapeHtml(jenis.kode)}
              </span>

              ${jenis.status === 'inactive'
                ? `
                    <span class="status-badge-inactive">
                      Non-Aktif
                    </span>
                  `
                : ''}
            </div>


            <span
              style="
                font-size: 0.78rem;
                color: #64748b;
              "
            >
              ${jumlahMenunggu} menunggu
            </span>

          </div>


          <div
            class="tiket-group"
            style="margin-bottom: 1rem;"
          >

            <div class="tiket-group-header">
              SEDANG DIPANGGIL
            </div>

            ${currentHtml}

          </div>


          <div
            class="tiket-group"
            style="margin-bottom: 1.25rem;"
          >

            <div class="tiket-group-header">
              BERIKUTNYA
            </div>

            ${nextHtml}

          </div>


          <div
            style="
              display: flex;
              gap: 0.5rem;
              flex-wrap: wrap;
              align-items: center;
            "
          >

            <button
              type="button"
              class="btn-dark btn-next"
              data-kode="${escapeHtml(jenis.kode)}"
              ${!nextTicket ? 'disabled' : ''}
            >
              Panggil Berikutnya
            </button>


            <button
              type="button"
              class="btn-action-lewati btn-skip"
              data-kode="${escapeHtml(jenis.kode)}"
              ${!currentTicket ? 'disabled' : ''}
            >
              Lewati
            </button>


            <button
              type="button"
              class="btn-action-selesai btn-finish"
              data-kode="${escapeHtml(jenis.kode)}"
              ${!currentTicket ? 'disabled' : ''}
            >
              Selesai
            </button>

          </div>
        `;
            operatorPanels.appendChild(card);
        });
        // =======================================================================
        // 16. EVENT TOMBOL PANGGIL BERIKUTNYA
        // =======================================================================
        operatorPanels
            .querySelectorAll('.btn-next')
            .forEach((button) => {
            button.addEventListener('click', () => {
                const kode = button.dataset.kode;
                if (!kode) {
                    return;
                }
                panggilBerikutnya(kode);
            });
        });
        // =======================================================================
        // 17. EVENT TOMBOL LEWATI
        // =======================================================================
        operatorPanels
            .querySelectorAll('.btn-skip')
            .forEach((button) => {
            button.addEventListener('click', () => {
                const kode = button.dataset.kode;
                if (!kode) {
                    return;
                }
                lewatiTiket(kode);
            });
        });
        // =======================================================================
        // 18. EVENT TOMBOL SELESAI
        // =======================================================================
        operatorPanels
            .querySelectorAll('.btn-finish')
            .forEach((button) => {
            button.addEventListener('click', () => {
                const kode = button.dataset.kode;
                if (!kode) {
                    return;
                }
                selesaikanTiket(kode);
            });
        });
    }
    // =========================================================================
    // 19. SINKRONISASI ANTAR TAB
    // =========================================================================
    /*
      Contoh:
  
      Tab 1:
      ambil-antrian.html
  
      Tab 2:
      operator.html
  
      Ketika Tab 1 membuat tiket baru,
      event storage di Tab 2 akan berjalan.
    */
    window.addEventListener('storage', (event) => {
        if (event.key === 'antrianTiket' ||
            event.key === 'jenisAntrian') {
            renderOperatorPanels();
        }
        /*
          Jika authToken dihapus dari tab lain,
          kembalikan operator ke Login.
        */
        if (event.key === 'authToken' &&
            !event.newValue) {
            window.location.href =
                'login.html';
        }
    });
    // =========================================================================
    // 20. UPDATE SAAT TAB DIFOKUSKAN
    // =========================================================================
    window.addEventListener('focus', () => {
        renderOperatorPanels();
    });
    // =========================================================================
    // 21. INITIAL RENDER & POLLING OTOMATIS
    // =========================================================================
    renderNavbar();
    renderOperatorPanels();
    // Polling berkala setiap 2 detik agar panel operator selalu ter-update otomatis
    setInterval(renderOperatorPanels, 2000);
})();
