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

// ===== AMBIL GAMBAR VIA URL (PALING STABIL DI RAILWAY) =====
async function getImageBuffer(url) {
  const res = await axios.get(url, { responseType: 'arraybuffer' })
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
          let headerImage
          try {
            const headerUrl = `${process.env.BASE_URL}/assets/header.png`
            const headerBuffer = await getImageBuffer(headerUrl)

            headerImage = new Header({
              children: [
                new Paragraph({
                  children: [
                    new ImageRun({
                      data: headerBuffer,
                      transformation: { width: 340, height: 77 }
                    })
                  ]
                })
              ]
            })
          } catch {
            headerImage = new Header({ children: [] })
          }

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
            }

            const imageParagraphs = []
            let currentImages = []

            for (let i = 0; i < images.length; i++) {
              try {
                const imgUrl = `${process.env.BASE_URL}/${images[i].replace(/\\/g, '/')}`
                const imgBuffer = await getImageBuffer(imgUrl)

                currentImages.push(
                  new ImageRun({
                    data: imgBuffer,
                    transformation: { width: 180, height: 330 }
                  })
                )

                if (currentImages.length === 3 || i === images.length - 1) {
                  imageParagraphs.push(
                    new Paragraph({
                      children: currentImages,
                      spacing: { after: 100 }
                    })
                  )
                  currentImages = []
                }
              } catch {
                // skip image error, jangan crash
              }
            }

            tableRows.push(
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph(item.nomor.toString())] }),
                  new TableCell({ children: [new Paragraph(item.deskripsi)] }),
                  new TableCell({
                    children: imageParagraphs.length ? imageParagraphs : [new Paragraph('-')]
                  })
                ]
              })
            )
          }

          /* ================= DOKUMEN ================= */
          const doc = new Document({
            sections: [
              {
                headers: { default: headerImage },
                children: [
                  new Paragraph({
                    text: 'Work Completion',
                    alignment: AlignmentType.CENTER,
                    bold: true,
                    size: 50,
                    spacing: { after: 200 }
                  }),
                  new Paragraph({
                    text: 'for',
                    alignment: AlignmentType.CENTER,
                    bold: true,
                    size: 50,
                    spacing: { after: 300 }
                  }),

                  new Paragraph(`Customer     : PT. Pertamina Hulu Rokan`),
                  new Paragraph(`Project        : ${report.judul_laporan}`),
                  new Paragraph(`Location     : -`),
                  new Paragraph(`Working Date : ${formatTanggal(report.tanggal_kerja)}`),
                  new Paragraph(`Contract No  : -`),
                  new Paragraph(`Ticket No    : SPHR00304A`),
                  new Paragraph({ text: '', spacing: { after: 200 } }),

                  new Table({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    rows: tableRows
                  }),

                  new Paragraph({ children: [new PageBreak()] }),

                  new Paragraph({
                    text:
                      'The undersigned certify that the scope of work and services is complete and acceptable.',
                    spacing: { after: 300 }
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
