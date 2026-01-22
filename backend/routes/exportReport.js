const express = require('express')
const router = express.Router()
const db = require('../config/db')
const fs = require('fs')
const path = require('path')

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

router.get('/reports/:id/export', async (req, res) => {
  try {
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
              return res
                .status(500)
                .json({ message: 'Gagal mengambil detail laporan' })
            }

            /* ================= HEADER ================= */
            const headerImagePath = path.join(
              __dirname,
              '../uploads/header.png'
            )

            const headerChildren = []

            if (fs.existsSync(headerImagePath)) {
              headerChildren.push(
                new Paragraph({
                  children: [
                    new ImageRun({
                      data: fs.readFileSync(headerImagePath),
                      transformation: { width: 340, height: 77 }
                    })
                  ]
                })
              )
            }

            const headerSection = new Header({
              children: headerChildren
            })

            /* ================= TABEL DETAIL ================= */
            const tableRows = []

            tableRows.push(
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph('No')] }),
                  new TableCell({ children: [new Paragraph('Deskripsi')] }),
                  new TableCell({ children: [new Paragraph('Dokumentasi')] })
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

              images.forEach(img => {
                const imgPath = path.join(__dirname, '..', img)
                if (fs.existsSync(imgPath)) {
                  imageParagraphs.push(
                    new Paragraph({
                      children: [
                        new ImageRun({
                          data: fs.readFileSync(imgPath),
                          transformation: { width: 180, height: 330 }
                        })
                      ]
                    })
                  )
                }
              })

              tableRows.push(
                new TableRow({
                  children: [
                    new TableCell({
                      children: [new Paragraph(item.nomor.toString())]
                    }),
                    new TableCell({
                      children: [new Paragraph(item.deskripsi)]
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
                  headers: { default: headerSection },
                  children: [
                    new Paragraph({
                      text: 'Work Completion',
                      alignment: AlignmentType.CENTER,
                      bold: true,
                      size: 40
                    }),

                    new Paragraph(`Project : ${report.judul_laporan}`),
                    new Paragraph(
                      `Working Date : ${formatTanggal(report.tanggal_kerja)}`
                    ),

                    new Table({
                      width: { size: 100, type: WidthType.PERCENTAGE },
                      rows: tableRows
                    }),

                    new Paragraph({
                      children: [new PageBreak()]
                    }),

                    new Paragraph({
                      text:
                        'The undersigned certify that the scope of work is complete.',
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
  } catch (error) {
    console.error('EXPORT ERROR:', error)
    res.status(500).json({ message: 'Gagal export laporan' })
  }
})

module.exports = router
