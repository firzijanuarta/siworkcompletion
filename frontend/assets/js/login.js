document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('loginForm')
  const errorMsg = document.getElementById('errorMsg')
  const loading = document.getElementById('loadingOverlay')

  const togglePassword = document.getElementById('togglePassword')
  const passwordInput = document.getElementById('password')

  // ===== toggle password =====
  togglePassword.addEventListener('click', () => {
    const type = passwordInput.getAttribute('type')
    const icon = togglePassword.querySelector('i')

    if (type === 'password') {
      passwordInput.type = 'text'
      icon.classList.remove('fa-eye-slash')
      icon.classList.add('fa-eye')
    } else {
      passwordInput.type = 'password'
      icon.classList.remove('fa-eye')
      icon.classList.add('fa-eye-slash')
    }
  })

  // ===== submit login =====
  form.addEventListener('submit', async e => {
    e.preventDefault()

    const username = document.getElementById('username').value
    const password = document.getElementById('password').value

    errorMsg.textContent = ''
    errorMsg.classList.remove('error')

    try {
      const res = await fetch('http://localhost:3000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      })

      const data = await res.json()

      if (!res.ok) {
        errorMsg.textContent = data.message || 'Login gagal'
        errorMsg.classList.remove('error')
        void errorMsg.offsetWidth
        errorMsg.classList.add('error')
        return
      }

      // ✅ SIMPAN USER
      localStorage.setItem('user', JSON.stringify(data.user))

      // 🔥 TAMPILKAN LOADING
      loading.classList.add('active')

      // 🔥 DELAY HALUS SEBELUM DASHBOARD
      setTimeout(() => {
        window.location.href = 'dashboard.html'
      }, 900)

    } catch (err) {
      errorMsg.textContent = 'server tidak merespon'
      errorMsg.classList.remove('error')
      void errorMsg.offsetWidth
      errorMsg.classList.add('error')
    }
  })
})
