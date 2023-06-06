/*
 Copyright (c) Universidad Privada Boliviana (UPB) - EUBBC-Digital
 MIT License - See LICENSE file in the root directory
 Boris Pedraza, Alex Villazon
*/

import TIMER from './timer.js';
import UI from './ui.js';

try {
  var credentialsData = await fetch('api/credentials');
  if (!credentialsData.ok) {
    throw new Error('Error fetching credentials');
  }
  credentialsData = await credentialsData.json();
} catch (error) {
  var encodedMessage = encodeURIComponent("Error fetching the credentials");
  var redirectURL = "../alert_page.html?message=" + encodedMessage;
  window.location.href = redirectURL;
}

async function validateReservation(){
  const urlParams = new URLSearchParams(window.location.search);
  const bookingData = {
    bookingAccessKey: urlParams.get('access_key'),
    bookingPwd: urlParams.get('pwd')
  }
  const requestOptions = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(bookingData)
  };
  try {
    const response = await fetch('/api/bookingValidation', requestOptions);
    if (!response.ok) {
      throw new Error('Error fetching credentials');
    }
    const data = await response.json();
    if (JSON.stringify(data) !== '{}') {
      if(data.public){
        UI.accessPassword = credentialsData.viewOnlyPassword;
      } else {
        UI.accessPassword = credentialsData.password;
      }
      var end_date = new Date(data.endDate).getTime();
      TIMER.timer_function(end_date);
    } else {
      UI.accessPassword = null;
      var encodedMessage = encodeURIComponent("Invalid booking");
      var redirectURL = "../alert_page.html?message=" + encodedMessage + "&alert=1";
      window.location.href = redirectURL;
    }
  } catch (error) {
    var encodedMessage = encodeURIComponent("Error retrieving the booking data");
    var redirectURL = "../alert_page.html?message=" + encodedMessage;
    window.location.href = redirectURL;
  }
}

validateReservation();
