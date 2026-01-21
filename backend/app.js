const express = require('express')
const cors = require('cors')
const db = require('./config/db')
const app = express()
const PORT = 3000
const reportRoutes = require('./routes/reports')
const detailRoutes = require('./routes/reportDetails')
const exportRoutes = require('./routes/exportReport')
const authRoutes = require('./routes/auth')
const path = require('path')

// FRONTEND
app.use(express.static(path.join(__dirname, '../frontend')))

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'))
})

// BACKEND
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use('/api', reportRoutes)
app.use('/api', detailRoutes)
app.use('/uploads', express.static('uploads'))
app.use('/api', exportRoutes)
app.use('/api', authRoutes)

app.get('/', (req, res) => {
res.send('server work completion berjalan')
})

app.listen(PORT, () => {
console.log(`server running di http://localhost:` + PORT)
})