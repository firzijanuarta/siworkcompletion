const express = require('express')
const router = express.Router()
const db = require('../config/db')
const fs = require('fs')
const path = require('path')

// ==========================
// TAMBAH LAPORAN
// ==========================
router.post('/reports', (req, res) => {
  const { judul_laporan, tanggal_kerja } = req.body

  const sql =
    'INSERT INTO reports (judul_laporan, tanggal_kerja) VALUES (?, ?)'

  db.query(sql, [judul_laporan, tanggal_kerja], err => {
    if (err) {
      return res.status(500).json({ message: 'gagal menambah laporan' })
    }
    res.json({ message: 'laporan berhasil dibuat' })
  })
})

// ==========================
// AMBIL SEMUA LAPORAN
// ==========================
router.get('/reports', (req, res) => {
  const sql = 'SELECT * FROM reports ORDER BY created_at DESC'
  db.query(sql, (err, rows) => {
    if (err) {
      return res.status(500).json({ message: 'gagal mengambil data' })
    }
    res.json(rows)
  })
})


router.delete('/reports/:id', (req, res) => {
  const reportId = req.params.id
  console.log('🔥 DELETE REPORT ID:', reportId)

  db.query(
    'SELECT dokumentasi FROM report_details WHERE report_id = ?',
    [reportId],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ message: 'gagal ambil detail' })
      }

      rows.forEach(row => {
        const raw = row.dokumentasi
        console.log('RAW DOKUMENTASI DB:', raw, typeof raw)

        let files = []

        if (Array.isArray(raw)) {
          files = raw
        } else if (typeof raw === 'string' && raw.trim() !== '') {
          try {
            files = JSON.parse(raw)
          } catch (e) {
            console.log('❌ JSON PARSE GAGAL:', e.message)
            files = []
          }
        }

        console.log('FILES FINAL:', files)

        files.forEach(file => {
          const filename = path.basename(file)
          const filePath = path.join(
            __dirname,
            '..',
            'uploads',
            filename
          )

          console.log('TARGET FILE:', filePath)
          console.log('EXIST ?', fs.existsSync(filePath))

          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath)
            console.log('✅ FILE TERHAPUS')
          } else {
            console.log('❌ FILE TIDAK DITEMUKAN')
          }
        })
      })

      db.query(
        'DELETE FROM report_details WHERE report_id = ?',
        [reportId],
        err => {
          if (err) {
            return res
              .status(500)
              .json({ message: 'gagal hapus detail laporan' })
          }

          // 🔥 HAPUS LAPORAN
          db.query(
            'DELETE FROM reports WHERE id = ?',
            [reportId],
            err => {
              if (err) {
                return res
                  .status(500)
                  .json({ message: 'gagal hapus laporan' })
              }

              res.json({
                message:
                  'Laporan berhasil dihapus '
              })
            }
          )
        }
      )
    }
  )
})


module.exports = router
