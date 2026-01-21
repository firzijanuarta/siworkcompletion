const express = require('express')
const router = express.Router()
const db = require('../config/db')

router.post('/login', (req, res) => {
const { username, password } = req.body

if (!username || !password) {
return res.status(400).json({ message: 'username dan password wajib diisi' })
}

db.query(
'SELECT * FROM users WHERE username = ?',
[username],
(err, result) => {
if (err) {
return res.status(500).json({ message: 'server error' })
}

  if (result.length === 0) {  
    return res.status(401).json({ message: 'Username Salah!' })  
  }  

  const user = result[0]  

  if (user.password !== password) {  
    return res.status(401).json({ message: 'Password Salah!' })  
  }  

  res.json({  
    message: 'login berhasil',  
    user: {  
      id: user.id,  
      username: user.username  
    }  
  })  
}  


)
})

module.exports = router