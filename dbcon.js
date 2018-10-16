var mysql = require('mysql');
var pool = mysql.createPool({
   connectionLimit   : 10,
   host              : 'classmysql.engr.oregonstate.edu',
   user              : 'cs290_metzgerb',
   password          : '8545',
   database          : 'cs290_metzgerb'
});

module.exports.pool = pool;