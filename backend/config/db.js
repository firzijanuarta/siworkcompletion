const mysql = require('mysql2')

const db = mysql.createConnection({
host: 'localhost',
user: 'root',
password: '',
database: 'work_completion'
})

db.connect((err) => {
if (err) {
console.log('koneksi database gagal:', err)
} else {
console.log('database terhubung')
}
})

module.exports = db