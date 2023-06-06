/*
 Copyright (c) Universidad Privada Boliviana (UPB) - EUBBC-Digital
 MIT License - See LICENSE file in the root directory
 Boris Pedraza, Alex Villazon
*/

var alertTitle = document.getElementById("alert_title");
var alertMessage = document.getElementById("alert_message");
var alertMessageContainer = document.getElementById("alert_message_container");

try {
  var credentialsData = await fetch('api/credentials');
  if (!credentialsData.ok) {
    updateMessageFromURL();
    throw new Error('Error fetching credentials');
  }
  credentialsData = await credentialsData.json();
} catch (error) {
  console.error('Error:', error);
}
const bookingUrl = credentialsData.bookingUrl;

function updateMessageFromURL() {
  var urlParams = new URLSearchParams(window.location.search);
  var message = urlParams.get('message');
  var alert = urlParams.get('alert');

  if (message) {
    alertTitle.textContent = decodeURIComponent(message);
    if(alert){
      alertMessage.innerText = "Please book a session at: ";
      var link = document.createElement('a');
      link.textContent = bookingUrl;
      link.href = bookingUrl;
      document.getElementById('alert_api_url').appendChild(link);
    } else {
      alertMessageContainer.style.display = "none";
    }
  }
}
updateMessageFromURL();
