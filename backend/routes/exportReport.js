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

router.get('/reports/:id/export', (req, res) => {
  const reportId = req.params.id

  db.query('SELECT * FROM reports WHERE id = ?', [reportId], (err, r) => {
    if (err || !r.length) {
      return res.status(404).json({ message: 'Laporan tidak ditemukan' })
    }

    const report = r[0]

    db.query(
      'SELECT * FROM report_details WHERE report_id = ? ORDER BY nomor ASC',
      [reportId],
      async (err, details) => {
        if (err) {
          return res.status(500).json({ message: 'Detail error' })
        }

        /* ========= HEADER ========= */
        const headerPath = path.resolve(
          __dirname,
          '../../frontend/assets/img/header.png'
        )

        const header = fs.existsSync(headerPath)
          ? new Header({
              children: [
                new Paragraph({
                  children: [
                    new ImageRun({
                      data: fs.readFileSync(headerPath),
                      transformation: { width: 340, height: 77 }
                    })
                  ]
                })
              ]
            })
          : undefined

        /* ========= TABLE ========= */
        const rows = []

        rows.push(
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

          try {
            images = JSON.parse(item.dokumentasi || '[]')
          } catch {}

          const imgParagraphs = []

          images.slice(0, 3).forEach(img => {
            const imgPath = path.resolve(__dirname, '..', img)

            if (fs.existsSync(imgPath)) {
              try {
                imgParagraphs.push(
                  new Paragraph({
                    children: [
                      new ImageRun({
                        data: fs.readFileSync(imgPath),
                        transformation: { width: 180, height: 330 }
                      })
                    ]
                  })
                )
              } catch {
                // skip image, DO NOT crash
              }
            }
          })

          rows.push(
            new TableRow({
              children: [
                new TableCell({
                  children: [new Paragraph(String(item.nomor))]
                }),
                new TableCell({
                  children: [new Paragraph(item.deskripsi)]
                }),
                new TableCell({
                  children:
                    imgParagraphs.length > 0
                      ? imgParagraphs
                      : [new Paragraph('-')]
                })
              ]
            })
          )
        }

        /* ========= DOC ========= */
        const doc = new Document({
          sections: [
            {
              headers: header ? { default: header } : {},
              children: [
                new Paragraph({
                  text: 'Work Completion',
                  alignment: AlignmentType.CENTER,
                  bold: true,
                  size: 50
                }),

                new Paragraph(`Project : ${report.judul_laporan}`),
                new Paragraph(
                  `Working Date : ${formatTanggal(report.tanggal_kerja)}`
                ),

                new Table({
                  width: { size: 100, type: WidthType.PERCENTAGE },
                  rows
                }),

                new Paragraph({ children: [new PageBreak()] })
              ]
            }
          ]
        })

        const buffer = await Packer.toBuffer(doc)

        res.setHeader(
          'Content-Disposition',
          `attachment; filename=work-completion-${report.id}.docx`
        )
        res.end(buffer)
      }
    )
  })
})

module.exports = router
