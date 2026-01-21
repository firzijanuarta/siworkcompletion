const express = require('express')
const router = express.Router()
const db = require('../config/db')
const upload = require('../config/upload')
const fs = require('fs')
const path = require('path')

/**
 * tambah detail laporan + upload gambar
 */
router.post('/reports/:id/details', upload.array('dokumentasi'), (req, res) => {
  const reportId = req.params.id
  const { deskripsi } = req.body

  const images = req.files && req.files.length > 0
    ? req.files.map(file => 'uploads/' + file.filename)
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
      (err) => {
        if (err) {
          return res.status(500).json({ message: 'gagal menyimpan detail' })
        }

        res.json({ message: 'detail laporan berhasil ditambahkan' })
      }
    )
  })
})

/**
 * ambil detail laporan berdasarkan report_id
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
  // JIKA SUDAH ARRAY → LANGSUNG PAKAI
  if (Array.isArray(row.dokumentasi)) {
    return
  }

  // JIKA NULL / KOSONG
  if (!row.dokumentasi) {
    row.dokumentasi = []
    return
  }

  // JIKA STRING JSON
  if (typeof row.dokumentasi === 'string') {
    try {
      row.dokumentasi = JSON.parse(row.dokumentasi)
    } catch (e) {
      console.error('PARSE ERROR:', row.dokumentasi)
      row.dokumentasi = []
    }
  }
})


    res.json(rows)
  })
})

router.delete('/reports/details/:detailId', (req, res) => {
  const detailId = req.params.detailId
  // console.log('🔥 DELETE DETAIL ID:', detailId)

  db.query(
    'SELECT dokumentasi FROM report_details WHERE id = ?',
    [detailId],
    (err, rows) => {
      if (err || rows.length === 0) {
        return res.status(404).json({ message: 'detail tidak ditemukan' })
      }

      const raw = rows[0].dokumentasi
      console.log('RAW DOKUMENTASI DB:', raw, typeof raw)

      let files = []

      // ✅ AMAN UNTUK SEMUA KONDISI
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

      // HAPUS FILE FISIK
      files.forEach(file => {
      const filename = path.basename(file)
      const filePath = path.join(__dirname, '..', 'uploads', filename)

      console.log('TARGET FILE:', filePath)
      console.log('EXIST ?', fs.existsSync(filePath))

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath)
        console.log('✅ FILE TERHAPUS')
      } else {
        console.log('❌ FILE TIDAK DITEMUKAN')
      }
    })

      // 🔥 HAPUS DATA DB
      db.query(
        'DELETE FROM report_details WHERE id = ?',
        [detailId],
        err => {
          if (err) {
            return res.status(500).json({ message: 'gagal hapus detail' })
          }

          res.json({ message: 'detail & gambar berhasil dihapus' })
        }
      )
    }
  )
})

module.exports = router
