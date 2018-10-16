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
app.set('port', 8455);
app.use(express.static('static'));

//render GET for homepage
app.get('/',function(req,res,next){
   var context = {};
   mysql.pool.query('SELECT * FROM workouts', function(err, rows, fields){
      if(err){
         next(err);
         return;
      }
      
      context.results = rows;
     
      //perform formatting
      for (var i = 0; i< context.results.length; i++){
         //reformat dates
         if (context.results[i].date != null){
            context.results[i].date = moment(context.results[i].date).format('MM-DD-YYYY');
         }
         //add kgs to results
         if(context.results[i].lbs == null) {
            context.results[i].kgs = false;
         } else {
            context.results[i].kgs = !context.results[i].lbs;
         }
      }
      
      res.render('home', context);
   });
});

//render POST for homepage
app.post('/',function(req,res,next){
   //check if adding a new item
   if(req.body.hasOwnProperty('add')){
      //insert into database
      mysql.pool.query("INSERT INTO workouts (`name`,`reps`,`weight`,`date`,`lbs`) VALUES (?,?,?,?,?)",
         [req.body.name, req.body.reps, req.body.weight, req.body.date, req.body.lbs], function(err, result){
         if(err){
            next(err);
            return;
         }
         
         //return row to add to HTML
         mysql.pool.query('SELECT * FROM workouts WHERE id=?', [result.insertId], function(err, rows, fields){
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
      //delete from database
      mysql.pool.query("DELETE FROM workouts WHERE id=? ",
         [req.body.id], function(err, result){
         if(err){
            next(err);
            return;
         } 
         
         res.json(result);
      });
   }
});

/*app.get('/reset-table',function(req,res,next){
   var context = {};
   mysql.pool.query("DROP TABLE IF EXISTS workouts", function(err){
      var createString = "CREATE TABLE workouts("+
      "id INT PRIMARY KEY AUTO_INCREMENT,"+
      "name VARCHAR(255) NOT NULL,"+
      "reps INT,"+
      "weight INT,"+
      "date DATE,"+
      "lbs BOOLEAN)";
      mysql.pool.query(createString, function(err){
         context.results = "Table reset";
         res.render('db',context);
      });
   });
});
*/
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
