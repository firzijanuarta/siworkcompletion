const multer = require('multer')
const { CloudinaryStorage } = require('multer-storage-cloudinary')
const cloudinary = require('../config/cloudinary')

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'siworkcompletion',
    allowed_formats: ['jpg', 'jpeg', 'png'],
    transformation: [{ quality: 'auto' }]
  }
})

const upload = multer({ storage })

module.exports = upload
