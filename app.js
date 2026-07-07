// ==========================================
// 1. REGISTRASI SERVICE WORKER
// ==========================================
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then((reg) => console.log('Service Worker aktif:', reg.scope))
      .catch((err) => console.error('Service Worker gagal:', err));
  });
}

// ==========================================
// 2. LOGIKA APLIKASI, TANGGAL & CHECKLIST
// ==========================================
const noteInput = document.getElementById('noteInput');
const addBtn = document.getElementById('addBtn');
const noteList = document.getElementById('noteList');

// --- Fungsi 1: Mendapatkan Hari & Tanggal Sekarang ---
function getFormattedDate() {
  const opsi = { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' };
  // Menghasilkan format Indonesia, contoh: "Selasa, 7 Jul 2026"
  return new Date().toLocaleDateString('id-ID', opsi);
}

// --- Fungsi 2: Memuat Catatan dari Storage saat Aplikasi Dibuka ---
function loadNotes() {
  const savedNotes = JSON.parse(localStorage.getItem('pwa_notes')) || [];
  savedNotes.forEach(noteObj => {
    // noteObj sekarang berisi id, teks, tanggal, dan status selesai (isDone)
    createNoteElement(noteObj);
  });
}

// --- Fungsi 3: Membuat Elemen Daftar HTML di Layar ---
function createNoteElement(noteObj) {
  const li = document.createElement('li');
  li.setAttribute('data-id', noteObj.id);
  if (noteObj.isDone) {
    li.classList.add('completed'); // Beri gaya coret jika sudah selesai
  }

  // A. Kotak Centang (Checkbox)
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.checked = noteObj.isDone;
  checkbox.addEventListener('change', () => {
    li.classList.toggle('completed', checkbox.checked);
    toggleNoteStatusInStorage(noteObj.id, checkbox.checked);
  });

  // B. Konten Teks & Tanggal
  const contentDiv = document.createElement('div');
  contentDiv.className = 'note-content';

  const textSpan = document.createElement('span');
  textSpan.className = 'note-text';
  textSpan.textContent = noteObj.text;

  const dateSpan = document.createElement('span');
  dateSpan.className = 'note-date';
  dateSpan.textContent = noteObj.date;

  contentDiv.appendChild(textSpan);
  contentDiv.appendChild(dateSpan);

  // C. Tombol Hapus
  const deleteBtn = document.createElement('button');
  deleteBtn.textContent = '❌';
  deleteBtn.className = 'delete-btn';
  deleteBtn.addEventListener('click', () => {
    li.remove();
    deleteNoteFromStorage(noteObj.id);
  });

  // Gabungkan semua komponen ke dalam baris list (li)
  li.appendChild(checkbox);
  li.appendChild(contentDiv);
  li.appendChild(deleteBtn);
  noteList.appendChild(li);
}

// --- Fungsi 4: Menyimpan Catatan Baru ke localStorage ---
function saveNoteToStorage(noteObj) {
  const savedNotes = JSON.parse(localStorage.getItem('pwa_notes')) || [];
  savedNotes.push(noteObj);
  localStorage.setItem('pwa_notes', JSON.stringify(savedNotes));
}

// --- Fungsi 5: Mengubah Status Centang (Selesai/Belum) di localStorage ---
function toggleNoteStatusInStorage(id, isDone) {
  let savedNotes = JSON.parse(localStorage.getItem('pwa_notes')) || [];
  savedNotes = savedNotes.map(note => {
    if (note.id === id) {
      note.isDone = isDone;
    }
    return note;
  });
  localStorage.setItem('pwa_notes', JSON.stringify(savedNotes));
}

// --- Fungsi 6: Menghapus Catatan dari localStorage Berdasarkan ID ---
function deleteNoteFromStorage(id) {
  let savedNotes = JSON.parse(localStorage.getItem('pwa_notes')) || [];
  savedNotes = savedNotes.filter(note => note.id !== id);
  localStorage.setItem('pwa_notes', JSON.stringify(savedNotes));
}

// --- Event Listener: Ketika Tombol 'Tambah' Diklik ---
addBtn.addEventListener('click', () => {
  const text = noteInput.value.trim();
  if (text !== '') {
    const newNote = {
      id: Date.now(), // Gunakan timestamp sebagai ID unik
      text: text,
      date: getFormattedDate(),
      isDone: false
    };

    createNoteElement(newNote); // Tampilkan di layar
    saveNoteToStorage(newNote); // Simpan ke storage
    noteInput.value = '';        // Bersihkan input
  }
});// ==========================================
// 3. FITUR SINKRONISASI DATABASE GITHUB API
// ==========================================
const githubTokenInput = document.getElementById('githubToken');
const uploadBtn = document.getElementById('uploadBtn');
const downloadBtn = document.getElementById('downloadBtn');

// GANTI DENGAN DATA REPOSITORI ANDA SENDIRI
const GITHUB_USER = 'nurpriambodo09';
const GITHUB_REPO = 'catatanghmelon';
const FILE_PATH = 'data.json'; // Nama file database catatan di cloud

// Mengambil token yang tersimpan di browser agar tidak perlu ketik ulang
githubTokenInput.value = localStorage.getItem('pwa_gh_token') || '';

// --- Fungsi Pendukung: Ambil info file (SHA) dari GitHub jika file sudah ada ---
async function getFileSha(token) {
  try {
    const response = await fetch(`https://github.com

{GITHUB_USER}/${GITHUB_REPO}/contents/${FILE_PATH}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (response.ok) {
      const data = await response.json();
      return data.sha; // Mengembalikan ID SHA versi file terakhir di GitHub
    }
    return null; // File belum ada
  } catch (error) {
    return null;
  }
}

// --- 1. PROSES UNGGAH (Local -> GitHub Cloud) ---
uploadBtn.addEventListener('click', async () => {
  const token = githubTokenInput.value.trim();
  if (!token) return alert('Masukkan GitHub Token terlebih dahulu!');
  
  // Simpan token secara lokal agar praktis
  localStorage.setItem('pwa_gh_token', token);

  const localNotes = localStorage.getItem('pwa_notes') || '[]';
  
  // Ubah konten teks catatan menjadi format Base64 (Wajib untuk GitHub API)
  const base64Content = btoa(unescape(encodeURIComponent(localNotes)));
  
  // Cek apakah file data.json sudah ada di GitHub untuk mendapatkan SHA-nya
  const sha = await getFileSha(token);

  const bodyData = {
    message: "Sinkronisasi data catatan dari PWA",
    content: base64Content
  };
  if (sha) bodyData.sha = sha; // Jika file sudah ada, sertakan SHA untuk menimpa file lama

  // Lakukan request PUT ke API GitHub
  const response = await fetch(`https://github.com
  {GITHUB_USER}/${GITHUB_REPO}/contents/${FILE_PATH}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(bodyData)
  });

  if (response.ok) {
    alert('✅ Catatan sukses dicadangkan ke cloud GitHub!');
  } else {
    alert('❌ Gagal mengunggah data. Periksa token atau nama repositori Anda.');
  }
});

// --- 2. PROSES UNDUH (GitHub Cloud -> Local) ---
downloadBtn.addEventListener('click', async () => {
  const token = githubTokenInput.value.trim();
  if (!token) return alert('Masukkan GitHub Token terlebih dahulu!');

  const response = await fetch(`https://github.com
  {GITHUB_USER}/${GITHUB_REPO}/contents/${FILE_PATH}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  if (response.ok) {
    const data = await response.json();
    // Dekode kembali teks dari Base64 ke teks normal
    const decodedContent = decodeURIComponent(escape(atob(data.content)));
    
    // Simpan ke localStorage lokal dan perbarui tampilan layar
    localStorage.setItem('pwa_notes', decodedContent);
    noteList.innerHTML = ''; // Kosongkan layar lama
    loadNotes(); // Muat data baru hasil unduhan
    
    alert('📥 Catatan dari cloud berhasil disinkronkan ke HP ini!');
  } else {
    alert('❌ Gagal mengambil data. File di cloud mungkin belum dibuat.');
  }
});



// Jalankan fungsi memuat otomatis saat aplikasi pertama dibuka
loadNotes();
