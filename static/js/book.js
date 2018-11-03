//add initial event handlers for form buttons
document.getElementById("formBtn").addEventListener("click", addRow);
document.getElementById("resetBtn").addEventListener("click", resetForm);

//hide error message element and reset error border
errorReset();

//handles add
function addRow(){
   //hide error message element
   errorReset();
   
   //check required fields
   if(document.getElementById("formISBN").value == "" || document.getElementById("formTopic").value == "" 
   || document.getElementById("formShelf").value == "" || document.getElementById("formDate").value == ""
   || document.getElementById("formTitle").value == "" || document.getElementById("formBookAuthor").value == ""){
      document.getElementById("errorMsg").textContent = "Fill in the required fields!";
      document.getElementById("errorMsg").style.display = "block";
      
      if(document.getElementById("formISBN").value == ""){
         document.getElementById("formISBN").style.borderColor = "red";
         document.getElementById("formISBN").style.borderWidth = "2px"; 
      }
      if(document.getElementById("formTopic").value == ""){
         document.getElementById("formTopic").style.borderColor = "red";
         document.getElementById("formTopic").style.borderWidth = "2px"; 
      }
      if(document.getElementById("formShelf").value == ""){
         document.getElementById("formShelf").style.borderColor = "red";
         document.getElementById("formShelf").style.borderWidth = "2px"; 
      }
      if(document.getElementById("formDate").value == ""){
         document.getElementById("formDate").style.borderColor = "red";
         document.getElementById("formDate").style.borderWidth = "2px"; 
      }
      if(document.getElementById("formTitle").value == ""){
         document.getElementById("formTitle").style.borderColor = "red";
         document.getElementById("formTitle").style.borderWidth = "2px"; 
      }
      if(document.getElementById("formBookAuthor").value == ""){
         document.getElementById("formBookAuthor").style.borderColor = "red";
         document.getElementById("formBookAuthor").style.borderWidth = "2px"; 
      }
      
      return;
   }
   
   //create request
   var req = new XMLHttpRequest();
   var payload = {add:true};
   payload.isbn = document.getElementById("formISBN").value;
   payload.topic = document.getElementById("formTopic").value;
   payload.shelf = document.getElementById("formShelf").value;
   payload.date = document.getElementById("formDate").value;
   payload.title = document.getElementById("formTitle").value;
   payload.authors = getSelectValues(document.getElementById("formBookAuthor"));
   
   //check for empty description
   if(document.getElementById("formDescription").value == "") {
      payload.desc = null;
   } else {
      payload.desc = document.getElementById("formDescription").value;
   }
   
   //reset form
   resetForm();
   
   req.open('POST', '/book', true);
   req.setRequestHeader('Content-Type', 'application/json');
   req.addEventListener('load',function(){
      if(req.status >= 200 && req.status < 400){
         var response = JSON.parse(req.responseText);
         
         //build table 
         var table = document.getElementById("data-table");
         
         //create new row
         var tRowIn = document.createElement("tr");
         table.appendChild(tRowIn);
         
         //set id for new row
         var newRow = table.lastElementChild;
         newRow.id = response[0].isbn;
         
         //create cells in new row
         for (var i = 0; i < 9; i++){
            var tCellIn = document.createElement("td");
            newRow.appendChild(tCellIn);
         }
         
         //fill cells
         var rowCells = newRow.getElementsByTagName("td");
         rowCells[0].textContent = response[0].isbn;
         rowCells[1].textContent = response[0].title;
         rowCells[2].textContent = response[0].published_date;
         if(response[0].description == null){
            rowCells[3].textContent = "";
         } else {
            rowCells[3].textContent = response[0].description;
         }
         
         rowCells[4].textContent = response[0].authors;
         rowCells[5].textContent = response[0].category;
         rowCells[6].textContent = response[0].location;
         if(response[0].checked_out == null){
            rowCells[7].textContent = "available";
         } else {
            rowCells[7].textContent = "unavailable"
         }
                  
         //add edit button
         var editBtn = document.createElement("button");
         var eText = document.createTextNode("Edit");
         editBtn.appendChild(eText);
         editBtn.onclick = function() {editRow(response[0].isbn)};
         rowCells[8].appendChild(editBtn);
         
         //add delete button
         var deleteBtn = document.createElement("button");
         var dText = document.createTextNode("Delete");
         deleteBtn.appendChild(dText);
         deleteBtn.onclick = function() {deleteRow(response[0].isbn)};
         rowCells[8].appendChild(deleteBtn);
         
      } else {
         console.log("Error in network request: " + req.statusText);
      }});
   
   //send payload to node app
   req.send(JSON.stringify(payload));
}

//handles delete
function deleteRow(isbn){
   var req = new XMLHttpRequest();
   var payload = {deleteRow:true};
   payload.isbn = isbn;
   
   //reset form in case an edit was taking place on the record being deleted
   resetForm();
   //change form button from updateRow to addRow
   document.getElementById("formBtn").removeEventListener("click",updateRow);
   document.getElementById("formBtn").addEventListener("click", addRow);
   document.getElementById("formBtn").textContent = "Add";
   document.getElementById("resetBtn").textContent = "Reset";
   
   //call delete from database
   req.open('POST', '/book', true);
   req.setRequestHeader('Content-Type', 'application/json');
   req.addEventListener('load',function(){
      if(req.status >= 200 && req.status < 400){
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

//primes update
function editRow(id){
   //alert since code is not finished yet - remove once implemented
   alert("Edit functionality not implemented yet");
   /*//get values from row
   var rowToUpdate = document.getElementById(id);
   var rowCells = rowToUpdate.getElementsByTagName("td");
   
   document.getElementById("formId").value = id;
   document.getElementById("formName").value = rowCells[1].textContent;
   document.getElementById("formReps").value= rowCells[2].textContent;
   document.getElementById("formWeight").value= rowCells[3].textContent;
   
   //format date from MM-DD-YYYY to YYYY-MM-DD
   if(rowCells[0].textContent!= ""){
      var formattedDate = rowCells[0].textContent.split("-");
      formattedDate = formattedDate[2] + '-' + formattedDate[0] + '-' + formattedDate[1];
      document.getElementById("formDate").value= formattedDate;
   } else {
      document.getElementById("formDate").value = "";
   }
   
   if(rowCells[4].textContent == "") {
      document.getElementById("formLbs").checked = false;
      document.getElementById("formKgs").checked = false;
   } else if (rowCells[4].textContent == "lbs"){
      document.getElementById("formLbs").checked = true;
      document.getElementById("formKgs").checked = false;
   } else {
      document.getElementById("formLbs").checked = false;
      document.getElementById("formKgs").checked = true;
   }
   
   //change form buttons from add to updateRow
   document.getElementById("formBtn").removeEventListener("click",addRow);
   document.getElementById("formBtn").addEventListener("click", updateRow);
   document.getElementById("formBtn").textContent = "Update";
   document.getElementById("resetBtn").textContent = "Cancel";*/
}

//handles update
function updateRow(){
   //hide error message element
   errorReset();
   
   //check required fields
   if(document.getElementById("formISBN").value == "" || document.getElementById("formTopic").value == "" 
   || document.getElementById("formShelf").value == "" || document.getElementById("formDate").value == ""
   || document.getElementById("formTitle").value == "" || document.getElementById("formBookAuthor").value == ""){
      document.getElementById("errorMsg").textContent = "Fill in the required fields!";
      document.getElementById("errorMsg").style.display = "block";
      
      if(document.getElementById("formISBN").value == ""){
         document.getElementById("formISBN").style.borderColor = "red";
         document.getElementById("formISBN").style.borderWidth = "2px"; 
      }
      if(document.getElementById("formTopic").value == ""){
         document.getElementById("formTopic").style.borderColor = "red";
         document.getElementById("formTopic").style.borderWidth = "2px"; 
      }
      if(document.getElementById("formShelf").value == ""){
         document.getElementById("formShelf").style.borderColor = "red";
         document.getElementById("formShelf").style.borderWidth = "2px"; 
      }
      if(document.getElementById("formDate").value == ""){
         document.getElementById("formDate").style.borderColor = "red";
         document.getElementById("formDate").style.borderWidth = "2px"; 
      }
      if(document.getElementById("formTitle").value == ""){
         document.getElementById("formTitle").style.borderColor = "red";
         document.getElementById("formTitle").style.borderWidth = "2px"; 
      }
      if(document.getElementById("formBookAuthor").value == ""){
         document.getElementById("formBookAuthor").style.borderColor = "red";
         document.getElementById("formBookAuthor").style.borderWidth = "2px"; 
      }
      
      return;
   }
   
   //create request
   var req = new XMLHttpRequest();
   var payload = {updateRow:true};
   payload.id = document.getElementById("formId").value;
   payload.name = document.getElementById("formName").value;
   //check for empty reps
   if(document.getElementById("formReps").value == "") {
      payload.reps = null;
   } else {
      payload.reps = document.getElementById("formReps").value;
   }
   //check for empty weight
   if (document.getElementById("formWeight").value == ""){
      payload.weight = null;
   } else {
      payload.weight = document.getElementById("formWeight").value;
   }
   //check for empty date
   if(document.getElementById("formDate").value == ""){
      payload.date = null;
   } else {
      payload.date = document.getElementById("formDate").value;
   }
   
   //check for empty unit of weight
   if((!document.getElementById("formLbs").checked && !document.getElementById("formKgs").checked)|| document.getElementById("formWeight").value == "") {
      payload.lbs = null;
   } else {
      payload.lbs = document.getElementById("formLbs").checked;
   }
   
   //reset form
   resetForm();
   
   //send update to DB
   req.open('POST', '/', true);
   req.setRequestHeader('Content-Type', 'application/json');
   req.addEventListener('load',function(){
      if(req.status >= 200 && req.status < 400){
         var response = JSON.parse(req.responseText);

         //get row to update
         var rowToUpdate = document.getElementById(response[0].id);
         
         //fill cells
         var rowCells = rowToUpdate.getElementsByTagName("td");
         rowCells[0].textContent = response[0].date;
         rowCells[1].textContent = response[0].name;
         rowCells[2].textContent = response[0].reps;
         rowCells[3].textContent = response[0].weight;
         if(response[0].lbs == null){
            rowCells[4].textContent = "";
         } else if (response[0].lbs == true) {
            rowCells[4].textContent = "lbs";
         } else {
            rowCells[4].textContent = "kgs";
         }
         
      } else {
         console.log("Error in network request: " + req.statusText);
      }});
   
   //send payload to node app
   req.send(JSON.stringify(payload));
   
   //change form button from updateRow to addRow
   document.getElementById("formBtn").removeEventListener("click",updateRow);
   document.getElementById("formBtn").addEventListener("click", addRow);
   document.getElementById("formBtn").textContent = "Add";
   document.getElementById("resetBtn").textContent = "Reset";
}
	
function resetForm(){
   //clear out form fields
   document.getElementById("formISBN").value = "";
   document.getElementById("formTopic").value = "";
   document.getElementById("formShelf").value= "";
   document.getElementById("formDate").value= "";
   document.getElementById("formTitle").value= "";
   document.getElementById("formBookAuthor").value= "";
   document.getElementById("formDescription").value= "";
   
   //hide error message element and reset error border
   errorReset();
}

function errorReset(){
   document.getElementById("errorMsg").style.display = "none";
   document.getElementById("formISBN").style.borderColor = "#ddd";
   document.getElementById("formISBN").style.borderWidth = "1px";

   document.getElementById("formTopic").style.borderColor = "#ddd"; 
   document.getElementById("formTopic").style.borderWidth = "1px";

   document.getElementById("formShelf").style.borderColor = "#ddd";
   document.getElementById("formShelf").style.borderWidth = "1px";

   document.getElementById("formDate").style.borderColor = "#ddd";
   document.getElementById("formDate").style.borderWidth = "1px";
   
   document.getElementById("formTitle").style.borderColor = "#ddd";
   document.getElementById("formTitle").style.borderWidth = "1px";
   
   document.getElementById("formBookAuthor").style.borderColor = "#ddd";
   document.getElementById("formBookAuthor").style.borderWidth = "1px";
}

//modified helper function to get multiple select values into an array
//source: https://stackoverflow.com/questions/5866169/how-to-get-all-selected-values-of-a-multiple-select-box
function getSelectValues(select) {
   var result = [];
   var options = select && select.options;
   var opt;

   for (var i=0, iLen=options.length; i<iLen; i++) {
      opt = options[i];

      if (opt.selected) {
         result.push(opt.value);
      }
   }
   return result;
}