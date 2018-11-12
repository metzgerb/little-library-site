//add initial event handler for form button
document.getElementById("searchBtn").addEventListener("click", searchDB);

function searchDB() {
   //check if area is not selected
   var radioBtn = document.querySelector('input[name="area"]:checked');
   //show error if missing
   if(radioBtn === null) {
      document.getElementById("errorMsg").textContent = "Choose an area to search!";
      document.getElementById("errorMsg").style.display = "block";
      document.getElementById("areaRadio").style.borderStyle = "solid";
      document.getElementById("areaRadio").style.borderColor = "red";
      document.getElementById("areaRadio").style.borderWidth = "2px";
      return;
   }
   
   var searchTerm = encodeURI(document.getElementById("formSearch").value);
   
   window.location.href = '/' + radioBtn.value + '/?s=' + searchTerm;
}

//TODO: FIX CODE BELOW FOR ENTER SUBMITTING FORM
// Get the input field
var input = document.getElementById("formSearch");

// Execute a function when the user releases a key on the keyboard
input.addEventListener("keypress", function(event) {
   // Number 13 is the "Enter" key on the keyboard
   if (event.keyCode === 13 || event.which === 13) {
      // Cancel the default action, if needed
      event.preventDefault();
      // Trigger the button element with a click
      document.getElementById("searchBtn").click();
   }
});