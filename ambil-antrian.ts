(() => {
  // =========================================================================
  // 1. TIPE DATA
  // =========================================================================

  interface JenisAntrian {
    kode: string;
    nama: string;
    status: 'active' | 'inactive';
  }

  type TingkatPrioritas =
    | 'normal'
    | 'lansia'
    | 'disabilitas'
    | 'vip';

  type StatusTiket =
    | 'Menunggu'
    | 'Dipanggil'
    | 'Selesai'
    | 'Dilewati';

  interface TiketAntrian {
    nomor: string;
    kode: string;
    nama: string;
    prioritas: TingkatPrioritas;
    status: StatusTiket;
    waktu: string;
  }


  // =========================================================================
  // 2. AMBIL ELEMEN HTML
  // =========================================================================

  const formAmbilAntrian = document.getElementById(
    'formAmbilAntrian'
  ) as HTMLFormElement | null;

  const layananSelect = document.getElementById(
    'layanan'
  ) as HTMLSelectElement | null;

  const prioritasSelect = document.getElementById(
    'prioritas'
  ) as HTMLSelectElement | null;

  const ambilNomorBtn = document.getElementById(
    'ambilNomorBtn'
  ) as HTMLButtonElement | null;

  const alertAmbil = document.getElementById(
    'alertAmbil'
  ) as HTMLDivElement | null;

  const hasilTiket = document.getElementById(
    'hasilTiket'
  ) as HTMLElement | null;

  const nomorTiketHasil = document.getElementById(
    'nomorTiketHasil'
  ) as HTMLElement | null;

  const prioritasTiketHasil = document.getElementById(
    'prioritasTiketHasil'
  ) as HTMLElement | null;

  const layananTiketHasil = document.getElementById(
    'layananTiketHasil'
  ) as HTMLElement | null;

  const waktuTiketHasil = document.getElementById(
    'waktuTiketHasil'
  ) as HTMLElement | null;


  // =========================================================================
  // 3. LOCAL STORAGE - JENIS ANTRIAN
  // =========================================================================

  function getJenisAntrian(): JenisAntrian[] {
    const raw = localStorage.getItem('jenisAntrian');

    if (!raw) {
      return [];
    }

    try {
      const parsed: unknown = JSON.parse(raw);

      if (!Array.isArray(parsed)) {
        return [];
      }

      return parsed as JenisAntrian[];
    } catch {
      return [];
    }
  }


  // =========================================================================
  // 4. LOCAL STORAGE - TIKET ANTRIAN
  // =========================================================================

  function getAntrianTiket(): TiketAntrian[] {
    const raw = localStorage.getItem('antrianTiket');

    if (!raw) {
      return [];
    }

    try {
      const parsed: unknown = JSON.parse(raw);

      if (!Array.isArray(parsed)) {
        return [];
      }

      return parsed as TiketAntrian[];
    } catch {
      return [];
    }
  }

  function saveAntrianTiket(data: TiketAntrian[]): void {
    localStorage.setItem(
      'antrianTiket',
      JSON.stringify(data)
    );
  }


  // =========================================================================
  // 5. VALIDASI PRIORITAS
  // =========================================================================

  function isTingkatPrioritas(
    value: string
  ): value is TingkatPrioritas {
    return (
      value === 'normal' ||
      value === 'lansia' ||
      value === 'disabilitas' ||
      value === 'vip'
    );
  }


  // =========================================================================
  // 6. RENDER PILIHAN LAYANAN
  // =========================================================================

  function renderPilihanLayanan(): void {
    if (!layananSelect) {
      return;
    }

    // Simpan pilihan sebelumnya agar tidak hilang saat data diperbarui.
    const pilihanSebelumnya = layananSelect.value;

    const jenisAntrian = getJenisAntrian();

    const layananAktif = jenisAntrian.filter(
      (item) => item.status === 'active'
    );

    // Kosongkan dropdown terlebih dahulu.
    layananSelect.innerHTML = '';

    // Jika tidak ada layanan aktif.
    if (layananAktif.length === 0) {
      const option = document.createElement('option');

      option.value = '';
      option.textContent = 'Tidak ada jenis antrian aktif';

      layananSelect.appendChild(option);

      layananSelect.disabled = true;

      if (ambilNomorBtn) {
        ambilNomorBtn.disabled = true;
      }

      return;
    }

    // Jika ada layanan aktif.
    layananSelect.disabled = false;

    if (ambilNomorBtn) {
      ambilNomorBtn.disabled = false;
    }

    // Option default.
    const defaultOption = document.createElement('option');

    defaultOption.value = '';
    defaultOption.textContent = 'Pilih jenis antrian';

    layananSelect.appendChild(defaultOption);

    // Buat option berdasarkan jenis antrian dari localStorage.
    layananAktif.forEach((item) => {
      const option = document.createElement('option');

      option.value = item.kode;
      option.textContent = `${item.nama} (${item.kode})`;

      layananSelect.appendChild(option);
    });

    // Jika pilihan sebelumnya masih tersedia,
    // pertahankan pilihan tersebut.
    const masihTersedia = layananAktif.some(
      (item) => item.kode === pilihanSebelumnya
    );

    if (masihTersedia) {
      layananSelect.value = pilihanSebelumnya;
    }
  }


  // =========================================================================
  // 7. GENERATOR NOMOR TIKET
  // =========================================================================

  function generateNomorTiket(
    kode: string,
    tiketList: TiketAntrian[]
  ): string | null {

    // Ambil semua tiket dengan kode yang sama.
    const tiketKodeSama = tiketList.filter(
      (tiket) => tiket.kode === kode
    );

    let maxNomor = 0;

    tiketKodeSama.forEach((tiket) => {
      // Contoh:
      // A-001
      //
      // split('-') menghasilkan:
      // ['A', '001']

      const bagianNomor = tiket.nomor.split('-');

      if (bagianNomor.length !== 2) {
        return;
      }

      const angka = Number.parseInt(
        bagianNomor[1],
        10
      );

      if (
        !Number.isNaN(angka) &&
        angka > maxNomor
      ) {
        maxNomor = angka;
      }
    });

    const nomorBerikutnya = maxNomor + 1;

    // Karena requirement menggunakan nomor 3 digit.
    if (nomorBerikutnya > 999) {
      return null;
    }

    const nomorTigaDigit = String(
      nomorBerikutnya
    ).padStart(3, '0');

    return `${kode}-${nomorTigaDigit}`;
  }


  // =========================================================================
  // 8. FORMAT NAMA PRIORITAS
  // =========================================================================

  function formatPrioritas(
    prioritas: TingkatPrioritas
  ): string {

    switch (prioritas) {
      case 'normal':
        return 'Normal';

      case 'lansia':
        return 'Lansia';

      case 'disabilitas':
        return 'Disabilitas';

      case 'vip':
        return 'VIP';
    }
  }


  // =========================================================================
  // 9. PESAN SUKSES / ERROR
  // =========================================================================

  function showFeedback(
    message: string,
    type: 'success' | 'error'
  ): void {

    if (!alertAmbil) {
      return;
    }

    alertAmbil.textContent = message;

    alertAmbil.className =
      `alert-box alert-${type}`;

    alertAmbil.classList.remove('hidden');

    // Pesan otomatis menghilang setelah 4 detik.
    window.setTimeout(() => {
      alertAmbil.classList.add('hidden');
      alertAmbil.textContent = '';
    }, 4000);
  }


  // =========================================================================
  // 10. TAMPILKAN TIKET YANG BARU DIBUAT
  // =========================================================================

  function tampilkanTiket(
    tiket: TiketAntrian
  ): void {

    if (
      !hasilTiket ||
      !nomorTiketHasil ||
      !prioritasTiketHasil ||
      !layananTiketHasil ||
      !waktuTiketHasil
    ) {
      return;
    }

    nomorTiketHasil.textContent =
      tiket.nomor;

    layananTiketHasil.textContent =
      `${tiket.nama} (${tiket.kode})`;

    waktuTiketHasil.textContent =
      tiket.waktu;

    prioritasTiketHasil.textContent =
      formatPrioritas(tiket.prioritas);

    // Hapus semua class prioritas lama.
    prioritasTiketHasil.classList.remove(
      'prioritas-normal',
      'prioritas-lansia',
      'prioritas-disabilitas',
      'prioritas-vip'
    );

    // Tambahkan class sesuai prioritas tiket.
    prioritasTiketHasil.classList.add(
      `prioritas-${tiket.prioritas}`
    );

    // Tampilkan kartu tiket.
    hasilTiket.classList.remove('hidden');
  }


  // =========================================================================
  // 11. PROSES AMBIL NOMOR ANTRIAN
  // =========================================================================

  function handleAmbilAntrian(
    event: SubmitEvent
  ): void {

    event.preventDefault();

    if (
      !layananSelect ||
      !prioritasSelect
    ) {
      return;
    }

    // -----------------------------------------------------------------------
    // A. Ambil pilihan user
    // -----------------------------------------------------------------------

    const selectedKode =
      layananSelect.value.trim();

    const selectedPrioritas =
      prioritasSelect.value;


    // -----------------------------------------------------------------------
    // B. Validasi layanan
    // -----------------------------------------------------------------------

    if (!selectedKode) {
      showFeedback(
        'Silakan pilih jenis antrian terlebih dahulu.',
        'error'
      );

      layananSelect.focus();

      return;
    }


    // -----------------------------------------------------------------------
    // C. Validasi prioritas
    // -----------------------------------------------------------------------

    if (
      !isTingkatPrioritas(
        selectedPrioritas
      )
    ) {
      showFeedback(
        'Prioritas yang dipilih tidak valid.',
        'error'
      );

      prioritasSelect.focus();

      return;
    }


    // -----------------------------------------------------------------------
    // D. Pastikan jenis antrian masih tersedia dan aktif
    // -----------------------------------------------------------------------

    const jenisAntrian =
      getJenisAntrian();

    const layananDipilih =
      jenisAntrian.find(
        (item) =>
          item.kode === selectedKode
      );

    if (!layananDipilih) {
      showFeedback(
        'Jenis antrian tidak ditemukan.',
        'error'
      );

      renderPilihanLayanan();

      return;
    }

    if (
      layananDipilih.status !== 'active'
    ) {
      showFeedback(
        'Jenis antrian tersebut sedang tidak aktif.',
        'error'
      );

      renderPilihanLayanan();

      return;
    }


    // -----------------------------------------------------------------------
    // E. Ambil data tiket terbaru
    // -----------------------------------------------------------------------

    const tiketList =
      getAntrianTiket();


    // -----------------------------------------------------------------------
    // F. Buat nomor tiket
    // -----------------------------------------------------------------------

    const nomorTiket =
      generateNomorTiket(
        selectedKode,
        tiketList
      );

    if (!nomorTiket) {
      showFeedback(
        `Nomor antrian ${selectedKode} telah mencapai batas 999. Hubungi petugas.`,
        'error'
      );

      return;
    }


    // -----------------------------------------------------------------------
    // G. Buat waktu pengambilan tiket
    // -----------------------------------------------------------------------

    const waktuSekarang =
      new Date().toLocaleTimeString(
        'id-ID',
        {
          hour: '2-digit',
          minute: '2-digit'
        }
      );


    // -----------------------------------------------------------------------
    // H. Bentuk object tiket baru
    // -----------------------------------------------------------------------

    const tiketBaru: TiketAntrian = {
      nomor: nomorTiket,
      kode: layananDipilih.kode,
      nama: layananDipilih.nama,
      prioritas: selectedPrioritas,
      status: 'Menunggu',
      waktu: waktuSekarang
    };


    // -----------------------------------------------------------------------
    // I. Simpan tiket ke Local Storage
    // -----------------------------------------------------------------------

    tiketList.push(tiketBaru);

    saveAntrianTiket(
      tiketList
    );


    // -----------------------------------------------------------------------
    // J. Tampilkan hasil tiket
    // -----------------------------------------------------------------------

    tampilkanTiket(
      tiketBaru
    );


    // -----------------------------------------------------------------------
    // K. Feedback berhasil
    // -----------------------------------------------------------------------

    showFeedback(
      `Tiket ${tiketBaru.nomor} berhasil dibuat. Silakan menunggu nomor Anda dipanggil.`,
      'success'
    );


    // -----------------------------------------------------------------------
    // L. Reset pilihan form
    // -----------------------------------------------------------------------

    layananSelect.value = '';
    prioritasSelect.value = 'normal';
  }


  // =========================================================================
  // 12. EVENT FORM
  // =========================================================================

  formAmbilAntrian?.addEventListener(
    'submit',
    handleAmbilAntrian
  );


  // =========================================================================
  // 13. PEMBARUAN OTOMATIS JIKA LOCAL STORAGE BERUBAH
  // =========================================================================

  /*
    Event "storage" akan berjalan jika Local Storage berubah
    melalui tab/window browser yang lain.

    Contoh:
    - Dashboard Admin dibuka pada Tab 1
    - Ambil Antrian dibuka pada Tab 2
    - Admin menambah / mengaktifkan / menonaktifkan layanan
    - Dropdown di halaman Ambil Antrian akan diperbarui
      tanpa reload manual.
  */

  window.addEventListener(
    'storage',
    (event: StorageEvent) => {

      if (
        event.key === 'jenisAntrian'
      ) {
        renderPilihanLayanan();
      }
    }
  );


  // =========================================================================
  // 14. UPDATE KETIKA USER KEMBALI KE TAB
  // =========================================================================

  /*
    Jika user meninggalkan tab Ambil Antrian kemudian kembali,
    kita cek ulang data jenis antrian dari Local Storage.
  */

  window.addEventListener(
    'focus',
    () => {
      renderPilihanLayanan();
    }
  );


  // =========================================================================
  // 15. INITIAL RENDER
  // =========================================================================

  renderPilihanLayanan();
})();