/*
 Copyright (c) Universidad Privada Boliviana (UPB) - EUBBC-Digital
 MIT License - See LICENSE file in the root directory
 Boris Pedraza, Alex Villazon
*/

import UI from './ui.js' 

const TIMER = {
  timer_function(end_date){
    var x = setInterval(function() {
      var now = new Date().getTime();

      var distance = end_date - now;

      var hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      var seconds = Math.floor((distance % (1000 * 60)) / 1000);

      document.getElementById("timer").innerHTML = `${hours}h : ${minutes}m : ${seconds}s`;

      if (distance < 0) {
        UI.accessPassword = null;
        document.getElementById("timer").innerHTML = "TIME COMPLETED";
        clearInterval(x);
        var encodedMessage = encodeURIComponent("Run out of time, access denied");
        var redirectURL = "../alert_page.html?message=" + encodedMessage + "&alert=1";
        try {
          UI.disconnect();
          window.location.href = redirectURL;
        } catch {
          window.location.href = redirectURL;
        }
      }
    }, 1000);
  }
}
export default TIMER;
