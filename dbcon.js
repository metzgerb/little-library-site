var mysql = require('mysql');
var pool = mysql.createPool({
   connectionLimit   : 10,
   host              : 'classmysql.engr.oregonstate.edu',
   user              : 'cs340_metzgerb',
   password          : '8545',
   database          : 'cs340_metzgerb'
});

module.exports.pool = pool;