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

          /* ================= HEADER (GAMBAR) ================= */
          const headerSection = new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.LEFT,
                children: [
                  new ImageRun({
                    data: fs.readFileSync(
                      path.join(
                        __dirname,
                        '../../frontend/assets/img/header.png'
                      )
                    ),
                    transformation: {
                      width: 340,
                      height: 77
                    }
                  })
                ]
              })
            ]
          })

          /* ================= TABEL DETAIL ================= */
          const tableRows = []

          tableRows.push(
            new TableRow({
              children: [
                new TableCell({
                  children: [new Paragraph({ text: 'No', bold: true })]
                }),
                new TableCell({
                  children: [
                    new Paragraph({ text: 'Deskripsi', bold: true })
                  ]
                }),
                new TableCell({
                  children: [
                    new Paragraph({ text: 'Dokumentasi', bold: true })
                  ]
                })
              ]
            })
          )

          for (const item of details) {
            let images = []

            if (Array.isArray(item.dokumentasi)) {
              images = item.dokumentasi
            } else if (typeof item.dokumentasi === 'string') {
              try {
                images = JSON.parse(item.dokumentasi)
              } catch {
                images = []
              }
            }

            const imageParagraphs = []
            let currentImages = []

            images.forEach((img, index) => {
              const imgPath = path.join(__dirname, '..', img)

              if (fs.existsSync(imgPath)) {
                currentImages.push(
                  new ImageRun({
                    data: fs.readFileSync(imgPath),
                    transformation: {
                      width: 180,
                      height: 330
                    }
                  })
                )
              }

              if (currentImages.length === 3 || index === images.length - 1) {
                imageParagraphs.push(
                  new Paragraph({
                    children: currentImages,
                    spacing: { after: 100 }
                  })
                )
                currentImages = []
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
                headers: {
                  default: headerSection
                },
                children: [
                  /* ===== JUDUL ===== */
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

                  /* ===== INFO ===== */
                  new Paragraph(`Customer     : PT. Pertamina Hulu Rokan`),
                  new Paragraph(`Project        : ${report.judul_laporan}`),
                  new Paragraph(`Location     : -`),
                  new Paragraph(`Working Date : ${formatTanggal(report.tanggal_kerja)}`),
                  new Paragraph(`Contract No  : -`),
                  new Paragraph(`Ticket No    : SPHR00304A`),
                  new Paragraph({ text: '', spacing: { after: 200 } }),

                  /* ===== TABEL UTAMA ===== */
                  new Table({
                    width: {
                      size: 100,
                      type: WidthType.PERCENTAGE
                    },
                    rows: tableRows
                  }),

                  /* ===== SUMMARY ===== */
                  new Paragraph({
                    text: '\nSummary Pekerjaan',
                    bold: true
                  }),
                  new Table({
                    width: {
                      size: 60,
                      type: WidthType.PERCENTAGE
                    },
                    rows: [
                      new TableRow({
                        children: [
                          new TableCell({
                            children: [new Paragraph('Total Man Power')]
                          }),
                          new TableCell({
                            children: [new Paragraph('1')]
                          })
                        ]
                      }),
                      new TableRow({
                        children: [
                          new TableCell({
                            children: [new Paragraph('Total Hours')]
                          }),
                          new TableCell({
                            children: [new Paragraph('2')]
                          })
                        ]
                      }),
                      new TableRow({
                        children: [
                          new TableCell({
                            children: [new Paragraph('Total Man Hours')]
                          }),
                          new TableCell({
                            children: [new Paragraph('3')]
                          })
                        ]
                      })
                    ]
                  }),

                  new Paragraph({
                    children: [new PageBreak()]
                  }),

                  /* ===== EXCEPTION ITEMS ===== */
                  new Paragraph({
                    text: 'Exception Items',
                    bold: true
                  }),
                  new Table({
                    width: {
                      size: 100,
                      type: WidthType.PERCENTAGE
                    },
                    rows: [
                      new TableRow({
                        children: [
                          new TableCell({
                            children: [new Paragraph('Item #')]
                          }),
                          new TableCell({
                            children: [new Paragraph('Description')]
                          }),
                          new TableCell({
                            children: [new Paragraph('Assigned To')]
                          }),
                          new TableCell({
                            children: [new Paragraph('Target Date')]
                          }),
                          new TableCell({
                            children: [new Paragraph('Actual Date')]
                          }),
                          new TableCell({
                            children: [new Paragraph('Initials')]
                          })
                        ]
                      })
                    ]
                  }),

                  /* ===== PERNYATAAN ===== */
                  new Paragraph({
                    text:
                      '\nThe undersigned certify that the scope of work and services is complete and acceptable ' +
                      'under the terms of agreement with only the exceptions noted above.',
                    spacing: { after: 300 }
                  }),

                  /* ===== APPROVAL (GAMBAR) ===== */
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new ImageRun({
                        data: fs.readFileSync(
                          path.join(
                            __dirname,
                            '../../frontend/assets/img/aprov.png'
                          )
                        ),
                        transformation: {
                          width: 500,
                          height: 300
                        }
                      })
                    ]
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
