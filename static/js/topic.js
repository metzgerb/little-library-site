//add initial event handlers for form buttons
document.getElementById("formBtn").addEventListener("click", addRow);
document.getElementById("resetBtn").addEventListener("click", resetForm);

//hide error message element and reset error border
document.getElementById("errorMsg").style.display = "none";
document.getElementById("formTopic").style.borderColor = "#ddd";
document.getElementById("formTopic").style.borderWidth = "1px";


//handles add
function addRow(){
   //reset error message element
   document.getElementById("errorMsg").style.display = "none";
   document.getElementById("formTopic").style.borderColor = "#ddd";
   document.getElementById("formTopic").style.borderWidth = "1px";
   
   //check required fields
   if(document.getElementById("formTopic").value == ""){
      document.getElementById("errorMsg").textContent = "Fill in the required fields!";
      document.getElementById("errorMsg").style.display = "block";
      
      document.getElementById("formTopic").style.borderColor = "red";
      document.getElementById("formTopic").style.borderWidth = "2px"; 
      return;
   }   
   
   //create request
   var req = new XMLHttpRequest();
   var payload = {add:true};
   payload.topic = document.getElementById("formTopic").value;
   
   //check for empty description
   if(document.getElementById("formDescription").value == "") {
      payload.desc = null;
   } else {
      payload.desc = document.getElementById("formDescription").value;
   } 
   
   //reset form
   resetForm();
   
   req.open('POST', '/topic', true);
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
         for (var i = 0; i < 4; i++){
            var tCellIn = document.createElement("td");
            newRow.appendChild(tCellIn);
         }
         
         //fill cells
         var rowCells = newRow.getElementsByTagName("td");
         rowCells[0].textContent = response[0].category;
         rowCells[1].textContent = response[0].description;
         rowCells[2].innerHTML = '<a href="/book/?t=' + response[0].id + '">' + response[0].books_on_topic + '</a>';
                  
         //add edit button
         var editBtn = document.createElement("button");
         var eText = document.createTextNode("Edit");
         editBtn.appendChild(eText);
         editBtn.type = "button";
         editBtn.onclick = function() {editRow(response[0].id)};
         rowCells[3].appendChild(editBtn);
         
         //add delete button
         var deleteBtn = document.createElement("button");
         var dText = document.createTextNode("Delete");
         deleteBtn.appendChild(dText);
         deleteBtn.type = "button";
         deleteBtn.onclick = function() {deleteRow(response[0].id)};
         rowCells[3].appendChild(deleteBtn);
         
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
   req.open('POST', '/topic', true);
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
   document.getElementById("formTopic").value = rowCells[0].textContent;
   document.getElementById("formDescription").value= rowCells[1].textContent;
      
   //change form buttons from add to updateRow
   document.getElementById("formBtn").removeEventListener("click",addRow);
   document.getElementById("formBtn").addEventListener("click", updateRow);
   document.getElementById("formBtn").textContent = "Update";
   document.getElementById("resetBtn").textContent = "Cancel";
   
   //set focus to first form field
   document.getElementById("formTopic").focus();
}

//handles update
function updateRow(){
   //hide error message element
   document.getElementById("errorMsg").style.display = "none";
   document.getElementById("formTopic").style.borderColor = "#ddd";
   document.getElementById("formTopic").style.borderWidth = "1px";
   
   //check if name is blank
   if(document.getElementById("formTopic").value == ""){
      document.getElementById("errorMsg").textContent = "Fill in the required fields!";
      document.getElementById("errorMsg").style.display = "block";
      
      document.getElementById("formTopic").style.borderColor = "red";
      document.getElementById("formTopic").style.borderWidth = "2px"; 

      return;
   }
   
   //create request
   var req = new XMLHttpRequest();
   var payload = {updateRow:true};
   payload.id = document.getElementById("formId").value;
   payload.topic = document.getElementById("formTopic").value;
   
   //check for empty description
   if(document.getElementById("formDescription").value == "") {
      payload.desc = null;
   } else {
      payload.desc = document.getElementById("formDescription").value;
   }
   
   //reset form
   resetForm();
   
   //send update to DB
   req.open('POST', '/topic', true);
   req.setRequestHeader('Content-Type', 'application/json');
   req.addEventListener('load',function(){
      if(req.status >= 200 && req.status < 400){
         var response = JSON.parse(req.responseText);

         //get row to update
         var rowToUpdate = document.getElementById(response[0].id);
         
         //fill cells
         var rowCells = rowToUpdate.getElementsByTagName("td");
         rowCells[0].textContent = response[0].category;
         rowCells[1].textContent = response[0].description;
         rowCells[2].innerHTML = '<a href="/book/?t=' + response[0].id + '">' + response[0].books_on_topic + '</a>';
         
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
   document.getElementById("formTopic").value = "";
   document.getElementById("formDescription").value= "";
   
   //change button text back to normal
   document.getElementById("formBtn").textContent = "Add";
   document.getElementById("resetBtn").textContent = "Reset";
   
   //hide error message element
   document.getElementById("errorMsg").style.display = "none";
   document.getElementById("formTopic").style.borderColor = "#ddd";
   document.getElementById("formTopic").style.borderWidth = "1px";
}