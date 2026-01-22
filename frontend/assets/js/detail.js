const BASE_URL = 'https://siworkcompletion-production.up.railway.app'

// 🔥 GANTI DENGAN DATA CLOUDINARY KAMU
const CLOUDINARY_UPLOAD_URL =
  'https://api.cloudinary.com/v1_1/ISI_CLOUD_NAME/image/upload'
const CLOUDINARY_UPLOAD_PRESET = 'ISI_UPLOAD_PRESET'

// =========================
document.addEventListener('DOMContentLoaded', () => {
  const user = localStorage.getItem('user')
  if (!user) {
    window.location.href = 'login.html'
    return
  }

  document.getElementById('logoutBtn').addEventListener('click', () => {
    Swal.fire({
      title: 'Logout?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Logout'
    }).then(r => {
      if (r.isConfirmed) {
        localStorage.removeItem('user')
        window.location.href = 'login.html'
      }
    })
  })

  const params = new URLSearchParams(window.location.search)
  const reportId = params.get('report_id')
  if (!reportId) return

  loadReport(reportId)
  loadDetails(reportId)

  const form = document.getElementById('detailForm')
  const fileInput = document.getElementById('dokumentasi')
  const previewContainer = document.getElementById('previewContainer')
  const fileCount = document.getElementById('fileCount')
  const errorMsg = document.getElementById('errorMsg')

  // ===== PREVIEW =====
  fileInput.addEventListener('change', () => {
    previewContainer.innerHTML = ''
    const files = fileInput.files

    if (!files.length) {
      fileCount.textContent = 'Belum ada gambar dipilih'
      return
    }

    fileCount.textContent = `${files.length} gambar dipilih`

    Array.from(files).forEach(file => {
      const img = document.createElement('img')
      img.src = URL.createObjectURL(file)
      img.className = 'thumb'
      previewContainer.appendChild(img)
    })
  })

  // ===== SUBMIT =====
  form.addEventListener('submit', async e => {
    e.preventDefault()
    errorMsg.textContent = ''

    const deskripsi = document.getElementById('deskripsi').value
    const files = fileInput.files

    if (!files.length) {
      errorMsg.textContent = 'Minimal 1 gambar'
      return
    }

    try {
      Swal.fire({
        title: 'Upload...',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
      })

      // 🔥 UPLOAD KE CLOUDINARY
      const imageUrls = []

      for (const file of files) {
        const fd = new FormData()
        fd.append('file', file)
        fd.append('upload_preset', CLOUDINARY_UPLOAD_PRESET)

        const res = await fetch(CLOUDINARY_UPLOAD_URL, {
          method: 'POST',
          body: fd
        })

        const data = await res.json()
        if (!data.secure_url) throw new Error('Upload gagal')

        imageUrls.push(data.secure_url)
      }

      // 🔥 KIRIM KE BACKEND (JSON, BUKAN FILE)
      const res = await fetch(
        `${BASE_URL}/api/reports/${reportId}/details`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            deskripsi,
            dokumentasi: imageUrls
          })
        }
      )

      if (!res.ok) throw new Error('Gagal simpan detail')

      Swal.close()
      form.reset()
      previewContainer.innerHTML = ''
      fileCount.textContent = 'Belum ada gambar dipilih'
      loadDetails(reportId)
    } catch (err) {
      Swal.close()
      errorMsg.textContent = err.message || 'Server error'
    }
  })
})

// =========================

function loadReport(id) {
  fetch(`${BASE_URL}/api/reports/${id}`)
    .then(r => r.json())
    .then(d => {
      document.getElementById('judulLaporan').textContent =
        d.judul_laporan
      document.getElementById('tanggalLaporan').textContent =
        'Tanggal: ' + d.tanggal_kerja
    })
}

function loadDetails(id) {
  fetch(`${BASE_URL}/api/reports/${id}/details`)
    .then(r => r.json())
    .then(data => {
      const tbody = document.getElementById('detailTableBody')
      tbody.innerHTML = ''

      data.forEach(item => {
        const imgs = Array.isArray(item.dokumentasi)
          ? item.dokumentasi
          : []

        tbody.innerHTML += `
          <tr>
            <td>${item.nomor}</td>
            <td>${item.deskripsi}</td>
            <td>
              <div class="doc-grid">
                ${imgs
                  .map(
                    url =>
                      `<img src="${url}" class="thumb">`
                  )
                  .join('')}
              </div>
            </td>
            <td>
              <button class="btn-danger btn-small"
                onclick="hapusDetail(${item.id})">
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
    title: 'Hapus?',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Hapus'
  }).then(r => {
    if (!r.isConfirmed) return

    fetch(`${BASE_URL}/api/reports/details/${detailId}`, {
      method: 'DELETE'
    }).then(() => {
      const params = new URLSearchParams(window.location.search)
      loadDetails(params.get('report_id'))
    })
  })
}
