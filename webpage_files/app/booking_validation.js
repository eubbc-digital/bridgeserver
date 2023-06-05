/*
 Copyright (c) Universidad Privada Boliviana (UPB) - EUBBC-Digital
 MIT License - See LICENSE file in the root directory
 Boris Pedraza, Alex Villazon
*/

import TIMER from './timer.js';
import UI from './ui.js';

var credentialsData = await fetch('api/credentials');
credentialsData = await credentialsData.json();

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
  const response = await fetch('/api/bookingValidation', requestOptions);
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
    window.location.pathname = "../alert_page.html"
  }
}

validateReservation();
