const express = require('express')
const router = express.Router()
const db = require('../config/db')

// 🔥 GANTI upload LOCAL → CLOUDINARY
const upload = require('../middleware/uploadCloudinary')

/**
 * ===============================
 * TAMBAH DETAIL LAPORAN + GAMBAR
 * ===============================
 */
router.post(
  '/reports/:id/details',
  upload.array('dokumentasi', 10),
  (req, res) => {
    const reportId = req.params.id
    const { deskripsi } = req.body

    // 🔥 URL CLOUDINARY (AMAN DI RAILWAY)
    const images =
      req.files && req.files.length > 0
        ? req.files.map(file => file.path)
        : []

    const nomorSql =
      'SELECT MAX(nomor) AS maxNomor FROM report_details WHERE report_id = ?'

    db.query(nomorSql, [reportId], (err, result) => {
      if (err) {
        return res.status(500).json({ message: 'gagal menentukan nomor' })
      }

      const nomor = (result[0].maxNomor || 0) + 1

      const insertSql =
        'INSERT INTO report_details (report_id, nomor, deskripsi, dokumentasi) VALUES (?, ?, ?, ?)'

      db.query(
        insertSql,
        [reportId, nomor, deskripsi, JSON.stringify(images)],
        err => {
          if (err) {
            return res
              .status(500)
              .json({ message: 'gagal menyimpan detail' })
          }

          res.json({ message: 'detail laporan berhasil ditambahkan' })
        }
      )
    })
  }
)

/**
 * ===============================
 * AMBIL DETAIL LAPORAN
 * ===============================
 */
router.get('/reports/:id/details', (req, res) => {
  const reportId = req.params.id

  const sql =
    'SELECT id, nomor, deskripsi, dokumentasi FROM report_details WHERE report_id = ? ORDER BY nomor ASC'

  db.query(sql, [reportId], (err, rows) => {
    if (err) {
      return res.status(500).json({ message: 'gagal mengambil detail' })
    }

    rows.forEach(row => {
      if (!row.dokumentasi) {
        row.dokumentasi = []
        return
      }

      if (Array.isArray(row.dokumentasi)) return

      if (typeof row.dokumentasi === 'string') {
        try {
          row.dokumentasi = JSON.parse(row.dokumentasi)
        } catch {
          row.dokumentasi = []
        }
      }
    })

    res.json(rows)
  })
})

/**
 * ===============================
 * HAPUS DETAIL (CLOUDINARY SAFE)
 * ===============================
 */
router.delete('/reports/details/:detailId', (req, res) => {
  const detailId = req.params.detailId

  // ❌ TIDAK HAPUS FILE LOKAL
  // Cloudinary → auto manage

  db.query(
    'DELETE FROM report_details WHERE id = ?',
    [detailId],
    err => {
      if (err) {
        return res.status(500).json({ message: 'gagal hapus detail' })
      }

      res.json({ message: 'detail berhasil dihapus' })
    }
  )
})

module.exports = router
