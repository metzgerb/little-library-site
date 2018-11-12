var express = require('express');

var app = express();
var handlebars = require('express-handlebars').create({defaultLayout:'main'});
var bodyParser = require('body-parser');
var request = require('request');
var mysql = require('./dbcon.js');
var moment = require('moment');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');
app.set('port', 8545);
app.use(express.static('static'));

//render GET for homepage
app.get('/',function(req,res,next){    
   res.render('home');
});

app.get('/book',function(req,res,next){
   var context = {};
   //get topics
   getTopics().then(function (rows) {
      context.topics = rows;     
      
      //get shelves
      getShelves().then(function(rows) {
         context.shelves = rows;
         
         //get shelves
         getAuthors().then(function(rows) {
            context.authors = rows;
            var conditions = [];
            var values = [];
            var author = [];
            
            //check for author criteria
            if (typeof req.query.a !== 'undefined') {
               author.push("a.id = ?");
               values.push(parseInt(req.query.a));
            }
            
            //check for search criteria
            if (typeof req.query.s !== 'undefined') {
               conditions.push('CONCAT(b.isbn, b.title, b.published_date, b.description, ba.authors, t.category, s.location) LIKE ?');
               values.push("%" + req.query.s + "%");
            }
            
            //check for shelf criteria
            if (typeof req.query.l !== 'undefined') {
               conditions.push("s.id = ?");
               values.push(parseInt(req.query.l));
            }
            
            //check for topic criteria
            if (typeof req.query.t !== 'undefined') {
               conditions.push("t.id = ?");
               values.push(parseInt(req.query.t));
            }
            
            var whereClause = {
               author: author.length ?
                  author.join(' AND ') : '1',
               where: conditions.length ?
                  conditions.join(' AND ') : '1',
               values: values
            };

            mysql.pool.query('SELECT b.isbn, b.title, b.published_date, b.description, ba.authors, t.category, s.location, b.checked_out \
                     FROM book b \
                     INNER JOIN topic t ON b.tid = t.id \
                     INNER JOIN shelf s ON b.sid = s.id \
                     INNER JOIN (SELECT tmp.bid AS bid, GROUP_CONCAT(author) AS authors \
                                 FROM (SELECT b.bid, CONCAT(a.first_name, " ", a.last_name) AS author \
                                       FROM book_author b \
                                       INNER JOIN author a ON b.aid = a.id \
                                       WHERE ' + whereClause.author + ') AS tmp \
                                 GROUP BY tmp.bid) AS ba ON b.isbn = ba.bid ' +
                     'WHERE ' + whereClause.where + ' ' +
                     'ORDER BY b.title', whereClause.values,
            function(err, rows, fields){
               if(err){
                  next(err);
                  return;
               }
      
               context.results = rows;
     
               //perform formatting
               for (var i = 0; i< context.results.length; i++){
                  //reformat dates
                  if (context.results[i].published_date != null){
                     context.results[i].published_date = moment(context.results[i].published_date).format('MM-DD-YYYY');
                  }
               }
      
               res.render('book', context);
            });
         });
      });          
   });
});

//render POST for book
app.post('/book',function(req,res,next){
   //check if adding a new item
   if(req.body.hasOwnProperty('add')){
      
      //check if book is already added
      mysql.pool.query("SELECT isbn FROM book WHERE isbn=?;", [req.body.isbn],
         function(err, result){
            if(err){
               next(err);
               return;
            }
            //check if book is found
            if (result.length > 0) {
               //book is found
               var response = {error : "ISBN has already been entered!"};
               res.json(response);
            } else {
            
               //insert into database
               mysql.pool.query("INSERT INTO `book`(isbn, title, description, published_date, checked_out, tid, sid) VALUES (?,?,?,?,NULL,?,?);",
                  [req.body.isbn, req.body.title, req.body.desc, req.body.date,req.body.topic, req.body.shelf], function(err, result){
                  if(err){
                     next(err);
                     return;
                  }
         
                  //create book-author nested arrays for inserts
                  var values = [];
                  for(var i = 0; i <(req.body.authors).length; i++){
                     values.push([req.body.isbn,req.body.authors[i]]);
                  }
         
                  //add book author relationships
                  mysql.pool.query('INSERT INTO `book_author`(bid, aid) VALUES ?;',
                     [values], function(err, result){
                     if(err){
                        next(err);
                        return;
                     }
                     //return row to add to HTML
                     mysql.pool.query('SELECT b.isbn, b.title, b.published_date, b.description, ba.authors, t.category, s.location, b.checked_out \
                              FROM book b \
                              INNER JOIN topic t ON b.tid = t.id \
                              INNER JOIN shelf s ON b.sid = s.id \
                              INNER JOIN (SELECT tmp.bid AS bid, GROUP_CONCAT(author) AS authors \
                                          FROM (SELECT b.bid, CONCAT(a.first_name, " ", a.last_name) AS author \
                                                FROM book_author b \
                                                INNER JOIN author a ON b.aid = a.id) AS tmp \
                              GROUP BY tmp.bid) AS ba ON b.isbn = ba.bid \
                              WHERE b.isbn = ? \
                              ORDER BY b.title', [req.body.isbn], 
                     function(err, rows, fields){
                        if(err){
                           next(err);
                           return;
                        }
            
                        //reformat date if not null
                        if(rows[0].published_date != null){
                           rows[0].published_date = moment(rows[0].published_date).format('MM-DD-YYYY');
                        }
            
                        res.json(rows);
                     });
                  });
               });
            }
      });
   }
  
   //check if updating item
   if(req.body.hasOwnProperty('updateRow')){
      //update database
      
      mysql.pool.query("UPDATE workouts SET name=?, reps=?, weight=?, date=?, lbs=? WHERE id=?",
         [req.body.name, req.body.reps, req.body.weight, req.body.date, req.body.lbs, req.body.id], function(err, result){
         if(err){
            next(err);
            return;
         }
         
         //return row to update in HTML
         mysql.pool.query('SELECT * FROM workouts WHERE id=?', [req.body.id], function(err, rows, fields){
            if(err){
               next(err);
               return;
            }
            
             //reformat date if not null
            if(rows[0].date != null){
               rows[0].date = moment(rows[0].date).format('MM-DD-YYYY');
            }
            
            res.json(rows);
         });
      });
     
   }
  
   //check if deleting item
   if(req.body.hasOwnProperty('deleteRow')){
      //delete book-authors from database
      mysql.pool.query("DELETE FROM `book_author` WHERE bid = ?;",
         [req.body.isbn], function(err, result){
         if(err){
            next(err);
            return;
         } 
         
         //return row to update in HTML
         mysql.pool.query('DELETE FROM `book` WHERE isbn = ?;', [req.body.isbn], function(err, rows, fields){
            if(err){
               next(err);
               return;
            }
            
            res.json(result);
         });   
      });
   }
});

//GET for reader section
app.get('/reader',function(req,res,next){
   var context = {};
   
   //check for search criteria
   if (typeof req.query.s !== 'undefined') {
      var value = '%' + req.query.s + '%';
      mysql.pool.query('SELECT r.id, r.first_name, r.last_name, r.phone, r.card_expiration, COUNT(b.isbn) AS books_checked_out \
                        FROM reader r \
                        LEFT JOIN book b ON r.id = b.checked_out \
                        WHERE CONCAT(r.id, r.first_name, " ", r.last_name, r.phone) LIKE ? \
                        GROUP BY r.id \
                        ORDER BY r.last_name, r.first_name;', [value],
      function(err, rows, fields){
         if(err){
            next(err);
            return;
         }
      
         context.results = rows;
     
         //perform formatting
         for (var i = 0; i< context.results.length; i++){
            //reformat dates
            if (context.results[i].card_expiration != null){
               context.results[i].card_expiration = moment(context.results[i].card_expiration).format('MM-DD-YYYY');
            }
         }
      
         res.render('reader', context);
      });
   } else {
      //no search criteria
      mysql.pool.query('SELECT r.id, r.first_name, r.last_name, r.phone, r.card_expiration, COUNT(b.isbn) AS books_checked_out \
                        FROM reader r \
                        LEFT JOIN book b ON r.id = b.checked_out \
                        GROUP BY r.id \
                        ORDER BY r.last_name, r.first_name;', 
      function(err, rows, fields){
         if(err){
            next(err);
            return;
         }
      
         context.results = rows;
     
         //perform formatting
         for (var i = 0; i< context.results.length; i++){
            //reformat dates
            if (context.results[i].card_expiration != null){
               context.results[i].card_expiration = moment(context.results[i].card_expiration).format('MM-DD-YYYY');
            }
         }
      
         res.render('reader', context);
      });
   }
});

//render POST for reader
app.post('/reader',function(req,res,next){
   //check if adding a new item
   if(req.body.hasOwnProperty('add')){
      //insert into database
      mysql.pool.query("INSERT INTO `reader`(first_name, last_name, phone, card_expiration) VALUES (?,?,?,?);",
         [req.body.fname, req.body.lname, req.body.phone, req.body.expdate], function(err, result){
         if(err){
            next(err);
            return;
         }
         
         //return row to add to HTML
         mysql.pool.query('SELECT r.id, r.first_name, r.last_name, r.phone, r.card_expiration, COUNT(b.isbn) AS books_checked_out \
                           FROM reader r \
                           LEFT JOIN book b ON r.id = b.checked_out \
                           WHERE id=? \
                           GROUP BY r.id \
                           ORDER BY r.last_name, r.first_name;', [result.insertId], 
         function(err, rows, fields){
            if(err){
               next(err);
               return;
            }
            
            //reformat date for html rendering
            rows[0].card_expiration = moment(rows[0].card_expiration).format('MM-DD-YYYY');
            
            res.json(rows);
         });
      });
   }
  
   //check if updating item
   if(req.body.hasOwnProperty('updateRow')){
      //update database
      
      mysql.pool.query('UPDATE `reader` \
                        SET first_name = ?, \
                           last_name = ?, \
                           phone = ?, \
                           card_expiration = ? \
                        WHERE id = ?;',
         [req.body.fname, req.body.lname, req.body.phone, req.body.expdate, req.body.id], function(err, result){
         if(err){
            next(err);
            return;
         }
         
         //return row to update in HTML
         mysql.pool.query('SELECT r.id, r.first_name, r.last_name, r.phone, r.card_expiration, COUNT(b.isbn) AS books_checked_out \
                           FROM reader r \
                           LEFT JOIN book b ON r.id = b.checked_out \
                           WHERE id=? \
                           GROUP BY r.id \
                           ORDER BY r.last_name, r.first_name;', [req.body.id], 
         function(err, rows, fields){
            if(err){
               next(err);
               return;
            }
            
            //reformat date field for html rendering
            rows[0].card_expiration = moment(rows[0].card_expiration).format('MM-DD-YYYY');
            
            res.json(rows);
         });
      });
     
   }
  
   //check if deleting item
   if(req.body.hasOwnProperty('deleteRow')){   
      //delete from database
      mysql.pool.query("DELETE FROM `reader` WHERE id=? ",
         [req.body.id], function(err, result){
         if(err){
            next(err);
            return;
         } 
         
         res.json(result);
      });
   }
});

//render GET for reader-detail (check in/out)
app.get('/reader/detail',function(req,res,next){     
   var context = {};
   context.id = req.query.r;
   mysql.pool.query('SELECT r.first_name, r.last_name \
                     FROM reader r \
                     WHERE r.id =?;', [context.id], 
      function(err, rows, fields){
         if(err){
            next(err);
            return;
         }
         context.first_name = rows[0].first_name;
         context.last_name = rows[0].last_name;
         mysql.pool.query('SELECT b.isbn, b.title, ba.authors, s.location \
                           FROM book b \
                           INNER JOIN shelf s ON b.sid = s.id \
                           INNER JOIN (SELECT tmp.bid AS bid, GROUP_CONCAT(author) AS authors \
                              FROM (SELECT b.bid, CONCAT(a.first_name, " ", a.last_name) AS author \
                                 FROM book_author b \
                                 INNER JOIN author a ON b.aid = a.id) AS tmp \
                              GROUP BY tmp.bid) AS ba ON b.isbn = ba.bid \
                        WHERE b.checked_out = ? \
                        ORDER BY b.title;', [context.id], 
         function(err, rows, fields){
            if(err){
               next(err);
               return;
            }

            context.results = rows;
            res.render('reader-detail', context);
         });
   });
});

app.post('/reader/detail',function(req,res,next){ 
   //checking in
   if(req.body.hasOwnProperty('checkIn')){   
      //update database
      mysql.pool.query("UPDATE `book` \
                        SET checked_out = NULL \
                        WHERE isbn = ?;",
         [req.body.isbn], function(err, result){
         if(err){
            next(err);
            return;
         } 
         
         res.json(result);
      });
   }
});

//render GET for reader-checkout (checkout books)
app.get('/reader/checkout',function(req,res,next){    
   var context = {};
   context.id = req.query.r;
   //check for search criteria
   if(req.query.s){
      context.searchTerm = 'Search results for "'+ req.query.s + '":';
      queryParam = '%' + req.query.s + '%';
   } else {
      context.searchTerm = 'All available books:';
   }
   
   mysql.pool.query('SELECT r.first_name, r.last_name \
                     FROM reader r \
                     WHERE r.id =?;', [context.id], 
      function(err, rows, fields){
         if(err){
            next(err);
            return;
         }
         context.first_name = rows[0].first_name;
         context.last_name = rows[0].last_name;
         //check if parameter provided
         if(req.query.s) {
            //return filtered list of books
            mysql.pool.query('SELECT b.isbn, b.title, b.published_date, b.description, ba.authors, t.category, s.location \
                              FROM book b \
                              INNER JOIN topic t ON b.tid = t.id \
                              INNER JOIN shelf s ON b.sid = s.id \
                              INNER JOIN (SELECT tmp.bid AS bid, GROUP_CONCAT(author) AS authors \
                                          FROM (SELECT b.bid, CONCAT(a.first_name, " ", a.last_name) AS author \
                                                FROM book_author b \
                                                INNER JOIN author a ON b.aid = a.id) AS tmp \
                                 GROUP BY tmp.bid) AS ba ON b.isbn = ba.bid \
                              WHERE b.checked_out IS NULL \
                              AND CONCAT(b.isbn, b.title, b.published_date, b.description, ba.authors, t.category, s.location) LIKE ? \
                              ORDER BY b.title;', [queryParam],  
            function(err, rows, fields){
               if(err){
                  next(err);
                  return;
               }

               context.results = rows;
               //perform formatting
               for (var i = 0; i< context.results.length; i++){
                  //reformat dates
                  if (context.results[i].published_date != null){
                     context.results[i].published_date = moment(context.results[i].published_date).format('MM-DD-YYYY');
                  }
               }
               res.render('reader-checkout', context);
            });   
         } else {
            //return all available books
            mysql.pool.query('SELECT b.isbn, b.title, b.published_date, b.description, ba.authors, t.category, s.location \
                              FROM book b \
                              INNER JOIN topic t ON b.tid = t.id \
                              INNER JOIN shelf s ON b.sid = s.id \
                              INNER JOIN (SELECT tmp.bid AS bid, GROUP_CONCAT(author) AS authors \
                                          FROM (SELECT b.bid, CONCAT(a.first_name, " ", a.last_name) AS author \
                                                FROM book_author b \
                                                INNER JOIN author a ON b.aid = a.id) AS tmp \
                                 GROUP BY tmp.bid) AS ba ON b.isbn = ba.bid \
                              WHERE b.checked_out IS NULL \
                              ORDER BY b.title;',  
            function(err, rows, fields){
               if(err){
                  next(err);
                  return;
               }

               context.results = rows;
               //perform formatting
               for (var i = 0; i< context.results.length; i++){
                  //reformat dates
                  if (context.results[i].published_date != null){
                     context.results[i].published_date = moment(context.results[i].published_date).format('MM-DD-YYYY');
                  }
               }
               res.render('reader-checkout', context);
            });           
         }
   });
});

app.post('/reader/checkout',function(req,res,next){ 
   //checking out
   if(req.body.hasOwnProperty('checkOut')){   
      //update database
      mysql.pool.query("UPDATE `book` \
                        SET checked_out = ? \
                        WHERE isbn = ?;",
         [req.body.id, req.body.isbn], function(err, result){
         if(err){
            next(err);
            return;
         }
         
         res.json(result);
      });
   }
});

//GET for authors section
app.get('/author',function(req,res,next){
   var context = {};
   
   //check for search criteria
   if (typeof req.query.s !== 'undefined') {
      var value = '%' + req.query.s + '%';
      mysql.pool.query('SELECT a.id, a.first_name, a.last_name, COUNT(b.bid) AS books_by_author \
                        FROM author a \
                        LEFT JOIN book_author b ON a.id = b.aid \
                        WHERE CONCAT(a.first_name, " ", a.last_name) LIKE ? \
                        GROUP BY a.id \
                        ORDER BY a.last_name, a.first_name;', [value],
      function(err, rows, fields){
         if(err){
            next(err);
            return;
         }
      
         context.results = rows;
      
         res.render('author', context);
      });
   } else {
      //no search criteria
      mysql.pool.query('SELECT a.id, a.first_name, a.last_name, COUNT(b.bid) AS books_by_author \
                        FROM author a \
                        LEFT JOIN book_author b ON a.id = b.aid \
                        GROUP BY a.id \
                        ORDER BY a.last_name, a.first_name;', 
      function(err, rows, fields){
         if(err){
            next(err);
            return;
         }
      
         context.results = rows;
      
         res.render('author', context);
      });
   }
});

//render POST for author
app.post('/author',function(req,res,next){
   //check if adding a new item
   if(req.body.hasOwnProperty('add')){
      //insert into database
      mysql.pool.query("INSERT INTO `author`(first_name, last_name) VALUES (?,?);",
         [req.body.fname, req.body.lname], function(err, result){
         if(err){
            next(err);
            return;
         }
         
         //return row to add to HTML
         mysql.pool.query('SELECT a.id, a.first_name, a.last_name, COUNT(b.bid) AS books_by_author \
                           FROM author a \
                           LEFT JOIN book_author b ON a.id = b.aid \
                           WHERE id=? \
                           GROUP BY a.id \
                           ORDER BY a.last_name, a.first_name', [result.insertId], 
         function(err, rows, fields){
            if(err){
               next(err);
               return;
            }
                       
            res.json(rows);
         });
      });
   }
  
   //check if updating item
   if(req.body.hasOwnProperty('updateRow')){
      //update database
      
      mysql.pool.query('UPDATE `author` \
                        SET first_name = ?, \
                           last_name = ? \
                        WHERE id = ?;',
         [req.body.fname, req.body.lname, req.body.id], function(err, result){
         if(err){
            next(err);
            return;
         }
         
         //return row to update in HTML
         mysql.pool.query('SELECT a.id, a.first_name, a.last_name, COUNT(b.bid) AS books_by_author \
                           FROM author a \
                           LEFT JOIN book_author b ON a.id = b.aid \
                           WHERE id=? \
                           GROUP BY a.id \
                           ORDER BY a.last_name, a.first_name', [req.body.id], 
         function(err, rows, fields){
            if(err){
               next(err);
               return;
            }
                        
            res.json(rows);
         });
      });
     
   }
  
   //check if deleting item
   if(req.body.hasOwnProperty('deleteRow')){   
      //delete from database
      mysql.pool.query("DELETE FROM `author` WHERE id=? ",
         [req.body.id], function(err, result){
         if(err){
            next(err);
            return;
         } 
         
         res.json(result);
      });
   }
});

//GET for topics section
app.get('/topic',function(req,res,next){
   var context = {};
   
   //check for search criteria
   if (typeof req.query.s !== 'undefined') {
      var value = '%' + req.query.s + '%';
      mysql.pool.query('SELECT t.id, t.category, t.description, COUNT(b.isbn) AS books_on_topic \
                        FROM topic t \
                        LEFT JOIN book b ON t.id = b.tid \
                        WHERE CONCAT(t.category, t.description) LIKE ? \
                        GROUP BY t.id \
                        ORDER BY t.category;', [value],
      function(err, rows, fields){
         if(err){
            next(err);
            return;
         }
      
         context.results = rows;
          
         res.render('topic', context);
      });
   } else {
      //no search criteria
      mysql.pool.query('SELECT t.id, t.category, t.description, COUNT(b.isbn) AS books_on_topic \
                        FROM topic t \
                        LEFT JOIN book b ON t.id = b.tid \
                        GROUP BY t.id \
                        ORDER BY t.category;', 
      function(err, rows, fields){
         if(err){
            next(err);
            return;
         }  
      
         context.results = rows;
          
         res.render('topic', context);
      });  
   }   
});

//render POST for topic
app.post('/topic',function(req,res,next){
   //check if adding a new item
   if(req.body.hasOwnProperty('add')){
      //insert into database
      mysql.pool.query("INSERT INTO `topic` (category, description) VALUES (?,?);",
         [req.body.topic, req.body.desc], function(err, result){
         if(err){
            next(err);
            return;
         }
         
         //return row to add to HTML
         mysql.pool.query('SELECT t.id, t.category, t.description, COUNT(b.isbn) AS books_on_topic \
                           FROM topic t \
                           LEFT JOIN book b ON t.id = b.tid \
                           WHERE id=? \
                           GROUP BY t.id \
                           ORDER BY t.category;', [result.insertId], 
         function(err, rows, fields){
            if(err){
               next(err);
               return;
            }
                       
            res.json(rows);
         });
      });
   }
  
   //check if updating item
   if(req.body.hasOwnProperty('updateRow')){
      //update database
      
      mysql.pool.query('UPDATE `topic` \
                        SET category = ?, \
                           description = ? \
                        WHERE id = ?;',
         [req.body.topic, req.body.desc, req.body.id], function(err, result){
         if(err){
            next(err);
            return;
         }
         
         //return row to update in HTML
         mysql.pool.query('SELECT t.id, t.category, t.description, COUNT(b.isbn) AS books_on_topic \
                           FROM topic t \
                           LEFT JOIN book b ON t.id = b.tid \
                           WHERE id=? \
                           GROUP BY t.id \
                           ORDER BY t.category;', [req.body.id], 
         function(err, rows, fields){
            if(err){
               next(err);
               return;
            }
                        
            res.json(rows);
         });
      });
     
   }
  
   //check if deleting item
   if(req.body.hasOwnProperty('deleteRow')){   
      //delete from database
      mysql.pool.query("DELETE FROM `topic` WHERE id =? ",
         [req.body.id], function(err, result){
         if(err){
            next(err);
            return;
         } 
         
         res.json(result);
      });
   }
});

//GET for shelf section
app.get('/shelf',function(req,res,next){
   var context = {};

   if (typeof req.query.s !== 'undefined') {
      var value = '%' + req.query.s + '%';
      mysql.pool.query('SELECT s.id, s.location, COUNT(b.isbn) AS books_on_shelf \
                        FROM shelf s \
                        LEFT JOIN book b ON s.id = b.sid \
                        WHERE s.location LIKE ? \
                        GROUP BY s.id \
                        ORDER BY s.location;', [value],
      function(err, rows, fields){
         if(err){
            next(err);
            return;
         }
      
         context.results = rows;
         
         res.render('shelf', context);
      });
   } else {
         
      mysql.pool.query('SELECT s.id, s.location, COUNT(b.isbn) AS books_on_shelf \
                        FROM shelf s \
                        LEFT JOIN book b ON s.id = b.sid \
                        GROUP BY s.id \
                        ORDER BY s.location;', 
      function(err, rows, fields){
         if(err){
            next(err);
            return;
         }
      
         context.results = rows;
          
         res.render('shelf', context);
      });
   }   
});

//render POST for shelf
app.post('/shelf',function(req,res,next){
   //check if adding a new item
   if(req.body.hasOwnProperty('add')){
      //insert into database
      mysql.pool.query("INSERT INTO `shelf`(location) VALUES (?);",
         [req.body.loc], function(err, result){
         if(err){
            next(err);
            return;
         }
         
         //return row to add to HTML
         mysql.pool.query('SELECT s.id, s.location, COUNT(b.isbn) AS books_on_shelf \
                           FROM shelf s \
                           LEFT JOIN book b ON s.id = b.sid \
                           WHERE id=? \
                           GROUP BY s.id \
                           ORDER BY s.location;', [result.insertId], 
         function(err, rows, fields){
            if(err){
               next(err);
               return;
            }
                       
            res.json(rows);
         });
      });
   }
  
   //check if updating item
   if(req.body.hasOwnProperty('updateRow')){
      //update database
      
      mysql.pool.query('UPDATE `shelf` \
                        SET location = ? \
                        WHERE id = ?;',
         [req.body.loc, req.body.id], function(err, result){
         if(err){
            next(err);
            return;
         }
         
         //return row to update in HTML
         mysql.pool.query('SELECT s.id, s.location, COUNT(b.isbn) AS books_on_shelf \
                           FROM shelf s \
                           LEFT JOIN book b ON s.id = b.sid \
                           WHERE id=? \
                           GROUP BY s.id \
                           ORDER BY s.location;', [req.body.id], 
         function(err, rows, fields){
            if(err){
               next(err);
               return;
            }
                        
            res.json(rows);
         });
      });
     
   }
  
   //check if deleting item
   if(req.body.hasOwnProperty('deleteRow')){   
      //delete from database
      mysql.pool.query("DELETE FROM `shelf` WHERE id =? ",
         [req.body.id], function(err, result){
         if(err){
            next(err);
            return;
         } 
         
         res.json(result);
      });
   }
});

app.use(function(req,res){
  res.status(404);
  res.render('404');
});

app.use(function(err, req, res, next){
  console.error(err.stack);
  res.type('plain/text');
  res.status(500);
  res.render('500');
});

app.listen(app.get('port'), function(){
  console.log('Express started on http://flip3.engr.oregonstate.edu:' + app.get('port') + '; press Ctrl-C to terminate.');
});

function getTopics(){
   return new Promise(function(resolve, reject) {
      mysql.pool.query('SELECT t.id, t.category \
                     FROM topic t \
                     ORDER BY t.category;',
      function(err, rows, fields){
         if(err){
            return reject(err);
         }
         resolve(rows);
      });
   });
}

function getShelves(){
   return new Promise(function(resolve, reject) {
      mysql.pool.query('SELECT s.id, s.location \
                        FROM shelf s \
                        ORDER BY s.location;',
      function(err, rows, fields){
         if(err){
            return reject(err);
         }
         resolve(rows);
      });
   });
}

function getAuthors(){
   return new Promise(function(resolve, reject) {
      mysql.pool.query('SELECT a.id, CONCAT(a.first_name, " ", a.last_name) AS name \
                        FROM author a \
                        ORDER BY a.last_name, a.first_name;',
      function(err, rows, fields){
         if(err){
            return reject(err);
         }
         resolve(rows);
      });
   });
}