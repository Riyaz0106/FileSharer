const mysql = require('mysql');

const con =  mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "admin",
    port: 3306,
    database: "FileSharer"
});

con.connect(function(err) {
    if (err) throw err;
    console.log("MYSQL server Connected!");
});

module.exports = con;