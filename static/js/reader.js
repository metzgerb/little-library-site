//add initial event handlers for form buttons
document.getElementById("formBtn").addEventListener("click", addRow);
document.getElementById("resetBtn").addEventListener("click", resetForm);

//hide error message element and reset error border
errorReset();

//handles add
function addRow(){
   //reset error message element
   errorReset();
   
   //check required fields
   if(document.getElementById("formFname").value == "" || document.getElementById("formLname").value == "" || document.getElementById("formPhone").value == "" || document.getElementById("formExpdate").value == ""){
      document.getElementById("errorMsg").textContent = "Fill in the required fields!";
      document.getElementById("errorMsg").style.display = "block";
      
      if(document.getElementById("formFname").value == ""){
         document.getElementById("formFname").style.borderColor = "red";
         document.getElementById("formFname").style.borderWidth = "2px"; 
      }
      if(document.getElementById("formLname").value == ""){
         document.getElementById("formLname").style.borderColor = "red";
         document.getElementById("formLname").style.borderWidth = "2px"; 
      }
      if(document.getElementById("formPhone").value == ""){
         document.getElementById("formPhone").style.borderColor = "red";
         document.getElementById("formPhone").style.borderWidth = "2px"; 
      }
      if(document.getElementById("formExpdate").value == ""){
         document.getElementById("formExpdate").style.borderColor = "red";
         document.getElementById("formExpdate").style.borderWidth = "2px"; 
      }
      
      return;
   }   
   
   //create request
   var req = new XMLHttpRequest();
   var payload = {add:true};
   payload.fname = document.getElementById("formFname").value;
   payload.lname = document.getElementById("formLname").value;
   payload.phone = document.getElementById("formPhone").value;
   payload.expdate = document.getElementById("formExpdate").value;   
   
   //reset form
   resetForm();
   
   req.open('POST', '/reader', true);
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
         newRow.id = response[0].id;
         
         //create cells in new row
         for (var i = 0; i < 7; i++){
            var tCellIn = document.createElement("td");
            newRow.appendChild(tCellIn);
         }
         
         //fill cells
         var rowCells = newRow.getElementsByTagName("td");
         rowCells[0].textContent = response[0].id;
         rowCells[1].textContent = response[0].first_name;
         rowCells[2].textContent = response[0].last_name;
         rowCells[3].textContent = response[0].phone;
         rowCells[4].textContent = response[0].card_expiration;
         rowCells[5].innerHTML = '<a href="/reader/detail/?r=' + response[0].id + '">' + response[0].books_checked_out + '</a>';
                  
         //add edit button
         var checkoutBtn = document.createElement("button");
         var eText = document.createTextNode("Check Out Books");
         checkoutBtn.appendChild(eText);
         checkoutBtn.type = "button";
         checkoutBtn.style = "width: 150px;";
         checkoutBtn.onclick = function() {checkOut(response[0].id)};
         rowCells[6].appendChild(checkoutBtn);
         
         //add edit button
         var editBtn = document.createElement("button");
         var eText = document.createTextNode("Edit");
         editBtn.appendChild(eText);
         editBtn.type = "button";
         editBtn.onclick = function() {editRow(response[0].id)};
         rowCells[6].appendChild(editBtn);
         
         //add delete button
         var deleteBtn = document.createElement("button");
         var dText = document.createTextNode("Delete");
         deleteBtn.appendChild(dText);
         deleteBtn.type = "button";
         deleteBtn.onclick = function() {deleteRow(response[0].id)};
         rowCells[6].appendChild(deleteBtn);
         
      } else {
         console.log("Error in network request: " + req.statusText);
      }});
   
   //send payload to node app
   req.send(JSON.stringify(payload));
}

//handles delete
function deleteRow(id){
   var req = new XMLHttpRequest();
   var payload = {deleteRow:true};
   payload.id = id;
   
   //reset form in case an edit was taking place on the record being deleted
   resetForm();
   //change form button from updateRow to addRow
   document.getElementById("formBtn").removeEventListener("click",updateRow);
   document.getElementById("formBtn").addEventListener("click", addRow);
   document.getElementById("formBtn").textContent = "Add";
   document.getElementById("resetBtn").textContent = "Reset";
   
   //call delete from database
   req.open('POST', '/reader', true);
   req.setRequestHeader('Content-Type', 'application/json');
   req.addEventListener('load',function(){
      if(req.status >= 200 && req.status < 400){
         //remove row from table
         var table = document.getElementById("data-table");
         
         //get row to delete
         var rowToDelete = document.getElementById(id);
         table.removeChild(rowToDelete);
         
      } else {
         console.log("Error in network request: " + req.statusText);
      }});
      
   //send payload to node app
   req.send(JSON.stringify(payload));      
}

//primes update
function editRow(id){
   //get values from row
   var rowToUpdate = document.getElementById(id);
   var rowCells = rowToUpdate.getElementsByTagName("td");
   
   //populate form
   document.getElementById("formId").value = id;
   document.getElementById("formFname").value = rowCells[1].textContent;
   document.getElementById("formLname").value= rowCells[2].textContent;
   document.getElementById("formPhone").value= rowCells[3].textContent;
   
   //format date from MM-DD-YYYY to YYYY-MM-DD
   if(rowCells[4].textContent!= ""){
      var formattedDate = rowCells[4].textContent.split("-");
      formattedDate = formattedDate[2] + '-' + formattedDate[0] + '-' + formattedDate[1];
      document.getElementById("formExpdate").value= formattedDate;
   } else {
      document.getElementById("formExpdate").value = "";
   }
   
   //change form buttons from add to updateRow
   document.getElementById("formBtn").removeEventListener("click",addRow);
   document.getElementById("formBtn").addEventListener("click", updateRow);
   document.getElementById("formBtn").textContent = "Update";
   document.getElementById("resetBtn").textContent = "Cancel";
}

//handles update
function updateRow(){
   //hide error message element
   errorReset();
   
   //check required fields
   if(document.getElementById("formFname").value == "" || document.getElementById("formLname").value == "" || document.getElementById("formPhone").value == "" || document.getElementById("formExpdate").value == ""){
      document.getElementById("errorMsg").textContent = "Fill in the required fields!";
      document.getElementById("errorMsg").style.display = "block";
      
      if(document.getElementById("formFname").value == ""){
         document.getElementById("formFname").style.borderColor = "red";
         document.getElementById("formFname").style.borderWidth = "2px"; 
      }
      if(document.getElementById("formLname").value == ""){
         document.getElementById("formLname").style.borderColor = "red";
         document.getElementById("formLname").style.borderWidth = "2px"; 
      }
      if(document.getElementById("formPhone").value == ""){
         document.getElementById("formPhone").style.borderColor = "red";
         document.getElementById("formPhone").style.borderWidth = "2px"; 
      }
      if(document.getElementById("formExpdate").value == ""){
         document.getElementById("formExpdate").style.borderColor = "red";
         document.getElementById("formExpdate").style.borderWidth = "2px"; 
      }
      
      return;
   }
   
   //create request
   var req = new XMLHttpRequest();
   var payload = {updateRow:true};
   payload.id = document.getElementById("formId").value;
   payload.fname = document.getElementById("formFname").value;
   payload.lname = document.getElementById("formLname").value;
   payload.phone = document.getElementById("formPhone").value;
   payload.expdate = document.getElementById("formExpdate").value;
   
   //reset form
   resetForm();
   
   //send update to DB
   req.open('POST', '/reader', true);
   req.setRequestHeader('Content-Type', 'application/json');
   req.addEventListener('load',function(){
      if(req.status >= 200 && req.status < 400){
         var response = JSON.parse(req.responseText);

         //get row to update
         var rowToUpdate = document.getElementById(response[0].id);
         
         //fill cells
         var rowCells = rowToUpdate.getElementsByTagName("td");
         rowCells[0].textContent = response[0].id;
         rowCells[1].textContent = response[0].first_name;
         rowCells[2].textContent = response[0].last_name;
         rowCells[3].textContent = response[0].phone;
         rowCells[4].textContent = response[0].card_expiration;
         rowCells[5].innerHTML = '<a href="/reader/detail/?r=' + response[0].id + '">' + response[0].books_checked_out + '</a>';
         
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
   document.getElementById("formId").value = "";
   document.getElementById("formFname").value = "";
   document.getElementById("formLname").value= "";
   document.getElementById("formPhone").value = "";
   document.getElementById("formExpdate").value= "";
   
   //change button text back to normal
   document.getElementById("formBtn").textContent = "Add";
   document.getElementById("resetBtn").textContent = "Reset";
   
   //hide error message element
   errorReset();
}

function errorReset(){
   document.getElementById("errorMsg").style.display = "none";
   document.getElementById("formFname").style.borderColor = "#ddd";
   document.getElementById("formFname").style.borderWidth = "1px";

   document.getElementById("formLname").style.borderColor = "#ddd"; 
   document.getElementById("formLname").style.borderWidth = "1px";

   document.getElementById("formPhone").style.borderColor = "#ddd";
   document.getElementById("formPhone").style.borderWidth = "1px";

   document.getElementById("formExpdate").style.borderColor = "#ddd";
   document.getElementById("formExpdate").style.borderWidth = "1px";
   
}

function checkOut(id) {
   window.location.href = '/reader/checkout/?r=' + id;
}