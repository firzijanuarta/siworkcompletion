document.addEventListener('DOMContentLoaded', () => {
  const user = localStorage.getItem('user')
  if (!user) {
    window.location.href = 'login.html'
    return
  }

document.getElementById('logoutBtn').addEventListener('click', () => {
  Swal.fire({
    title: 'Logout?',
    text: 'Anda akan keluar dari sistem',
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'Logout',
    cancelButtonText: 'Batal'
  }).then(result => {
    if (result.isConfirmed) {
      localStorage.removeItem('user')
      window.location.href = 'login.html'
    }
  })
})

  const params = new URLSearchParams(window.location.search)
  const reportId = params.get('report_id')

  if (!reportId) {
    alert('laporan tidak ditemukan')
    window.location.href = 'dashboard.html'
    return
  }

  loadReport(reportId)
  loadDetails(reportId)

  const form = document.getElementById('detailForm')
  const errorMsg = document.getElementById('errorMsg')
  const fileInput = document.getElementById('dokumentasi')
  const previewContainer = document.getElementById('previewContainer')
  const fileCount = document.getElementById('fileCount')
  const cancelBtn = document.getElementById('cancelBtn')

  // ===== PREVIEW GAMBAR FORM =====
  fileInput.addEventListener('change', () => {
    previewContainer.innerHTML = ''
    const files = fileInput.files

    if (files.length === 0) {
      fileCount.textContent = 'Belum ada gambar dipilih'
      return
    }

    fileCount.textContent = `${files.length} gambar dipilih`

    Array.from(files).forEach(file => {
      const reader = new FileReader()
      reader.onload = e => {
        const img = document.createElement('img')
        img.src = e.target.result
        img.className = 'thumb'
        previewContainer.appendChild(img)
      }
      reader.readAsDataURL(file)
    })
  })

  // ===== BATAL =====
  cancelBtn.addEventListener('click', () => {
    form.reset()
    previewContainer.innerHTML = ''
    fileCount.textContent = 'Belum ada gambar dipilih'
    errorMsg.textContent = ''
  })

  // ===== SUBMIT =====
  form.addEventListener('submit', async e => {
    e.preventDefault()

    const deskripsi = document.getElementById('deskripsi').value
    const files = fileInput.files

    if (files.length === 0) {
      errorMsg.textContent = 'minimal upload 1 gambar'
      return
    }

    const formData = new FormData()
    formData.append('deskripsi', deskripsi)

    for (const file of files) {
      formData.append('dokumentasi', file)
    }

    try {
      const res = await fetch(
        `http://localhost:3000/api/reports/${reportId}/details`,
        { method: 'POST', body: formData }
      )

      const data = await res.json()

      if (!res.ok) {
        errorMsg.textContent = data.message
        return
      }

      form.reset()
      previewContainer.innerHTML = ''
      fileCount.textContent = 'Belum ada gambar dipilih'
      errorMsg.textContent = ''
      loadDetails(reportId)
    } catch {
      errorMsg.textContent = 'server tidak merespon'
    }
  })
})

// =======================

function loadReport(id) {
  fetch(`http://localhost:3000/api/reports/${id}`)
    .then(res => res.json())
    .then(data => {
      document.getElementById('judulLaporan').textContent = data.judul_laporan
      document.getElementById('tanggalLaporan').textContent =
        'Tanggal: ' + data.tanggal_kerja
    })
}

function loadDetails(id) {
  fetch(`http://localhost:3000/api/reports/${id}/details`)
    .then(res => res.json())
    .then(data => {
      const tbody = document.getElementById('detailTableBody')
      tbody.innerHTML = ''

      data.forEach(item => {
        let dokumentasi = []

        // 🟢 pertahankan logic lama
        if (Array.isArray(item.dokumentasi)) {
          dokumentasi = item.dokumentasi
        }

        let kolomDokumentasi =
          '<span class="text-muted">Tidak ada foto</span>'

        if (dokumentasi.length > 0) {
          kolomDokumentasi = `
            <div class="doc-grid">
              ${dokumentasi
                .map(
                  img =>
                    `<img src="http://localhost:3000/${img}" class="thumb">`
                )
                .join('')}
            </div>
          `
        }

        tbody.innerHTML += `
          <tr>
            <td>${item.nomor}</td>
            <td>${item.deskripsi}</td>
            <td>${kolomDokumentasi}</td>
            <td>
              <button 
                class="btn-danger btn-small"
                onclick="hapusDetail(${item.id}, ${id})">
                Hapus
              </button>
            </td>
          </tr>
        `
      })
    })
}


function hapusDetail(detailId) {
  Swal.fire({
    title: 'Hapus Detail?',
    text: 'Apakah anda yakin ingin menghapus baris ini?',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#ef4444',
    cancelButtonColor: '#6b7280',
    confirmButtonText: 'Hapus',
    cancelButtonText: 'Batal'
  }).then(result => {
    if (!result.isConfirmed) return

    fetch(`http://localhost:3000/api/reports/details/${detailId}`, {
      method: 'DELETE'
    })
      .then(res => res.json())
      .then(() => {
        // 🔥 langsung refresh tabel (tanpa swal sukses)
        const params = new URLSearchParams(window.location.search)
        loadDetails(params.get('report_id'))
      })
      .catch(() => {
        Swal.fire(
          'Error',
          'Gagal menghapus detail',
          'error'
        )
      })
  })
}









