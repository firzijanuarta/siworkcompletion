const express = require('express')
const cors = require('cors')

const reportRoutes = require('./routes/reports')
const detailRoutes = require('./routes/reportDetails')
const exportRoutes = require('./routes/exportReport')
const authRoutes = require('./routes/auth')

const app = express()
const PORT = process.env.PORT || 3000

/* ===== CORS CONFIG (SAFE FOR NETLIFY + RAILWAY) ===== */
app.use(cors({
  origin: [
    'https://dapper-kleicha-a75f5a.netlify.app',
    'https://siworkcompletion-production.up.railway.app'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))

/* ===== BODY PARSER ===== */
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

/* ===== API ROUTES ===== */
app.use('/api', reportRoutes)
app.use('/api', detailRoutes)
app.use('/api', exportRoutes)
app.use('/api', authRoutes)

app.use('/uploads', express.static('uploads'))

/* ===== ROOT ===== */
app.get('/', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Backend SiWorkCompletion berjalan'
  })
})

app.listen(PORT, () => {
  console.log(`server running di port ${PORT}`)
})
