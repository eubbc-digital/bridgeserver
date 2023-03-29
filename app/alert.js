var alertTitle = document.getElementById("alert_title");
var alertMessage = document.getElementById("alert_message");

var credentialsData= await fetch('../utils/credentials.json');
credentialsData= await credentialsData.json();
const bookingUrl = credentialsData.bookingUrl;

alertTitle.innerText = "Access denied to this laboratory"
alertMessage.innerText = "Please book a session at: ";
var link = document.createElement('a');
link.textContent = bookingUrl;
link.href = bookingUrl; 
document.getElementById('alert_api_url').appendChild(link);
