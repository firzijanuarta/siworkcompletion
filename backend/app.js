const express = require('express')
const cors = require('cors')
const app = express()
const PORT = process.env.PORT || 3000

const reportRoutes = require('./routes/reports')
const detailRoutes = require('./routes/reportDetails')
const exportRoutes = require('./routes/exportReport')
const authRoutes = require('./routes/auth')

// ===== MIDDLEWARE =====
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// ===== API ROUTES =====
app.use('/api', reportRoutes)
app.use('/api', detailRoutes)
app.use('/api', exportRoutes)
app.use('/api', authRoutes)
app.use('/uploads', express.static('uploads'))

// ===== ROOT CHECK =====
app.get('/', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Backend SiWorkCompletion berjalan'
  })
})

app.listen(PORT, () => {
  console.log(`server running di port ${PORT}`)
})
