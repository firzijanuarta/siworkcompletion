// ================= CONFIG =================
const BASE_URL = 'https://siworkcompletion-production.up.railway.app'

document.addEventListener('DOMContentLoaded', () => {
  // ===== login guard =====
  const user = localStorage.getItem('user')
  if (!user) {
    window.location.href = 'login.html'
    return
  }

  // ===== logout =====
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

  loadReports()
})

/* ================= UTIL ================= */
function formatTanggal(tanggal) {
  if (!tanggal) return '-'
  const date = new Date(tanggal)
  return date.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  })
}

/* ================= PAGINATION STATE ================= */
const tableBody = document.getElementById('reportTableBody')
const paginationEl = document.getElementById('pagination')

let reports = []
let currentPage = 1
const rowsPerPage = 15

/* ================= FETCH ================= */
function loadReports() {
  fetch(`${BASE_URL}/api/reports`)
    .then(res => res.json())
    .then(data => {
      reports = data
      currentPage = 1
      renderTable()
      renderPagination()
    })
    .catch(err => {
      console.error(err)
      alert('Gagal mengambil data laporan')
    })
}

/* ================= RENDER TABLE ================= */
function renderTable() {
  tableBody.innerHTML = ''

  const start = (currentPage - 1) * rowsPerPage
  const end = start + rowsPerPage
  const pageData = reports.slice(start, end)

  pageData.forEach((item, index) => {
    const tr = document.createElement('tr')

    tr.innerHTML = `
      <td>${start + index + 1}</td>
      <td>${item.judul_laporan}</td>
      <td>${formatTanggal(item.tanggal_kerja)}</td>
      <td>
        <div class="aksi-btn">
          <button class="btn-detail" onclick="goDetail(${item.id})">Detail</button>
          <button class="btn-small btn-danger" onclick="hapusReport(${item.id})">Hapus</button>
          <button class="btn-small" onclick="exportReport(${item.id})">Export</button>
        </div>
      </td>
    `
    tableBody.appendChild(tr)
  })
}

/* ================= RENDER PAGINATION ================= */
function renderPagination() {
  paginationEl.innerHTML = ''
  const totalPages = Math.ceil(reports.length / rowsPerPage)

  if (totalPages <= 1) return

  const prevBtn = document.createElement('button')
  prevBtn.textContent = 'Prev'
  prevBtn.disabled = currentPage === 1
  prevBtn.onclick = () => {
    currentPage--
    renderTable()
    renderPagination()
  }
  paginationEl.appendChild(prevBtn)

  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement('button')
    btn.textContent = i
    if (i === currentPage) btn.classList.add('active')

    btn.onclick = () => {
      currentPage = i
      renderTable()
      renderPagination()
    }

    paginationEl.appendChild(btn)
  }

  const nextBtn = document.createElement('button')
  nextBtn.textContent = 'Next'
  nextBtn.disabled = currentPage === totalPages
  nextBtn.onclick = () => {
    currentPage++
    renderTable()
    renderPagination()
  }
  paginationEl.appendChild(nextBtn)
}

/* ================= HELPER ================= */
function goDetail(id) {
  window.location.href = `detail.html?report_id=${id}`
}

function goTambah() {
  window.location.href = 'tambah-laporan.html'
}

function exportReport(id) {
  window.open(`${BASE_URL}/api/reports/${id}/export`, '_blank')
}

/* ================= DELETE ================= */
function hapusReport(id) {
  Swal.fire({
    title: 'Hapus Laporan?',
    text: 'Semua detail dan gambar akan ikut terhapus',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#ef4444',
    cancelButtonColor: '#6b7280',
    confirmButtonText: 'Ya, hapus',
    cancelButtonText: 'Batal'
  }).then(result => {
    if (result.isConfirmed) {
      fetch(`${BASE_URL}/api/reports/${id}`, { method: 'DELETE' })
        .then(res => res.json())
        .then(data => {
          Swal.fire({
            icon: 'success',
            title: 'Berhasil',
            text: data.message || 'Laporan terhapus',
            timer: 1500,
            showConfirmButton: false
          })
          loadReports()
        })
        .catch(() => {
          Swal.fire('Error', 'Gagal menghapus laporan', 'error')
        })
    }
  })
}
