//add initial event handlers for form buttons
document.getElementById("searchBtn").addEventListener("click", searchBooks);

//checkout function for each book
function checkOut(isbn){ 
   //create request
   var req = new XMLHttpRequest();
   var payload = {checkOut:true};
   payload.id = document.getElementById("formId").value;
   payload.isbn = isbn;
   
   //send update to DB
   req.open('POST', '/reader/checkout', true);
   req.setRequestHeader('Content-Type', 'application/json');
   req.addEventListener('load',function(){
      if(req.status >= 200 && req.status < 400){
         //check if error was returned
         var response = JSON.parse(req.responseText);
         if(response.hasOwnProperty('error')) {
            alert(response['error']);
            return;
         }
         //remove row from table
         var table = document.getElementById("data-table");
         
         //get row to delete
         var rowToDelete = document.getElementById(isbn);
         table.removeChild(rowToDelete);
         
      } else {
         console.log("Error in network request: " + req.statusText);
      }});
   
   //send payload to node app
   req.send(JSON.stringify(payload));
}

function searchBooks(){
   queryString = document.getElementById("formId").value;
   if(document.getElementById("formSearch").value != ""){
      queryString += '&s=' + document.getElementById("formSearch").value;
   }
   window.location.href = '/reader/checkout/?r=' + queryString;
}