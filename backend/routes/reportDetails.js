const express = require('express')
const router = express.Router()
const db = require('../config/db')
const cloudinary = require('../config/cloudinary')

/* ================== TAMBAH DETAIL ================== */
router.post('/reports/:id/details', upload.array('dokumentasi'), async (req, res) => {
  const reportId = req.params.id
  const { deskripsi } = req.body
S
  try {
    let images = []

    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const result = await cloudinary.uploader.upload(file.path, {
          folder: 'reports'
        })
        images.push(result.secure_url)
      }
    }

    db.query(
      'SELECT MAX(nomor) AS maxNomor FROM report_details WHERE report_id = ?',
      [reportId],
      (err, result) => {
        if (err) {
          return res.status(500).json({ message: 'gagal menentukan nomor' })
        }

        const nomor = (result[0].maxNomor || 0) + 1

        db.query(
          'INSERT INTO report_details (report_id, nomor, deskripsi, dokumentasi) VALUES (?, ?, ?, ?)',
          [reportId, nomor, deskripsi, JSON.stringify(images)],
          err => {
            if (err) {
              return res.status(500).json({ message: 'gagal menyimpan detail' })
            }
            res.json({ message: 'detail berhasil ditambahkan' })
          }
        )
      }
    )
  } catch (err) {
    console.error('UPLOAD ERROR:', err.message)
    res.status(500).json({ message: 'upload gagal' })
  }
})

/* ================== DELETE DETAIL ================== */
router.delete('/reports/details/:detailId', (req, res) => {
  const detailId = req.params.detailId

  db.query(
    'SELECT dokumentasi FROM report_details WHERE id = ?',
    [detailId],
    async (err, rows) => {
      if (err || rows.length === 0) {
        return res.status(404).json({ message: 'detail tidak ditemukan' })
      }

      let files = []

      try {
        files = JSON.parse(rows[0].dokumentasi || '[]')
      } catch {
        files = []
      }

      // HAPUS DARI CLOUDINARY
      for (const url of files) {
        try {
          const publicId = url.split('/').pop().split('.')[0]
          await cloudinary.uploader.destroy(`reports/${publicId}`)
        } catch (e) {
          console.log('SKIP DELETE:', url)
        }
      }

      db.query(
        'DELETE FROM report_details WHERE id = ?',
        [detailId],
        err => {
          if (err) {
            return res.status(500).json({ message: 'gagal hapus detail' })
          }
          res.json({ message: 'detail & gambar terhapus' })
        }
      )
    }
  )
})

module.exports = router
