const mysql = require('mysql')

let connection
const connect = () =>{
    return new Promise((resolve, reject) =>{
        connection = mysql.createConnection({
            host : 'localhost',
            user : 'root',
            password : 'rootpasswordgiven',
            database : 'crud'
        })

        connection.connect( (err, res) =>{
            if (err){
                return reject(new Error('Error in connecting to MySQL server !'))
            }
            return  resolve('Successfully connected to database server !')
        } )
    })
}

const executeQuery = (query) =>{
    return new Promise((resolve, reject) =>{
        connection.query(query, (err, result, fields) =>{
            if (err) {
                // if (err.code === "ER_DUP_ENTRY")
                return reject(err)
            }
            return resolve(result)
        })
    })

}

module.exports = {
    connect, executeQuery
}