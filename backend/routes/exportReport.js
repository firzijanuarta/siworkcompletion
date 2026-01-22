const express = require('express')
const router = express.Router()
const db = require('../config/db')
const axios = require('axios')

const {
  Document,
  Packer,
  Paragraph,
  Table,
  TableRow,
  TableCell,
  WidthType,
  ImageRun,
  Header,
  AlignmentType,
  PageBreak
} = require('docx')

function formatTanggal(tanggal) {
  if (!tanggal) return '-'
  const date = new Date(tanggal)
  return date.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  })
}

// ✅ AMBIL GAMBAR LANGSUNG DARI CLOUDINARY URL
async function getImageBuffer(url) {
  const res = await axios.get(url, {
    responseType: 'arraybuffer',
    timeout: 15000
  })
  return Buffer.from(res.data)
}

router.get('/reports/:id/export', async (req, res) => {
  const reportId = req.params.id

  db.query(
    'SELECT * FROM reports WHERE id = ?',
    [reportId],
    async (err, reportResult) => {
      if (err || reportResult.length === 0) {
        return res.status(404).json({ message: 'Laporan tidak ditemukan' })
      }

      const report = reportResult[0]

      db.query(
        'SELECT * FROM report_details WHERE report_id = ? ORDER BY nomor ASC',
        [reportId],
        async (err, details) => {
          if (err) {
            return res.status(500).json({ message: 'Gagal mengambil detail laporan' })
          }

          /* ================= HEADER ================= */
          const header = new Header({ children: [] })

          /* ================= TABEL DETAIL ================= */
          const tableRows = []

          tableRows.push(
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ text: 'No', bold: true })] }),
                new TableCell({ children: [new Paragraph({ text: 'Deskripsi', bold: true })] }),
                new TableCell({ children: [new Paragraph({ text: 'Dokumentasi', bold: true })] })
              ]
            })
          )

          for (const item of details) {
            let images = []

            if (typeof item.dokumentasi === 'string') {
              try {
                images = JSON.parse(item.dokumentasi)
              } catch {
                images = []
              }
            } else if (Array.isArray(item.dokumentasi)) {
              images = item.dokumentasi
            }

            const imageParagraphs = []
            let rowImages = []

            for (let i = 0; i < images.length; i++) {
              try {
                // 🔥 PAKAI URL CLOUDINARY APA ADANYA
                const imgBuffer = await getImageBuffer(images[i])

                rowImages.push(
                  new ImageRun({
                    data: imgBuffer,
                    transformation: {
                      width: 175,
                      height: 280
                    }
                  })
                )

                // max 3 gambar per baris
                if (rowImages.length === 3 || i === images.length - 1) {
                  imageParagraphs.push(
                    new Paragraph({
                      children: rowImages,
                      spacing: { after: 20 }
                    })
                  )
                  rowImages = []
                }
              } catch (e) {
                console.log('❌ GAGAL LOAD IMAGE:', images[i])
              }
            }

            tableRows.push(
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph(String(item.nomor))]
                  }),
                  new TableCell({
                    children: [new Paragraph(item.deskripsi || '-')]
                  }),
                  new TableCell({
                    children:
                      imageParagraphs.length > 0
                        ? imageParagraphs
                        : [new Paragraph('-')]
                  })
                ]
              })
            )
          }

          /* ================= DOKUMEN ================= */
          const doc = new Document({
            sections: [
              {
                headers: { default: header },
                children: [
                  new Paragraph({
                    text: 'Work Completion',
                    alignment: AlignmentType.CENTER,
                    bold: true,
                    size: 48,
                    spacing: { after: 200 }
                  }),

                  new Paragraph({
                    text: `Project : ${report.judul_laporan}`,
                    spacing: { after: 100 }
                  }),
                  new Paragraph({
                    text: `Working Date : ${formatTanggal(report.tanggal_kerja)}`,
                    spacing: { after: 200 }
                  }),

                  new Table({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    rows: tableRows
                  }),

                  new Paragraph({ children: [new PageBreak()] }),

                  new Paragraph({
                    text:
                      'The undersigned certify that the scope of work and services is complete and acceptable.'
                  })
                ]
              }
            ]
          })

          const buffer = await Packer.toBuffer(doc)

          res.setHeader(
            'Content-Disposition',
            `attachment; filename=work-completion-${report.id}.docx`
          )
          res.send(buffer)
        }
      )
    }
  )
})

module.exports = router
