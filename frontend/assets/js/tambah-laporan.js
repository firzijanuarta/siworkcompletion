document.addEventListener('DOMContentLoaded', () => {
  const user = localStorage.getItem('user')
  if (!user) {
    window.location.href = 'login.html'
    return
  }

  document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem('user')
    window.location.href = 'login.html'
  })

  const form = document.getElementById('reportForm')
  const errorMsg = document.getElementById('errorMsg')

  form.addEventListener('submit', async (e) => {
    e.preventDefault()

    const judul_laporan = document.getElementById('judul').value
    const tanggal_kerja = document.getElementById('tanggal').value

    try {
      const res = await fetch('http://localhost:3000/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ judul_laporan, tanggal_kerja })
      })

      const data = await res.json()

      if (!res.ok) {
        errorMsg.textContent = data.message || 'gagal menyimpan laporan'
        return
      }

      window.location.href = 'dashboard.html'
    } catch (err) {
      errorMsg.textContent = 'server tidak merespon'
    }
  })
})

function back() {
  window.location.href = 'dashboard.html'
}
